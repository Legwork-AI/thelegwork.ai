/* Product animation (Home #product embed): a plain React 18 app (no JSX, no
   Babel) so the whole thing self-hosts under CSP script-src 'self' with
   just the two local vendor UMD files (react.production.min.js,
   react-dom.production.min.js) plus this external script.

   This replays a simulated exchange, porting the same script and timing
   from the v2 design's own "Component extends DCLogic" class
   (docs/design-handoff-v2/assets/product-animation.html) onto real React
   state/effects instead of that prototype's bespoke component runtime. */
(function () {
  "use strict";

  var h = React.createElement;
  var useState = React.useState;
  var useEffect = React.useEffect;
  var useRef = React.useRef;

  var G_ICON = "/assets/g-arrow.svg";
  var G_ICON_WHITE = "/assets/g-arrow-white.png";

  var STAGES = [
    { label: "Filing", on: "done" },
    { label: "Examination", on: "done" },
    { label: "Reply to FER", on: "active" },
    { label: "Hearing", on: "todo" },
    { label: "Registration", on: "todo" }
  ];

  var FILES = ["Examination_Report.pdf", "User_affidavit.docx", "Cited_mark_1839204.pdf"];

  var SCRIPT = [
    {
      type: "user",
      text: "Draft our reply to the examination report, objections under Sections 9 and 11 of the Trade Marks Act, 1999."
    },
    {
      type: "assistant",
      kicker: "Examination reply",
      text: "The report raises two grounds. Under Section 9(1)(b) the Examiner treats GREENLEAF as descriptive of the goods; under Section 11(1) it cites earlier mark 1839204 as deceptively similar. Both are answerable on this record.\n\nI've framed the reply in three parts:",
      bullets: [
        "Section 9(1)(b): the mark is suggestive, not descriptive, and the proviso applies, with continuous use since 2014 evidencing acquired distinctiveness.",
        "Section 11(1): no phonetic, visual or structural similarity to the cited mark, and the goods differ in trade channel.",
        "On the Cadila factors, confusion is unlikely for an average consumer of imperfect recollection."
      ],
      citations: [
        { label: "Examination report", ref: "FER · Class 30 · 2026-04-22" },
        { label: "Precedent", ref: "Cadila Health Care (2001) 5 SCC 73" }
      ]
    },
    {
      type: "user",
      text: "Good. Attach the user affidavit evidence and prepare it for filing."
    },
    {
      type: "assistant",
      text: "Done. I've compiled the Section 9 proviso evidence, invoices, ad spend and the user affidavit, cited each exhibit to source, and formatted the reply to the Registry's requirements. The docket now shows the reply as drafted, due in 21 days.",
      action: "Reply ready for your review"
    }
  ];

  function Icon(props) {
    return h("img", { src: props.white ? G_ICON_WHITE : G_ICON, alt: "", className: props.className });
  }

  function StageDot(stage) {
    var active = stage.on === "active";
    var done = stage.on === "done";
    var dot = active || done ? "#1B6391" : "#ffffff";
    var ring = stage.on === "todo" ? "#ABCDE3" : "#1B6391";
    return h("span", {
      className: "pa-stage__dot",
      style: { background: dot, borderColor: ring }
    });
  }

  function Rail() {
    return h("div", { className: "pa-rail" },
      h("div", null,
        h("div", { className: "pa-rail__label" }, "Matter stage"),
        h("div", { className: "pa-stage-list" },
          STAGES.map(function (s, i) {
            return h("div", { className: "pa-stage", key: i },
              StageDot(s),
              h("span", {
                className: "pa-stage__label",
                style: { color: s.on === "active" ? "#1A1A1A" : "#6B7280", fontWeight: s.on === "active" ? 600 : 400 }
              }, s.label)
            );
          })
        )
      ),
      h("div", null,
        h("div", { className: "pa-rail__label" }, "In the record"),
        h("div", { className: "pa-files" },
          FILES.map(function (f, i) {
            return h("div", { className: "pa-file", key: i },
              h("span", { className: "pa-file__dot" }),
              h("span", { className: "pa-file__name" }, f)
            );
          })
        )
      ),
      h("div", { className: "pa-rail__footer" }, "Every answer cited to", h("br"), "the matter record.")
    );
  }

  function UserBubble(msg) {
    return h("div", { className: "pa-msg-user" },
      h("div", { className: "pa-msg-user__bubble" }, msg.text)
    );
  }

  function AssistantBubble(msg) {
    var bullets = (msg.bullets || []).slice(0, msg.shownBullets || 0);
    var cites = (msg.citations || []).slice(0, msg.shownCites || 0);
    return h("div", { className: "pa-msg-assistant" },
      h("div", { className: "pa-msg-assistant__avatar" }, h(Icon, {})),
      h("div", { className: "pa-msg-assistant__body" },
        msg.kicker ? h("div", { className: "pa-msg-assistant__kicker" }, msg.kicker) : null,
        h("div", { className: "pa-msg-assistant__text" },
          msg.text,
          msg.streaming ? h("span", { className: "pa-cursor" }) : null
        ),
        bullets.length ? h("div", { className: "pa-bullets" },
          bullets.map(function (b, i) {
            return h("div", { className: "pa-bullet", key: i },
              h("span", { className: "pa-bullet__dot" }, h("span", null)),
              h("span", { className: "pa-bullet__text" }, b)
            );
          })
        ) : null,
        cites.length ? h("div", { className: "pa-cites pa-cites--has-margin" },
          cites.map(function (c, i) {
            return h("div", { className: "pa-cite", key: i },
              h("div", { className: "pa-cite__label-row" },
                h("span", { className: "pa-cite__dot" }),
                h("span", { className: "pa-cite__label" }, c.label)
              ),
              h("span", { className: "pa-cite__ref" }, c.ref)
            );
          })
        ) : null,
        (msg.actionShown && msg.action) ? h("div", { className: "pa-action" },
          h("span", { className: "pa-action__check" }, "✓"),
          h("span", { className: "pa-action__text" }, msg.action)
        ) : null
      )
    );
  }

  function Typing() {
    return h("div", { className: "pa-typing" },
      h("div", { className: "pa-typing__avatar" }, h(Icon, {})),
      h("div", { className: "pa-typing__bubble" },
        h("div", { className: "pa-typing__dot" }),
        h("div", { className: "pa-typing__dot pa-typing__dot--2" }),
        h("div", { className: "pa-typing__dot pa-typing__dot--3" }),
        h("span", { className: "pa-typing__label" }, "reading the matter record")
      )
    );
  }

  function App() {
    var state = useState({ msgs: [], typing: false });
    var data = state[0];
    var setData = state[1];
    var threadRef = useRef(null);
    var aliveRef = useRef(true);
    var timersRef = useRef([]);

    function wait(ms) {
      return new Promise(function (resolve) {
        var t = setTimeout(resolve, ms);
        timersRef.current.push(t);
      });
    }

    function updateLast(patch) {
      setData(function (s) {
        if (!s.msgs.length) return s;
        var msgs = s.msgs.slice();
        var last = Object.assign({}, msgs[msgs.length - 1], patch);
        msgs[msgs.length - 1] = last;
        return Object.assign({}, s, { msgs: msgs });
      });
    }

    function pushMsg(msg) {
      setData(function (s) {
        return Object.assign({}, s, { msgs: s.msgs.concat([msg]) });
      });
    }

    async function streamText(full) {
      var chunks = full.split(/(\s+)/);
      var cur = "";
      for (var i = 0; i < chunks.length; i++) {
        if (!aliveRef.current) return;
        cur += chunks[i];
        updateLast({ text: cur });
        await wait(chunks[i].trim() ? 34 : 12);
      }
    }

    async function run() {
      while (aliveRef.current) {
        setData({ msgs: [], typing: false });
        await wait(700);
        for (var i = 0; i < SCRIPT.length; i++) {
          if (!aliveRef.current) return;
          var step = SCRIPT[i];
          if (step.type === "user") {
            pushMsg({ role: "user", text: step.text });
            await wait(1150);
          } else {
            setData(function (s) { return Object.assign({}, s, { typing: true }); });
            await wait(1350);
            if (!aliveRef.current) return;
            setData(function (s) {
              return Object.assign({}, s, {
                typing: false,
                msgs: s.msgs.concat([{
                  role: "assistant",
                  kicker: step.kicker || "",
                  text: "",
                  bullets: step.bullets || [],
                  citations: step.citations || [],
                  action: step.action || "",
                  shownBullets: 0,
                  shownCites: 0,
                  actionShown: false,
                  streaming: true
                }])
              });
            });
            await wait(120);
            await streamText(step.text);
            updateLast({ streaming: false });
            var bLen = (step.bullets || []).length;
            for (var b = 0; b < bLen; b++) {
              await wait(420);
              updateLast({ shownBullets: b + 1 });
            }
            var cLen = (step.citations || []).length;
            for (var c = 0; c < cLen; c++) {
              await wait(380);
              updateLast({ shownCites: c + 1 });
            }
            if (step.action) {
              await wait(520);
              updateLast({ actionShown: true });
            }
            await wait(1500);
          }
        }
        await wait(2800);
      }
    }

    useEffect(function () {
      var reduceMotion = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) {
        // Show the fully-resolved final state once, statically, rather than
        // looping/streaming, matching the rest of the site's
        // prefers-reduced-motion handling.
        var finalMsgs = [];
        SCRIPT.forEach(function (step) {
          if (step.type === "user") {
            finalMsgs.push({ role: "user", text: step.text });
          } else {
            finalMsgs.push({
              role: "assistant",
              kicker: step.kicker || "",
              text: step.text,
              bullets: step.bullets || [],
              citations: step.citations || [],
              action: step.action || "",
              shownBullets: (step.bullets || []).length,
              shownCites: (step.citations || []).length,
              actionShown: !!step.action,
              streaming: false
            });
          }
        });
        setData({ msgs: finalMsgs, typing: false });
        return;
      }
      aliveRef.current = true;
      run();
      return function () {
        aliveRef.current = false;
        timersRef.current.forEach(clearTimeout);
      };
    }, []);

    useEffect(function () {
      if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
    });

    var statusText = data.typing ? "Reasoning" : "Matter synced";

    return h("div", { className: "pa-root" },
      h("div", { className: "pa-frame" },
        h("div", { className: "pa-chrome" },
          h("div", { className: "pa-chrome__left" },
            h("div", { className: "pa-chrome__icon" }, h(Icon, { white: true })),
            h("div", { className: "pa-chrome__titles" },
              h("div", { className: "pa-chrome__title" }, "GREENLEAF: TM Application 4821566"),
              h("div", { className: "pa-chrome__subtitle" }, "Trade Marks Act 1999 · Class 30 · S.9 & S.11")
            )
          ),
          h("div", { className: "pa-status" },
            h(Icon, { className: "pa-status__icon" }),
            h("span", { className: "pa-status__text" }, statusText)
          )
        ),
        h("div", { className: "pa-body" },
          h(Rail, {}),
          h("div", { className: "pa-chat" },
            h("div", { className: "pa-thread", ref: threadRef },
              data.msgs.map(function (m, i) {
                return h("div", { key: i }, m.role === "user" ? UserBubble(m) : AssistantBubble(m));
              }),
              data.typing ? h(Typing, {}) : null
            ),
            h("div", { className: "pa-composer" },
              h("div", { className: "pa-composer__box" },
                h("span", { className: "pa-composer__cursor" }),
                h("span", { className: "pa-composer__placeholder" }, "Ask about this matter, or draft from the record…"),
                h("div", { className: "pa-composer__send" }, "↑")
              ),
              h("div", { className: "pa-composer__hint" }, "Every response is grounded in the live matter file")
            )
          )
        )
      )
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    var mount = document.getElementById("pa-mount");
    if (!mount) return;
    var root = ReactDOM.createRoot(mount);
    root.render(h(App));
  });
})();
