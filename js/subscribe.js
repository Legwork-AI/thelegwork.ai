/* Blog subscribe form success state. Same no-framework pattern as the home
   page's early-access handler in chip.js: intercept submit, POST the encoded
   form to Netlify Forms, and swap in a success message. A server redirect back
   with ?subscribed=1 is the no-JS fallback. External file only (CSP-clean). */
(function () {
  "use strict";

  var form = document.getElementById("blog-subscribe-form");
  var success = document.getElementById("blog-subscribe-success");
  if (!form || !success) return;

  function showSuccess() {
    form.hidden = true;
    success.hidden = false;
  }

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
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encoded.join("&")
    })
      .then(showSuccess)
      .catch(showSuccess);
  });
})();
