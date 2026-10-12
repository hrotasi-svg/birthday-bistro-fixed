# 第338批次：原生GIF慢速播放、回程與同步光源稽核

## 已確認的實際運行狀態

門店頁只掛載一個原生 `IMG`，來源為 `/manus-storage/store-select-latest-user-original-butterfly_90292560.gif`。元素資料屬性為 `data-butterfly-playback="browser-native-original-speed"` 與 `data-butterfly-matte="native-luminance-key-transparent-black-silhouette-glow"`，沒有 Canvas、WebGL 或第二隻蝴蝶視覺層。

顯示層沒有播放速率控制、影格抽取或重繪。原生GIF保留瀏覽器原始播放；回程與金粉／金幣仍讀取既有 `store-select-flame-butterfly-side-profile-cycle` 7.166 秒容器。

## 回程定位檢查

以瀏覽器 Web Animations 在回程弧段約 37% 受控停駐時，外層與同步內層皆為既有 7.166 秒、3.6 秒延遲的動畫。唯一 GIF 尺寸約 421.7×464.1 px；內層只保留小幅左移以避免雙重加速，光源由同一個帶亮度鍵控的 GIF `drop-shadow` 輸出，不存在脫離蝴蝶的 `::before` 圓形光斑。

## 待完成

仍需在完整循環中重新檢視慢速感、弧線收束、黃色翅膀同步及首頁指定文字組下移，並完成完整回歸、型別、建置與交付封存驗證後才可保存候選版。

## 第二輪實際畫面檢查

重新載入門店頁後，以 Web Animations 在回程中段受控停駐。唯一原生 GIF 的實際可見尺寸約為 654.6×377.2 px；容器維持 `store-select-flame-butterfly-side-profile-cycle`（7.166 秒、3.6 秒延遲）。顯示層為原生來源、亮度鍵控、原始瀏覽器播放標記與兩層同影像 `drop-shadow`，`store-select-butterfly-flight-offset::before` 的計算 `content` 為 `none`，表示不存在舊的脫離式圓形光源。

首頁檢視確認指定主標／副標／三行說明由 `mt-4` 變為 `mt-7`，只向下微移；其餘首頁內容未在此批次變動。
