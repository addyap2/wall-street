// ===== Wall Street — interactions =====

// Ambient videos (Live & matchs, La carte): poster underneath; play in view
(function () {
  const vids = document.querySelectorAll('.js-ambient-video');
  if (!vids.length) return;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  vids.forEach(function (vid) { vid.muted = true; }); // muted so autoplay is allowed
  if (reduce) {
    vids.forEach(function (vid) { vid.removeAttribute('autoplay'); vid.setAttribute('controls', ''); });
    return;
  }
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      const vid = e.target;
      if (e.isIntersecting) { const p = vid.play(); if (p && p.catch) p.catch(function () {}); }
      else { vid.pause(); }
    });
  }, { threshold: 0.25 });
  vids.forEach(function (vid) { io.observe(vid); });
})();

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const mobileMenu = document.getElementById('mobileMenu');

if (toggle && mobileMenu) {
  toggle.addEventListener('click', () => {
    const open = toggle.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    mobileMenu.hidden = !open;
  });
  mobileMenu.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      mobileMenu.hidden = true;
    })
  );
}

// Menu tabs — accessible tabs pattern (ARIA + keyboard)
const tabs = Array.from(document.querySelectorAll('.tab'));
const panels = Array.from(document.querySelectorAll('.menu__panel'));

tabs.forEach((tab, i) => {
  const target = tab.dataset.tab;
  const panel = document.querySelector(`[data-panel="${target}"]`);
  const selected = tab.classList.contains('is-active');
  tab.id = tab.id || `tab-${target}`;
  tab.setAttribute('aria-selected', selected ? 'true' : 'false');
  tab.setAttribute('tabindex', selected ? '0' : '-1');
  if (panel) {
    panel.id = panel.id || `panel-${target}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('tabindex', '0');
    panel.setAttribute('aria-labelledby', tab.id);
    tab.setAttribute('aria-controls', panel.id);
  }

  function activate(focus) {
    tabs.forEach((t) => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); t.setAttribute('tabindex', '-1'); });
    panels.forEach((p) => p.classList.remove('is-active'));
    tab.classList.add('is-active');
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabindex', '0');
    if (panel) panel.classList.add('is-active');
    if (focus) tab.focus();
  }

  tab.addEventListener('click', () => activate(false));
  tab.addEventListener('keydown', (e) => {
    let idx = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') idx = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') idx = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') idx = 0;
    else if (e.key === 'End') idx = tabs.length - 1;
    if (idx !== null) { e.preventDefault(); tabs[idx].click(); tabs[idx].focus(); }
  });
});

// Footer year (also re-applied after a language switch rebuilds the footer line)
function fillYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}
fillYear();

// ===== Open-now live status (from real opening hours) =====
// Minutes from midnight. Fri/Sat close at 01:00 (=1500, next day).
// Dim fermé · Mon–Thu 08:00–00:00 · Fri–Sat 08:00–01:00
(function () {
  const statusEls = document.querySelectorAll('[data-status]');
  if (!statusEls.length) return;

  const sch = {
    0: null,  // Dimanche fermé
    1: [480, 1440], 2: [480, 1440], 3: [480, 1440], 4: [480, 1440], // Lun–Jeu 8h–00h
    5: [480, 1500], 6: [480, 1500]  // Ven–Sam 8h–01h
  };

  const i18n = {
    fr: {
      days: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
      open: 'Ouvert maintenant',
      opensAt: function (t) { return 'Fermé · ouvre à ' + t; },
      opensWhen: function (when, t) { return 'Fermé · ouvre ' + when + ' à ' + t; },
      tomorrow: 'demain',
      fmt: function (m) {
        const h = Math.floor(m / 60) % 24, mm = m % 60;
        return mm ? h + 'h' + (mm < 10 ? '0' + mm : mm) : h + 'h';
      }
    },
    en: {
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      open: 'Open now',
      opensAt: function (t) { return 'Closed · opens at ' + t; },
      opensWhen: function (when, t) { return 'Closed · opens ' + when + ' at ' + t; },
      tomorrow: 'tomorrow',
      fmt: function (m) {
        let h = Math.floor(m / 60) % 24; const mm = m % 60;
        const period = h < 12 ? 'am' : 'pm';
        let h12 = h % 12; if (h12 === 0) h12 = 12;
        return mm ? h12 + ':' + (mm < 10 ? '0' + mm : mm) + period : h12 + period;
      }
    }
  };

  function nextOpen(fromDay) {
    for (let i = 1; i <= 7; i++) {
      const d = (fromDay + i) % 7;
      if (sch[d]) return { day: d, offset: i, opens: sch[d][0] };
    }
    return null;
  }

  function compute() {
    const L = i18n[document.documentElement.lang === 'en' ? 'en' : 'fr'];
    const now = new Date();
    const day = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();
    const today = sch[day];
    const yest = sch[(day + 6) % 7];

    let open = today ? mins >= today[0] && mins < today[1] : false;
    if (!open && yest && yest[1] > 1440 && mins < yest[1] - 1440) open = true; // early-morning spill

    let text;
    if (open) {
      text = L.open;
    } else if (today && mins < today[0]) {
      text = L.opensAt(L.fmt(today[0]));
    } else {
      const nxt = nextOpen(day);
      const when = nxt.offset === 1 ? L.tomorrow : L.days[nxt.day];
      text = L.opensWhen(when, L.fmt(nxt.opens));
    }

    statusEls.forEach(function (el) {
      el.hidden = false;
      el.classList.remove('is-open', 'is-closed');
      el.classList.add(open ? 'is-open' : 'is-closed');
      const t = el.querySelector('.status__text');
      if (t) t.textContent = text;
    });
  }

  compute();
  setInterval(compute, 60000); // refresh each minute
  document.addEventListener('ws:langchange', compute); // re-render on language switch
})();

// ===== Language toggle (FR default · EN) =====
(function () {
  const STORE = 'ws-lang';
  const frCache = new WeakMap();   // element -> original French innerHTML
  const frAria = new WeakMap();    // element -> original French aria-label

  const META = {
    fr: {
      title: 'Wall Street — Pub Restaurant à Fréjus',
      desc: 'Wall Street, bar · brasserie · pub restaurant à Fréjus. Concerts live & DJ sets, tous les matchs sur écran géant, cuisine 100% maison, bières & cocktails. Good food, good drinks, good people.'
    },
    en: {
      title: 'Wall Street — Pub Restaurant in Fréjus',
      desc: 'Wall Street, bar · brasserie · pub restaurant in Fréjus. Live gigs & DJ sets, every match on the big screen, 100% homemade food, beers & cocktails. Good food, good drinks, good people.'
    }
  };

  function getLang() {
    try { return localStorage.getItem(STORE) === 'en' ? 'en' : 'fr'; } catch (e) { return 'fr'; }
  }

  function apply(lang) {
    const en = lang === 'en';
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-en]').forEach(function (el) {
      if (!frCache.has(el)) frCache.set(el, el.innerHTML);
      el.innerHTML = en ? el.getAttribute('data-en') : frCache.get(el);
    });

    document.querySelectorAll('[data-en-aria]').forEach(function (el) {
      if (!frAria.has(el)) frAria.set(el, el.getAttribute('aria-label') || '');
      el.setAttribute('aria-label', en ? el.getAttribute('data-en-aria') : frAria.get(el));
    });

    const meta = META[lang];
    document.title = meta.title;
    const md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', meta.desc);

    // Toggle button state
    document.querySelectorAll('[data-lang-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-label', en ? 'Passer en français' : 'Switch to English');
      btn.querySelectorAll('[data-lang-opt]').forEach(function (opt) {
        opt.classList.toggle('is-active', opt.getAttribute('data-lang-opt') === lang);
      });
    });

    if (typeof fillYear === 'function') fillYear(); // footer line is rebuilt by the swap
    try { localStorage.setItem(STORE, lang); } catch (e) {}
    document.dispatchEvent(new CustomEvent('ws:langchange', { detail: { lang: lang } }));
  }

  document.querySelectorAll('[data-lang-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      apply(getLang() === 'en' ? 'fr' : 'en');
    });
  });

  apply(getLang());
})();

// ===== Weekly menu ticker (crossing scroll under the header) =====
// Source of truth: the .week-days list. Past weekdays drop off as the
// week progresses; on weekends (nothing left) the strip hides itself.
(function () {
  const ticker = document.getElementById('weekTicker');
  if (!ticker) return;
  const track = ticker.querySelector('.week-ticker__track');
  const source = Array.prototype.slice.call(document.querySelectorAll('.week-days li'));
  if (!track || !source.length) { ticker.hidden = true; return; }

  const reduce = !document.documentElement.classList.contains('motion');
  let anim = null;

  function upcoming() {
    const today = new Date().getDay(); // 0 Sun … 6 Sat
    const out = [];
    source.forEach(function (li) {
      const d = parseInt(li.getAttribute('data-day'), 10);
      if (!d) return;
      // Show today onward, Mon–Fri only. Weekends: nothing remains.
      if (today >= 1 && today <= 5 && d >= today) {
        const dayEl = li.querySelector('.wd-day');
        const dishEl = li.querySelector('.wd-dish');
        if (dayEl && dishEl) out.push({ day: dayEl.textContent.trim(), dish: dishEl.textContent.trim() });
      }
    });
    return out;
  }

  function buildGroup(items) {
    const g = document.createElement('span');
    g.className = 'week-ticker__group';
    g.style.display = 'inline-flex';
    g.style.alignItems = 'center';
    items.forEach(function (it) {
      const item = document.createElement('span');
      item.className = 'week-ticker__item';
      const day = document.createElement('span');
      day.className = 'week-ticker__day';
      day.textContent = it.day;
      const dish = document.createElement('span');
      dish.className = 'week-ticker__dish';
      dish.textContent = it.dish;
      item.appendChild(day);
      item.appendChild(dish);
      g.appendChild(item);
      const sep = document.createElement('span');
      sep.className = 'week-ticker__sep';
      sep.setAttribute('aria-hidden', 'true');
      sep.textContent = '•';
      g.appendChild(sep);
    });
    return g;
  }

  function render() {
    if (anim) { anim.cancel(); anim = null; }
    track.innerHTML = '';
    const items = upcoming();
    if (!items.length) { ticker.hidden = true; return; }
    ticker.hidden = false;

    const group = buildGroup(items);
    track.appendChild(group);

    if (reduce || typeof track.animate !== 'function') return; // static, swipeable

    // Repeat the group enough to cover the viewport twice, then loop by one group width.
    const groupW = group.getBoundingClientRect().width;
    if (groupW < 1) return;
    const need = Math.max(2, Math.ceil((ticker.getBoundingClientRect().width * 2) / groupW) + 1);
    for (let k = 1; k < need; k++) track.appendChild(group.cloneNode(true));

    const speed = 65; // px per second
    anim = track.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(' + (-groupW) + 'px)' }],
      { duration: Math.max(9000, (groupW / speed) * 1000), iterations: Infinity, easing: 'linear' }
    );
  }

  render();
  ticker.addEventListener('mouseenter', function () { if (anim) anim.pause(); });
  ticker.addEventListener('mouseleave', function () { if (anim) anim.play(); });
  document.addEventListener('ws:langchange', render); // rebuild in the new language

  // Re-fit on resize (debounced) so the loop always fills the width.
  let rt = null;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(render, 200);
  }, { passive: true });
})();
