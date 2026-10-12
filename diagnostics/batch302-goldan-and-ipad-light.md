# 第302批次：goldan金幣與iPad光源診斷

## 新素材與透明處理

使用者新上傳的`goldan.mp4`為1920×1080、約3秒、純黑背景、無浮水印／文字／邊框的金幣影片；金幣由底部中心放射上噴後受重力落下，最後回黑。素材已保存並以`/manus-storage/user-goldan-coin-batch302_51e563da.mp4`作為門店頁唯一金幣來源。黑色背景仍由逐影格亮度遮罩轉透明，無黑色覆蓋層，並未新增逐枚下墜效果。

## 第280批次尺寸換算

第280批次的核准尺寸規則為`VIDEO_WIDTH_FROM_ANCHOR = 4.5`。現行桌面運行期容器寬度為`96.765625px`，精確應得繪製寬度`435.4453125px`；新影片執行期`coinDrawWidth`同為`435.4453125px`，且資料標記`coinSizeReference=batch280-width-from-anchor-4.5`。金幣仍以既有`fc0c1455-flame-center`火柴頭錨點繪製。

## iPad光源直接層

身體光源採直接RGB漸層、opacity `0.96`、`z-index:12`、`mix-blend-mode:screen`與`translate3d`／標準及WebKit背面可見設定，將其提升到WebGL畫布上方，避免Safari 3D合成或色相快取導致不顯示。圓形光圈仍使用直接色票漸層，非靜態`hue-rotate`。

## 短按色票驗證

直接點選火焰Canvas後，頁面仍在`/store-select`，火焰類別為`store-select-flame-color-blue`。身體光源直接維持opacity `0.96`、`z-index:12`、screen混合及`translate3d(0,0,.12rem)`，背景已更新為藍白、淺藍、藍、深藍的直接漸層；圓形與側邊光圈均同時更新為藍色色票。這條驗證使用實際Canvas短按，而非只檢查CSS原始碼。

## 響應式視窗驗收

iPad 1024×1366與手機390×844完整頁面已檢視；兩端維持既有Logo、火焰、文字、門店入口與頁尾版面，並由相同門店頁元件載入新的goldan影片、4.5倍錨點尺寸及直接色票光源。尚待桌面完整視窗檢查後，再完成跨裝置驗收結論。

桌面1280×720也已完成完整頁面檢視，因此桌面、手機與iPad三種視窗均共用同一最新來源、尺寸規則與直接色票程式。完整品質檢查為25個Vitest測試檔、85項測試通過，TypeScript與正式建置通過；新建置前端資產為`index-DphDAFvy.js`。Vite僅顯示既有大型區塊警告，沒有建置失敗。
