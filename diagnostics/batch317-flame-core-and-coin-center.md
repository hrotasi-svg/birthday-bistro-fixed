# 第317批次：火焰內部光源柔邊與金幣火柴中心

## 限定範圍

本批次只處理`/store-select`兩個指定項目：火焰內部光源的正方形邊緣感，以及goldan金幣向右微移至火柴中心。火焰來源、尺寸、其他位置、色彩互動、Logo、蝴蝶、文字、金幣來源、動畫、全畫格8.2倍率、Y=14、透明處理與火焰後方層級均不變。

## 診斷與修正

實際DOM量測顯示`store-select-flame-wick-light`與`store-select-flame-connection-light`原本皆是正方形paint box（`border-radius: 0`、`clip-path: none`），即使背景為徑向漸層，WebKit的模糊合成仍可能顯示方形邊緣。兩者現均採`border-radius: 50%`、`overflow: hidden`與標準／WebKit `clip-path: circle(50% at 50% 50%)`，保留原漸層、濾鏡、動畫與位置。

金幣完整來源畫格僅將X偏移由-10改為0，直接對齊既有火焰Canvas中心；並未個別移動或縮放任何來源畫格內的金幣。

## 運行期驗證

播放時，兩層光源均回報`border-radius: 50%`、`clip-path: circle(50% at 50% 50%)`、WebKit相同裁切與`overflow: hidden`。goldan金幣畫格為`playing-user-video`，drawWidth=793.478125px，畫格x=17.41、y=19.81、793.48×446.33，完整位於968×871 Canvas內；left、top、right及bottom均為true。畫格中心x=343.870773px，火焰中心x=343.870773px，水平差為0px。

此為受控瀏覽器驗證；實體手機播放時的最終視覺確認仍保留給使用者。

## 品質流程

第317變更後，針對性回歸（`store-select-coin-matte`、`store-select-page`、`store-select-safari-sync`）10項通過；完整品質流程為27個測試檔、88項測試全部通過，TypeScript無錯誤，正式建置完成，前端雜湊檔為`index-B4egfhud.js`。390×844手機視窗亦重新檢視；其靜態畫面未見內部光源方形邊界。實體手機的完整播放循環仍需由使用者確認。
