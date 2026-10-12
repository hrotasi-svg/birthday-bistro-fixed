# 第350批次：火焰處原始GIF交接稽核

本批次依使用者最新要求刪除目前可見蝴蝶特效、金粉特效與蝴蝶飛行軌跡；新上傳原始GIF只在火焰處顯示。未使用附件影像檢視工具。

| 項目 | 運行期結果 |
|---|---|
| 唯一媒體來源 | `/manus-storage/store-select-user-original-butterfly-1787586860255_b6752b8f.gif` |
| 使用者原始檔與瀏覽器資源SHA-256 | `6372cd9411b3421099b7f743b4476f0d88ea2edccc8964bdcc3dab7eeaa74032` |
| GIF自身CSS動畫 | `[]`；維持瀏覽器原生播放 |
| GIF顯示容器 | 僅`store-select-original-gif-at-fire`，動畫為`store-select-original-gif-fire-cycle` |
| GIF顯示容器變形 | `none` |
| 隱藏時序錨點 | `store-select-original-gif-cycle-clock`；透明且不含位移／旋轉路徑 |
| 舊可見飛行包裝 | `store-select-butterfly-flight-offset`數量為0 |
| 舊金粉Canvas | 0 |
| 火焰交接 | `store-select-real-flame-gif-cycle`與原始GIF顯示時間窗同步 |

新GIF二進位容器資料顯示為640×360、168影格、固定40ms影格延遲、總時長6,720ms。頁面以7,166ms循環加358ms開場火焰淡出後重掛原生GIF，使其重新自首影格播放；此設計不改寫任何GIF影格。

限定門店頁回歸7/7及型別檢查已通過。使用者畫面驗收、跨裝置檢視、完整回歸、正式建置與交付仍未進行；本稽核不代表任務完成。

在原始GIF顯示時間窗的5.2%節點，運行期量測結果為：GIF顯示容器透明度1、`transform:none`；火焰透明度0；隱藏時序錨點亦為`transform:none`；GIF自身CSS動畫0；舊金粉Canvas0。頁面畫面檢視可見新原始GIF停在火焰處，不含外層飛行位移或舊金粉呈現。此畫面檢視不使用附件影像檢視工具。

既有火焰互動的粉紫步驟目前使用紫色輸出：新GIF的輸出濾鏡含`rgba(142,83,255,.76)`光芒及`rgba(212,169,255,.42)`柔光。下一個藍色步驟中，新GIF輸出為`hue-rotate(230deg)`、`rgba(54,147,255,.76)`青藍光芒及`rgba(160,222,255,.42)`柔光；GIF變形仍為`none`、舊金粉Canvas為0、舊飛行包裝為0。
