// ===== Wall Street — interactions =====

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

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

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

  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

  function fmt(m) {
    const h = Math.floor(m / 60) % 24, mm = m % 60;
    return mm ? h + 'h' + (mm < 10 ? '0' + mm : mm) : h + 'h';
  }

  function nextOpen(fromDay) {
    for (let i = 1; i <= 7; i++) {
      const d = (fromDay + i) % 7;
      if (sch[d]) return { day: d, offset: i, opens: sch[d][0] };
    }
    return null;
  }

  function compute() {
    const now = new Date();
    const day = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();
    const today = sch[day];
    const yest = sch[(day + 6) % 7];

    let open = today ? mins >= today[0] && mins < today[1] : false;
    if (!open && yest && yest[1] > 1440 && mins < yest[1] - 1440) open = true; // early-morning spill

    let text;
    if (open) {
      text = 'Ouvert maintenant';
    } else if (today && mins < today[0]) {
      text = 'Fermé · ouvre à ' + fmt(today[0]);
    } else {
      const nxt = nextOpen(day);
      const when = nxt.offset === 1 ? 'demain' : days[nxt.day];
      text = 'Fermé · ouvre ' + when + ' à ' + fmt(nxt.opens);
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
})();
