# 戰國風雲：修正清單（第一步：先修小毛病）

> 檢查對象：https://sengoku-chronicle.ycchiu15.chatgpt.site/（2026-10-08 下載的版本）
> 原始碼：`/workspace/sengoku/src/`（`app.js`、`style.css` 原本都壓成一行，另外附了排版過的 `app.pretty.js`、`style.pretty.css` 方便閱讀；下文寫的「app.js 第 N 行」指的是**原始檔**的行號）
> 驗證方式：用無頭 Chrome 在 1366×768、1440×900、1920×1080、390×844（手機）四種尺寸實際操作，包括真的用滑鼠點、檢查重疊、計算距離。
> 下面所有修改都已經套用在本機副本 `/workspace/sengoku/patched/`，也測過了（diff 檔：`patched/*.diff`）。**線上網站完全沒有動。**

## 先講結論：審查時看到的 7 個問題，查證結果

| # | 審查時的懷疑 | 查證結果 |
|---|---|---|
| 1 | 背景格線蓋在區塊上，擋住滑鼠點擊 | **原因猜錯，但點擊確實會失靈。** 格線 `<rect>` 是 SVG 的第一個子元素，在最底層，不會擋。真正擋住點擊的是：①路線圖層 `#routes`（在「背景」階段透明度是 0，但照樣會接住點擊）、②城市和戰役名稱 `#cities`（例如「京都」「本能寺」的文字壓在尾張、近江上）、③加賀、越後的地名放在海岸線上，點文字中間其實是點到海。實測 19 個區塊中，在 1366 寬有 2 個點不到，在 1440 寬有 3 個。 |
| 2 | 點選區塊後的回饋太弱 | **確認。** 只有地圖下方（1366×768 畫面中 y≈1204px，要往下捲）一行字。 |
| 3 | 圖例只有「地方大名、多方勢力」 | **原因猜錯，但看不懂顏色是真的。** 圖例會跟著每一幕重建，第七幕其實有 11 項。真正的問題是：①圖例在地圖下方，第一個畫面看不到；②幾組相鄰勢力的顏色太像（織田和武田色差 ΔE 只有 8.7、毛利和德川 5.9、長宗我部和一向一揆 4.5，一般 ΔE < 10 就很難分辨）；③每個勢力的 `mark` 名稱已經定義好，卻沒有用到。 |
| 4 | 中部地名擠在一起 | **確認，而且比想的還多。** 14 幕裡有 12 幕發生文字重疊（例如「京都」×近江、尾張；「長篠」×東海；戰役標記×攝津、近江）。另外發現長篠、小田原、關原的標記落在**錯的區塊**裡（見第 10 項）。 |
| 5 | 文字重複 | **確認。** 地圖下方的「背景／事件／影響」字幕，就是右欄 因／摘要／果 的原文；換幕卡片重複了標題。另外發現一個 bug：**暫停時換幕卡片應該要隱藏，但它一直顯示**（見第 5 項）。 |
| 6 | 年份點太小又擠 | **確認。** 1568–1603 年之間最近的兩點只差 8–9px（手機 2px），但每個點的可點範圍有 22px，所以會互相重疊，很難點準。 |
| 7 | 地圖下方的區塊在一般視窗中要往下捲才看得到 | **確認。** 在 1366×768，地圖本身就延伸到 y=1000px，字幕框 1000px、圖例 1137px、時間軸 1289px，全都要往下捲。1920×1080 也一樣，圖例在 1219px。 |

另外查到、而且都實測過的問題：鍵盤 ←→ 在點過任何按鈕之後就沒有反應（第 8 項）、螢幕閱讀器每次換幕都會把整個右欄重念一遍（第 8 項）、手機版中部五個區塊的名稱被隱藏，可點範圍只有大約 15×15px（第 9 項）。**主控台沒有任何錯誤或 404，手機版也沒有出現橫向捲軸。**

---

## 1. 滑鼠點地圖有時候沒反應

**問題**
點加賀、越後的地名，或點京都附近被城市名稱、路線蓋住的地方，都不會有反應（用鍵盤 Tab＋Enter 則正常）。

