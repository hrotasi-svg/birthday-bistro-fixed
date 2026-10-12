# 第322批次：煙霧微上移且保留第319光源時序

本批次僅將`.store-select-flame-smoke`從`top:0%`調為`top:-2%`。其left、width、height、opacity、偽元素、filter、動畫名稱及7.166秒循環皆不變；火焰、光源、蝴蝶、金幣、Logo與文字未修改。

受控瀏覽器量測：煙霧computed top為-7px，width 358.625px、height 168.172px，仍使用`store-select-flame-smoke-cycle`。在循環60%（蝴蝶尚未到原點，translation約x=-40.64px、y=7.74px，opacity .63）採樣時，wick與circular halo opacity皆為0；確認煙霧定位調整沒有改變第319的返回光源時序。

此為受控瀏覽器驗證；實體手機完整循環的最終視覺確認仍需使用者確認。

390×844手機視窗與重新開頁皆可正常載入門店頁，靜態畫面未見返回核心光源提前持續顯示。此檢視不取代實體手機完整循環驗收。

## 品質流程

門店頁針對性回歸（`store-select-coin-matte`、`store-select-page`、`store-select-safari-sync`）10項通過；TypeScript通過，正式建置完成，前端雜湊檔為`index-D0lJQ9pR.js`。完整27檔並行回歸僅每月營業王的既有資料庫讀寫測試在固定5秒上限逾時；以未修改的20秒命令列逾時參數重跑後，該檔3項皆通過。未修改每月營業王、資料庫或測試設定，不將此暫態延遲歸因於本批次僅調整煙霧top，亦不宣稱單次完整回歸零失敗。
