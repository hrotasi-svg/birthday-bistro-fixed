# 第311批次：iPad三端同步、光源、火焰與金幣黑框

## 限定範圍

本批次僅處理`/store-select`。使用者要求把iPad同步、蝴蝶身體光源、短按外圈、火焰位置與goldan金幣黑色框架作為同一批次逐項驗證，禁止改動其他網站設定。

## 正式站初始結果

目前正式`/store-select`在載入完成後可顯示既有Logo、火焰、門店入口與頁尾。後續調查將直接量測正式頁的已載入雜湊資產、版本探針、iPad靜態後備、短按色票與金幣Canvas，不以桌面預覽取代實體iPad結論。

正式頁目前載入`/assets/index-Cz9QVQCR.js`，並已產生`__release_probe`請求。金幣Canvas具有`user-uploaded-video-black-matte`、`warm-metal-and-highlight-no-black-frame`與`transparent-screen-no-black-frame`標記，CSS背景透明且合成模式為screen；火焰仍為z-index 6、left 13.6562px／top -103.344px，對應第308的4.8%／-29.5%定位。正式頁可使用Service Worker API，但後續仍需明確檢查是否有實際註冊，不能僅以API存在判定快取狀態。當前非降低動態效果身體光源30.95×13.55px，需進一步量測iPad靜態後備與父容器比例。

## 第312批次裝置專屬定位

使用者已澄清：桌面與iPad火焰需要左上微移；手機與App只需要左移。因此採用桌面／iPad基準`left:3.9%; top:-30.2%`，並以手機寬度小於700px的明確媒體規則覆寫為`left:3.9%; top:-29.5%`。桌面1280×720、手機390×844及iPad 1024×1366視窗均已檢視，既有Logo、門店入口與頁尾未被改動。手機視窗只代表Web／App等效CSS分支；實體App與實體iPad Safari仍須在發布候選版上最終確認。

第312批次新版開發頁已完成門店資料與火焰初始化，火焰、Logo、門店入口與頁尾均存在；後續運行期數據將在此完成狀態下取得。

第312版運行期火焰為left 11.0938px／top -105.797px，對應桌面／iPad設定3.9%／-30.2%。goldan影片來源未變，Canvas為透明screen合成、位於火焰後方，錨點寬96.765625px與唯一drawWidth 725.7421875px完全相符（7.5倍）；因此同一來源畫格內的所有可見金幣等比例同步放大。驗證中舊Canvas互動索引在動畫／資料載入後失效而誤選到門店入口，瀏覽器暫時導向`/main`；已立即重新載入`/store-select`，沒有寫入資料庫或變更網站設定。後續短按只會先重新取得當前Canvas索引。

直接建立的JavaScript PointerEvent屬於不受信任事件，React短按狀態未改變，不能用於判定iPad觸控失敗。隨後改用目前畫面中的火焰可見區座標實際點擊，頁面仍停留`/store-select`，未導向門店。後續會讀取實際點擊後的類別及色票，以客觀資料判斷事件結果。

火焰Canvas在本次CSS視窗中的可點擊矩形為left 113.83px／top 693.18px／width 449.27px／height 218.30px；先前以縮放後截圖座標點擊未命中，並非事件邏輯失敗。以實際CSS視窗1280×1100與Canvas中心座標338×829短按後，路徑仍為`/store-select`，火焰類別由pink變為blue，身體光源、圓形外圈及側邊外圈均更新為藍色直接漸層；身體光源display block且opacity 0.96。這證實Pointer短按在受控瀏覽器路徑可用，實體iPad Touch／Safari仍須發布候選版實測。

加入`hasPointerCapture`防護後已以乾淨開發頁重新載入，門店資料、火焰Canvas與既有舞台均完成初始化；下一步只會以新量測的Canvas命中座標驗證短按，避免過期元素索引或截圖縮放造成誤判。

重載後Canvas實際矩形為left 103.99px／top 681.84px／width 462.49px／height 236.01px，使用CSS視窗1280×1100與即時中心335×828短按。火焰成功改為blue類別，身體光源、圓形外圈及側邊外圈皆含藍色直接色票，身體光源仍可見，路徑維持`/store-select`。這次短按流程已通過新增的指標捕捉防護，未再發生先前的`releasePointerCapture`例外。

完整品質流程已通過：27個測試檔、88個測試全部成功；TypeScript無錯誤；正式建置輸出`index-DXs9lLZJ.js`成功。建置僅報告既有大型前端包提示，沒有編譯失敗。桌面1280×720、手機390×844與iPad 1024×1366三種視窗已驗收裝置專屬火焰CSS與既有版面；手機視窗代表App等效分支，不能取代實體App。受控瀏覽器已關閉以釋放記憶體；實體iPad Safari與實體App仍須以發布候選版確認背景恢復、短按與視覺效果，未確認前不宣稱實機完成。