**原因（程式碼位置）**
- `style.css`：只有 `.province-name`、`.main-coast`、`.battle`、`.travel-dot`、`.spotlight-*`、`.context-label` 設了 `pointer-events:none`。`.route-glow`、`.route-reveal`（`#routes` 裡的路線）、`.city-label`、`.city-point`（`#cities`）、`.sea` 都沒有設，所以會接住點擊。`.route-glow` 的線寬是 9px，而且在「背景」階段只是 `opacity:0`，**透明的元素照樣接得到點擊**。
- `app.js` 第 153 行：戰役名稱用 `class:'city-label'` 畫在 `#cities` 裡，位置固定是 `x+13, y-13`，第一幕的「京都」正好壓在尾張、近江上面。
- `map-data.js`：`kaga.label = [302.0, 372.5]`、`echigo.label = [378.3, 333.3]` 這兩個座標是文字的**基線**，文字的視覺中心會往上偏大約 5px，剛好落在海岸線外面，所以點下去是點到格線底圖。

**修改方式**
```css
/* style.css 最後面加上：所有裝飾用的圖層都不要接住點擊 */
#atlas > rect, #coastline, #regionNames, #factionNames,
#routes, #spotlights, #cities, #atlas .sea, #atlas .context-label {
  pointer-events: none;
}
```
```diff
// map-data.js：把兩個地名移到區塊內部（用「離邊界最遠的點」算出來的）
-"kaga":{…,"label":[302.0,372.5]}
+"kaga":{…,"label":[298.0,392.0]}
-"echigo":{…,"label":[378.3,333.3]}
+"echigo":{…,"label":[399.0,338.0]}
```
實測：修改後在三種尺寸下，19 個區塊都點得到，路線經過的地方也點得到（`elementFromPoint` 回傳的都是區塊本身）。

---

## 2. 點選區塊後，在點的位置旁邊跳出資訊卡

**問題**
點下去之後只有地圖最下面一行字有變化，眼睛要從地圖移到下方，而且常常要捲動頁面。

**原因（程式碼位置）**
`app.js` 第 145 行 `inspect(id)` 只會改 `#regionText` 的文字；`index.html` 裡的 `.region-inspect` 放在地圖面板最下方。

**修改方式**
① `index.html`：在 `.map-wrap` 裡面（`#sceneBurst` 前面）加一個資訊卡容器，並且移除原本的 `.region-inspect` 那一列：
```html
<div id="regionTip" class="region-tip" role="status" aria-live="polite" hidden></div>
```
② `app.js`：點擊時把事件傳進去（第 143 行）
```diff
-p.addEventListener('click',()=>inspect(r.id));
+p.addEventListener('click',e=>inspect(r.id,e));
```
③ `app.js`：把 `inspect()` 換成下面這段。滑鼠點擊時，卡片出現在點擊的位置旁邊；用鍵盤選取或換幕時，則對齊區塊名稱的位置。
```js
const swatch = key => key === 'mixed'
  ? 'repeating-linear-gradient(125deg,#958765 0 3px,#253b3d 3px 6px)'
  : parties[key].color;
let tipAnchor = null;

function inspect(id, evt) {
  selectedRegion = id;
  for (const r of regions) $('region-' + r.id).classList.toggle('selected', r.id === id);
  const r = regions.find(r => r.id === id), key = control[index][id], tip = $('regionTip');
  tip.innerHTML =
    `<button type="button" class="tip-close" aria-label="關閉">×</button>
     <div class="tip-head"><i style="background:${swatch(key)}"></i>
       <strong>${r.name}</strong><span>${scenes[index].year} 年 · ${parties[key].name}</span></div>
     <p>${regionDetails[id]}</p>`;
  tip.querySelector('.tip-close').addEventListener('click', closeTip);
  // evt.detail === 0 代表是鍵盤觸發的 click
  if (evt && evt.clientX !== undefined && evt.detail !== 0) tipAnchor = { client: [evt.clientX, evt.clientY] };
  else if (evt || !tipAnchor) tipAnchor = { svg: r.label };
  tip.hidden = false;
  positionTip();
}

function positionTip() {
  const tip = $('regionTip');
  if (tip.hidden || !tipAnchor) return;
  const box = document.querySelector('.map-wrap').getBoundingClientRect();
  let x, y;
  if (tipAnchor.client) { [x, y] = tipAnchor.client; x -= box.left; y -= box.top; }
  else {                                   // SVG 座標 → 螢幕座標
    const pt = $('atlas').createSVGPoint();
    [pt.x, pt.y] = tipAnchor.svg;
    const q = pt.matrixTransform($('atlas').getScreenCTM());
    x = q.x - box.left; y = q.y - box.top;
  }
  const w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = Math.round(Math.min(Math.max(8, x + 16), box.width - w - 8)) + 'px';
  tip.style.top  = Math.round(y - h - 16 >= 8 ? y - h - 16 : Math.min(y + 16, box.height - h - 8)) + 'px';
}

function closeTip() {
  $('regionTip').hidden = true; tipAnchor = null; selectedRegion = null;
  for (const r of regions) $('region-' + r.id).classList.remove('selected');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('regionTip').hidden) closeTip(); });
document.addEventListener('pointerdown', e => {
  if (!$('regionTip').hidden && !e.target.closest('#regionTip,.territory')) closeTip();
});
addEventListener('resize', positionTip);
```
（`render()` 最後原本就有 `if(selectedRegion)inspect(selectedRegion)`，所以換幕的時候卡片內容會自動更新成新年份的勢力。）

