// ===== Wall Street — interactions =====

// Ambient videos (Live & matchs, La carte): poster underneath; play in view.
// Keep them WITHOUT the autoplay attribute: autoplay overrides preload="none"
// and makes browsers download every clip on page load.
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

// Menu tabs — accessible tabs pattern (ARIA + keyboard).
// Scoped to .menu__tabs: other controls (the gallery filter chips) reuse the .tab look.
const tabs = Array.from(document.querySelectorAll('.menu__tabs .tab'));
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
    // phones: the tab row scrolls sideways; bring the chosen tab fully into view
    const row = tab.parentElement;
    if (row && row.scrollWidth > row.clientWidth) {
      const dx = tab.getBoundingClientRect().left - row.getBoundingClientRect().left;
      row.scrollTo({ left: row.scrollLeft + dx - (row.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
    }
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

// Phones: the tab row scrolls sideways — fade the edge that has more tabs behind it
(function () {
  const row = document.querySelector('.menu__tabs');
  if (!row) return;
  function edges() {
    const max = row.scrollWidth - row.clientWidth;
    row.classList.toggle('has-more-left', row.scrollLeft > 4);
    row.classList.toggle('has-more-right', row.scrollLeft < max - 4);
  }
  row.addEventListener('scroll', edges, { passive: true });
  window.addEventListener('resize', edges);
  edges();
})();

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

// ===== Dated weekly menu helpers =====
// Each .week-days li carries data-date="YYYY-MM-DD". The menu is "live"
// until the day after its last dated dish; undated lists are always live.
function wsMenuDate(li) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(li.getAttribute('data-date') || '');
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}
function wsStartOfToday() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
function wsMenuLive(items) {
  const dates = items.map(wsMenuDate).filter(Boolean);
  if (!dates.length) return true;
  return Math.max.apply(null, dates) >= wsStartOfToday().getTime();
}

// ===== Multiple dated weeks: pick the active one, hide the rest =====
// Pre-load weeks by adding <ul class="week-days" data-week="YYYY-MM-DD">
// (its Monday). Current week Mon–Fri; from Saturday the next week takes
// over. With a single list it's always shown (behaviour unchanged).
function wsMonday(d, add) {
  const o = d.getDay() === 0 ? 7 : d.getDay();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - (o - 1) + 7 * (add || 0));
}
function wsWeekIso(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function wsActiveWeek() {
  const lists = Array.prototype.slice.call(document.querySelectorAll('ul.week-days'));
  const dated = lists.filter(function (u) { return u.getAttribute('data-week'); });
  if (dated.length < 2) return lists[0] || null;
  const now = new Date();
  const target = wsWeekIso(wsMonday(now, (now.getDay() === 6 || now.getDay() === 0) ? 1 : 0));
  let best = null, earliest = null;
  dated.forEach(function (u) {
    const w = u.getAttribute('data-week');
    if (!earliest || w < earliest.getAttribute('data-week')) earliest = u;
    if (w <= target && (!best || w > best.getAttribute('data-week'))) best = u;
  });
  return best || earliest;
}
(function () {
  const lists = Array.prototype.slice.call(document.querySelectorAll('ul.week-days'));
  if (lists.length < 2) return;
  const active = wsActiveWeek();
  lists.forEach(function (u) { u.hidden = u !== active; });
})();

// ===== Weekly menu ticker (crossing scroll under the header) =====
// Source of truth: the .week-days list. Shows the whole dated week (so on
// weekends it already announces next week's menu) and hides once it's past.
(function () {
  const ticker = document.getElementById('weekTicker');
  if (!ticker) return;
  const track = ticker.querySelector('.week-ticker__track');
  const aw = wsActiveWeek();
  const source = aw ? Array.prototype.slice.call(aw.querySelectorAll('li')) : [];
  if (!track || !source.length) { ticker.hidden = true; return; }

  const reduce = !document.documentElement.classList.contains('motion');
  let anim = null;

  function upcoming() {
    const out = [];
    if (!wsMenuLive(source)) return out;
    source.forEach(function (li) {
      const d = parseInt(li.getAttribute('data-day'), 10);
      if (!d) return;
      // Show the whole current week, Mon–Fri (including days already passed).
      if (d >= 1 && d <= 5) {
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

// ===== Weekly agenda / calendar =====
// Menu cells pull from the .week-days list (single source). Today is
// highlighted; earlier days this week fade back. Entertainment is authored
// in the markup and only re-localised here.
(function () {
  const grid = document.getElementById('weekCalendar');
  if (!grid) return;
  const cells = Array.prototype.slice.call(grid.querySelectorAll('.agenda__day'));
  const aw = wsActiveWeek();
  const menuSrc = aw ? Array.prototype.slice.call(aw.querySelectorAll('li')) : [];

  function dishForDay(d) {
    for (let i = 0; i < menuSrc.length; i++) {
      if (parseInt(menuSrc[i].getAttribute('data-day'), 10) === d) {
        const el = menuSrc[i].querySelector('.wd-dish');
        return el ? el.textContent.trim() : '';
      }
    }
    return '';
  }

  function paint() {
    const today = wsStartOfToday();
    const todayOrder = today.getDay() === 0 ? 7 : today.getDay(); // Mon=1 … Sun=7
    // Monday of the current week (local time)…
    let monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (todayOrder - 1));
    // …or of the menu's week, while that menu is live (e.g. next week's, posted at the weekend).
    const live = wsMenuLive(menuSrc);
    const first = menuSrc.map(wsMenuDate).filter(Boolean).sort(function (a, b) { return a - b; })[0];
    if (live && first) {
      const fo = first.getDay() === 0 ? 7 : first.getDay();
      monday = new Date(first.getFullYear(), first.getMonth(), first.getDate() - (fo - 1));
    }
    const locale = document.documentElement.lang === 'en' ? 'en-GB' : 'fr-FR';
    cells.forEach(function (cell) {
      const d = parseInt(cell.getAttribute('data-day'), 10); // 1 Mon … 7 Sun
      const cellDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + (d - 1));
      // fill menu from the week list (blank once that menu's week is over)
      const menuEl = cell.querySelector('.agenda__menu');
      const menuItem = cell.querySelector('.agenda__item--menu');
      if (menuEl) {
        const dish = live ? dishForDay(d) : '';
        menuEl.textContent = dish;
        if (menuItem) menuItem.hidden = !dish;
      }
      const dateEl = cell.querySelector('.agenda__date');
      if (dateEl) dateEl.textContent = cellDate.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
      // one-off evening shows (data-date) only appear on their own date
      const showEl = cell.querySelector('.agenda__show[data-date]');
      if (showEl && wsMenuDate(showEl) - cellDate !== 0) showEl.textContent = '—';
      // highlight today; keep every day this week (incl. past) fully visible
      cell.classList.remove('is-today', 'is-past');
      if (cellDate.getTime() === today.getTime()) cell.classList.add('is-today');
    });
  }

  paint();
  document.addEventListener('ws:langchange', paint); // menu text may have switched language
  // Tick over at local midnight so "today" stays correct on long-open tabs.
  const now = new Date();
  const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
  setTimeout(function () { paint(); setInterval(paint, 86400000); }, msToMidnight + 1000);
})();

// ===== Photo galleries (food + ambiance): filters, "see more", shared lightbox =====
(function () {
  const galleries = ['foodGallery', 'ambianceGallery']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  if (!galleries.length) return;

  const isEn = function () { return document.documentElement.lang === 'en'; };
  function capText(item) {
    const c = item.querySelector('figcaption');
    return c ? c.textContent.trim() : '';
  }

  const lb = buildLightbox();
  galleries.forEach(setupGallery);
  linkMenuPhotos();

  // ---- Menu dishes that have a photo in the food gallery ----
  // <div class="dish" data-photo="food-2 food-12"> gets a round thumbnail after its
  // name; it opens those gallery tiles in the lightbox. Keys are file names
  // (images/food-2.jpg, videos/dessert.mp4) so the menu never repeats image paths.
  function linkMenuPhotos() {
    const food = document.getElementById('foodGallery');
    if (!food) return;
    const tiles = Array.prototype.slice.call(food.querySelectorAll('.food-gallery__item'));
    function tileFor(key) {
      return tiles.find(function (it) {
        const v = it.querySelector('video'), im = it.querySelector('img');
        const src = (v && v.getAttribute('src')) || (im && im.getAttribute('src')) || '';
        return src.indexOf('/' + key + '.') !== -1;
      });
    }
    document.querySelectorAll('.dish[data-photo]').forEach(function (dish) {
      const shots = dish.getAttribute('data-photo').split(/\s+/).map(tileFor).filter(Boolean);
      const name = dish.querySelector('.dish__name');
      if (!shots.length || !name) return;
      const src = shots[0].querySelector('picture source');
      const im = shots[0].querySelector('img');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dish__photo';
      const thumb = document.createElement('img');
      thumb.alt = ''; thumb.width = 56; thumb.height = 56;
      thumb.loading = 'lazy'; thumb.decoding = 'async';
      thumb.src = src ? src.getAttribute('srcset') : (im ? im.getAttribute('src') : '');
      btn.appendChild(thumb);
      function label() {
        const t = name.childNodes[0] ? name.childNodes[0].textContent.trim() : name.textContent.trim();
        const l = (isEn() ? 'See the photo: ' : 'Voir la photo : ') + t;
        btn.setAttribute('aria-label', l);
        btn.title = l;
      }
      label();
      document.addEventListener('ws:langchange', label);
      btn.addEventListener('click', function () { lb.open(shots, shots[0]); });
      name.insertAdjacentElement('afterend', btn);
    });
  }

  // ---- One gallery: tiles as buttons, optional filters + "see more" ----
  // Filters (.food-filters) and the "see more" button (.food-more) are looked up
  // in the gallery's section; a gallery without them simply shows every tile.
  function setupGallery(gallery) {
    const items = Array.prototype.slice.call(gallery.querySelectorAll('.food-gallery__item'));
    if (!items.length) return;
    const section = gallery.closest('section') || document;
    const filterBtns = Array.prototype.slice.call(section.querySelectorAll('.food-filters [data-filter]'));
    const moreWrap = section.querySelector('.food-more');
    const moreBtn = moreWrap ? moreWrap.querySelector('.food-more__btn') : null;
    const moreN = moreWrap ? moreWrap.querySelector('.food-more__n') : null;

    // "All" shows the first few tiles (fewer on phones) until "see more" is pressed;
    // a category always shows all of its tiles.
    const mqSmall = window.matchMedia ? matchMedia('(max-width: 700px)') : null;
    function initialCount() { return mqSmall && mqSmall.matches ? 8 : 12; }
    let filter = 'all';
    let expanded = false;

    function enlargeLabel(item) {
      if (item.hasAttribute('data-video')) return isEn() ? ' — play video' : ' — lire la vidéo';
      return isEn() ? ' — enlarge photo' : ' — agrandir la photo';
    }
    // everything in the active filter, including tiles behind "see more"
    function pool() {
      return items.filter(function (it) { return filter === 'all' || it.getAttribute('data-cat') === filter; });
    }
    function visibleItems() {
      return items.filter(function (it) { return !it.classList.contains('is-hidden'); });
    }

    filterBtns.forEach(function (b) {
      const f = b.getAttribute('data-filter');
      const n = f === 'all' ? items.length : items.filter(function (it) { return it.getAttribute('data-cat') === f; }).length;
      const slot = b.querySelector('.food-filters__n');
      if (slot) slot.textContent = n;
    });

    function apply(revealNew) {
      const inPool = pool();
      const limit = moreWrap && filter === 'all' && !expanded ? initialCount() : Infinity;
      let k = 0;
      items.forEach(function (it) {
        const idx = inPool.indexOf(it);
        const show = idx !== -1 && idx < limit;
        const wasHidden = it.classList.contains('is-hidden');
        it.classList.toggle('is-hidden', !show);
        // Tiles that appear after load: short stagger instead of the long scroll stagger
        if (show && wasHidden && revealNew) it.style.setProperty('--delay', (k++ * 45) + 'ms');
        else if (show && revealNew) it.style.setProperty('--delay', '0ms');
      });
      const rest = inPool.length - Math.min(inPool.length, limit);
      if (moreWrap) {
        moreWrap.hidden = rest <= 0;
        if (moreN) moreN.textContent = '(+' + rest + ')';
      }
      filterBtns.forEach(function (b) {
        const on = b.getAttribute('data-filter') === filter;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    }

    filterBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        filter = b.getAttribute('data-filter');
        apply(true);
      });
    });
    if (moreBtn) {
      moreBtn.addEventListener('click', function () {
        const before = visibleItems().length;
        expanded = true;
        apply(true);
        // keep keyboard users in place: focus the first newly shown tile
        const next = visibleItems()[before];
        if (next) next.focus({ preventScroll: true });
      });
    }
    if (moreWrap && mqSmall && mqSmall.addEventListener) mqSmall.addEventListener('change', function () { apply(false); });
    apply(false);

    items.forEach(function (item) {
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', capText(item) + enlargeLabel(item));
      item.addEventListener('click', function () { lb.open(pool(), item); });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lb.open(pool(), item); }
      });
    });

    document.addEventListener('ws:langchange', function () {
      items.forEach(function (item) { item.setAttribute('aria-label', capText(item) + enlargeLabel(item)); });
    });
  }

  // ---- Lightbox (one, shared by every gallery; plays video tiles) ----
  function buildLightbox() {
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML =
      '<button class="lightbox__btn lightbox__close" type="button" aria-label="Fermer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<button class="lightbox__btn lightbox__prev" type="button" aria-label="Précédent"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<img class="lightbox__img" alt="" />' +
      '<video class="lightbox__video" muted loop playsinline controls preload="auto" hidden></video>' +
      '<button class="lightbox__btn lightbox__next" type="button" aria-label="Suivant"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg></button>' +
      '<p class="lightbox__cap"><span class="lightbox__title"></span><span class="lightbox__count"></span></p>';
    document.body.appendChild(box);

    const bImg = box.querySelector('.lightbox__img');
    const bVid = box.querySelector('.lightbox__video');
    const bTitle = box.querySelector('.lightbox__title');
    const bCount = box.querySelector('.lightbox__count');
    const btnClose = box.querySelector('.lightbox__close');
    const btnPrev = box.querySelector('.lightbox__prev');
    const btnNext = box.querySelector('.lightbox__next');

    let list = [];      // tiles browsable right now (the opened gallery, active filter)
    let current = -1;
    let lastFocused = null;

    function show(i) {
      current = (i + list.length) % list.length;
      const item = list[current];
      const im = item.querySelector('img');
      const v = item.querySelector('video');
      if (v) {
        bImg.hidden = true; bImg.removeAttribute('src');
        bVid.hidden = false;
        bVid.poster = v.getAttribute('poster') || '';
        bVid.src = v.getAttribute('src');
        bVid.setAttribute('aria-label', v.getAttribute('aria-label') || capText(item));
        const p = bVid.play(); if (p && p.catch) p.catch(function () {});
      } else {
        bVid.pause(); bVid.removeAttribute('src'); bVid.load(); bVid.hidden = true;
        bImg.hidden = false;
        bImg.src = im ? (im.currentSrc || im.src) : '';
        bImg.alt = im ? im.alt : '';
      }
      bTitle.textContent = capText(item);
      bCount.textContent = (current + 1) + ' / ' + list.length;
      // warm the next photo
      const nx = list[(current + 1) % list.length].querySelector('picture img');
      if (nx) { const pre = new Image(); pre.src = nx.currentSrc || nx.src; }
    }
    function open(tiles, item) {
      list = tiles;
      lastFocused = document.activeElement;
      show(list.indexOf(item));
      box.classList.add('is-open');
      box.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      btnClose.focus();
    }
    function close() {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      bVid.pause();
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    btnClose.addEventListener('click', close);
    btnPrev.addEventListener('click', function () { show(current - 1); });
    btnNext.addEventListener('click', function () { show(current + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
    });

    // swipe left / right on touch screens
    let x0 = null, y0 = null;
    box.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
    }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
    });

    document.addEventListener('ws:langchange', function () {
      if (box.classList.contains('is-open') && current >= 0) bTitle.textContent = capText(list[current]);
    });

    return { open: open };
  }
})();

