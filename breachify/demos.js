/* Nine small, local explanations. All records and keys are fictional. */
(() => {
  const U = BFUI,
    e = U.esc,
    $ = (root, s) => root.querySelector(s);
  const button = (text, attrs = "", primary = false) =>
    `<button type="button" class="bf-btn${primary ? " bf-btn--primary" : ""}" ${attrs}>${text}</button>`;
  const seg = (name, labels) =>
    `<div class="bf-seg" data-seg="${name}" aria-label="${name}">${labels.map((s, i) => `<button type="button" aria-pressed="${i === 0}">${s}</button>`).join("")}</div>`;
  BF.demo("drilldown", (body) => BFRecords.mount(body));
  BF.demo("two-clocks", (body) => {
    const rows = [
      ["KS-3B8T1W6P", "j.moreau", "2026-06-03", 41],
      ["KS-7Q2M9X4D", "l.haddad", "2026-07-01", 3],
      ["KS-9V5N2C8L", "a.chen", "2026-04-20", 96],
      ["KS-6R2X8J4N", "m.rossi", "2026-08-20", 12],
    ].map(([id, name, date, gap]) => ({
      id,
      name,
      date,
      gap,
      added: U.stamp(new Date(Date.parse(date) + gap * 864e5), false),
    }));
    body.innerHTML = `${seg("Sort by", ["Date compromised", "Last time added"])}<div class="dm-clock-scale"><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span></div><div data-rows></div><div class="dm-readout" role="status">Select a record to compare its two dates.</div><div class="dm-note">○ Compromised · ● Recorded. Sorting by added date shows what is new to this collection; sorting by compromise date shows what happened earliest.</div>`;
    const list = $(body, "[data-rows]");
    rows.forEach((r) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "dm-clock-row";
      b.dataset.id = r.id;
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = `<span><b class="bf-mono">${r.id}</b><small>${r.name}@kestrel.example</small></span><span class="dm-clock-axis"><span class="dm-clock-link" style="--start:${((Date.parse(r.date) - Date.parse("2026-04-01")) / 864e5 / 214) * 100}%;--gap:${(r.gap / 214) * 100}%"><span>${r.gap} days later</span></span></span>`;
      const select = () => {
        list
          .querySelectorAll("button")
          .forEach((el) => el.setAttribute("aria-pressed", String(el === b)));
        $(body, "[role=status]").textContent =
          `Compromised ${r.date} · recorded ${r.added} · a ${r.gap}-day gap before this collection received the evidence.`;
      };
      b.addEventListener("click", select);
      b.addEventListener("focus", select);
      b.addEventListener("pointerenter", select);
      list.append(b);
    });
    U.seg($(body, ".bf-seg"), {
      onChange: (i) => {
        const old = new Map(
          [...list.children].map((el) => [el, el.getBoundingClientRect().top]),
        );
        [...rows]
          .sort((a, b) =>
            a[i ? "added" : "date"].localeCompare(b[i ? "added" : "date"]),
          )
          .forEach((r) =>
            list.append(list.querySelector(`[data-id="${r.id}"]`)),
          );
        if (!U.reduceMotion && body.matches(":has(:focus-visible)") === false)
          [...list.children].forEach((el) =>
            el.animate?.(
              [
                {
                  transform: `translateY(${old.get(el) - el.getBoundingClientRect().top}px)`,
                },
                { transform: "translateY(0)" },
              ],
              { duration: 260, easing: "cubic-bezier(.22,1,.36,1)" },
            ),
          );
      },
    });
  });
  BF.demo("cookie-life", (body) => {
    const cookies = [
      ["__Host-session", "mail", 14, "days"],
      ["remember_me", "portal", 365, "days"],
      ["sso_token", "sso", 8, "hours"],
    ];
    let choice = 0,
      revoked = null;
    body.innerHTML = `${seg(
      "Cookie",
      cookies.map((c) => c[0]),
    )}<div class="dm-readout"><span data-domain class="bf-mono"></span><b class="dm-large" data-state></b><span role="status" data-status></span></div><label class="dm-label" for="cookie-now">Move today relative to the theft</label><input class="dm-range" id="cookie-now" type="range" min="-2" max="20" value="5" /><div class="dm-controls"><span data-scale class="bf-dim"></span>${button("Revoke all sessions", "data-revoke", true)}</div><div class="dm-note">Simplified simulation: a future expiry is not proof that a service will accept the token. Revocation is enforced by the service.</div>`;
    const range = $(body, "input"),
      update = () => {
        const [name, domain, life, unit] = cookies[choice],
          now = Number(range.value);
        const isRevoked = revoked !== null && now >= revoked;
        $(body, "[data-domain]").textContent =
          `${domain}.kestrel.example · ${name}`;
        $(body, "[data-state]").textContent =
          now < 0
            ? "NOT STOLEN YET"
            : isRevoked
              ? "REVOKED"
              : now >= life
                ? "EXPIRED"
                : "UNEXPIRED";
        $(body, "[data-state]").style.color =
          `var(--bf-${now < 0 ? "dim" : isRevoked || now >= life ? "red" : "green"})`;
        $(body, "[data-status]").textContent =
          now < 0
            ? `The theft occurs in ${-now} ${unit}.`
            : isRevoked
              ? `Revoked at ${revoked} ${unit}. The server no longer accepts this session.`
              : now >= life
                ? `Expired ${now - life} ${unit} ago.`
                : `${life - now} ${unit} until recorded expiry. The model assumes acceptance until expiry or revocation.`;
        $(body, "[data-scale]").textContent =
          `Now: ${now} ${unit} after theft · expiry: ${life} ${unit}`;
        $(body, "[data-revoke]").disabled =
          revoked !== null || now < 0 || now >= life;
      };
    U.seg($(body, ".bf-seg"), {
      onChange: (i) => {
        choice = i;
        revoked = null;
        range.max = Math.ceil(cookies[i][2] * 1.4);
        range.value = Math.round(cookies[i][2] * 0.35);
        update();
      },
    });
    range.addEventListener("input", update);
    $(body, "[data-revoke]").addEventListener("click", () => {
      revoked = Number(range.value);
      update();
    });
    update();
  });
  BF.demo("android-origin", (body) => {
    const apps = [
      "com.kestrel.mobile",
      "com.lumen.health",
      "com.orbit.freight",
    ];
    let app = 0,
      part = 0;
    const descriptions = [
      "The android:// scheme identifies a saved Android application credential rather than a website address.",
      "The signing-certificate fingerprint identifies the signing identity. A matching display name alone does not establish that identity.",
      "The package name identifies the application, such as the identifier in its store listing.",
    ];
    body.innerHTML =
      '<div class="bf-dim">Saved app credential · sample data</div><div class="dm-origin"></div><div class="dm-readout" role="status"></div><div>j.moreau@mail.example · •••••••• <span class="bf-badge bf-badge--weak">Weak</span></div><div class="dm-controls" style="margin-top:20px">' +
      button("Another example", "data-next") +
      "</div>";
    const render = () => {
      const hash =
        U.rng(app + 17).chars(
          43,
          "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_",
        ) + "=";
      $(body, ".dm-origin").innerHTML = [
        "android://",
        hash,
        "@" + apps[app] + "/",
      ]
        .map(
          (t, i) =>
            `<button type="button" class="bf-mono" data-part="${i}" aria-pressed="${i === part}">${t}</button>`,
        )
        .join("");
      $(body, "[role=status]").textContent = descriptions[part];
    };
    const select = (b) => {
      if (!b) return;
      part = Number(b.dataset.part);
      $(body, ".dm-origin")
        .querySelectorAll("button")
        .forEach((el) => el.setAttribute("aria-pressed", String(el === b)));
      $(body, "[role=status]").textContent = descriptions[part];
    };
    ["click", "focusin", "pointerover"].forEach((event) =>
      $(body, ".dm-origin").addEventListener(event, (ev) =>
        select(ev.target.closest("[data-part]")),
      ),
    );
    $(body, "[data-next]").addEventListener("click", () => {
      app = (app + 1) % apps.length;
      render();
    });
    render();
  });
  BF.demo("log-anatomy", (body) => {
    const codes = [200, 302, 304, 403, 201, 404, 401, 500],
      paths = [
        "/index.html",
        "/login",
        "/images/logo.png",
        "/private",
        "/api/items",
        "/missing",
        "/api/login",
        "/api/report",
      ];
    let filter = 0,
      query = "",
      selected = 0;
    const labels = [
      "Client address",
      "Timestamp",
      "Request",
      "Status",
      "Bytes",
      "Referrer",
      "User agent",
    ];
    const descriptions = [
      "The source IP recorded by this server. Proxies can affect what it represents.",
      "The time and UTC offset recorded for the request.",
      "The HTTP method, requested path and protocol version.",
      "The HTTP response status. It describes a response, not the cause of an incident.",
      "The response-body byte count recorded by the server.",
      "The referring page supplied with the request; it may be absent or untrusted.",
      "A client-supplied software identifier, which can be changed or imitated.",
    ];
    const rows = codes.map((c, i) => [
      `${["192.0.2", "198.51.100", "203.0.113"][i % 3]}.${20 + i}`,
      `[25/Sep/2026:10:15:${32 + i} +0000]`,
      `"${[1, 4, 6].includes(i) ? "POST" : "GET"} ${paths[i]} HTTP/1.1"`,
      String(c),
      String(i * 327),
      '"https://kestrel.example/"',
      `"${i === 3 ? "python-requests/2.32" : i === 4 ? "PostmanRuntime/7.0" : "Mozilla/5.0"}"`,
    ]);
    const raw = (r) => `${r[0]} - - ${r.slice(1).join(" ")}`;
    body.innerHTML = `<div class="dm-controls">${seg("Response class", ["All", "2xx", "3xx", "4xx", "5xx"])}<label class="bf-sr" for="log-search">Search raw logs</label><input id="log-search" class="bf-input" placeholder="Find a path or user agent" />${button("Copy visible", "data-copy")}</div><div class="dm-log-lines"></div><div class="dm-readout" role="status"></div><span class="bf-dim" data-count></span>`;
    const visible = () =>
      rows.filter(
        (r) =>
          (!filter || r[3].startsWith(String(filter + 1))) &&
          raw(r).toLowerCase().includes(query),
      );
    const explain = () => {
      $(body, "[role=status]").textContent =
        `${labels[selected]}: ${descriptions[selected]}`;
    };
    const render = () => {
      const result = visible();
      $(body, ".dm-log-lines").innerHTML = result.length
        ? result
            .map(
              (r) =>
                `<div class="dm-log-line">${r.map((s, i) => `<button type="button" data-field="${i}" aria-label="${labels[i]}: ${e(s)}" aria-pressed="${i === selected}">${e(s)}</button>`).join(" ")}</div>`,
            )
            .join("")
        : '<div class="bf-empty">No matching log lines.</div>';
      $(body, "[data-count]").textContent =
        `${result.length} of 8 lines · fictional HTTP access logs`;
      explain();
    };
    U.seg($(body, ".bf-seg"), {
      onChange: (i) => {
        filter = i;
        render();
      },
    });
    $(body, "input").addEventListener("input", (ev) => {
      query = ev.target.value.toLowerCase();
      render();
    });
    const select = (ev) => {
      const b = ev.target.closest("[data-field]");
      if (!b) return;
      selected = Number(b.dataset.field);
      $(body, ".dm-log-lines")
        .querySelectorAll("button")
        .forEach((el) =>
          el.setAttribute(
            "aria-pressed",
            String(Number(el.dataset.field) === selected),
          ),
        );
      explain();
    };
    ["click", "focusin"].forEach((event) =>
      $(body, ".dm-log-lines").addEventListener(event, select),
    );
    $(body, "[data-copy]").addEventListener("click", async (ev) => {
      const ok = await U.copy(visible().map(raw).join("\n"));
      ev.target.textContent = ok ? "Copied visible lines" : "Copy unavailable";
    });
    render();
  });
  BF.demo("export", (body, ctx) => {
    let range = 0,
      type = 0,
      busy = false,
      remaining = 168,
      done = false;
    const counts = [12480, 96215, 1284903],
      estimates = ["about 2 minutes", "about 25 minutes", "over an hour"];
    body.innerHTML = `<div class="dm-steps">${["Request", "Prepare", "Notify", "Download"].map((t, i) => `<span data-step="${i}" class="${i === 0 ? "is-active" : ""}">0${i + 1} · ${t}</span>`).join("")}</div><div data-request><div class="dm-controls">${seg("Period", ["Last 7 days", "Last 90 days", "All time"])}${seg("Evidence", ["Credentials", "Cookies"])}</div><div class="dm-readout" role="status" data-estimate></div>${button("Request export", "data-request-button", true)}</div><div data-progress hidden><span role="status" data-preparing>Preparing your sample export…</span><div class="dm-progress"><span></span></div><span class="bf-dim">Simulated preparation · shorter periods finish sooner</span></div><div data-ready hidden></div>`;
    const estimate = () => {
      $(body, "[data-estimate]").innerHTML =
        `<b class="dm-large">${U.fmt(Math.min(300000, counts[range]))}${range === 2 ? " of " + U.fmt(counts[range]) : ""}</b>results · ${estimates[range]}${range === 2 ? '<div class="bf-orange">Exports stop at 300,000 results. Narrow the period, or use the API for the rest.</div>' : ""}`;
    };
    U.seg($(body, "[data-seg=Period]"), {
      onChange: (i) => {
        range = i;
        estimate();
      },
    });
    U.seg($(body, "[data-seg=Evidence]"), { onChange: (i) => (type = i) });
    const step = (n) =>
      body
        .querySelectorAll("[data-step]")
        .forEach((el) =>
          el.classList.toggle("is-active", Number(el.dataset.step) <= n),
        );
    $(body, "[data-request-button]").addEventListener("click", () => {
      if (busy) return;
      busy = true;
      const label = type ? "cookies" : "credentials";
      $(body, "[data-request]").hidden = true;
      $(body, "[data-progress]").hidden = false;
      step(1);
      const start = performance.now();
      const tick = () => {
        const progress = U.reduceMotion
          ? 1
          : Math.min(1, (performance.now() - start) / 2800);
        $(body, ".dm-progress span").style.setProperty("--progress", progress);
        $(body, "[data-preparing]").textContent =
          `${U.fmt(Math.min(300000, counts[range]) * progress)} records prepared · simulated ${Math.round([2, 25, 72][range] * progress)} min`;
        if (progress < 1) {
          ctx.later(tick, 60);
          return;
        }
        step(3);
        $(body, "[data-progress]").hidden = true;
        const ready = $(body, "[data-ready]");
        ready.hidden = false;
        ready.innerHTML = `<div class="dm-readout" role="status">${U.icon("mail")}<b> Your export is ready</b><div>Simulated email from Breachify: kestrel.example ${label}, ${U.fmt(Math.min(counts[range], 300000))} results. Available in your account for 7 days. No email is sent.</div></div><div class="bf-banner"><div><b>Your Zip Files</b><div class="bf-mono">20261014_kestrel.example_${label}.zip</div><span data-expiry>Expires in 7 days</span></div></div><div class="dm-controls" style="margin-top:16px">${button("Download sample CSV", "data-download", true)}<span class="bf-dim">5 fictional rows · CSV preview of the archive</span></div>`;
        const download = $(body, "[data-download]");
        download.focus({ preventScroll: true });
        download.addEventListener("click", () => {
          if (remaining <= 0) return;
          const rows = [
            ["domain", "record", "type"],
            ...Array.from({ length: 5 }, (_, i) => [
              "kestrel.example",
              `sample-${i + 1}`,
              label,
            ]),
          ];
          U.download(
            "kestrel.example-sample-export.csv",
            "# Sample data from the Breachify case study\n" + U.csv(rows),
          );
          done = true;
          download.textContent = "Downloaded · download again";
        });
        ctx.every(() => {
          remaining = Math.max(0, remaining - 1);
          $(body, "[data-expiry]").textContent = remaining
            ? `Expires in ${Math.floor(remaining / 24)} d ${remaining % 24} h · simulated clock, 1 hour per second`
            : "Expired · request a new export";
          if (!remaining) {
            download.disabled = true;
            download.textContent = done
              ? "Downloaded · now expired"
              : "Expired";
          }
        }, 1000);
      };
      tick();
    });
    estimate();
  });
  BF.demo("admin-map", (body) => {
    const nodes = [
      [
        "Groups",
        "groups",
        "People, plan and channel assignments.",
        "Owner · members · plan · status",
        "Plans → Groups: each group is assigned a plan.",
      ],
      [
        "Plans",
        "plans",
        "Capabilities and limits.",
        "Searches · export limit · members",
        "Pricing tiers → Plans: a tier prices a plan for a billing period.",
      ],
      [
        "Pricing tiers",
        "tiers",
        "Price and billing period for a plan.",
        "Amount · currency · interval · status",
        "Paid plans → Pricing tiers: a subscription takes its commercial terms from a tier.",
      ],
      [
        "Paid plans",
        "paid",
        "A group’s actual subscription.",
        "Group · tier · agreed price · next payment",
        "Paid plans → Groups: the subscription belongs to a customer group.",
      ],
      [
        "Channels",
        "channels",
        "Incoming information owned by a group.",
        "Group · type · last received · status",
        "Channels → Groups: each channel belongs to a group.",
      ],
      [
        "Files",
        "files",
        "Material received through a channel.",
        "Channel · size · retention · state",
        "Files → Channels: files inherit the channel group’s access.",
      ],
      [
        "Passkeys",
        "passkeys",
        "Bounded access to one file.",
        "File · expiry · allowance · downloads",
        "Passkeys → Files: one key unlocks one file for a limited time and number of downloads.",
      ],
    ];
    body.innerHTML = `<div class="dm-map" aria-label="Administration relationships">${nodes.map((n, i) => `<button type="button" data-node="${i}" aria-pressed="${i === 0}">${n[0]}<span>${n[2]}</span></button>`).join("")}</div><div class="dm-readout dm-map-detail"><div role="status"></div><img width="560" height="416" loading="lazy" alt="" /></div>`;
    const select = (i) => {
      const n = nodes[i];
      body
        .querySelectorAll("[data-node]")
        .forEach((b) =>
          b.setAttribute("aria-pressed", String(Number(b.dataset.node) === i)),
        );
      $(body, "[role=status]").innerHTML =
        `<b class="dm-large">${n[0]}</b>${n[2]}<div class="dm-note">${n[3]}</div><div class="bf-orange" style="margin-top:16px">${n[4]}</div>`;
      $(body, "img").src = `../assets/peek/bf-admin-${n[1]}.webp`;
      $(body, "img").alt = `Original ${n[0]} design with placeholder data`;
    };
    ["click", "focusin", "pointerover"].forEach((event) =>
      $(body, ".dm-map").addEventListener(event, (ev) => {
        const b = ev.target.closest("[data-node]");
        if (b) select(Number(b.dataset.node));
      }),
    );
    select(0);
  });
  BF.demo("tier-change", (body) => {
    let price = 199,
      archived = false;
    body.innerHTML = `<span class="bf-dim">Professional Monthly · USD · exclusive of tax</span><label class="dm-label" for="tier-price">Price for new purchases</label><b class="dm-large" data-price></b><input class="dm-range" id="tier-price" type="range" min="99" max="399" step="10" value="199" />${U.switchHTML(false, "Archive tier", "data-archive")}${["Atlas Security", "Northstar Research", "Acme Response"].map((name, i) => `<div class="dm-tier-row"><span>${name}</span><b>$199.00</b><span class="bf-dim">${U.icon("lock")} Agreed price</span><span class="bf-badge bf-badge--${i === 2 ? "warn" : "ok"}">${i === 2 ? "Past due" : "Active"}</span></div>`).join("")}<div class="dm-tier-row bf-orange"><span>New purchase</span><b data-new></b></div><div class="dm-readout" role="status"></div><div class="dm-note">Existing paid plans keep their agreed price when a tier changes. Archiving a tier prevents new purchases without ending current subscriptions.</div>`;
    const update = () => {
      $(body, "[data-price]").textContent = `$${price}.00 / month`;
      $(body, "[data-new]").textContent = archived
        ? "Not available · tier archived"
        : `$${price}.00`;
      $(body, "[role=status]").textContent = archived
        ? "Archived: no new purchases. The 3 current subscriptions keep their existing price and state."
        : `3 paid plans keep $199.00 · new purchases pay $${price}.00`;
    };
    $(body, "input").addEventListener("input", (ev) => {
      price = Number(ev.target.value);
      update();
    });
    U.toggle($(body, "[data-archive]"), (on) => {
      archived = on;
      update();
    });
    update();
  });
  let keyCounter = 0;
  BF.demo("passkey", (body, ctx) => {
    const files = [
      "kestrel_domain_users_2026-10-01.zip",
      "atlas_research_2026-09-30.csv",
      "northstar_report_september.pdf",
    ];
    let revealed = null,
      seconds = 0;
    const rows = [
      {
        id: "PK_ATL_4F2A",
        file: files[1],
        expiry: "2026-10-21",
        used: 2,
        limit: 5,
        status: "Active",
      },
      {
        id: "PK_NOR_8J3M",
        file: files[2],
        expiry: "2026-10-10",
        used: 1,
        limit: 1,
        status: "Expired",
      },
    ];
    body.innerHTML = `<div class="dm-key-form"><label><span class="dm-label">File</span><select class="bf-select" data-file>${files.map((f) => `<option>${f}</option>`).join("")}</select></label><label><span class="dm-label">Expires after</span><select class="bf-select" data-days><option value="1">1 day</option><option value="7" selected>7 days</option><option value="30">30 days</option></select></label><label><span class="dm-label">Download limit</span><select class="bf-select" data-limit><option>1</option><option>5</option><option selected>10</option></select></label></div><div class="dm-controls" style="margin-top:16px">${button("Generate key", "data-generate", true)}<span class="bf-dim">Simulation as of 2026-10-14</span></div><div data-reveal-key hidden></div><div data-keys></div><div class="dm-readout" role="status" data-summary></div><div class="bf-toasts"></div>`;
    const table = () => {
      const focus = document.activeElement?.dataset.actionkey;
      $(body, "[data-keys]").innerHTML = rows
        .map(
          (r, i) =>
            `<div class="dm-key-row"><span><b class="bf-mono">${r.id} ••••</b><span class="dm-note" style="display:block;margin-top:5px">${r.file}<br>Expires ${r.expiry}</span></span><span>${r.used} / ${r.limit}</span><span class="bf-badge bf-badge--${r.status === "Active" ? "ok" : r.status === "Expired" ? "warn" : "bad"}">${r.status}</span>${button("Simulate download", `data-download-key="${i}" data-actionkey="download-${i}" ${r.status !== "Active" ? "disabled" : ""}`)}${button("Revoke", `data-revoke-key="${i}" data-actionkey="revoke-${i}" ${r.status !== "Active" ? "disabled" : ""}`)}</div>`,
        )
        .join("");
      $(body, "[data-summary]").textContent = ["Active", "Expired", "Revoked"]
        .map(
          (s) =>
            `${rows.filter((r) => r.status === s).length} ${s.toLowerCase()}`,
        )
        .join(" · ");
      if (focus) {
        const next = $(body, `[data-actionkey="${focus}"]`);
        (next && !next.disabled ? next : $(body, "[data-generate]")).focus({
          preventScroll: true,
        });
      }
    };
    const mask = () => {
      if (!revealed) return;
      const hadFocus = $(body, "[data-reveal-key]").contains(
        document.activeElement,
      );
      rows.push(revealed.record);
      revealed = null;
      $(body, "[data-reveal-key]").hidden = true;
      $(body, "[data-reveal-key]").replaceChildren();
      $(body, "[data-generate]").disabled = false;
      table();
      if (hadFocus) $(body, "[data-generate]").focus({ preventScroll: true });
    };
    $(body, "[data-generate]").addEventListener("click", () => {
      const gen = $(body, "[data-generate]");
      gen.disabled = true;
      gen.classList.add("is-busy");
      const file = $(body, "[data-file]").value,
        days = Number($(body, "[data-days]").value),
        limit = Number($(body, "[data-limit]").value);
      ctx.later(
        () => {
          const r = U.rng(++keyCounter + 71),
            id = "PK_KES_" + r.chars(4);
          revealed = {
            full: id + "-" + r.chars(4) + "-" + r.chars(4) + "-" + r.chars(4),
            record: {
              id,
              file,
              expiry: U.stamp(new Date(Date.UTC(2026, 9, 14 + days)), false),
              used: 0,
              limit,
              status: "Active",
            },
          };
          seconds = 20;
          gen.classList.remove("is-busy");
          const box = $(body, "[data-reveal-key]");
          box.hidden = false;
          box.className = "dm-key-reveal";
          box.innerHTML = `<span>Shown once. Store it securely. Fictional demonstration key.</span><b>${revealed.full}</b><div class="dm-controls">${button("Copy", "data-copy-key")}${button("I’ve stored it", "data-stored", true)}<span role="status" data-seconds>Masks in 20 seconds</span></div>`;
          $(body, "[data-stored]").focus({ preventScroll: true });
          $(body, "[data-stored]").addEventListener("click", mask);
          $(body, "[data-copy-key]").addEventListener("click", async (ev) => {
            if (!revealed) return;
            const ok = await U.copy(revealed.full);
            if (ctx.alive())
              ev.target.textContent = ok ? "Copied" : "Copy unavailable";
          });
          const revealSession = revealed;
          const countdown = () => {
            if (!revealed || revealed !== revealSession) return;
            seconds--;
            if (seconds <= 0) {
              mask();
              return;
            }
            $(body, "[data-seconds]").textContent =
              `Masks in ${seconds} seconds`;
            ctx.later(countdown, 1000);
          };
          ctx.later(countdown, 1000);
        },
        U.reduceMotion ? 0 : 350,
      );
    });
    $(body, "[data-keys]").addEventListener("click", (ev) => {
      const b = ev.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-download-key")) {
        const r = rows[Number(b.dataset.downloadKey)];
        if (r.status !== "Active") return;
        r.used++;
        if (r.used >= r.limit) r.status = "Expired";
        table();
      }
      if (b.hasAttribute("data-revoke-key")) {
        const r = rows[Number(b.dataset.revokeKey)];
        if (r.status !== "Active") return;
        r.status = "Revoked";
        table();
        U.toast($(body, ".bf-toasts"), {
          title: "Revoked. Further downloads are blocked immediately.",
        });
      }
    });
    table();
  });
})();