④ CSS：
```css
.region-tip{position:absolute;z-index:4;width:min(300px,calc(100% - 16px));padding:10px 14px 12px;
  background:#0f1a26f2;border:1px solid #6b5a3e;border-left:3px solid var(--gold);border-radius:4px;
  box-shadow:0 12px 32px #000a;font-size:14px;line-height:1.6;color:#e6ebe3}
.region-tip[hidden]{display:none}
.tip-head{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin-bottom:4px;padding-right:22px}
.tip-head i{width:11px;height:11px;border-radius:2px;display:inline-block}
.tip-head strong{font-family:var(--serif);font-size:17px;color:#fff1d6}
.tip-head span{font-size:13px;color:var(--gold)}
.tip-close{position:absolute;top:4px;right:6px;font-size:18px;line-height:1;padding:4px;color:var(--muted)}
@media (max-width:760px){.region-tip{left:8px!important;right:8px;width:auto}}
```
（`.map-wrap` 原本就有 `position:relative; overflow:hidden`，所以可以直接用來定位卡片。）

---

## 3. 圖例搬到地圖上、顏色拉開、滑過圖例會標出對應的區塊

**問題**
後面幾幕的顏色看不懂。圖例其實有列出來，但①在地圖下方，第一個畫面看不到；②相鄰勢力的顏色太接近，就算看到圖例也對不起來；③圖例的順序沒有規則。

**原因（程式碼位置）**
- `app.js` 第 159 行 `render()`：`for(const key of new Set(Object.values(control[index])))` 依物件鍵的插入順序產生，沒有排序。
- `index.html`：`#legend` 放在 `.map-bottom` 裡面，也就是地圖下方。
- `app.js` 第 57–78 行 `parties` 的顏色：用 CIELAB ΔE 量了每一幕實際同時出現的配色，色差小於 10 的有：長宗我部／一向一揆 4.5、毛利／德川 5.9、毛利／地方大名 8.5、**織田／武田 8.7（第七幕兩塊相鄰）**、島津／武田 9.6、三好／一向一揆 9.6。
- `parties[*].mark` 有定義，但 `factionMarks()`（第 146 行）是空的，`.faction-name` 也被設成 `display:none`。

