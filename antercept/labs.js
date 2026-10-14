/* ===========================================================================
   Antercept · AI labs
   Two live, local, deterministic demonstrations:
   1) Template studio — composes an awareness lure and explains every lever.
   2) Outcome predictor — a transparent model of click/report rates.
   No network, no payload, nothing sendable. Sample data only.
   =========================================================================== */
(function () {
  "use strict";
  if (!window.ACUI || !window.ANTERCEPT_DATA) return;
  var el = ACUI.el;
  var DATA = ANTERCEPT_DATA;

  /* ---- why each persuasion lever works (awareness education) ------------- */
  var LEVERS = {
    urgency: "A deadline shrinks the time to think. Awareness training teaches staff to slow down when a message rushes them.",
    authority: "A message that looks official borrows trust it has not earned. Teach staff to verify the sender, not the logo.",
    familiarity: "A known brand or colleague lowers suspicion. Real senders rarely ask you to confirm a password by link.",
    curiosity: "An unnamed document or missed parcel invites a click before the brain catches up. Pause and check the source.",
    fear: "A threat to money or access triggers action over analysis. Legitimate services do not threaten you into a link.",
    scarcity: "Limited space or a one-time code pressures a fast decision. The pressure itself is the warning sign."
  };

  /* ---- compose the lure text, marking each lever ------------------------- */
  function composeLure(brand, channel, levers) {
    var b = brand.name;
    var parts = [];
    var subject;
    if (levers.indexOf("urgency") >= 0) {
      subject = "Action required today — " + b;
    } else if (levers.indexOf("curiosity") >= 0) {
      subject = b + ": something is waiting for you";
    } else {
      subject = "A notice from " + b;
    }

    function lever(text, name) {
      return '<span class="ac-lever" data-why="' + LEVERS[name] + '">' + text + "</span>";
    }

    var opening = "Hi there,";
    var line1, line2, cta;

    if (levers.indexOf("authority") >= 0) {
      line1 = "This is an official notice from the " + lever(b + " security team", "authority") + ".";
    } else {
      line1 = "We are getting in touch about your " + b + " account.";
    }

    if (levers.indexOf("fear") >= 0) {
      line2 = "We have detected " + lever("unusual activity that may lock your account", "fear") + ".";
    } else if (levers.indexOf("curiosity") >= 0) {
      line2 = "There is " + lever("a document waiting that we could not preview for you", "curiosity") + ".";
    } else if (levers.indexOf("familiarity") >= 0) {
      line2 = "A " + lever("colleague you work with", "familiarity") + " has asked us to reach you.";
    } else {
      line2 = "A routine check on your account is due.";
    }

    var deadline = levers.indexOf("urgency") >= 0
      ? " " + lever("Please confirm within the next 30 minutes", "urgency") + "."
      : "";

    cta = channel === "sms"
      ? "Tap to confirm: " + brand.id + "-verify.example"
      : "Confirm your account";

    return {
      subject: subject,
      from: b + " <no-reply@" + brand.id + ".example>",
      html: opening + "<br><br>" + line1 + " " + line2 + deadline + "<br><br>",
      cta: cta,
      channel: channel
    };
  }

  /* ---- the template studio ---------------------------------------------- */
  function buildStudio(root) {
    root.classList.add("acui");
    var state = {
      brand: DATA.brands[1], // Contoso
      channel: "email",
      levers: ["urgency", "authority"]
    };

    var head = el("div.ac-lab__head", null, [
      el("span.ac-lab__k", { html: "<i></i> AI template studio" }),
      el("span.ac-lab__note", { text: "Fictional brands · runs locally · nothing is sent" })
    ]);

    var controls = el("div.ac-studio__controls");
    var preview = el("div");
    var grid = el("div.ac-studio", null, [controls, preview]);
    root.innerHTML = "";
    root.appendChild(head);
    root.appendChild(grid);

    // brand chips
    var brandField = el("div.ac-field", null, [el("span.ac-field__k", { text: "Brand to imitate (fictional)" })]);
    var brandChips = el("div.ac-chips");
    DATA.brands.forEach(function (b) {
      var c = el("button.ac-chip", { type: "button", text: b.name });
      if (b.id === state.brand.id) c.classList.add("is-on");
      c.addEventListener("click", function () {
        state.brand = b;
        brandChips.querySelectorAll(".ac-chip").forEach(function (x) { x.classList.remove("is-on"); });
        c.classList.add("is-on");
        render();
      });
      brandChips.appendChild(c);
    });
    brandField.appendChild(brandChips);

    // channel segmented
    var chanField = el("div.ac-field", null, [el("span.ac-field__k", { text: "Channel" })]);
    var seg = el("div.ac-seg");
    ["email", "sms"].forEach(function (ch) {
      var btn = el("button", { type: "button", text: ch.toUpperCase() });
      if (ch === state.channel) btn.classList.add("is-on");
      btn.addEventListener("click", function () {
        state.channel = ch;
        seg.querySelectorAll("button").forEach(function (x) { x.classList.remove("is-on"); });
        btn.classList.add("is-on");
        render();
      });
      seg.appendChild(btn);
    });
    chanField.appendChild(seg);

    // lever chips
    var leverField = el("div.ac-field", null, [el("span.ac-field__k", { text: "Persuasion levers" })]);
    var leverChips = el("div.ac-chips");
    Object.keys(LEVERS).forEach(function (name) {
      var c = el("button.ac-chip", { type: "button", text: name });
      if (state.levers.indexOf(name) >= 0) c.classList.add("is-on");
      c.addEventListener("click", function () {
        var i = state.levers.indexOf(name);
        if (i >= 0) state.levers.splice(i, 1);
        else state.levers.push(name);
        c.classList.toggle("is-on");
        render();
      });
      leverChips.appendChild(c);
    });
    leverField.appendChild(leverChips);

    controls.appendChild(brandField);
    controls.appendChild(chanField);
    controls.appendChild(leverField);

    function render() {
      var lure = composeLure(state.brand, state.channel, state.levers);
      preview.innerHTML = "";
      var box = el("div.ac-lure");
      box.appendChild(el("div.ac-lure__bar", null, [
        el("span.ac-lure__dot"),
        document.createTextNode(state.channel === "sms" ? "SMS preview" : "Inbox preview")
      ]));
      var body = el("div.ac-lure__body");
      body.appendChild(el("p.ac-lure__from", { text: "From: " + lure.from }));
      if (state.channel === "email") body.appendChild(el("p.ac-lure__subj", { text: lure.subject }));
      body.appendChild(el("div", { html: lure.html }));
      body.appendChild(el("span.ac-lure__cta", { text: lure.cta }));
      box.appendChild(body);
      preview.appendChild(box);

      // why-it-works breakdown
      var why = el("div.ac-why");
      why.appendChild(el("p.ac-field__k", { text: "Why this lure works — and what to teach" }));
      if (!state.levers.length) {
        why.appendChild(el("p.ac-why__v", { text: "No levers selected. A flat message rarely fools anyone — that is the point of the lesson." }));
      }
      state.levers.forEach(function (name) {
        why.appendChild(el("div.ac-why__row", null, [
          el("span.ac-why__k", { text: name }),
          el("span.ac-why__v", { text: LEVERS[name] })
        ]));
      });
      preview.appendChild(why);
    }
    render();
  }

  /* ---- the outcome predictor -------------------------------------------- */
  function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

  function buildPredict(root) {
    root.classList.add("acui");
    var state = { difficulty: 2, urgency: 0.6, training: 0.4, pretextFit: 0.7, audience: 0.5 };

    var head = el("div.ac-lab__head", null, [
      el("span.ac-lab__k", { html: "<i></i> Campaign outcome predictor" }),
      el("span.ac-lab__note", { text: "Transparent model · sample inputs" })
    ]);
    var gauge = el("div.ac-gauge");
    var right = el("div");
    var grid = el("div.ac-predict", null, [gauge, right]);
    root.innerHTML = "";
    root.appendChild(head);
    root.appendChild(grid);

    // factor contributions, shown before the sliders
    var factors = el("div.ac-factors");
    right.appendChild(el("p.ac-field__k", { text: "What moves the prediction" }));
    right.appendChild(factors);

    // sliders
    var ctls = el("div.ac-factors", { style: "margin-top:18px" });
    right.appendChild(el("p.ac-field__k", { text: "Tune the campaign" }));
    right.appendChild(ctls);

    var SLIDERS = [
      { k: "urgency", label: "Urgency in the lure", min: 0, max: 1, step: 0.05 },
      { k: "pretextFit", label: "Pretext fits the audience", min: 0, max: 1, step: 0.05 },
      { k: "training", label: "Recent staff training", min: 0, max: 1, step: 0.05 },
      { k: "audience", label: "Audience susceptibility", min: 0, max: 1, step: 0.05 }
    ];
    SLIDERS.forEach(function (s) {
      var out = el("output", { text: state[s.k].toFixed(2) });
      var input = el("input", { type: "range", min: s.min, max: s.max, step: s.step, value: state[s.k] });
      input.addEventListener("input", function () {
        state[s.k] = parseFloat(input.value);
        out.textContent = state[s.k].toFixed(2);
        render();
      });
      ctls.appendChild(el("label.ac-ctl", null, [
        el("span", { text: s.label }),
        input,
        out
      ]));
    });

    function model() {
      // transparent linear-logistic model. Weights are explicit on purpose.
      var contrib = {
        "Urgency": 1.6 * state.urgency,
        "Pretext fit": 1.4 * state.pretextFit,
        "Audience": 1.2 * state.audience,
        "Training (protective)": -1.8 * state.training
      };
      var z = -0.4;
      Object.keys(contrib).forEach(function (k) { z += contrib[k]; });
      var click = sigmoid(z);
      // report rate rises with training, falls with a convincing lure
      var report = sigmoid(-0.6 + 2.2 * state.training - 0.9 * state.pretextFit);
      // can't report more than didn't-click
      report = Math.min(report, 1 - click * 0.5);
      return { click: click, report: report, contrib: contrib };
    }

    function render() {
      var m = model();
      var clickPct = Math.round(m.click * 100);
      var reportPct = Math.round(m.report * 100);
      gauge.innerHTML = "";
      gauge.appendChild(el("p.ac-field__k", { text: "Predicted click rate" }));
      gauge.appendChild(el("p.ac-gauge__big", { html: clickPct + "<small>%</small>" }));
      gauge.appendChild(el("p.ac-gauge__sub", { text: "of targets likely to click the lure" }));
      gauge.appendChild(el("div.ac-gauge__split", null, [
        el("span.is-click", { html: "<b>" + clickPct + "%</b>click" }),
        el("span.is-report", { html: "<b>" + reportPct + "%</b>report" })
      ]));

      factors.innerHTML = "";
      var keys = Object.keys(m.contrib);
      var maxAbs = Math.max.apply(null, keys.map(function (k) { return Math.abs(m.contrib[k]); })) || 1;
      keys.forEach(function (k) {
        var v = m.contrib[k];
        var pct = Math.round((Math.abs(v) / maxAbs) * 100);
        var fill = el("span.ac-factor__fill");
        fill.style.width = pct + "%";
        if (v < 0) fill.style.background = "linear-gradient(90deg,#2f7d5e,#3ad29f)";
        factors.appendChild(el("div.ac-factor", null, [
          el("div.ac-factor__top", null, [
            document.createTextNode(k),
            el("b", { text: (v >= 0 ? "+" : "") + v.toFixed(2) })
          ]),
          el("div.ac-factor__bar", null, [fill])
        ]));
      });
    }
    render();
  }

  /* ---- mount ------------------------------------------------------------- */
  document.querySelectorAll("[data-lab]").forEach(function (root) {
    var kind = root.getAttribute("data-lab");
    try {
      if (kind === "studio") buildStudio(root);
      else if (kind === "predict") buildPredict(root);
    } catch (e) {
      root.innerHTML = '<p class="ac-fallback">This demonstration could not start.</p>';
    }
  });
})();
