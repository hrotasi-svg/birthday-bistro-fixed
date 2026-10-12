# 第321批次：精確回復第319火焰設定

使用者回報第320後蝴蝶返回原點前光源提早亮起。比對第319（`fabf4bd`）與第320（`8f294cd`）所有實際火焰、煙霧、蝴蝶及金幣實作檔案後，唯一火焰差異為`.store-select-flame-smoke`從`top:0%`改為`top:-3%`；其他火焰、光源、關鍵影格、蝴蝶與金幣程式均無差異。第321僅將此top值及對應回歸斷言回復為`0%`。

回復後，`StoreSelectPage.tsx`、`StoreSelectRealFlameCanvas.tsx`、`StoreSelectButterflyWebGL.tsx`與`StoreSelectCoinSprayVideo.tsx`相對第319逐檔比對為零差異。受控運行期時間採樣：在循環60%時蝴蝶仍離原點（translation約x=-40.64px、y=7.74px），wick與circular halo opacity皆為0；在66.8%時蝴蝶已回原點（translation 0、opacity .02），wick opacity為1、circular halo opacity為.78。這與第319既有時序相符，並確認核心光源不會在返回途中提前亮起。

此為受控瀏覽器驗證；實體手機完整循環的最終視覺確認仍需使用者確認。

390×844手機視窗已重新檢視，門店頁可正常載入，靜態循環畫面未見返回核心光源提前持續顯示。重開頁面後亦可正常載入；此視窗檢視不取代實體手機完整循環驗收。

## 品質流程

門店頁針對性回歸（`store-select-coin-matte`、`store-select-page`、`store-select-safari-sync`）10項通過；TypeScript通過，正式建置完成，前端雜湊檔為`index-UDhkdBrl.js`。完整27檔並行回歸中，僅既有每月營業王測試在固定5秒上限發生資料庫讀寫逾時；它以未修改的20秒命令列逾時參數重跑後，該檔3項全部通過。未修改每月營業王、資料庫或測試設定，不將此環境延遲歸因於本批次第319火焰回復，亦不宣稱單次完整回歸零失敗。