**修改方式**
① `index.html`：把 `<div id="legend" class="legend"></div>` 從 `.map-bottom` 移到 `.map-wrap` 裡面（跟資訊卡放在一起），讓它浮在左上角的日本海空白處。
② `app.js`：在 `render()` 裡把原本產生圖例的那段換成 `renderLegend();`，並加上：
```js
function renderLegend() {
  const counts = {};
  for (const k of Object.values(control[index])) counts[k] = (counts[k] || 0) + 1;
  // 主要勢力依佔有區塊數排列，「地方大名」「多方勢力」固定放最後
  const keys = Object.keys(counts).sort((a, b) =>
    (a === 'mixed') - (b === 'mixed') || (a === 'local') - (b === 'local') || counts[b] - counts[a]);
  const lg = $('legend'); lg.replaceChildren(); lg.classList.toggle('two-col', keys.length > 6);
  for (const key of keys) {
    const b = document.createElement('button'); b.type = 'button';
    const dot = document.createElement('i'); dot.style.background = swatch(key);
    b.append(dot, parties[key].name);
    const on  = () => { $('regions').classList.add('legend-focus');
      for (const r of regions) $('region-' + r.id).classList.toggle('legend-hit', control[index][r.id] === key); };
    const off = () => $('regions').classList.remove('legend-focus');
    b.addEventListener('pointerenter', on);  b.addEventListener('focus', on);
    b.addEventListener('pointerleave', off); b.addEventListener('blur', off);
    lg.appendChild(b);
  }
}
```
③ CSS：
```css
.map-wrap .legend{position:absolute;top:10px;left:16px;z-index:3;display:grid;grid-template-columns:auto;
  gap:2px 10px;margin:0;padding:8px 10px;background:#111b27e0;border:1px solid #3a4858;border-radius:4px;
  font-size:13px;line-height:1.4}
.map-wrap .legend.two-col{grid-template-columns:auto auto}
.legend button{display:flex;align-items:center;gap:7px;padding:2px 4px;border-radius:3px;color:var(--text);white-space:nowrap}
.legend button:hover,.legend button:focus-visible{background:#ffffff14}
#regions.legend-focus .territory:not(.legend-hit){opacity:.25}
.territory{transition:fill 1s,filter .2s,opacity .25s}
@media (max-width:760px){
  .map-wrap{flex-direction:column}
  .map-wrap .legend{position:static;align-self:stretch;margin:4px 8px 0;background:none;border:0}
}
```
實測：在 1024 和 1366 寬、勢力最多的第三幕（13 項）時，圖例是 188×185px，**沒有蓋到任何區塊**（第七幕也一樣）。

④ `app.js` `parties`：調整色票，維持原本霧面、博物館的調性，只把容易撞色的幾組拉開：
```js
local:'#6f7580', ikko:'#7f7a45', imagawa:'#c58fc0', takeda:'#7a3448',   // 武田改成深緋紅，和織田的鏽紅區隔
uesugi:'#4f74b0', hojo:'#7c5fb0', mori:'#3f7f86', amago:'#4b5d73',
otomo:'#9fae6a', shimazu:'#c27a8a', chosokabe:'#9a6f3f', miyoshi:'#c79a5a',
tokugawa:'#5d8a52',                                                     // 德川改成綠，和毛利的青藍區隔
toyotomi:'#d4a94e', bakufu:'#4f8f8a'
```
修改後每一幕同時出現的勢力兩兩比較，色差最小是 13（尼子／地方大名，只出現在第三、四幕），其他組都 ≥ 18；原本最小只有 4.5。

---

## 4. 讓地圖、故事欄、時間軸擠進同一個畫面

**問題**
在 1366×768，地圖從 y=349 一路延伸到 1000px，圖例、字幕、點選資訊、時間軸全都要往下捲才看得到；就算是 1920×1080，地圖底部也已經到 1074px。

**原因（程式碼位置）**
- `#atlas{width:100%;height:auto;max-height:720px}`：高度跟著寬度放大，沒有考慮視窗高度。
- 地圖下方疊了三層：`.scene-guide`（字幕框，`min-height:116px`）、`.map-bottom`（圖例＋說明）、`.region-inspect`（`min-height:64px`）。
- `.timeline-panel` 放在整個 `.atlas-layout` 下面，年份比例尺＋14 個章節按鈕加起來大約 290px。
- 置頂的 `.player-bar` 中間其實有一大塊空白。

