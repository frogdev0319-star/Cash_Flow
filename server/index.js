import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import { attachSessionToOrder, authenticateUser, createOrder, createUser, getDbInfo, getOrderById, getOrderBySessionId, insertWebhookEvent, listOrders, listUsers, listWebhookEvents, markOrderRefundedById, updateOrderStatusById, upsertOrderFromWebhook } from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ENV_PATH = path.resolve(__dirname, '../.env')
dotenv.config({ path: ENV_PATH })

const app = express()
const port = 3001

const TOKENZ_API_URL = 'https://api.tokenz.one/v2'

app.use(cors())
app.use(express.json())

function getFetch() {
    const fetchFn = globalThis.fetch
    if (typeof fetchFn !== 'function') return null
    return fetchFn
}

function buildFrontendUrl(pathname, query = {}) {
    const url = new URL(`https://cash-flow-app.zeabur.app${pathname}`)
    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue
        url.searchParams.set(key, String(value))
    }
    return url.toString()
}

app.post('/login', (req, res) => {
    try {
        const { email, password } = req.body ?? {}
        if (typeof email !== 'string' || !email.trim()) return res.status(400).json({ error: 'email 必填' })
        if (typeof password !== 'string') return res.status(400).json({ error: 'password 必填' })

        const result = authenticateUser({ email: email.trim(), password })
        if (!result.ok) return res.status(401).json({ error: '帳號或密碼錯誤' })

        res.json({ ok: true })
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'login failed' })
    }
})

app.get('/users', (req, res) => {
    try {
        const limit = req.query.limit
        const users = listUsers({ limit: typeof limit === 'string' ? Number(limit) : 50 })
        res.json({ users, ...getDbInfo() })
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : '讀取 users 失敗' })
    }
})

app.post('/users', (req, res) => {
    try {
        const { email, password } = req.body ?? {}
        const user = createUser({ email, password })
        res.status(201).json({ user })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'create user failed'
        const status = message.includes('必填') ? 400 : message.includes('已存在') ? 409 : 500
        res.status(status).json({ error: message })
    }
})

// 創建 Tokenz Checkout Session
app.post('/create-checkout-session', async (req, res) => {
    try {
        const TOKENZ_TOKEN = process.env.TOKENZ_API_TOKEN
        if (!TOKENZ_TOKEN) {
            return res.status(500).json({
                error: 'TOKENZ_API_TOKEN 未設定；請先將 .env.example 複製為 .env 並填入 Tokenz API Token'
            })
        }

        const fetchFn = getFetch()
        if (!fetchFn) {
            return res.status(500).json({
                error: '目前 Node.js 版本未提供 fetch；請升級到 Node.js 18+，或用 node --experimental-fetch 啟動 server'
            })
        }

        const { amount, currency, productName, productImage, mail, phone, locale } = req.body

        const parsedAmount = Number(amount)
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ error: 'amount 必須是大於 0 的數字' })
        }
        if (typeof productName !== 'string' || !productName.trim()) {
            return res.status(400).json({ error: 'productName 必填' })
        }

        const resolvedCurrency = currency || 'TWD'
        const localOrderId = createOrder({
            amount: parsedAmount,
            currency: resolvedCurrency,
            productName,
            mail: typeof mail === 'string' && mail ? mail : undefined,
            phone: typeof phone === 'string' && phone ? phone : undefined
        })

        const acceptLanguageRaw = typeof locale === 'string' && locale ? locale : 'zh_TW'
        const acceptLanguage = acceptLanguageRaw.replace('_', '-')

        // 創建 Checkout Session
        const response = await fetchFn(`${TOKENZ_API_URL}/checkoutsession`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': acceptLanguage,
                'Authorization': `Bearer ${TOKENZ_TOKEN}`
            },
            body: JSON.stringify({
                itemDetails: [
                    {
                        product: {
                            price: {
                                amount: parsedAmount,
                                currency: resolvedCurrency
                            },
                            images: productImage ? [productImage] : [],
                            quantity: 1,
                            label: productName,
                            taxCategory: 'DIGITAL_GOODS_AND_SERVICES',

                        }
                    }
                ],
                successUrl: buildFrontendUrl('/success', { amount: parsedAmount, currency: resolvedCurrency, orderId: localOrderId }),
                cancelUrl: buildFrontendUrl('/cancel'),
                pendingUrl: buildFrontendUrl('/pending'),
                customerInfo: {
                    mail: typeof mail === 'string' && mail ? mail : 'aaa@bbb.com',
                    number: typeof phone === 'string' && phone ? phone : '0912345678'
                }
            })
        })

        const rawBody = await response.text()
        let data = null
        try {
            data = rawBody ? JSON.parse(rawBody) : null
        } catch {
            data = null
        }

        if (!response.ok) {
            return res.status(response.status).json({
                error: (data && (data.message || data.error)) || '創建結帳工作階段失敗',
                tokenzStatus: response.status,
                tokenzResponse: data || rawBody
            })
        }

        const checkoutUrlFromHeader =
            response.headers.get('location') || response.headers.get('x-redirect-url') || response.headers.get('x-checkout-url')

        const checkoutUrl =
            checkoutUrlFromHeader ??
            data?.redirectUrl ??
            data?.redirectURL ??
            data?.checkoutUrl ??
            data?.url ??
            data?.redirect?.url ??
            data?.data?.redirectUrl ??
            data?.data?.redirectURL ??
            data?.data?.checkoutUrl ??
            data?.data?.url

        const sessionId = data?.id ?? data?.sessionId ?? data?.data?.id ?? data?.data?.sessionId

        if (!checkoutUrl) {
            return res.status(502).json({
                error: 'Tokenz 回應未包含可用的 checkoutUrl（redirectUrl/url）',
                tokenzStatus: response.status,
                tokenzHeaders: {
                    contentType: response.headers.get('content-type'),
                    location: response.headers.get('location')
                },
                tokenzResponse: data || rawBody
            })
        }

        if (sessionId) {
            attachSessionToOrder({ orderId: localOrderId, tokenzSessionId: sessionId })
        }

        res.json({ checkoutUrl, sessionId, orderId: localOrderId })
    } catch (error) {
        console.error('創建結帳工作階段錯誤:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : '創建結帳工作階段失敗' })
    }
})

