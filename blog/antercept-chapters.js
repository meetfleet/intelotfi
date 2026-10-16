/* ===========================================================================
   Antercept chapters · one live simulator per chapter.
   Mounted on [data-sim="..."]. No network, no payload, fictional data only.
     lure      — compose an awareness lure from levers, annotated live (Ch I)
     timeline  — step a target through the exposure timeline, risk updates (Ch II)
     map       — run a campaign, city bubbles fill by exposure (Ch III)
   =========================================================================== */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ---------------- Ch I · the lure composer ---------------- */
  var LEVERS = {
    authority: { label: "Authority", why: "Looks like someone who can instruct you. Verify the sender, not the logo." },
    urgency: { label: "Urgency", why: "Less time than you need to think. Slow down when a message rushes you." },
    fear: { label: "Fear", why: "Threatens money or access. Real services don’t threaten you into a link." },
    curiosity: { label: "Curiosity", why: "Dangles something unnamed. Pause before you open the unknown." },
    familiarity: { label: "Familiarity", why: "Wears a brand you trust. Trust the relationship, not the template." }
  };

  function buildLure(root) {
    var state = { brand: "Contoso 365", levers: ["authority", "urgency"] };
    root.innerHTML = "";
    var head = el("div", "acsim__head",
      '<span class="acsim__k"><i></i> Lure composer</span><span class="acsim__note">fictional brand · nothing is sent</span>');
    root.appendChild(head);

    var grid = el("div", "acsim__lure");
    var controls = el("div", "acsim__controls");
    var preview = el("div", "acsim__preview");
    grid.appendChild(controls);
    grid.appendChild(preview);
    root.appendChild(grid);

    // brand field
    var bf = el("label", "acsim__field",
      '<span class="acsim__fk">Brand (fictional)</span>');
    var bsel = el("select", "acsim__sel");
    ["Contoso 365", "Northwind Mail", "Acme Pay", "Parcelo", "Fabrikam HR"].forEach(function (b) {
      var o = el("option"); o.value = b; o.textContent = b; if (b === state.brand) o.selected = true; bsel.appendChild(o);
    });
    bsel.addEventListener("change", function () { state.brand = bsel.value; render(); });
    bf.appendChild(bsel);
    controls.appendChild(bf);

    // lever chips
    var lf = el("div", "acsim__field", '<span class="acsim__fk">Persuasion levers</span>');
    var chips = el("div", "acsim__chips");
    Object.keys(LEVERS).forEach(function (k) {
      var c = el("button", "acsim__chip" + (state.levers.indexOf(k) >= 0 ? " is-on" : ""), LEVERS[k].label);
      c.type = "button";
      c.addEventListener("click", function () {
        var i = state.levers.indexOf(k);
        if (i >= 0) state.levers.splice(i, 1); else state.levers.push(k);
        c.classList.toggle("is-on");
        render();
      });
      chips.appendChild(c);
    });
    lf.appendChild(chips);
    controls.appendChild(lf);

    function span(text, lever) {
      return '<span class="acsim__lever" tabindex="0" data-why="' + LEVERS[lever].why + '">' + text + "</span>";
    }
    function render() {
      var b = state.brand, L = state.levers;
      var subj = L.indexOf("urgency") >= 0 ? "Action required today — " + b
        : L.indexOf("curiosity") >= 0 ? b + ": something is waiting for you"
          : "A notice from " + b;
      var line1 = L.indexOf("authority") >= 0
        ? "This is an official notice from the " + span(b + " security team", "authority") + "."
        : "We’re getting in touch about your " + b + " account.";
      var line2 = L.indexOf("fear") >= 0
        ? "We detected " + span("unusual activity that may lock your account", "fear") + "."
        : L.indexOf("curiosity") >= 0
          ? "There is " + span("a document waiting we couldn’t preview", "curiosity") + "."
          : L.indexOf("familiarity") >= 0
            ? "A " + span("colleague you work with", "familiarity") + " asked us to reach you."
            : "A routine check on your account is due.";
      var dl = L.indexOf("urgency") >= 0 ? " " + span("Please confirm within 30 minutes", "urgency") + "." : "";
      preview.innerHTML =
        '<div class="acsim__mail">' +
        '<div class="acsim__bar"><span class="acsim__dot"></span>Inbox preview</div>' +
        '<div class="acsim__body">' +
        '<p class="acsim__from">From: ' + b + " &lt;no-reply@" + b.toLowerCase().replace(/[^a-z]/g, "") + ".example&gt;</p>" +
        '<p class="acsim__subj">' + subj + "</p>" +
        "<p>Hi there,</p><p>" + line1 + " " + line2 + dl + "</p>" +
        '<span class="acsim__cta">Confirm your account</span>' +
        "</div></div>" +
        '<div class="acsim__why"><p class="acsim__fk">Why it works — and what to teach</p>' +
        (L.length ? L.map(function (k) {
          return '<div class="acsim__whyrow"><b>' + LEVERS[k].label + "</b><span>" + LEVERS[k].why + "</span></div>";
        }).join("") : '<p class="acsim__muted">No levers selected — a flat message rarely fools anyone. That is the lesson.</p>') +
        "</div>";
    }
    render();
  }

  /* ---------------- Ch II · exposure timeline ---------------- */
  function buildTimeline(root) {
    var STEPS = [
      { k: "delivered", label: "Delivered", ev: "Message delivered to the target’s inbox.", risk: 12 },
      { k: "opened", label: "Opened", ev: "The message was opened. A tracking pixel loaded.", risk: 34 },
      { k: "clicked", label: "Clicked", ev: "The link was clicked. A session cookie was captured.", risk: 62 },
      { k: "credential", label: "Credential", ev: "A credential was entered on the test page.", risk: 86 },
      { k: "reported", label: "Reported", ev: "The target reported the message. Risk resets toward safe.", risk: 9 }
    ];
    var i = 0;
    root.innerHTML = "";
    root.appendChild(el("div", "acsim__head",
      '<span class="acsim__k"><i></i> Exposure timeline</span><span class="acsim__note">one fictional target · sample data</span>'));

    var track = el("div", "acsim__track");
    STEPS.forEach(function (s, n) {
      track.appendChild(el("div", "acsim__node", '<span></span>' + s.label));
    });
    root.appendChild(track);

    var panel = el("div", "acsim__tlpanel");
    root.appendChild(panel);

    var ctrls = el("div", "acsim__ctrls");
    var back = el("button", "acsim__btn", "Back"); back.type = "button";
    var fwd = el("button", "acsim__btn acsim__btn--primary", "Advance"); fwd.type = "button";
    var reset = el("button", "acsim__btn", "Reset"); reset.type = "button";
    ctrls.appendChild(back); ctrls.appendChild(fwd); ctrls.appendChild(reset);
    root.appendChild(ctrls);

    function render() {
      var nodes = track.querySelectorAll(".acsim__node");
      nodes.forEach(function (n, idx) {
        n.classList.toggle("is-done", idx < i);
        n.classList.toggle("is-now", idx === i);
        n.classList.toggle("is-safe", STEPS[i].k === "reported" && idx === i);
      });
      var s = STEPS[i];
      var risk = s.risk;
      var col = s.k === "reported" ? "#3ad29f" : risk > 70 ? "#ff5c72" : risk > 40 ? "#f4c04e" : "#9e7bff";
      panel.innerHTML =
        '<div class="acsim__evt">' + s.ev + "</div>" +
        '<div class="acsim__risk"><span class="acsim__fk">Risk score</span>' +
        '<div class="acsim__meter"><i style="width:' + risk + '%;background:' + col + '"></i></div>' +
        '<b style="color:' + col + '">' + risk + "</b></div>";
      back.disabled = i === 0; fwd.disabled = i === STEPS.length - 1;
    }
    fwd.addEventListener("click", function () { if (i < STEPS.length - 1) { i++; render(); } });
    back.addEventListener("click", function () { if (i > 0) { i--; render(); } });
    reset.addEventListener("click", function () { i = 0; render(); });
    render();
  }

  /* ---------------- Ch III · campaign map ---------------- */
  function buildMap(root) {
    var CITIES = [
      { name: "Casablanca", x: 34, y: 60, base: 14 },
      { name: "Lisbon", x: 18, y: 46, base: 8 },
      { name: "Berlin", x: 52, y: 34, base: 5 },
      { name: "Dubai", x: 78, y: 62, base: 7 },
      { name: "Milan", x: 48, y: 52, base: 6 },
      { name: "Accra", x: 40, y: 82, base: 4 }
    ];
    root.innerHTML = "";
    root.appendChild(el("div", "acsim__head",
      '<span class="acsim__k"><i></i> Campaign map</span><span class="acsim__note">fictional offices · coarse location only</span>'));

    var map = el("div", "acsim__map");
    var svgNS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.classList.add("acsim__mapsvg");
    // faint grid
    for (var g = 10; g < 100; g += 10) {
      ["M" + g + " 0V100", "M0 " + g + "H100"].forEach(function (dd) {
        var l = document.createElementNS(svgNS, "path"); l.setAttribute("d", dd); l.setAttribute("class", "acsim__grid"); svg.appendChild(l);
      });
    }
    var bubbles = CITIES.map(function (c) {
      var circ = document.createElementNS(svgNS, "circle");
      circ.setAttribute("cx", c.x); circ.setAttribute("cy", c.y); circ.setAttribute("r", "1");
      circ.setAttribute("class", "acsim__bubble");
      svg.appendChild(circ);
      var t = document.createElementNS(svgNS, "text");
      t.setAttribute("x", c.x); t.setAttribute("y", c.y + 8); t.setAttribute("class", "acsim__city");
      t.textContent = c.name; svg.appendChild(t);
      return circ;
    });
    map.appendChild(svg);
    root.appendChild(map);

    var ctrls = el("div", "acsim__ctrls");
    var run = el("button", "acsim__btn acsim__btn--primary", "Run campaign"); run.type = "button";
    var legend = el("span", "acsim__legend", "Bubble size = exposure. Red marks where to train next.");
    ctrls.appendChild(run); ctrls.appendChild(legend);
    root.appendChild(ctrls);

    var running = false;
    run.addEventListener("click", function () {
      if (running) return; running = true; run.textContent = "Running…"; run.disabled = true;
      bubbles.forEach(function (b) { b.setAttribute("r", "1"); b.classList.remove("is-hot"); });
      var step = 0;
      var timer = setInterval(function () {
        step++;
        CITIES.forEach(function (c, idx) {
          var target = c.base + (idx === 0 ? 10 : 0); // Casablanca runs hottest
          var r = Math.min(target, step);
          bubbles[idx].setAttribute("r", String(2 + r * 0.8));
          if (r >= 16) bubbles[idx].classList.add("is-hot");
        });
        if (step >= 24) {
          clearInterval(timer); running = false; run.textContent = "Run again"; run.disabled = false;
        }
      }, 90);
    });
  }

  /* ---------------- mount ---------------- */
  var BUILDERS = { lure: buildLure, timeline: buildTimeline, map: buildMap };
  document.querySelectorAll("[data-sim]").forEach(function (root) {
    var kind = root.getAttribute("data-sim");
    try { if (BUILDERS[kind]) BUILDERS[kind](root); }
    catch (e) { root.innerHTML = '<p class="acsim__muted">This simulator could not start.</p>'; }
  });
})();