// ===== Auto-expiring events =====
// Anything with data-until="YYYY-MM-DD" hides itself the day after that date.
// An optional data-expires ISO timestamp provides an exact closing-time cutoff.
// In-page links pointing at expired sections hide with them.
(function () {
  const items = Array.prototype.slice.call(document.querySelectorAll('[data-until]'));
  if (!items.length) return;

  function sweep() {
    const today = wsStartOfToday();
    items.forEach(function (el) {
      const exact = el.getAttribute('data-expires');
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(el.getAttribute('data-until') || '');
      if (!m) return;
      const exactDate = exact ? new Date(exact) : null;
      const over = exactDate && !isNaN(exactDate.getTime()) ? exactDate <= new Date() : new Date(+m[1], +m[2] - 1, +m[3]) < today;
      el.hidden = over;
      if (el.id) {
        document.querySelectorAll('a[href="#' + el.id + '"]').forEach(function (a) { a.hidden = over; });
      }
    });
  }

  sweep();
  items.forEach(function (el) {
    const exact = el.getAttribute('data-expires');
    const exactDate = exact ? new Date(exact) : null;
    const delay = exactDate && !isNaN(exactDate.getTime()) ? exactDate - new Date() : 0;
    if (delay > 0 && delay < 2147483647) setTimeout(sweep, delay + 1000);
  });
  const now = new Date();
  const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
  setTimeout(function () { sweep(); setInterval(sweep, 86400000); }, msToMidnight + 1000);
})();
