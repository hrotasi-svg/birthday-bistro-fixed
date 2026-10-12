# 第384批次開發驗證紀錄

開發頁：`https://3000-i33gngk9349egagnbij70-e32c525f.sg1.manus.computer/store-select?batch384-dev-verify=1`。

> 本紀錄僅涵蓋開發頁。正式網域與使用者自然觀看尚未驗證；本批次不是最終交付，未建立11個交付檔案。

| 項目 | 以Logo火柴頭固定參照的開發證據 |
| --- | --- |
| 固定參照 | Logo火柴頭光點中心固定為x=316.77、y=860.42。定位過程未變更Logo、火焰本體、原始蝴蝶GIF或共同循環。 |
| 熄火向左 | CSS left由−30%改為−40%，自然27.71%時容器左界由−221.48px移至−249.95px；opacity.92、雙倍矩陣及下方中心原點不變。自然畫面中可見起始主體位於火柴頭正上方。 |
| 上方煙霧向右 | CSS left由32%改為42%，自然46.56%時容器左界由99.61px移至128.06px；opacity.74、雙倍矩陣、下方中心原點與既有上緣遮罩不變。暫時解除遮罩／鍵控的原始MP4診斷顯示，其下方主煙起點已落於火柴頭上方；正式輸出恢復遮罩後僅保留該主煙。 |
| 自動化檢查 | `pnpm exec vitest run server/store-select-page.test.ts --pool=threads --poolOptions.threads.singleThread --testTimeout=40000`：7/7通過。`pnpm exec tsc --noEmit`：通過。未執行全量測試或建置。 |

原始蝴蝶GIF、熄火／煙霧檔案、透明鍵控、倍率、時間窗、火焰本體、內外餘暈、水面、Logo、既有金幣、資料庫、其他頁面及共同16.311秒循環均未修改。
