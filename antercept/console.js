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

  var NAV = [
    { group: "", items: [["dashboard", "Dashboard", true]] },
    { group: "Phishing", items: [["phisher", "Phisher"], ["cookie", "Cookies"], ["key", "Credentials"]] },
    { group: "Geolocation", items: [["locate", "Locater"], ["net", "IPs / Locations"]] },
    { group: "Phone extraction", items: [["extract", "Extracter"], ["data", "Data / Backups"]] },
    { group: "Infrastructure", items: [["template", "Templates"], ["server", "Servers"], ["domain", "Domain Names"]] },
    { group: "Settings", items: [["users", "User Management"], ["settings", "Settings"]] }
  ];

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

    // ---- sidebar
    var side = el("aside.ac-side");
    var brand = el("div.ac-side__brand");
    brand.innerHTML = '<svg viewBox="0 0 40 28" fill="none"><circle cx="15" cy="15" r="9.2" stroke="currentColor" stroke-width="1.8"/><path d="M24.4 15a9.2 9.2 0 1 1-6.2-8.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M24.2 6.3c2.6-.2 5 .1 6.7 1.4 2.2 1.7 2 4.2.2 5.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span>antercept</span>';
    side.appendChild(brand);
    NAV.forEach(function (sec) {
      if (sec.group) side.appendChild(el("p.ac-side__group", { text: sec.group }));
      var ul = el("ul.ac-nav");
      sec.items.forEach(function (it) {
        var li = el("li", null, [ACUI.icon(it[0]), document.createTextNode(it[1])]);
        if (it[2]) li.classList.add("is-active");
        ul.appendChild(li);
      });
      side.appendChild(ul);
    });

    // ---- main
    var main = el("div.ac-main");

    var top = el("div.ac-con__top");
    var camps = el("div.ac-con__campaigns");
    campaigns.forEach(function (c) {
      var b = el("button.ac-chip", { type: "button", text: c.name });
      if (c === active) b.classList.add("is-on");
      b.addEventListener("click", function () {
        active = c;
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

    var shell = el("div.ac-shell", null, [side, main]);
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
          el("div", { text: t.name }),
          el("div.ac-mono", { text: t.id })
        ]));
        tr.appendChild(el("td", { text: t.dept }));
        tr.appendChild(el("td", null, [ACUI.pill(t.status)]));
        tr.appendChild(el("td", null, [ACUI.risk(t.risk)]));
        tr.addEventListener("click", function () { openDrawer(t, tr); });
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

      if (t.status !== "reported") {
        var resolve = el("button.ac-btn.ac-btn--primary", { type: "button", text: "Mark test resolved", style: "margin-top:14px;width:100%;justify-content:center" });
        resolve.addEventListener("click", function () {
          t.status = "reported";
          mark("resolve");
          renderStats();
          renderTable();
          openDrawer(t, tablewrap.querySelector('[data-id="' + t.id + '"]'));
        });
        drawer.appendChild(resolve);
      }
      drawer.appendChild(el("p.ac-drawer__note", { text: "Simulated evidence from a controlled awareness test. No real session, credential or location is represented." }));
      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
    }
    function closeDrawer() {
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      tablewrap.querySelectorAll("tr").forEach(function (x) { x.classList.remove("is-open"); });
    }

    // ---- run simulation: advance a few pending targets forward
    var running = false;
    runBtn.addEventListener("click", function () {
      if (running) return;
      mark("run");
      running = true;
      runBtn.textContent = "Running…";
      runBtn.disabled = true;
      var pending = active.targets.filter(function (t) { return t.status === "pending"; });
      var i = 0;
      var timer = setInterval(function () {
        if (i >= pending.length) {
          clearInterval(timer);
          running = false;
          runBtn.textContent = "Run campaign";
          runBtn.disabled = false;
          return;
        }
        var t = pending[i++];
        // deterministic-ish outcome from the target's own risk
        t.status = t.risk > 55 ? "clicked" : t.risk > 30 ? "opened" : "reported";
        renderStats();
        renderTable();
      }, 160);
    });

    function renderAll() { renderStats(); renderTable(); closeDrawer(); }
    renderAll();
  }

  document.querySelectorAll("[data-console]").forEach(function (root) {
    try { build(root); }
    catch (e) { root.innerHTML = '<p class="ac-fallback">The console could not start.</p>'; }
  });
})();
