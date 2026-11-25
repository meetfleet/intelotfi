/* Proposed intelligence layer: transparent local models, no inference service.
   Both the data pipeline and priority model are educational simulations. */
window.BFAI = (() => {
  const U = BFUI,
    esc = U.esc;
  let instance = 0;
  const weights = [0.45, 0.35, 0.2];
  const assess = ({ credential, session, asset, age, ageUnknown = false }) => {
    const inputs = [credential, session, asset];
    const low = inputs.map((v) => (v < 0 ? 0 : v));
    const high = inputs.map((v) => (v < 0 ? 1 : v));
    const freshness = 2 ** (-age / 30);
    const fLow = ageUnknown ? 0.65 : 0.65 + 0.35 * freshness;
    const fHigh = ageUnknown ? 1 : fLow;
    const contributions = weights.map((w, i) => [
      100 * w * low[i] * fLow,
      100 * w * high[i] * fHigh,
    ]);
    const min = Math.round(contributions.reduce((s, v) => s + v[0], 0));
    const max = Math.round(contributions.reduce((s, v) => s + v[1], 0));
    const known = inputs.filter((v) => v >= 0).length + (ageUnknown ? 0 : 1);
    return {
      min,
      max,
      known,
      freshness,
      contributions,
      band:
        known < 4
          ? "Needs evidence"
          : min >= 70
            ? "High priority"
            : min >= 40
              ? "Elevated priority"
              : "Lower priority",
    };
  };
  const risk = (body) => {
    const id = `risk-${++instance}`;
    body.innerHTML = `<div class="dm-ai-heading"><span class="bf-badge bf-badge--orange">Proposed architecture</span><span class="bf-dim">Local scoring sandbox · no AI model is called</span></div>
      <div class="dm-ai-risk-layout"><div class="dm-ai-controls">
        <label class="dm-label" for="${id}-credential">E1 · Credential evidence</label><select class="bf-select" id="${id}-credential" data-risk-input="credential"><option value="1">Exposed · weak or reused</option><option value="0.6">Exposed · unique password</option><option value="0">No credential in this record</option><option value="-1">Unknown / not assessed</option></select>
        <label class="dm-label" for="${id}-session">E2 · Session evidence</label><select class="bf-select" id="${id}-session" data-risk-input="session"><option value="0.8">Token captured · not yet expired</option><option value="0">Revocation confirmed / no token</option><option value="-1">Unknown / not assessed</option></select>
        <label class="dm-label" for="${id}-asset">E3 · Account impact</label><select class="bf-select" id="${id}-asset" data-risk-input="asset"><option value="0.65">Sensitive business application</option><option value="1">Privileged administration</option><option value="0.25">Standard application account</option><option value="-1">Unknown / not mapped</option></select>
        <label class="dm-label" for="${id}-age">E4 · Evidence age <output data-risk-age>7 days</output></label><input class="dm-range" id="${id}-age" data-risk-input="age" type="range" min="0" max="180" value="7" />
        <label class="dm-ai-check"><input type="checkbox" data-risk-input="ageUnknown" />Detection date is unknown</label>
        <div class="dm-note">Fictional device KS-7Q2M9X4D · kestrel.example. An unexpired token is not a verified active session.</div>
      </div><div class="dm-ai-result"><div data-risk-summary role="status" aria-live="polite"></div><div data-risk-contributions></div><div class="dm-ai-counterfactuals"><span class="bf-dim">Change one condition</span><button type="button" class="bf-btn bf-btn--sm" data-risk-action="revoke">Confirm session revocation</button><button type="button" class="bf-btn bf-btn--sm" data-risk-action="unknown">Withhold session evidence</button><button type="button" class="bf-btn bf-btn--sm" data-risk-action="privilege">Reduce account privilege</button></div></div></div>
      <div class="bf-tabs dm-ai-tabs" role="tablist" aria-label="Understand the assessment">${["The calculation", "Possible attack path", "Analyst brief"].map((t, i) => `<button type="button" class="bf-tab" role="tab" id="${id}-tab-${i}" aria-selected="${i === 0}" aria-controls="${id}-panel-${i}">${t}</button>`).join("")}</div>
      <div role="tabpanel" id="${id}-panel-0" aria-labelledby="${id}-tab-0"><div class="dm-ai-formula"><span class="bf-dim">Illustrative priority rule · fixed, inspectable weights</span><code>P = 100 × (0.45C + 0.35S + 0.20A) × (0.65 + 0.35F)</code><code>F = 2<sup>−age / 30</sup></code><div>C: credential exposure · S: session evidence · A: account impact · F: recency. Missing inputs span [0, 1], producing a range rather than an invented value.</div></div><div class="dm-note">Weights and thresholds are chosen for this demonstration, not learned or calibrated. The score orders review; it is not a breach probability, CVSS, or EPSS. Age changes queue priority, not whether an unresolved exposure is safe.</div></div>
      <div role="tabpanel" id="${id}-panel-1" aria-labelledby="${id}-tab-1" hidden><div data-risk-path></div></div>
      <div role="tabpanel" id="${id}-panel-2" aria-labelledby="${id}-tab-2" hidden><div data-risk-brief></div><div class="dm-note">This brief uses deterministic templates to demonstrate the intended AI output contract. A production model would draft from retrieved, authorised evidence with record citations.</div></div>`;
    const read = () =>
      Object.fromEntries(
        [...body.querySelectorAll("[data-risk-input]")].map((el) => [
          el.dataset.riskInput,
          el.type === "checkbox" ? el.checked : Number(el.value),
        ]),
      );
    const update = () => {
      const values = read(),
        result = assess(values),
        incomplete = result.known < 4;
      body.querySelector("[data-risk-age]").textContent = values.ageUnknown
        ? "unknown"
        : `${values.age} days`;
      body.querySelector('[data-risk-input="age"]').disabled =
        values.ageUnknown;
      body.querySelector("[data-risk-summary]").innerHTML =
        `<span class="bf-dim">${incomplete ? "Priority interval" : "Review priority"} · ${result.band}</span><b class="dm-ai-score">${result.min}${incomplete ? "–" + result.max : ""}<small>/ 100</small></b><span class="dm-ai-coverage">${result.known} / 4 inputs known · ${incomplete ? "collect missing evidence before assigning a precise rank" : "all four fields supplied"}</span>`;
      body.querySelector("[data-risk-contributions]").innerHTML = [
        "Credentials",
        "Sessions",
        "Account impact",
      ]
        .map(
          (name, i) =>
            `<div class="dm-ai-contribution"><span>${name}</span><b>${result.contributions[i][0].toFixed(1)}${incomplete ? "–" + result.contributions[i][1].toFixed(1) : ""}</b><div class="dm-ai-bar"><span style="transform:scaleX(${result.contributions[i][1] / 45})"></span></div></div>`,
        )
        .join("");
      const blocked = values.session === 0,
        uncertain = values.session < 0;
      body.querySelector("[data-risk-path]").innerHTML =
        `<div class="dm-ai-path" aria-label="Hypothesised session-reuse path">${[
          ["Device record", "KS-7Q2M9X4D · observed"],
          ["Browser evidence", "Credential / token artefacts"],
          [
            blocked
              ? "Session path blocked"
              : uncertain
                ? "Session evidence missing"
                : "Session reuse?",
            "Requires server acceptance",
          ],
          ["Business application", "kestrel.example"],
          ["Privileged action?", "Requires account permissions"],
        ]
          .map(
            ([name, note], i) =>
              `<div class="dm-ai-path-node ${i === 2 && blocked ? "is-blocked" : ""}"><b>${name}</b><span>${note}</span></div>`,
          )
          .join(
            '<span class="dm-ai-edge" aria-hidden="true">→</span>',
          )}</div><div class="dm-readout">${blocked ? "Confirmed revocation closes the modelled session path. Captured credentials may still require investigation through a separate sign-in path." : uncertain ? "The session branch is unresolved. The graph does not assume that a missing token was absent, valid, or successfully used." : "A captured, unexpired token suggests a possible session-reuse path. It does not prove server acceptance, a completed sign-in, lateral movement or a privileged action."}</div>`;
      const citations = [
        values.credential < 0
          ? "[E1] Credential exposure not assessed."
          : `[E1] ${values.credential === 0 ? "No credential in the supplied sample record" : values.credential === 1 ? "Weak/reused credential reported in the sample" : "Unique credential reported exposed in the sample"}.`,
        values.session < 0
          ? "[E2] Session evidence withheld."
          : `[E2] ${blocked ? "Session revocation confirmed or no token supplied" : "Captured token has a future recorded expiry; acceptance is unverified"}.`,
        values.asset < 0
          ? "[E3] Account impact is unmapped."
          : `[E3] ${values.asset === 1 ? "Privileged administration" : values.asset === 0.65 ? "Sensitive business application" : "Standard application"} classification supplied.`,
        values.ageUnknown
          ? "[E4] Detection time is missing."
          : `[E4] Evidence age supplied: ${values.age} days.`,
      ];
      body.querySelector("[data-risk-brief]").innerHTML =
        `<div class="dm-ai-brief"><div><span class="dm-ai-brief-label">Observed evidence</span>${citations.map((c) => `<div class="dm-ai-evidence">${esc(c)}</div>`).join("")}</div><div><span class="dm-ai-brief-label">Assessment</span><div>${incomplete ? `Abstain from a precise rank. Known evidence supports an illustrative priority range of ${result.min}–${result.max}; ${4 - result.known} input${result.known === 3 ? " is" : "s are"} missing.` : `${result.band}: ${result.min}/100 under the stated rule. This is a review order, not a claim that an attack succeeded.`}</div></div><div><span class="dm-ai-brief-label">Hypothesis, not observation</span><div>${blocked ? "A credential-based sign-in path may remain; the sample does not establish MFA state or successful authentication." : "Session reuse could connect browser theft to application access, conditional on service acceptance and account permissions [E2, E3]."}</div></div><div><span class="dm-ai-brief-label">Next verification</span><div>${incomplete ? "Complete the unknown fields and verify their provenance before issuing a precise assessment." : "Check the source device and authorised sign-in telemetry. Review affected credentials and confirm session revocation through the service owner."} A person approves response actions.</div></div></div>`;
    };
    body.addEventListener("input", (ev) => {
      if (ev.target.matches("[data-risk-input]")) update();
    });
    body.addEventListener("change", (ev) => {
      if (ev.target.matches("[data-risk-input]")) update();
    });
    body.addEventListener("click", (ev) => {
      const action =
        ev.target.closest("[data-risk-action]")?.dataset.riskAction;
      if (!action) return;
      const field = action === "privilege" ? "asset" : "session";
      body.querySelector(`[data-risk-input="${field}"]`).value =
        action === "unknown" ? "-1" : action === "privilege" ? "0.25" : "0";
      update();
    });
    U.tabs(body.querySelector(".dm-ai-tabs"));
    update();
  };
  const observations = [
    [
      "R1",
      "KS-A",
      "kestrel.example",
      "credential",
      "j.moreau",
      "2026-09-02",
      "2026-09-04",
      "a1",
      "Feed A",
    ],
    [
      "R2",
      "KS-A",
      "kestrel.example",
      "credential",
      "j.moreau",
      "2026-09-02",
      "2026-09-08",
      "a1",
      "Mirror B",
    ],
    [
      "R3",
      "KS-A",
      "kestrel.example",
      "cookie",
      "__Host-session",
      "2026-09-02",
      "2026-09-04",
      "a2",
      "Feed A",
    ],
    [
      "R4",
      "KS-B",
      "kestrel.example",
      "credential",
      "l.haddad",
      "2026-09-05",
      "2026-09-06",
      "b1",
      "Feed A",
    ],
    [
      "R5",
      "KS-B",
      "kestrel.example",
      "credential",
      "l.haddad",
      "2026-09-05",
      "2026-09-09",
      "b1",
      "Mirror B",
    ],
    [
      "R6",
      "KS-C",
      "lumen.example",
      "credential",
      "a.chen",
      "2026-09-07",
      "2026-09-10",
      "c1",
      "Feed C",
    ],
    [
      "R7",
      "KS-C",
      "lumen.example",
      "cookie",
      "remember_me",
      "2026-09-07",
      "2026-09-10",
      "c2",
      "Feed C",
    ],
    [
      "R8",
      "KS-A",
      "kestrel.example",
      "application",
      "com.kestrel.mobile",
      null,
      "2026-09-11",
      "a3",
      "Feed A",
    ],
  ];
  const pipeline = (body) => {
    const id = `pipeline-${++instance}`;
    let stage = 0;
    body.innerHTML = `<div class="dm-ai-heading"><span class="bf-badge bf-badge--orange">Sample data</span><span class="bf-dim">Eight observations · inspect every transformation</span></div><div class="dm-ai-pipeline-tabs" role="tablist" aria-label="Evidence processing stages">${["Collect", "Normalize", "Deduplicate", "Correlate", "Aggregate"].map((s, i) => `<button type="button" class="bf-btn" role="tab" id="${id}-tab-${i}" aria-controls="${id}-panel-${i}" aria-selected="${i === 0}"><span>0${i + 1}</span>${s}</button>`).join("")}</div><div class="dm-controls"><label><span class="dm-label">Organisation</span><select class="bf-select" data-pipeline-org><option value="all">All sample organisations</option><option>kestrel.example</option><option>lumen.example</option></select></label><label><span class="dm-label">Timeline basis</span><select class="bf-select" data-pipeline-time><option value="5">Date compromised</option><option value="6">First time recorded</option></select></label><label class="dm-ai-check"><input type="checkbox" data-pipeline-dedup checked />Merge exact duplicates</label></div><div class="dm-ai-pipeline-metrics" role="status"></div>${Array.from({ length: 5 }, (_, i) => `<div class="dm-ai-pipeline-panel" role="tabpanel" id="${id}-panel-${i}" aria-labelledby="${id}-tab-${i}" ${i ? "hidden" : ""}></div>`).join("")}<div class="dm-note">Fictional identifiers and fingerprints. A production pipeline retains the originals, source lineage and parser version; deduplication merges equivalent artefacts without erasing their independent sightings.</div>`;
    const draw = () => {
      const org = body.querySelector("[data-pipeline-org]").value,
        time = Number(body.querySelector("[data-pipeline-time]").value),
        dedup = body.querySelector("[data-pipeline-dedup]").checked;
      const raw = observations.filter((r) => org === "all" || r[2] === org),
        unique = [...new Map(raw.map((r) => [r[7], r])).keys()].map((key) =>
          raw.find((r) => r[7] === key),
        );
      const kept = dedup ? unique : raw,
        devices = new Set(unique.map((r) => r[1])).size,
        accounts = new Set(
          unique
            .filter((r) => r[3] === "credential")
            .map((r) => r[2] + ":" + r[4]),
        ).size;
      body.querySelector(".dm-ai-pipeline-metrics").innerHTML = [
        [raw.length, "observations"],
        [unique.length, "unique artefacts"],
        [devices, "distinct devices"],
        [accounts, "distinct accounts"],
      ]
        .map(([n, t]) => `<div><b>${n}</b><span>${t}</span></div>`)
        .join("");
      const panel = body.querySelector(`#${id}-panel-${stage}`);
      const header = [
        "Source observations",
        "One schema, explicit missingness",
        "Duplicates are sightings, not extra victims",
        "Connect entities without merging people",
        "Counts need a unit and a clock",
      ][stage];
      const descriptions = [
        "Two feeds can deliver the same artefact. Preserve which feed supplied it and when it arrived.",
        "The event time and ingestion time are different fields. R8 has no compromise date; it stays unknown.",
        "The sample uses matching artefact fingerprints. Merge equivalent content, preserve all sources, and avoid counting mirrors as new exposure.",
        "Device, account, application and organisation are separate entity types. Sharing a device does not prove that two accounts belong to one person.",
        "Changing the time basis changes when activity appears. Changing deduplication changes observation counts, not the number of distinct affected accounts.",
      ];
      const rows = stage === 0 ? raw : stage === 2 ? kept : unique;
      let content = "";
      if (stage === 4) {
        const bins = new Map();
        kept.forEach((r) => {
          const date = r[time] || "Unknown";
          bins.set(date, (bins.get(date) || 0) + 1);
        });
        content = `<div class="dm-ai-histogram">${[...bins]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(
            ([date, n]) =>
              `<div><span>${date}</span><div class="dm-ai-bar"><span style="transform:scaleX(${n / Math.max(...bins.values())})"></span></div><b>${n}</b></div>`,
          )
          .join(
            "",
          )}</div><div class="dm-readout">${kept.length} ${dedup ? "unique artefacts" : "retained observations"} grouped by ${time === 5 ? "compromise date" : "first recorded date"}. ${kept.filter((r) => !r[time]).length} have an unknown date and are shown in their own bin. ${dedup ? "Duplicate sightings do not inflate the histogram." : "Duplicate sightings are retained: this chart counts observations, not new devices or victims."}</div>`;
      } else
        content = `<div class="dm-ai-table-wrap"><table class="dm-ai-table"><thead><tr>${["Record / source", "Device / organisation", "Artefact", "Compromised", "Recorded", stage === 2 ? "Fingerprint / sightings" : "Fingerprint"].map((t) => `<th scope="col">${t}</th>`).join("")}</tr></thead><tbody>${rows
          .map(
            (r) =>
              `<tr><td>${r[0]}<small>${
                stage === 2
                  ? raw
                      .filter((x) => x[7] === r[7])
                      .map((x) => x[8])
                      .join(" + ")
                  : r[8]
              }</small></td><td>${r[1]}<small>${r[2]}</small></td><td>${r[3]}<small>${r[4]}</small></td><td>${r[5] || '<span class="bf-orange">Unknown</span>'}</td><td>${r[6]}</td><td>${r[7]}${stage === 2 ? " · " + raw.filter((x) => x[7] === r[7]).length + " sightings" : ""}</td></tr>`,
          )
          .join("")}</tbody></table></div>`;
      panel.innerHTML = `<div class="dm-readout"><b>${header}</b><div>${descriptions[stage]}</div></div>${content}`;
    };
    U.tabs(body.querySelector(".dm-ai-pipeline-tabs"), {
      onChange: (i) => {
        stage = i;
        draw();
      },
    });
    body
      .querySelectorAll("select,input")
      .forEach((el) => el.addEventListener("change", draw));
    draw();
  };
  if (window.BF) {
    BF.demo("risk-assessment", risk);
    BF.demo("evidence-pipeline", pipeline);
  }
  document
    .querySelectorAll("[data-ai-lab]")
    .forEach((root) => U.inView(root, () => risk(root)));
  return { assess };
})();
