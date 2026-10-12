# 新Logo影片檢查紀錄

## 2026-09-02 最新高畫質影片

輸入檔案為`/home/ubuntu/upload/lv_0_20260902173549.mp4`。影片技術資料為H.264、1440×1080、30fps、472 frames、15.733333秒、yuv420p，SHA-256為`05539f89f7ecd26c72af711520105913feca5b4e4e285f5399a921da96beb1d8`。

首段抽樣影格顯示完整Logo、火焰與水面倒影集中於畫面中央，周圍為黑色背景；中段抽樣影格顯示煙霧、蝴蝶、煙火、生日文字、Logo與水面倒影均已整合在同一畫面，周圍仍為黑色背景。這代表前台應以一個原生`video`節點載入原始位元組，使用`mix-blend-mode: screen`作顯示端黑底透明化，不應再次拆成多個子層或修改影片幀。

目前顯示端來源應更新為最新影片的持久儲存路徑；上傳前後必須以SHA-256核對，並以原生播放速度循環，不變更472幀、30fps或15.733333秒時長。

## 共用Responsive根因紀錄

原本`/main`與`/store-select`各自以portrait `aspect-ratio`把整個頁面當作Mobile長畫布；Desktop／橫向iPad沒有共用的視口適配，且MainFunction新參考框曾以CSS無法有效計算的`1080 / 2280`自訂屬性值，造成實際高度為0，背景及按鈕矩形也全部為0。修復後兩頁共用`.bistro-portrait-shell`：直向Mobile／App維持全寬及原比例；橫向Desktop／iPad以可用視口高度建立等比參考框，水平置中並保留黑色letterbox，不再把Mobile長畫布拉成Desktop全寬或因字串比例導致零高度。MainFunction使用數值比例`0.4736842105`，StoreSelect使用`0.4733292465`。

新影片前台現在只有一個`<video data-composite-logo-renderer>`來源，來源為最新上傳影片；舊分層節點未掛載。顯示端以`mix-blend-mode: screen`移除黑底，影片使用`autoPlay`、`loop`、`muted`、`playsInline`、`preload=auto`，不重編碼、不改472幀、30fps、15.733333秒及原生播放速度。

## 首頁Desktop量測

最新開發預覽在瀏覽器`1280×1100`視口下，首頁根內容寬1265px、高1526.28125px，主標題實際字級60px／行高60px，首頁Logo約72×88.625px，未發現文字覆寫資料寫回（`data-ov-base-font-size`數量為0）。首頁不是與主功能／StoreSelect相同的Portrait畫布；其背景由共用背景注入器以`cover`固定套用，內容採一般流式`max-w-4xl`。因此本輪共用根因修復集中於兩個固定Portrait頁框，不改首頁流式內容與背景設定，避免影響現有Mobile/App視覺。

## 2026-09-02 四視口回歸進度

- 最新影片本地檔與專案外封存檔 SHA-256 均為 `05539f89f7ecd26c72af711520105913feca5b4e4e285f5399a921da96beb1d8`；ffprobe 為 H.264、1440×1080、30 fps、472 frames、15.733333 秒、18,779,340 bytes。
- 持久儲存 URL 以 HTTP 307 轉址後回應 `200 video/mp4`，Content-Length `18779340`，支援 Range，未見影片請求錯誤。
- StoreSelect DOM 只有一個 `data-composite-logo-renderer` 與一個 `<video>`，目前預覽影片為 `readyState=4`、原生播放、依單擊切換至藍色色相；不存在前台舊分層影片節點。
- 390×844 App 等效視口：首頁與主功能頁維持原Portrait內容比例；StoreSelect的單一Logo影片與門店文字仍在同一設計參考框內。
- 1024×768 iPad橫向視口：首頁使用桌面／平板視口背景比例，主功能頁以置中Portrait參考框顯示，StoreSelect不再以全寬Mobile長頁拉伸；仍需完成Desktop實際量測與App原生包來源核查，不能以此紀錄宣稱四裝置全部完成。

## 2026-09-05 本輪影格觀察
最新影片為1440×1080合成畫面：黑底、中央蛋糕Logo與火焰、下方水面倒影；特效時段另含煙火、蝴蝶、煙霧及生日文字。黑底可由`mix-blend-mode: screen`在顯示端去除，但金色蛋糕Logo與其他金色細節已和動畫合併於同一影片，不能對整支影片套用`hue-rotate`，否則會一併變色。後續若需控制色彩，只能採局部遮罩或保持影片原色的合成方式；本次不修改影片原始幀、幀率或播放速度。

## 2026-09-05 後段影格觀察
後段影格仍保留中央金色蛋糕Logo、白色美元符號、白色Birthday bistro字樣與水面倒影；蝴蝶／煙火等效果出現在其上方或側方。金色Logo不是獨立DOM層，而是新影片內的像素，因此全影片`hue-rotate`會誤染蛋糕圖標。後續變色實作須使用局部火焰遮罩或保持合成影片原色，不能以全片濾鏡控制。
