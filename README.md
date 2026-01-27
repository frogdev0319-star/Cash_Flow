# Tokenz - Vue 3 金流支付系統

本專案示範使用 Vue 3 + Vite + Tokenz Checkout API 建立完整的金流支付系統，包含：使用者登入 → 選擇方案 → 付款 → 訂單管理 → 退款等完整流程。

## ✨ 功能特色

- 🔐 **使用者驗證**：登入系統（使用 scrypt 加密儲存密碼）
- 💳 **金流整合**：整合 Tokenz Checkout API，支援多種支付方式
- 🌍 **多國語系**：支援繁中、英文、日文三種語系切換
- 📊 **訂單管理**：查看訂單列表、狀態追蹤、訂單取消/退款
- 🔔 **Webhook 通知**：接收 Tokenz 即時訂單狀態更新
- 💾 **資料持久化**：使用 SQLite 儲存使用者、訂單、Webhook 事件

## 技術堆疊

- **前端**：Vue 3 + TypeScript（Composition API + `script setup`）
- **建構工具**：Vite 5
- **路由**：Vue Router 4
- **後端**：Express.js + Node.js 18+
- **金流服務**：Tokenz Checkout API (v2)
- **資料庫**：SQLite 3（`better-sqlite3`）
- **認證**：Session-based（使用 sessionStorage）
- **密碼加密**：Node.js crypto.scrypt

## 🚀 快速開始

### 1) 環境需求

- Node.js 18+ （需要支援原生 fetch API）
- npm 或 yarn

### 2) 安裝依賴

```bash
npm install
```

### 3) 設定環境變數

複製 `.env.example` 為 `.env`，並填入 Tokenz API Token：

```bash
cp .env.example .env
```

編輯 `.env`：

```env
# 到 https://tokenz.one 控制台取得 API Token
TOKENZ_API_TOKEN=your_token_here

# Server Port（可選，預設 3001）
PORT=3001
```

### 4) 啟動開發環境

**方式一：分別啟動（需開兩個終端機）**

終端機 1 - 啟動前端：
```bash
npm run dev
```

終端機 2 - 啟動後端：
```bash
npm run server
```

**方式二：建置後啟動（模擬正式環境）**

```bash
npm run build    # 建置前端
npm run server   # 啟動後端（會自動提供前端靜態檔案）
```

### 5) 瀏覽網站

- **前端**：http://localhost:3000（開發模式）
- **後端 API**：http://localhost:3001
- **正式環境**：http://localhost:3001（執行 build 後）

### 6) 預設測試帳號

| Email | 密碼 | 說明 |
|-------|------|------|
| aaa@aaa.com | 1 | 主要測試帳號 |
| bbb@bbb.com | 1 | 測試帳號 2 |
| ccc@ccc.com | 1 | 測試帳號 3 |
| ddd@ddd.com | 1 | 測試帳號 4 |

## 📱 頁面架構

### 路由說明

| 路徑 | 元件 | 說明 | 需要登入 |
|------|------|------|----------|
| `/login` | Login.vue | 使用者登入頁 | ❌ |
| `/` | Home.vue | 方案選擇頁（首頁） | ✅ |
| `/payment` | Payment.vue | 付款確認與導轉頁 | ✅ |
| `/order-list` | OrderList.vue | 訂單列表與管理 | ✅ |
| `/success` | Success.vue | 付款成功回調頁 | ✅ |
| `/cancel` | Cancel.vue | 付款取消回調頁 | ✅ |
| `/pending` | Pending.vue | 付款處理中回調頁 | ✅ |

### UI 元件

- **Header**：顯示使用者 email、語系切換按鈕
- **Aside Menu**：側邊選單（選擇方案、訂單紀錄、登出）
- **語系切換**：支援繁中 🇹🇼、英文 🇺🇸、日文 🇯🇵

## 💰 完整支付流程

### 1. 使用者登入
- 在 `/login` 輸入 email 和密碼
- 後端驗證（POST `/login`）使用 scrypt 比對密碼雜湊
- 登入成功後將 email 存入 `sessionStorage`

### 2. 選擇方案
- 在 `/` 首頁瀏覽可用方案（基礎/進階/企業版）
- 點擊「立即購買」前往付款頁

