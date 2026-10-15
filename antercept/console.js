/* ===========================================================================
   Antercept · operator console (miniature)
   A local, fictional demonstration of how Antercept manages a campaign:
   a sidebar, a campaign selector, a live target table, a "run" simulation that
   advances pending → opened → clicked, and a target drawer with evidence + risk.
   Nothing here contacts anyone or performs any real action.
   =========================================================================== */
(function () {
  "use strict";
  if (!window.ACUI || !window.ANTERCEPT_DATA) return;
  var el = ACUI.el;
  var DATA = ANTERCEPT_DATA;

  var QUEST = ["pick", "run", "open", "evidence", "resolve"];

  function build(root) {
    root.classList.add("acui");
    root.innerHTML = "";

    // working copy of campaigns so "run" can mutate status without touching source
    var campaigns = DATA.campaigns.map(function (c) {
      return { id: c.id, name: c.name, targets: c.targets.map(function (t) { return Object.assign({}, t); }) };
    });
    var active = campaigns[0];
    var done = {};

    // ---- main
    var main = el("div.ac-main");

    var top = el("div.ac-con__top");
    var camps = el("div.ac-con__campaigns");
    campaigns.forEach(function (c) {
      var b = el("button.ac-chip", { type: "button", text: c.name });
      if (c === active) b.classList.add("is-on");
      b.addEventListener("click", function () {
        if (running) return;
        active = c;
        runBtn.textContent = c.hasRun ? "Replay campaign" : "Run campaign";
        camps.querySelectorAll(".ac-chip").forEach(function (x) { x.classList.remove("is-on"); });
        b.classList.add("is-on");
        mark("pick");
        renderAll();
      });
      camps.appendChild(b);
    });
    var runWrap = el("div.ac-con__run");
    var runBtn = el("button.ac-btn.ac-btn--primary", { type: "button", text: "Run campaign" });
    runWrap.appendChild(runBtn);
    top.appendChild(camps);
    top.appendChild(runWrap);
    main.appendChild(top);

    var stats = el("div.ac-con__stats");
    main.appendChild(stats);

    var wrap = el("div.ac-con__wrap");
    var tablewrap = el("div.ac-con__tablewrap");
    var drawer = el("aside.ac-drawer", { "aria-hidden": "true" });
    wrap.appendChild(tablewrap);
    wrap.appendChild(drawer);
    main.appendChild(wrap);

    var shell = el("div.ac-shell", null, [main]);
    root.appendChild(shell);

    // ---- quest tracker
    var qhead = el("div.ac-quest-head", null, [
      el("span", { text: "Try the whole path" }),
      el("span", { "aria-live": "polite", text: "0 / " + QUEST.length })
    ]);
    var quest = el("ol.ac-quest");
    [["pick", "Pick a campaign"], ["run", "Run it"], ["open", "Open a target"], ["evidence", "See evidence"], ["resolve", "Resolve the test"]].forEach(function (q, i) {
      quest.appendChild(el("li", { "data-q": q[0] }, [el("span", { text: "0" + (i + 1) }), document.createTextNode(q[1])]));
    });
    root.appendChild(qhead);
    root.appendChild(quest);

    function mark(step) {
      if (done[step]) return;
      done[step] = true;
      var li = quest.querySelector('[data-q="' + step + '"]');
      if (li) li.classList.add("is-done");
      var n = Object.keys(done).length;
      qhead.querySelector("[aria-live]").textContent = n + " / " + QUEST.length;
    }

    // ---- stats
    function renderStats() {
      stats.innerHTML = "";
      var t = active.targets;
      var counts = { opened: 0, clicked: 0, reported: 0 };
      t.forEach(function (x) { if (counts[x.status] != null) counts[x.status]++; });
      var avg = Math.round(t.reduce(function (s, x) { return s + x.risk; }, 0) / t.length);
      [["Targets", t.length], ["Clicked", counts.clicked], ["Reported", counts.reported], ["Avg risk", avg]].forEach(function (c) {
        stats.appendChild(el("div.ac-cardlet", null, [
          el("p.ac-cardlet__k", { text: c[0] }),
          el("p.ac-cardlet__v", { text: String(c[1]) })
        ]));
      });
    }

    // ---- table
    function renderTable() {
      tablewrap.innerHTML = "";
      var table = el("table.ac-table");
      table.appendChild(el("thead", null, el("tr", null, [
        el("th", { text: "Target" }), el("th", { text: "Dept" }),
        el("th", { text: "Status" }), el("th", { text: "Risk" })
      ])));
      var tbody = el("tbody");
      active.targets.forEach(function (t) {
        var tr = el("tr", { "data-id": t.id });
        tr.appendChild(el("td", null, [
          (function () {
            var button = el("button.ac-target", { type: "button", text: t.name, "aria-label": "Inspect " + t.name });
            button.addEventListener("click", function (event) { event.stopPropagation(); if (!running) openDrawer(t, tr); });
            return button;
          })(),
          el("div.ac-mono", { text: t.id })
        ]));
        tr.appendChild(el("td", { text: t.dept }));
        tr.appendChild(el("td", null, [ACUI.pill(t.status)]));
        tr.appendChild(el("td", null, [ACUI.risk(t.risk)]));
        tr.addEventListener("click", function () { if (!running) openDrawer(t, tr); });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      tablewrap.appendChild(table);
    }

    // ---- drawer
    function openDrawer(t, tr) {
      mark("open");
      tablewrap.querySelectorAll("tr").forEach(function (x) { x.classList.remove("is-open"); });
      if (tr) tr.classList.add("is-open");
      drawer.innerHTML = "";
      var close = el("button.ac-drawer__close", { type: "button", "aria-label": "Close", html: "&times;" });
      close.addEventListener("click", closeDrawer);
      drawer.appendChild(close);
      drawer.appendChild(el("p.ac-drawer__name", { text: t.name }));
      drawer.appendChild(el("p.ac-drawer__mail", { text: t.email }));

      var meta = el("dl.ac-drawer__meta");
      [["Device", t.device], ["City", t.city], ["Status", t.status], ["Risk", String(t.risk)]].forEach(function (m) {
        meta.appendChild(el("div", null, [el("dt", { text: m[0] }), el("dd", { text: m[1] })]));
      });
      drawer.appendChild(meta);

      // evidence depends on how far the target got
      drawer.appendChild(el("p.ac-cardlet__k", { text: "Evidence (simulated)" }));
      var ev = el("ul.ac-evidence");
      var items = [];
      if (t.status === "opened" || t.status === "clicked") items.push(["cookie", "Session cookie", "captured"]);
      if (t.status === "clicked") {
        items.push(["key", "Credential entry", "captured"]);
        items.push(["net", "Source IP · " + t.city, "logged"]);
      }
      if (t.status === "reported") items.push(["phisher", "Reported to security", "safe"]);
      if (t.status === "pending") items.push(["template", "No interaction yet", "—"]);
      items.forEach(function (it) {
        var li = el("li", null, [
          (function () { var s = document.createElement("span"); s.innerHTML = '<svg viewBox="0 0 16 16" fill="currentColor">' + (ACUI.ICONS[it[0]] || "") + "</svg>"; return s.firstChild; })(),
          document.createTextNode(it[1]),
          el("span.ac-ev__tag", { text: it[2] })
        ]);
        ev.appendChild(li);
      });
      drawer.appendChild(ev);
      if (items.length) mark("evidence");

      if (!t.resolved) {
        var resolve = el("button.ac-btn.ac-btn--primary", { type: "button", text: "Mark test resolved", style: "margin-top:14px;width:100%;justify-content:center" });
        resolve.addEventListener("click", function () {
          t.resolved = true;
          t.risk = 0;
          mark("resolve");
          renderStats();
          renderTable();
          openDrawer(t, tablewrap.querySelector('[data-id="' + t.id + '"]'));
        });
        drawer.appendChild(resolve);
      }
      if (t.resolved) drawer.appendChild(el("p", { text: "Test resolved · evidence retained" }));
      drawer.appendChild(el("p.ac-drawer__note", { text: "Simulated evidence from a controlled awareness test. No real session, credential or location is represented." }));
      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
    }
    function closeDrawer() {
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      tablewrap.querySelectorAll("tr").forEach(function (x) { x.classList.remove("is-open"); });
    }

    // Replays start with a clean cohort; a run stays bound to its campaign.
    var running = false;
    var runStatus = el("p.ac-run-status", { "aria-live": "polite", text: "Sample campaign ready. Run it, then inspect a target." });
    main.appendChild(runStatus);
    runBtn.addEventListener("click", function () {
      if (running) return;
      mark("pick");
      mark("run");
      running = true;
      var campaign = active;
      campaign.hasRun = true;
      closeDrawer();
      campaign.targets.forEach(function (t) { t.status = "pending"; t.risk = 0; t.resolved = false; });
      runBtn.textContent = "Running…";
      runBtn.disabled = true;
      camps.querySelectorAll("button").forEach(function (b) { b.disabled = true; });
      renderAll();
      var i = 0;
      var opening = true;
      runStatus.textContent = "Simulating opens and responses…";
      var timer = setInterval(function () {
        var t = campaign.targets[i];
        if (opening) {
          t.status = "opened";
          t.risk = 35;
        } else {
          // Illustrative outcomes, not a trained model or real infection verdict.
          t.status = i % 3 === 0 ? "clicked" : i % 3 === 1 ? "reported" : "opened";
          t.risk = t.status === "clicked" ? 72 : t.status === "reported" ? 8 : 35;
          i++;
        }
        opening = !opening;
        renderAll();
        if (i >= campaign.targets.length) {
          clearInterval(timer);
          running = false;
          runBtn.textContent = "Replay campaign";
          runBtn.disabled = false;
          camps.querySelectorAll("button").forEach(function (b) { b.disabled = false; });
          runStatus.textContent = "Simulation complete. Inspect a target to review evidence and resolve the test.";
        }
      }, 100);
    });

    function renderAll() { renderStats(); renderTable(); closeDrawer(); }
    renderAll();
  }

  document.querySelectorAll("[data-console]").forEach(function (root) {
    try { build(root); }
    catch (e) { root.innerHTML = '<p class="ac-fallback">The console could not start.</p>'; }
  });
})();
