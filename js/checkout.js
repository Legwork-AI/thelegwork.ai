/* Pricing page → Razorpay Checkout → workspace.
   Progressive: the page ships with WhatsApp buttons. On load this asks the app
   server whether online payment is switched on; only then does it add "Buy"
   buttons next to each plan and under the plan builder. Nothing here holds a
   secret: the server prices the selection and creates the order.
   External file only (CSP: script-src 'self' + checkout.razorpay.com). */
(function () {
  "use strict";
  var API = "https://app.thelegwork.ai";
  var cat = null;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function inr(n) { n = Math.round(n); var s = String(n), l = s.slice(-3), r = s.slice(0, -3); if (r) l = "," + l; return "₹" + r.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + l; }
  function billing() { var b = document.querySelector('[data-billing][aria-pressed="true"]'); return b && b.getAttribute("data-billing") === "y" ? "yearly" : "monthly"; }
  function loadRazorpay() {
    return new Promise(function (resolve, reject) {
      if (window.Razorpay) return resolve();
      var s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
    });
  }

  /* ---------- the small "who is this for" form, shown as a dialog ---------- */
  function ask(summaryText) {
    return new Promise(function (resolve) {
      var wrap = el("div", "ck-overlay");
      wrap.innerHTML =
        '<form class="ck-dialog" novalidate>' +
        '<span class="pr-plan__label">Set up your workspace</span>' +
        '<h3 class="ck-dialog__title">Who should we send the sign-in link to?</h3>' +
        '<p class="ck-dialog__sum">' + summaryText + '</p>' +
        '<label class="ck-field"><span>Your name</span><input name="name" type="text" autocomplete="name" required></label>' +
        '<label class="ck-field"><span>Work email</span><input name="email" type="email" autocomplete="email" required></label>' +
        '<label class="ck-field"><span>Firm name</span><input name="firm" type="text" autocomplete="organization" required></label>' +
        '<label class="ck-field"><span>WhatsApp number</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+91 98765 43210" required></label>' +
        '<p class="ck-dialog__err" hidden></p>' +
        '<div class="ck-dialog__actions"><button type="button" class="btn btn-outline-lg" data-cancel>Cancel</button><button type="submit" class="btn btn-primary-lg">Continue to payment &rarr;</button></div>' +
        '<p class="pr-plan__fine">The amount shown on the payment screen is the amount you pay. Your workspace is created the moment the payment succeeds.</p>' +
        "</form>";
      document.body.appendChild(wrap);
      var form = wrap.querySelector("form"), err = wrap.querySelector(".ck-dialog__err");
      form.querySelector("input").focus();
      function close(v) { wrap.remove(); resolve(v); }
      wrap.querySelector("[data-cancel]").addEventListener("click", function () { close(null); });
      wrap.addEventListener("click", function (e) { if (e.target === wrap) close(null); });
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var d = { name: form.name.value.trim(), email: form.email.value.trim(), firm: form.firm.value.trim(), phone: form.phone.value.trim() };
        if (!d.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email) || d.firm.length < 2) { err.textContent = "Name, a valid work email, the firm name and a WhatsApp number are needed."; err.hidden = false; return; }
        // The number becomes the super admin's contact in the app; it has to be a real one.
        if (d.phone.replace(/\D/g, "").length < 10) { err.textContent = "Enter a WhatsApp number with at least 10 digits, e.g. +91 98765 43210."; err.hidden = false; return; }
        close(d);
      });
    });
  }

  /* ---------- after the payment ---------- */
  var PENDING = "lw.pendingOrder";
  function remember(orderId, email) { try { localStorage.setItem(PENDING, JSON.stringify({ orderId: orderId, email: email, at: Date.now() })); } catch (e) {} }
  function pending() { try { var p = JSON.parse(localStorage.getItem(PENDING) || "null"); return p && p.orderId && p.email && Date.now() - p.at < 24 * 3600 * 1000 ? p : null; } catch (e) { return null; } }
  function forget() { try { localStorage.removeItem(PENDING); } catch (e) {} }
  function host(u) { return String(u || "").replace(/^https?:\/\//, ""); }

  /* Shown the moment Razorpay reports success, while the server verifies the
     payment and creates the workspace (a few seconds). */
  function verifyingPane() {
    var o = el("div", "ck-overlay");
    o.innerHTML = '<div class="ck-dialog"><span class="pr-plan__label">Payment received</span><h3 class="ck-dialog__title">Verifying your payment and creating your workspace…</h3><p class="ck-dialog__sum">This takes a few seconds. Please keep this page open.</p></div>';
    document.body.appendChild(o);
    return o;
  }

  /* The success pane: what happened, where the email went, where to sign in. */
  function successPane(done, email) {
    forget();
    var o = el("div", "ck-overlay");
    var primary = done.primaryUrl || done.appUrl || done.docketingUrl || API;
    var both = done.appUrl && done.docketingUrl;
    var where = both
      ? "Your plan opens both the IP suite at <b>" + host(done.appUrl) + "</b> and Legwork Docketing at <b>" + host(done.docketingUrl) + "</b>. One sign-in works for both."
      : "Your workspace is at <b>" + host(primary) + "</b>.";
    var mailNote = done.emailed === false
      ? "We are setting up your sign-in link by hand and will send it to <b>" + email + "</b> shortly."
      : "<b>Check your inbox.</b> A welcome email with your sign-in link has been sent to <b>" + email + "</b>. Open it, set a password, and you are in as the super admin. Your invoice is in a second email. If nothing arrives in a few minutes, check spam or message us on WhatsApp.";
    var actions = '<a class="btn btn-primary-lg" href="' + primary + '">Go to ' + host(primary) + ' &rarr;</a>' +
      (both ? '<a class="btn btn-outline-lg" href="' + done.docketingUrl + '">Open Docketing</a>' : "") +
      '<button type="button" class="btn btn-outline-lg" data-cancel>Close</button>';
    o.innerHTML = '<div class="ck-dialog"><span class="pr-plan__label">Payment successful</span><h3 class="ck-dialog__title">Thank you — your workspace is ready.</h3><p class="ck-dialog__sum">' + mailNote + '</p><p class="ck-dialog__sum">' + where + '</p><div class="ck-dialog__actions">' + actions + '</div></div>';
    o.querySelector("[data-cancel]").addEventListener("click", function () { o.remove(); });
    document.body.appendChild(o);
    return o;
  }

  function failurePane(message) {
    var o = el("div", "ck-overlay");
    o.innerHTML = '<div class="ck-dialog"><span class="pr-plan__label">Something went wrong</span><h3 class="ck-dialog__title">The payment did not go through.</h3><p class="ck-dialog__sum">' + (message || "Please try again.") + '</p><div class="ck-dialog__actions"><button type="button" class="btn btn-outline-lg" data-cancel>Close</button><a class="btn btn-primary-lg" href="https://wa.me/918130588175?text=Hi%20Deepansh%2C%20I%20tried%20to%20buy%20a%20plan%20on%20the%20site%20and%20hit%20a%20problem.">WhatsApp us</a></div></div>';
    o.querySelector("[data-cancel]").addEventListener("click", function () { o.remove(); });
    document.body.appendChild(o);
  }

  /* Ask the server whether an order is provisioned yet; the webhook may have
     done it while this page was closed, reloaded or redirected. */
  function orderStatus(orderId, email) {
    return fetch(API + "/api/billing/order?id=" + encodeURIComponent(orderId) + "&email=" + encodeURIComponent(email)).then(function (r) { return r.json(); });
  }
  function waitForOrder(orderId, email, tries, everyMs) {
    return new Promise(function (resolve) {
      var n = 0;
      (function tick() {
        orderStatus(orderId, email).then(function (j) {
          if (j && j.status === "provisioned") return resolve(j);
          if (j && j.status === "unknown") return resolve(null);
          if (++n >= tries) return resolve(null);
          setTimeout(tick, everyMs);
        }).catch(function () { if (++n >= tries) resolve(null); else setTimeout(tick, everyMs); });
      })();
    });
  }

  /* The email already owns a workspace: no payment, point them to the app. */
  function existingPane(j, email) {
    var o = el("div", "ck-overlay");
    var url = j.signInUrl || API;
    var firm = j.firmName ? " (<b>" + j.firmName + "</b>)" : "";
    var body = j.pending
      ? "<b>" + email + "</b> already has a Legwork workspace" + firm + " that has not been activated yet. Open the welcome email we sent, set your password, and then add more suites from <b>Usage &amp; Billing</b> inside the app. Nothing has been charged."
      : "<b>" + email + "</b> already has a Legwork workspace" + firm + ". To keep everything in one place, sign in and add this suite from <b>Usage &amp; Billing → Add a suite</b>. It is prorated to your current cycle. Nothing has been charged.";
    var actions = (j.pending ? "" : '<a class="btn btn-primary-lg" href="' + url + '">Sign in to ' + host(url) + ' &rarr;</a>') +
      '<a class="btn btn-outline-lg" href="https://wa.me/918130588175?text=Hi%20Deepansh%2C%20I%20already%20have%20a%20Legwork%20workspace%20and%20want%20to%20add%20a%20suite.">WhatsApp us</a>' +
      '<button type="button" class="btn btn-outline-lg" data-cancel>Close</button>';
    o.innerHTML = '<div class="ck-dialog"><span class="pr-plan__label">You already have a workspace</span><h3 class="ck-dialog__title">Add this suite from inside Legwork.</h3><p class="ck-dialog__sum">' + body + '</p><div class="ck-dialog__actions">' + actions + '</div></div>';
    o.querySelector("[data-cancel]").addEventListener("click", function () { o.remove(); });
    document.body.appendChild(o);
  }

  /* ---------- run a purchase ---------- */
  function buy(selection, summaryText) {
    ask(summaryText).then(function (who) {
      if (!who) return;
      var body = Object.assign({ selection: selection }, who);
      return fetch(API + "/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (j) {
          if (r.status === 409 && j.code === "workspace_exists") { existingPane(j, who.email); return null; }
          if (!r.ok) throw new Error(j.error || "Could not start the payment.");
          return j;
        }); })
        .then(function (order) {
          if (!order) return null;
          return loadRazorpay().then(function () {
            return new Promise(function (resolve, reject) {
              var busy = null;
              remember(order.orderId, who.email);
              var rz = new window.Razorpay({
                key: order.keyId, amount: order.amount, currency: order.currency, order_id: order.orderId,
                name: "Legwork", description: order.description, image: "https://thelegwork.ai/assets/apple-touch-icon.png",
                prefill: { name: who.name, email: who.email, contact: who.phone || undefined },
                notes: { firm: who.firm }, theme: { color: "#1B6391" },
                handler: function (resp) {
                  busy = verifyingPane();
                  fetch(API + "/api/billing/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resp) })
                    .then(function (r) { return r.json(); })
                    .then(function (j) {
                      if (j.ok) { busy.remove(); resolve(j); return; }
                      // The server may still have provisioned it via the webhook — check before giving up.
                      return waitForOrder(order.orderId, who.email, 6, 3000).then(function (st) { busy.remove(); if (st) resolve(st); else reject(new Error(j.error || "Verification failed.")); });
                    })
                    .catch(function () {
                      return waitForOrder(order.orderId, who.email, 6, 3000).then(function (st) { busy.remove(); if (st) resolve(st); else reject(new Error("The payment went through but we could not confirm it from here. Check your email in a minute, or message us on WhatsApp.")); });
                    });
                },
                modal: { ondismiss: function () {
                  // Closed by hand — or by a bank redirect. If the order got paid, still show the pane.
                  waitForOrder(order.orderId, who.email, 4, 2500).then(function (st) { resolve(st || null); });
                } }
              });
              rz.on("payment.failed", function (e) { reject(new Error(e.error && e.error.description ? e.error.description : "Payment failed.")); });
              rz.open();
            });
          });
        })
        .then(function (done) {
          if (!done) return;
          successPane(done, who.email);
        })
        .catch(function (e) { failurePane(e.message); });
    });
  }

  /* A payment finished while this page was reloaded or redirected: pick it up. */
  function resumePending() {
    var p = pending();
    if (!p) return;
    waitForOrder(p.orderId, p.email, 30, 3000).then(function (st) { if (st) successPane(st, p.email); else forget(); });
  }

  /* ---------- wire the page once billing is confirmed on ---------- */
  function enhance() {
    // Fixed plans: every plan card CTA gets a Buy button. The card carries data-plan="tm-standard" etc.
    document.querySelectorAll(".pr-plan[data-plan]").forEach(function (card) {
      var plan = card.getAttribute("data-plan"), cta = card.querySelector(".pr-plan__cta"), name = card.querySelector(".pr-plan__name").textContent;
      if (!cta || cta.querySelector("[data-buy]")) return;
      var b = el("button", "btn btn-primary-lg", "Buy " + name.replace(/ (Standard|Premium)$/, " $1") + " &rarr;");
      b.type = "button"; b.setAttribute("data-buy", plan);
      b.addEventListener("click", function () {
        var seats = 1, bl = billing();
        var amount = card.querySelector(".pr-plan__amount").textContent;
        buy({ plan: plan, seats: seats, billing: bl }, name + (plan.indexOf("dkt-") === 0 ? " · for the firm · " : " · 1 seat · ") + (bl === "yearly" ? "yearly" : "monthly") + " · " + amount);
      });
      var old = cta.querySelector("a.btn"); if (old) { old.classList.remove("btn-primary-lg"); old.classList.add("btn-outline-lg"); old.textContent = "Talk to us first"; }
      cta.insertBefore(b, cta.firstChild);
    });
    // Plan builder: a Buy button in the summary that sends the live selection.
    var sum = document.querySelector(".pr-summary");
    if (sum && !sum.querySelector("[data-buy-custom]")) {
      var b2 = el("button", "btn btn-primary-lg", "Buy this plan &rarr;"); b2.type = "button"; b2.setAttribute("data-buy-custom", "1");
      b2.addEventListener("click", function () {
        var sel = {
          custom: {
            stacks: Array.prototype.map.call(document.querySelectorAll("[data-full]:checked"), function (c) { return c.getAttribute("data-full"); }),
            premium: Array.prototype.map.call(document.querySelectorAll("[data-prem]:checked"), function (c) { return c.getAttribute("data-prem"); }),
            agents: Array.prototype.map.call(document.querySelectorAll("[data-agent]:checked"), function (c) { return c.getAttribute("data-agent").split(":")[1]; }).filter(function (a) { return a !== "tmr"; }),
            addons: Array.prototype.map.call(document.querySelectorAll("[data-agent]:checked"), function (c) { return c.getAttribute("data-agent").split(":")[1]; }).filter(function (a) { return a === "tmr"; }),
            docketing: !!(document.querySelector("#dkt-add") && document.querySelector("#dkt-add").checked)
          },
          seats: Number(document.querySelector("#seats").value) || 1,
          billing: billing()
        };
        var total = document.querySelector("#sum-total").textContent, period = document.querySelector("#sum-period").textContent;
        if (total === "₹0") { alert("Tick a full stack or at least one agent first."); return; }
        buy(sel, "Your own plan · " + sel.seats + " seat(s) · " + total + " " + period);
      });
      var wa = sum.querySelector("#sum-whatsapp"); sum.insertBefore(b2, wa);
    }
  }

  fetch(API + "/api/billing/catalog").then(function (r) { return r.json(); }).then(function (j) { cat = j; if (j && j.configured) { enhance(); resumePending(); } }).catch(function () { /* billing off: WhatsApp buttons stay */ });
})();