// Webhook 處理（用於接收 tokenz 的訂單狀態更新）
app.post('/webhook', async (req, res) => {
    try {
        const event = req.body

        insertWebhookEvent(event)
        console.log('收到 webhook 事件:', event.object || event.type)

        const order =
            event?.eventData?.data?.order ??
            event?.eventData?.data?.data?.order ??
            event?.data?.order ??
            event?.data?.data?.order ??
            null
        const tokenzOrderId = typeof order?.id === 'string' ? order.id : null
        const amountObj = order?.amount ?? null
        const orderAmount = typeof amountObj?.amount === 'number' ? amountObj.amount : null
        const orderCurrency = typeof amountObj?.currency === 'string' ? amountObj.currency : null
        const productName = order?.items?.[0]?.detail?.product?.label
        const status =
            (typeof event?.object === 'string' && event.object) ||
            (typeof event?.type === 'string' && event.type) ||
            (typeof order?.status === 'string' && order.status) ||
            'unknown'

        if (tokenzOrderId) {
            upsertOrderFromWebhook({
                tokenzOrderId,
                status,
                amount: orderAmount,
                currency: orderCurrency,
                productName: typeof productName === 'string' ? productName : null
            })
        }

        // 處理不同的事件類型
        switch (event.object || event.type) {
            case 'order.succeeded':
                console.log('訂單成功:', tokenzOrderId)
                console.log('訂單金額:', orderAmount, orderCurrency)
                break
            case 'order.failed':
                console.log('訂單失敗:', tokenzOrderId)
                break
            case 'order.pending':
                console.log('訂單待處理:', tokenzOrderId)
                break
            default:
                console.log(`未處理的事件類型: ${event.object || event.type}`)
        }

        res.json({ received: true })
    } catch (error) {
        console.error('Webhook 處理錯誤:', error)
        res.status(500).json({ error: error.message })
    }
})

app.get('/webhook-events', (req, res) => {
    try {
        const limit = req.query.limit
        const orderId = req.query.orderId
        const rows = listWebhookEvents({
            limit: typeof limit === 'string' ? Number(limit) : 50,
            orderId: typeof orderId === 'string' && orderId ? orderId : null
        })
        const events = rows.map((row) => {
            let payload = null
            try {
                payload = row.payload_json ? JSON.parse(row.payload_json) : null
            } catch {
                payload = null
            }
            const { payload_json, ...rest } = row
            return { ...rest, payload }
        })
        res.json({ events, ...getDbInfo() })
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : '讀取 webhook events 失敗' })
    }
})

