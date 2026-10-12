Starting video analysis...
Submitting video analysis task...
Task submitted (ID: video-analysis-851c2756-91cb-4954-a41a-ce6de484272c)
[8s] Status: Analyzing video content with AI...
[21s] Status: Analysis completed
[21s] Analysis completed!
Full analysis result saved to: /home/ubuntu/video_20260819_130315_analysis_20260819_064113.md
Note: This tool performs AI-based visual and audio analysis, not verbatim transcription. For detailed speech transcription, use `manus-speech-to-text` instead.
Analysis result:

這份分析旨在為重製門店選擇頁的特效提供精確的視覺運動參數。影片總長約 7 秒，蝴蝶的動態可拆解為以下技術指標：

### 1. 路徑與時間比例 (以 7 秒為基準)
*   **起飛與上升 (0.0s - 1.5s / 約 20%)：** 從右下角光源（火焰處）快速加速，以約 45 度角向左上方衝出。
*   **中段巡航與互動 (1.5s - 4.5s / 約 45%)：** 這是經過文字與繞行 Logo 的核心時段。路徑呈大弧度的 S 形或橢圓形，橫跨螢幕中上部。此時速度最為平穩。
*   **回程與降落 (4.5s - 7.0s / 約 35%)：** 蝴蝶減速並轉向，沿著弧線軌道回到右下角的初始光源處，最終縮小並消失在光暈中。

### 2. 姿態與翅膀動態
*   **側面姿態：** 蝴蝶身體與飛行方向呈約 30 度的仰角。在轉向時，身體會隨路徑切線產生約 15-20 度的傾斜（Bank 動作）。
*   **翅膀拍動幅度：** 
    *   **上拍極限：** 相對於蝴蝶身體平面向上約 60 度。
    *   **下拍極限：** 相對於身體平面向下約 30 度。
    *   **頻率：** 每秒約 3-4 次完整往復拍動，拍動過程伴隨輕微的扇形模糊感。

### 3. 旋轉與縮放 (實作參數)
*   **縮放 (Scaling)：** 起飛時從 20% 快速放大至 100%（畫面中心）；回程時從 100% 漸變縮小至 10% 沒入光源。
*   **旋轉 (Rotation)：** 
    *   **Y 軸偏航 (Yaw)：** 隨路徑轉向，確保頭部始終朝向飛行前方。
    *   **Z 軸翻滾 (Roll)：** 在大弧度轉彎處，向圓心方向傾斜約 20 度，增加動態真實感。

### 4. 金粉粒子系統 (尾跡特效)
*   **脫離密度：** 緊貼蝴蝶尾部處密度最高（呈團狀），隨距離增加呈指數級稀疏。
*   **大小分層：** 
    *   **底層：** 大量 1-2px 的細微光點，構成煙霧狀背景。
    *   **頂層：** 少量 3-5px 的亮點（Sparks），具備更強的發光強度。
*   **閃爍 (Flicker)：** 粒子不透明度在 0.3 到 1.0 之間隨機高頻跳動（約 10Hz）。
*   **漂移與下沉 (Drift & Sink)：** 
    *   粒子繼承蝴蝶飛行方向約 20% 的慣性速度。
    *   **漂移：** 脫離後向四周輕微擴散（徑向速度）。
    *   **下沉：** 模擬微弱重力，粒子在生命週期結束前（約 1.5 秒）會緩慢向下飄落約 10-20 像素，隨後淡出。

這組數據可直接應用於 After Effects 的粒子插件（如 Trapcode Particular）或網頁前端的 Canvas/WebGL 動畫開發。
