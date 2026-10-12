# 第382批次開發驗證紀錄

開發頁：`https://3000-i33gngk9349egagnbij70-e32c525f.sg1.manus.computer/store-select?batch382-dev-final-verify=1`。

> 此紀錄僅涵蓋開發頁。正式網域驗證與使用者自然觀看尚未完成；本批次不是最終交付，未建立11個交付檔案。

| 項目 | 開發自然共同時鐘證據 |
| --- | --- |
| 蝴蝶首現前右下角殘像 | 自然25.23%時，原始蝴蝶外層為`opacity:0`／`visibility:hidden`；內層原始GIF因繼承同一visibility而不參與繪製，仍維持原來源、`left:-406%`、`top:-87.0625%`、`width:690%`與`animation:none`。畫面未見Logo右下角蝴蝶形狀。這是既有25.6–66.7%父層時窗上的輸出隔離，沒有裁切或改寫GIF。 |
| 蝴蝶既有正式出現 | 直接恢復外層共同CSS動畫後，自然26.29%外層為`opacity:1`／`visibility:visible`，內層仍為單一原始GIF來源與`animation:none`，確認輸出閘門沒有變更原始GIF的影格、速度、方向或新增任何子層動畫。 |
| 熄火特效放大一倍 | 實際計算矩陣為`matrix(2.75918,-.0674328,.0410461,1.6795,-7.26344,0)`，對應既有旋轉後的`scale(2.76,1.68)`；transform-origin仍為`50% 100%`。原始MP4、色相、鍵控與25.2–33.6%時窗未改。 |
| 上方煙霧放大一倍 | 自然42.75%時煙霧opacity`.74`，實際計算矩陣為`matrix(2,0,0,2,0,0)`，原點為容器下方中心；顯示遮罩、原始MP4、42.4–55.1%時窗及共同週期未改。 |
| 水面位於Logo圖層外 | 計算z-index為水面`6`、Logo`5`。水面原始GIF、位置、尺寸、透明鍵控、4110ms起點及1.90秒獨立原生播放時長均未改。 |
| 自動化檢查 | `pnpm exec vitest run server/store-select-page.test.ts --pool=threads --poolOptions.threads.singleThread --testTimeout=40000`：7/7通過。`pnpm exec tsc --noEmit`：通過。未執行全量測試或建置。 |
| 手機比例首屏 | 375×812開發截圖正常載入Logo、火焰、文字與返回首頁，未出現黑色舞台或版面溢出；正式自然循環的行動版特效時點仍待驗證。 |

原始蝴蝶GIF、熄火MP4、上方煙霧MP4、水面GIF、火焰本體、內外火焰餘暈、Logo、既有金幣、資料庫、其他頁面及16.311秒共同循環均未變更。
