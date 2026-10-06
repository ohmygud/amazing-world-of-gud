/* =====================================================================
   GUD VIEWER — pixel-style gallery for project media
   (images, uploaded videos, YouTube, Vimeo, web pages). Shared by
   GUDQUEST, the BANALE CV and the CMS preview.
   ===================================================================== */
(function () {
  'use strict';
  if (window.GUDViewer) return;
  const lang = () => { try { return localStorage.getItem('gud_lang') || document.documentElement.lang || 'it'; } catch (e) { return document.documentElement.lang || 'it'; } };
  const tr = o => (o == null ? '' : typeof o === 'string' ? o : (o[lang()] || o.it || o.en || ''));
  const T = { close: { it: 'CHIUDI', en: 'CLOSE' }, open: { it: 'APRI ↗', en: 'OPEN ↗' }, prev: { it: 'Precedente', en: 'Previous' }, next: { it: 'Successivo', en: 'Next' }, web: { it: 'Se la pagina non si vede, aprila in una nuova scheda.', en: 'If the page does not show, open it in a new tab.' } };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let root = null, state = null;
  function ytId(u) { const m = String(u).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : null; }
  function vimeoId(u) { const m = String(u).match(/vimeo\.com\/(?:video\/)?(\d+)/); return m ? m[1] : null; }
  function resolve(src, base) { if (!src) return ''; if (/^(https?:|data:|\/)/i.test(src)) return src; return (base || '') + src; }
  function kindOf(m) {
    if (m.type) return m.type;
    const s = String(m.src || '');
    if (ytId(s) && /youtu/.test(s)) return 'youtube';
    if (vimeoId(s)) return 'vimeo';
    if (/\.(mp4|webm|mov)(\?|$)/i.test(s)) return 'video';
    if (/\.(jpe?g|png|gif|webp|svg)(\?|$)/i.test(s)) return 'image';
    return 'web';
  }
  function build() {
    root = document.createElement('div');
    root.className = 'gv';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.hidden = true;
    root.innerHTML = '<div class="gv-box"><div class="gv-head"><h2 class="gv-title"></h2><div class="gv-count"></div><button class="gv-x" type="button"></button></div>' +
      '<div class="gv-stage"></div><div class="gv-cap"></div>' +
      '<div class="gv-nav"><button class="gv-prev" type="button">◀</button><div class="gv-dots"></div><button class="gv-next" type="button">▶</button></div>' +
      '<div class="gv-desc"></div></div>';
    document.body.appendChild(root);
    root.addEventListener('click', e => { if (e.target === root) close(); });
    root.querySelector('.gv-x').addEventListener('click', close);
    root.querySelector('.gv-prev').addEventListener('click', () => go(-1));
    root.querySelector('.gv-next').addEventListener('click', () => go(1));
    document.addEventListener('keydown', e => {
      if (!state) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); go(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); go(1); }
    }, true);
    let sx = null;
    const st = root.querySelector('.gv-stage');
    st.addEventListener('pointerdown', e => { sx = e.clientX; });
    st.addEventListener('pointerup', e => { if (sx != null && Math.abs(e.clientX - sx) > 50) go(e.clientX < sx ? 1 : -1); sx = null; });
  }
  function render() {
    const { item, media, i, base } = state;
    root.querySelector('.gv-title').textContent = tr(item.t) || '';
    root.querySelector('.gv-x').textContent = '✕ ' + tr(T.close);
    root.querySelector('.gv-x').setAttribute('aria-label', tr(T.close));
    root.querySelector('.gv-count').textContent = media.length > 1 ? (i + 1) + '/' + media.length : '';
    const m = media[i] || {}, k = kindOf(m), src = resolve(m.src, base), stage = root.querySelector('.gv-stage');
    let h = '';
    if (k === 'image') h = '<img src="' + esc(src) + '" alt="' + esc(tr(m.caption) || tr(item.t)) + '">';
    else if (k === 'video') h = '<video src="' + esc(src) + '" controls playsinline preload="metadata"></video>';
    else if (k === 'youtube') { const id = ytId(m.src); h = '<iframe src="https://www.youtube-nocookie.com/embed/' + esc(id) + '?rel=0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="YouTube"></iframe>'; }
    else if (k === 'vimeo') { const id = vimeoId(m.src); h = '<iframe src="https://player.vimeo.com/video/' + esc(id) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Vimeo"></iframe>'; }
    else h = '<iframe src="' + esc(src) + '" sandbox="allow-scripts allow-same-origin allow-popups allow-forms" referrerpolicy="no-referrer" title="web"></iframe><a class="gv-open" href="' + esc(src) + '" target="_blank" rel="noopener">' + esc(tr(T.open)) + '</a><p class="gv-hint">' + esc(tr(T.web)) + '</p>';
    stage.className = 'gv-stage gv-' + k;
    stage.innerHTML = h;
    root.querySelector('.gv-cap').textContent = tr(m.caption) || '';
    root.querySelector('.gv-desc').textContent = tr(item.d) || '';
    const dots = root.querySelector('.gv-dots');
    dots.innerHTML = media.length > 1 ? media.map((_, j) => '<button type="button" class="' + (j === i ? 'on' : '') + '" aria-label="' + (j + 1) + '"></button>').join('') : '';
    dots.querySelectorAll('button').forEach((b, j) => b.addEventListener('click', () => { state.i = j; render(); }));
    root.querySelector('.gv-prev').style.visibility = media.length > 1 ? 'visible' : 'hidden';
    root.querySelector('.gv-next').style.visibility = media.length > 1 ? 'visible' : 'hidden';
    root.querySelector('.gv-prev').setAttribute('aria-label', tr(T.prev));
    root.querySelector('.gv-next').setAttribute('aria-label', tr(T.next));
  }
  function go(d) { if (!state || state.media.length < 2) return; state.i = (state.i + d + state.media.length) % state.media.length; render(); }
  function open(item, opts) {
    opts = opts || {};
    if (!root) build();
    const media = (item.media || []).filter(m => m && m.src);
    if (!media.length) return Promise.resolve();
    return new Promise(res => {
      state = { item, media, i: opts.index || 0, base: opts.base || '', res, prevFocus: document.activeElement };
      render(); root.hidden = false; document.documentElement.classList.add('gv-on');
      setTimeout(() => { try { root.querySelector('.gv-x').focus({ preventScroll: true }); } catch (e) { /* */ } }, 30);
    });
  }
  function close() {
    if (!state) return;
    const s = state; state = null;
    root.hidden = true; root.querySelector('.gv-stage').innerHTML = ''; document.documentElement.classList.remove('gv-on');
    try { if (s.prevFocus) s.prevFocus.focus({ preventScroll: true }); } catch (e) { /* */ }
    s.res();
  }
  window.GUDViewer = { open, close, isOpen: () => !!state, kindOf, ytId, vimeoId };
})();
