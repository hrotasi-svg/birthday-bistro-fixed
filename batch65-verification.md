# Batch 65 驗證紀錄

- `/store-select` 實際載入成功，頁面包含指定黑色背景 `/manus-storage/IMG_6293_058c34e0.PNG` 與疊加Logo `/manus-storage/IMG_6294_ee61b4e3.PNG`。
- 桌面完整長版與 375×812 行動版均確認：上方背景Logo保留；新增Logo位於黑色中間偏右、門店文字上方；蠟燭火焰可見；返回首頁仍可見。
- 瀏覽器互動測試點擊既有門店入口成功導向 `/main`；主功能頁既有按鈕仍顯示。
- `pnpm test -- --run server/store-select-page.test.ts` 實際結果：19個測試檔、62個測試全部通過；`pnpm exec tsc --noEmit` 通過。

補充驗證：從 `/store-select` 點擊「返回首頁」成功導向 `/`；從 `/store-select` 點擊既有門店選項成功導向 `/main`。

執行期驗證：背景圖片與Logo `complete: true`；Logo動畫為 `store-select-logo-reveal`；Glitch圖層數為3；蠟燭火焰存在，動畫為 `store-select-flame-appear, store-select-flame-sway`。
