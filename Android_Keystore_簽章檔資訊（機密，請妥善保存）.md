# Android Keystore 簽章檔資訊（機密，請妥善保存）

## 本次狀態

在目前工作區、`/home/ubuntu/upload/.recovery` 與可搜尋的歷史路徑中，未找到可驗證的 `birthday-bistro.keystore`、`.jks`、Android 專案、APK 或 AAB。因此本文件**沒有**填入任何猜測的密碼、別名、指紋或私鑰資訊，也不代表已產生新的簽章檔。

## 原正式 keystore 取得後應保存

- 檔案本體：使用離線加密儲存與至少兩份安全備份。
- alias、store password、key password：使用密碼管理器保存，不要寫入 Git 或公開訊息。
- SHA-256 certificate fingerprint：由正式 keystore 與上架平台分別核對。
- Android applicationId、版本號與簽章設定：和 release 專案固定版本保存。

## 遺失處理

若正式 keystore 遺失，不能用新產生的 keystore 冒充原正式簽章；需依 Google Play App Signing 的既有帳戶流程處理，或重新建立全新的應用程式識別與簽署安排。
