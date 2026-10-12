# 第319批次：後方光源漸層柔邊與金幣右移

本批次只處理`/store-select`火焰後方`circular-flame-halo`與`flame-side-halo`的邊緣感，以及goldan金幣完整畫格向右微移。其餘火焰、蝴蝶、Logo、文字、金幣來源、8.2倍縮放、Y=14、透明處理、動畫與層級均未改動。

第318的硬`clip-path:circle`雖然移除正方形paint box，卻會留下明顯的圓形裁切邊界。第319改為兩層後方光源專用的radial alpha mask：中心至52%保持完整可見，64%為0.92 alpha、78%為0.58 alpha，最後在100%漸隱為透明；同時移除硬裁切與hidden overflow。此做法保留原本模糊光暈，但讓外緣自然消散。

受控瀏覽器運行期顯示兩層後方光源的標準與WebKit mask均為預期的漸層、repeat=no-repeat、clip-path=none、overflow=visible、border-radius=0px；沒有幾何硬裁切。金幣播放狀態為`playing-user-video`，draw bounds為x=14.13、y=27.42、793.48×446.33，完整位於968×871 Canvas內。畫格中心比火焰中心左4px，表示相對第318的-10px恰好向右微移6px，沒有逐枚改動。

此為受控瀏覽器量測。實體手機完整循環的最終視覺驗收仍需使用者確認。

## 品質流程

門店頁針對性回歸（`store-select-coin-matte`、`store-select-page`、`store-select-safari-sync`）10項通過；TypeScript通過，正式建置完成，前端雜湊檔為`index-UDhkdBrl.js`。完整27檔並行回歸遇到付款管理與每月營業王兩個既有資料庫測試逾時；兩檔隨後隔離重跑，4項測試全部通過。未修改付款、每月營業王、資料庫或測試設定，因此不將並行環境的暫態逾時歸因為此僅前端門店頁變更，亦不宣稱單次完整回歸零失敗。
