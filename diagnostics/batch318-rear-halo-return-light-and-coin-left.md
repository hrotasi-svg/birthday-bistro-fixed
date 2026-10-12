# 第318批次：後方光源、返回原點光源與金幣左移

## 限定範圍與基準

本批次只處理`/store-select`的火焰後方光源正方形邊緣、蝴蝶返回原點光源的第316批次回復，以及goldan金幣向左微移。火焰來源、尺寸、位置、色彩互動、Logo、蝴蝶路徑、文字、金幣來源、8.2倍完整畫格、Y=14、透明處理、動畫及火焰後方層級均不變。

## 診斷與修正

使用者澄清後，方形邊緣的對象是火焰後方的`circular-flame-halo`與`flame-side-halo`，不是第317誤調整的`wick-light`／`connection-light`返回閃現。前兩者原本都是正方形paint box（無圓角、無裁切），在WebKit模糊合成可能顯示邊界；現只為這兩個後方光源加入`border-radius: 50%`、`overflow: hidden`與標準／WebKit `clip-path: circle(50% at 50% 50%)`。

`wick-light`與`connection-light`則精確移除第317新增的圓形裁切，回復第316的`border-radius: 0px`、`clip-path: none`、`overflow: visible`及既有關鍵影格，未修改返回時序。金幣X偏移由第317的0回到-10，僅向左10px。

## 運行期量測

實際頁面顯示後方圓形與側邊光源均為`border-radius:50%`、標準與WebKit圓形裁切及`overflow:hidden`。返回原點的wick與connection光源均為`border-radius:0px`、`clip-path:none`與`overflow:visible`，使用既有`store-select-flame-wick-light-cycle`與`store-select-flame-connection-light-cycle`。

金幣畫格為`playing-user-video`，draw bounds為x=3.22、y=57.19、793.48×446.33，完整在968×871 Canvas內，四邊安全。來源畫格中心x=329.674049px，火焰中心x=339.674049px，差值為-10px，確認只是完整畫格向左微移，不含逐枚變更。

此為受控瀏覽器測量；實體手機完整循環的最終視覺驗收仍需由使用者確認。

## 品質流程

門店頁針對性回歸（`store-select-coin-matte`、`store-select-page`及`store-select-safari-sync`）10項通過，TypeScript通過，正式建置完成，前端雜湊檔為`index-BI3wbpW-.js`。完整27檔測試在並行執行時遇到三個既有資料庫測試逾時；以單一工作者再跑後，第127付款管理與分店收銀通過，僅系統設定的5秒讀取逾時；此系統設定檔隨後隔離重跑亦7項全通過。過程未修改付款、分店、系統設定、資料庫或測試設定。此暫態TiDB／連線壅塞與本批次僅前端門店頁變更無直接程式相依性，但仍如實保留，不作單次完整測試零失敗的聲稱。
