# 第十三批次調查筆記（供施工參考）

## 專案關鍵位置
- AdminDashboard.tsx 共 2117 行。視覺編輯器 case "editor" 在 1047-1339 行
  - 現況：頁面按鈕列（home/main/menu/booking/leaderboard/npc）+ 工具列 + 空白畫布（只顯示 visual_editor_elements 表的元素），並無載入實際頁面 → 這就是「點選後無法顯示首頁跟其他頁面」的根因
  - 需求16：改為「頁面列表(10項)→點擊直接全螢幕載入該實際頁面(iframe)→上方工具列(← 返回頁面列表/選擇圖片/👁即時預覽/✕離開編輯)→元素直接點擊拖曳縮放修改、即時儲存」
  - 相關 state: editorPageId, editorSelectedId, editorFullscreen, editorDragging, editorResizing, editorTouchState, editorColorPickerOpen (在 83-96 行附近)
  - trpc.visualEditor.list/upsert/delete + uploadEditorImageMut
- 前台只有 Home.tsx 讀 visualEditor.list({pageId:"home"}) 並疊加元素；其他頁面沒讀

## 各項目位置
1. Home.tsx L164: 黑金模式 h1 是 text-3xl md:text-4xl；白色版是 text-5xl md:text-6xl → 需改黑金版同 text-5xl md:text-6xl（保持單行 whitespace-nowrap? 需求13-1只說字體一樣大，保留nowrap可能溢出，改為同大小）
2. InviteCodePage.tsx L181-230：短影音任務，L207「上傳影片」label+file input（videoAngles 5格）→ 在上傳影片前面新增「預覽」選項（有 videoUrl 時可預覽）
3. MyNpcPage.tsx L155: Coming Soon `text-sm` → 加大到與互動NPC字體一樣大。互動NPC分類按鈕字體: `font-medium` px-5 py-2 (text-base 預設16px)；L21 label="互動NPC"
4-6. MainFunctionPage.tsx FUNCTIONS 陣列 L5-14：B我的活動→下方新增【預約進度】、C我的任務→【輸入邀請碼】、I我的NPC→【升級會員】（desc 欄位存在但未顯示；render L54-56 只顯示 title）
7. MyNpcPage.tsx：人氣NPC(popular分類)下方新增「解鎖更多生日可能，打造專屬於你的沉浸式體驗。」（類似 INTERACTIVE_TITLE 模式，activeCategory === "popular"）
8. RitualPage.tsx L9: korean subtitle "黑墨潑灑・符文纏繞" → "黑墨潑灑・祝符纏繞"
9. MainFunctionPage FUNCTIONS 移除 G品牌管理；MorePage.tsx MORE_ITEMS 最下方加 { title:"品牌管理", path:"/admin-login" }
14. AdminDashboard 系統設定內「帳號密碼」選項刪除（搜 "帳號密碼" 或 systemSettings 帳密欄位 UI）
15. 城市地區分店系統：bookings 表加 city/district；新 branches 表(city,district,username,password)；報名表(BookingPage)專長下方加城市/地區輸入框；AdminLoginPage 加城市/地區欄(預設 高雄市/鳳山區/ajdoll0612/542966)；登入=城市+地區+帳號+密碼→對應分店資料分類；品牌管理內新增「版本資訊：v1.0.0」→輸入帳密→分店管理（新增分店4輸入框+變更/確認/刪除）；資料按 branch 歸屬
17. 收銀台：新 cashierEntries 表(branch? date, kind income/expense, category, amount)；品牌管理新增收銀台tab：收入(6欄藍字：日期日曆/費用方案收入/餐點收入/酒水收入/預約金收入/其他收入)、支出(10欄紅字：日期/食材/人事/回饋獎金/生日紅包/房租/水電/廣告/瓦斯/其他)、日曆(每日上收入下支出+品項明細+月收入/月支出/月淨利)
12-13. 我的SOP：新 sopImages 表(category: day/night/food/drink/birthday/surprise/handover/award/game/event, imageUrl) 或用 entityImages(entityType="sop", entityKey=category)。前台 /sop 頁：A時間流程(日間場/晚間場) B餐酒(餐點/調酒) C儀式活動(慶生儀式/驚喜典禮/交接儀式/營業王頒獎) D特殊任務(特殊遊戲/特殊事件)→顯示圖片。後台品牌管理新增「我的SOP管理」tab：同結構+選擇圖片/刪除+最下方顯示/隱藏開關(sopVisible setting)。MainFunctionPage 功能表加「我的SOP」(sopVisible 控制)
16 視覺編輯器頁面列表(10項)：首頁/、開始預約/booking、我的活動【預約進度】/my-booking、我的任務【輸入邀請碼】/invite、壽星營業王/leaderboard、精選菜單/menu、我的會員/member、我的NPC/npc、慶生儀式/ritual、更多/more

## 現有 schema 表
users, bookings, events, eventGuests, inviteCodes, tasks, videos, payments, financeRecords, systemSettings, menuItems, taskPositions, shortVideos, bookingRevenue, monthlyKingEntries, npcItems, homepageBanners, visualEditorElements, ritualImages, taskCardImages, specialTaskCards, entityImages

## 其他
- 管理登入: AdminLoginPage.tsx，帳密存 systemSettings (adminUsername=ajdoll0612, adminPassword=542966)
- MainFunctionPage FUNCTIONS: A開始預約/booking B我的活動/my-booking C我的任務/invite D壽星營業王/leaderboard E精選菜單/menu G品牌管理/admin-login H我的會員/member I我的NPC/npc J慶生儀式/ritual K更多/more
- 正式站: https://bistrofix-zqj3rdaj.manus.space
- 交付檔已還原於 /home/ubuntu/upload/.recovery/（APK/AAB/keystore等，18項完成後需重建）
- App 專案先前參數：appId com.birthdaybistro.app，keystore alias/密碼見 KEYSTORE-INFO.md（.recovery）
- 視覺編輯器新架構決定：以 iframe 載入實際頁面 + overlay 編輯層（工具列固定上方），編輯元素仍存 visual_editor_elements；各前台頁面須加讀取各自 pageId 的 editor elements overlay（首頁已有，其他頁面需加共用元件 EditorOverlay）

## 施工進度（即時更新）
- [x] Phase1 完成：schema 新增 branches/cashierEntries + bookings.city/district，migration 0008 已套用，預設分店(高雄市/鳳山區/ajdoll0612/542966)已 seed；db.ts helpers（getBranches/addBranch/updateBranch/deleteBranch/verifyBranchLogin/getCashierEntriesByMonth/addCashierEntries/deleteCashierEntry 等）；routers.ts 新增 branch.*/cashier.* procedures；booking.create 加 city/district
- [x] Phase2 完成（已截圖驗證）：項目1 Home 黑金 h1 改 text-5xl md:text-6xl；項目2 InviteCodePage 預覽按鈕+影片預覽彈窗；項目3 Coming Soon text-lg font-semibold；項目4-6 MainFunctionPage desc 副標題；項目7 POPULAR_TITLE；項目8 祝符纏繞；項目9 品牌管理移至 MorePage 最下方；項目12 SopPage.tsx（SOP_CATEGORIES: time[day,night], food[meal,cocktail], ritual[birthday,surprise,handover,award], special[game,event]）+ App.tsx /sop 路由 + MainFunctionPage 我的SOP入口；項目15 BookingPage 城市/地區欄位；AdminLoginPage 城市/地區欄位+branch.verifyLogin 四項驗證（成功存 sessionStorage adminBranchId/City/District）
- [x] Phase3 完成（瀏覽器實測登入成功）：AdminDashboard 加 sop/branches/cashier 三個 case；tabs 列加「我的SOP管理」「收銀台」（分店管理不在tab列，僅由 系統設定→版本資訊v1.0.0→輸入帳密→setActiveTab("branches") 進入，內有返回系統設定鍵）；系統設定刪除A帳號密碼區塊；sopVisible 已加入 systemRouter update input；收銀台UI實測正常（日期/收入5欄藍字/支出9欄紅字/月曆/月統計）
  - 收銀台類別 key：income: plan/food/drink/deposit/other_income；expense: ingredient/staff/reward/redpacket/rent/utility/ad/gas/other_expense
  - 登入實測：高雄市/鳳山區/ajdoll0612/542966 → branch.verifyLogin 成功進入 /admin
