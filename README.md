# Tokenz - Vue 3 金流支付系統

本專案示範使用 Vue 3 + Vite + Tokenz Checkout API 建立付款流程：前端選擇方案 → 後端建立 Checkout Session → 導轉至 Tokenz 託管頁 → 回到成功/取消/處理中頁面，並提供 Webhook 入口接收訂單狀態事件。

## 技術堆疊

- 前端：Vue 3 + TypeScript（Composition API + `script setup`）
- 建構：Vite
- 路由：Vue Router 4
- 後端：Express（`server/index.js`）
- 金流：Tokenz Checkout API
- 資料庫：SQLite（單檔 `server/tokenz.sqlite`，使用 `better-sqlite3`）

## 快速開始

### 1) 安裝依賴

```bash
npm install
```

### 2) 設定 Tokenz API Token

1. 複製 `.env.example` → `.env`
2. 在 `.env` 填入 Tokenz 控制台取得的 Token（不要 commit）

```env
TOKENZ_API_TOKEN=your_token_here
```

### 3) 啟動（兩個終端機）

前端：

```bash
npm run dev
```

後端：

```bash
npm run server
```

瀏覽：

- 前端：http://localhost:3000
- 後端：http://localhost:3001

## 頁面與導覽

- `/login`：登入頁（示範用）
- `/`：選擇方案（Home）
- `/payment`：付款確認與導轉 Tokenz
- `/order-list`：訂單紀錄（只顯示目前登入帳號的訂單）
- `/success` / `/cancel` / `/pending`：Tokenz 導回頁面

除 `/login` 外，每頁都有 header（顯示 email + 語系），並提供 aside menu：

- 選擇方案
- 訂單紀錄
- 登出

## 付款流程（Checkout）

1. 使用者在 `Home` 選擇方案（商品名/金額）
2. `Payment` 呼叫後端 `POST http://localhost:3001/create-checkout-session`
3. 後端先在 SQLite 建立本地訂單（`orders`），再用 `TOKENZ_API_TOKEN` 呼叫 Tokenz `POST https://api.tokenz.one/v2/checkoutsession`
4. 後端回傳 `{ checkoutUrl, sessionId, orderId }` 給前端
5. 前端導向 Tokenz 託管支付頁（`window.location.href = checkoutUrl`）
6. Tokenz 付款完成後導回：
   - `http://localhost:3000/success`
   - `http://localhost:3000/cancel`
   - `http://localhost:3000/pending`

成功頁的「付款金額」會以導回參數為主；若導回未帶金額，會用 `Payment` 導轉前寫入的 `sessionStorage` 當作顯示 fallback。

### 語系（Locale）

前端可選擇語系，建立 checkout session 時會把語系傳給後端，後端打 Tokenz API 時會以 `Accept-Language` 送出：

- `zh_TW` → `zh-TW`
- `en_US` → `en-US`
- `ja_JP` → `ja-JP`

## 後端 API（本機）

- `POST /login`
  - Body：`{ email: string, password: string }`
  - 預設帳號：
    - `aaa@aaa.com` / `0`
    - `bbb@bbb.com` / `1`
    - `ccc@ccc.com` / `1`
    - `ddd@ddd.com` / `1`
- `GET /users`
  - 管理用：列出 users（不回傳密碼）
  - Query：`?limit=50`
- `POST /users`
  - 管理用：新增 user（不回傳密碼）
  - Body：`{ email: string, password: string }`
- `POST /create-checkout-session`
  - Body：`{ amount: number, currency?: string, productName: string, productImage?: string, mail?: string, phone?: string, locale?: string }`
  - Response：`{ checkoutUrl: string, sessionId?: string, orderId: string }`
- `POST /webhook`
  - Tokenz Webhook 事件入口（會寫入 SQLite：`server/tokenz.sqlite`）
