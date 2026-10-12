# 第382批次正式頁驗證紀錄

正式頁：`https://bistrofix-zqj3rdaj.manus.space/store-select?batch382-production-verify=3`。

> 本紀錄正在補充正式自然循環驗證；尚未取得使用者自然觀看與明確驗收。本批次不是最終交付，未建立11個交付檔案。

| 項目 | 正式頁已驗證證據 |
| --- | --- |
| 已部署第382設定 | 發布傳播完成後，正式DOM讀得原始蝴蝶`data-butterfly-prewarm-ms="0"`、熄火計算矩陣`matrix(2.75918,-.0674328,.0410461,1.6795,-7.26344,0)`、上方煙霧矩陣`matrix(2,0,0,2,0,0)`、水面z-index`6`與Logo z-index`5`。 |
| 蝴蝶首現前殘像 | 正式自然25.15%凍結時，蝴蝶外層為`opacity:0`／`visibility:hidden`，唯一內層原始GIF繼承hidden並保持`animation:none`與原始來源。畫面中Logo右下角沒有蝴蝶殘像。 |
| 熄火與水面自然窗口 | 正式自然27.71%時，熄火opacity`.92`，計算矩陣為`matrix(2.75918,-.0674328,.0410461,1.6795,-7.26344,0)`，原點仍為容器下方中心；水面opacity`.96`、z-index`6`，Logo z-index`5`，水面原始資料標記仍為1900ms。畫面確認熄火／水面窗口正常顯示。 |
| 上方煙霧自然窗口 | 正式自然42.83%時，上方煙霧opacity`.74`、矩陣`matrix(2,0,0,2,0,0)`、原點為容器下方中心，仍使用原始`store-select-user-top-smoke-1787703022685_5618fa6b.mp4`與`browser-native-original-speed`。顯示畫面未見不透明黑色舞台。 |

限定Vitest回歸測試7/7及`pnpm exec tsc --noEmit`已於開發驗證通過。正式驗證的暫時凍結將在結束後重新載入清除；仍須使用者自然觀看並明確驗收。