- [x] Phase4 完成（瀏覽器實測）：視覺編輯器重構為 10 頁面列表→點擊直接全螢幕 iframe 載入實際頁面＋覆蓋編輯層；工具列（← 返回頁面列表/+文字/選擇圖片/編輯文字/字型/色彩/刪除/👁即時預覽/✕離開編輯）；元素拖曳縮放雙擊即時儲存；舊 canvas 版已刪除；editorPreview state 新增；實測首頁載入成功、既有元素正常顯示
- [x] Phase5：TypeScript 0 錯誤；vitest 全通過（auth.logout / system.settings / entityImage / branch.cashier 共9測試）；即將 checkpoint 發布

## PRD 差距修正（system reminder 提出的三項，2026-07-23）
- [x] 收銀台改為 PRD 規格：頂部「收入/支出/日曆」3 個切換選項（cashierView state）；收入=日期日曆+5輸入框共6項藍字；支出=日期日曆+9輸入框共10項紅字（標籤含「支出」字樣：食材支出/人事支出/回饋獎金支出/生日紅包支出/房租支出/水電支出/廣告支出/瓦斯支出/其他支出）；日曆明細顯示品項名｜收入(藍)/支出(紅)＋收入/支出/合計小計；月統計改「每月收入/每月支出/每月淨利」
- [x] 視覺編輯器工具列瘦身為 PRD 4 鍵（← 返回頁面列表/選擇圖片/👁即時預覽/✕離開編輯）；文字編輯（修改文字/字型/色彩/刪除）移至選取元素時的浮動面板（畫布上方中央）；「+文字」改為右下角浮動圓鈕（PRD 允許直接編輯新增刪除，僅限制上方工具列內容）
- [x] 分店資料歸屬：admin.listBookings 接受 city/district 過濾；預設分店(高雄市/鳳山區)顯示無標記舊資料＋符合資料；其他分店只顯示符合資料；AdminDashboard 由 sessionStorage adminCity/adminDistrict 傳入
- [x] 瀏覽器實測完成（2026-07-23）：收銀台 收入(日期+5欄=6項藍字)/支出(日期+9欄=10項紅字)/日曆(每月收入/每月支出/每月淨利) 三選項切換正常；視覺編輯器全螢幕工具列僅 4 鍵（← 返回頁面列表/選擇圖片/👁即時預覽/✕離開編輯），+文字為右下浮動鈕；tsc 0 錯誤、vitest 9/9 通過。可 checkpoint

## Phase6 App 重建進度（2026-07-23 22:2x）
- 網站 checkpoint b8f1d77e 已發布（正式站 bistrofix-zqj3rdaj.manus.space 自動更新，App 為 server.url wrapper 直接載入正式站 → 網站修改自動反映於 App）
- App 專案 /home/ubuntu/birthday-bistro-app：android/ios 已從 deliverables tar 還原；capacitor.config.ts=server.url wrapper（splash 2500ms 已設定）；keystore 已複製到 /home/ubuntu/birthday-bistro.keystore（storePass=keyPass=BirthdayBistro2026!, alias=birthdaybistro）
- [x] Android SDK 安裝完成（~/android-sdk: platform-tools/android-35/build-tools 35.0.0; JDK21 已存在）
- [x] make-app-assets-v13.py 完成：logo 亮度門檻裁邊(bbox 369,100→1658,1771)；icon-only 主體92%、icon-foreground 76%（=放大15-20%）；splash 2732 黑漸層+透明版logo+壽星餐酒館/Birthday Bistro/邊慶生・邊賺錢；icon 預覽已目視 OK
- [x] pnpm install（sharp 以 --config.dangerously-allow-all-builds 修復）、assets generate（android 74 圖/ios 7 圖）、cap sync（.ts config 解析在 node22 有 bug → 改用 capacitor.config.json，內容含 server.url wrapper + splash 2500ms）
- [x] JDK 修復（apt update 後裝 openjdk-21-jdk-headless 取得 javac）→ gradle daemon --stop 清 toolchain 快取 → BUILD SUCCESSFUL：APK 5.96MB / AAB 5.75MB
- [x] apksigner 驗證通過（SHA-256 e235aa15...f0ac 與 KEYSTORE-INFO.md 一致）；aapt: com.birthdaybistro.app versionCode=1 targetSdk=36
- [x] 11 個交付檔已重建於 /home/ubuntu/final-delivery/（PRD 檔名）：android-project.gz(4.6MB)/ios-project.gz(3.8MB)/website-source.gz(314KB,含全部第13批次程式碼)/database-backup.sql(25表含branches+cashier_entries)/APK 5.96MB/AAB 5.75MB/keystore/4份文件（交付說明已更新第13批次內容）
- [x] 正式站冒煙測試：/ /sop /main 均 200；branch.list API 回傳預設分店（高雄市/鳳山區）正常

# 第十四批次 PRD 重點（2026-07-25）
- 嚴禁修改指定項目以外的內容
- 14-5 視覺編輯器 BUG：iframe 載入實際頁面後，頁面內既有元素（首頁文字如 碳咖冰櫃/創意餐飲/邊慶生・邊賺錢/一起玩・一起瘋・一起賺錢）無法點選編輯——目前實作只有 overlay 自訂元素可編輯，iframe 內原生 DOM 元素不可點。需求：點選即可修改文字/放大/縮小/刪除，即時儲存
- 14-6 多分店：branches 表每組 city+district+username+password → 獨立資料分類（目前 新分店仍讀高雄鳳山資料）。需要所有資料表（bookings/menu/videos/npc/carousel/rituals/sop images/settings/cashier...）依 branchId 或 city+district 隔離。前台需可切換分店（依報名/登入的城市地區）。後台登入哪個分店就只看該分店資料。預設分店=高雄市/鳳山區/ajdoll0612/542966
- 14-7 總部儀表板（在版本資訊v1.0.0→分店管理 內新增）：總覽=全台預約總數/今日預約總數/總營收/各店排名；分店=列出所有分店（例：高雄市鳳山區壽星餐酒館、屏東墾丁壽星餐酒館），每店顯示 壽星預約人數（點→該分店壽星預約資訊）與 收銀台淨利（點→該分店收銀台）

## 批次14 PRD 原文要點（items 6-9，來自使用者訊息）
- 14-6 原文：「系統設定內的版本資訊，每新增一組【城市＋地區＋帳號＋密碼】，系統必須自動建立一個全新的【壽星餐酒館資料分類】。此規則適用於所有現在與未來新增的分店，不限任何城市或地區。每一組不同的【城市＋地區＋帳號＋密碼】都必須建立一個新的壽星餐酒館資料分...」→ 分店資料完全隔離：預約/活動/任務/營業王/菜單/會員/NPC/SOP/更多/收銀台 依 branch 歸屬。實作策略：核心交易資料（bookings 已有 city/district、cashier_entries 已有 branchId）依分店過濾；內容類資料（菜單/影片/NPC/輪播/儀式/SOP圖）加 branchId 欄位（NULL=預設店高雄鳳山），新分店自動建立空分類。後台登入哪個分店只看該分店資料（sessionStorage 存 branch）。
- 14-8 收銀台：收入與支出所有標籤文字移至輸入框上方（格式：標籤：換行 輸入框）。PRD列出收入5項（時段收入/酒水收入/贊助收入/抖內收入/其他收入）+支出9項（食材/人事/回饋獎金/生日紅包/房租/水電/廣告/瓦斯/其他支出）。注意現有UI收入6欄（含日曆日期藍欄）支出10欄——以PRD文字為準只調整標籤位置、不刪欄位。
- 14-9 版本資訊v1.0.0點選後，刪除「請輸入帳號密碼以進入分店管理」文字。

