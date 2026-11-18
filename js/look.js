/* Legwork · the site's look ("sheets"). Motion and header state;
   nothing here changes what the page says. */
(function () {
  'use strict';
  var root = document.documentElement;

  /* The header is see-through while the dark hero is behind it. */
  var hero = document.querySelector('.hero');
  var nav = document.querySelector('.site-nav');
  if (hero && nav) {
    var onScroll = function () {
      var dark = hero.getBoundingClientRect().bottom > nav.offsetHeight + 8;
      root.classList.toggle('x-ondark', dark);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm || !('IntersectionObserver' in window)) return;

  var groups = [
    '.integrations__logos', '.problem__grid', '.product__stages', '.ps-cards',
    '.workflows__list', '.security__grid', '.faq__list', '.ps-flow', '.ps-platform',
    '.ps-personas', '.about-how__grid', '.about-founder__cards'
  ];
  var singles = [
    '.integrations__title', '.integrations__desc', '.problem__title', '.feedback__title', '.fb',
    '.product__title', '.product__desc', '.product__embed', '.section-title', '.section-lede',
    '.workflows__intro h2', '.workflows__intro p', '.receipt__title', '.receipt__desc',
    '.security__title', '.faq__title', '.hotline__inner > *', '.ps-group', '.ps-detail'
  ];
  var items = [];
  groups.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (g) {
      Array.prototype.forEach.call(g.children, function (el, i) {
        el.style.setProperty('--x-d', Math.min(i, 8) * 60 + 'ms');
        items.push(el);
      });
    });
  });
  singles.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (items.indexOf(el) === -1) items.push(el);
    });
  });

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
      setTimeout(function () {
        el.classList.remove('x-r', 'x-in');
        el.style.removeProperty('--x-d');
      }, 1500);
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });

  items.forEach(function (el) { el.classList.add('x-r'); });
  root.classList.add('x-js');
  items.forEach(function (el) { io.observe(el); });
  document.querySelectorAll('.stat').forEach(function (el) { io.observe(el); });

  setTimeout(function () {
    items.forEach(function (el) {
      if (el.classList.contains('x-r') && !el.classList.contains('x-in')) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('x-in');
      }
    });
  }, 2500);
})();