- `GET /webhook-events`
  - 查詢已收到的 webhook 事件（預設回傳最新 50 筆）
  - Query：`?limit=50`、`?orderId=...`
- `GET /orders`
  - 查詢本地訂單（由 `POST /create-checkout-session` 建立；webhook 會更新狀態）
  - Query：`?limit=50`、`?mail=someone@example.com`（依 email 篩選）
- `GET /orders/by-session/:sessionId`
  - 透過 Tokenz `sessionId` 查回本地訂單
- `GET /orders/:id`
  - 透過本地 `orderId` 查訂單
- `POST /orders/:id/cancel`
  - 取消/退款（會呼叫 Tokenz Refund API：`POST https://api.tokenz.one/v1/refunds`）
  - Body：`{ mail: string, reason: "customer_cancellation" | "duplicate_payment" | "other", detail?: string }`
  - 規則：`reason="other"` 時 `detail` 必填；僅允許取消 `status=order.succeeded` 的訂單
- `GET /health`
  - 健康檢查

## Webhook 是做什麼的？

Webhook 是 Tokenz 在「訂單狀態變更」時主動呼叫你後端的機制，用來可靠地更新訂單狀態（不要只依賴前端跳轉）。

正式環境建議：

- 驗證 Webhook 簽章/來源（若 Tokenz 提供驗證機制）
- 將事件或訂單狀態寫入資料庫（避免服務重啟後遺失）
- 對同一事件做冪等（避免重送造成重複發貨/重複加值）

## 常見問題（Troubleshooting）

- 出現 `TOKENZ_API_TOKEN 未設定...`
  - 確認專案根目錄存在 `.env`（不是 `.env.example`），並重啟 `npm run server`
- 出現 `目前 Node.js 版本未提供 fetch`
  - 請升級到 Node.js 18+，或用 `node --experimental-fetch server/index.js` 啟動後端
- 啟動後端時提示 SQLite 相關錯誤
  - 本專案用 `better-sqlite3`，請先執行 `npm install` 安裝相依套件（首次安裝可能需要本機編譯環境）
- 出現 `Missing required field`
  - Tokenz 端要求的欄位沒帶（請檢查後端送出的 request body）
- 出現 `Unexpected token '<' ... is not valid JSON`
  - 通常是打到回傳 HTML 的服務（後端沒啟動/打錯 port）
- Tokenz Webhook 打不到 `localhost`
  - Tokenz 無法直接呼叫你本機 `localhost:3001`，需要使用 `cloudflared` / `ngrok` 等方式把本機服務公開，再把 `https://.../webhook` 填入 Tokenz 後台
- 退款失敗（`/orders/:id/cancel`）
  - 需要 `TOKENZ_API_TOKEN`、且該訂單必須有 `tokenz_order_id`（由 webhook 回填）；若 webhook 沒有進來通常會是 `tokenz_order_id 缺失`

## 範例（cURL）

登入：

```bash
curl -s -X POST http://localhost:3001/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"aaa@aaa.com","password":"0"}'
```

建立 Checkout Session：

```bash
curl -s -X POST http://localhost:3001/create-checkout-session \
  -H 'Content-Type: application/json' \
  -d '{"amount":299,"currency":"TWD","productName":"基礎方案","mail":"aaa@aaa.com","phone":"0912345678","locale":"zh_TW"}'
```

查詢自己的訂單（依 email 篩選）：

```bash
curl -s "http://localhost:3001/orders?mail=aaa@aaa.com&limit=50"
```

## 指令

```bash
npm run dev      # 前端
npm run build    # vue-tsc + vite build
npm run preview  # 預覽 build
npm run server   # 後端
```

## 參考

- Tokenz Checkout：https://docs.tokenz.one/zh-TW/v2/checkout
- Tokenz Webhooks：https://docs.tokenz.one/zh-TW/v2/checkout/webhooks-get-started
- Vue 3：https://vuejs.org/
- Vite：https://vitejs.dev/
