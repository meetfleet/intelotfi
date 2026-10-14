/* Fictional device evidence shared by the console and Chapter I. */
window.BFRecords = (() => {
  const U = BFUI,
    e = U.esc;
  let sequence = 0;
  const make = (query = "kestrel.example", count = 3, page = 1) => {
    const r = U.rng(`${query}:${page}`);
    return Array.from({ length: count }, (_, i) => ({
      id: `KS-${r.chars(8)}`,
      family: r.pick(["Lumma", "RedLine", "Vidar", "StealC", "Raccoon"]),
      ip: `${r.pick(["203.0.113", "198.51.100", "192.0.2"])}.${r.int(1, 254)}`,
      path: [
        "C:\\Users\\jmoreau\\AppData\\Local\\Temp\\Setup_x64.exe",
        "C:\\ProgramData\\updater\\svc.exe",
        "C:\\Users\\lhaddad\\Downloads\\invoice.exe",
      ][i % 3],
      date: `2026-0${r.int(6, 9)}-${U.pad(r.int(1, 28))}`,
      login: `${["j.moreau", "l.haddad", "a.chen", "m.rossi", "s.khan", "e.martin"][i % 6]}@${query}`,
      resolved: false,
    }));
  };
  const mount = (
    host,
    {
      query = "kestrel.example",
      records = make(query),
      onStep = () => {},
      onExport,
      compact = false,
    } = {},
  ) => {
    const prefix = `evidence-${++sequence}`;
    host.classList.add("dm-drill-host");
    let filter = false,
      open = null,
      tab = 0,
      domain = null;
    host.innerHTML =
      '<div class="dm-drill-main"></div><div class="bf-toasts"></div>';
    const main = host.firstElementChild,
      toasts = host.lastElementChild;
    const btn = (key, text, attrs = "") =>
      `<button type="button" class="bf-btn bf-btn--sm" data-key="${key}" ${attrs}>${text}</button>`;
    const notify = (title, undo) =>
      U.toast(toasts, {
        title,
        action: undo ? "Undo" : "",
        onAction: undo,
        timeout: undo ? 0 : 4200,
      });
    const render = (focusKey) => {
      const focused =
        focusKey ||
        (main.contains(document.activeElement)
          ? document.activeElement.dataset.key
          : null);
      const visible = records.filter((r) => r.resolved === filter),
        rec = records.find((r) => r.id === open);
      const trail = [
        rec ? rec.id : "Device",
        open
          ? ["Profile", "Corporate credentials", "Cookie domains"][tab]
          : "Evidence",
        domain || "Domain",
        domain ? "Cookie records" : "Cookies",
      ];
      main.innerHTML = `<div class="dm-drill-trail" aria-label="Evidence depth">${trail.map((t, i) => btn(`trail-${i}`, e(t), `data-trail="${i}" ${(!open && i > 0) || (!domain && i > 1) ? "disabled" : ""}`)).join('<span aria-hidden="true">›</span>')}</div><div class="dm-drill-toolbar"><div class="bf-seg" aria-label="Resolution filter">${[false, true].map((f, i) => `<button type="button" data-key="filter-${i}" data-filter="${i}" aria-pressed="${filter === f}">${f ? "Resolved" : "Unresolved"} (${records.filter((r) => r.resolved === f).length})</button>`).join("")}</div>${btn("all", "Resolve all", `data-all ${filter || !visible.length ? "disabled" : ""}`)}${onExport ? btn("export-cookies", "Export cookies", 'data-export="cookies"') + btn("export", "Export CSV", 'data-export="credentials"') : ""}<span class="bf-dim">As of 2026-10-01 · fictional</span></div><div class="dm-drill-head"><span>Stealer ID / family</span><span class="dm-drill-desktop">IP / malware path</span><span>Date compromised</span><span>Resolved</span></div><div class="dm-drill-list">${visible.length ? visible.map((r) => `<div class="dm-drill-device"><div class="dm-drill-row"><button type="button" class="dm-drill-open" data-key="open-${r.id}" data-open="${r.id}" aria-expanded="${open === r.id}" aria-controls="${prefix}-${r.id}">${U.icon(open === r.id ? "chevronDown" : "chevronRight")}<span><b class="bf-mono">${r.id}</b><span class="bf-dim">${r.family}</span></span></button><span class="dm-drill-desktop bf-mono">${r.ip}<span class="bf-dim dm-drill-path" title="${e(r.path)}">${e(r.path)}</span></span><span class="bf-mono">${r.date}</span>${U.switchHTML(r.resolved, "", `aria-label="Mark ${r.id} ${r.resolved ? "unresolved" : "resolved"}" data-key="resolve-${r.id}" data-resolve="${r.id}"`)}</div><div id="${prefix}-${r.id}" class="dm-drill-detail" ${open !== r.id ? "hidden" : ""}>${open === r.id ? detail(r) : ""}</div></div>`).join("") : '<div class="bf-empty">' + (filter ? "No resolved devices yet." : "Nothing unresolved. Every device here has been handled.") + "</div>"}</div>`;
      main.querySelectorAll(".dm-drill-tabs").forEach((el) =>
        U.tabs(el, {
          onChange: (i) => {
            tab = i;
            domain = null;
            render(`tab-${i}`);
          },
        }),
      );
      if (focused)
        (
          main.querySelector(`[data-key="${CSS.escape(focused)}"]`) ||
          main.querySelector(`[data-key="filter-${filter ? 1 : 0}"]`)
        )?.focus({ preventScroll: true });
    };
    function detail(r) {
      const tabs = [
        "Profile",
        "Corporate credentials",
        "Domains with sensitive cookies",
      ];
      let content = "";
      if (tab === 0)
        content = `<div class="dm-drill-facts">${[
          ["Computer", "KES-JMOREAU"],
          ["Operating system", "Windows 11"],
          ["Antivirus", "Free · Windows Defender"],
          ["Initial detection", r.date],
          ["Installed software", "24 applications"],
          ["Discovered applications", "8"],
          ["IP address", r.ip],
          ["Malware path", r.path],
        ]
          .map(
            ([k, v]) =>
              `<div><span class="bf-dim">${k}</span><span>${e(v)}</span></div>`,
          )
          .join(
            "",
          )}</div><div class="bf-tip">${btn("ai", "Analyze with AI · New", 'data-ai aria-describedby="' + prefix + '-ai"')}<span class="bf-tip__box" id="${prefix}-ai">Explore the proposed risk model and evidence-grounded analyst brief. No AI model is called in this miniature.</span></div>`;
      if (tab === 1)
        content = `<div class="dm-drill-credential"><span class="bf-mono">https://sso.${e(query)}/login</span><span>${e(r.login)}</span><span>•••••••• · 11 chars <span class="bf-badge bf-badge--weak">Weak</span></span></div>`;
      if (tab === 2)
        content = ["mail", "portal"]
          .map((name, i) => {
            const d = `${name}.${query}`,
              expiry = i ? "2026-08-30" : "2026-11-30";
            return `<div class="dm-drill-domain"><div class="dm-drill-domainbar"><b class="bf-mono">${e(d)}</b><span>${i ? 4 : 12} cookies</span><span>Valid until ${expiry}</span><span class="bf-badge bf-badge--${i ? "bad" : "ok"}">${i ? "EXPIRED" : "UNEXPIRED"}</span>${btn("domain-" + i, domain === d ? "Hide cookies" : "View all", `data-domain="${i}" aria-expanded="${domain === d}" aria-controls="${prefix}-cookies-${i}"`)}</div><div class="dm-drill-cookies" id="${prefix}-cookies-${i}" ${domain === d ? "" : "hidden"}><div class="bf-dim">Illustrative records · unexpired does not mean verified active</div>${Array.from({ length: i ? 4 : 12 }, (_, k) => `<div class="dm-drill-cookie"><span class="bf-mono">https://${e(d)}/</span><b>${["__Host-session", "XSRF-TOKEN", "remember_me"][k % 3]}${k > 2 ? "_" + k : ""}</b><span class="bf-mono">eyJh••••••Qz</span><span>${expiry}</span></div>`).join("")}</div></div>`;
          })
          .join("");
      return `<div class="bf-tabs dm-drill-tabs" role="tablist" aria-label="Device evidence">${tabs.map((t, i) => `<button type="button" class="bf-tab" role="tab" id="${prefix}-tab-${i}" data-key="tab-${i}" aria-selected="${i === tab}" aria-controls="${prefix}-panel-${i}">${t}</button>`).join("")}</div>${tabs.map((_, i) => `<div id="${prefix}-panel-${i}" role="tabpanel" aria-labelledby="${prefix}-tab-${i}" ${i !== tab ? "hidden" : ""}>${i === tab ? content : ""}</div>`).join("")}`;
    }
    main.addEventListener("click", (ev) => {
      const b = ev.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-filter")) {
        filter = b.dataset.filter === "1";
        open = null;
        domain = null;
        render();
      }
      if (b.dataset.open) {
        open = open === b.dataset.open ? null : b.dataset.open;
        domain = null;
        tab = 0;
        if (open) onStep("expand");
        render();
      }
      if (b.hasAttribute("data-domain")) {
        const d = `${b.dataset.domain === "0" ? "mail" : "portal"}.${query}`;
        domain = domain === d ? null : d;
        if (domain) onStep("cookies");
        render();
      }
      if (b.dataset.resolve) {
        const r = records.find((x) => x.id === b.dataset.resolve);
        const wasResolved = r.resolved;
        r.resolved = !wasResolved;
        open = null;
        domain = null;
        if (r.resolved) onStep("resolve");
        render();
        notify(
          `${r.id} marked ${r.resolved ? "resolved" : "unresolved"}`,
          () => {
            r.resolved = wasResolved;
            render();
          },
        );
      }
      if (b.hasAttribute("data-all")) {
        const changed = records.filter((r) => !r.resolved);
        changed.forEach((r) => (r.resolved = true));
        open = null;
        domain = null;
        onStep("resolve");
        render();
        notify(`${changed.length} devices marked resolved`, () => {
          changed.forEach((r) => (r.resolved = false));
          render();
        });
      }
      if (b.dataset.export)
        onExport?.(
          b.dataset.export,
          records.filter((r) => r.resolved === filter),
        );
      if (b.hasAttribute("data-ai"))
        U.toast(toasts, { title: "Explore the proposed AI assessment", body: "Inspect the risk calculation, possible attack path and cited analyst brief.", action: "Open assessment", timeout: 0, onAction: () => { location.href = "../blog/outside-in.html#risk-model"; } });
      if (b.hasAttribute("data-trail")) {
        const level = Number(b.dataset.trail);
        if (level === 0) open = null;
        if (level < 3) domain = null;
        render();
      }
    });
    main.addEventListener("keydown", (ev) => {
      if (ev.key !== "Escape") return;
      if (domain) {
        domain = null;
        render("domain-0");
      } else if (open) {
        const id = open;
        open = null;
        render(`open-${id}`);
      }
      ev.stopPropagation();
    });
    render();
    return { records };
  };
  return { make, mount };
})();
