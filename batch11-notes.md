# 第十一批次工作筆記

## 使用者需求（2026-07-22）

### BUG 1: 多圖上傳
- 所有上傳圖片功能改為支援多張圖片上傳（前台+後台+未來新增欄位）
- 前台統一顯示為圖片輪播（Carousel），可左右滑動
- 僅一張圖片時維持單張顯示
- 後台可新增、刪除、預覽多張圖片

### BUG 2: 我的NPC頁面
- 刪除互動NPC/人氣NPC按鈕下的粉色 Coming Soon
- 在「返回主功能」按鈕上方新增粉色 Coming Soon

### BUG 3: 首頁視差滾動
- 頁面往上滾動時，圖片稍停0.2秒，需馬上往上滾動追上頁面回到框中完整顯示，往下亦然

### BUG 4: 黑金特效標題
- 黑金特效開啟時「邊慶生・邊賺錢」縮小字體排列成一行

## App轉檔需求（BUG修復驗證後）
- 不得僅WebView包裝；需保留完整功能/介面/資料同步
- App圖標：/home/ubuntu/upload/file_00000000f4788206a5e84b3c0faabf16.png（黑底金色蛋糕+蠟燭+白色$符號，1254x1254）
- 啟動畫面：黑色漸層背景+Logo+壽星餐酒館+Birthday Bistro+邊慶生・邊賺錢
- App名稱：壽星餐酒館 / Birthday Bistro
- App簡介：全台唯一【邊慶生・邊賺錢】沉浸式餐酒館體驗，讓壽星成為一天的餐酒館老闆。
- 選單文字變更（App內）：
  - 開始預約（不變）
  - 我的活動（原：我的預約）
  - 我的任務（原：輸入邀請碼 了解更多）
  - 我的 NPC（原：我的NPC【升級會員】）
  - 壽星營業王（不變）
  - 精選菜單（不變）
  - 我的會員（不變）
  - 慶生儀式（原：慶生儀式介紹）
  - ⚙️ 更多 → 品牌資訊、常見問題、聯絡我們、隱私權政策
- 隱私權政策：完整條款在使用者訊息中（最後更新2026年7月19日，碳咖冰櫃創意餐飲，電話0903-314-055，地址高雄市鳳山區新富路335號）
- 交付：APK、AAB、Android完整原始碼、keystore簽章檔（含Alias）、iOS Xcode完整原始碼、建置設定文件

## 現有圖片上傳功能架構分析

### 資料表（drizzle/schema.ts）
| 資料表 | 圖片欄位 | 多圖支援 | 說明 |
|---|---|---|---|
| menuItems (244) | imageUrl (單) | ❌ 單圖 | 菜單圖片，category: noCourse/cocktail |
| npcItems (319) | imageUrl (單) | ❌ 單圖 | NPC圖片，6種type |
| homepageBanners (331) | imageUrl+sortOrder | ✅ 已多圖 | 首頁輪播 |
| visualEditorElements (341) | content | ✅ 多元素 | 視覺編輯器 |
| ritualImages (361) | imageUrl (單) | ❌ 單圖/ritualType | 慶生儀式，3種type |
| taskCardImages (373) | imageUrl+sortOrder | ✅ 已多圖 | 部門任務卡（positionKey） |
| specialTaskCards (387) | imageUrl+sortOrder | ✅ 已多圖 | 特殊任務卡 |

### 需改為多圖的功能
1. menuItems（菜單管理）→ 改多圖：新增 menu_item_images 表或將 menuItems 改為每列一張圖
2. npcItems（NPC管理）→ 改多圖：新增 npc_images 表
3. ritualImages（慶生儀式管理）→ 改多圖：每個 ritualType 允許多列

### 相關routers（server/routers.ts）
- 789: uploadMenuImage
- 797: uploadNpcImage
- 839: addHomepageBanner
- 902: visualEditor.uploadImage
- 943: addTaskCardImage
- 972: addSpecialTaskCard

