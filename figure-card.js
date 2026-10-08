'use strict';
/* 戰國風雲：關鍵人物卡
 * 「關鍵人物」標籤改為按鈕；點選（或 Enter／空白鍵）開啟人物卡，Esc 或 × 關閉並把焦點還給標籤。
 * 人物卡開啟時，地圖只強調此人在本幕相關的路線／範圍（沿用 map-motion.js 的 focusRoutes）。
 * 資料來自 figures-data.js（window.sengokuFigures）。 */
(function () {
const FD = window.sengokuFigures;
let card = null, current = null, returnTo = null;
window.figureFocusKeys = null;

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const link = (href, text) => { const a = el('a', null, text); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; };
const setMask = (node, file) => { const u = `url("${file}")`; node.style.webkitMaskImage = u; node.style.maskImage = u; };
const yearOf = () => (typeof scenes !== 'undefined' && typeof index !== 'undefined') ? scenes[index].year : null;

function ensureCard() {
  if (card) return card;
  card = el('aside', 'figure-card');
  card.id = 'figureCard';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'false');
  card.setAttribute('aria-labelledby', 'figName');
  card.hidden = true;
  card.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeFigure(true); return; }
    // 卡片內的方向鍵與空白鍵不觸發換幕／播放
    if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key) || e.code === 'Space') e.stopPropagation();
  });
  document.body.appendChild(card);
  // 卡片開著時，Esc 先關卡片（避免同時退出放大模式）
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && card && !card.hidden) { e.preventDefault(); e.stopPropagation(); closeFigure(true); }
  }, true);
  document.addEventListener('pointerdown', e => {
    if (card && !card.hidden && !e.target.closest('#figureCard,.person'))closeFigure(false);
  });
  return card;
}

function badge(status) {
  const map = { attested: ['史料可證', 'ok'], attributed: ['傳為', 'warn'], legend: ['傳說', 'myth'] };
  const [t, c] = map[status] || map.attributed;
  return el('span', 'fig-badge ' + c, t);
}

function portraitBlock(f) {
  const box = el('figure', 'fig-portrait');
  if (f.portrait) {
    const img = el('img');
    img.src = f.portrait.file; img.alt = f.name + '畫像'; img.width = 240; img.height = 240; img.decoding = 'async';
    box.appendChild(img);
    if (f.portrait.note) box.appendChild(el('figcaption', 'fig-pnote', f.portrait.note));
  } else {
    box.classList.add('empty');
    if (f.mon) { const m = el('span', 'fig-ph-mon'); setMask(m, f.mon.file); m.setAttribute('aria-hidden', 'true'); box.appendChild(m); }
    else box.appendChild(el('span', 'fig-ph-char', f.name.charAt(0)));
    box.appendChild(el('figcaption', 'fig-pnote', '無可用肖像'));
  }
  return box;
}

