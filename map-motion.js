'use strict';
/* 戰國風雲：行軍路線、衝突範圍、勢力換色與全螢幕取景
 * 依賴 app.js 的全域變數：index, stage, stageTime, speed, playing, scenes, regions, control, parties,
 * focusRegions, svgNode, placeLabel, $ —— 這些在呼叫時才讀取，所以本檔可以比 app.js 先載入。 */

// 經緯度 → SVG 座標（由 11 個已知地點反推的仿射轉換；北緯 33–37 度一帶誤差約 ±3px，南方離島誤差較大）
const project = (lon, lat) => [34.945 * lon - 3.294 * lat - 4350.48, -0.841 * lon - 35.288 * lat + 1777.36];
const routeData = window.sengokuRoutes || [];
const PREVIEW_MS = 3400;           // 暫停瀏覽時，路線自動畫完所需時間
let marches = [], previewStart = null, battleShown = false, shownIndex = null, fadeTimer = 0;

const reducedMotion = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
const clamp01 = v => Math.max(0, Math.min(1, v));
const ptXY = p => Array.isArray(p) ? project(p[0], p[1]) : p.xy;
const ptName = p => Array.isArray(p) ? p[2] : p.name;
function lighten(hex, t) {
  const n = parseInt(hex.slice(1), 16);
  return 'rgb(' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (255 - v) * t)) + ')';
}
const kindColor = { trade: '#ead198', political: '#cfd9df' };
function itemColor(it) {
  if (it.color) return it.color;
  if (kindColor[it.kind]) return kindColor[it.kind];
  const p = parties[it.party];
  return p && p.color.startsWith('#') ? lighten(p.color, 0.42) : '#f0b48e';
}
// 兩點：二次曲線（bend 控制彎曲方向與幅度）；多點：Catmull-Rom 轉三次貝茲，平滑通過每個途經點
function smoothPath(pts, bend) {
  const f = v => v.toFixed(1);
  if (pts.length === 2) {
    const [a, b] = pts, k = bend ?? 0.18, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    return `M${f(a[0])},${f(a[1])} Q${f(mx - (b[1] - a[1]) * k)},${f(my + (b[0] - a[0]) * k)} ${f(b[0])},${f(b[1])}`;
  }
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
}

