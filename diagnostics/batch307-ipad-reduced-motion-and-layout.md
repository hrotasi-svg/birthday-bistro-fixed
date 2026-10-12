# 第307批次：iPad降低動態效果與合成層稽核

## 新增根因

第306批次仍可能無法改善部分iPad，因為iOS「減少動態效果」會命中`prefers-reduced-motion: reduce`。原規則在停用動畫後，又將圓形外圈、側邊外圈、火焰小光源、蝴蝶與金粉全部`display: none`；因此使用者即使短按成功改變React色彩狀態，也看不到外圈或蝴蝶身體光源，容易判定色彩無法變更。

第307批次改為在此偏好設定下停用運動但保留靜態可見層：圓形外圈opacity .72、側邊外圈opacity .52、火焰小光源opacity .70、蝴蝶opacity 1及固定transform。色彩切換時圓形／側邊外圈與蝴蝶元件均以新的React key重建，避開iPad WebKit重用舊合成層快取。

## 初步載入

更新後門店頁完成資料載入時，既有Logo、火焰區域、文字、門店入口與頁尾正常顯示。火焰重聚與蝴蝶可見畫格中，未見版面或導航回歸。後續將量測直接色票、火焰定位、金幣基準與跨裝置結果。

以瀏覽器暫時強制套用相同的`prefers-reduced-motion: reduce`規則驗證後，圓形外圈為`display:block`、opacity `0.72`；側邊外圈為`display:block`、opacity `0.52`；蝴蝶為`display:block`、opacity `1`；身體光源為`display:block`、opacity `0.96`。這確認important覆寫已排除原先動畫透明畫格及`display:none`導致iPad看不到光源／外圈的根因。

## 跨裝置初步驗收

iPad直向1024×1366與手機390×844完整門店頁均已檢視，兩端維持既有Logo、火焰、文字、門店入口與頁尾版面，並載入相同的直接色票、火焰右上定位及金幣左移放大程式。尚待桌面視窗檢視後完成跨裝置結論。

桌面1280×720亦已完成完整頁面檢視，未發現火焰、Logo、文字、門店入口或頁尾的版面回歸。桌面、手機及iPad視窗共用同一前端程式與無快取入口。全套品質檢查為25個Vitest測試檔、85項測試、TypeScript與正式建置通過；最後前端資產為`index-CgUkzKjm.js`。
