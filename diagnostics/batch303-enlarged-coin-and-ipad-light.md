# 第303批次：金幣放大與iPad光源

現有goldan影片來源、黑底逐影格透明處理、火柴頭錨點與位置均維持不變。唯一金幣尺寸調整是將繪製規則由第280批次參考的4.5倍容器寬度提高為5.2倍，增加約15.6%，使金幣可見噴灑範圍放大而不位移。

蝴蝶身體光源保留直接RGB色票、opacity 0.96、z-index 12、screen混合與translate3d；另加入標準與WebKit的`preserve-3d`，避免iPad Safari將光源在3D合成階段平面化或略過。火焰外圈仍以直接色票而不是靜態hue-rotate變色。尚待放大後的實際drawWidth、短按色票切換與完整跨裝置測試驗收。

## 運行期量測與短按

放大後金幣影片來源仍為`/manus-storage/user-goldan-coin-batch302_51e563da.mp4`，資料標記為`batch303-enlarged-from-batch280-width-from-anchor-5.2`。桌面運行期drawWidth為`503.18125px`，與容器寬度乘以5.2完全一致；錨點仍為`fc0c1455-flame-center`。播放中的金幣畫布未攔截Canvas短按：實際短按後，頁面仍在`/store-select`，火焰切至藍色，身體光源維持opacity `0.96`、z-index `12`及WebKit preserve-3d，圓形與側邊光圈皆同步更新為直接藍色色票。

## 響應式視窗驗收

iPad 1024×1366與手機390×844完整頁面均已檢視；兩端維持既有Logo、火焰、文字、門店入口與頁尾版面，並共用放大後goldan金幣來源、5.2倍容器寬度規則及直接色票光源。尚待桌面完整視窗確認後完成跨裝置結論。

桌面1280×720亦已完成完整頁面檢視，因此桌面、手機與iPad都載入同一最新程式、影片來源及尺寸規則。完整品質檢查為25個Vitest檔、85項測試通過，TypeScript與正式建置通過；前端資產為`index-Cf2c6U_q.js`。Vite僅保留既有大型區塊警告，沒有建置失敗。

## 正式網域連線檢查（第304批次）

正式網域`https://bistrofix-zqj3rdaj.manus.space/store-select`已成功回應門店頁的標題、門店入口與返回首頁文字；因此沒有顯示整個站點離線或不同路由的情況。瀏覽器視覺連線一次因`ERR_CONNECTION_CLOSED`未取得畫面，後續仍需以部署後的跨裝置資產／容器量測驗證iPad所見版面。
