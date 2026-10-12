# 第325批次：上傳GIF替代網站蝴蝶

受控運行期量測確認，上傳GIF已載入（natural 640×360），使用`mix-blend-mode: screen`，因此GIF原有黑色背景不會形成獨立黑色外框。GIF保留在原`.store-select-flame-butterfly`飛行容器內，且`butterflyRef`與尾端`butterflyTailRef`均存在；金粉及金幣仍可依原有7.166秒容器動畫讀取位置與循環進度。

量測時容器被暫停於受控播放狀態，GIF可見盒為約67.43×63.31px，尾端錨點約0.41×0.41px。後續以實際手機視窗與完整循環確認最終視覺位置。

在固定容器為可見的受控檢視中，GIF自然尺寸為640×360，顯示盒為約512.84×288.47px，`mix-blend-mode`為`screen`。此合成方式令GIF的純黑背景與門店黑色舞台相乘後不形成方形外框；該受控靜態檢視僅用於確認合成，完整循環仍由實際頁面驗收。

受控畫面檢視可見粉紫鑽石蝴蝶位於既有蝴蝶容器之內，周圍未見GIF黑色方形外框；火焰舞台、Logo與文字未因GIF替代而改變。

## 品質流程與交付盤點

門店頁針對性回歸（`store-select-coin-matte`、`store-select-page`、`store-select-safari-sync`）10項通過。完整27檔、88項回歸初跑時，既有分店與系統設定資料庫測試受固定5秒上限影響逾時；兩檔以20秒上限獨立重跑後，分店4項與系統設定7項全數通過。TypeScript無錯誤，正式建置完成，前端雜湊檔為`index-BAiaDFnW.js`。

初次僅查看專案根目錄時，11項檔案並未出現；後續擴大至工作區盤點後，在既有第291批次交付集找到完整11檔。第325交付集的`website-source.tar.gz`已改用本次驗證後重新產生的來源封存；資料庫SQL、Android／iOS專案封存、APK、AAB、keystore與4份文件皆已驗證存在、非零大小，且對應的tar/ZIP/APK容器檢查通過。Android與iOS的`capacitor.config.json`皆設定正式站`https://bistrofix-zqj3rdaj.manus.space`，因此應載入本次已發布的網站版本；APK與AAB本身仍應由使用者以實體裝置／商店測試軌道最終確認。

發布後以桌面1280×720與手機390×844再度擷取`/store-select`。桌面維持門店選擇的黑色舞台，手機擷取時處於既有的「載入門店中」循環起始階段；兩種視窗均未出現GIF原始黑色矩形外框。此檢視不取代實體裝置播放完整7.166秒循環的最終確認。

第326批次實際瀏覽器暖機檢視顯示，門店頁能載入既有火焰、Logo、文字與按鈕版面；畫面處於火焰可見階段時未見蝴蝶層的黑色矩形。後續驗證將僅以暫停既有CSS動畫的受控方式檢視返回弧線，不寫入或改變任何火焰／蝴蝶定位與時間設定。

第一次受控檢查確認蝴蝶畫布與軌跡畫布的CSS背景皆為透明，且掛載的動畫名稱仍是原`store-select-flame-butterfly-side-profile-cycle`。瀏覽器檢查軌跡像素時發現畫布可能受跨來源來源限制而不允許`getImageData`；這表示修正必須避免依賴Canvas像素讀回，並以CORS安全的透明GIF來源或不讀回像素的繪製方式完成，尚未視為修復完成。

完成跨來源安全備援後，受控將原蝴蝶動畫停在返回中段，瀏覽器回報進度約`0.569`，包裝容器仍由原動畫控制（opacity約`.917`、transform含既有返回位移）。GIF畫布背景與軌跡畫布背景皆為透明；GIF使用`screen-composite-fallback-no-pixel-readback`，不會因像素讀回受限而中斷循環。軌跡狀態為`uploaded-gif-following-existing-return-arc`。同一檢查中，粉色火焰已使蝴蝶與軌跡濾鏡使用粉色glow與對應hue shift，未對火焰設定寫入任何變更。

為徹底移除仍可見的原GIF近黑舞台，已將使用者原GIF以確定性近黑鍵控轉為640×360、25fps、可循環的透明APNG。動畫WebP輸出無法由解碼器讀取，已捨棄不使用；APNG可解碼。首幀在白底合成檢視中只剩粉紫鑽石蝴蝶及其原有細節，原黑色舞台不存在，因此可作為不改動蝴蝶內容、只移除黑框的來源。

透明APNG上傳後，重新載入門店頁並停在原返回段中段：進度約`0.571`、原包裝容器opacity約`.903`，來源畫布仍為640×360，正式頁資源記錄確實包含透明APNG。GIF畫布與軌跡畫布CSS背景均為透明，返回軌跡狀態仍為`uploaded-gif-following-existing-return-arc`。這項檢查確認透明來源、既有弧線容器與軌跡層同時運行；下一步以畫面檢視確認不存在可見矩形。

