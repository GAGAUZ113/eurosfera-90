/* Короткие версии: язык, сцена по экранам (A), сторис (B), видео только на видимом экране */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('app-ok');
  var deck = window.__deck || (window.__deck = {});
  var reduced = root.classList.contains('reduce');
  deck.reduced = reduced; deck.mode = 'hero'; deck.floorsP = 0; deck.covered = false;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var T = window.__titles || { ru: [document.title, ''], tg: [document.title, ''] };

  /* ── язык ── */
  function lang() { return root.getAttribute('data-lang') === 'tg' ? 'tg' : 'ru'; }
  function setLang(l, push) {
    root.setAttribute('data-lang', l); root.lang = l === 'tg' ? 'tg' : 'ru';
    $$('[data-set-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === l)); });
    document.title = T[l][0];
    if (push) {
      var u = new URL(location.href);
      if (l === 'tg') u.searchParams.set('lang', 'tj'); else u.searchParams.delete('lang');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
    $$('a[data-keep-lang]').forEach(function (a) {
      var u = new URL(a.getAttribute('href'), location.href);
      if (l === 'tg') u.searchParams.set('lang', 'tj'); else u.searchParams.delete('lang');
      a.setAttribute('href', u.pathname.split('/').pop() + u.search + u.hash);
    });
    swapVideos(l);
    $$('a[data-href-tg]').forEach(function (a) {
      if (!a.hasAttribute('data-href-ru')) a.setAttribute('data-href-ru', a.getAttribute('href'));
      a.setAttribute('href', a.getAttribute(l === 'tg' ? 'data-href-tg' : 'data-href-ru'));
    });
    // подписи для экранных чтецов: русская — в aria-label, таджикская — в data-tg-label
    $$('[data-tg-label]').forEach(function (el) {
      if (!el.hasAttribute('data-ru-label')) el.setAttribute('data-ru-label', el.getAttribute('aria-label') || '');
      el.setAttribute('aria-label', el.getAttribute(l === 'tg' ? 'data-tg-label' : 'data-ru-label'));
    });
    if (deck.renderNow) deck.renderNow();
  }
  $$('[data-set-lang]').forEach(function (b) { b.addEventListener('click', function () { setLang(b.getAttribute('data-set-lang'), true); }); });

  /* видео с вариантами по языку: data-src-ru / data-src-tg */
  function swapVideos(l) {
    $$('video[data-src-ru]').forEach(function (v) {
      var want = v.getAttribute(l === 'tg' ? 'data-src-tg' : 'data-src-ru');
      var pst = v.getAttribute(l === 'tg' ? 'data-poster-tg' : 'data-poster-ru');
      if (pst) v.setAttribute('poster', pst);
      if (v.getAttribute('src') && v.getAttribute('src') !== want) { v.setAttribute('src', want); if (v.dataset.active === '1' && !reduced) play(v); }
      v.setAttribute('data-src', want);
    });
  }
  function load(v) { if (!v.getAttribute('src') && v.getAttribute('data-src')) v.setAttribute('src', v.getAttribute('data-src')); }
  function play(v) { load(v); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function pauseAll(except) { $$('video').forEach(function (v) { if (v !== except) { v.pause(); v.dataset.active = '0'; } }); }

  /* кран сам ставит этажи, когда виден экран «floors» */
  var floorsTimer = null;
  function runFloors(on) {
    if (floorsTimer) { cancelAnimationFrame(floorsTimer); floorsTimer = null; }
    if (!on) return;
    if (reduced) { deck.floorsP = 1; return; }
    var start = performance.now() - deck.floorsP * 12000;
    (function step(now) {
      deck.floorsP = Math.min(1, (now - start) / 12000);
      if (deck.floorsP < 1) floorsTimer = requestAnimationFrame(step);
    })(performance.now());
  }
  function applyScene(el) {
    var sc = el.getAttribute('data-scene') || 'hero';
    if (sc === 'floors') { deck.mode = 'floors'; runFloors(true); }
    else { runFloors(false); deck.mode = sc; if (sc === 'final' || sc === 'dalshe') { deck.floorsP = 1; deck.parkK = 1; } }
  }

  /* ── A: экраны ── */
  var screens = $$('.a-screen');
  if (screens.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio > 0.55) {
          applyScene(e.target);
          var v = $('video', e.target);
          pauseAll(v);
          if (v && !reduced) { v.dataset.active = '1'; play(v); }
        }
      });
    }, { threshold: [0.55, 0.75] });
    screens.forEach(function (s) { io.observe(s); });
    root.classList.add('s-snap');
  }

  /* ── B: сторис ── */
  var slides = $$('.b-slide');
  if (slides.length) {
    root.classList.add('b-html');
    var bars = $('.b-bars');
    slides.forEach(function () { var i = document.createElement('i'); i.appendChild(document.createElement('b')); bars.appendChild(i); });
    var fills = $$('.b-bars b');
    var cur = -1, t0 = 0, dur = 6000, paused = false, pauseAt = 0, raf = null;
    var label = $('.b-pause');
    function show(n) {
      n = Math.max(0, Math.min(slides.length - 1, n));
      if (n === cur) return;
      cur = n;
      slides.forEach(function (s, k) { s.classList.toggle('is-on', k === n); s.setAttribute('aria-hidden', String(k !== n)); });
      fills.forEach(function (f, k) { f.style.transform = 'scaleX(' + (k < n ? 1 : 0) + ')'; });
      var s = slides[n];
      dur = (parseFloat(s.getAttribute('data-dur')) || 6) * 1000;
      applyScene(s);
      var v = $('video', s);
      pauseAll(v);
      if (v) { v.currentTime = 0; v.dataset.active = '1'; if (!reduced) play(v); }
      t0 = performance.now(); paused = false; if (label) label.textContent = '';
      history.replaceState(null, '', location.pathname + location.search + '#' + (n + 1));
    }
    function tick(now) {
      raf = requestAnimationFrame(tick);
      if (paused || reduced) return;
      var k = Math.min(1, (now - t0) / dur);
      fills[cur].style.transform = 'scaleX(' + k.toFixed(4) + ')';
      if (k >= 1 && cur < slides.length - 1) show(cur + 1);
    }
    function next() { if (cur < slides.length - 1) show(cur + 1); }
    function prev() { show(cur - 1); }
    var held = false, holdT = null;
    function guard(fn) { return function () { if (held) { held = false; return; } fn(); }; }
    $('.b-tap--next').addEventListener('click', guard(next));
    $('.b-tap--prev').addEventListener('click', guard(prev));
    $('.b-next').addEventListener('click', next);
    $('.b-prev').addEventListener('click', prev);
    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.altKey || e.ctrlKey) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    });
    // удержание пальца — пауза, отпустил — дальше по времени
    $$('.b-tap').forEach(function (z) {
      z.addEventListener('pointerdown', function () {
        holdT = setTimeout(function () { held = true; paused = true; pauseAt = performance.now(); if (label) label.textContent = lang() === 'tg' ? 'таваққуф' : 'пауза'; }, 280);
      });
      var release = function () { clearTimeout(holdT); if (paused) { t0 += performance.now() - pauseAt; paused = false; if (label) label.textContent = ''; } };
      z.addEventListener('pointerup', release);
      z.addEventListener('pointerleave', release);
      z.addEventListener('pointercancel', release);
    });
    var start = parseInt((location.hash || '').slice(1), 10);
    show(isNaN(start) ? 0 : start - 1);
    raf = requestAnimationFrame(tick);
    if (reduced) fills.forEach(function (f, k) { f.style.transform = 'scaleX(' + (k <= cur ? 1 : 0) + ')'; });
  }

  /* ── C и прочее: видео на экране ── */
  if (!screens.length && !slides.length && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var v = e.target; if (e.isIntersecting) { if (!reduced) play(v); } else v.pause(); });
    }, { threshold: 0.4 });
    $$('video').forEach(function (v) { vio.observe(v); });
  }

  /* шапка получает подложку, как только страница сдвинулась */
  var onScroll = function () { root.classList.toggle('is-scrolled', (window.scrollY || window.pageYOffset || 0) > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  /* ролик без петли: доиграл — вернулся к первому кадру, если так помечен */
  $$('video[data-rest="start"]').forEach(function (v) { v.addEventListener('ended', function () { v.currentTime = 0; }); });

  /* ролик узла на главной: нажал — открылся на весь экран с кнопками плеера */
  $$('.r-node .clip').forEach(function (c) {
    var v = $('video', c); if (!v) return;
    c.addEventListener('click', function () {
      load(v); v.controls = true;
      var p = v.play(); if (p && p.catch) p.catch(function () {});
      if (v.requestFullscreen) { var f = v.requestFullscreen(); if (f && f.catch) f.catch(function () { v.controls = false; }); }
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
    });
    v.addEventListener('webkitendfullscreen', function () { v.controls = false; });
  });
  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement) $$('.r-node .clip video').forEach(function (v) { v.controls = false; });
  });

  if (lang() === 'tg') setLang('tg', false); else swapVideos('ru');
})();
