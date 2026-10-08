/* Page loader: fade the branded overlay out once the page has loaded, then
   remove it. A CSS failsafe keyframe (see site.css) already forces the overlay
   away by ~2.5s even if this script never runs, so a JS failure can never trap
   the page. External file only: CSP is script-src 'self', no inline scripts. */
(function () {
  "use strict";

  /* Direct loads of a URL with a #hash: the browser performs its native
     anchor scroll mid-parse, before --nav-h is measured and before fonts,
     iframes and images settle the layout, so the target ends up buried
     under the fixed nav (or the scroll is lost entirely). Re-run the
     scroll once the page has loaded, offset to match the CSS
     scroll-padding-top of calc(var(--nav-h) + 12px). Instant, not smooth:
     this is a correction, not a navigation. */
  var userScrolled = false;
  ["wheel", "touchstart", "keydown"].forEach(function (ev) {
    window.addEventListener(ev, function () { userScrolled = true; }, { once: true, passive: true });
  });

  function scrollToHashTarget() {
    if (userScrolled) return;
    if (!location.hash || location.hash.length < 2) return;
    var target = null;
    try { target = document.querySelector(location.hash); } catch (err) { return; }
    if (!target) return;
    var nav = document.querySelector(".site-nav");
    var offset = (nav ? nav.offsetHeight : 0) + 12;
    var doc = document.documentElement;
    var prev = doc.style.scrollBehavior;
    doc.style.scrollBehavior = "auto";
    window.scrollTo(0, Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - offset));
    doc.style.scrollBehavior = prev;
  }

  function hideLoader() {
    /* Signals "the overlay is going away" to CSS: entrance animations that
       must be SEEN (hero G self-draw) are scoped under html.lw-ready so
       they start as the loader fades, not hidden behind it. Set before the
       null check so pages without a loader still get the class. */
    document.documentElement.classList.add("lw-ready");
    /* First pass inside rAF so the measured --nav-h from setNavHeight is
       already applied; second pass catches late layout shifts (iframe and
       font settling) but never fights the user once they have scrolled. */
    window.requestAnimationFrame(scrollToHashTarget);
    window.setTimeout(scrollToHashTarget, 500);
    var el = document.querySelector(".pageloader");
    if (!el) return;
    el.classList.add("is-hidden");
    window.setTimeout(function () {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 300);
  }

  if (document.readyState === "complete") {
    hideLoader();
  } else {
    window.addEventListener("load", hideLoader);
  }

  /* Wrap each hero-title word in a span so CSS can stagger them in as the
     loader clears (html.lw-ready). Skipped under reduced motion; without
     this the title simply renders whole. */
  function wrapTitleWords() {
    if (window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var t = document.querySelector(".hero__title");
    if (!t || t.dataset.wrapped) return;
    t.dataset.wrapped = "1";
    /* Walk the child nodes so a <br> (a deliberate line break) and any
       wrapper span survive; only text is split into animated words. */
    var wi = 0;
    function wrapNode(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var words = n.textContent.split(/\s+/).filter(Boolean);
          var frag = document.createDocumentFragment();
          words.forEach(function (w, i) {
            var s = document.createElement("span");
            s.className = "hw";
            s.style.setProperty("--wi", wi++);
            s.textContent = w;
            frag.appendChild(s);
            if (i < words.length - 1) frag.appendChild(document.createTextNode(" "));
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") {
          wrapNode(n);
        }
      });
    }
    wrapNode(t);
  }
  if (document.readyState !== "loading") {
    wrapTitleWords();
  } else {
    document.addEventListener("DOMContentLoaded", wrapTitleWords);
  }

  /* Publish the fixed nav's measured height as --nav-h. CSS derives both
     the anchor scroll offset and the full-height panel size from it, so a
     jumped-to panel plus the nav fill exactly one viewport at any width
     (the nav wraps taller on narrow screens). 57px CSS fallback. */
  function setNavHeight() {
    var nav = document.querySelector(".site-nav");
    if (!nav) return;
    /* Read layout inside rAF so the offsetHeight read lands after the
       browser's own layout pass instead of forcing a synchronous reflow. */
    window.requestAnimationFrame(function () {
      document.documentElement.style.setProperty("--nav-h", nav.offsetHeight + "px");
    });
  }

  if (document.readyState !== "loading") {
    setNavHeight();
  } else {
    document.addEventListener("DOMContentLoaded", setNavHeight);
  }
  window.addEventListener("resize", setNavHeight);

  /* Mobile nav toggle. The links panel is absolutely positioned, so opening
     it never changes the nav's own height (--nav-h stays valid). Any link
     tap closes the menu so same-page anchors don't leave it hanging open. */
  function wireBurger() {
    var nav = document.querySelector(".site-nav");
    var burger = document.querySelector(".site-nav__burger");
    if (!nav || !burger) return;
    function setOpen(open) {
      nav.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    }
    burger.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });
    nav.addEventListener("click", function (e) {
      if (e.target && e.target.closest && e.target.closest(".site-nav__links a")) {
        setOpen(false);
      }
    });
  }
  if (document.readyState !== "loading") {
    wireBurger();
  } else {
    document.addEventListener("DOMContentLoaded", wireBurger);
  }
})();
