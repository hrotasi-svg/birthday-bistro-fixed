# 第351批次：已發布網站與開發預覽版本差異

使用者回報「網站完全沒有變化」後，直接檢查已發布網域`https://bistrofix-zqj3rdaj.manus.space/store-select`。

| 項目 | 已發布網域實際結果 | 開發預覽預期結果 |
|---|---|---|
| 蝴蝶GIF來源 | `store-select-latest-user-original-butterfly_90292560.gif`（舊檔） | `store-select-user-original-butterfly-1787586860255_b6752b8f.gif`（新檔） |
| 顯示呈現標記 | `uploaded-original-gif-native-screen`（舊呈現） | `uploaded-original-gif-native-fire-position`（火焰處直載） |
| 舊飛行包裝 | 1 | 0 |
| 舊金粉Canvas | 1 | 0 |

結論：使用者看到的已發布網域仍是最後一個已儲存版本，未含本地尚未儲存的第350變更。此前以開發預覽的核對不等於使用者實際網站驗證；此文件僅記錄差異，不代表問題已修復。

## 部署切換後復核

第350／351中間版本`1728cc67`在部署延遲後已完成正式網域切換。以查詢參數重新開啟`/store-select?v=1728cc67-r2`並讀取正式DOM，結果如下：

| 項目 | 已發布網域切換後結果 |
|---|---|
| 原始GIF來源 | `store-select-user-original-butterfly-1787586860255_b6752b8f.gif` |
| 顯示呈現標記 | `uploaded-original-gif-native-fire-position` |
| GIF元素數 | 1 |
| 舊可見飛行包裝 | 0 |
| 舊金粉Canvas | 0 |
| 無位移時序錨點 | 1 |

這僅證明正式網域已更新至供使用者核對的中間版本，未代表視覺要求或完整任務已驗收。
