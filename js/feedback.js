/* Feedback slider (home): one slide at a time, arrows + dots, auto-advance,
   pauses while hovered or focused. No framework; strict CSP, so no inline
   handlers — everything hangs off data-fb attributes. */
(function () {
  "use strict";
  var root = document.querySelector("[data-fb]");
  if (!root) return;
  var slides = Array.prototype.slice.call(root.querySelectorAll("[data-fb-slide]"));
  var dots = Array.prototype.slice.call(root.querySelectorAll("[data-fb-dot]"));
  if (slides.length < 2) return;
  var current = 0, timer = null, interval = Number(root.getAttribute("data-fb-interval")) || 9000;

  function show(n) {
    current = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) {
      var on = i === current;
      s.hidden = !on;
      s.classList.toggle("is-active", on);
    });
    dots.forEach(function (d, i) {
      d.classList.toggle("is-active", i === current);
      d.setAttribute("aria-selected", i === current ? "true" : "false");
    });
  }
  function next() { show(current + 1); }
  function start() { stop(); timer = setInterval(next, interval); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  root.querySelector("[data-fb-prev]").addEventListener("click", function () { show(current - 1); start(); });
  root.querySelector("[data-fb-next]").addEventListener("click", function () { next(); start(); });
  dots.forEach(function (d, i) { d.addEventListener("click", function () { show(i); start(); }); });
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", start);

  // A photo that has not been added yet falls back to the initials.
  root.querySelectorAll(".fb-avatar img").forEach(function (img) {
    img.addEventListener("error", function () { img.parentNode.classList.add("is-missing"); });
  });

  show(0);
  start();
})();
