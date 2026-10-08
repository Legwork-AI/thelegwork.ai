/* Capabilities page: index collapse, mobile drawer, scroll spy, section
   reveal. Loaded synchronously in <head> so the `caps-js` flag lands before
   first paint (the reveal animation is opt-in via that class, so a JS
   failure leaves every section plainly visible). External file only: CSP is
   script-src 'self', no inline scripts. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduced) root.classList.add("caps-js");

  function init() {
    var shell = document.querySelector(".caps-shell");
    if (!shell) return;

    var links = Array.prototype.slice.call(
      document.querySelectorAll("[data-caps-link]"));
    var sections = Array.prototype.slice.call(
      document.querySelectorAll("[data-caps-section]"));
    var current = document.querySelector("[data-caps-current]");

    /* ---- Desktop: collapse / restore the index ------------------------ */
    var hide = document.getElementById("capsHide");
    var show = document.getElementById("capsShow");

    function setCollapsed(collapsed) {
      shell.classList.toggle("is-collapsed", collapsed);
      if (hide) hide.setAttribute("aria-expanded", collapsed ? "false" : "true");
      if (show) show.setAttribute("aria-expanded", collapsed ? "false" : "true");
      /* Move focus to whichever control is now on screen so keyboard users
         are not left on a hidden button. */
      var next = collapsed ? show : hide;
      if (next && document.activeElement && document.activeElement !== document.body) {
        next.focus();
      }
    }
    if (hide) hide.addEventListener("click", function () { setCollapsed(true); });
    if (show) show.addEventListener("click", function () { setCollapsed(false); });

    /* ---- Mobile / tablet: index as a drawer --------------------------- */
    var open = document.getElementById("capsDrawerOpen");
    var close = document.getElementById("capsDrawerClose");
    var scrim = document.querySelector(".caps-scrim");

    function setDrawer(isOpen) {
      shell.classList.toggle("is-drawer", isOpen);
      /* The drawer covers the page, so freeze the page behind it rather than
         letting a swipe scroll content the user cannot see. */
      root.classList.toggle("caps-drawer-open", isOpen);
      if (open) open.setAttribute("aria-expanded", isOpen ? "true" : "false");
      if (isOpen && close) close.focus();
      else if (!isOpen && open) open.focus();
    }
    if (open) open.addEventListener("click", function () { setDrawer(true); });
    if (close) close.addEventListener("click", function () { setDrawer(false); });
    if (scrim) scrim.addEventListener("click", function () { setDrawer(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && shell.classList.contains("is-drawer")) setDrawer(false);
    });

    /* A tap in the drawer should read as navigation, so close it and let the
       browser's own smooth anchor scroll (html { scroll-behavior: smooth })
       carry on. */
    links.forEach(function (link) {
      link.addEventListener("click", function () {
        setActive(link.getAttribute("data-caps-link"));
        if (shell.classList.contains("is-drawer")) setDrawer(false);
      });
    });

    /* ---- Active capability ------------------------------------------- */
    var activeId = null;

    function setActive(id) {
      if (!id || id === activeId) return;
      activeId = id;
      links.forEach(function (link) {
        var on = link.getAttribute("data-caps-link") === id;
        link.classList.toggle("is-active", on);
        if (on) {
          link.setAttribute("aria-current", "true");
          if (current) {
            var name = link.querySelector(".caps-item__name");
            current.textContent = name ? name.textContent : "";
          }
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    if (!("IntersectionObserver" in window)) {
      sections.forEach(function (s) { s.classList.add("is-in"); });
      var closeBlock = document.querySelector(".caps-close");
      if (closeBlock) closeBlock.classList.add("is-in");
      if (sections[0]) setActive(sections[0].id);
      initEmbeds();
      return;
    }

    /* Scroll spy. A band across the upper third of the viewport decides which
       capability is "current": whichever tracked section overlaps it and sits
       highest wins, so short sections still get their turn. */
    var visible = [];
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var i = visible.indexOf(entry.target);
        if (entry.isIntersecting && i === -1) visible.push(entry.target);
        else if (!entry.isIntersecting && i !== -1) visible.splice(i, 1);
      });
      if (!visible.length) return;
      var top = visible.reduce(function (best, el) {
        return el.getBoundingClientRect().top < best.getBoundingClientRect().top ? el : best;
      });
      setActive(top.id);
    }, { rootMargin: "-18% 0px -62% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });

    /* Reveal on first approach, then stop watching. */
    var reveal = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        obs.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.04 });
    Array.prototype.slice.call(
      document.querySelectorAll(".caps-section, .caps-close")
    ).forEach(function (el) { reveal.observe(el); });

    /* Deep links (/capabilities/#c07) and plain loads both need a sensible
       starting highlight before the user has scrolled anywhere. */
    var hashed = null;
    if (location.hash && location.hash.length > 1) {
      try {
        hashed = document.querySelector("[data-caps-section]" + location.hash);
      } catch (err) { hashed = null; }
    }
    setActive(hashed ? hashed.id : (sections[0] ? sections[0].id : null));

    initEmbeds();
  }

  /* Click-to-play YouTube facades. Nothing is requested from youtube.com
     until the visitor presses play, so a page view costs no third-party
     bytes and sets no third-party cookies. A figure with an empty
     data-yt-id is hidden by CSS and skipped here, so an unfilled slot
     never ships a dead player. */
  function initEmbeds() {
    Array.prototype.slice.call(
      document.querySelectorAll("[data-yt-id]")
    ).forEach(function (fig) {
      var id = (fig.getAttribute("data-yt-id") || "").trim();
      var btn = fig.querySelector("[data-yt-play]");
      var well = fig.querySelector(".caps-embed");
      if (!id || !btn || !well) return;

      btn.addEventListener("click", function () {
        var frame = document.createElement("iframe");
        frame.className = "caps-embed__frame";
        frame.title = fig.getAttribute("data-yt-title") || "Demo video";
        frame.src =
          "https://www.youtube-nocookie.com/embed/" +
          encodeURIComponent(id) +
          "?autoplay=1&rel=0&modestbranding=1&playsinline=1";
        frame.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture; fullscreen");
        frame.setAttribute("allowfullscreen", "");
        frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        well.appendChild(frame);
        well.classList.add("is-playing");
        frame.focus();
      });
    });
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
