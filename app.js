/* Презентация EUROSFERA для Sebiston Group: язык, главы, прокрутка → сцена, калькулятор, чат */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('app-ok');
  var deck = window.__deck || (window.__deck = {});
  var reduced = root.classList.contains('reduce');
  deck.reduced = reduced;
  deck.mode = 'hero';
  deck.floorsP = 0;

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  /* ── язык ── */
  var TITLES = {
    ru: ['EUROSFERA для Sebiston Group — 90 дней', 'Предложение EUROSFERA для ГК «Sebiston Group»: за 90 дней поставить снабжение, ПТО, контроль качества, охрану труда и учёт на объектах — с инструкциями на русском и таджикском, Telegram-ботом заявок и прямыми контрактами с фабриками Европы.'],
    tg: ['EUROSFERA барои Sebiston Group — 90 рӯз', 'Пешниҳоди EUROSFERA барои гурӯҳи ширкатҳои «Sebiston Group»: дар 90 рӯз таъминот, ПТО (шуъбаи истеҳсолӣ-техникӣ), назорати сифат, ҳифзи меҳнат ва баҳисобгириро дар объектҳо ба роҳ мондан — бо дастурамалҳо ба забонҳои русӣ ва тоҷикӣ, боти Telegram барои дархостҳо ва шартномаҳои мустақим бо фабрикаҳои Аврупо.']
  };
  function lang() { return root.getAttribute('data-lang') === 'tg' ? 'tg' : 'ru'; }
  function setLang(l, push) {
    root.setAttribute('data-lang', l);
    root.lang = l === 'tg' ? 'tg' : 'ru';
    $$('[data-set-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === l)); });
    document.title = TITLES[l][0];
    var d = $('meta[name="description"]'); if (d) d.content = TITLES[l][1];
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
    $$('a[data-href-tg]').forEach(function (a) {
      if (!a.hasAttribute('data-href-ru')) a.setAttribute('data-href-ru', a.getAttribute('href'));
      a.setAttribute('href', a.getAttribute(l === 'tg' ? 'data-href-tg' : 'data-href-ru'));
    });
    buildToc();
    swapA11y(l);
    lastIdx = -1;
    if (deck.renderNow) deck.renderNow();
  }
  function swapA11y(l) {
    $$('[data-tg-label]').forEach(function (el) {
      if (!el.hasAttribute('data-ru-label')) el.setAttribute('data-ru-label', el.getAttribute('aria-label') || '');
      el.setAttribute('aria-label', el.getAttribute(l === 'tg' ? 'data-tg-label' : 'data-ru-label'));
    });
    $$('[data-tg-alt]').forEach(function (el) {
      if (!el.hasAttribute('data-ru-alt')) el.setAttribute('data-ru-alt', el.getAttribute('alt') || '');
      el.setAttribute('alt', el.getAttribute(l === 'tg' ? 'data-tg-alt' : 'data-ru-alt'));
    });
  }
  $$('[data-set-lang]').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-set-lang'), true); });
  });

  /* ── главы ── */
  var chapters = $$('section[data-ch]');
  var numEl = $('[data-num]'), nameEl = $('[data-name]');
  var toc = $('#toc'), mid = $('.dock__mid');
  function chName(sec) { var p = sec.getAttribute('data-ch').split('|'); return lang() === 'tg' ? p[1] : p[0]; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function buildToc() {
    toc.innerHTML = '';
    chapters.forEach(function (sec, i) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + sec.id;
      a.innerHTML = '<span>' + pad(i + 1) + '</span><span></span>';
      a.lastChild.textContent = chName(sec);
      li.appendChild(a);
      toc.appendChild(li);
    });
  }
  function closeToc() { toc.hidden = true; mid.setAttribute('aria-expanded', 'false'); }
  mid.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = toc.hidden;
    toc.hidden = !open;
    mid.setAttribute('aria-expanded', String(open));
    if (open) { var cur = toc.querySelector('[aria-current="true"]') || toc.querySelector('a'); cur.focus({ preventScroll: true }); cur.scrollIntoView({ block: 'nearest' }); }
  });
  document.addEventListener('click', function (e) { if (!toc.hidden && !toc.contains(e.target)) closeToc(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !toc.hidden) { closeToc(); mid.focus(); } });

  /* ── плавная прокрутка (только мышь, без «уменьшить движение») ── */
  var lenis = null;
  try {
    if (window.Lenis && !reduced && matchMedia('(pointer: fine)').matches) {
      lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 0.9 });
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    }
  } catch (e) { lenis = null; }

  function scrollToY(y) {
    y = Math.max(0, Math.round(y));
    if (lenis) lenis.scrollTo(y, { duration: 1.25 });
    else window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }
  function absTop(el) { return el.getBoundingClientRect().top + window.scrollY; }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var t = id ? document.getElementById(id) : null;
    if (!t) return;
    e.preventDefault();
    closeToc();
    scrollToY(id === 'top' ? 0 : absTop(t) - (t.classList.contains('ch--sheet') ? 0 : 46));
    history.replaceState(null, '', '#' + id);
  });

  /* остановки для кнопок ‹ ›: начало каждой главы + каждый поставленный этаж */
  var track = $('[data-track]');
  function stops() {
    var vh = window.innerHeight, out = [];
    chapters.forEach(function (sec) {
      out.push(sec.id === 'top' ? 0 : absTop(sec) - (sec.classList.contains('ch--sheet') ? 0 : 46));
      if (sec.id === 'etazhi' && track) {
        var tt = absTop(track), span = track.offsetHeight - vh;
        for (var k = 0; k < 8; k++) out.push(tt + span * (k + 0.96) / 8);
      }
    });
    return out.sort(function (a, b) { return a - b; });
  }
  function go(dir) {
    var y = window.scrollY, s = stops(), target = null;
    if (dir > 0) { for (var i = 0; i < s.length; i++) if (s[i] > y + 6) { target = s[i]; break; } }
    else { for (var j = s.length - 1; j >= 0; j--) if (s[j] < y - 6) { target = s[j]; break; } }
    if (target !== null) scrollToY(target);
  }
  $$('[data-go]').forEach(function (b) {
    b.addEventListener('click', function () { go(b.getAttribute('data-go') === 'next' ? 1 : -1); });
  });
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT|VIDEO/.test(tag)) return;
    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });

  /* ── прокрутка → состояние сцены, глава, этажи ── */
  var bar = $('.progress i');
  var cards = $$('.fcard'), rails = $$('.rail li');
  var prevBtn = $('[data-go="prev"]'), nextBtn = $('[data-go="next"]');
  var lastIdx = -1, lastCard = -1, lastY = -1, lastVh = -1;
  function tick() {
    requestAnimationFrame(tick);
    var y = window.scrollY, vh = window.innerHeight;
    if (y === lastY && vh === lastVh && lastIdx !== -1) return;
    lastY = y; lastVh = vh;
    var docH = document.documentElement.scrollHeight;
    if (bar) bar.style.transform = 'scaleX(' + clamp01(y / Math.max(1, docH - vh)).toFixed(4) + ')';
    root.classList.toggle('scrolled', y > 40);

    // активная глава — та, что пересекает середину экрана
    var mid = vh * 0.5, idx = 0;
    for (var i = 0; i < chapters.length; i++) {
      var r = chapters[i].getBoundingClientRect();
      if (r.top <= mid) idx = i;
    }
    var sec = chapters[idx];
    deck.mode = sec.getAttribute('data-scene') || 'sheet';
    var sh = sec.classList.contains('ch--sheet') ? sec.querySelector('.sheet') : null;
    if (sh && !sec.classList.contains('ch--night')) { var rs = sh.getBoundingClientRect(); deck.covered = rs.top <= 60 && rs.bottom >= vh - 2; }
    else deck.covered = false;

    if (idx !== lastIdx) {
      lastIdx = idx;
      numEl.textContent = pad(idx + 1) + ' / ' + pad(chapters.length);
      nameEl.textContent = chName(sec);
      $$('a', toc).forEach(function (a, k) { a.setAttribute('aria-current', String(k === idx)); });
      if (prevBtn) prevBtn.disabled = idx === 0 && y < 4;
    }
    if (prevBtn && idx === 0) prevBtn.disabled = y < 4;
    if (nextBtn) nextBtn.disabled = y >= docH - vh - 4;

    // восемь этажей
    if (track) {
      var rt = track.getBoundingClientRect();
      var P = clamp01(-rt.top / Math.max(1, rt.height - vh));
      deck.floorsP = P;
      var after = -rt.top - (rt.height - vh);
      deck.parkK = clamp01(after / (vh * 0.9));
      var ci = Math.min(7, Math.floor(P * 8));
      if (ci !== lastCard) {
        lastCard = ci;
        cards.forEach(function (c, k) { c.classList.toggle('is-on', k === ci); });
      }
      rails.forEach(function (li, k) {
        var f = clamp01(P * 8 - k);
        li.firstChild.style.transform = 'scaleX(' + f.toFixed(3) + ')';
        li.classList.toggle('is-on', k === ci && P < 1);
      });
    }
  }
  buildToc();
  if (lang() === 'tg') setLang('tg', false);
  requestAnimationFrame(tick);
  window.addEventListener('resize', function () { lastY = -1; });

  /* ── появление при прокрутке ── */
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal]').forEach(function (el) { io.observe(el); });
  } else {
    $$('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ── ролики с объекта: грузятся и играют, только когда видны ── */
  var vids = $$('video[data-src]');
  function load(v) { if (!v.getAttribute('src')) { v.src = v.getAttribute('data-src'); } }
  function poster(v) { var p = v.getAttribute('data-poster'); if (p && !v.getAttribute('poster')) v.setAttribute('poster', p); }
  if (reduced) vids.forEach(function (v) { v.controls = true; });
  if ('IntersectionObserver' in window) {
    var pio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        // лента роликов листается вбок — обложки сразу всем её карточкам
        var strip = e.target.closest ? e.target.closest('.log') : null;
        (strip ? $$('video[data-src]', strip) : [e.target]).forEach(function (v) { poster(v); pio.unobserve(v); });
      });
    }, { rootMargin: '900px 0px' });
    vids.forEach(function (v) { pio.observe(v); });
  } else vids.forEach(poster);
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          load(v);
          if (!reduced) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        } else if (!v.paused) v.pause();
      });
    }, { threshold: 0.35 });
    vids.forEach(function (v) { vio.observe(v); });
  }
  function toggle(v) {
    load(v);
    if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
  }
  vids.forEach(function (v) {
    v.addEventListener('click', function () { if (!v.controls) toggle(v); });
    v.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(v); }
    });
  });

  /* ── калькулятор окупаемости (в евро, как цена программы) ── */
  var calc = $('[data-calc]');
  if (calc) {
    var inVol = $('[data-in="vol"]', calc), inPct = $('[data-in="pct"]', calc);
    var oVol = $('[data-out="vol"]', calc), oPct = $('[data-out="pct"]', calc);
    var oYear = $('[data-out="year"]', calc), oPb = $('[data-out="pb"]', calc);
    var PRICE = 90000; // первый этап: 3 месяца × 30 000 €
    var pbBox = $('[data-pb]', calc), warn = $('[data-warn]', calc);
    var grp = function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); };
    var dec = function (n, d) { return n.toFixed(d).replace(/\.?0+$/, '').replace('.', ','); };
    var fill = function (inp) { inp.style.setProperty('--fill', ((inp.value - inp.min) / (inp.max - inp.min) * 100) + '%'); };
    var upd = function () {
      var vol = parseFloat(inVol.value), pct = parseFloat(inPct.value);
      oVol.textContent = '€' + dec(vol, 1) + '\u00a0млн';
      oPct.textContent = dec(pct, 1) + '%';
      oYear.textContent = '€' + grp(vol * 1e6 * pct / 100);
      var pb = PRICE / (vol * 1e6) * 100;
      var off = pb >= pct * 0.8;
      oPb.textContent = off ? '—' : dec(pb, pb >= 1 ? 1 : 2) + '%';
      if (pbBox) pbBox.classList.toggle('is-off', off);
      if (warn) warn.hidden = !off;
      fill(inVol); fill(inPct);
    };
    inVol.addEventListener('input', upd);
    inPct.addEventListener('input', upd);
    upd();
  }

  /* ── чат с ботом ── */
  var chatBox = $('[data-chat]');
  if (chatBox) {
    var list = $('.chat', chatBox);
    var msgs = $$('.msg', list);
    var typing = document.createElement('li');
    typing.className = 'typing';
    typing.setAttribute('aria-hidden', 'true');
    typing.innerHTML = '<i></i><i></i><i></i>';
    var timers = [], started = false;
    var toEnd = function () { list.scrollTo({ top: list.scrollHeight, behavior: reduced ? 'auto' : 'smooth' }); };
    var clear = function () { timers.forEach(clearTimeout); timers = []; if (typing.parentNode) typing.remove(); };
    var showAll = function () { clear(); msgs.forEach(function (m) { m.classList.add('is-in'); }); };
    var play = function () {
      clear();
      msgs.forEach(function (m) { m.classList.remove('is-in'); });
      list.scrollTop = 0;
      if (reduced) { showAll(); return; }
      var t = 300;
      msgs.forEach(function (m) {
        var bot = m.classList.contains('msg--bot');
        if (bot) {
          timers.push(setTimeout(function () { list.appendChild(typing); toEnd(); }, t));
          t += 850;
        } else t += 500;
        timers.push(setTimeout(function () { if (typing.parentNode) typing.remove(); m.classList.add('is-in'); toEnd(); }, t));
        t += bot ? 650 : 900;
      });
    };
    $('[data-replay]', chatBox).addEventListener('click', play);
    if ('IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting && !started) { started = true; play(); cio.disconnect(); } });
      }, { threshold: 0.35 });
      cio.observe(chatBox);
    } else showAll();
  }
})();