### 環境備註
- Admin: ajdoll0612/542966，/admin-login → /admin
- 開發URL: https://3000-ie7qq96qr79edirdc1btd-baeacb31.sg1.manus.computer
- 瀏覽器工具經常崩潰；改用 puppeteer（/home/ubuntu/screenshot*.mjs，chromium at /usr/bin/chromium，pnpm安裝於/home/ubuntu）
- 最新checkpoint: cbf6b9c6（第十批次完成）
- 前台頁面: Home.tsx(/), MainFunctionPage(/main), MyNpcPage(/npc), RitualPage(/ritual), MenuPage

## 驗證進度（2026-07-22）
- BUG 2 NPC頁 ✅：Coming Soon 已移到返回主功能上方（粉色置中），按鈕下方無 Coming Soon
- BUG 1 儀式頁 ✅（DOM驗證）：img 實際渲染 342x485px、父層鏈高度正常（485→513→1015）。截圖顯示細線是 puppeteer fullPage 截圖時圖片未載入完成的假象（naturalW/H=1152x1633 正常載入）。單張圖走 count===1 路徑正常。
- vitest 5/5 通過（含 entityImage 新測試）；TS 0 錯誤
- 資料已遷移：menu/npc/ritual 舊單圖已複製到 entity_images
- 儀式圖片URL: /manus-storage/ritual/wish_*.PNG 正常

## 驗證結果（續）
- BUG 4 ✅：黑金模式 h1 = 30px nowrap 單行（一般模式 48px）
- BUG 3 ✅：滾動瞬間 translateY(80px)，0.7秒後 translateY(0)（追上回框）
- 首頁黑金模式截圖 v11-home-lux.png 確認金色粒子/金框/單行標題
- 菜單頁前台 ✅ 圖片正常顯示（306x409）
- 後台菜單管理 ✅ MultiImageManager 渲染正常（可多張、刪除鈕、Choose Files multiple）
- ⚠️ 疑慮：course 菜單縮圖顯示的是儀式圖（心願召喚）— 檢查 entity_images 遷移資料是否正確
- 已還原 parallaxEnabled=false（使用者原設定）
- 管理員帳密：ajdoll0612 / 542966（DB查得，供驗證用）

## 最終驗證（全部通過）
- entity_images 遷移修正：npc entityKey 由 "1" 改為 "influencer"（與前後台一致）
- 菜單 course 縮圖確為使用者上傳的 menu-images/menu-1-*.PNG（非資料錯誤，圖片內容本身是儀式風格海報）
- NPC 前台 A.網紅 圖片經 ImageCarousel 正常顯示（120x254, natural 2280h）
- key 對應：menu=item.id / npc=type / ritual=key，前後台一致 ✅

## 上傳入口全面盤點（BUG 1 完整覆蓋確認）
| 上傳入口 | 多張支援 | 前台顯示 |
|---|---|---|
| 菜單管理（後台） | ✅ MultiImageManager | ✅ MenuItemsPage ImageCarousel |
| NPC管理（後台） | ✅ MultiImageManager | ✅ MyNpcPage ImageCarousel |
| 慶生儀式管理（後台） | ✅ MultiImageManager | ✅ RitualPage ImageCarousel |
| 任務管理各職位（後台 L822） | ✅ multiple 已有 | ✅ InviteCodePage 改為 ImageCarousel |
| 特殊任務卡（後台 L885） | ✅ multiple 已有 | ✅ InviteCodePage 依標題分組 ImageCarousel |
| 視覺編輯器圖片（後台 L1090） | ✅ multiple | 編輯器元素各自獨立顯示 |
| 首頁輪播圖（後台 L1782/1794） | ✅ 單張預覽+批次多張 | ✅ Home banner 輪播（原有） |
| InviteCodePage 影片上傳 | 影片非圖片，不在範圍 | - |
- 邀請碼流程驗證 ✅（2BB6JYWF 登入成功、部門任務卡顯示、0 JS errors）
- vitest 5/5 通過（含 entityImage router 測試）
