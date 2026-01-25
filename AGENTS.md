# Repository Guidelines

## 專案結構與模組組織
- `src/`：Vue 3 + TypeScript 前端（Composition API + `script setup`）。
  - `src/views/`：路由頁面（`Home.vue`、`Payment.vue`、`Success.vue`、`Cancel.vue`）。
  - `src/router/index.ts`：Vue Router 路由設定。
  - `src/main.ts` / `src/App.vue`：應用程式入口與根元件。
- `server/index.js`：Express 後端，負責建立 Tokenz Checkout Session 與接收 Webhook。
- 根目錄設定：`vite.config.ts`、`tsconfig*.json`、`index.html`。

## 建置、測試與開發指令
- `npm install`：安裝相依套件。
- `npm run dev`：啟動 Vite 開發伺服器（`http://localhost:3000`）。
- `npm run build`：先型別檢查（`vue-tsc`），再建置正式版（`vite build`）。
- `npm run preview`：本機預覽正式建置成果。
- `npm run server`：啟動 Express API（`http://localhost:3001`）。

## 程式風格與命名規範
- 縮排：`.vue` / `.ts` 使用 2 個空白（比照既有檔案）。
- 優先使用 Vue 3 Composition API + `script setup`，並維持型別完整（例如 `ref<string>()`）。
- 路由集中在 `src/router/index.ts`；頁面放在 `src/views/`（檔名用 PascalCase）。
- TypeScript 啟用 `strict`；避免 `any`，並移除未使用的變數/參數。
- 專案未設定 formatter/linter；修改請保持精簡並符合周邊風格。

## 測試指引
- 目前未配置測試框架（沒有 `tests/`）。若要新增測試，請同步新增 script（例如 `npm test`），並統一命名（例如 `*.spec.ts`）。

## Commit 與 Pull Request 指引
- 目前此資料夾不是 Git repo（沒有 `.git`），因此無法從歷史推斷 commit 慣例。
- 若你初始化 Git：commit 請用簡短動詞開頭（例如 `Fix checkout redirect`），PR 請說明變更內容、如何本機驗證，UI 變更請附截圖。

## 安全性與設定提示
- 使用 `.env` 設定環境變數（由 `.env.example` 複製）。必填：`TOKENZ_API_TOKEN`。
- 不要提交任何 secret；Webhook 建議做防禦性處理（若 Tokenz 有提供簽章/驗證機制，請加上驗證）。
