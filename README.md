# 戰國風雲｜日本戰國互動地圖 1467–1615

從應仁之亂到大坂夏之陣，用十四幕互動地圖認識日本戰國時代：勢力變化、行軍路線動畫、關鍵人物卡、各幕「現場」短文與史料摘錄。

- 線上版（GitHub Pages）：https://pmebruce.github.io/sengoku-chronicle/
- 原始網站：https://sengoku-chronicle.ycchiu15.chatgpt.site/

純靜態網站（HTML／CSS／原生 JavaScript），不需要建置步驟；把整個資料夾放到任何靜態主機即可。

## 文件

- [`README-修改說明.md`](README-修改說明.md)：本版所有修改（步驟 D、A、B、C 與手機局部放大）、檔案清單、測試結果、建議專家審閱項目。
- [`docs/routes.md`](docs/routes.md)：行軍路線與出處
- [`docs/figures.md`](docs/figures.md)：人物卡內容、肖像與家紋來源
- [`docs/stories.md`](docs/stories.md)：各幕現場與史料摘錄（原文、譯文、出處、可信度）
- [`docs/fix-list.md`](docs/fix-list.md)：第一步修正清單

## 授權與致謝

| 素材 | 授權 | 說明 |
|---|---|---|
| 海岸線底圖：[Natural Earth](https://www.naturalearthdata.com/) 1:50m | 公有領域 | 網站地圖下方附致謝連結 |
| 人物肖像 24 張（`img/figures/`，取自 Wikimedia Commons） | 公有領域 | 檔案頁、作者與收藏單位列在網站「閱讀說明 → 人物卡圖片來源」及 `docs/figures.md` |
| 家紋 23 個圖檔（`img/mon/`，取自 Wikimedia Commons） | 多數為 **CC BY-SA 3.0／4.0**，另有 CC0 與公有領域 | 已改作為單色、透明背景。**改作後的家紋圖檔依原授權以 CC BY-SA 釋出**；作者、授權與原檔連結列在網站「人物卡圖片來源」及 `docs/figures.md`，轉用時請保留 |
| 史料原文摘錄（Wikisource 所收古籍等） | 原典為公有領域；Wikisource 翻刻文字為 CC BY-SA | 每段摘錄都很短，並附原文連結 |
| 各幕開場插畫 14 張（`img/scenes/`，全螢幕「放大動畫」用） | AI 生成的**想像繪製** | 以 AI 圖像生成工具製作並經人工審閱，網站上標示「想像繪製」，不是史料或時代畫作 |
| 中文翻譯、現場短文、人物簡介、程式碼 | 本專案撰寫 | 著作權屬作者 |

參考資料（コトバンク、維基百科、各博物館與地方政府網頁等）只做連結與事實參考，未複製內文。

## 部署備註（GitHub Pages）

- 移除了原主機（Cloudflare）自動插入 `index.html` 的挑戰腳本（`/cdn-cgi/challenge-platform/…`），它只在原主機有效、與網站功能無關。
- 從原網站補上 `assets/sengoku-icon-180-v1.png`、`-192-v1.png`、`-512-v1.png`（網頁圖示與 PWA 圖示）。
- 所有路徑都是相對路徑，可在 `/sengoku-chronicle/` 子路徑下運作；`.nojekyll` 讓 GitHub Pages 直接提供原始檔案。
