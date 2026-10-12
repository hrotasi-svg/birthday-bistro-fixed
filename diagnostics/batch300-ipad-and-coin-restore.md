# 第300批次：iPad光源／光圈與金幣恢復影片診斷

## 使用者新上傳影片

`金幣恢復.mp4` 已被動分析為1920×1080、約3秒、16:9的純黑背景金幣素材：前約1秒由底部中心向上噴灑，後約2秒由最高點回收／下落至畫面底部。網站採逐影格亮度遮罩將黑色像素轉為透明，保留影片自身的收回動作；不採黑色覆蓋層，也不保留第299批次的合成逐枚下墜離場。

## 循環與iPad修復實作

新影片位址為`/manus-storage/user-coin-restore-batch300_2ca696f9.mp4`。蝴蝶回火焰原點的既有關鍵點為循環66.8%，影片於該點觸發，並與既有火焰重燃光源關鍵影格對齊；影片結束回報`source-video-recalled-flame-visible`，下輪循環才可再次觸發。身體光源使用直接RGB漸層、直接不透明度、非動畫化的transform與標準／WebKit背面可見設定，避免Safari對自訂屬性動畫及3D合成層的快取問題；Touch結束備援不再因Pointer鏈殘留狀態而略過短按切色。

## 初步檢查

更新後門店頁已載入既有火焰、蝴蝶與版面。針對性Vitest門店頁測試7/7與TypeScript均已通過；尚待新影片完整循環量測、iPad視窗互動與全套回歸建置後才可視為完成。

## 第一次完整循環量測

重載頁面後，循環進入蝴蝶回原點的火焰閃現節點時，新影片確實使用`butterfly-returned-flame-flash-coin-spray`狀態開始播放。其後影片自身完成金幣回收，量測值為`coinState=source-video-recalled-flame-visible`、`coinExitState=source-video-recalled`、`coinFallingCount=0`、可見像素`0`；此時火焰opacity為`0.99`、蝴蝶opacity為`0`且舞台未被暫停，符合「收回瞬間火焰再次顯示，下一輪再循環」，並證明舊的逐枚下墜沒有執行。

## 直接短按色票驗收

直接點選門店頁火焰Canvas後，頁面仍在`/store-select`，火焰類別由粉色更新為`store-select-flame-color-blue`。蝴蝶身體光源保持直接opacity `0.96`與非動畫化樣式，背景改為藍白、淺藍、藍與深藍的直接徑向漸層；圓形與側邊火焰光圈也均改為相同藍色直接漸層。因此顏色不再依賴Safari可能快取的hue-rotate自訂屬性鏈。實體iPad Safari仍應由使用者以一次短按與一次長按完成最後裝置驗收。

## 跨裝置與品質驗收

桌面1280×720、手機390×844與iPad1024×1366均完成完整頁面檢視，並共用同一新影片來源與同一份前端程式。全套Vitest為25個測試檔、85個測試通過；TypeScript及正式建置均通過，前端資產為`index-D162UTOM.js`。Vite僅保留既有的大型前端區塊警告，建置沒有失敗。