**修改方式**（第 2、3、5 項已經把圖例、點選資訊、字幕移走或隱藏，這裡再處理高度和時間軸）
① `index.html`：把 `#yearScale` 從 `.timeline-panel` 移到 `.player-bar .transport` 裡（放在 `.play-controls` 和 `.play-status` 之間），讓年份點隨時看得到；原本的 `.scale-labels` 可以刪掉，改由第 7 項的點上標籤取代。
```html
<div class="play-controls">…</div>
<div id="yearScale" class="year-scale" role="group" aria-label="年份比例尺"></div>
<div class="play-status">…</div>
```
② CSS：
```css
.player-bar .transport{gap:24px}
.player-bar .year-scale{flex:1;min-width:0;height:34px;margin:0 12px}
.player-bar .year-scale:before{top:11px}
.timeline-panel .chronology{display:none}       /* 下方只保留章節按鈕，當作「目錄」 */

@media (min-width:761px){
  .masthead{padding-top:14px;padding-bottom:12px}
  .section-line{padding:10px 0}
  /* 地圖＋故事欄的總高度＝一個視窗高，扣掉置頂的播放列 */
  .atlas-layout{height:calc(100dvh - 100px);min-height:520px;max-height:900px}
  .map-panel,.map-wrap{min-height:0}
  #atlas{height:100%;max-height:none}            /* SVG 預設 xMidYMid meet，會等比例縮放 */
  .story{overflow-y:auto;scrollbar-width:thin}    /* 右欄太長時在欄內捲動 */
  .map-bottom{padding:6px 25px 10px}
}
@media (max-width:760px){
  .player-bar .year-scale{order:3;flex-basis:100%;margin:0 6px}
}
```
實測（1366×768，捲到地圖頂端時）：播放列 0–80px（裡面有年份點）、地圖 151–718px、資料來源說明 718–755px，**整個面板剛好在 768px 以內**，右欄超出的部分在欄內捲動。預覽圖：`/workspace/sengoku/patched-preview-1366x768.png`。
（如果希望一打開網頁、還沒捲動就看到整張地圖，可以再把 `.section-line` 那行標語併進頁首，大約可以省 45px。）

---

## 5. 刪掉重複的文字＋修正換幕卡片暫停時不會隱藏的 bug

**問題**
- 地圖下方的「01 背景／02 事件／03 影響」字幕框，內容就是右欄的「因」「摘要」「果」，同一段話出現兩次。
- 地圖右下角的換幕卡片又寫了一次標題（右欄 h2、地圖左上角也都有）。
- **Bug：** CSS 原本的設計是暫停時卡片要隱藏，但實測暫停狀態下 `opacity` 是 1，卡片一直蓋在地圖右下角。

**原因（程式碼位置）**
- `app.js` 第 157 行 `setStage()`：`$('guideText').textContent=[s.cause,s.summary,s.effect][stage]`。
- `style.css`（排版版第 1295–1319 行）：`.scene-burst{opacity:0}`，播放中才是 `opacity:1`。但 `.scene-burst.enter{animation:burst-in .75s … both}` 使用了 `animation-fill-mode: both`，動畫的最後一格 `opacity:1` 會一直保留，蓋過 `opacity:0`。而 `render()` 每次都會呼叫 `setStage(0)` 加上 `.enter`，所以卡片永遠是顯示的。

**修改方式**
```css
/* 修 bug：沒有在播放、也不在全螢幕時，取消動畫，回到 opacity:0 */
.map-panel:not(.is-playing):not(.theater) .scene-burst.enter{animation:none}
/* 一般模式下卡片只顯示「1575 · 事件」和短句，標題留給全螢幕模式 */
.map-panel:not(.theater) #burstTitle{display:none}
/* 字幕框只在全螢幕模式顯示（那時候看不到右欄，才需要它） */
.map-panel:not(.theater) .scene-guide{display:none}
/* 一般模式改成：朗讀到哪一段，就把右欄那一段標亮 */
#cause.is-speaking,#summary.is-speaking,#effect.is-speaking{
  background:#e2ba8018;box-shadow:-10px 0 0 #e2ba8018,10px 0 0 #e2ba8018;border-radius:2px;transition:background .3s}
```
```js
// app.js setStage() 裡，更新 .guide-steps 那行後面加上：
['cause','summary','effect'].forEach((k,i)=>$(k).classList.toggle('is-speaking', playing && i===stage));
```
實測：暫停時卡片的 opacity 是 0，播放時是 1；進入全螢幕模式後，字幕框和標題都會正常顯示。

