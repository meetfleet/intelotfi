/* ===========================================================================
   Antercept · tiny UI helpers shared by the labs and the console.
   No framework, no network. Everything is local and deterministic.
   =========================================================================== */
(function () {
  "use strict";

  // safe element builder: el("div.foo", {attr}, [children|string])
  function el(spec, attrs, kids) {
    var parts = spec.split(/(?=[.#])/);
    var tag = parts[0] && parts[0][0] !== "." && parts[0][0] !== "#" ? parts[0] : "div";
    var node = document.createElement(tag);
    parts.forEach(function (p) {
      if (p[0] === ".") node.classList.add(p.slice(1));
      else if (p[0] === "#") node.id = p.slice(1);
    });
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") node.textContent = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
      });
    }
    if (kids != null) {
      (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
        if (c == null) return;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  function pill(status) {
    var p = el("span.ac-pill", { html: "" });
    p.classList.add("ac-pill--" + status);
    p.appendChild(document.createTextNode(status));
    return p;
  }

  function risk(n) {
    var wrap = el("span.ac-risk");
    var track = el("span.ac-risk__track");
    var fill = el("span.ac-risk__fill");
    fill.style.width = "0%";
    requestAnimationFrame(function () { fill.style.width = n + "%"; });
    track.appendChild(fill);
    wrap.appendChild(track);
    wrap.appendChild(el("span.ac-risk__n", { text: String(n) }));
    return wrap;
  }

  // a reusable sidebar nav icon set (inline, so no extra requests)
  var ICONS = {
    dashboard: '<rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/>',
    phisher: '<path d="M4 3v5a4 4 0 0 0 8 0" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="4" cy="2.5" r="1.3"/>',
    cookie: '<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="6" r="0.9"/><circle cx="10" cy="9" r="0.9"/><circle cx="7" cy="10.5" r="0.7"/>',
    key: '<circle cx="5" cy="5" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 7l5 5M11 11l1.5-1.5" stroke="currentColor" stroke-width="1.5" fill="none"/>',
    locate: '<circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" stroke-width="1.5"/>',
    net: '<circle cx="4" cy="4" r="2" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="12" cy="12" r="2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M6 6l4 4" stroke="currentColor" stroke-width="1.3"/>',
    extract: '<path d="M3 8h8M8 5l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 3v10" stroke="currentColor" stroke-width="1.5"/>',
    data: '<ellipse cx="8" cy="4" rx="5" ry="2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4" fill="none" stroke="currentColor" stroke-width="1.3"/>',
    template: '<rect x="3" y="2" width="10" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 6h5M5.5 9h5M5.5 11.5h3" stroke="currentColor" stroke-width="1.2"/>',
    server: '<rect x="2.5" y="3" width="11" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="2.5" y="9" width="11" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="5" cy="5" r="0.6"/><circle cx="5" cy="11" r="0.6"/>',
    domain: '<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" fill="none" stroke="currentColor" stroke-width="1.1"/>',
    users: '<circle cx="6" cy="5" r="2.3" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M2 13c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M11 6.5a2 2 0 0 1 0 4" fill="none" stroke="currentColor" stroke-width="1.2"/>',
    settings: '<circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5 13 13M13 3l-1.5 1.5M4.5 11.5 3 13" stroke="currentColor" stroke-width="1.2"/>'
  };
  function icon(name) {
    var svg = '<svg class="ac-nav__ico" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">' + (ICONS[name] || "") + "</svg>";
    var span = document.createElement("span");
    span.innerHTML = svg;
    return span.firstChild;
  }

  window.ACUI = { el: el, pill: pill, risk: risk, icon: icon, ICONS: ICONS };
})();
