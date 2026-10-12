# 第304批次：iPad版面、光源與同步診斷

## 已確認原因

Logo與蝴蝶共用`.store-select-logo-stage`舞台；此舞台原本只依Tailwind的left、top與width類別，iPad Safari在保留舊入口HTML或重新計算絕對定位時，可能遺失該類別的定位優先序，造成Logo及舞台內的蝴蝶以預設靜態流動位置顯示。正式生產端原本對SPA的`index.html`沒有明確的禁止快取標頭，和開發端每次注入隨機版本參數的行為不同，會讓裝置有機會仍以舊HTML指向舊雜湊資產。

## 限定修復

Logo舞台現以直接CSS再次鎖定`position:absolute`、`inset:29.6% auto auto 13.5%`及`width:22.5%`，仍沿用既有的iPad／桌面／手機位置與比例；沒有改動Logo圖片或蝴蝶飛行路徑。僅在iPad Safari支援條件且寬度至少700px時，身體光源放大為舞台寬度17%、高度7.4%，以便清楚可見。正式SPA入口路由設定為`Cache-Control: no-store, no-cache, must-revalidate, max-age=0`，雜湊資產仍可安全快取；下一次進入網站會取得最新入口內容。

本機正式建置初次標頭檢查顯示`express.static`仍自動回傳`index.html`並覆寫為`public, max-age=0`，因此已改為`express.static(distPath, { index: false })`，讓所有SPA路由均落入明確的無快取`sendFile(index.html)`。這是iPad與其他裝置可能持續使用舊入口HTML的直接伺服器根因修復，後續會以正式建置再次驗證標頭。

最終正式建置實測`/store-select`回應為`Cache-Control: no-store, no-cache, must-revalidate, max-age=0`。因此每次重新進入SPA路由都會重新取得入口HTML；因前端資產檔名帶內容雜湊，裝置會隨新入口載入最新JS而非沿用舊版頁面。完整品質檢查通過25個測試檔、85項測試、TypeScript與正式建置；最後資產為`index-CV31yJa7.js`。

目前開發門店頁已完成重新載入並顯示既有Logo、火焰、文字與門店入口；尚待運行期精確量測、短按色票與三種視窗／全套品質驗收。

## 初步運行期量測

重新載入後，Logo舞台已為`position:absolute`，其實際外框與Logo外框完全相同（桌面量測left=`170.766px`、top=`791.063px`、width=`284.625px`、height=`350.359px`），不再由靜態流動排版置中。金幣已量測為`599.946875px`、標記`batch304-enlarged-from-batch280-width-from-anchor-6.2`，錨點仍為`fc0c1455-flame-center`。身體光源保留opacity `0.96`、z-index `12`及WebKit preserve-3d。

一次瀏覽器元素索引在重新載入後已變更，後續使用舊的索引觸發了門店入口，導向`/main`；這不是火焰短按或色票結果。後續驗證將重新進入`/store-select`並取得新的火焰Canvas元素再操作。

重新進入門店頁並取得當前火焰Canvas後，以該元素直接短按；頁面保持`/store-select`，火焰處已開始目前既有循環的金幣噴灑，證明放大的金幣畫布不攔截實際火焰Canvas事件。下一步將讀取直接色票狀態，避免僅根據動畫畫面宣稱光圈已更新。

## 響應式視窗檢視

iPad直向1024×1366與手機390×844完整頁面均已檢視。兩端的Logo均維持原有左側舞台位置，沒有被放大或置中；文字、火焰、門店入口及頁尾版面也維持。這兩個視窗使用同一個固定舞台規則及最新版前端程式；尚待桌面完整視窗檢視後完成跨裝置結論。

桌面1280×720完整頁面亦已檢視，與手機及iPad使用同一最新版舞台與金幣程式；三個視窗的Logo均維持既有左側位置，未出現置中放大。完整品質檢查已完成：25個Vitest測試檔、85項測試通過，TypeScript與正式建置通過，資產為`index-CV31yJa7.js`。Vite僅保留既有大型區塊警告，無建置失敗。