---

## 6. 地名重疊：戰役／城市名稱自動找空位，被標記蓋住的區塊名稱淡出

**問題**
14 幕裡有 12 幕有文字互相重疊，例如：第一、六幕「京都」壓在近江、尾張上，第七幕「長篠」壓在東海上，第八幕「本能寺」壓在近江、尾張上，第十二幕「關原」壓在飛驒上。

**原因（程式碼位置）**
- `app.js` 第 153 行：戰役名稱一律放在 `(x+13, y-13)`。
- 第 116 行 `cities` 的 `dx/dy` 是寫死的偏移量，沒有避開區塊名稱。
- 京畿一帶的區塊本身就很小（攝津約 32×32 個 SVG 單位），在同一點上同時有區塊名、城市點、戰役標記。

**修改方式**（`app.js` `drawRoutes()`）
```js
const boxHit = (a,b) => a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y;

// 依序嘗試 8 個方位，選第一個不會壓到其他文字的位置
function placeLabel(x, y, text, obstacles) {
  const t = svgNode('text', {class:'city-label', x, y}, $('cities'), text);
  const cands = [[13,-13,'start'],[14,5,'start'],[-14,5,'end'],[0,-18,'middle'],
                 [0,30,'middle'],[-13,-13,'end'],[13,22,'start'],[-13,22,'end']];
  let best = cands[0], bestScore = 1e9;
  for (const c of cands) {
    t.setAttribute('x', x+c[0]); t.setAttribute('y', y+c[1]); t.setAttribute('text-anchor', c[2]);
    const score = obstacles.filter(o => boxHit(t.getBBox(), o)).length;
    if (score < bestScore) { best = c; bestScore = score; }
    if (!score) break;
  }
  t.setAttribute('x', x+best[0]); t.setAttribute('y', y+best[1]); t.setAttribute('text-anchor', best[2]);
  obstacles.push(t.getBBox());
  return t;
}
```
在 `drawRoutes()` 裡，把原本畫城市（第 152 行）和戰役名稱（第 153 行）的部分換成：
```js
const markers = [];
if (s.battle) markers.push({x:s.battle[0]-10, y:s.battle[1]-11, width:20, height:22});
const shown = cities.filter(c => visible.includes(c.name));
shown.forEach(c => markers.push({x:c.x-4, y:c.y-4, width:8, height:8}));
// 被標記本身蓋住的區塊名稱 → 淡出；其他區塊名稱當作障礙物
const obstacles = [...markers];
for (const t of document.querySelectorAll('#regionNames text')) {
  const bb = t.getBBox(), covered = !!bb.width && markers.some(m => boxHit(bb, m));
  t.classList.toggle('is-covered', covered);
  if (bb.width && !covered) obstacles.push(bb);
}
shown.forEach(c => { svgNode('circle',{cx:c.x,cy:c.y,r:3,class:'city-point'},$('cities')); placeLabel(c.x,c.y,c.name,obstacles); });
if (s.battle) {
  const [x,y,label] = s.battle;
  /* …原本畫 battleMark 的程式碼不變… */
  placeLabel(x, y, label, obstacles);
}
```
```css
.province-name.is-covered{opacity:.15}
```
實測：修改後 14 幕全部**沒有任何文字重疊**。被淡出的只有標記正下方的區塊名稱（例如第一幕的攝津、近江，因為京都的標記就在那裡）；點選區塊時，資訊卡仍然會顯示完整名稱。

---

## 7. 年份比例尺：點拉開、加上年份

**問題**
1568、1573、1575、1582、1583、1590、1592 這幾年擠在一起，最近的兩點只差 8–9px（手機 2px），但每個點的按鈕有 22px 寬，所以按鈕互相重疊，很容易點錯。

**原因（程式碼位置）**
`app.js` 第 144 行：`d.style.left=((s.year-1467)/148*100)+'%'`，完全依年份比例排列，而 14 幕裡有 10 幕集中在 1560–1603 這 43 年。

