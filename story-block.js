/* 戰國風雲 — Step C：「現場」與「史料摘錄」區塊
 * 由 app.js render() 呼叫 window.renderStory(year)；資料在 stories-data.js。
 * 朗讀：「朗讀現場」按鈕是另外的手動功能，不併入自動播放旁白（說明見 README）。
 */
(function () {
  const $ = (id) => document.getElementById(id);
  const REL = {
    contemporary: ['同時代', 'ok'],
    document: ['同時代文書', 'ok'],
    later: ['事後追記・編纂', 'warn'],
    literary: ['文學讀物', 'myth']
  };
  const STATUS = {
    exact: ['原文已核對', 'ok', '已逐字對照所附連結的數位化文本（省略處以「……」表示）'],
    cited: ['轉引原文', 'warn', '逐字轉引自二手來源，尚未與刊本核對'],
    paraphrase: ['大意（非原文）', 'myth', '找不到可核對的原文，只提供大意']
  };
  const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let speakingYear = null;

  function el(tag, attrs, text) {
    const n = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v; else n.setAttribute(k, v);
    }
    if (text != null) n.textContent = text;
    return n;
  }
  function link(src) {
    const a = el('a', { href: src.u, target: '_blank', rel: 'noopener noreferrer' }, src.t + ' ↗');
    return a;
  }
  function isPlaying() {
    const p = $('play');
    return p && p.getAttribute('aria-pressed') === 'true';
  }
  function resetSpeakBtn() {
    speakingYear = null;
    const b = $('sceneSpeak');
    if (b) { b.textContent = '▶ 朗讀現場'; b.setAttribute('aria-pressed', 'false'); }
  }
  function toggleSpeak(year, text) {
    const b = $('sceneSpeak'), hint = $('sceneSpeakHint');
    hint.textContent = '';
    if (speakingYear === year) { window.speechSynthesis.cancel(); resetSpeakBtn(); return; }
    if (isPlaying()) { hint.textContent = '自動播放進行中，請先暫停再朗讀。'; return; }
    /* 暫停中的旁白交給 app.js 的 stopNarration() 重設，恢復播放時會從本幕開頭重新朗讀 */
    if (typeof window.stopNarration === 'function') window.stopNarration(); else window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-TW'; u.rate = 1;
    const voices = window.speechSynthesis.getVoices();
    u.voice = voices.find(v => v.lang.toLowerCase() === 'zh-tw') || voices.find(v => v.lang.toLowerCase().startsWith('zh')) || null;
    u.onend = u.onerror = () => { if (speakingYear === year) resetSpeakBtn(); };
    speakingYear = year;
    b.textContent = '■ 停止朗讀'; b.setAttribute('aria-pressed', 'true');
    try { window.speechSynthesis.speak(u); } catch { resetSpeakBtn(); }
  }

  function renderStory(year) {
    const data = (window.sengokuStories || {})[year];
    const sb = $('sceneBlock'), qb = $('quoteBlock');
    if (!sb || !qb) return;
    if (speakingYear !== null && speakingYear !== year) { if (canSpeak) window.speechSynthesis.cancel(); resetSpeakBtn(); }
    sb.hidden = qb.hidden = !data;
    if (!data) return;
    const v = data.vignette, q = data.quote;

    /* 現場 */
    $('sceneTitle').textContent = v.title;
    $('sceneText').textContent = v.text;
    const sd = $('sceneDisagree');
    sd.hidden = !v.disagree;
    sd.textContent = v.disagree ? '史料分歧：' + v.disagree : '';
    const ss = $('sceneSources');
    ss.replaceChildren(el('span', { class: 'story-src-label' }, '出處：'));
    v.sources.forEach((s, i) => { if (i) ss.append('；'); ss.append(link(s)); });
    const spk = $('sceneSpeak');
    spk.hidden = !canSpeak;
    $('sceneSpeakHint').textContent = '';
    if (canSpeak) {
      if (speakingYear !== year) resetSpeakBtn();
      spk.onclick = () => toggleSpeak(year, v.title + '。' + v.text);
    }

    /* 史料摘錄 */
    const st = STATUS[q.status] || STATUS.paraphrase, rel = REL[q.rel] || REL.later;
    const bq = $('quoteOrig');
    bq.textContent = q.orig;
    bq.classList.toggle('is-paraphrase', q.status === 'paraphrase');
    bq.setAttribute('lang', /漢文/.test(q.lang) && !/訓讀/.test(q.lang) ? 'zh-Hant' : 'ja');
    $('quoteLang').textContent = q.lang;
    $('quoteZh').textContent = q.zh;
    const tb = $('quoteToggle'), zh = $('quoteZhWrap');
    zh.hidden = true; tb.setAttribute('aria-expanded', 'false'); tb.textContent = '顯示譯文';
    tb.onclick = () => {
      const open = zh.hidden;
      zh.hidden = !open; tb.setAttribute('aria-expanded', String(open)); tb.textContent = open ? '隱藏譯文' : '顯示譯文';
    };
    const badges = $('quoteBadges');
    badges.replaceChildren(
      el('span', { class: 'fig-badge ' + rel[1], title: q.relNote }, rel[0]),
      el('span', { class: 'fig-badge ' + st[1], title: st[2] }, st[0])
    );
    const meta = $('quoteMeta');
    meta.replaceChildren();
    const cite = el('cite', null, q.title);
    meta.append(cite, el('span', null, '　' + q.author + '｜' + q.date));
    $('quoteRel').textContent = q.relNote;
    const ed = $('quoteEdition');
    ed.replaceChildren(el('span', null, '底本：' + q.edition + '　'), link({ t: '查看原文出處', u: q.url }));
  }

  window.renderStory = renderStory;
})();