/* ---------- 畫出本幕的路線與衝突範圍 ---------- */
function buildZone(layer, x, y, rad, z, i) {
  const g = svgNode('g', { class: 'conflict-zone', transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})`, 'data-key': 'z' + i }, layer);
  g.style.setProperty('--zone', itemColor(z));
  svgNode('circle', { r: rad, class: 'zone-fill' }, g);
  svgNode('circle', { r: rad, class: 'zone-ring' }, g);
  svgNode('circle', { r: rad, class: 'zone-ring late' }, g);
  return g;
}
function buildRoute(layer, defs, pts, r, i, idp) {
  const d = smoothPath(pts, r.bend), color = itemColor(r), id = `${idp}-${index}-${i}`;
  const mask = svgNode('mask', { id, class: 'march-mask', maskUnits: 'userSpaceOnUse', x: -80, y: -80, width: 860, height: 760 }, defs);
  const mp = svgNode('path', { d, class: 'mask-path' }, mask);
  const g = svgNode('g', { class: `march kind-${r.kind || 'march'}${r.approx ? ' approx' : ''}`, 'data-key': 'r' + i }, layer);
  svgNode('path', { d, class: 'march-glow', mask: `url(#${id})` }, g);
  const line = svgNode('path', { d, class: 'march-line', mask: `url(#${id})` }, g);
  line.style.stroke = color;
  const origin = svgNode('circle', { cx: pts[0][0].toFixed(1), cy: pts[0][1].toFixed(1), r: 3, class: 'march-origin' }, g);
  origin.style.fill = color;
  const head = svgNode('path', { d: 'M-7,-5.5 L6,0 L-7,5.5 L-4,0 Z', class: 'march-head' }, g);
  head.style.fill = color;
  const L = mp.getTotalLength();
  mp.style.strokeDasharray = `${L} ${L + 40}`;
  return { g, mp, head, L };
}
function battleNode(parent, x, y) {
  const g = svgNode('g', { class: 'battle', transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, parent);
  svgNode('circle', { cx: 0, cy: 0, r: 17, class: 'pulse-ring' }, g);
  svgNode('circle', { cx: 0, cy: 0, r: 14, class: 'impact-ring' }, g);
  svgNode('rect', { x: -10, y: -11, width: 20, height: 22, rx: 2 }, g);
  svgNode('text', { x: 0, y: 5 }, g, index === 7 ? '變' : index === 2 ? '傳' : '戰');
  return g;
}
function drawMarches(obstacles, battle, cityList = []) {
  const layer = $('marches'), defs = document.querySelector('#atlas defs'), data = routeData[index] || {};
  insetMobile = mobileMQ.matches; INSET = insetMobile ? MOB_INSET : DESK_INSET; syncAtlasView();
  layer.replaceChildren(); layer.classList.remove('has-focus');
  defs.querySelectorAll('.march-mask,#inset-clip').forEach(m => m.remove());
  marches = [];
  (data.zones || []).forEach((z, i) => {
    const [x, y] = project(z.pos[0], z.pos[1]);
    marches.push({ type: 'zone', el: buildZone(layer, x, y, z.r || 14, z, i), item: z, x, y, stage: z.stage ?? 1, at: z.at || 0 });
  });
  (data.routes || []).forEach((r, i) => {
    const pts = r.pts.map(ptXY), R = buildRoute(layer, defs, pts, r, i, 'march-mask');
    marches.push({ type: 'route', el: R.g, item: r, pts, mp: R.mp, head: R.head, L: R.L, label: null, leader: null, stage: r.stage ?? 1, at: r.at || 0 });
  });
  buildInset(insetMobile ? MOB_CFG : data.inset, battle, defs);
  placeAllLabels(obstacles, battle, cityList);
  if (inset) placeInsetLabels(battle, cityList);
  // 暫停瀏覽時的播放順序：依段落、再依段落內的開始時間
  [...marches].sort((a, b) => a.stage - b.stage || a.at - b.at).forEach((m, k, all) => { m.order = k; m.count = all.length; });
  battleShown = false;
}

/* ---------- 局部放大框（一般檢視時，把畿內等擁擠區域放大放在太平洋的空白處） ----------
   全螢幕「放大動畫」本來就會放大焦點，所以那時隱藏放大框，並恢復主圖上的標籤。
   手機（寬度 ≤600px）：每一幕都顯示固定的「近畿・東海」放大框，放在地圖「下方」（把 SVG 的 viewBox 往下延伸），
   不蓋住任何陸地；框內的地區可以點選（與主圖開同一個說明框），近畿五國（攝津、大和、近江、尾張、飛驒）
   在手機上以放大框為鍵盤／讀屏的操作對象，主圖上的同名地區暫時移出 Tab 順序，避免重複。 */
const DESK_INSET = { x: 458, y: 446, w: 234, h: 146 };
const MOB_INSET = { x: 4, y: 606, w: 692, h: 420 };          // 地圖下方，全寬
const MOB_CFG = { c: { xy: [313.5, 424] }, k: 4.6 };          // 原圖 x 238–389、y 378–470（大坂—京都—近江—尾張—飛驒—甲信西緣）
const INSET_TARGETS = ['settsu', 'yamato', 'omi', 'owari', 'hida'];
const mobileMQ = matchMedia('(max-width:600px)');
let INSET = DESK_INSET, insetMobile = false;
let inset = null;
const isTheater = () => !!document.querySelector('.map-panel.theater');
/* 手機一般檢視：viewBox 往下延伸放大框；全螢幕時恢復 700×600（放大框隱藏，主圖五國重新可用 Tab 選取） */
function syncAtlasView() {
  const svg = $('atlas'); if (!svg) return;
  const mob = insetMobile && !isTheater();
  const vb = mob ? `0 0 700 ${MOB_INSET.y + MOB_INSET.h + 6}` : '0 0 700 600';
  if (svg.getAttribute('viewBox') !== vb) svg.setAttribute('viewBox', vb);
  svg.classList.toggle('mobile-inset', mob);
  // 360px 寬時「山陰」與「中國東」只差 1.6 個單位，手機一般檢視把山陰再往左挪 3 個單位
  const sa = document.querySelector('#regionNames .pv-sanin'), r0 = regions.find(r => r.id === 'sanin');
  if (sa && r0) sa.setAttribute('x', r0.label[0] - (mob ? 10 : 7));
  for (const id of INSET_TARGETS) {
    const p = $('region-' + id); if (!p) continue;
    if (mob) { p.setAttribute('tabindex', '-1'); p.setAttribute('aria-hidden', 'true'); }
    else { p.setAttribute('tabindex', '0'); p.removeAttribute('aria-hidden'); }
  }
}
function syncInsetSelected() {
  if (!inset) return;
  inset.root.querySelectorAll('.territory[data-region]').forEach(p => p.classList.toggle('selected', p.dataset.region === selectedRegion));
}
function insetInspect(id, el, e) {
  if (e && e.clientX !== undefined && e.detail !== 0) inspect(id, e);
  else { const b = el.getBoundingClientRect(), r = regions.find(r => r.id === id), lb = inset && inset.T(r.label[0], r.label[1]);
    // 鍵盤操作：說明框貼在放大框內的地名旁
    const m = $('atlas').getScreenCTM(), pt = $('atlas').createSVGPoint(); if (lb) { pt.x = lb[0]; pt.y = lb[1]; }
    const q = lb ? pt.matrixTransform(m) : { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    inspect(id, { clientX: q.x, clientY: q.y, detail: 1 }); }
  syncInsetSelected();
}
function makeInsetInteractive(geo) {
  const rg = geo.querySelector('.inset-regions');
  geo.querySelectorAll(':scope > g:not(.inset-regions)').forEach(g => g.setAttribute('aria-hidden', 'true'));
  rg.querySelectorAll('.territory').forEach((p, i) => {
    const r = regions[i]; if (!r) return;
    p.dataset.region = r.id; p.classList.add('inset-hit');
    p.addEventListener('click', e => insetInspect(r.id, p, e));
    if (INSET_TARGETS.includes(r.id)) {
      p.setAttribute('tabindex', '0'); p.setAttribute('role', 'button');
      p.setAttribute('aria-label', ($('region-' + r.id).getAttribute('aria-label') || r.name) + '（局部放大）');
      p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); insetInspect(r.id, p, null); } });
    } else p.setAttribute('aria-hidden', 'true');
  });
}
function buildInset(cfg, battle, defs) {
  const svg = $('atlas');
  document.getElementById('inset')?.remove();
  inset = null; svg.classList.toggle('has-inset', !!cfg);
  if (!cfg) return;
  const [cx, cy] = Array.isArray(cfg.c) ? project(cfg.c[0], cfg.c[1]) : cfg.c.xy, k = cfg.k;
  const T = (x, y) => [INSET.x + INSET.w / 2 + k * (x - cx), INSET.y + INSET.h / 2 + k * (y - cy)];
  const src = { x: cx - INSET.w / 2 / k, y: cy - INSET.h / 2 / k, width: INSET.w / k, height: INSET.h / k };
  const mob = insetMobile;
  const root = svgNode('g', mob ? { id: 'inset', class: 'is-mobile', role: 'group', 'aria-label': '局部放大：近畿・東海一帶，可選擇地區' } : { id: 'inset', 'aria-hidden': 'true' }, svg);
  const dec = mob ? { 'aria-hidden': 'true' } : {};
  svgNode('rect', { class: 'inset-src', x: src.x.toFixed(1), y: src.y.toFixed(1), width: src.width.toFixed(1), height: src.height.toFixed(1), rx: 1.5, ...dec }, root);
  if (mob) svgNode('line', { class: 'inset-connector', x1: (src.x + src.width / 2).toFixed(1), y1: (src.y + src.height).toFixed(1), x2: (src.x + src.width / 2).toFixed(1), y2: INSET.y, ...dec }, root);
  else svgNode('line', { class: 'inset-connector', x1: (src.x + src.width).toFixed(1), y1: (src.y + src.height).toFixed(1), x2: INSET.x + 6, y2: INSET.y + 6 }, root);
  svgNode('rect', { class: 'inset-bg', x: INSET.x, y: INSET.y, width: INSET.w, height: INSET.h, rx: 4, ...dec }, root);
  const clip = svgNode('clipPath', { id: 'inset-clip' }, defs);
  svgNode('rect', { x: INSET.x, y: INSET.y, width: INSET.w, height: INSET.h, rx: 4 }, clip);
  const view = svgNode('g', { 'clip-path': 'url(#inset-clip)' }, root);
  const geo = svgNode('g', { class: 'inset-geo', transform: `translate(${(INSET.x + INSET.w / 2).toFixed(1)} ${(INSET.y + INSET.h / 2).toFixed(1)}) scale(${k}) translate(${(-cx).toFixed(1)} ${(-cy).toFixed(1)})` }, view);
  for (const id of ['coast', 'regions', 'coastline']) {
    const c = $(id).cloneNode(true); c.removeAttribute('id');
    c.querySelectorAll('[id],[tabindex],[role],[aria-hidden]').forEach(e => { e.removeAttribute('id'); e.removeAttribute('tabindex'); e.removeAttribute('role'); e.removeAttribute('aria-label'); e.removeAttribute('aria-hidden'); });
    if (id === 'regions' && mob) c.classList.add('inset-regions');
    geo.append(c);
  }
  if (mob) makeInsetInteractive(geo);
  const provs = svgNode('g', { class: 'inset-provs', ...dec }, view);
  const names = [...document.querySelectorAll('#regionNames text')];
  regions.forEach((r, i) => {
    const [px, py] = T(r.label[0], r.label[1]);
    if (px > INSET.x + 10 && px < INSET.x + INSET.w - 10 && py > INSET.y + 12 && py < INSET.y + INSET.h - 6) svgNode('text', { class: 'province-name inset-prov', x: px.toFixed(1), y: py.toFixed(1), ...(mob ? { 'data-region': r.id } : {}) }, provs, names[i] ? names[i].textContent : r.name);
  });
  const rl = svgNode('g', { class: 'inset-routes', ...dec }, view);
  const hs = mob ? 1.8 : 1;                                   // 手機放大框：箭頭、起點、戰役標記放大，維持可辨識
  marches.forEach((m, i) => {
    if (m.type === 'zone') { const [x, y] = T(m.x, m.y); m.insetEl = buildZone(rl, x, y, Math.min((m.item.r || 14) * k * 0.55, 26), m.item, i); m.ix = x; m.iy = y; }
  });
  marches.forEach(m => {
    if (m.type !== 'route') return;
    const i = Number(m.el.dataset.key.slice(1)), R = buildRoute(rl, defs, m.pts.map(p => T(p[0], p[1])), m.item, i, 'inset-mask');
    R.hs = hs; if (hs !== 1) R.g.querySelector('.march-origin').setAttribute('r', 3 * hs);
    m.inset = R;
  });
  let bnode = null, bbox = null;
  if (battle) {
    const [bx, by] = T(battle[0], battle[1]);
    if (bx > INSET.x && bx < INSET.x + INSET.w && by > INSET.y && by < INSET.y + INSET.h) {
      bnode = battleNode(rl, bx, by); bbox = { x: bx - 11 * hs, y: by - 12 * hs, width: 22 * hs, height: 24 * hs };
      if (hs !== 1) bnode.setAttribute('transform', `translate(${bx.toFixed(1)} ${by.toFixed(1)}) scale(${hs})`);
    }
  }
  svgNode('rect', { class: 'inset-frame', x: INSET.x, y: INSET.y, width: INSET.w, height: INSET.h, rx: 4 }, root);
  const title = svgNode('text', { class: 'inset-title', x: INSET.x + 8, y: INSET.y + (mob ? 26 : 15), ...dec }, root, mob ? '局部放大・近畿東海（可點選）' : '局部放大');
  const labels = svgNode('g', { class: 'inset-labels', ...dec }, root);
  inset = { k, T, src, root, rl, labels, battle: bnode, battleBox: bbox, titleBox: title.getBBox(), mob };
  syncInsetSelected();
}
const inRect = (r, x, y) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;

