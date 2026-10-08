'use strict';
/* 放大動畫的各幕開場插畫：進入全螢幕或在全螢幕中換幕時，先全幅顯示該幕的浮世繪風插畫（AI 想像繪製），
 * 左側留白處疊上年份與幕名，約 1.8 秒後淡出到地圖。
 * 計時策略：插畫顯示期間「暫停該幕的時鐘」（app.js 的 tick 不累加 elapsed/stageTime，startNarration 也不啟動），
 * 插畫結束後才從「背景」段開始計時與朗讀，因此原有的段落／語音／路線同步完全不變，每幕最多只延長約 1.8 秒。
 * 速度越快顯示越短：≤1× 1.8 秒、1.5× 1.2 秒、2× 0.9 秒、5× 不顯示；點一下畫面、按「略過」、Esc 或空白鍵可立即跳過。 */
(function () {
  const ART = window.sengokuSceneArt || {};
  const CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四'];
  const FADE = 520;
  let el, img, bg, kicker, yearEl, nameEl, frame, timer = 0, hideTimer = 0, hold = false, token = 0, current = -1;
  const reduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches;
  const panel = () => document.querySelector('.map-panel');
  const inTheater = () => !!(panel() && panel().classList.contains('theater'));
  const durationFor = spd => spd >= 5 ? 0 : spd >= 2 ? 900 : spd >= 1.5 ? 1200 : 1800;
  const artFor = i => (typeof scenes !== 'undefined' && scenes[i]) ? ART[scenes[i].year] : null;

  function build() {
    if (el) return el;
    el = document.createElement('div');
    el.id = 'sceneIntro'; el.className = 'scene-intro'; el.hidden = true;
    el.innerHTML = '<img class="si-bg" alt="" aria-hidden="true"><div class="si-frame"><img class="si-img" alt="" decoding="async">' +
      '<span class="si-badge">想像繪製</span></div><div class="si-title"><span class="si-kicker"></span>' +
      '<strong class="si-year"></strong><span class="si-name"></span></div>' +
      '<button type="button" class="si-skip" aria-label="略過開場插畫">略過 ›</button>';
    bg = el.querySelector('.si-bg'); img = el.querySelector('.si-img'); frame = el.querySelector('.si-frame');
    kicker = el.querySelector('.si-kicker'); yearEl = el.querySelector('.si-year'); nameEl = el.querySelector('.si-name');
    el.addEventListener('click', () => finish());
    panel().appendChild(el);
    return el;
  }
  function preload(i) { const a = artFor(i); if (a && !a._pre) { a._pre = new Image(); a._pre.decoding = 'async'; a._pre.src = a.src; } }

  function show(i) {
    const a = artFor(i), d = durationFor(typeof speed === 'number' ? speed : 1);
    if (!a || !d || !inTheater()) { if (hold || (el && !el.hidden)) finish(true); return; }
    // 1× 已在朗讀中才打開全螢幕：不打斷語音，直接看地圖
    if (playing && typeof narrationState !== 'undefined' && narrationState === 'speaking' && elapsed > 0) return;
    build();
    const t = ++token, s = scenes[i];
    clearTimeout(timer); clearTimeout(hideTimer);
    current = i; hold = true;
    el.dataset.act = String(i + 1);
    bg.src = a.ph; img.alt = a.alt;
    frame.setAttribute('role', 'img'); frame.setAttribute('aria-label', `開場插畫（想像繪製）：${a.alt}`);
    kicker.textContent = `第${CN[i]}幕`; yearEl.textContent = String(s.year); nameEl.textContent = s.title;
    el.style.setProperty('--si-dur', d + 'ms');
    el.style.setProperty('--fx', Math.round((a.fx ?? 0.7) * 100) + '%');
    const pr = panel().getBoundingClientRect(), ctl = panel().querySelector('.theater-controls'), top = panel().querySelector('.map-top');
    if (ctl) el.style.setProperty('--si-ctl', Math.max(0, Math.round(pr.bottom - ctl.getBoundingClientRect().top)) + 'px');
    if (top) el.style.setProperty('--si-top', Math.max(0, Math.round(top.getBoundingClientRect().bottom - pr.top)) + 'px');
    panel().classList.add('intro-on');
    el.classList.remove('in', 'out', 'ready', 'kb');
    el.hidden = false;
    void el.offsetWidth;
    el.classList.add('in');
    const begin = () => {
      if (t !== token) return;
      el.classList.add('ready');
      if (!reduced()) el.classList.add('kb');
      timer = setTimeout(() => t === token && finish(), reduced() ? Math.min(d, 1200) : d);
    };
    if (img.getAttribute('src') !== a.src) img.src = a.src;
    if (img.complete && img.naturalWidth) begin();
    else {
      img.onload = () => begin();
      img.onerror = () => { if (t === token) finish(true); };    // 圖片載入失敗：直接略過，不卡住播放
      timer = setTimeout(() => { if (t === token && !el.classList.contains('ready')) begin(); }, 1500); // 慢網路：最多等 1.5 秒（期間顯示模糊預覽）
    }
    preload(i + 1);
  }

  function finish(instant) {
    clearTimeout(timer);
    token++;
    const wasHolding = hold;
    hold = false;
    if (panel()) panel().classList.remove('intro-on');
    if (el && !el.hidden) {
      el.classList.add('out');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => { el.hidden = true; el.classList.remove('in', 'out', 'ready', 'kb'); }, instant || reduced() ? 0 : FADE);
    }
    if (!wasHolding) return;
    lastTime = performance.now();                             // 時鐘從現在起算，不把插畫時間算進該幕
    if (playing && speed === 1 && canNarrate && narrationState === 'idle') startNarration();
    else if (!playing && typeof startPreview === 'function') startPreview();   // 暫停中：插畫淡出後再畫一次路線預覽
  }

  window.sceneIntroHold = () => hold;
  window.sceneIntro = {
    onRender(i) { if (inTheater()) show(i); else if (hold) finish(true); },
    skip: () => finish(),
    get active() { return hold; },
    get act() { return current; }
  };

  function init() {
    const p = panel(); if (!p) return;
    let was = p.classList.contains('theater');
    new MutationObserver(() => {
      const now = p.classList.contains('theater');
      if (now === was) return;
      was = now;
      if (now) show(index); else finish(true);
    }).observe(p, { attributes: true, attributeFilter: ['class'] });
    const onSpeed = () => { if (hold && durationFor(speed) === 0) finish(); };
    // 插畫顯示中：Esc／空白鍵只略過插畫（不關閉全螢幕、不切換播放）。用 capture 搶在 app.js 的鍵盤處理之前。
    let swallowUp = false;
    window.addEventListener('keydown', e => {
      if (!hold || e.altKey || e.ctrlKey || e.metaKey) return;
      const dlg = document.getElementById('about'); if (dlg && dlg.open) return;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'Escape' || e.code === 'Space' || e.key === ' ') {
        e.preventDefault(); e.stopImmediatePropagation();
        if (e.code === 'Space' || e.key === ' ') swallowUp = true;
        finish();
      }
    }, true);
    window.addEventListener('keyup', e => {
      if (swallowUp && (e.code === 'Space' || e.key === ' ')) { swallowUp = false; e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
    ['speed', 'theaterSpeed'].forEach(id => { const s = document.getElementById(id); if (s) s.addEventListener('change', () => setTimeout(onSpeed)); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
