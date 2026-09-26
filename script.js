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

// Menu tabs
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.menu__panel');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    tabs.forEach((t) => t.classList.remove('is-active'));
    panels.forEach((p) => p.classList.remove('is-active'));
    tab.classList.add('is-active');
    const panel = document.querySelector(`[data-panel="${target}"]`);
    if (panel) panel.classList.add('is-active');
  });
});

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== Open-now live status (from real opening hours) =====
// Minutes from midnight. Fri/Sat close at 01:00 (=1500, next day).
// Sun 16:30–00:00 · Mon–Thu 08:00–00:00 · Fri–Sat 08:00–01:00
(function () {
  const statusEls = document.querySelectorAll('[data-status]');
  if (!statusEls.length) return;

  const sch = {
    0: [990, 1440],  // Dim 16h30–00h00
    1: [480, 1440], 2: [480, 1440], 3: [480, 1440], 4: [480, 1440], // Lun–Jeu 8h–00h
    5: [480, 1500], 6: [480, 1500]  // Ven–Sam 8h–01h
  };

  function fmt(m) {
    const h = Math.floor(m / 60) % 24, mm = m % 60;
    return mm ? h + 'h' + (mm < 10 ? '0' + mm : mm) : h + 'h';
  }

  function compute() {
    const now = new Date();
    const day = now.getDay();
    const mins = now.getHours() * 60 + now.getMinutes();
    const today = sch[day];
    const yest = sch[(day + 6) % 7];

    let open = mins >= today[0] && mins < today[1];
    if (!open && yest[1] > 1440 && mins < yest[1] - 1440) open = true; // early-morning spill

    let text;
    if (open) {
      text = 'Ouvert maintenant';
    } else if (mins < today[0]) {
      text = 'Fermé · ouvre à ' + fmt(today[0]);
    } else {
      text = 'Fermé · ouvre demain à ' + fmt(sch[(day + 1) % 7][0]);
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
