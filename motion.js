/* ============================================================
   WALL STREET — MOTION ENGINE
   Dependency-free. Everything transform/opacity based, driven by
   IntersectionObserver + a single rAF scroll loop. All effects
   gate on html.motion (absent when reduced motion is requested).
   ============================================================ */
(function () {
  'use strict';

  var docEl = document.documentElement;
  var MOTION = docEl.classList.contains('motion');
  var finePointer = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = !MOTION;

  /* ---------- helpers ---------- */
  function $(s, c) { return (c || document).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ============================================================
     PRELOADER  →  HERO
     ============================================================ */
  var preloader = $('#preloader');
  var hero = $('.hero');
  var header = $('.site-header');
  var revealed = false;

  function startHero() {
    if (header) header.classList.add('is-ready');
    if (hero) hero.classList.add('is-in');
  }

  function liftCurtain() {
    if (revealed) return;
    revealed = true;
    document.body.classList.remove('is-locked');
    if (preloader) {
      preloader.classList.add('is-hidden');
      setTimeout(function () { if (preloader && preloader.parentNode) preloader.parentNode.removeChild(preloader); }, 900);
    }
    // overlap: hero begins while the curtain is still travelling
    setTimeout(startHero, 120);
  }

  if (!MOTION) {
    // Reduced motion / no-JS-motion: no curtain, no staging, just show.
    if (preloader && preloader.parentNode) preloader.parentNode.removeChild(preloader);
    document.body.classList.remove('is-locked');
  } else {
    document.body.classList.add('is-locked');
    var minShow = 1100, t0 = performance.now();
    window.addEventListener('load', function () {
      var wait = Math.max(0, minShow - (performance.now() - t0));
      setTimeout(liftCurtain, wait);
    });
    // safety net if `load` never fires
    setTimeout(liftCurtain, 3600);
  }

  /* ============================================================
     SCROLL REVEALS  (choreographed entrances + staggers)
     ============================================================ */
  function tagReveal(el, variant) {
    if (!el) return;
    el.classList.add('reveal');
    if (variant) el.classList.add(variant);
  }
  function stagger(items, step, base) {
    step = step || 90; base = base || 0;
    items.forEach(function (el, i) { el.style.setProperty('--delay', (base + i * step) + 'ms'); });
  }

  /* Split a heading into per-word masks so each word rises on its own.
     Rebuilds from the element's current text, so it also re-runs after
     a FR/EN swap. Words carry a staggered --delay. */
  var HEADING_SEL = '.section-head h2, .program__intro h2, .events__text h2';
  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function splitWords(el) {
    var text = (el.textContent || '').trim();
    if (!text) return;
    var words = text.split(/\s+/), html = '';
    for (var i = 0; i < words.length; i++) {
      html += '<span class="w-mask"><span class="w" style="--delay:' + (i * 70) + 'ms">' +
              escapeHtml(words[i]) + '</span></span>';
      if (i < words.length - 1) html += ' ';
    }
    el.innerHTML = html;
    el.classList.add('text-rise');
  }

  if (MOTION && 'IntersectionObserver' in window) {
    // Section headers rise as masked titles
    $all('.section-head').forEach(function (head) {
      tagReveal(head);
      var h2 = $('h2', head);
      if (h2) { head.classList.add('has-title'); }
    });

    // Motion text: per-word rise on major headings
    var headings = $all(HEADING_SEL);
    headings.forEach(splitWords);

    // Concept feature cards — staggered
    var features = $all('.feature'); features.forEach(function (f) { tagReveal(f); }); stagger(features, 90);

    // Menu tabs + panel
    tagReveal($('.menu__tabs'));
    tagReveal($('.menu__cols'), 'reveal--zoom');

    // Events panel — text rises left, media from the right
    var evText = $('.events__text');
    if (evText) { var kids = $all(':scope > *', evText); kids.forEach(tagReveal); stagger(kids, 80); }
    tagReveal($('.events__media'), 'reveal--right');

    // Gallery mosaic — staggered
    var gitems = $all('.gallery__item'); gitems.forEach(function (g) { tagReveal(g, 'reveal--zoom'); }); stagger(gitems, 100);

    // FAQ items — staggered
    var faqs = $all('.faq__item'); faqs.forEach(function (f) { tagReveal(f); }); stagger(faqs, 70);

    // Info cards — staggered
    var cards = $all('.info-card'); cards.forEach(function (c) { tagReveal(c); }); stagger(cards, 90);

    // Footer brand
    tagReveal($('.site-footer__brand'), 'reveal--zoom');

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add('in');
        // drop will-change after the transition to free the compositor
        setTimeout(function () { el.classList.add('is-done'); }, 1400);
        io.unobserve(el);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

    $all('.reveal').forEach(function (el) { io.observe(el); });
    headings.forEach(function (el) { io.observe(el); });

    // Re-run the word split after a language switch (text was replaced).
    // The heading is already on screen, so reveal it immediately.
    document.addEventListener('ws:langchange', function () {
      $all(HEADING_SEL).forEach(function (h) {
        splitWords(h);
        h.classList.add('in', 'is-done');
      });
    });
  }

  /* ============================================================
     SINGLE rAF SCROLL LOOP  (progress bar · parallax · scrollspy)
     ============================================================ */
  var progressFill = $('.scroll-progress span');
  var parallaxEls = MOTION && finePointer ? $all('[data-parallax]') : [];
  var navLinks = $all('.nav a');
  var sections = navLinks.map(function (a) {
    var id = a.getAttribute('href'); return id && id.charAt(0) === '#' ? $(id) : null;
  });

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var st = window.pageYOffset || docEl.scrollTop;
      var vh = window.innerHeight;
      var max = docEl.scrollHeight - vh;

      // progress bar
      if (progressFill) progressFill.style.transform = 'scaleX(' + (max > 0 ? clamp(st / max, 0, 1) : 0) + ')';

      // parallax (translateY relative to viewport centre)
      for (var i = 0; i < parallaxEls.length; i++) {
        var el = parallaxEls[i];
        var r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) continue;
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.1;
        var offset = (r.top + r.height / 2 - vh / 2) * -speed;
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      }

      // scrollspy
      var mid = st + vh * 0.35, current = -1;
      for (var j = 0; j < sections.length; j++) {
        var s = sections[j];
        if (s && s.offsetTop <= mid) current = j;
      }
      navLinks.forEach(function (a, k) { a.classList.toggle('is-current', k === current); });

      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ============================================================
     HERO 3D POINTER TILT  (desktop only)
     Poster reacts to cursor as a shallow camera parallax.
     ============================================================ */
  if (MOTION && finePointer && hero) {
    var poster = $('.hero__poster');
    var art = $('.hero__art');
    if (poster && art) {
      art.style.perspective = '900px';
      var raf = null, tx = 0, ty = 0;
      hero.addEventListener('mousemove', function (ev) {
        var r = hero.getBoundingClientRect();
        tx = ((ev.clientX - r.left) / r.width - 0.5);   // -0.5..0.5
        ty = ((ev.clientY - r.top) / r.height - 0.5);
        if (!raf) raf = requestAnimationFrame(applyTilt);
      });
      hero.addEventListener('mouseleave', function () {
        tx = 0; ty = 0;
        poster.classList.add('is-idle');
        poster.style.transform = 'rotate(2.5deg)';
      });
      function applyTilt() {
        raf = null;
        poster.classList.remove('is-idle');
        poster.style.transform =
          'rotate(2.5deg) rotateX(' + (-ty * 5).toFixed(2) + 'deg) rotateY(' + (tx * 6).toFixed(2) + 'deg)';
      }
    }
  }

  /* ============================================================
     MAGNETIC BUTTONS  (desktop only)
     ============================================================ */
  if (MOTION && finePointer) {
    $all('.btn').forEach(function (btn) {
      var frame = null;
      btn.addEventListener('mousemove', function (ev) {
        var r = btn.getBoundingClientRect();
        var mx = ev.clientX - r.left - r.width / 2;
        var my = ev.clientY - r.top - r.height / 2;
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(function () {
          btn.style.transform = 'translate(' + (mx * 0.18).toFixed(1) + 'px,' + (my * 0.28).toFixed(1) + 'px)';
        });
      });
      btn.addEventListener('mouseleave', function () {
        if (frame) cancelAnimationFrame(frame);
        btn.style.transform = '';
      });
    });
  }
})();
