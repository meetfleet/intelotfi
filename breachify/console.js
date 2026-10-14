/* A local miniature, never a lookup service. No network or persistence. */
(() => {
  const container = document.querySelector("[data-console]");
  if (!container) return;
  const U = BFUI,
    e = U.esc;
  let generation = 0;
  U.inView(container, () => {
    const app = container.querySelector(".console__app"),
      completed = new Set();
    let query = "kestrel.example",
      tab = 0,
      page = 1,
      busy = false,
      assetUsers = false;
    const cache = new Map();
    const tabs = [
      "Overview",
      "Compromised Employees",
      "Third Party Credentials",
      "Compromised Users",
      "External Domains",
      "Assets Discovery",
    ];
    const icons = [
      "bars",
      "user",
      "thirdParty",
      "users",
      "external",
      "fileSearch",
    ];
    const destinations = [
      ["Analytics", "grid", "outside-in.html#analytics"],
      ["Domains", "globe", ""],
      ["APK", "smartphone", "beyond-the-password.html#android"],
      ["Cookies", "cookie", "beyond-the-password.html#sessions"],
      ["Companies", "building", "machinery.html#companies"],
      ["Sensitive Applications", "app", "beyond-the-password.html#apps"],
      ["Admin", "admin", "machinery.html#admin"],
      ["Documents", "file", null],
      ["Settings", "settings", "machinery.html#settings"],
    ];
    app.innerHTML = `<div class="con-top"><span class="con-brand">${U.logo()}breachify</span><span class="bf-badge bf-badge--orange">Sample data</span><span class="con-avatar" aria-label="Fictional analyst">JM</span></div><div class="con-layout"><nav class="con-sidebar" aria-label="Product destinations">${destinations.map(([name, ico], i) => `<button type="button" data-nav="${i}" aria-label="${name}" ${i === 1 ? 'aria-current="page"' : ""}>${U.icon(ico)}<span>${name}</span></button>`).join("")}</nav><div class="con-main" tabindex="-1"></div></div><div class="bf-toasts con-toasts"></div>`;
    const main = app.querySelector(".con-main"),
      toasts = app.querySelector(".con-toasts");
    const finish = (step) => {
      completed.add(step);
      document
        .querySelector(`[data-quest] [data-step="${step}"]`)
        ?.classList.add("is-done");
      const count = document.querySelector("[data-quest-count]");
      if (count) count.textContent = `${completed.size} / 6`;
      document
        .querySelector("[data-quest]")
        ?.classList.toggle("is-complete", completed.size === 6);
    };
    const button = (text, attrs = "", primary = false) =>
      `<button type="button" class="bf-btn${primary ? " bf-btn--primary" : ""}" ${attrs}>${text}</button>`;
    const normalize = (s) => s.trim().toLowerCase();
    const allowed = (s) =>
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:example|test)$/.test(s) ||
      ["com.kestrel.mobile", "com.lumen.health", "com.orbit.freight"].includes(
        s,
      );
    const domain = () =>
      query.startsWith("com.") ? query.split(".")[1] + ".example" : query;
    const counts = () =>
      query === "kestrel.example"
        ? [1104, 188, 42, 916, 5, 436]
        : (() => {
            const r = U.rng(query),
              emp = r.int(50, 300),
              users = r.int(300, 1200);
            return [emp + users, emp, r.int(10, 80), users, 5, r.int(150, 600)];
          })();
    const devices = () => {
      const k = `${query}:${page}`;
      if (!cache.has(k))
        cache.set(
          k,
          BFRecords.make(
            domain(),
            Math.min(6, counts()[1] - (page - 1) * 6),
            page,
          ),
        );
      return cache.get(k);
    };
    function searchView(focus = false) {
      main.removeAttribute("aria-busy");
      generation++;
      busy = false;
      main.innerHTML = `<div class="con-heading">${U.icon("chevronLeft")} Search</div><form class="con-search"><label class="bf-sr" for="console-query">Search a sample domain or Android app</label><div class="con-searchfield">${U.icon("search")}<input class="bf-input" id="console-query" aria-describedby="console-message" name="query" value="${e(query)}" placeholder="Search a domain or an app" autocomplete="off" spellcheck="false" /></div><button class="bf-btn bf-btn--primary" type="submit">Search ${U.icon("arrowRight")}</button></form><div class="con-message" id="console-message" role="status"></div><div class="con-stat">${U.icon("users")}<span>Compromised domain users</span><b>1,898,596</b><span class="bf-dim">sample count</span></div><div class="con-history"><span>Search History</span><div class="bf-chips">${["kestrel.example", "lumen.example", "com.kestrel.mobile", "orbit.example"].map((q) => `<button type="button" class="bf-chip" data-query="${q}">${q}</button>`).join("")}</div></div><div class="con-empty-art" aria-hidden="true">${U.icon("shield")}<span>Start with a domain.<br>Follow the evidence.</span><div class="con-grid"></div></div>`;
      main.querySelector("form").addEventListener("submit", (ev) => {
        ev.preventDefault();
        search(main.querySelector("input").value);
      });
      if (focus) main.querySelector("input").focus({ preventScroll: true });
    }
    function search(value) {
      if (busy) return;
      const q = normalize(value);
      const message = main.querySelector(".con-message");
      if (!q) {
        message.textContent = "Enter a sample domain to start.";
        main.querySelector("input").focus();
        return;
      }
      if (!allowed(q)) {
        message.textContent =
          "This miniature only knows sample companies. Try kestrel.example, lumen.example or orbit.example.";
        main.querySelector("input").setAttribute("aria-invalid", "true");
        return;
      }
      query = q;
      page = 1;
      tab = 0;
      busy = true;
      const id = ++generation;
      const submit = main.querySelector("[type=submit]");
      submit.disabled = true;
      submit.classList.add("is-busy");
      message.textContent = "Searching fictional records…";
      main.setAttribute("aria-busy", "true");
      setTimeout(
        () => {
          if (id !== generation) return;
          busy = false;
          main.removeAttribute("aria-busy");
          results();
          finish("search");
          main.querySelector("[role=tab]")?.focus({ preventScroll: true });
        },
        U.reduceMotion ? 0 : 550,
      );
    }
    function results() {
      const c = counts();
      main.innerHTML = `<div class="con-results-heading">${button(U.icon("chevronLeft") + " Search", "data-back")}<span>Search results for: <b>${e(query)}</b></span></div><div class="bf-tabs con-tabs" role="tablist" aria-label="Domain investigation">${tabs.map((t, i) => `<button type="button" class="bf-tab" role="tab" id="con-tab-${i}" aria-selected="${i === tab}" aria-controls="con-panel-${i}">${U.icon(icons[i])}${t}<span class="bf-tab__n">${U.fmt(c[i])}</span></button>`).join("")}</div>${tabs.map((t, i) => `<div id="con-panel-${i}" class="con-panel" role="tabpanel" aria-labelledby="con-tab-${i}" ${i !== tab ? "hidden" : ""}></div>`).join("")}`;
      U.tabs(main.querySelector(".con-tabs"), {
        onChange: (i) => {
          tab = i;
          draw();
          if (i === 1) finish("employees");
        },
      });
      draw();
    }
    const active = () => main.querySelector(`#con-panel-${tab}`);
    const exportRows = (kind, rows) => {
      const filename = `${domain()}-${kind}.csv`;
      const csv =
        "# Sample data from the Breachify case study (intelotfi.com/breachify). Fictional.\n" +
        U.csv(rows);
      U.toast(toasts, {
        title: "Preparing a sample export",
        body: "Large exports can take over an hour. This miniature prepares only its visible fictional rows.",
        timeout: 1800,
      });
      setTimeout(
        () => {
          finish("export");
          U.toast(toasts, {
            title: "Export ready · simulated email notification",
            body: "No email was sent. Download your sample CSV here.",
            action: "Download",
            timeout: 0,
            onAction: () => U.download(filename, csv),
          });
        },
        U.reduceMotion ? 0 : 1800,
      );
    };
    const exportDevices = (kind, rs) =>
      exportRows(
        kind,
        kind === "cookies"
          ? [
              ["device", "domain", "cookie_name", "value", "expiry"],
              ...rs.map((r) => [
                r.id,
                "mail." + domain(),
                "__Host-session",
                "eyJh••••••Qz",
                "2026-11-30",
              ]),
            ]
          : [
              ["device", "family", "ip", "compromised", "login", "password"],
              ...rs.map((r) => [
                r.id,
                r.family,
                r.ip,
                r.date,
                r.login,
                "masked",
              ]),
            ],
      );
    function overview() {
      const c = counts(),
        r = U.rng(query),
        points = Array.from({ length: 9 }, () => r.int(15, 95));
      const path = points
        .map((v, i) => `${i ? "L" : "M"}${i * 60},${120 - v}`)
        .join(" ");
      return `<div class="con-overview"><div class="con-card con-chart"><div class="con-card-head"><b>Compromised computers timeline</b><span class="bf-dim">2026 · sample</span></div><svg viewBox="0 0 480 140" role="img" aria-label="Illustrative monthly compromised computer counts"><defs><linearGradient id="con-fill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#c25a20" stop-opacity=".5"/><stop offset="1" stop-color="#c25a20" stop-opacity="0"/></linearGradient></defs><path d="${path} L480,140 L0,140 Z" fill="url(#con-fill)"/><path d="${path}" fill="none" stroke="#d8692b" stroke-width="2"/></svg><div class="con-months">${points.map((v, i) => `<button type="button" data-month="${i}" data-value="${v * 7}">${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"][i]}</button>`).join("")}</div><span class="bf-dim" data-chart-readout role="status">Select a month to inspect the sample.</span></div><div class="con-card"><div class="con-card-head"><b>Password strength</b><span class="bf-dim">Sample distribution</span></div><div class="con-strength">${[
        ["Too weak", 24, "red"],
        ["Weak", 38, "yellow"],
        ["Medium", 26, "blue"],
        ["Strong", 12, "green"],
      ]
        .map(
          ([s, v, color]) =>
            `<div><b>${v}%</b><span style="--bar:${v / 40};--color:var(--bf-${color})"></span><small>${s}</small></div>`,
        )
        .join(
          "",
        )}</div></div><div class="con-card"><div class="con-card-head"><b>Stealer families</b></div><div class="con-family"><div class="con-donut" role="img" aria-label="Lumma 48%, RedLine 32%, Vidar 20%"></div><div><span>48% · Lumma</span><span>32% · RedLine</span><span>20% · Vidar</span></div></div></div><div class="con-card"><div class="con-card-head"><b>Antivirus coverage</b></div>${[
        ["Premium", 12],
        ["Free", 53],
        ["None", 35],
      ]
        .map(
          ([n, v]) =>
            `<div class="con-meter-label"><span>${n}</span><b>${v}%</b></div><div class="con-meter"><span style="transform:scaleX(${v / 100})"></span></div>`,
        )
        .join(
          "",
        )}</div><div class="con-card con-populations"><div><span class="bf-dim">Compromised employees</span><b>${U.fmt(c[1])}</b></div><div><span class="bf-dim">Compromised users</span><b>${U.fmt(c[3])}</b></div><span class="bf-dim">Different populations. Different response owners.</span></div></div>`;
    }
    function draw() {
      const panel = active();
      if (!panel) return;
      if (tab === 0) {
        panel.innerHTML = overview();
        return;
      }
      if (tab === 1) {
        panel.innerHTML =
          '<div data-records></div><div class="con-pagination"></div>';
        BFRecords.mount(panel.querySelector("[data-records]"), {
          query: domain(),
          records: devices(),
          onStep: finish,
          onExport: exportDevices,
        });
        const total = counts()[1],
          pages = Math.ceil(total / 6);
        panel.querySelector(".con-pagination").innerHTML =
          `<span class="bf-dim">Showing ${(page - 1) * 6 + 1}–${Math.min(page * 6, total)} of ${total} · sample page</span><div>${button("Previous", `data-page="${page - 1}" ${page === 1 ? "disabled" : ""}`)} <span>${page} / ${pages}</span> ${button("Next", `data-page="${page + 1}" ${page === pages ? "disabled" : ""}`)}</div>${button(U.icon("refresh") + " Refresh", "data-refresh")}</div>`;
        return;
      }
      if (tab === 2 || tab === 3) {
        const r = U.rng(query + tab);
        const rows = Array.from({ length: 6 }, (_, i) => {
          const date = `2026-08-${U.pad(2 + i * 3)}`;
          return [
            `https://${tab === 2 ? ["app.ledgerly.example", "hr.peoplehub.example", "cloud.orbit.example"][i % 3] : domain()}/login`,
            tab === 2
              ? `j.moreau@${domain()}`
              : `user${r.int(1000, 9999)}@mail.example`,
            "•••••••• · 11 chars",
            date,
            U.stamp(new Date(Date.parse(date) + (i + 1) * 5 * 864e5), false),
          ];
        });
        panel.innerHTML = `<div class="dm-controls"><span class="bf-dim">Six illustrative ${tab === 2 ? "third-party" : "customer"} accounts</span>${button("Export CSV", "data-table-export")}</div><div class="con-table-scroll"><table class="con-table"><thead><tr>${["URL", "Login", "Password", "Date compromised", "Last time added"].map((s) => `<th scope="col">${s}</th>`).join("")}</tr></thead><tbody>${rows.map((row, i) => `<tr tabindex="0" title="Recorded ${(i + 1) * 5} days after compromise">${row.map((v, k) => `<td>${e(v)}${k === 2 ? ' <span class="bf-badge bf-badge--weak">Weak</span>' : ""}</td>`).join("")}</tr>`).join("")}</tbody></table></div><div class="dm-note">Dates describe compromise and collection separately. Passwords are always masked.</div>`;
        panel
          .querySelector("[data-table-export]")
          .addEventListener("click", () =>
            exportRows(tab === 2 ? "third-party" : "users", [
              ["URL", "Login", "Password", "Compromised", "Added"],
              ...rows,
            ]),
          );
        return;
      }
      if (tab === 4) {
        panel.innerHTML =
          '<div class="con-card-head"><b>External dependencies</b><span class="bf-dim">5 fictional domains</span></div>' +
          ["cdn", "pay", "support", "mail", "identity"]
            .map(
              (s, i) =>
                `<div class="con-external"><b>${e(domain().split(".")[0])}-${s}.example</b><span>${96 - i * 17} records</span><div class="con-meter"><span style="transform:scaleX(${(96 - i * 17) / 100})"></span></div></div>`,
            )
            .join("");
        return;
      }
      panel.innerHTML = `<div class="bf-seg" aria-label="Asset population"><button type="button" data-assets="employees" aria-pressed="${!assetUsers}">Employees</button><button type="button" data-assets="users" aria-pressed="${assetUsers}">Compromised users</button></div><div class="bf-banner con-assets-banner"><b>Total URLs · ${assetUsers ? "147" : "289"}</b>${button("Export all to CSV", "data-assets-export")}</div><div class="con-external"><b>${e(domain())}</b><span>${assetUsers ? "147" : "289"} URLs</span>${button("View all", 'data-expand-assets aria-expanded="false" aria-controls="con-resources"')}</div><div id="con-resources" hidden>${["/login", "/account", "/sso", "/admin", `android://RmljdGlvbmFsQ2VydGlmaWNhdGVGaW5nZXJwcmludA==@com.kestrel.mobile/`].map((s, i) => `<div class="con-external"><span class="bf-mono">${e(s)}</span><span>${643 - i * 111} occurrences</span></div>`).join("")}</div>`;
      panel.querySelectorAll("[data-assets]").forEach((b) =>
        b.addEventListener("click", () => {
          assetUsers = b.dataset.assets === "users";
          draw();
          active()
            .querySelector(`[data-assets="${b.dataset.assets}"]`)
            .focus({ preventScroll: true });
        }),
      );
      panel
        .querySelector("[data-assets-export]")
        .addEventListener("click", () =>
          exportRows("assets", [
            ["domain", "resource", "population"],
            ...["/login", "/account", "/sso", "/admin"].map((s) => [
              domain(),
              s,
              assetUsers ? "users" : "employees",
            ]),
          ]),
        );
    }
    app.addEventListener("click", (ev) => {
      const b = ev.target.closest("button");
      if (!b) return;
      if (b.dataset.nav !== undefined) {
        const i = Number(b.dataset.nav),
          [name, , link] = destinations[i];
        if (i === 1) {
          searchView(true);
          return;
        }
        U.toast(toasts, {
          title: link
            ? `${name} is covered in the case study.`
            : "Documents is in the navigation, but its page is not drawn yet.",
          action: link ? "Read chapter" : "",
          timeout: link ? 0 : 4200,
          onAction: () => {
            location.href = "../blog/" + link;
          },
        });
      }
      if (b.dataset.query) {
        main.querySelector("input").value = b.dataset.query;
        search(b.dataset.query);
      }
      if (b.hasAttribute("data-back")) searchView(true);
      if (b.dataset.page) {
        page = Number(b.dataset.page);
        draw();
        active()
          .querySelector("[data-page]:not(:disabled)")
          ?.focus({ preventScroll: true });
      }
      if (b.hasAttribute("data-refresh")) {
        draw();
        active()
          .querySelector("[data-refresh]")
          ?.focus({ preventScroll: true });
        U.toast(toasts, {
          title:
            "Sample records refreshed. The same query keeps the same evidence.",
        });
      }
      if (b.hasAttribute("data-expand-assets")) {
        const panel = main.querySelector("#con-resources");
        panel.hidden = !panel.hidden;
        b.setAttribute("aria-expanded", String(!panel.hidden));
        b.textContent = panel.hidden ? "View all" : "Hide resources";
      }
      if (b.hasAttribute("data-month"))
        main.querySelector("[data-chart-readout]").textContent =
          `${b.textContent} 2026 · ${b.dataset.value} compromised computers · sample count`;
    });
    app.addEventListener("focusin", (ev) => {
      const b = ev.target.closest("[data-month]");
      if (b)
        main.querySelector("[data-chart-readout]").textContent =
          `${b.textContent} 2026 · ${b.dataset.value} compromised computers · sample count`;
    });
    searchView();
  });
})();