function fill(f, year) {
  const c = ensureCard();
  c.replaceChildren();
  c.dataset.figure = f.id;
  const head = el('div', 'fig-head');
  head.appendChild(portraitBlock(f));
  const id = el('div', 'fig-id');
  const top = el('div', 'fig-top');
  if (f.mon) { const m = el('span', 'fig-mon'); setMask(m, f.mon.file); m.setAttribute('role', 'img'); m.setAttribute('aria-label', '家紋：' + f.mon.name); m.title = f.mon.name; top.appendChild(m); }
  const close = el('button', 'icon-button fig-close', '×');
  close.type = 'button'; close.setAttribute('aria-label', '關閉人物卡');
  close.addEventListener('click', () => closeFigure(true));
  top.appendChild(close);
  id.appendChild(top);
  const h = el('h2', 'fig-name', f.name); h.id = 'figName'; id.appendChild(h);
  const read = el('p', 'fig-read');
  read.appendChild(el('span', 'fig-kana', f.kana)); read.lang = f.foreign && f.kanaLabel === '韓文' ? 'ko' : 'ja';
  read.appendChild(el('span', 'fig-romaji', f.romaji)); id.appendChild(read);
  id.appendChild(el('p', 'fig-years', f.years));
  head.appendChild(id);
  c.appendChild(head);

  const body = el('div', 'fig-body');
  body.appendChild(el('p', 'fig-clan', f.clan + (f.mon ? `｜家紋：${f.mon.name}` : '')));
  if (year && f.roles[year]) {
    const r = el('section', 'fig-role');
    const t = el('h3'); t.appendChild(el('span', 'fig-year', String(year))); t.appendChild(document.createTextNode(' 本幕角色')); r.appendChild(t);
    r.appendChild(el('p', null, f.roles[year]));
    const keys = (f.routes || {})[year] || [];
    r.appendChild(el('p', 'fig-hint', keys.length ? '地圖上已強調相關的路線或範圍。' : (f.routeNote || '本幕地圖沒有此人的行軍路線。')));
    body.appendChild(r);
  }
  body.appendChild(el('p', 'fig-bio', f.bio));
  const others = Object.keys(f.roles).map(Number).filter(y => y !== year);
  if (others.length) {
    const o = el('section', 'fig-others'); o.appendChild(el('h3', null, '也出現在'));
    const ul = el('ul');
    for (const y of others) {
      const li = el('li'); const i = scenes.findIndex(s => s.year === y);
      const b = el('button', 'fig-jump', `${y} ${scenes[i].title}`); b.type = 'button';
      b.addEventListener('click', () => { const fid = f.id; go(i); openFigure(fid, null, true); });
      li.appendChild(b); li.appendChild(el('span', null, f.roles[y])); ul.appendChild(li);
    }
    o.appendChild(ul); body.appendChild(o);
  }
  if (f.quote) {
    const q = el('section', 'fig-quote');
    const bq = el('blockquote'); bq.lang = /[ぁ-ん]|[ァ-ン]|ノ/.test(f.quote.text) ? 'ja' : 'zh-Hant';
    bq.appendChild(el('p', 'q-text', `「${f.quote.text}」`)); q.appendChild(bq);
    if (f.quote.zh) q.appendChild(el('p', 'q-zh', f.quote.zh));
    const src = el('p', 'q-src'); src.appendChild(badge(f.quote.status)); src.appendChild(document.createTextNode(' ' + f.quote.source)); q.appendChild(src);
    if (f.quote.note) q.appendChild(el('p', 'q-note', f.quote.note));
    body.appendChild(q);
  }
  if (f.myths && f.myths.length) {
    const m = el('section', 'fig-myths'); m.appendChild(el('h3', null, '常見說法與傳說'));
    const ul = el('ul');
    for (const x of f.myths) { const li = el('li'); const p = el('p', 'm-text'); p.appendChild(badge('legend')); p.appendChild(document.createTextNode(' ' + x.text)); li.appendChild(p); li.appendChild(el('p', 'm-note', x.note)); ul.appendChild(li); }
    m.appendChild(ul); body.appendChild(m);
  }
  const cr = el('section', 'fig-credit'); cr.appendChild(el('h3', null, '圖片與資料來源'));
  if (f.portrait) {
    const p = f.portrait, line = el('p');
    line.appendChild(document.createTextNode('肖像：' + [p.author, p.date, p.holder].filter(Boolean).join('，') + `｜${p.license}｜`));
    line.appendChild(link(p.page, 'Wikimedia Commons')); cr.appendChild(line);
  } else if (f.portraitNote) cr.appendChild(el('p', null, '肖像：' + f.portraitNote));
  if (f.mon) {
    const line = el('p');
    line.appendChild(document.createTextNode(`家紋：${f.mon.author}｜${f.mon.license}｜`));
    line.appendChild(link(f.mon.page, 'Wikimedia Commons'));
    line.appendChild(document.createTextNode('（本站改為單色顯示）')); cr.appendChild(line);
  }
  if (f.monNote) cr.appendChild(el('p', null, f.monNote));
  if (f.sources && f.sources.length) {
    const line = el('p'); line.appendChild(document.createTextNode('參考：'));
    f.sources.forEach((s, i) => { if (i) line.appendChild(document.createTextNode('、')); line.appendChild(link(s.u, s.t)); });
    cr.appendChild(line);
  }
  body.appendChild(cr);
  c.appendChild(body);
}

