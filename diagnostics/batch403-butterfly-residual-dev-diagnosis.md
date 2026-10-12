# 第403批次：蝴蝶右下殘影開發端診斷

原始蝴蝶GIF本身只掛載一次，來源、內層`left:-406%`、`top:-87.0625%`、`width:690%`、`scaleX(-1)`及25.6%至66.7%可見窗口均未變。

在蝴蝶外層自身動畫進度0.25096（可見窗口前），實測外層為opacity0、visibility hidden，內層GIF亦為visibility hidden；相鄰金粉、煙火、火焰光點、金幣與餘燼輸出皆為opacity0。進度0.26745進入既有可見窗後，外層才為opacity1與visibility visible。故原始GIF沒有在出現前直接輸出。

本次只在外層加上isolation與opacity／visibility合成提示、背面隱藏，讓瀏覽器在visibility hidden期間不保留前次合成畫面；內層GIF的來源、位元組、畫面、位置、大小、方向、拍翅、速度、時窗與原生播放均不改。這是開發端技術紀錄，仍待正式頁與使用者自然觀看確認。

另釐清00:00:00的原生熄火重播時間：動畫物件的`currentTime`包含3.6秒CSS延遲，因此活動時窗3116ms對應共同時鐘6716ms。事件式監測在共同時鐘6779.738ms讀到原生影片由0.014243秒開始且`paused=false`、`readyState=4`；420毫秒後時間碼為0.394770秒、仍播放中。這證明原生重播依既有00:00:00接續執行，先前把共同時鐘延遲誤當活動時鐘的讀值不應作為調整播放的依據。

開發頁DOM檢查確認：`.store-select-original-gif-at-fire .store-select-uploaded-butterfly-gif`數量為1；`.store-select-webgl-butterfly-canvas`、`.store-select-webgl-butterfly-tail-anchor`及`.store-select-butterfly-tail-anchor`數量均為0。因此頁面沒有第二個蝴蝶畫布或尾部元素可在右下輸出；殘像防護只施加於唯一原始GIF的外層合成閘門。
