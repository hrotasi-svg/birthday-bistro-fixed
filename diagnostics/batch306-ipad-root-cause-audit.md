# 第306批次：iPad根因稽核與限定修復

## 已確認根因

第一，正式SPA入口已設定`Cache-Control: no-store, no-cache, must-revalidate, max-age=0`，可避免重新進入路由時仍使用舊版入口HTML；內容雜湊資產會隨最新入口更新。專案沒有Service Worker快取規則，因此不一致不再由前端Service Worker造成。

第二，原iPad火焰後備MP4是H.264 High Profile、level 3.1；較舊的iPad Safari／WebView可能無法可靠解碼，即使檔案副檔名為MP4也仍會使畫布沒有可繪製影格。現重新使用相同的既有火焰畫面轉為H.264 Constrained Baseline、level 3.0、yuv420p與faststart，並上傳為`/manus-storage/store-select-real-flame-ipad-baseline_0c3be663.mp4`。iPad／iOS會優先採用它，原WebM錯誤時也會自動回退；桌面與手機仍保留原WebM。

第三，蝴蝶身體光源先前只有13%×5.4%基礎尺寸，且曾以裝置專屬覆寫調整，容易因iPad父層飛行縮放而顯得過小。現改為跨裝置一致的24%×10.5%，不再依賴iPad特例。火焰外圈使用直接RGB背景，不用靜態hue-rotate作為色彩來源；既有Pointer／Touch短按路徑會更新同一份React色彩狀態。

## 金幣基準

依使用者要求，金幣先回到第304批次的6.2倍錨點基準，再小幅放大至6.5倍與由原始X=-10右移至X=-4；火柴頭Y錨點、影片來源與透明黑底處理維持。此設計不回復第305批次6.8倍的大幅尺寸。

## 初步驗證

門店頁針對性回歸測試7/7與TypeScript已通過。後續將以運行期資料、iPad／手機／桌面視窗、完整測試、正式建置與正式入口標頭再驗證。

重新載入更新後門店頁時，先出現既有「載入門店中」提示；資料完成後Logo、火焰區域、文字、門店入口與頁尾皆正常顯示，未出現版面回歸。後續會量測H.264 Baseline後備可播放性、火焰資料、統一身體光源尺寸及金幣6.5倍基準。

更新後運行期驗證：Baseline MP4載入至`loadeddata`，`canPlayType(video/mp4)`回應`maybe`；真實火焰畫布為`ready`且有4086可見火焰像素。身體光源計算寬23.2188px、高10.1562px、opacity 0.96、z-index 12；金幣drawWidth為628.9765625px、錨點仍為`fc0c1455-flame-center`、層級為12，資料標記為第304的6.2基準後調整至6.5並右移。重新取得火焰Canvas後的實際短按仍留在`/store-select`，並可見火焰／外圈進入藍色色票循環。

## iPad與手機視窗驗收

iPad直向1024×1366與手機390×844完整門店頁已檢視；兩端都維持原有Logo、火焰、文字、門店入口及頁尾版面，並共用同一Baseline火焰後備、統一身體光源、直接色票與金幣6.5倍規則。尚待桌面完整視窗驗收後完成跨裝置結論。

桌面1280×720完整門店頁亦已檢視，與手機及iPad共用同一套最新版火焰、光源、外圈色票與金幣程式。全套品質檢查通過25個Vitest測試檔、85項測試、TypeScript及正式建置；最新前端資產為`index-Kduimj37.js`。Vite僅顯示既有大型區塊警告，沒有建置失敗。