### 3. 確認付款資訊
- 在 `/payment` 檢視訂單摘要（商品名稱、金額）
- 點擊「前往支付」觸發以下流程：
  1. 前端呼叫後端 `POST /create-checkout-session`
  2. 後端在 SQLite 建立本地訂單記錄（`orders` 表）
  3. 後端呼叫 Tokenz API 建立 Checkout Session
  4. 後端回傳 `{ checkoutUrl, sessionId, orderId }`
  5. 前端將 sessionId 與訂單資訊存入 sessionStorage
  6. 前端導向 Tokenz 託管支付頁

### 4. Tokenz 託管支付
- 使用者在 Tokenz 頁面完成付款（信用卡/虛擬貨幣等）
- Tokenz 根據結果導回：
  - ✅ 成功：`/success?amount=299&currency=TWD&orderId=xxx`
  - ❌ 取消：`/cancel`
  - ⏳ 處理中：`/pending`

### 5. Webhook 狀態更新
- Tokenz 伺服器主動推送訂單狀態到 `POST /webhook`
- 後端記錄 webhook 事件（`webhook_events` 表）
- 更新本地訂單狀態（`orders.status`）
- 支援的狀態：
  - `order.created`：訂單已建立（本地建立時）
  - `order.pending`：處理中
  - `order.succeeded`：付款成功
  - `order.failed`：付款失敗
  - `order.refunded`：已退款

### 6. 訂單管理
- 在 `/order-list` 查看個人所有訂單
- 功能：
  - 📋 訂單列表（方案名稱、金額、日期、狀態）
  - 🔄 手動重新整理
  - ❌ 取消已付款訂單（觸發退款）
  
### 7. 退款流程
- 點擊「取消訂單」按鈕
- 選擇退款原因：
  - `customer_cancellation`：客戶取消
  - `duplicate_payment`：重複付款
  - `other`：其他（需填寫詳細說明）
- 後端呼叫 Tokenz Refund API（`POST /v1/refunds`）
- 訂單狀態更新為 `order.refunded`

## 🔌 後端 API 文件

### 基礎資訊

- **Base URL**：`http://localhost:3001`
- **Content-Type**：`application/json`

### 認證相關

#### POST `/login`
使用者登入

**Request Body：**
```json
{
  "email": "aaa@aaa.com",
  "password": "1"
}
```

**Response (200)：**
```json
{
  "ok": true
}
```

**Error (401)：**
```json
{
  "error": "帳號或密碼錯誤"
}
```

---

### 使用者管理

#### GET `/users`
列出所有使用者（管理用）

**Query Parameters：**
- `limit`：回傳筆數（預設 50）

**Response：**
```json
{
  "users": [
    { "email": "aaa@aaa.com", "created_at": "2026-01-27T..." }
  ],
  "dbPath": "/path/to/tokenz.sqlite",
  "timestamp": "2026-01-27T..."
}
```

#### POST `/users`
建立新使用者（管理用）

**Request Body：**
```json
{
  "email": "new@example.com",
  "password": "secret"
}
```

---

### 支付相關

#### POST `/create-checkout-session`
建立 Tokenz Checkout Session

**Request Body：**
```json
{
  "amount": 299,
  "currency": "TWD",
  "productName": "基礎方案",
  "productImage": "https://example.com/image.jpg",
  "mail": "user@example.com",
  "phone": "0912345678",
  "locale": "zh_TW"
}
```

**Response：**
```json
{
  "checkoutUrl": "https://checkout.tokenz.one/...",
  "sessionId": "cs_xxx",
  "orderId": "uuid-xxx"
}
```

---

### 訂單管理

#### GET `/orders`
查詢訂單列表

**Query Parameters：**
- `limit`：回傳筆數（預設 50）
- `mail`：依 email 篩選訂單

**Response：**
```json
{
  "orders": [
    {
      "id": "uuid",
      "amount": 299,
      "currency": "TWD",
      "product_name": "基礎方案",
      "status": "order.succeeded",
      "mail": "user@example.com",
      "created_at": "2026-01-27T...",
      "tokenz_session_id": "cs_xxx",
      "tokenz_order_id": "ord_xxx"
    }
  ]
}
```

#### GET `/orders/:id`
查詢單一訂單（依本地 orderId）

#### GET `/orders/by-session/:sessionId`
查詢訂單（依 Tokenz sessionId）

#### POST `/orders/:id/cancel`
取消訂單並申請退款

**Request Body：**
```json
{
  "mail": "user@example.com",
  "reason": "customer_cancellation",
  "detail": "不需要了"
}
```

