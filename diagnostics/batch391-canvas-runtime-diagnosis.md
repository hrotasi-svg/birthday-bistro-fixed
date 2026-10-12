# 第391批次：熄火Canvas執行期診斷

本記錄僅記載開發環境量測，不代表使用者驗收或任務完成。檢查範圍嚴格限於 `/store-select` 的新上傳原始熄火MP4之**瀏覽器端顯示輸出**；原始MP4位元組、真實火焰、原始蝴蝶GIF、內外餘暈、Logo、煙霧、水面、金幣、資料庫、其他頁面與共同16.311秒循環均未修改。

| 時點 | 實測結果 | 影響 | 已採取的限定修正 |
| --- | --- | --- | --- |
| 初次Canvas掛載 | Canvas維持瀏覽器預設300×150且無濾鏡；檢查CSSOM後確認新規則誤巢狀於`video`選擇器。 | Canvas無法填滿既有熄火容器。 | 只補上缺少的大括號，並令Canvas以`position:absolute; inset:0; width:100%; height:100%`填滿既有外層。 |
| 原始MP4取樣 | 原始`/manus-storage`影片經儲存服務轉址後，未使用CORS模式的`getImageData()`出現`SecurityError: canvas has been tainted by cross-origin data`。 | 暖色透明matte無法輸出。 | 僅在隱藏取樣用`video`載入前加入`crossOrigin="anonymous"`，不改來源檔或URL。重載後已可讀取原始畫格像素。 |
| 自然末秒週期 | 以掛載時間`setTimeout()`啟動的取樣影片仍停在0秒，未與既有CSS延遲及動畫週期精確掛合。 | 自然熄火窗可能空白。 | Canvas改讀既有熄火外層唯一CSS動畫進度，在12.9%開始和原生影片時長終點間播放；共同時鐘及CSS延遲未改。 |
| 自然12.9%後量測 | CSS進度約16.17%時，Canvas為330×224並有325個不透明畫素；原始MP4約0.475秒且處於播放中，Canvas與既有熄火外層的視窗幾何差為0。 | 確認取樣輸出已非空白，仍需在完整原生時段檢視實際可見主體與真實火焰對位。 | 保留進行中的定位與色相驗證；尚未保存checkpoint。 |

> 後續只允許調整 `StoreSelectExtinguishFlameCanvas.tsx` 的來源／目標火焰區與顯示matte，或該Canvas自己的播放健壯性。不得以移動真實火焰、蝴蝶或其他既有圖層來補償。