## 批次14 進度（items 6-7 實作中）
- 已完成後端：branch.hqSummary（總覽=全台預約總數/今日預約總數/總營收＋各店排名 perBranch{bookingCount,revenue,netProfit}）；cashier.listByMonth 接受 branchId（預設店 id=1 涵蓋 NULL 舊資料）；db.ts 新增 getAllBookingsRaw/getCashierNetByBranch、getCashierEntriesByMonth 支援 branchId 過濾。
- 已完成前端：AdminDashboard branchScope 修正 sessionStorage key（adminBranchCity/adminBranchDistrict，原本錯用 adminCity）、新增 loginBranchId state（預設1）、收銀台查詢＋登錄自動帶 branchId；AdminLoginPage 舊帳密 fallback 補存 adminBranchId=1。
- 待做：14-7 總部儀表板 UI（分店管理 branches tab 內新增「總部儀表板」區塊：總覽4卡＋各分店卡片，預約人數點擊→切到 bookings tab、淨利點擊→切到 cashier tab）；14-6 前台內容過濾說明（bookings 已依 city/district 過濾）；14-8 收銀台標籤移至輸入框上方（現況 label 與 input 同行？需檢查）；14-9 刪文字。

### 批次15 phase-3 進行中（分店權限顯示/隱藏）
- ✅ AdminDashboard 已加：isHqBranch(loginBranchId===1)、hqSettings=trpc.system.settings.get({branchId:1})、BRANCH_DEFAULT_TABS（分店預設可見7項：bookings,menu,settings,tasks,members,center,videos；隱藏6項：editor,npc,banners,rituals,sop,cashier）、branchFeatureVisibility(JSON parse hqSettings.branchFeatureVisibility)、isTabVisibleForBranch()；tabs 列表已 .filter(isTabVisibleForBranch)
- ✅ systemRouter.ts 已加 keys：sopVisible/branchFeatureVisibility(string JSON)/rainEffect(bool,default true)/bookFlipEffect(bool,default true) — get/update 皆支援
- 待做 phase-3 剩餘：
  1. settings tab（case "settings" 行663）：分店(非總店)只顯示 G.每月營業王(行728-757)與 H.本月營業王(行759-768) 2 區塊 — 其餘區塊包 isHqBranch && 條件
  2. 版本資訊v1.0.0驗證後「分店管理」區塊（行797附近 verify 後 branches tab）：總店加「分店功能顯示/隱藏」開關組（6+7個 tab checkbox，存 updateSettingsMut({branchId:1, branchFeatureVisibility: JSON.stringify({...})})），儲存後 refetchHqSettings
  3. activeTab 保護：分店登入時若 activeTab 不可見 → 首次 render 設回 "bookings"
- 待做 phase-4：editor 頁面清單加「主功能」/main（行1101 附近 pages 陣列 { id:"main", label:"主功能", path:"/main" }）；hqSummary 檢查真實金額
- 待做 phase-5：Home 玻璃雨滴特效+輪播 fade 轉場（rainEffect 開關，開關 UI 放 banners tab）；MenuItemsPage 翻書效果（bookFlipEffect，開關 UI 放 menu tab）
- 測試帳號：總店=高雄市/鳳山區/ajdoll0612/542966(branchId=1)；屏東墾丁=屏東/墾丁/hh/66(branchId=90001)
- 登入測試帳密：高雄市/鳳山區/ajdoll0612/542966（sessionStorage: adminLoggedIn=true）

## 批次14 驗證進度（phase 5）
- 已登入後台驗證：系統設定頁「帳號密碼」選項已無，J.版本資訊：v1.0.0 按鈕存在。
- 待點擊驗證：版本資訊點開（確認無「請輸入帳號密碼以進入分店管理」文字→輸入帳密→分店管理含總部儀表板）；收銀台（收入/支出標籤在輸入框上方）。
- TypeScript 0 錯誤、vitest 9/9 通過。
- 全部完成後：webdev_save_checkpoint（自動發布）→ phase 6 App splash（底圖 /home/ubuntu/upload/IMG_1312.PNG 夜景圖 2083x3459，需全畫面背景+置中Logo+壽星餐酒館+Birthday Bistro+邊慶生・邊賺錢白字，2-3秒）→ phase 7 重建11檔。
- App 專案：/home/ubuntu/birthday-bistro-app（capacitor.config.json 含 server.url 指向正式站）；資產產生器 /home/ubuntu/make-app-assets-v13.py；gradle build 環境已就緒（JDK/Android SDK 已裝）；交付資料夾 /home/ubuntu/final-delivery/ 與 /home/ubuntu/deliverables/。
- 14-9 已驗證：版本資訊點開後直接顯示帳號/密碼欄，說明文字已刪除 ✓。分店管理頁可進入 ✓。
- 問題：分店管理頁面「總部儀表板」區塊未顯示！可能 hqSummary patch 加在錯的位置或 case "branches" 內另一個 return。需檢查 AdminDashboard case "branches" 是否有兩處/patch實際生效。分店列表現有2家：高雄市鳳山區、屏東墾丁。
- 已修復：hqSummary UI 區塊重新插入成功，總部儀表板顯示✓（總覽3卡+排名+分店卡，點擊按鈕存在）。
- 新問題：總營收顯示 NT$0，但預約資料有當日營業額 NT$35,000/NT$1,800 — hqSummary 用 b.dailyRevenue 但 DB 欄位名可能不同（bookings 表欄位需確認，如 daily_revenue → drizzle 屬性名）。修正後再驗證。
- 已修復並驗證：hqSummary 改用 bookingRevenue 表（totalRevenue by bookingId），API 回傳 totalRevenue=36800、高雄市鳳山區 revenue=36800 netProfit=300 ✓。
- 剩餘驗證：收銀台標籤在輸入框上方（14-8）。之後 vitest → checkpoint 發布 → phase 6 App splash。
- 14-8 已驗證：收入/支出標籤皆在輸入框上方（收入5欄+日期、支出9欄+日期）✓。vitest 9/9 通過、tsc 0 錯誤。→ 存檔發布，進入 phase 6 App splash。