**Reason 選項：**
- `customer_cancellation`：客戶取消
- `duplicate_payment`：重複付款
- `other`：其他（需填寫 `detail`）

**限制：**
- 只能取消 `status=order.succeeded` 的訂單
- 必須有 `tokenz_order_id`（由 webhook 回填）
- `mail` 必須與訂單一致

---

### Webhook

#### POST `/webhook`
接收 Tokenz 訂單狀態事件

**說明：**
- 此端點由 Tokenz 伺服器呼叫
- 自動記錄到 `webhook_events` 表
- 自動更新 `orders` 表的狀態
- 本機開發需要使用 tunnel（cloudflared/ngrok）

**支援的事件類型：**
- `order.pending`：訂單處理中
- `order.succeeded`：付款成功
- `order.failed`：付款失敗

#### GET `/webhook-events`
查詢收到的 webhook 事件

**Query Parameters：**
- `limit`：回傳筆數（預設 50）
- `orderId`：依 orderId 篩選

---

### 其他

#### GET `/health`
健康檢查

**Response：**
```json
{
  "status": "ok",
  "timestamp": "2026-01-27T..."
}
```

## 💾 資料庫結構

使用 SQLite 3，資料庫檔案：`server/tokenz.sqlite`

### 資料表

#### `users` - 使用者表
```sql
CREATE TABLE users (
  email TEXT PRIMARY KEY,           -- 使用者 email（登入帳號）
  password_hash TEXT NOT NULL,      -- scrypt 雜湊後的密碼
  password_salt TEXT NOT NULL,      -- 密碼鹽值
  created_at TEXT NOT NULL          -- 建立時間（ISO 8601）
);
```

#### `orders` - 訂單表
```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,              -- 本地訂單 ID（UUID）
  amount REAL NOT NULL,             -- 金額
  currency TEXT NOT NULL,           -- 幣別（TWD/USD...）
  product_name TEXT NOT NULL,       -- 商品名稱
  status TEXT NOT NULL,             -- 訂單狀態
  mail TEXT,                        -- 買家 email
  phone TEXT,                       -- 買家電話
  cancel_reason TEXT,               -- 取消原因
  canceled_at TEXT,                 -- 取消時間
  refund_reason TEXT,               -- 退款原因類別
  refund_detail TEXT,               -- 退款詳細說明
  refund_id TEXT,                   -- Tokenz 退款 ID
  refund_payload_json TEXT,         -- Tokenz 退款回應（JSON）
  refunded_at TEXT,                 -- 退款時間
  tokenz_session_id TEXT,           -- Tokenz Checkout Session ID
  tokenz_order_id TEXT,             -- Tokenz Order ID（webhook 回填）
  created_at TEXT NOT NULL,         -- 建立時間
  updated_at TEXT NOT NULL          -- 更新時間
);
```

#### `webhook_events` - Webhook 事件表
```sql
CREATE TABLE webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 自增 ID
  event_type TEXT NOT NULL,              -- 事件類型（order.succeeded...）
  order_id TEXT,                         -- 關聯的 Tokenz Order ID
  amount REAL,                           -- 金額
  currency TEXT,                         -- 幣別
  payload_json TEXT NOT NULL,            -- 完整 webhook payload（JSON）
  received_at TEXT NOT NULL              -- 接收時間
);
```

### 索引
- `orders.tokenz_session_id`（UNIQUE）
- `orders.tokenz_order_id`（UNIQUE）
- `orders.updated_at`
- `webhook_events.received_at`
- `webhook_events.order_id`

---

## 🔧 本機 Webhook 測試

Tokenz 無法直接呼叫 `localhost`，需要使用 tunnel 工具將本機服務公開到網際網路。

### 使用 Cloudflare Tunnel

**1. 安裝 cloudflared（macOS）：**
```bash
brew install cloudflared
```

**2. 啟動 tunnel：**
```bash
cloudflared tunnel --url http://localhost:3001
```

**3. 複製產生的公開網址：**
```
https://random-name.trycloudflare.com
```

**4. 設定 Tokenz Webhook：**
到 Tokenz 控制台設定 webhook URL：
```
https://random-name.trycloudflare.com/webhook
```

**注意：** 
- 此網址是臨時的，每次重啟會改變
- 正式環境請部署到固定網址的伺服器

## 🐛 常見問題與解決方案

### 環境設定

