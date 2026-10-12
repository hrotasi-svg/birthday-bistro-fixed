

## 2026-10-06 最新共用根因修復
- 背景不再套用到 root 下的通知 Toaster，避免 Desktop 上方重複背景。
- 橫向視口沿用同一份手機資料與元件，僅由共用 Presentation 以 viewport 寬度等比延伸並保留自然捲動。
- 視覺編輯器文字／圖片保存成功後，透過 BroadcastChannel 傳送已保存 payload，前台直接更新快取，避免舊查詢結果覆蓋。
- 驗證：27 個測試檔、89/89 測試、TypeScript、正式 build；手機直／橫、iPad 直／橫、Desktop 截圖與 12 個主功能選項導向均完成。
