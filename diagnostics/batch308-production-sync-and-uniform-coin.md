# 第308批次：正式同步與全體金幣放大稽核

## 根因與修復範圍

正式`/store-select`入口實測回應`Cache-Control: no-cache, no-store, must-revalidate`，因此一般重新載入會取得最新HTML。仍有Safari從back-forward cache恢復舊記憶體頁面的情況，此流程不一定重新請求HTML；前端現只在`pageshow.persisted`為真時重新載入，令舊頁重新解析目前內容雜湊資產，不影響一般瀏覽。

先前程式中，金幣容器實際為`z-index:12`而火焰Canvas是`z-index:6`，與「金幣位於火焰後方」要求相反。第308批次將金幣容器改為z-index 4。影片是單一Canvas畫格，所有金幣都共同通過同一`drawWidth`繪製；改為7.8倍錨點寬度會等比例放大畫面內所有可見金幣，並非只放大特定一至兩枚。

## 初步載入

門店資料載入完成後，火焰、Logo、文字與入口維持既有版面並正常顯示。後續將量測新繪製寬度、實際層級、短按色票與跨裝置視窗結果。

## 運行期驗證

更新後量測金幣容器為`z-index:4`、火焰Canvas為`z-index:6`，金幣`pointer-events:none`，因此金幣確實位於火焰後方且不攔截短按。影片畫格統一drawWidth為`754.771875px`，來源標記為`batch308-batch304-reference-6.2-uniformly-enlarged-to-7.8-left-offset-minus-10`；所有畫面內金幣共用這一繪製縮放。

實際點選目前火焰Canvas後，頁面仍為`/store-select`，火焰類別與圓形／側邊外圈均為藍色，蝴蝶身體光源、圓形外圈及側邊外圈的直接徑向漸層均更新到相同藍色色票。

## 桌面與iPad視窗驗收

桌面1280×720與iPad直向1024×1366的完整門店頁均已檢視。兩端的Logo、火焰、文字、門店入口與頁尾保持同一舞台比例及位置，並載入相同火焰、外圈、身體光源與金幣程式。手機390×844完整門店頁亦已檢視，舞台構圖與其他兩個視窗一致。

進行減少動態效果等效驗證時，首次探針發生於蝴蝶元素尚未進入目前動畫階段，因此不以該次尚未取得元素的結果作為可見性判定；後續改在元素存在時量測。

在實際蝴蝶階段將既有`prefers-reduced-motion`規則等效套用後，身體光源仍為`display:block`、`opacity:0.96`，實測30.9531×13.5469px（對其97.5px動畫容器即32%×14%）；圓形外圈仍為`display:block`／`opacity:0.72`，側邊外圈仍為`display:block`／`opacity:0.52`。這證實舊規則的隱藏行為已由靜態可見後備覆蓋。

## 正式建置與品質結果

完成建置後，以本地正式伺服器請求`/store-select`，回應為`200`及`Cache-Control: no-store, no-cache, must-revalidate, max-age=0`，與正式入口政策一致。完整品質流程`pnpm test && pnpm exec tsc --noEmit && pnpm build`成功：26個測試檔、86個測試皆通過，型別檢查成功，正式產物為`index-hoYqMRJ2.js`。

本批次已在桌面、手機與iPad尺寸的受控瀏覽器驗證；由於沙盒不具實體iPad Safari，未將其宣稱為真實裝置操作。發布後仍應在實體iPad Safari開啟最新網址，確認回到前景或前進／返回時會重新載入並顯示最新版本。
