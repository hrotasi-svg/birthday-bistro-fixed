# 第320批次：火焰煙霧微上移

本批次只修改`/store-select`的`.store-select-flame-smoke`垂直定位。原本`top:0%`改為`top:-3%`；煙霧的left、width、height、透明度、偽元素、模糊、色彩、動畫關鍵影格與所有其他門店頁元素皆未修改。

受控瀏覽器運行期量測顯示煙霧computed top為-10.5px；火焰舞台高度107.625px，換算-3%應為-3.22875px的純定位上移。煙霧仍為width 358.625px、height 168.172px、opacity 0，且沿用`store-select-flame-smoke-cycle`的7.166秒既有循環。煙霧畫面中的即時幾何還包含既有關鍵影格transform，該動畫未改動。

此為受控瀏覽器驗證。實體手機完整循環的最終視覺確認仍需使用者確認。

## 品質流程

門店頁針對性回歸（`store-select-coin-matte`、`store-select-page`、`store-select-safari-sync`）10項通過；TypeScript通過，正式建置完成，前端雜湊檔為`index-BjYKr8qV.js`。完整27檔並行回歸出現每月營業王與系統設定的既有資料庫讀寫逾時；兩檔後續隔離重跑，10項皆通過。未修改資料庫、測試設定、每月營業王或系統設定，因此不將暫態壅塞歸因於本批次僅調整煙霧top定位，亦不宣稱單次完整回歸零失敗。
