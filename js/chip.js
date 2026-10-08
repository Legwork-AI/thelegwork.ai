/* Status chip message cycling (hero) + early-access form success state.
   Both behaviors are tiny bits of state, so they live in one small file
   per the build spec. No build step, no framework.

   Messages are lifted verbatim from the `this.chips` array in the v2 Home
   design's script scaffold (Legwork Home.dc.html) and rendered as-is; the
   design's own render logic has no "Legwork is" prefix (the README's prose
   description of the chip is a paraphrase, not the literal copy). */
(function () {
  "use strict";

  var CHIP_MESSAGES = [
    "Drafting an office-action response…",
    "Reconciling 214 deadlines across three dockets…",
    "Chasing a fee that went quiet in March…",
    "Reading last night's examiner report…",
    "Preparing Monday's client status letters…"
  ];
  var CHIP_INTERVAL_MS = 3800;

  function prefersReducedMotion() {
    return window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function initChip() {
    var chipText = document.querySelector("[data-chip-text]");
    if (!chipText) return;

    if (prefersReducedMotion()) {
      // Leave the first message in place; the CSS keyframe pause handles
      // the spinning icon. No interval means no cycling.
      return;
    }

    /* Typewriter staging: each task is typed out character by character
       with a blinking caret (CSS .chip__text--typing::after), held, then
       replaced by the next. The server-rendered first message is held
       as-is before the cycle starts. */
    var TYPE_MS = 34;
    var idx = 0;

    function typeMessage(msg, done) {
      var i = 0;
      chipText.classList.add("chip__text--typing");
      chipText.textContent = "";
      var t = setInterval(function () {
        i += 1;
        chipText.textContent = msg.slice(0, i);
        if (i >= msg.length) {
          clearInterval(t);
          chipText.classList.remove("chip__text--typing");
          done();
        }
      }, TYPE_MS);
    }

    function cycle() {
      idx = (idx + 1) % CHIP_MESSAGES.length;
      typeMessage(CHIP_MESSAGES[idx], function () {
        window.setTimeout(cycle, CHIP_INTERVAL_MS);
      });
    }
    window.setTimeout(cycle, CHIP_INTERVAL_MS);
  }

  function initEarlyAccessForm() {
    var form = document.getElementById("early-access-form");
    var success = document.getElementById("early-access-success");
    if (!form || !success) return;

    function showSuccess() {
      form.hidden = true;
      success.hidden = false;
    }

    // No-JS fallback: the server behind form.action sends the visitor back
    // with ?subscribed=1.
    if (/(?:^|[?&])subscribed=1(?:&|$)/.test(window.location.search)) {
      showSuccess();
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var encoded = [];
      data.forEach(function (value, key) {
        encoded.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
      });
      fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
        body: encoded.join("&")
      })
        .then(showSuccess)
        .catch(showSuccess);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initChip();
    initEarlyAccessForm();
  });
})();