**修改方式**
「平均分配」和「依年份比例」混合使用（60% 平均＋40% 年份），保留「前面幾幕之間隔很久」的感覺，又能讓每個點都點得到：
```diff
-d.style.left=((s.year-1467)/148*100)+'%';
+d.style.setProperty('--pos',  (100*(0.6*i/13 + 0.4*(s.year-1467)/148)) + '%');
+d.style.setProperty('--even', (100*i/13) + '%');
+d.dataset.year = s.year;
```
```css
.scale-dot{left:var(--pos)}
@media (max-width:760px){.scale-dot{left:var(--even)}}   /* 手機上完全平均分配 */
/* 點下方顯示年份：起點、終點、幾個關鍵年份、目前這一幕，以及滑鼠滑過的那一點 */
.scale-dot:before{content:attr(data-year);position:absolute;top:21px;left:50%;transform:translateX(-50%);
  font-size:11px;color:#8ea2a8;font-variant-numeric:tabular-nums;opacity:0}
.scale-dot:nth-child(1):before,.scale-dot:nth-child(3):before,.scale-dot:nth-child(7):before,
.scale-dot:nth-child(12):before,.scale-dot:nth-child(14):before,
.scale-dot.active:before,.scale-dot:hover:before{opacity:1}
.scale-dot.active:before{color:var(--gold)}
@media (max-width:760px){.scale-dot:before{display:none}}
```
實測：放進播放列之後，最近的兩點在 1366 寬相距 30px、1920 寬 39px、手機 24px，**都大於按鈕寬度 22px，不會再重疊**。原本的「距上一幕 N 年」（`#gapText`）可以保留，用來交代實際的時間間隔。

---

## 8. 鍵盤與螢幕閱讀器

**8a. 點過按鈕後，← → 鍵就沒有作用**
- 問題：頁尾寫著「← → 切換幕次」，但只要點過「下一幕」或任何一個章節按鈕，焦點就會停在按鈕上，之後按方向鍵都沒反應（實測確認）。
- 原因：`app.js` 第 169 行，只要焦點在 `BUTTON`、`A` 或 `role=button`（包括地圖區塊）上，整個快速鍵處理就直接 `return`。
- 修改：只有輸入元件才完全略過；在按鈕上時，只略過空白鍵（空白鍵本來就是「按下按鈕」）。
```diff
-if($('about').open||['INPUT','SELECT','TEXTAREA','BUTTON','A'].includes(e.target.tagName)||e.target.getAttribute('role')==='button')return;
+if($('about').open||e.altKey||e.ctrlKey||e.metaKey||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
+if(e.code==='Space'&&(['BUTTON','A'].includes(e.target.tagName)||e.target.getAttribute('role')==='button'))return;
```

**8b. 每次換幕，螢幕閱讀器都把整個右欄重念一遍**
- 原因：`index.html` 的 `<article class="story" aria-live="polite" aria-atomic="true">`。播放時每換一幕都會觸發，而且會跟網站本身的語音朗讀同時講話。
- 修改：拿掉 article 上的 `aria-live`，改用一個只念一句話的隱藏區域：
```html
<p id="sceneAnnounce" class="sr-only" aria-live="polite"></p>
<article class="story">…
```
```js
// render() 裡加上
$('sceneAnnounce').textContent = `第${index+1}幕，${s.year}年，${s.title}`;
```
（第 2 項的資訊卡已經有 `role="status" aria-live="polite"`，所以用 Enter 選取區塊時，螢幕閱讀器也會念出結果；原本的 `#regionText` 沒有 live region，選了之後不會念。）

---

## 9. 手機版：中部五個區塊沒有名稱，而且很難點

**問題**
在 390 寬的手機上，攝津、大和、近江、尾張、飛驒的名稱被隱藏；這幾個區塊可以點的面積大約只有 230–310 px²（約 15×15px），比建議的觸控大小 44×44px 小很多。

**原因（程式碼位置）**
- `style.css`（排版版第 1598 行）：`@media (max-width:760px){.province-name.compact{display:none}}`。
- SVG 寬 700 單位要縮進大約 360px，比例是 0.5。