app.get('/orders', (req, res) => {
    try {
        const limit = req.query.limit
        const mail = req.query.mail
        const orders = listOrders({
            limit: typeof limit === 'string' ? Number(limit) : 50,
            mail: typeof mail === 'string' && mail ? mail : null
        })
        res.json({ orders, ...getDbInfo() })
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : '讀取 orders 失敗' })
    }
})

app.get('/orders/by-session/:sessionId', (req, res) => {
    try {
        const order = getOrderBySessionId(req.params.sessionId)
        if (!order) return res.status(404).json({ error: 'order not found' })
        res.json({ order, ...getDbInfo() })
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : '讀取 order 失敗' })
    }
})

app.get('/orders/:id', (req, res) => {
    try {
        const order = getOrderById(req.params.id)
        if (!order) return res.status(404).json({ error: 'order not found' })
        res.json({ order, ...getDbInfo() })
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : '讀取 order 失敗' })
    }
})

app.post('/orders/:id/cancel', async (req, res) => {
    try {
        const TOKENZ_TOKEN = process.env.TOKENZ_API_TOKEN
        if (!TOKENZ_TOKEN) {
            return res.status(500).json({ error: 'TOKENZ_API_TOKEN 未設定' })
        }

        const fetchFn = getFetch()
        if (!fetchFn) {
            return res.status(500).json({
                error: '目前 Node.js 版本未提供 fetch；請升級到 Node.js 18+，或用 node --experimental-fetch 啟動 server'
            })
        }

        const order = getOrderById(req.params.id)
        if (!order) return res.status(404).json({ error: 'order not found' })
        if (order.status !== 'order.succeeded') {
            return res.status(400).json({ error: 'only paid orders can be canceled' })
        }
        if (!order.tokenzOrderId) {
            return res.status(400).json({ error: 'tokenz_order_id 缺失，無法向 Tokenz 申請退款' })
        }

        const { mail, reason, detail } = req.body ?? {}
        if (typeof mail !== 'string' || !mail) return res.status(400).json({ error: 'mail 必填' })
        if (order.mail !== mail) return res.status(403).json({ error: 'forbidden' })
        if (typeof reason !== 'string' || !reason.trim()) return res.status(400).json({ error: 'reason 必填' })
        if (reason !== 'customer_cancellation' && reason !== 'duplicate_payment' && reason !== 'other') {
            return res.status(400).json({ error: 'invalid reason' })
        }
        if (reason === 'other' && (typeof detail !== 'string' || !detail.trim())) {
            return res.status(400).json({ error: 'detail 必填（reason=other）' })
        }

        const refundResponse = await fetchFn('https://api.tokenz.one/v1/refunds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKENZ_TOKEN}`
            },
            body: JSON.stringify({
                orderId: order.tokenzOrderId,
                reason,
                ...(reason === 'other' ? { detail: detail.trim() } : {})
            })
        })

        const rawBody = await refundResponse.text()
        let refundData = null
        try {
            refundData = rawBody ? JSON.parse(rawBody) : null
        } catch {
            refundData = null
        }

        if (!refundResponse.ok) {
            return res.status(refundResponse.status).json({
                error: (refundData && (refundData.message || refundData.error)) || 'Tokenz 退款申請失敗',
                tokenzStatus: refundResponse.status,
                tokenzResponse: refundData || rawBody
            })
        }

        const refundId = refundData?.id ?? refundData?.refundId ?? null
        const updated = markOrderRefundedById({
            id: req.params.id,
            cancelReason: (reason === 'other' ? detail.trim() : reason),
            refundReason: reason,
            refundDetail: reason === 'other' ? detail.trim() : null,
            refundId: typeof refundId === 'string' ? refundId : null,
            refundPayloadJson: rawBody
        })

        res.json({ order: updated, refund: refundData })
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'cancel order failed' })
    }
})

// 健康檢查端點
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(port, () => {
    console.log(`🚀 支付服務運行在 http://localhost:${port}`)
    console.log(`💳 TOKENZ_API_TOKEN ${process.env.TOKENZ_API_TOKEN ? '已設定' : '未設定'}（讀取: ${ENV_PATH}）`)
    console.log(`📚 Tokenz 文件: https://docs.tokenz.one/zh-TW/v2/checkout`)
})