**Q: 出現 `TOKENZ_API_TOKEN 未設定` 錯誤**

A: 
1. 確認專案根目錄存在 `.env` 檔案（不是 `.env.example`）
2. 確認 `.env` 內有設定 `TOKENZ_API_TOKEN=your_token_here`
3. 重新啟動後端：`npm run server`

---

**Q: 出現 `目前 Node.js 版本未提供 fetch` 錯誤**

A: 
- 升級到 Node.js 18 或更新版本
- 或使用實驗性 flag 啟動：`node --experimental-fetch server/index.js`

---

**Q: 啟動後端時出現 SQLite 相關錯誤**

A:
1. 執行 `npm install` 確保 `better-sqlite3` 已正確安裝
2. macOS 需要 Xcode Command Line Tools：`xcode-select --install`
3. 刪除 `node_modules` 重新安裝：
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

### API 呼叫

**Q: 出現 `Unexpected token '<' ... is not valid JSON` 錯誤**

A: 通常是前端打到回傳 HTML 的服務，檢查：
- 後端是否已啟動（`npm run server`）
- 前端呼叫的 port 是否正確（3001）
- 檢查 Vite proxy 設定（`vite.config.ts`）

---

**Q: 建立 Checkout Session 失敗**

A: 可能原因：
- `TOKENZ_API_TOKEN` 無效或過期
- Tokenz API 回應錯誤（檢查後端 console）
- 必填欄位缺失（`amount`、`productName`）

---

### Webhook

**Q: Webhook 沒有收到事件**

A:
1. **本機開發**：Tokenz 無法呼叫 `localhost`，需使用 tunnel：
   ```bash
   cloudflared tunnel --url http://localhost:3001
   ```
2. **Webhook URL 設定錯誤**：到 Tokenz 控制台檢查設定
3. **後端未啟動**：確認 `npm run server` 正在執行
4. **查看 webhook 日誌**：呼叫 `GET /webhook-events` 檢查是否有收到事件

---

### 訂單與退款

**Q: 退款失敗（`/orders/:id/cancel`）**

A: 檢查項目：
- ✅ `TOKENZ_API_TOKEN` 已設定
- ✅ 訂單狀態為 `order.succeeded`（只能退款已付款訂單）
- ✅ 訂單有 `tokenz_order_id`（需等 webhook 回填）
- ✅ 提供的 `mail` 與訂單一致
- ✅ `reason` 為 `other` 時必須填寫 `detail`

---

**Q: 訂單狀態一直是 `order.created`，沒有更新**

A:
- Webhook 未正確設定或未收到事件
- 檢查 `GET /webhook-events` 是否有相關事件
- 檢查 Tokenz 控制台的 webhook 發送記錄

---

### 登入問題

**Q: 登入失敗（帳號密碼正確）**

A:
1. 檢查資料庫是否有該使用者：
   ```bash
   sqlite3 server/tokenz.sqlite "SELECT email FROM users;"
   ```
2. 密碼可能已更改，使用 Node.js 重設密碼（參考前面的密碼更新指令）

---

**Q: 登入後馬上被登出**

A:
- 檢查瀏覽器是否禁用 `sessionStorage`
- 檢查 `src/auth.ts` 的 session 管理邏輯
- 清除瀏覽器快取和 session storage

---

## 📝 開發指令

```bash
# 安裝依賴
npm install

# 啟動前端開發伺服器（http://localhost:3000）
npm run dev

# 啟動後端 API 伺服器（http://localhost:3001）
npm run server

# TypeScript 型別檢查 + 建置前端
npm run build

# 預覽建置後的前端
npm run preview
```

---

## 📦 專案結構

```
Cash_Flow/
├── src/                    # 前端原始碼
│   ├── views/             # 頁面元件
│   │   ├── Login.vue      # 登入頁
│   │   ├── Home.vue       # 方案選擇頁
│   │   ├── Payment.vue    # 付款頁
│   │   ├── OrderList.vue  # 訂單列表頁
│   │   ├── Success.vue    # 付款成功頁
│   │   ├── Cancel.vue     # 付款取消頁
│   │   └── Pending.vue    # 付款處理中頁
│   ├── router/            # 路由設定
│   │   └── index.ts       # Vue Router 配置
│   ├── App.vue            # 根元件
│   ├── main.ts            # 應用程式入口
│   ├── auth.ts            # 認證狀態管理
│   ├── i18n.ts            # 多國語系
│   └── style.css          # 全域樣式
├── server/                # 後端原始碼
│   ├── index.js           # Express API 伺服器
│   ├── db.js              # SQLite 資料庫操作
│   └── tokenz.sqlite      # SQLite 資料庫檔案
├── .env                   # 環境變數（不要提交）
├── .env.example           # 環境變數範本
├── .gitignore             # Git 忽略清單
├── vite.config.ts         # Vite 設定
├── tsconfig.json          # TypeScript 設定
├── package.json           # 專案相依套件
├── README.md              # 專案說明文件
└── AGENTS.md              # 開發規範文件
```

