# 第309批次：iPad同步與全體金幣尺寸根因追查

## 正式站初始觀察

正式`/store-select`首次載入先顯示「載入門店中…」，數秒後正確轉為「限量席位・僅憑邀請 ＞」，顯示分店資料本身可完成初始化。首個受控桌面瀏覽器畫面在動畫時序中可見火柴頭與外圈，尚不可據此推論實體iPad的蝴蝶／火焰／金幣顯示；後續須分別檢查正式入口、內容雜湊資產、iOS降低動態效果、Safari頁面恢復與單一影片Canvas的尺寸計算。

正式入口無快取且目前實際載入的`index-BAlHLvpF.js`已包含第308批次`pageshow.persisted`與金幣7.8倍標記，故並非正式部署仍停留在第307或更早的程式。受控瀏覽器運行期量測身體光源為30.9531×13.5469px（父容器96.7656px，等於32%×14%）、金幣唯一drawWidth為754.771875px、金幣父容器z-index4且火焰z-index6；未發現控制頁面的Service Worker或註冊項目。

因此目前優先追查Safari在背景停留後未觸發`pageshow.persisted`、使舊記憶體頁沒有重新取得入口HTML的情境；須改為只在`/store-select`於回到前景或可見狀態時比較伺服器目前雜湊資產，若不同才重新載入，避免將一般動態播放視為舊版。

第309批次開發頁首次載入同樣先顯示資料載入狀態，隨後已正常顯示「限量席位・僅憑邀請 ＞」、Logo舞台、真實火焰與互動Canvas；後續量測將在該完成初始化的狀態進行。

新版運行期量測金幣唯一drawWidth為658.00625px（96.7656px錨點容器×6.8），尺寸標記為`batch309-batch304-reference-6.2-uniformly-enlarged-to-6.8-left-offset-minus-10`；金幣Canvas仍為`pointer-events:none`、容器z-index4，火焰z-index6。火焰來源狀態`ready`、可見畫格4308，定位實測left 14.5156px／top -105.094px（對應5.1%／-30%），火柴頭小光源top 55.3438px（對應15.8%）。互動Canvas會依循環階段暫時消失，故短按驗證須在其重新可見時進行。

直接以標準Click備援短按後，火焰類別由粉色改為藍色，蝴蝶身體光源、圓形外圈與側邊外圈的inline直接徑向漸層同步改為藍色色票，頁面仍維持`/store-select`。合成Pointer事件不等同瀏覽器原生觸控手勢，僅作輔助觀察；仍須在實體iPad Safari以真實短按確認。

觸控備援路徑亦已以`touchstart`／`touchend`事件驗證：火焰由藍色切至青色，身體光源直接色票同步更新且仍停留門店頁。第309批次完整流程`pnpm test && pnpm exec tsc --noEmit && pnpm build`成功，26個測試檔、86個測試均通過，正式產物為`index-BDpgRHQU.js`。

本地正式伺服器`/store-select`回應`200`與`Cache-Control: no-store, no-cache, must-revalidate, max-age=0`，回傳的入口明確指向`/assets/index-BDpgRHQU.js`。第309版會在此路徑的頁面獲得焦點、由背景恢復可見或一般pageshow時，以`cache:no-store`且帶版本探針的入口比對目前雜湊；僅不相同才重新載入。因此即使Safari沒有提供`pageshow.persisted`，背景中保留的舊記憶體頁也會在回到前景時自我更新。

本地正式建置門店頁已正常開啟並進入資料初始化流程，下一步將以該正式產物量測焦點恢復時的版本探針請求，避免僅以原始碼或開發伺服器推論。

在本地正式建置中，頁面實際載入`index-BDpgRHQU.js`。派發焦點恢復後，`__release_probe`資源請求數由1增加到2，最新請求為`/store-select?__release_probe=<timestamp>`；此結果驗證版本探針在正式產物中確實執行。若伺服器回傳的新入口雜湊不同，程式才會重新載入，因此正常前景恢復不會反覆強制重整。
