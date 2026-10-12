# 壽星餐酒館（Birthday Bistro）上架指南

## 重要狀態

目前交付版本已驗證 Web 專案；StoreSelect Logo 直接播放原始 MP4，不再使用即時變色遮罩；橫向背景已改為共用原始比例可滾動策略。搜尋不到可驗證的 Android/iOS 原生專案、APK、AAB 或 keystore。以下是取得原生專案後的標準流程，不代表本次已完成商店上架包。

## Android／Google Play

1. 取得 Android Studio 專案與正式 keystore；確認 applicationId、版本號與簽章別名。
2. 設定 release signing，禁止把 keystore、密碼或 `key.properties` 提交到 Git。
3. 執行 `./gradlew clean bundleRelease` 產生 AAB，並以 `./gradlew assembleRelease` 產生 APK 測試包。
4. 在實機及 Android Emulator 驗證登入、預約、影片、背景與返回流程。
5. 將 AAB 上傳到 Play Console 內部測試軌，完成內容分級、資料安全與商店資訊後，再提交正式審查。

## iOS／App Store

1. 取得完整 Xcode／iOS 專案、Bundle ID、Apple Developer Team 與 provisioning profiles。
2. 以 Release scheme 建置 Archive，確認 signing、entitlements、版本號與最低 iOS 版本。
3. 在真機驗證影片 autoplay、`playsInline`、背景、滾動、觸控與顏色互動。
4. 透過 Xcode Organizer 上傳 TestFlight，完成內部／外部測試後再提交 App Review。

## 安全與交付

- keystore 是不可由網站來源重建的機密；遺失時不能以新檔替代既有正式簽章。僅重新建立空白 WebView 專案也不能證明是原本的 App，且 Linux 工作區不能完成 iOS Archive／簽署。
- 不要把 keystore、私鑰、Apple 憑證或密碼貼在訊息、Issue 或公開儲存庫。
- 本次搜尋未找到原生包，未捏造 APK、AAB、keystore 或 iOS 專案。