---

## 🌍 多國語系支援

### 支援語系

- 🇹🇼 **繁體中文（zh_TW）** - 預設
- 🇺🇸 **English (en_US)**
- 🇯🇵 **日本語 (ja_JP)**

### 語系實作

- **前端**：`src/i18n.ts` 管理翻譯字典
- **狀態管理**：使用 Vue 3 reactive API（`ref`）
- **持久化**：存入 `localStorage`（key: `tokenz_locale`）
- **API 整合**：建立 checkout session 時以 `Accept-Language` header 傳送給 Tokenz

### 切換語系

在 header 點擊語系下拉選單即可切換，會立即生效且下次訪問時保持。

---

## 🚀 部署建議

### 前端

1. **建置**：
   ```bash
   npm run build
   ```
   產生 `dist/` 目錄

2. **部署選項**：
   - Vercel / Netlify（自動從 Git 部署）
   - GitHub Pages
   - Cloudflare Pages
   - 任何靜態檔案託管服務

3. **環境變數**：
   - 前端使用 `import.meta.env.VITE_*` 開頭的環境變數
   - 在部署平台設定環境變數

### 後端

1. **部署選項**：
   - Zeabur（專案中使用）
   - Railway
   - Render
   - Fly.io
   - 任何支援 Node.js 的 PaaS

2. **環境變數**：
   必須設定：
   ```
   TOKENZ_API_TOKEN=your_production_token
   PORT=3001
   ```

3. **資料庫**：
   - SQLite 檔案會自動建立在 `server/tokenz.sqlite`
   - 考慮使用持久化儲存（volume）避免重新部署時資料遺失
   - 正式環境建議使用 PostgreSQL 或 MySQL

4. **Webhook URL**：
   部署後更新 Tokenz 控制台的 webhook URL：
   ```
   https://your-domain.com/webhook
   ```

### 安全性建議

- ✅ 使用 HTTPS（Tokenz webhook 要求）
- ✅ 不要提交 `.env` 檔案
- ✅ API Token 使用環境變數
- ✅ 實作 webhook 簽章驗證（如 Tokenz 提供）
- ✅ 限制 CORS 來源（正式環境）
- ✅ 實作 rate limiting
- ✅ 加入請求日誌記錄

---

## 📚 參考資源

### 官方文件

- **Tokenz Checkout API**：https://docs.tokenz.one/zh-TW/v2/checkout
- **Tokenz Webhooks**：https://docs.tokenz.one/zh-TW/v2/checkout/webhooks-get-started
- **Tokenz Refunds**：https://docs.tokenz.one/zh-TW/v2/refunds

### 技術文件

- **Vue 3**：https://vuejs.org/
- **Vite**：https://vitejs.dev/
- **Vue Router**：https://router.vuejs.org/
- **Express.js**：https://expressjs.com/
- **better-sqlite3**：https://github.com/WiseLibs/better-sqlite3

---

## 🤝 貢獻

歡迎提交 Issue 或 Pull Request！

### 開發規範

請參考 [`AGENTS.md`](AGENTS.md) 了解：
- 程式風格與命名規範
- Commit 規範
- 測試指引
- 安全性注意事項

---

## 📄 授權

本專案為示範性質，請依實際需求調整授權條款。

---

## 💡 TODO / 改進建議

- [ ] 加入單元測試（Vitest）
- [ ] 實作 webhook 簽章驗證
- [ ] 訂單列表加入分頁
- [ ] 支援更多幣別切換
- [ ] 加入訂單搜尋功能
- [ ] 實作 email 通知（訂單成功/退款）
- [ ] 改用 PostgreSQL（正式環境）
- [ ] 加入管理後台
- [ ] 實作 API rate limiting
- [ ] 優化 RWD 響應式設計

---

**Last Updated**: 2026-01-27