/* ---------- 標籤擺放（減少畿內等擁擠區域的視覺雜亂） ----------
   1. 地圖上用短名（光秀、秀吉…），全名留在右欄清單。
   2. 先擺戰役標籤，再依出場順序擺行軍標籤。每個標籤會試：
      路線起點／終點／沿線幾個點 × 緊貼的 8 個位置，以及半徑 22–60 的 12 個方向（這時加一條引導線）。
   3. 計分時，壓到戰役標記、城市、其他標籤或引導線交叉要重罰；壓到行軍線、衝突範圍、國名則輕罰；
      離錨點越遠、引導線越長，扣分越多；標籤之間至少留 4 個單位的空隙，避免兩個詞讀成一串。
   4. 被行軍線或標籤壓到的國名一律調暗（.is-covered），讓事件資訊優先。 */
const TIGHT = [ // box 左上角相對錨點的位置
  (w, h) => [9, -4 - h], (w, h) => [10, -h / 2], (w, h) => [-10 - w, -h / 2], (w, h) => [-w / 2, -10 - h],
  (w, h) => [-w / 2, 10], (w, h) => [-9 - w, -4 - h], (w, h) => [9, 5], (w, h) => [-9 - w, 5]];
const RINGS = [22, 34, 46, 60];
function segHitsBox(x1, y1, x2, y2, b) {
  for (let k = 0; k <= 12; k++) { const x = x1 + (x2 - x1) * k / 12, y = y1 + (y2 - y1) * k / 12; if (x > b.x && x < b.x + b.width && y > b.y && y < b.y + b.height) return true; }
  return false;
}
function segsCross(a, b) {
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a[0], a[1], b[0]) !== o(a[0], a[1], b[1]) && o(b[0], b[1], a[0]) !== o(b[0], b[1], a[1]);
}
const padBox = (b, p) => ({ x: b.x - p, y: b.y - p, width: b.width + 2 * p, height: b.height + 2 * p });
function makePlacer(ctx) {   // ctx: container, hard[], regEls(), samples[], zones[], bounds{x0,y0,x1,y1}, leaders[], rings
  const inBox = (b, pad) => ctx.samples.filter(([x, y]) => x > b.x - pad && x < b.x + b.width + pad && y > b.y - pad && y < b.y + b.height + pad).length;
  const zoneHit = b => ctx.zones.filter(([cx, cy, r]) => { const dx = Math.max(b.x - cx, 0, cx - b.x - b.width), dy = Math.max(b.y - cy, 0, cy - b.y - b.height); return dx * dx + dy * dy < r * r; }).length;
  return function place(text, anchors, cls) {
    const t = svgNode('text', { class: 'city-label ' + cls, x: 0, y: 0, 'text-anchor': 'middle' }, ctx.container, text);
    const m0 = t.getBBox(), w = m0.width, h = m0.height, B = ctx.bounds;
    const regs = ctx.regEls().map(e => e.getBBox()).filter(b => b.width);
    let best = null;
    for (const an of anchors) {
      const cands = TIGHT.map(f => { const [dx, dy] = f(w, h); return { x: an.x + dx, y: an.y + dy, r: 0 }; });
      for (const r of ctx.rings || RINGS) for (let k = 0; k < 12; k++) { const th = k * Math.PI / 6; cands.push({ x: an.x + r * Math.cos(th) - w / 2, y: an.y + r * Math.sin(th) - h / 2, r }); }
      for (const c of cands) {
        const b = { x: c.x, y: c.y, width: w, height: h }, pb = padBox(b, 2);
        let sc = an.pen + c.r * 0.55 + (c.r ? 6 : 0);
        if (b.x < B.x0 || b.y < B.y0 || b.x + w > B.x1 || b.y + h > B.y1) sc += 1000;
        sc += 300 * ctx.hard.filter(o => boxHit(pb, o)).length;
        sc += 25 * regs.filter(o => boxHit(pb, o)).length;
        sc += 7 * inBox(b, 2.5) + 4 * zoneHit(b);
        let lead = null;
        if (c.r) {
          const qx = Math.max(b.x, Math.min(an.x, b.x + w)), qy = Math.max(b.y, Math.min(an.y, b.y + h));
          const len = Math.hypot(qx - an.x, qy - an.y);
          if (len < 6) sc += 30;
          const ux = (qx - an.x) / (len || 1), uy = (qy - an.y) / (len || 1);
          lead = [an.x + ux * 4, an.y + uy * 4, qx - ux * 1.5, qy - uy * 1.5];
          sc += 120 * ctx.hard.filter(o => segHitsBox(lead[0], lead[1], lead[2], lead[3], o)).length;
          sc += 60 * ctx.leaders.filter(L2 => segsCross([[lead[0], lead[1]], [lead[2], lead[3]]], [[L2[0], L2[1]], [L2[2], L2[3]]])).length;
        }
        if (!best || sc < best.sc) best = { sc, b, lead, an };
      }
      if (best.sc < 1) break;
    }
    t.setAttribute('x', (best.b.x - m0.x).toFixed(1));
    t.setAttribute('y', (best.b.y - m0.y).toFixed(1));
    const bb = t.getBBox();
    ctx.hard.push(padBox(bb, ctx.gap || 2)); if (ctx.onPlaced) ctx.onPlaced(bb);
    let line = null;
    if (best.lead) {
      line = svgNode('line', { x1: best.lead[0].toFixed(1), y1: best.lead[1].toFixed(1), x2: best.lead[2].toFixed(1), y2: best.lead[3].toFixed(1), class: 'leader ' + cls }, ctx.container);
      ctx.container.insertBefore(line, ctx.container.firstChild);
      ctx.leaders.push(best.lead);
    }
    for (const e of ctx.regEls()) {
      const rb = e.getBBox(); if (!rb.width) continue;
      if (boxHit(padBox(bb, 1), rb) || (best.lead && segHitsBox(best.lead[0], best.lead[1], best.lead[2], best.lead[3], rb))) e.classList.add('is-covered');
    }
    return { t, line, an: best.an };
  };
}
function routeSamples(list, key) {
  const out = [];
  list.forEach(m => { const R = key ? m[key] : m; if (!R) return; for (let l = 0; l <= R.L; l += 3) { const p = R.mp.getPointAtLength(l); out.push([p.x, p.y]); } });
  return out;
}
function placeAllLabels(obstacles, battle, cityList) {
  const regionEls = () => [...document.querySelectorAll('#regionNames text:not(.is-covered)')];
  const initial = regionEls(), regionBoxes = initial.map(e => e.getBBox());
  const same = (a, b) => Math.abs(a.x - b.x) < .01 && Math.abs(a.y - b.y) < .01 && Math.abs(a.width - b.width) < .01;
  const routes = marches.filter(m => m.type === 'route');
  const samples = routeSamples(routes);
  // 被行軍線穿過、或貼近戰役標記的國名先調暗
  const bBox = battle ? { x: battle[0] - 12, y: battle[1] - 13, width: 24, height: 26 } : null;
  initial.forEach((e, i) => { const b = regionBoxes[i]; if (b.width && (samples.some(([x, y]) => x > b.x - 2 && x < b.x + b.width + 2 && y > b.y - 2 && y < b.y + b.height + 2) || (bBox && boxHit(b, bBox)))) e.classList.add('is-covered'); });
  const ctx = {
    container: $('cities'), regEls: regionEls, samples, leaders: [],
    hard: obstacles.filter(o => !regionBoxes.some(rb => same(rb, o))),
    zones: marches.filter(m => m.type === 'zone').map(m => [m.x, m.y, (m.item.r || 14) + 3]),
    bounds: { x0: 3, y0: 3, x1: 697, y1: 597 }, onPlaced: bb => obstacles.push(bb)
  };
  if (inset) ctx.hard.push(padBox({ x: INSET.x, y: INSET.y, width: INSET.w, height: INSET.h }, 3));
  const place = makePlacer(ctx);
  const mark = (res, x, y) => { if (inset && inRect(inset.src, x, y)) { res.t.classList.add('in-inset'); res.line?.classList.add('in-inset'); } };
  if (battle) { const [x, y, label] = battle; const res = place(label, [{ x, y, pen: 0 }], 'battle-label'); mark(res, x, y); }
  for (const c of cityList) mark(place(c.name, [{ x: c.x, y: c.y, pen: 0 }], 'city-name'), c.x, c.y);   // 城市名也改在路線畫好後才擺，避開行軍線
  const order = routes.filter(m => m.item.label).sort((a, b) => a.stage - b.stage || a.at - b.at);
  for (const m of order) {
    const atEnd = m.item.labelAt === 'end', anchors = [];
    for (const f of [0, .15, .3, .5, .7, .85, 1]) {
      const pos = atEnd ? 1 - f : f, p = m.mp.getPointAtLength(m.L * pos);
      let pen = f * 14;
      if (m.item.toBattle && pos > 0.8) pen += 40;          // 終點是戰場：別擠在戰役標記旁
      if (inset && inRect(inset.src, p.x, p.y)) pen += 18;  // 有放大框時，主圖標籤盡量擺在框外
      anchors.push({ x: p.x, y: p.y, pen });
    }
    const res = place(m.item.label, anchors, 'march-label');
    m.label = res.t; m.leader = res.line; mark(res, res.an.x, res.an.y);
  }
}
function placeInsetLabels(battle, cityList) {
  const routes = marches.filter(m => m.type === 'route' && m.inset);
  const box = { x: INSET.x + 2, y: INSET.y + 2, width: INSET.w - 4, height: INSET.h - 4 };
  const hard = [padBox(inset.titleBox, inset.mob ? 6 : 2)];
  if (inset.battleBox) hard.push(inset.battleBox);
  const place = makePlacer({
    container: inset.labels, regEls: () => [...inset.root.querySelectorAll('.inset-prov:not(.is-covered):not([data-pinned])')],
    samples: routeSamples(routes, 'inset').filter(([x, y]) => inRect(box, x, y)), leaders: [], hard,
    zones: marches.filter(m => m.insetEl).map(m => [m.ix, m.iy, Math.min((m.item.r || 14) * inset.k * 0.55, 26) + 2]),
    bounds: { x0: INSET.x + 4, y0: INSET.y + 4, x1: INSET.x + INSET.w - 4, y1: INSET.y + INSET.h - 4 }, rings: inset.mob ? [34, 50, 68] : [20, 30, 40], gap: inset.mob ? 6 : 2
  });
  const iSamples = routeSamples(routes, 'inset');
  if (inset.mob) relocateInsetProvs(iSamples, hard);
  inset.root.querySelectorAll('.inset-prov').forEach(e => {
    if (e.dataset.keep) return;
    const b = padBox(e.getBBox(), 2);
    if (iSamples.some(([x, y]) => inRect(b, x, y)) || (inset.battleBox && boxHit(b, inset.battleBox))) e.classList.add('is-covered');
  });
  // 手機：放大框裡看得到的國名都當作硬障礙（留 6 個單位≈3px 的空隙），後面擺的城市／行軍標籤要讓開，而不是把國名調暗或貼在旁邊
  if (inset.mob) inset.root.querySelectorAll('.inset-prov:not(.is-covered)').forEach(e => { e.dataset.pinned = '1'; hard.push(padBox(e.getBBox(), 6)); });
  if (inset.battle && battle) { const t = inset.battle.transform.baseVal[0].matrix; place(battle[2], [{ x: t.e, y: t.f, pen: 0 }], 'battle-label inset-label'); }
  for (const c of cityList) {
    if (!inRect(inset.src, c.x, c.y)) continue;
    const [x, y] = inset.T(c.x, c.y);
    svgNode('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: inset.mob ? 5 : 3, class: 'city-point' }, inset.labels);
    place(c.name, [{ x, y, pen: 0 }], 'city-name inset-label');
  }
  const order = routes.filter(m => m.item.label).sort((a, b) => a.stage - b.stage || a.at - b.at);
  for (const m of order) {
    const R = m.inset, anchors = [];
    for (const f of [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1]) {
      const pos = m.item.labelAt === 'end' ? 1 - f : f, p = R.mp.getPointAtLength(R.L * pos);
      if (!inRect(box, p.x, p.y)) continue;
      anchors.push({ x: p.x, y: p.y, pen: f * 10 + (m.item.toBattle && pos > 0.8 ? 30 : 0) });
    }
    if (anchors.length < 2) continue;                       // 只有一點點經過放大框的路線不另外標
    const res = place(m.item.label, anchors, 'march-label inset-label');
    m.insetLabel = res.t; m.insetLeader = res.line;
  }
}
/* 手機放大框：國名被行軍線或戰役標記壓到時，先在同一個地區的陸地內找附近的空位（找不到才調暗），
   確保近畿五國的名字在手機上看得到。判斷「陸地內」用原圖座標：地區多邊形 ∩ 該島海岸線。 */
const PROV_STEPS = [[0, 0], [44, 0], [-44, 0], [0, 32], [0, -32], [44, 32], [-44, 32], [44, -32], [-44, -32], [80, 0], [-80, 0], [0, 60], [0, -60], [80, 50], [-80, 50], [80, -50], [-80, -50], [120, 0], [-120, 0]];
function relocateInsetProvs(samples, hard) {
  const svg = $('atlas'), pt = svg.createSVGPoint(), placed = [];
  const { k, src } = inset, inv = (x, y) => [src.x + (x - INSET.x) / k, src.y + (y - INSET.y) / k];
  const onLand = (id, x, y) => {
    const r = regions.find(r => r.id === id), poly = $('region-' + id), coast = document.querySelector(`#clip-${r.island} path`);
    [pt.x, pt.y] = inv(x, y);
    try { return poly.isPointInFill(pt) && (!coast || coast.isPointInFill(pt)); } catch { return true; }
  };
  const box = { x: INSET.x + 4, y: INSET.y + 4, width: INSET.w - 8, height: INSET.h - 8 };
  for (const e of inset.root.querySelectorAll('.inset-prov')) {
    const id = e.dataset.region, x0 = +e.getAttribute('x'), y0 = +e.getAttribute('y');
    let ok = false;
    // 第一輪：完全避開行軍線、整個字落在本地區陸地上；第二輪：允許壓在行軍線上（字有深色描邊，仍可讀），中心在陸地即可
    for (const strict of [true, false]) {
      for (const [dx, dy] of PROV_STEPS) {
        e.setAttribute('x', (x0 + dx).toFixed(1)); e.setAttribute('y', (y0 + dy).toFixed(1));
        const b = e.getBBox(), pb = padBox(b, 3);
        if (b.x < box.x || b.y < box.y || b.x + b.width > box.x + box.width || b.y + b.height > box.y + box.height) continue;
        if (strict && samples.some(([x, y]) => inRect(pb, x, y))) continue;
        if (hard.some(o => boxHit(pb, o)) || placed.some(o => boxHit(pb, o))) continue;
        if (!onLand(id, b.x + b.width / 2, b.y + b.height / 2)) continue;
        if (strict && (!onLand(id, b.x + 2, b.y + b.height / 2) || !onLand(id, b.x + b.width - 2, b.y + b.height / 2))) continue;
        ok = true; placed.push(pb); if (!strict) e.dataset.keep = '1'; break;
      }
      if (ok) break;
    }
    if (!ok) { e.setAttribute('x', x0.toFixed(1)); e.setAttribute('y', y0.toFixed(1)); placed.push(padBox(e.getBBox(), 3)); }
  }
}
/* ---------- 換幕卡片（#sceneBurst）的位置：一般檢視時放在地圖上「沒有文字」的海面 ----------
   原本固定在地圖容器右下角：桌面版會蓋住太平洋角落的局部放大框；手機／平板（≤760px）圖例排在地圖下方、
   也在同一個容器裡，所以卡片會疊在圖例上。現在依序試三個海面區域（SVG 座標），
   卡片寬度限制在區域內，逐格掃描找一個不碰到任何地圖文字、戰役標記、圖例、放大框的位置；都放不下就不顯示
   （右欄與置頂播放列仍有年份、標題與段落）。全螢幕「放大動畫」維持原本的位置與樣式。 */
const BURST_SLOTS = [
  { x0: 452, y0: 444, x1: 694, y1: 594, align: 'right' },   // 太平洋南側（桌面版原本的位置；有放大框時會讓開）
  { x0: 490, y0: 176, x1: 694, y1: 432, align: 'right' },   // 東北外海
  { x0: 8, y0: 8, x1: 372, y1: 292, align: 'left' }         // 日本海
];
const BURST_TRAVEL = 26;
function placeBurst() {
  const burst = $('sceneBurst'), panel = document.querySelector('.map-panel'), wrap = document.querySelector('.map-wrap'), svg = $('atlas');
  if (!burst || !panel || !wrap || !svg) return;
  const reset = () => { burst.classList.remove('placed', 'no-room'); for (const k of ['left', 'top', 'right', 'bottom', 'maxWidth']) burst.style[k] = ''; };
  if (panel.classList.contains('theater')) { reset(); return; }
  const m = svg.getScreenCTM(); if (!m) return;
  const W = wrap.getBoundingClientRect(), pt = svg.createSVGPoint();
  const toPx = (x, y) => { pt.x = x; pt.y = y; const q = pt.matrixTransform(m); return [q.x - W.left, q.y - W.top]; };
  const rel = r => ({ x: r.left - W.left, y: r.top - W.top, width: r.width, height: r.height });
  const shown = e => { for (let n = e; n && n !== svg.parentNode; n = n.parentNode) if (n.nodeType === 1 && getComputedStyle(n).display === 'none') return false; return true; };
  const obs = [];
  for (const t of svg.querySelectorAll('text')) if (!t.closest('.battle') && !t.classList.contains('is-covered') && t.textContent.trim() && shown(t)) { const r = t.getBoundingClientRect(); if (r.width) obs.push(padBox(rel(r), 4)); }
  for (const b of svg.querySelectorAll('.battle')) if (shown(b)) obs.push(padBox(rel(b.getBoundingClientRect()), 2));
  const bg = svg.querySelector('#inset .inset-bg'); if (bg && shown(bg)) obs.push(padBox(rel(bg.getBoundingClientRect()), 4));
  const lg = $('legend'); if (lg && getComputedStyle(lg).position === 'absolute' && lg.offsetWidth) obs.push(padBox(rel(lg.getBoundingClientRect()), 6));
  burst.classList.add('placed'); burst.classList.remove('no-room');
  burst.style.right = 'auto'; burst.style.bottom = 'auto';
  for (const S of BURST_SLOTS) {
    const [ax, ay] = toPx(S.x0, S.y0), [bx, by] = toPx(S.x1, S.y1);
    const sw = Math.min(bx - ax, 480); if (sw < 120) continue;
    burst.style.maxWidth = sw.toFixed(0) + 'px'; burst.style.left = '0px'; burst.style.top = '0px';
    const w = burst.offsetWidth, h = burst.offsetHeight;
    if (w > bx - ax + 0.5 || h + BURST_TRAVEL > by - ay + 10) continue;
    const xs = [], ys = [];
    for (let x = S.align === 'right' ? bx - w : ax; S.align === 'right' ? x >= ax - 0.5 : x <= bx - w + 0.5; x += S.align === 'right' ? -8 : 8) xs.push(x);
    for (let y = S.align === 'right' && S.y0 > 400 ? by - h : ay; S.y0 > 400 ? y >= ay - 0.5 : y <= by - h + 0.5; y += S.y0 > 400 ? -6 : 6) ys.push(y);
    for (const y of ys) for (const x of xs) {
      const box = { x, y, width: w, height: h + BURST_TRAVEL };   // 進場動畫會從下方 26px 滑上來，連滑動的範圍一起避開
      if (x < 0 || y < 0 || x + w > W.width || y + h + BURST_TRAVEL > W.height) continue;
      if (obs.some(o => boxHit(box, o))) continue;
      burst.style.left = x.toFixed(0) + 'px'; burst.style.top = y.toFixed(0) + 'px';
      return;
    }
  }
  burst.classList.add('no-room');
}
/* 讓清單、人物卡等可以突顯指定的路線／範圍（keys 為 null 時取消） */
function focusRoutes(keys) {
  const layers = [$('marches'), inset && inset.rl].filter(Boolean);
  for (const L of layers) {
    L.classList.toggle('has-focus', !!keys);
    L.querySelectorAll('[data-key]').forEach(g => g.classList.toggle('focus', !!keys && keys.includes(g.dataset.key)));
  }
}

const stageDuration = () => speed === 1 && canNarrate && narrationState !== 'failed' ? 4500 : 13000 / (3 * speed);
function marchProgress(m, now) {
  if (previewStart !== null) {                          // 暫停瀏覽：依序自動畫完
    if (reducedMotion()) return 1;
    const T = (now - previewStart) / PREVIEW_MS, start = m.count > 1 ? m.order / (m.count - 1) * 0.55 : 0;
    return clamp01((T - start) / 0.45);
  }
  if (stage < m.stage) return 0;                        // 播放中：跟著 背景／事件／影響 三段
  if (stage > m.stage || reducedMotion()) return 1;
  return clamp01((stageTime / stageDuration() - m.at) / Math.max(0.25, 1 - m.at));
}

function updateMarches(now) {
  const arrivals = [];
  for (const m of marches) {
    const p = marchProgress(m, now);
    m.el.classList.toggle('on', p > 0);
    if (m.type === 'zone') {                            // 播放時，已過去段落的範圍停止脈動、轉淡
      m.el.classList.toggle('past', previewStart === null && playing && stage > m.stage);
      if (m.insetEl) { m.insetEl.classList.toggle('on', p > 0); m.insetEl.classList.toggle('past', m.el.classList.contains('past')); }
      continue;
    }
    for (const R of [m, m.inset]) {
      if (!R) continue;
      R.mp.style.strokeDashoffset = String(R.L * (1 - p));
      if (p > 0) {                                      // 箭頭跟著線頭走
        const t = Math.max(0.6, R.L * p), a = R.mp.getPointAtLength(t), b = R.mp.getPointAtLength(Math.max(0, t - 2.5));
        const ang = Math.atan2(a.y - b.y, a.x - b.x) * 180 / Math.PI;
        R.head.setAttribute('transform', `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${ang.toFixed(1)})${R.hs && R.hs !== 1 ? ` scale(${R.hs})` : ''}`);
      }
    }
    if (m.inset) m.inset.g.classList.toggle('on', p > 0);
    const past = previewStart === null && playing && stage > m.stage;
    if (m.label) { m.label.classList.toggle('on', p > 0); m.label.classList.toggle('past', past); }
    for (const el of [m.leader, m.insetLabel, m.insetLeader]) if (el) { el.classList.toggle('on', p > 0); el.classList.toggle('past', past); }
    if (m.item.toBattle) arrivals.push(p);
  }
  return arrivals.length ? arrivals.every(p => p >= 0.98) : null;
}

/* 取代原本的 updateMapMotion()：路線進度＋戰役標記在部隊抵達時出現並爆開一圈 */
function updateMapMotion() {
  const now = performance.now(), arrived = updateMarches(now);
  const show = previewStart !== null
    ? (arrived === null ? reducedMotion() || now - previewStart > PREVIEW_MS * 0.4 : arrived)
    : stage > 0 && arrived !== false;
  if (battleMark) {
    battleMark.style.opacity = show ? '1' : '0';
    if (show && !battleShown && !reducedMotion()) { battleMark.classList.remove('arrived'); void battleMark.getBBox(); battleMark.classList.add('arrived'); }
  }
  const ib = inset && inset.battle;
  if (ib) {
    ib.style.opacity = show ? '1' : '0';
    if (show && !battleShown && !reducedMotion()) { ib.classList.remove('arrived'); void ib.getBBox(); ib.classList.add('arrived'); }
  }
  battleShown = show;
}
const previewRunning = () => previewStart !== null && performance.now() - previewStart < PREVIEW_MS + 500;
function startPreview() { previewStart = playing ? null : performance.now(); }
function stopPreview() { previewStart = null; }

/* ---------- 勢力換色：舊顏色疊一層再淡出，從本幕焦點向外依距離延遲，像墨色暈開 ---------- */
function applyTerritories() {
  const prev = shownIndex, fade = $('fadeLayer'), reduced = reducedMotion();
  shownIndex = index; fade.replaceChildren(); clearTimeout(fadeTimer);
  const s = scenes[index], focal = s.battle || regions.find(r => r.id === focusRegions[index][0]).label;
  const ghosts = [];
  for (const r of regions) {
    const key = control[index][r.id], p = $('region-' + r.id);
    if (prev !== null && prev !== index && !reduced && control[prev][r.id] !== key) {
      const g = svgNode('polygon', { points: r.points, class: 'territory-ghost', 'clip-path': `url(#clip-${r.island})` }, fade);
      g.style.fill = parties[control[prev][r.id]].color;
      const delay = Math.round(Math.hypot(r.label[0] - focal[0], r.label[1] - focal[1]) * 2.4);
      g.style.transitionDelay = delay + 'ms';
      ghosts.push(g);
      p.classList.remove('just-changed'); void p.getBBox();
      p.style.animationDelay = delay + 'ms';
      p.classList.add('just-changed');
    }
    p.style.fill = parties[key].color;
    p.setAttribute('aria-label', `${r.name}：${parties[key].name}，點選查看`);
  }
  if (ghosts.length) {
    requestAnimationFrame(() => requestAnimationFrame(() => ghosts.forEach(g => { g.style.opacity = '0'; })));
    fadeTimer = setTimeout(() => fade.replaceChildren(), 2600);
  }
}

/* ---------- 全螢幕取景：讓本幕所有路線都落在畫面內，並以它們的中心為放大原點 ---------- */
function updateFocus() {
  const svg = $('atlas'), data = routeData[index] || {}, pts = [];
  for (const r of data.routes || []) r.pts.forEach(p => pts.push(ptXY(p)));
  for (const z of data.zones || []) pts.push(project(z.pos[0], z.pos[1]));
  if (scenes[index].battle) pts.push(scenes[index].battle);
  if (!pts.length) pts.push(regions.find(r => r.id === focusRegions[index][0]).label);
  const pad = 22;
  const x0 = Math.min(...pts.map(p => p[0])) - pad, x1 = Math.max(...pts.map(p => p[0])) + pad;
  const y0 = Math.min(...pts.map(p => p[1])) - pad, y1 = Math.max(...pts.map(p => p[1])) + pad;
  const cw = svg.clientWidth || 700, ch = svg.clientHeight || 600, k = Math.min(cw / 700, ch / 600);
  const ox = (cw - 700 * k) / 2, oy = (ch - 600 * k) / 2, px = x => ox + x * k, py = y => oy + y * k;
  const Ox = px((x0 + x1) / 2), Oy = py((y0 + y1) / 2), m = 10;
  let z = 2.2;
  for (const X of [px(x0), px(x1)]) { if (X > Ox) z = Math.min(z, (cw - m - Ox) / (X - Ox)); else if (X < Ox) z = Math.min(z, (Ox - m) / (Ox - X)); }
  for (const Y of [py(y0), py(y1)]) { if (Y > Oy) z = Math.min(z, (ch - m - Oy) / (Y - Oy)); else if (Y < Oy) z = Math.min(z, (Oy - m) / (Oy - Y)); }
  z = Math.max(1, Math.min(2.2, z));
  svg.style.setProperty('--focus-x', Ox.toFixed(1) + 'px');
  svg.style.setProperty('--focus-y', Oy.toFixed(1) + 'px');
  svg.style.setProperty('--zoom1', z.toFixed(3));
  svg.style.setProperty('--zoom2', (1 + (z - 1) * 0.35).toFixed(3));
}

/* ---------- 右欄「兵力動向」與全螢幕字幕下的路線清單 ---------- */
function marchItems() {
  const data = routeData[index] || {};
  return [...(data.routes || []).map((r, i) => ({ ...r, key: 'r' + i, isZone: false })),
          ...(data.zones || []).map((z, i) => ({ ...z, key: 'z' + i, isZone: true }))]
    .sort((a, b) => (a.stage ?? 1) - (b.stage ?? 1) || (a.at || 0) - (b.at || 0));
}
function marchLi(it, compact) {
  const li = document.createElement('li');
  li.dataset.key = it.key; li.dataset.stage = it.stage ?? 1;
  const sw = document.createElement('i');
  sw.className = `rl-swatch ${it.isZone ? 'zone' : 'kind-' + (it.kind || 'march')}${it.approx ? ' approx' : ''}`;
  sw.style.setProperty('--c', itemColor(it));
  const body = document.createElement('div');
  const head = document.createElement('div'); head.className = 'rl-head';
  const who = document.createElement('strong'); who.textContent = it.who; head.append(who);
  if (it.approx) { const t = document.createElement('em'); t.className = 'rl-tag'; t.textContent = '概略'; head.append(t); }
  body.append(head);
  if (!compact) {
    const meta = document.createElement('span'); meta.className = 'rl-date'; meta.textContent = it.date || ''; body.append(meta);
    if (!it.isZone) {
      const names = it.pts.map(ptName).filter(Boolean);
      const path = document.createElement('span'); path.className = 'rl-path'; path.textContent = names.join(' → '); body.append(path);
    }
  }
  const cap = document.createElement('p'); cap.textContent = it.caption; body.append(cap);
  li.append(sw, body);
  return li;
}
function renderRouteList() {
  const data = routeData[index] || {}, items = marchItems(), list = $('routeList'), block = $('marchBlock');
  list.replaceChildren();
  block.hidden = !items.length;
  for (const it of items) {
    const li = marchLi(it, false);
    li.tabIndex = 0;
    const on = () => focusRoutes([it.key]);
    const off = () => focusRoutes(window.figureFocusKeys || null);   // 人物卡開著時恢復人物路線的強調
    li.addEventListener('pointerenter', on); li.addEventListener('focus', on);
    li.addEventListener('pointerleave', off); li.addEventListener('blur', off);
    list.append(li);
  }
  const src = $('routeSrc'); src.replaceChildren();
  if (data.note) { const n = document.createElement('span'); n.className = 'rl-note'; n.textContent = data.note; src.append(n); }
  if (data.sources && data.sources.length) {
    src.append(document.createTextNode('路線依據：'));
    data.sources.forEach(([t, u], i) => { if (i) src.append('、'); const a = document.createElement('a'); a.href = u; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = t; src.append(a); });
  }
  renderGuideRoutes();
}
// 全螢幕模式：字幕下面列出「到目前這一段為止」出現的路線
function renderGuideRoutes() {
  const ul = $('guideRoutes'); if (!ul) return;
  ul.replaceChildren();
  for (const it of marchItems()) if ((it.stage ?? 1) === stage) ul.append(marchLi(it, true));
}
addEventListener('resize', () => { if (typeof $ === 'function' && typeof scenes !== 'undefined') { updateFocus(); placeBurst(); } });   // 手機載入途中可能先觸發 resize，這時 app.js 還沒執行
/* 跨過手機斷點（旋轉螢幕、調整視窗）時重畫本幕的路線與放大框；開關全螢幕時切換 viewBox */
mobileMQ.addEventListener('change', () => {
  if (typeof drawRoutes !== 'function' || !scenes[index]) return;
  drawRoutes(scenes[index]); updateMapMotion(); placeBurst(); if (typeof positionTip === 'function') positionTip();
});
addEventListener('DOMContentLoaded', () => {
  const panel = document.querySelector('.map-panel');
  let wasTheater = null;
  if (panel) new MutationObserver(() => {
    syncAtlasView(); if (typeof positionTip === 'function') requestAnimationFrame(positionTip);
    const th = panel.classList.contains('theater'); if (th !== wasTheater) { wasTheater = th; requestAnimationFrame(placeBurst); }
  }).observe(panel, { attributes: true, attributeFilter: ['class'] });
});