**修改方式**（兩個方法擇一，或兩個一起用）
- 最簡單：第 2 項的資訊卡已經會在點到的時候顯示完整名稱，所以名稱被隱藏的影響比較小。再提供一個地域選單作為替代方案：
```html
<!-- 放在 .map-bottom 前面，只在手機顯示 -->
<label class="mobile-only">查看地域
  <select id="regionPicker"><option value="">選擇地域…</option></select></label>
```
```js
for (const r of regions) $('regionPicker').add(new Option(r.name, r.id));
$('regionPicker').addEventListener('change', e => e.target.value && inspect(e.target.value, {}));
```
```css
.mobile-only{display:none}
@media (max-width:760px){.mobile-only{display:block;margin:6px 16px;font-size:14px}}
```
- 進階：手機上點到京畿一帶時，可以借用現有全螢幕模式的 `transform: scale()` 放大地圖（第二步做地圖動畫時可以一起處理）。

~~（這一項的程式碼**沒有**放進 `patched/`，因為牽涉到版面設計，需要你決定要用哪一種方式。）~~

**✅ 已完成（2026-10-08，採用「局部放大」做法）**：寬度 ≤600px 時，每一幕都在地圖正下方顯示固定範圍的「局部放大・近畿東海（可點選）」框（放大 4.6 倍）。框內地區可點選、開同一張資訊卡；近畿五國的名稱在框內實際字級 11.7–12.8px，可點正方形約 40–60px；鍵盤／讀屏在手機上以放大框為這五國的操作對象。全螢幕時隱藏放大框。程式在 `map-motion.js`（`MOB_INSET`、`MOB_CFG`、`syncAtlasView()` 等）與 `style.css` 最後的 `@media(max-width:600px)` 區段；詳細說明與測試結果見 `README-修改說明.md`。上面的「地域選單」方案沒有採用。

---

## 10. （史實精確度）三個戰役標記落在錯的區塊

**問題**
戰役座標本身是對的（我用經緯度驗算過，誤差大約 ±3px，見 `data-structure.md`），但示意用的區塊邊界畫得太偏，所以：
- 長篠 `[340,429]` 落在「尾張・美濃」，史實上屬於**三河**（應該在「三河・駿河」）
- 小田原 `[396,417]` 落在「三河・駿河」，史實上屬於**相模**（應該在「關東」）
- 關原 `[303,413]` 落在「近江・京都」，史實上屬於**美濃**（應該在「尾張・美濃」）

這會讓「點標記所在的區塊」看到不相關的說明，而且全螢幕放大時，發光的區塊也跟標記對不上。對一個這麼重視史料的網站來說，值得修。

**原因（程式碼位置）**
`map-data.js` 的區塊多邊形；相鄰區塊共用同一個頂點座標。

**修改方式**（移動 3 個共用頂點，**每個頂點在所有出現的地方都要一起換**，共 9 處）
```bash
sed -i 's/344\.8,411\.2/336.0,411.2/g;   # 尾張／三河交界往西移（hida、owari、tokai 共用）
        s/305\.3,399\.3/300.5,399.3/g;   # 美濃／近江交界往西移（omi、hida、owari 共用）
        s/385\.6,400\.9/376.0,401.0/g'   # 駿河／相模交界往西移（tokai、koshin、kanto 共用）
        map-data.js
```
實測：修改後長篠→三河・駿河、小田原→關東、關原→尾張・美濃，其他戰役（桶狹間、清洲、賤岳、京都、大坂、江戶）的所屬區塊都沒有改變，區塊之間也沒有出現縫隙或重疊。

---

## 檔案
- 修正清單（本檔）：`/workspace/sengoku/fix-list.md`
- 資料結構筆記：`/workspace/sengoku/data-structure.md`
- 原始碼（從線上下載）：`/workspace/sengoku/src/`
- 已套用第 1–8、10 項的本機測試版：`/workspace/sengoku/patched/`（`app.js.diff`、`style.css.diff`、`index.html.diff`）
- 修改後的預覽截圖：`/workspace/sengoku/patched-preview-1366x768.png`
- 測試腳本與截圖：`/workspace/sengoku/test/`
