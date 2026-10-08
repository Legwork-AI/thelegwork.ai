/* Plans and pricing: billing toggle + "Make your own plan" builder.
   External file only (CSP: script-src 'self'). No dependencies.

   ===================== PRICING CONFIG — edit here only =====================
   All figures INR, per seat. Mirror of server/billing.mjs on the app server,
   which is the authority: the browser only ever sends WHICH plan or agents
   were chosen, never a price.
   - Each suite is sold in three tiers separated by the monthly token
     allowance: Starter 5,000, Professional 10,000, Enterprise 20,000 credits per seat.
     Storage is 10 GB per seat on every tier.
   - Builder agent rates are per seat per month. A stack's agents can never
     cost more than the stack's Starter price: reaching it upgrades the
     selection to the full stack automatically.
   - Yearly = monthly × 12 × (1 − YEARLY_DISCOUNT), carrying the year's
     tokens up front.
   ========================================================================== */
(function () {
  "use strict";

  var YEARLY_DISCOUNT = 0.10;
  var DKT = { m: 999, y: 10000 };          // Legwork Docketing (Standard) when no full stack is chosen
  var WHATSAPP = "918130588175";

  // Anything built by hand — single agents or a self-assembled full stack —
  // carries the Starter allowance. The larger allowances are the tiers above.
  var TOKENS = { m: "5,000 credits per seat per month with a full stack (the Starter allowance); 1,000 per agent otherwise", y: "60,000 credits per seat per year with a full stack (the Starter allowance); 12,000 per agent otherwise" };

  var STACKS = [
    { id: "tm", name: "Legwork Trademark Suite", short: "Trademark", prices: { starter: 4999, professional: 9999, enterprise: 19999 },
      blurb: "Thirty-seven agents from filing to enforcement.",
      agents: [
        ["conflict", "Conflict & Success Analysis", "Conflict report, 24-parameter chances of success, and the client advisory.", 2999],
        ["pros", "Prosecution Drafter", "Examination report response and written submissions for the hearing.", 2999],
        ["oppo", "Opposition Drafter", "Notice of opposition, counter statement, Rule 45, 46 and 47 evidence affidavits.", 2999],
        ["enforce", "Enforcement Suite", "Cease and desist, reply to a notice received, investigation instructions.", 1999],
        ["cancel", "Cancellation & Rectification", "Section 47 non-use and Section 57 rectification petitions on Form TM-O.", 1999],
        ["review", "Review Petition & Appeal", "Review petition against a Registrar's order, and the Section 91 appeal.", 1999],
        ["audit", "Audit Report", "Particulars verified, history reconstructed, issues numbered, actions proposed.", 1999],
        ["watch", "Watch Notice", "Journal advertisement to client watch notice with the four-month deadline.", 1499],
        ["filing", "New Filing Advisory", "Seeking-confirmation, filing-confirmation and filing-reporting emails.", 1499],
        ["report", "Registry Development Report", "Any Registry document becomes the client update, deadlines computed.", 1499],
        ["email", "Email Reply Drafter", "Eight reply agents for client and foreign-agent chains, in house style.", 1499],
        ["history", "Prosecution History", "Tabulated file-wrapper chronology from a bundle of Registry PDFs.", 1499],
        ["search", "Search Consolidators", "Registry Excel exports and PDF reports into one workbook, with similarity shortlists.", 1499],
        ["dilution", "Dilution Matrix", "Class-wise count of third-party marks sharing a common element.", 1499]
      ],
      addon: ["tmr", "TMR Follow Up Letters (paralegal seat)", "Seven Registry follow-up letters on firm letterhead. No model in the loop.", 999]
    },
    { id: "pat", name: "Legwork Patents Suite", short: "Patents", prices: { starter: 4999, professional: 9999, enterprise: 19999 },
      blurb: "Seventeen agents and twenty-five personas, specification to grant.",
      agents: [
        ["pdraft", "Patent Drafting", "Provisional and complete specifications, conversion, PCT national phase, claims, abstract, block diagram and flowchart.", 4999],
        ["pfer", "Patent Examination Responses", "Prior-art analyser, FER and SER responses, post-hearing submissions, claim, abstract, description and drawing amendments.", 4999],
        ["pform3", "Patent Form 3", "The Section 8 statement and undertaking from PATENTSCOPE reports and the client chain.", 1999]
      ]
    },
    { id: "lit", name: "Legwork IP Litigation Suite", short: "Litigation", prices: { starter: 3999, professional: 8999, enterprise: 15999 },
      blurb: "Twenty court documents, from either side of the cause title.",
      agents: [
        ["plaint", "Plaint & Suit Filing", "The plaint, eight peripheral filing documents and four interlocutory applications.", 2999],
        ["ws", "Written Statement", "Written statement, statement of truth, affidavit of admission and denial.", 2499],
        ["repl", "Replication (Rejoinder)", "Replication, affidavit in support, statement of truth, affidavit of advance service.", 2499]
      ]
    }
  ];

  /* ============================ helpers ============================ */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function inr(n) {
    n = Math.round(n);
    var s = String(n), last3 = s.slice(-3), rest = s.slice(0, -3);
    if (rest) last3 = "," + last3;
    return "₹" + rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + last3;
  }
  var billing = "m";   // "m" | "y"
  function yearly(monthly) { return Math.round(monthly * 12 * (1 - YEARLY_DISCOUNT)); }
  function rate(item) { return billing === "m" ? item.m : item.y; }
  function starterRate(s) { return billing === "m" ? s.prices.starter : yearly(s.prices.starter); }

  /* ===================== billing toggle (whole page) ===================== */
  function setBilling(b) {
    billing = b;
    $$("[data-billing]").forEach(function (btn) { btn.setAttribute("aria-pressed", btn.getAttribute("data-billing") === b ? "true" : "false"); });
    $$("[data-price-m]").forEach(function (el) {
      el.textContent = el.getAttribute(b === "m" ? "data-price-m" : "data-price-y");
    });
    $$("[data-per]").forEach(function (el) { el.textContent = b === "m" ? "per seat / month" : "per seat / year"; });
    $$("[data-per-firm]").forEach(function (el) { el.textContent = b === "m" ? "per month · for the firm" : "per year · for the firm"; });
    $$("[data-quota-m]").forEach(function (el) { el.innerHTML = el.getAttribute(b === "m" ? "data-quota-m" : "data-quota-y"); });
    $$("[data-alt-m]").forEach(function (el) { el.textContent = el.getAttribute(b === "m" ? "data-alt-m" : "data-alt-y"); });
    try { localStorage.setItem("lw-billing", b); } catch (e) {}
    render();
  }
  $$("[data-billing]").forEach(function (btn) {
    btn.addEventListener("click", function () { setBilling(btn.getAttribute("data-billing")); });
  });

  /* ===================== builder: render the catalogue ===================== */
  var host = $("#build-stacks");
  var state = { seats: 1, full: {}, agents: {}, dkt: false };

  function agentRow(stackId, a, addon) {
    var id = "ag-" + stackId + "-" + a[0];
    return '<li class="pr-agent' + (addon ? " pr-agent--addon" : "") + '">' +
      '<input class="pr-check" type="checkbox" id="' + id + '" data-agent="' + stackId + ':' + a[0] + '">' +
      '<span><span class="pr-agent__name"><label for="' + id + '">' + a[1] + '</label></span><span class="pr-agent__desc">' + a[2] + '</span></span>' +
      '<span class="pr-agent__price"><span data-agent-price="' + a[3] + '">' + inr(a[3]) + '</span></span></li>';
  }
  if (host) {
    host.innerHTML = STACKS.map(function (s) {
      return '<div class="pr-stack" id="stack-' + s.id + '" data-stack="' + s.id + '">' +
        '<div class="pr-stack__head">' +
          '<input class="pr-check" type="checkbox" id="full-' + s.id + '" data-full="' + s.id + '">' +
          '<div><h3 class="pr-stack__title"><label for="full-' + s.id + '">Full ' + s.short + ' Stack</label></h3><p class="pr-stack__sub">' + s.blurb + ' Every agent below, on the Starter allowance. Choose a Professional or Enterprise plan above for the larger token allowances.</p></div>' +
          '<div class="pr-stack__price"><span data-stack-price="' + s.id + '">' + inr(s.prices.starter) + '</span><small data-per>per seat / month</small></div>' +
        '</div>' +
        '<ul class="pr-agents">' + s.agents.map(function (a) { return agentRow(s.id, a, false); }).join("") +
          (s.addon ? agentRow(s.id, s.addon, true) : "") +
        '</ul>' +
      '</div>';
    }).join("");
  }

  /* ===================== builder: events ===================== */
  document.addEventListener("change", function (e) {
    var t = e.target;
    if (!t || !t.matches) return;
    if (t.matches("[data-full]")) { state.full[t.getAttribute("data-full")] = t.checked; }
    else if (t.matches("[data-agent]")) { state.agents[t.getAttribute("data-agent")] = t.checked; }
    else if (t.matches("#dkt-add")) { state.dkt = t.checked; }
    else return;
    render();
  });
  var seatsInput = $("#seats");
  function setSeats(n) { n = Math.max(1, Math.min(500, Math.round(Number(n) || 1))); state.seats = n; if (seatsInput) seatsInput.value = n; render(); }
  if (seatsInput) {
    seatsInput.addEventListener("input", function () { setSeats(seatsInput.value); });
    $("#seats-minus").addEventListener("click", function () { setSeats(state.seats - 1); });
    $("#seats-plus").addEventListener("click", function () { setSeats(state.seats + 1); });
  }

  /* ===================== builder: compute + render ===================== */
  function compute() {
    var lines = [], perSeat = 0, anyFull = false, names = [];
    STACKS.forEach(function (s) {
      // Starter is the ceiling on à la carte: once the agents picked cost more
      // than the whole suite does, the whole suite is what gets sold.
      var stackRate = starterRate(s);
      var picked = s.agents.filter(function (a) { return state.agents[s.id + ":" + a[0]]; });
      var agentSum = picked.reduce(function (n, a) { return n + (billing === "m" ? a[3] : yearly(a[3])); }, 0);
      var full = !!state.full[s.id];
      var autoFull = !full && picked.length > 0 && agentSum >= stackRate;
      var el = $("#stack-" + s.id);
      if (autoFull) { full = true; state.full[s.id] = true; var cb = $("#full-" + s.id); if (cb) cb.checked = true; }
      if (el) el.classList.toggle("is-full", full);
      $$("[data-agent^='" + s.id + ":']", el).forEach(function (cb) {
        var isAddon = s.addon && cb.getAttribute("data-agent") === s.id + ":" + s.addon[0];
        cb.disabled = full && !isAddon;
      });
      if (full) {
        anyFull = true;
        lines.push({ label: "Full " + s.short + " Stack · Starter", amt: stackRate });
        names.push(s.name + " (Starter)");
        perSeat += stackRate;
      } else {
        picked.forEach(function (a) {
          var amt = billing === "m" ? a[3] : yearly(a[3]);
          lines.push({ label: a[1], amt: amt }); names.push(a[1]); perSeat += amt;
        });
      }
      if (s.addon && state.agents[s.id + ":" + s.addon[0]]) {
        var amt2 = billing === "m" ? s.addon[3] : yearly(s.addon[3]);
        lines.push({ label: s.addon[1], amt: amt2 }); names.push(s.addon[1]); perSeat += amt2;
      }
    });
    var dktEl = $("#dkt-card");
    if (dktEl) dktEl.classList.toggle("is-free", anyFull);
    if (anyFull) { lines.push({ label: "Legwork Docketing", amt: 0, free: true }); names.push("Legwork Docketing (complimentary)"); }
    // Docketing is one charge for the firm, whatever the seat count.
    var flat = 0;
    if (!anyFull && state.dkt) { var d = rate(DKT); lines.push({ label: "Legwork Docketing · Standard (firm-wide)", amt: d }); names.push("Legwork Docketing (Standard)"); flat += d; }
    return { lines: lines, perSeat: perSeat, flat: flat, total: perSeat * state.seats + flat, names: names, anyFull: anyFull };
  }

  function render() {
    if (!host) return;
    STACKS.forEach(function (s) { var p = $("[data-stack-price='" + s.id + "']"); if (p) p.textContent = inr(starterRate(s)); });
    $$("[data-agent-price]").forEach(function (el) { var m = Number(el.getAttribute("data-agent-price")); el.textContent = inr(billing === "m" ? m : yearly(m)); });
    var dp = $("#dkt-price"); if (dp) dp.textContent = inr(rate(DKT));

    var r = compute();
    var ul = $("#sum-lines");
    ul.innerHTML = r.lines.length
      ? r.lines.map(function (l) { return "<li" + (l.free ? ' class="is-free"' : "") + "><span>" + l.label + "</span><span>" + (l.free ? "Complimentary" : inr(l.amt)) + "</span></li>"; }).join("")
      : '<li class="is-empty"><span>Nothing chosen yet. Tick a full stack or any agents.</span></li>';
    $("#sum-perseat").textContent = inr(r.perSeat);
    $("#sum-seats").textContent = String(state.seats) + (state.seats === 1 ? " seat" : " seats");
    $("#sum-total").textContent = inr(r.total);
    $("#sum-period").textContent = billing === "m" ? "per month" : "per year";
    $("#sum-quota").textContent = r.perSeat > 0 ? (billing === "m" ? TOKENS.m : TOKENS.y) + ". More credits can be bought inside the app at any time." : "AI credits are included with every plan.";

    var msg = "Hi Deepansh, here is the Legwork plan I built on the site:\n" +
      "- " + (r.names.length ? r.names.join("\n- ") : "nothing yet") + "\n" +
      "Seats: " + state.seats + " · Billing: " + (billing === "m" ? "monthly" : "yearly") + "\n" +
      "Estimate: " + inr(r.total) + " " + (billing === "m" ? "per month" : "per year");
    var wa = $("#sum-whatsapp"); if (wa) wa.href = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(msg);
    var mail = $("#sum-email"); if (mail) mail.href = "mailto:deepansh@thelegwork.ai?subject=" + encodeURIComponent("My Legwork plan") + "&body=" + encodeURIComponent(msg);
  }

  /* ===================== sticky tabs: highlight in view ===================== */
  var tabs = $$(".pr-tab");
  var targets = tabs.map(function (t) { return $(t.getAttribute("href")); }).filter(Boolean);
  if ("IntersectionObserver" in window && targets.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) tabs.forEach(function (t) { t.classList.toggle("is-active", t.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ===================== boot ===================== */
  var saved = "m";
  try { saved = localStorage.getItem("lw-billing") === "y" ? "y" : "m"; } catch (e) {}
  setBilling(saved);
})();
