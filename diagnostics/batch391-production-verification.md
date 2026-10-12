# 第391批次：正式頁驗證紀錄

此紀錄僅確認第391限定變更已傳播到正式 `/store-select`。**使用者自然觀看及明確接受仍未完成**，因此這不是最終交付，亦未執行全量測試／建置或產生11個交付檔。

| 驗證項目 | 正式頁實測結果 |
| --- | --- |
| 傳播版本 | 發布後第一次載入仍為舊邊緣快取；等待25秒並以新查詢參數重載後，正式DOM已掛載`uploaded-original-mp4-fire-only-transparent-canvas-output`。 |
| 原始素材與透明輸出 | Canvas資料來源為既有的原始MP4 `/manus-storage/store-select-user-new-flame-extinguish-20260826184233_59507f32.mp4`；資料標示為`source-frame-warm-alpha-and-fire-region-display-only-output`。隱藏來源影片`crossOrigin=anonymous`，沒有任何原檔改寫或替換。 |
| 自然末秒 | 自然循環約`16.40%`時，新Canvas opacity `.94`、真實火焰 opacity `.99`；原生MP4已實際播放至約`.463s`並具readyState `4`。Canvas和既有熄火外層的左、上、寬、高差皆為0，確認不是空白或獨立錯位容器。 |
| 可見主體 | 正式自然畫格中，新MP4正處熄火進程，保留局部火焰像素且底部錨定於真實火焰底部；完整火焰畫格在開發自然驗證中已量測對齊。來源顯示區止於原始y=820，未輸出下方蠟燭杯。 |
| 色相同步 | 預設粉色中，新Canvas與真實火焰均為`hue-rotate(270deg) brightness(1.12) saturate(1.16)`。以既有正式頁鍵盤Enter切換至藍色後，兩者均同步為`hue-rotate(180deg) brightness(1.12) saturate(1.16)`；水面同時收到`--store-select-flame-hue:180deg`，其既有輸出濾鏡亦使用同一180deg。 |
| 水面保留 | 正式自然水面時窗約`27.85%`，外層opacity `.96`；原始GIF來源、1900ms原生時長及4110ms既有循環起點均未改。 |
| 受保護內容 | 未改原始蝴蝶GIF、真實火焰本體、內外餘暈、Logo、煙霧、水面原始播放、金幣、資料庫、其他頁面或16.311秒共同循環。 |

> 第391的開發與正式技術驗證均已完成。請仍以正式頁自然觀看`23:59:59`開始的最後完整一秒融合；未收到使用者明確接受前，不得將本批次稱為最終完成或建立交付檔。