function setChipState(id) {
  document.querySelectorAll('#people .person').forEach(b => {
    const on = !!id && b.dataset.figure === id;
    b.classList.toggle('active', on); b.setAttribute('aria-expanded', on ? 'true' : 'false');
  });
}

function openFigure(id, chip, focusCard = true) {
  const f = FD.byId[id]; if (!f) return;
  const year = yearOf();
  fill(f, year);
  current = id; returnTo = chip || document.querySelector(`#people .person[data-figure="${id}"]`);
  card.hidden = false; card.scrollTop = 0;
  requestAnimationFrame(() => card.classList.add('open'));
  setChipState(id);
  const keys = ((f.routes || {})[year] || []);
  window.figureFocusKeys = keys.length ? keys : null;
  if (typeof focusRoutes === 'function') focusRoutes(window.figureFocusKeys);
  if (focusCard) card.querySelector('.fig-close').focus({ preventScroll: true });
}

function closeFigure(restoreFocus) {
  if (!card || card.hidden) return;
  card.classList.remove('open'); card.hidden = true; current = null;
  window.figureFocusKeys = null;
  if (typeof focusRoutes === 'function') focusRoutes(null);
  setChipState(null);
  if (restoreFocus && returnTo && document.contains(returnTo)) returnTo.focus();
}

/* 由 app.js 的 render() 呼叫：畫出本幕的人物按鈕 */
function renderPeople(s) {
  closeFigure(false);
  const box = document.getElementById('people');
  box.replaceChildren();
  for (const name of s.people) {
    const f = FD.find(name);
    if (!f) { box.appendChild(el('span', 'person', name)); continue; }
    const b = el('button', 'person', name);
    b.type = 'button'; b.dataset.figure = f.id;
    b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'figureCard');
    b.title = '查看人物卡';
    b.addEventListener('click', () => { if (current === f.id) closeFigure(true); else openFigure(f.id, b); });
    box.appendChild(b);
  }
}

/* 閱讀說明對話框加上圖片來源 */
function addCredits() {
  const body = document.querySelector('#about .dialog-body'); if (!body || body.querySelector('.image-credits')) return;
  const h = el('h3', null, '人物卡圖片來源'); body.appendChild(h);
  const wrap = el('div', 'image-credits');
  wrap.appendChild(el('p', null, '肖像與家紋均取自 Wikimedia Commons，已逐一確認檔案頁的授權。肖像為公有領域，標示「後世想像畫像」者為江戶後期至幕末的作品；家紋圖檔依原授權（CC BY-SA 3.0／4.0、CC0 或公有領域）使用，本站改為單色顯示，改作部分沿用原授權。'));
  const ul = el('ul', 'credit-list');
  for (const f of FD.list) {
    if (!f.portrait && !f.mon) continue;
    const li = el('li'); li.appendChild(el('strong', null, f.name + '：'));
    if (f.portrait) { li.appendChild(document.createTextNode('肖像 ' + [f.portrait.author, f.portrait.holder].filter(Boolean).join('，') + `（${f.portrait.license}）`)); const a = link(f.portrait.page, '↗'); a.setAttribute('aria-label', f.name + '肖像的 Commons 檔案頁'); li.appendChild(a); }
    if (f.mon) { li.appendChild(document.createTextNode(`${f.portrait ? '；' : ''}家紋 ${f.mon.name}：${f.mon.author}（${f.mon.license}）`)); const a = link(f.mon.page, '↗'); a.setAttribute('aria-label', f.name + '家紋的 Commons 檔案頁'); li.appendChild(a); }
    ul.appendChild(li);
  }
  wrap.appendChild(ul); body.appendChild(wrap);
}

window.renderPeople = renderPeople;
window.openFigure = openFigure;
window.closeFigure = closeFigure;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addCredits); else addCredits();
})();