## 批次14 phase 6（App splash）
- v14 splash 產生器 /home/ubuntu/make-app-assets-v14.py 完成：用戶夜景圖(IMG_1312.PNG) center-crop 2732x2732 + 置中Logo + 壽星餐酒館(金)/Birthday Bistro(白)/邊慶生・邊賺錢(白)，預覽 /tmp/splash-preview-v14.png 已確認 ✓。
- 接續：cd /home/ubuntu/birthday-bistro-app && npx @capacitor/assets generate --android --ios（僅 splash 變更，icon 沿用）→ npx cap sync → 檢查 Android splash 顯示 2.5-3秒設定（SplashScreen plugin launchShowDuration，capacitor.config.json）→ gradle build（android/ 下 export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64; ./gradlew bundleRelease assembleRelease，log /tmp/gradle-build.log，先 ./gradlew --stop）。
- 網站 checkpoint 07141239 已發布。批次14 網站端(1-9)完成。剩 14-10 app 重建、14-11 交付11檔（/home/ubuntu/final-delivery/，重打包 android-project.gz/ios-project.gz/website-source.gz、dump-db.py 產 database-backup.sql、更新4份md文件）。
- capacitor assets generate 完成（android 74、ios 7 含新 splash）；cap sync 完成；capacitor.config.json SplashScreen launchShowDuration=2500ms 符合2-3秒需求。
- gradle build 已於背景啟動（log: /tmp/gradle-build.log；輸出 android/app/build/outputs/bundle/release/app-release.aab 與 apk/release/app-release.apk）。
- 交付步驟（14-11）：cp 新 AAB/APK 至 /home/ubuntu/final-delivery/（改名 birthday-bistro-release.aab/.apk）；python3 /home/ubuntu/dump-db.py 產 database-backup.sql；tar czf android-project.gz / ios-project.gz（--exclude build --exclude node_modules --exclude .gradle，於 /home/ubuntu/birthday-bistro-app）；website-source.gz（tar czf 於 /home/ubuntu/birthday-bistro-fixed --exclude node_modules --exclude .git --exclude .manus-logs）；更新 /home/ubuntu/deliverables/交付說明.md 後複製4份md到 final-delivery（檔名：壽星餐酒館_App_轉檔交付說明.md、Android_Keystore_簽章檔資訊（機密，請妥善保存）.md、App_上架指南（Google_Play_與_App_Store）.md、壽星餐酒館（Birthday_Bistro）完整部署與移轉文件.md）；keystore cp birthday-bistro.keystore。
- APK簽章驗證：/home/ubuntu/android-sdk/build-tools/*/apksigner verify --print-certs <apk>（keystore alias/密碼見 Android_Keystore md）。
- 14-10 完成：gradle BUILD SUCCESSFUL，APK 14.3MB / AAB 14.2MB（splash含夜景圖故較前版大），簽章 CN=Birthday Bistro 驗證通過。→ 進入 phase 7 交付。
- 14-11 完成：final-delivery 11檔全部重建（DB 26表、gzip OK、文件更新2026-07-25第14批次、正式站 6頁面200）。批次14全部完成。

## 第15批次 PRD 重點（2026-07-26）

使用者回報4個BUG：
1. 鳳山總店（高雄市/鳳山區/ajdoll0612/542966）永久保留全部品牌管理功能，其餘分店依規則顯示/隱藏
2. 屏東墾丁（屏東/墾丁/hh/66）仍讀取鳳山資料，未建立獨立資料分類 → 須修正
3. 分店後台仍顯示不應顯示的功能 → 須依分店權限隱藏
4. Splash Screen 仍顯示系統預設白色背景 → 須修改 Android/iOS 原生 splash（背景圖直接進原生層，用戶新提供底圖 /home/ubuntu/upload/Screenshot_20260726-010312_ZArchiver.jpg，1080x2280 夜景，注意上下有黑邊需裁切）

規則：每組【城市+地區+帳號+密碼】=一個獨立壽星餐酒館資料分類（branchId 隔離所有資料：預約、活動、任務、營業王、菜單、會員、NPC、SOP、輪播圖等）。前台功能完整保留，僅後台品牌管理依分店權限顯示/隱藏（隱藏不刪除）。
分店後台品牌管理只顯示：壽星預約資訊、菜單管理、系統設定、任務管理、壽星會員專區、會員中心、影片管理（7項）。
分店系統設定只顯示：每月營業王、本月營業王顯示/隱藏（2項）。
總店系統設定版本資訊v1.0.0內新增「分店功能顯示/隱藏」開關（控制所有分店選單項目，與分店後台同步）。
項目4：視覺編輯器頁面清單加「主功能」（/main）。
項目5-6：總部儀表板排名金額/人數/淨利需真實連結各分店資料。
項目7-8：首頁玻璃雨滴特效+輪播轉場特效，開關在首頁輪播圖管理（同一開關 rainEffect）。
項目9：菜單翻書效果，開關在菜單管理。
項目10：原生splash：Android 12+ SplashScreen API 只能顯示圖標，需用 windowBackground drawable（layer-list）+ 舊版 launch_background；iOS 改 LaunchScreen.storyboard 背景圖。目標：啟動即顯示夜景底圖全畫面（含Logo+三行文字合成一張圖）。
- 14-10 Splash: 底圖=/home/ubuntu/upload/IMG_1312.PNG（2083x3459 深紫夜景大樓），全畫面背景+目前Logo置中+下方 壽星餐酒館/Birthday Bistro/邊慶生・邊賺錢（白色文字），2-3秒。不得用系統預設白色splash
- 14-11 交付檔名同第13批次（final-delivery/）
- App 專案 /home/ubuntu/birthday-bistro-app（capacitor.config.json, server.url=https://bistrofix-zqj3rdaj.manus.space, splash 2500ms）；keystore /home/ubuntu/birthday-bistro.keystore（BirthdayBistro2026!/birthdaybistro）；SDK ~/android-sdk + JDK21(javac已裝)；build: cd android && ./gradlew bundleRelease assembleRelease（先 --stop 清 daemon）；assets 腳本 /home/ubuntu/make-app-assets-v13.py

## 14-5 視覺編輯器修復方案（重要架構筆記）
根因：編輯器= iframe(載入實際頁面) + 覆蓋層(只渲染 visual_editor 表中的自訂元素)。覆蓋層攔截了所有滑鼠事件，iframe 內原生 DOM（首頁文字等）完全無法點選。
方案：同源 iframe → 可直接操作 iframe.contentDocument：
1. 在編輯模式下向 iframe 注入點擊攔截：iframeDoc 加 click listener（capture, preventDefault），點到文字節點元素（含直接文字的 heading/p/span/div/button/a）時 outline 高亮並回傳該元素的「文字內容+選擇器」給編輯器。
2. 編輯操作＝文字覆寫系統：新表 page_text_overrides(pageId, selector, originalText, newText, fontSize scale, color, hidden)。儲存後：a) 編輯器 iframe 立即套用 DOM 變更；b) 前台各頁在載入時經 TextOverrides 全域套用（App.tsx 內以 usePageTextOverrides hook 或全域 useEffect，用 selector+originalText 匹配套用）。

## 第15批次 phase-3 驗證（2026-07-26）
- 墾丁分店（屏東/墾丁/hh/66）登入實測：側欄僅7項（壽星預約資訊/菜單管理/系統設定/任務管理/壽星會員專區/會員中心/影片管理）✓；壽星預約資訊「共0筆」= 資料隔離生效 ✓
- 已加：settings tab 非總店僅顯示 每月營業王+本月營業王（isHqBranch 包住其餘區塊）；branches tab 新增「分店功能顯示/隱藏」13開關（updateSettingsMut branchId:1 branchFeatureVisibility JSON，總店永不受影響）；activeTab 保護 effect（分店 tab 被隱藏→自動回 bookings）
- ✓ 已驗證：墾丁系統設定僅顯示 G.每月營業王 + H.本月營業王 2 區塊（無帳密、無版本資訊、無其他）
- ✓ 總店登入見13 tab（含視覺編輯器/NPC/輪播/儀式/SOP/收銀台），壽星預約資訊3筆均見 ✓
- 分店管理（系統設定→版本資訊→帳密驗證）✓：總部儀表板顯示、分店功能顯示/隱藏面板顯示（預設7顯示6隱藏 ✓）、新增分店表單、分店列表2家 ✓
- ✓ hqSummary 修復完成：改為優先以 branchId 歸屬（原本用 city/district 精確比對，但 branches 表存「高雄/鳳山」而 isDefault 判斷用「高雄市/鳳山區」永遠 false）。API 驗證：鳳山 3筆/NT$36,800/淨利300，墾丁 0筆/NT$0 ✓
- Phase 3（15-1~3 分店權限）已完成並驗證。剩餘 Phase 4：15-4 視覺編輯器主功能頁面、15-5/6 儀表板同步（已含金額/人數/淨利，需確認點擊連結）；Phase 5：15-7 玻璃雨滴、15-8 輪播轉場、15-9 菜單翻書。
- ✓ Phase 4 完成：EDITOR_PAGES 加 { id:"main", label:"主功能", path:"/main" }（App.tsx /main 路由已存在）；分店卡預約人數點擊補 adminOpenTab=bookings 深連結；儀表板金額/人數/淨利已由 hqSummary 真實資料驅動。

## Phase 5 計畫（15-7/8/9）
- 15-7 首頁「玻璃雨滴特效」：Home.tsx 加 GlassRainEffect 元件（CSS/canvas 雨滴滑落半透明玻璃感 overlay，pointer-events:none）；開關 rainEffect（systemRouter 已支援 key rainEffect，於首頁輪播圖管理 banners tab 加 顯示/隱藏 開關 UI）
- 15-8 首頁輪播圖「轉場特效」：由同一 rainEffect 開關控制（PRD：輪播轉場特效由玻璃雨滴特效顯示/隱藏控制開關）。輪播在 Home.tsx（找 banner carousel，加 fade/slide 轉場 class）
- 15-9 精選菜單「真實紙本書籍翻頁效果」：MenuItemsPage.tsx 圖片已是攤開左右頁狀態；加 CSS 3D 翻頁動畫（perspective + rotateY）切換圖片；開關 bookFlipEffect（systemRouter 已支援），UI 在菜單管理 menu tab 加 顯示/隱藏 開關
- systemRouter.ts 已有 rainEffect/bookFlipEffect keys（phase3 已加）。前台讀取：system.settings.get?branchId → JSON。注意前台頁面 query 需帶 branchId=getFrontBranchId()
- 完成後 Phase 6：tsc+vitest+瀏覽器實測（總店/墾丁雙登入+前台）→ checkpoint 發布
- Phase 7 splash：先裁上下黑邊 /home/ubuntu/upload/Screenshot_20260726-010312_ZArchiver.jpg (1080x2280)，合成 Logo+三行文字一張圖 → Android: values/styles.xml windowBackground layer-list drawable + Android12 windowSplashScreenBackground/icon 全透明方案 + capacitor splash 資源全部替換；iOS: LaunchScreen.storyboard imageView 全屏。驗證 apk 內 res 檔。build: cd /home/ubuntu/birthday-bistro-app/android && ./gradlew --stop && bundleRelease assembleRelease

## Phase 5 進度（15-7/8/9 前台已完成）
- ✓ Home.tsx：GlassRainEffect canvas 元件（fixed overlay z-[2] mixBlendMode screen，45滑落雨滴+60附著水珠+水痕）；rainEffectEnabled = settings?.rainEffect !== false；輪播 crossfade 轉場（多 img 疊層 opacity+scale 0.8s/0.9s，保留 parallax 相容），rainEffect 關閉時退回原單圖顯示
- ✓ BookFlipViewer.tsx 新元件：3D rotateY 翻頁 0.7s（perspective 1600px、preserve-3d、backfaceVisibility、陰影 sweep、書脊中線），支援觸控/箭頭/圓點
- ✓ MenuItemsPage.tsx：bookFlipEffect !== false 用 BookFlipViewer，否則 ImageCarousel
- 待辦：AdminDashboard banners tab（case "banners" ~1857）加 rainEffect 開關、menu tab（case "menu" ~636）加 bookFlipEffect 開關，呼叫 system.settings.update（參考現有 bannerAutoPlay 開關寫法）
3. selector 生成：以 tag+nth+文字前綴 組合（頁面結構固定，夠穩定）；匹配優先 selector，找不到則以 originalText 全頁文字搜尋。
4. UI：點選 iframe 內文字 → 浮動面板（修改文字/放大/縮小/刪除(隱藏)），每次操作即時儲存 + 即套用。
5. 已存 override 的元素在 iframe onLoad 時全部套用。前台同樣在每頁 mount 時套用（放在 App.tsx 全域，路由變化重新套用）。

### 14-5 實作進度（已完成程式碼，測試中）
- 新表 page_text_overrides 已建立（webdev_execute_sql 直接建）；schema.ts 已加 pageTextOverrides
- server/db.ts: getPageTextOverrides/upsertPageTextOverride/deletePageTextOverride；routers.ts visualEditor 加 listTextOverrides/upsertTextOverride/deleteTextOverride
- client/src/lib/textOverrides.ts：isTextElement/getDirectText/buildSelector/findOverrideTarget/applyOverrideToElement/applyAllOverrides/PATH_TO_PAGE_ID
- client/src/components/TextOverridesApplier.tsx：前台全域套用（App.tsx 已註冊，編輯器iframe ?veditor=1 不套用）
- client/src/components/VisualEditorNativeLayer.tsx：iframe 同源點擊攔截 + 浮動面板（修改文字/放大/縮小/刪除/還原），即時儲存
- AdminDashboard: editorIframeRef、iframe src 加 ?veditor=1、掛 VisualEditorNativeLayer；覆蓋層容器 pointer-events:none（拖曳中恢復 auto），自訂元素子項 pointer-events:auto
- 瀏覽器測試：點選 iframe 內「邊慶生・邊賺錢」文字後浮動面板未出現於截圖（可能點到 h1 生效但面板呈現需確認，或點擊只觸發了輪播）。測試帳密 admin bar / 20240101（sessionStorage adminLoggedIn）— 待確認：截圖顯示點擊後輪播圖出現變化，代表點擊穿透 iframe 成功，但需確認浮動綠框面板是否出現。
- 交付檔名要求（PRD項目18）：android-project.gz、Android_Keystore_簽章檔資訊（機密，請妥善保存）.md、App_上架指南（Google_Play_與_App_Store）.md、birthday-bistro.keystore、birthday-bistro-release.aab、birthday-bistro-release.apk、database-backup.sql、ios-project.gz、website-source.gz、壽星餐酒館_App_轉檔交付說明.md、壽星餐酒館（Birthday_Bistro）完整部署與移轉文件.md
- [ ] Phase6 App icon縮小80%+splash 2秒+重建；Phase7 重建11個交付檔
  - 交付檔已還原於 /home/ubuntu/upload/.recovery/（APK/AAB/keystore/KEYSTORE-INFO.md 等11項）
  - App 專案參數：appId com.birthdaybistro.app；正式站 https://bistrofix-zqj3rdaj.manus.space
- 瀏覽器測試：點選 iframe 內「邊慶生・邊賺錢」文字後浮動面板未出現於截圖（可能點到 h1 生效但面板呈現需確認，或點擊只觸發了輪播）。測試帳密 admin bar / 20240101（sessionStorage adminLoggedIn）— 待確認：截圖顯示點擊後輪播圖出現變化，代表點擊穿透 iframe 成功，但需確認浮動綠框面板是否出現。
- 瀏覽器測試（初測失敗→已修復）：根因＝跨 realm instanceof — textOverrides.ts 的 isTextElement 用父視窗 HTMLElement/Node 常數判斷 iframe 內元素，永遠 false。修正：nodeType===1/3 判斷、getComputedStyle 改用 el.ownerDocument.defaultView。修正後點選 h1 成功：outline 出現＋浮動面板（修改文字/放大/縮小/刪除）正常。
- 14-5 完整驗證通過：放大 100→110→120%（DOM 66px→72px 即時變化）、重載後 override 自動套用（66px on load）、還原按鈕刪除 override 成功（DB 0 筆、樣式復原）。前台 TextOverridesApplier 已在 App.tsx 全域註冊。
項目10：原生splash：Android 12+ SplashScreen API 只能顯示圖標，需用 windowBackground drawable（layer-list）+ 舊版 launch_background；iOS 改 LaunchScreen.storyboard 背景圖。目標：啟動即顯示夜景底圖全畫面（含Logo+三行文字合成一張圖）。

### 批次15 phase-1 盤點結果
- branches 表現有2筆：id=1 高雄|鳳山|ajdoll0612（總店）、id=90001 屏東|墾丁|hh
- 目前只有 cashier_entries 有 branchId 欄位、bookings 有 city/district 欄；其餘內容表（menu_items, homepage_banners, videos, npc_items, entity_images, tasks, task_positions, short_videos, monthly_king_entries, booking_revenue, special_task_cards, ritual_images, task_card_images, system_settings 等）皆無 branchId → 這就是「屏東墾丁讀取鳳山資料」的原因
- 隔離策略（最小改動）：不逐表加 branchId，改為「settings 前綴隔離 + 共用表加 branchId」混合：
  A. system_settings：分店設定用 key 前綴 `b{branchId}:` 隔離（總店 branchId=1 用原 key 不加前綴，向下相容）
  B. 內容表加 branchId 欄（default 1 = 鳳山總店既有資料）：menu_items, homepage_banners, videos, npc_items, entity_images, tasks, task_positions, short_videos, monthly_king_entries, special_task_cards, visual_editor_elements, page_text_overrides
  C. bookings 已有 city/district → 加 branchId 欄並回填；booking_revenue 跟隨 booking
  D. 前台頁面需知道「目前分店」：前台是消費者用，PRD 說每分店擁有完整獨立前台。實務：前台 URL 或 localStorage 選店？PRD 未提前台選店入口 → 簡化：前台預設顯示總店(1)資料；分店後台登入後管理自己的資料。前台獨立資料 = 依 branch context（sessionStorage brandBranchId，由報名表城市/地區或後台登入設定）
- AdminDashboard 後台已有 loginBranchId (sessionStorage adminBranchId)，只有收銀台在用 → 需擴到所有 admin 查詢/mutation
- 後台 13 個 tabs：bookings, menu, settings, tasks, editor, members, center, videos, npc, banners, rituals, sop, cashier
- 分店可見 7 tabs：bookings, menu, settings, tasks, members, center, videos；隱藏：editor, npc, banners, rituals, sop, cashier（可由總店開關逐一控制）
- 分店 settings 內只顯示：monthlyLeaderboardVisible（每月營業王）、currentMonthKingVisible（本月營業王）2項
- 總店 版本資訊 v1.0.0 驗證後區塊（分店管理）內加「分店功能顯示/隱藏」開關組 → 存 system_settings key `branchFeatureVisibility`（JSON: {tabs:{editor:false,...}, settings:{...}}），全分店同步

### 批次15 phase-2 實作紀錄
- schema：15個內容表已加 branchId int default 1 not null：bookings, tasks, videos, menu_items, task_positions, short_videos, monthly_king_entries(month unique已移除改複合), npc_items, homepage_banners, visual_editor_elements, page_text_overrides, ritual_images, task_card_images, special_task_cards, entity_images
- system_settings 分店隔離：key 前綴 `b{branchId}:`（branchId=1 總店用原key）。settings get/update 需帶 branchId 參數
- 後端 router 需改：所有 public list（前台）與 admin list/mutation 帶 branchId 參數（default 1）
- 前台 branch context：前台固定顯示總店(1)資料 — PRD 要求每分店有獨立前台，但前台無選店入口；採用 localStorage `frontBranchId`（後台登入時設定），前台 query 全部帶此值
- AdminDashboard：所有 trpc query/mutation 帶 loginBranchId
- ✅ 遷移已套用：16表 branchId 完成、unique_month 已移除、屏東墾丁 bookings 已回填 branchId=90001

### 批次15 phase-2 router branchId 注入清單（routers.ts 全量盤點結果）
需帶 branchId（input z.number().default(1)）並傳給 db helper 的 procedures：
1. booking.create（加 branchId input，createBooking 存 branchId）、booking.myList（帶 branchId 過濾）
2. task.listPositions / updatePosition（taskPositions 表）
3. shortVideo.list/upload/uploadFile（short_videos 表）
4. menu.list / upsert（menu_items 表）
5. monthlyKing.list / upsert / currentMonth（monthly_king_entries + currentMonth 依 bookings.branchId）
6. admin.listBookings（改用 branchId 過濾優先，城市地區為輔）
7. npc.list / upsert（npc_items）
8. banner.list / add（homepage_banners）
9. visualEditor.list/upsert + listTextOverrides/upsertTextOverride（visual_editor_elements, page_text_overrides）
10. ritual.list/get/upload（ritual_images）
11. taskCardImage.list/add（task_card_images）
12. specialTaskCard.list/add（special_task_cards）
13. entityImage.list/upload（entity_images）
14. systemRouter settings.get/update 已有 → 加 branchId param，key 前綴 b{id}:（id=1 無前綴）
db.ts helpers 對應函式全部加 branchId?: number = 1 參數，where 加 eq(table.branchId, branchId)
前端：client/src/lib/branch.ts 新增 getFrontBranchId()（localStorage frontBranchId，預設1）；前台所有相關 useQuery 帶 branchId；AdminDashboard 全部帶 loginBranchId
注意：前台是消費者所有分店共用網址，前台 branch 來源=localStorage（後台登入時寫入 frontBranchId=loginBranchId，讓店家展示自己分店內容）
總店系統設定版本資訊v1.0.0內新增「分店功能顯示/隱藏」開關（控制所有分店選單項目，與分店後台同步）。

### db.ts 行號地圖（改造用，2026-07-26）
- settings 全域 helpers：532-567（getSetting/getAllSettings/upsertSetting/upsertSettings）
- menu 569-602、taskPositions 604-637、shortVideos 639-683、monthlyKing 720-759、npc 767-797、banners 806-835、visualEditor 837-873、ritualImages 875-908、taskCardImages 910-940、specialTaskCards 942-969、entityImages 971-1006、pageTextOverrides 1100-1156
- branches CRUD/login 1008-1046、cashier（已隔離）1048-1098
- systemRouter.ts：settings.get/update 61-104 全域無 branchId；DEFAULT_SETTINGS 7-31
- AdminDashboard：branch session 54-157 已有；版本資訊區 779-819；branches tab HQ 2117-2195；tabs 陣列 2499-2514（需依分店權限過濾）
- 分店可見7 tabs: bookings, menu, settings, tasks, members, center, videos；分店 settings 僅2項：每月營業王/本月營業王

### 批次15 phase-2 進度（db.ts 完成，routers.ts 進行中）
- db.ts 已完成：branchWhere/settingsKeyFor helpers + 全部內容 helpers 帶 branchId=1 預設（settings/menu/taskPositions/shortVideos/monthlyKing/npc/banners/visualEditor/rituals/taskCardImages/specialTaskCards/entityImages/pageTextOverrides/createBooking），tsc 0 錯誤
- routers.ts 待注入 branchId input（z.number().default(1)）的 call sites（行號）：booking.create 159、task.listPositions 334、task.upsertPosition 349、shortVideo.list 404、shortVideo.upload 416、shortVideo.uploadFile 442、menu.list 548、menu.upsert 560、monthlyKing.list 603/upsert 608/currentMonth 612、npc.list 826/upsert 837、banner.list 852/add 858、visualEditor.list 892/upsert 908、listTextOverrides 932/upsertTextOverride 947、ritual.list 962/get 966/upload 974/delete 978、taskCardImage.list 986/add 991、specialTaskCard.list 1015/add 1020、entityImage.list 1046/upload 1063
- systemRouter.ts settings.get/update 加 branchId param（61-104）
- 之後：前端 client/src/lib/branch.ts getFrontBranchId()（localStorage frontBranchId 預設1）；前台頁面 query 帶 branchId；AdminDashboard 全部帶 loginBranchId；AdminLoginPage 登入成功時寫 localStorage frontBranchId

### 批次15 phase-2 完成狀態（2026-07-26）
- ✅ routers.ts 全部 procedures 已注入 branchId input（含 entityImage.upload、systemRouter settings.get/update b{id}: 前綴）
- ✅ 前端 12 檔已帶 branchId：MultiImageManager(getAdminBranchId)、TextOverridesApplier、Home、InviteCodePage、LeaderboardPage、MenuItemsPage、MyNpcPage、RitualPage、SopPage、MainFunctionPage、MemberPage、MyBookingPage（用 getFrontBranchId）
- ✅ tsc 0 錯誤
- 待做：AdminDashboard 全部 query/mutation 帶 loginBranchId；AdminLoginPage 登入成功寫 localStorage frontBranchId=loginBranchId；BookingPage booking.create 帶 branchId；然後 phase-3 分店權限 tabs 過濾＋分店功能顯示/隱藏開關（branchFeatureVisibility 存總店 settings）

### AdminDashboard 寫入 mutation branchId 注入清單（sed 批次處理）
- ✅ 已完成全部 queries 帶 loginBranchId（settings.get/taskPositions/menu.list/npc.list/shortVideo.list/banner.list/visualEditor.list/ritual.list/taskCardImage.list/specialTaskCard.list/entityImage sop/monthlyKing.list+currentMonth）
- 待注入 mutation payload（用 sed 全域替換較快）：
  - `upsertEditorMut.mutate({ ` 與 `.mutateAsync({ pageId:` → 加 branchId: loginBranchId（8處：1151,1192,1199,1205,1225,1258,1268,1304,1315,1359）
  - `upsertNpcMut.mutate({ ` 2處 1811-1812
  - `addBannerMut.mutateAsync({ ` 2處 1863,1926
  - `updateSettingsMut.mutateAsync({ ` 多處（1983,1999,2106,2108,settings tab 內多處）→ 全部加 branchId: loginBranchId
  - `addTaskCardImageMut.mutateAsync({ `874、`addSpecialTaskCardMut.mutateAsync({ `938、`uploadEntityImageMut.mutateAsync({ `2074、`upsertMonthlyKingMut.mutateAsync({ `724、`upsertMenuMut`、`upsertPositionMut`、`uploadRitualMut`
  - 策略：sed 對這些 mutate 呼叫模式統一插入 `branchId: loginBranchId, ` 於 `{ ` 之後
- BookingPage booking.create 帶 branchId: getFrontBranchId()；AdminLoginPage 登入成功寫 setFrontBranchId(branchId)
- 注意 admin.listBookings 已用 branchScope(city/district)——改為也帶 branchId: loginBranchId（後端 listBookings 支援 branchId 過濾優先）

### 批次15 phase-2 全部完成（2026-07-26）
- ✅ AdminDashboard 全 queries + 41處 branchId: loginBranchId 寫入 mutation（sed 批次）
- ✅ AdminLoginPage 登入成功 setFrontBranchId(result.branchId)；預設分店 fallback setFrontBranchId(1)
- ✅ BookingPage create 帶 branchId: getFrontBranchId()
- ✅ listBookings 支援 branchId 過濾（branchId=1 涵蓋舊無標記資料）
- ✅ tsc 0 錯誤
- 下一步 phase-3（分店權限顯示/隱藏）：
  - PRD: 鳳山總店(branchId=1)永久保留全部品牌管理功能；其他分店隱藏部分功能
  - 總店「分店管理」新增每分店「功能顯示/隱藏」開關（存 settings key: branchFeatures_{branchId} JSON）
  - AdminDashboard tabs 依 loginBranchId===1 ? 全部 : 依 branchFeatures 過濾

# 第16批次筆記（2026-07-31）

## 15批次已驗證完成（未 checkpoint）
- 15-A/B/1/2/3 分店隔離+權限：墾丁登入僅7 tab、系統設定僅2區塊、總店13 tab、分店功能顯示/隱藏13開關、hqSummary branchId 歸屬修復（鳳山3筆/36800/300，墾丁0）✓
- 15-4 EDITOR_PAGES 加主功能 ✓；15-5/6 儀表板真實資料+深連結 ✓
- 15-7/8/9 已實測：rainEffect 開關（banners tab「玻璃雨滴特效」顯示中/已隱藏切換 OK、關閉後首頁 canvas 消失、重新開啟 OK）；輪播 crossfade 實測切換正常；菜單翻書 BookFlipViewer 實測翻頁正常、menu tab「菜單翻書效果」開關已加
- settings API: rainEffect/bookFlipEffect 讀寫正常（POST system.settings.update 200）
- 尚未做：15-10 原生 splash（在 App 專案 /home/ubuntu/birthday-bistro-app）、15-11 交付

## 16批次規則
- 不回退版本；禁改 DB 結構（除修復必須）、會員/預約/品牌資料；禁改版面/按鈕位置/功能邏輯/網址；僅修指定項目

## 16批次實作規劃
- 16-1 雨滴重做：GlassRainEffect 改為「附著玻璃水珠」渲染：深色場景下用 radial 高光+暗緣模擬折射（backdrop-filter 不適用 canvas；改 DOM 水珠 div + backdrop-filter: blur+brightness? 效能考量：用 canvas 畫水珠形狀：橢圓水珠、頂部高光點、底部亮弧、緩慢下滑留水痕、靜態小水珠群）。禁止白色粒子/流星下落 → 移除現有「45滑落雨滴」的直線下落線條，改全部為附著水珠緩慢蜿蜒下滑
- 16-2 視覺編輯器工具列加「變更背景圖片」鈕：上傳圖→存 visual_editor 元素? 更好：存 systemSettings pageBackgroundImages JSON {pageId:url}；前台各頁套用背景。注意禁止改版面→僅新增選項
- 16-3 Safe Area：App 為 server.url wrapper 載入正式站 → 在網站 CSS 加 env(safe-area-inset-top) padding（viewport-fit=cover meta）+ Capacitor config StatusBar overlay 處理；index.html meta viewport 加 viewport-fit=cover；body/header padding-top: env(safe-area-inset-top)
- 16-4/5 每月營業王：settings tab G區塊 monthlyKing 輸入（姓名/日期/金額）標籤移上方+新增 MVP 輸入框（monthlyKingEntries 表或 settings key monthlyKingMvp；查現有實作）
- 16-6 後台↔前台同步驗證（每月營業王改後前台 LeaderboardPage 同步）
- 16-7 我的會員→我的生日倒數：MainFunctionPage FUNCTIONS H title 改；MemberPage 加「我的生日願望」輸入框（註冊表單）+查詢會員後最上方顯示「距離我的慶生體驗還有」+ XX天XX時XX分XX秒 倒數（白字、秒粉色、<=7天時天數粉色）；生日日期=會員 birthday 欄位（查 schema users/members）
- 16-8 真實體驗牆：MainFunctionPage 精選菜單右邊加「真實體驗牆」/experience；ExperienceWallPage：活動畫面（Birthday Moments/真實活動照片、記錄每位壽星最難忘的精彩時刻/圖片格+點選放大縮放/點選圖片可放大查看，手指縮放可移動頁面）、慶生影片（Birthday Stories/每一段影片，都是專屬於壽星與好友的珍貴回憶/影片列表/感受壽星餐酒館最真實的慶生時刻）；後台新 tab「體驗牆」：活動圖片管理（多圖上傳/預覽/刪除，用 entityImages entityType=experience_photo）、活動影片管理（多影片上傳/預覽/刪除，entityType=experience_video 或 videos 表）
- 16-9/10/11 MorePage 品牌資訊文字更新（BrandInfoPage? 查 MorePage 結構：品牌資訊/常見問題/聯絡我們→關於我們？PRD說品牌資訊內有 關於碳咖冰櫃創意餐飲/常見問題/關於我們 三選項）
- 16-12 交付11檔（website-source.tar.gz/android-project.tar.gz/ios-project.tar.gz 檔名注意本次 PRD 用 .tar.gz）

## 待辦順序

## 16批次現況（2026-07-31 最新）
- ✓ 16-1~16-11 全部完成並截圖驗證（todo.md 已勾選）；16-6 待實測驗證（admin 更新營業王→前台同步）
- 測試帳號：總店 高雄市/鳳山區/ajdoll0612/542966（branchId=1）；墾丁 屏東/墾丁/hh/66（branchId=90001）
- 剩餘：16-6 同步驗證 → pnpm test + tsc → checkpoint（自動發布）→ 15-10 原生 splash（App 專案 /home/ubuntu/birthday-bistro-app，底圖 /home/ubuntu/upload/Screenshot_20260726-010312_ZArchiver.jpg 需裁上下黑邊；Android windowBackground layer-list + iOS LaunchScreen.storyboard；也要把 16-3 safe area 確認 capacitor StatusBar 設定）→ gradle build APK/AAB → 16-12 交付11檔至 /home/ubuntu/final-delivery/
- 交付檔名（本次 PRD）：website-source.tar.gz、database-backup.sql、android-project.tar.gz、birthday-bistro-release.apk、birthday-bistro-release.aab、birthday-bistro.keystore、ios-project.tar.gz、壽星餐酒館_App_轉檔交付說明.md、App_上架指南（Google_Play_與_App_Store）.md、壽星餐酒館（Birthday_Bistro）完整部署與移轉文件.md、Android_Keystore_簽章檔資訊（機密，請妥善保存）.md
- 注意：使用者要求檔案可本機獨立重建/編譯/部署，不依賴 Manus 平台 → 部署文件需含 DB schema、環境變數說明、npm scripts；website-source 需含完整專案

## App splash 現況盤點（2026-07-31 phase6）
- 網站 checkpoint 2cac3ab9 已發布至 bistrofix-zqj3rdaj.manus.space（App wrapper 自動反映）
- Android drawable splash 已是夜景圖版（Logo+壽星餐酒館金字+Birthday Bistro+邊慶生・邊賺錢白字），各 density 齊全（port-xxxhdpi 1280x1920）
- styles.xml AppTheme.NoActionBarLaunch parent=Theme.SplashScreen + android:background=@drawable/splash；AndroidManifest activity theme=NoActionBarLaunch；core-splashscreen 1.2.0
- 問題：無 values-v31/styles.xml → Android 12+ 系統 SplashScreen 會蓋掉 windowBackground 顯示預設白底+icon → 這就是「仍顯示白色預設」根因。需加 values-v31 style：windowSplashScreenBackground=#0a0f1e 深色、windowIsTranslucent 或 postSplashScreenTheme；Theme.SplashScreen 的 windowSplashScreenAnimatedIcon 設透明 → 系統 splash 一閃即換 windowBackground。更佳：values-v31 加 <item name="android:windowSplashScreenBackground">@color/splashBg</item> 深色 + icon 用 logo；並讓 MainActivity 顯示 windowBackground 全圖
- iOS Splash.imageset 已有 dark/light 2732 版（需確認是夜景版）；LaunchScreen.storyboard imageView scaleAspectFill image=Splash ✓
- Safe Area(16-3)：網站已加 viewport-fit=cover + env(safe-area-inset-top)；capacitor.config.json StatusBar style DARK bg #000000；App WebView 載入正式站自動生效。若要真正避開狀態列，Android 需確認未用沉浸式 overlay（現 config splashImmersive 只影響 splash）
- build: cd android && export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 && ./gradlew --stop && ./gradlew bundleRelease assembleRelease（log /tmp/gradle-build.log）；SDK ~/android-sdk
- keystore /home/ubuntu/birthday-bistro.keystore（BirthdayBistro2026!/birthdaybistro）

## Phase6 進度（splash 修復）
- 已加 values-v31/styles.xml（windowSplashScreenBackground=@color/splashBackground #0A0F1E、icon=@drawable/splash_logo、windowBackground=@drawable/splash）→ 解決 Android 12+ 預設白底
- 已加 values/colors.xml（colorPrimary/Dark/Accent + splashBackground）— 原本 colors.xml 缺失!（styles.xml 引用 @color/colorPrimary，先前靠 capacitor lib？實測 build 若錯誤即知）
- splash_logo.png 各 dpi 已生成（make-splash-logo-v16.py）
- iOS Splash.imageset 確認已是夜景版 ✓ storyboard scaleAspectFill ✓
- MainActivity 極簡 BridgeActivity（無需改）
- 下一步：gradle build（bundleRelease assembleRelease + apksigner）→ 11 檔交付

## Phase7 交付檔案狀態（已重建）
- APK/AAB 已重建並含 values-v31 splash 修復（aapt2 驗證 color/splashBackground #ff0a0f1e、drawable/splash_logo、windowSplashScreenAnimatedIcon 皆已編入）、簽章驗證通過（SHA-256 e235aa15...）
- android-project.gz / ios-project.gz / website-source.gz 已用最新原始碼重打包，gzip -t 通過
- database-backup.sql 已重新匯出（27 表，dump-db.mjs）
- 部署文件與轉檔說明已更新為第16批次內容
- 待辦：更新 App_上架指南與 Keystore 文件日期（若需要）、最終驗收（用戶視角測試網站）、交付
- 正式站驗收：8 頁全 200、settings API 正常、experienceWall.list 已回傳上傳照片、branch.list 顯示 (1,高雄,鳳山)(90001,屏東,墾丁) ✓

## 待最終確認（todo 未勾項）
- 15-A/B、15-1~6（分店隔離+權限開關+視覺編輯主功能頁+總部儀表板同步）：據 phase2 紀錄已於第15批次開發時實作（branchFeatureVisibility 設定、branch.cashier.test.ts 通過、儀表板API營收36800驗證），需在正式站以 hh/66 屏東墾丁帳號實測後勾選
- 15-10 splash：values-v31 修復已編入 APK（aapt2 驗證通過）→ 可勾
- 16-6 同步：monthlyKing.upsert→list 已由 batch16.test.ts 驗證（MVP寫入前台同步讀取）→ 可勾
- 16-12 / 15-11：11檔已重建於 /home/ubuntu/final-delivery/（APK/AAB/keystore/android/ios/website/db/4文件），文件已更新第16批次
1. 16-1 雨滴重做 → 2. 16-4/5/6 營業王 → 3. 16-7 生日倒數 → 4. 16-8 體驗牆 → 5. 16-9~11 文字 → 6. 16-2 編輯器背景 → 7. 16-3 SafeArea(網站CSS+App) → 8. 測試+checkpoint → 9. 15-10 原生splash + App 重建 → 10. 交付

## 16批次進度
- ✓ 16-1 GlassRainEffect 重寫完成：附著水珠（凝聚成長→臨界重量緩慢蜿蜒下滑+隨機停頓+水痕蒸發），玻璃折射式暗環+內部聚光+底部反光弧+微高光，無 mixBlendMode screen、無直線下落線條；截圖確認水珠與水痕呈現於深藍夜景，無白色粒子感
- ✓ 16-2 視覺編輯器「變更背景圖片」+「還原背景」按鈕（AdminDashboard editor 工具列，pageBackgrounds JSON 存 systemSettings key）；PageBackgroundApplier.tsx 已註冊 App.tsx（前台各頁套 body 背景）；systemRouter 已加 pageBackgrounds key
- ✓ 16-3 Safe Area：index.html viewport-fit=cover；index.css body padding env(safe-area-inset-*) + .fixed.inset-0 padding-top（桌機為0不影響版面）
- ✓ 16-4/5：mvp 欄位（DB+schema+db.ts+routers）；AdminDashboard G區塊標籤移上方+MVP輸入框+已儲存顯示MVP；LeaderboardPage tab last 顯示 MVP（粉色）
- ✓ 16-7：users.birthdayWish 欄位（DB+schema+db.ts+routers register/update）；MemberPage 標題→我的生日倒數、註冊表單加生日願望輸入框、查詢後最上方 BirthdayCountdown（天數<7粉色、秒數粉色，每秒更新）、會員資料顯示我的生日願望；MainFunctionPage/NavBar/AdminDashboard editor 頁面清單同步改名（path /member 不變）
- ✓ 16-8 完成：experience_media 表+schema+db+experienceWall router；ExperienceWallPage（/experience，精選菜單右邊）；後台「體驗牆」tab（ExperienceWallAdmin.tsx：活動圖片/影片管理，多檔上傳/預覽/刪除，影片45MB上限）；BRANCH_DEFAULT_TABS 加 experience:false；截圖驗證前台 OK（/experience、/main 格線、/member 生日倒數+願望輸入框皆正常）
- ✓ 16-9/10/11 完成：BrandInfoPage 關於碳咖冰櫃5段文字＋常見問題7組Q&A＋營業時間/聯絡方式（原本已符合16-11要求），全頁截圖驗證 OK
- 待辦：16-6 前後台同步驗證（每月營業王 admin 更新→前台 leaderboard 同步）；跑 pnpm test；檢查 15 批次分店隔離/Splash 是否已完成（todo.md 15-A/B）；checkpoint → 原生打包 → 11 檔交付
- 剩餘 16 批次項目：16-9/10/11 品牌資訊文字更新（BrandInfoPage.tsx：關於碳咖冰櫃創意餐飲/常見問題/關於我們）；16-6 同步驗證；後台 tabs 陣列位置需 grep "tabs" AdminDashboard
- 16-6 同步：monthlyKing.list 前台已用 branchId=getFrontBranchId()，upsert 後 refetchMonthlyKing → 前台 query 自動更新（需驗證）

## 16批次關鍵位置備忘
- AdminDashboard: kingName/kingDate/kingRevenue state 行232-234；G每月營業王 UI 行752-782；月按鈕 onClick 行757
- LeaderboardPage: monthlyKing 顯示行107-121（tab last）
- MainFunctionPage FUNCTIONS 陣列（我的會員→我的生日倒數 16-7；精選菜單右邊加真實體驗牆 16-8）
- MorePage/品牌資訊：16-9/10/11 文字更新（BrandInfoPage? 需 grep 關於碳咖冰櫃/常見問題/關於我們）
- MemberPage（16-7 生日倒數+生日願望）
- 16-8 體驗牆：前台 /experience 新頁+後台 experience tab（entityImages entityType=experience_photo；影片另存 entityType=experience_video 或 videos 表）
