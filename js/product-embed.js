/* Product animation embed (Home #product section).
   - Lazy-loads the iframe's real src from data-src via IntersectionObserver
     once the embed nears the viewport (external file only; CSP is
     script-src 'self', so this cannot be an inline script).
   - Scales the iframe (authored at a fixed 1180x672) down to fit whatever
     size the responsive frame renders at, via a CSS transform.
   - Hides the branded loading spinner once the iframe reports load, and
     leaves it in place (with the rest of the page fully usable) if the
     iframe never loads. */
(function () {
  "use strict";

  var AUTHORED_WIDTH = 1180;
  var AUTHORED_HEIGHT = 672;
  function fit(frame) {
    var parent = frame.parentElement;
    if (!parent) return;
    /* Below the mobile-nav breakpoint the frame renders at natural size:
       the iframe is its container's real width, and the animation's own
       narrow-viewport styles show the rail-less chat layout at authored
       text sizes. Desktop keeps the original scaled-canvas behavior. */
    if (window.matchMedia && window.matchMedia("(max-width: 860px)").matches) {
      frame.classList.add("is-natural");
      frame.style.transform = "";
      return;
    }
    frame.classList.remove("is-natural");
    var w = parent.clientWidth;
    var h = parent.clientHeight;
    if (!w || !h) return;
    var scale = Math.min(w / AUTHORED_WIDTH, h / AUTHORED_HEIGHT) || 1;
    frame.style.transform = "scale(" + scale + ")";
  }

  function initEmbed(frame) {
    var wrap = frame.closest(".product__embed");
    var loading = wrap ? wrap.querySelector(".product__embed-loading") : null;

    fit(frame);
    window.addEventListener("resize", function () { fit(frame); });
    if (window.ResizeObserver && frame.parentElement) {
      new ResizeObserver(function () { fit(frame); }).observe(frame.parentElement);
    }

    frame.addEventListener("load", function () {
      if (loading) loading.classList.add("is-hidden");
    });
    // If the iframe never loads (network/CSP failure), leave the loader
    // visible rather than trap the section: the rest of the page still
    // works, and the loader is a small, self-contained overlay.
    frame.addEventListener("error", function () {
      if (loading) loading.classList.add("is-hidden");
    });

    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && frame.dataset.src) {
            frame.src = frame.dataset.src;
            delete frame.dataset.src;
            io.unobserve(frame);
          }
        });
      }, { rootMargin: "600px 0px" });
      io.observe(frame);
    } else if (frame.dataset.src) {
      // No IntersectionObserver support: load immediately rather than never.
      frame.src = frame.dataset.src;
      delete frame.dataset.src;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".product__embed-iframe").forEach(initEmbed);
  });
})();