在同一受控返回中段畫面中，可見蝴蝶已不帶原GIF的黑色矩形舞台；僅保留小型粉紫蝴蝶與既有火焰後方光暈。其後已重新載入頁面，恢復原循環，準備以原火焰互動驗證蝴蝶與軌跡的色彩同步。

以既有火焰點選控制切換後，實際頁面火焰與蝴蝶容器同時取得`store-select-flame-color-blue`，火焰hue為`180deg`。蝴蝶GIF與返回軌跡的computed filter均為藍色光芒（`rgb(54,147,255)`及`rgb(160,222,255)`），且兩者分別使用對應hue shift與同一藍色glow。此驗證只觸發原有點選行為，未寫入或修改火焰設定。

藍色狀態下再次將既有蝴蝶動畫停在返回中段（progress約`.576`）並檢視畫面：蝴蝶呈現為藍綠色光芒與藍色調的鑽石翅膀，沒有原GIF的黑色矩形；蝴蝶仍位於原CSS返回弧線所決定的位置，未有位置或關鍵影格被修改。

第327批次依使用者最新「原始上傳檔不可修改」要求，已停止使用透明APNG衍生檔，改由原`store-select-pink-diamond-butterfly_45be91c9.gif`直接載入。受控返回中段檢查回報：原始GIF已載入、透明APNG未載入、畫布來源尺寸維持640×360、renderer與pixel mode皆為`uploaded-original-gif-no-pixel-modification`／`raw-original-gif-no-pixel-modification`。原蝴蝶CSS動畫名稱、約`.571`返回進度與軌跡狀態`uploaded-gif-following-existing-return-arc`均維持，未修改飛行容器、關鍵影格或來源影格內容。

直接顯示原始GIF的受控返回畫面，保留了使用者原始檔本身的黑色舞台矩形與粉紫蝴蝶；此矩形是未經鍵控或裁切的原始來源內容，而非新建立的網站元素。由於最新要求明確禁止變更上傳原蝴蝶設定，本批次不對該原始影格進行透明化、裁切或調色；既有火焰、Logo、文字、金幣、定位與飛行容器均未變更。

在原始GIF直載模式中點選既有火焰色彩控制後，火焰與蝴蝶容器同時取得`store-select-flame-color-blue`，火焰hue為`180deg`。蝴蝶與返回軌跡的computed filter使用藍色光芒（`rgb(54,147,255)`及`rgb(160,222,255)`）；來源renderer與pixel mode仍為原始GIF無像素修改模式。此效果僅使用既有火焰色彩狀態的CSS顯色，未更改原GIF來源影格、尺寸、飛行軌跡、火焰設定或其他頁面內容。

第328批次依使用者最新要求恢復已驗證的透明APNG來源，僅移除原GIF的黑色舞台矩形並將視覺尺寸由530%微幅提高至550%（約3.8%）。受控返回中段運行期確認：來源尺寸仍為640×360；包裝容器動畫名稱仍為`store-select-flame-butterfly-side-profile-cycle`、週期仍為7.166秒、返回進度為0.55，返回軌跡仍為`uploaded-gif-following-existing-return-arc`。瀏覽器因跨來源讀回限制使用既有screen安全備援，但來源APNG本身保有透明alpha，沒有新增或修改拍翅、播放速度、飛行容器、關鍵影格或返回路徑。

第328受控返回畫面與390×844手機視窗均未見原黑色舞台矩形。蝴蝶畫布只由530%調整為550%，並以left -336%／top -47.625%維持相同飛行容器中心；原拍翅、7.166秒飛行週期及返回軌跡未改變。門店頁10項與TypeScript通過；完整27檔88項初跑僅分店資料庫測試受既有併發問題逾時，40秒單工作者隔離重跑後4項通過；正式建置為`index-DTweQkBh.js`。

第329批次依使用者明確要求，已停止將透明APNG作為可見來源。門店頁直接載入原`store-select-pink-diamond-butterfly_45be91c9.gif`，在同一Canvas顯示層以`matteNearBlackBackdrop`將原始GIF的中性近黑舞台像素設為透明；並未生成、替換或重製任何蝴蝶影格。運行期資源記錄含原GIF，renderer=`uploaded-original-gif-display-matte`、matte=`neutral-near-black-transparent`、畫布640×360；透明APNG未載入。受控暫停在原返回中段（progress=0.55）時，可見原粉紫鑽石蝴蝶、無黑色矩形，容器transform仍完全由既有CSS飛行動畫決定，返回軌跡狀態維持`uploaded-gif-following-existing-return-arc`。既有火焰點選後，容器類別為blue，蝴蝶與軌跡均使用230deg hue及`rgba(54,147,255,.76)`藍色光芒；火焰色彩流程本身未改動。門店頁10項通過；完整27檔88項初跑的付款與圖像資料庫測試逾時，兩檔以40秒單工作者隔離重跑3項全過；TypeScript及正式建置`index-CWJN05zF.js`通過。
