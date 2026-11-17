/* Legwork · the site's look: motion only. Nothing here changes what the page
   says. Blocks rise in as they enter the screen, the headline numbers count
   up once, and cards follow the pointer with a soft light. Remove the
   <script> tag for this file and the page is exactly as it was. */
(function () {
  'use strict';
  var root = document.documentElement;
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Pointer light on cards. */
  var lit = '.problem__card,.ps-band--white .ps-card,.security-card';
  document.addEventListener('pointermove', function (e) {
    var card = e.target && e.target.closest ? e.target.closest(lit) : null;
    if (!card) return;
    var r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  if (calm || !('IntersectionObserver' in window)) return;

  /* Rise-in. Groups stagger their children; single blocks rise alone. */
  var groups = [
    '.integrations__logos', '.problem__grid', '.product__stages',
    '.ps-cards', '.workflows__list', '.security__grid', '.faq__list', '.ps-flow',
    '.ps-platform', '.ps-personas', '.about-how__grid', '.about-founder__cards', '.ps-facts'
  ];
  var singles = [
    '.integrations > .eyebrow', '.integrations__title', '.integrations__desc',
    '.problem > .eyebrow', '.problem__title', '.feedback__inner > *', '.product__intro',
    '.product__embed', '.ps-head', '.workflows__intro', '.receipt__inner',
    '.security > .eyebrow', '.security__title', '.faq > .eyebrow', '.faq__title',
    '.hotline__inner > *', '.ps-group', '.ps-side__card', '.ps-detail', '.ps-close > *',
    '.pr-plan', '.about-story__grid > *'
  ];
  var items = [];
  groups.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (g) {
      Array.prototype.forEach.call(g.children, function (el, i) {
        el.style.setProperty('--x-d', Math.min(i, 8) * 70 + 'ms');
        items.push(el);
      });
    });
  });
  singles.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (items.indexOf(el) === -1) items.push(el);
    });
  });
  if (!items.length) return;

  function countUp(el) {
    var end = parseInt(el.textContent, 10);
    if (!(end > 0) || String(end) !== el.textContent.trim()) return;
    var t0 = null, dur = 1400;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step); else el.textContent = String(end);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      io.unobserve(el);
      el.classList.add('x-in');
      var big = el.querySelector ? el.querySelector('.stat__big') : null;
      if (big) countUp(big);
      /* Hand the element back to its own hover transitions once it has landed. */
      setTimeout(function () {
        el.classList.remove('x-r', 'x-in');
        el.style.removeProperty('--x-d');
      }, 1700);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

  items.forEach(function (el) { el.classList.add('x-r'); });
  root.classList.add('x-js');
  items.forEach(function (el) { io.observe(el); });
  /* The headline numbers stay in place; they only count up. */
  document.querySelectorAll('.stat').forEach(function (el) { io.observe(el); });

  /* Failsafe: never leave anything hidden. */
  setTimeout(function () {
    items.forEach(function (el) {
      if (el.classList.contains('x-r') && !el.classList.contains('x-in')) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('x-in');
      }
    });
  }, 2500);
})();
