/* ===========================================================================
   Antercept · fictional sample data
   Everything here is invented for a local demonstration. Brands are fictional;
   e-mail domains use reserved .example names; people and devices are made up.
   No real person, company, credential or location is represented.
   =========================================================================== */
(function () {
  "use strict";

  // ---- fictional brands the AI template studio can impersonate (for awareness)
  var BRANDS = [
    { id: "northwind", name: "Northwind Mail", kind: "webmail", tone: "clerical" },
    { id: "contoso", name: "Contoso 365", kind: "workspace", tone: "corporate" },
    { id: "fabrikam", name: "Fabrikam HR", kind: "hr", tone: "friendly" },
    { id: "acmepay", name: "Acme Pay", kind: "finance", tone: "urgent" },
    { id: "umbra", name: "Umbra VPN", kind: "security", tone: "technical" },
    { id: "parcelo", name: "Parcelo", kind: "delivery", tone: "brisk" }
  ];

  // ---- awareness templates (pretext lines only; no deployable payload)
  var TEMPLATES = [
    { id: "t1", name: "Password expiry", brand: "contoso", channel: "email", difficulty: 2, pretext: "Your Contoso 365 password expires today — reset to keep access.", levers: ["urgency", "authority"] },
    { id: "t2", name: "Shared document", brand: "contoso", channel: "email", difficulty: 1, pretext: "A colleague shared “Q3 Forecast” with you on Contoso 365.", levers: ["familiarity", "curiosity"] },
    { id: "t3", name: "Payroll update", brand: "fabrikam", channel: "email", difficulty: 3, pretext: "Fabrikam HR: confirm your bank details before this month’s run.", levers: ["authority", "urgency", "fear"] },
    { id: "t4", name: "Failed delivery", brand: "parcelo", channel: "sms", difficulty: 1, pretext: "Parcelo: we missed you. Reschedule your parcel today.", levers: ["curiosity", "urgency"] },
    { id: "t5", name: "Payment held", brand: "acmepay", channel: "email", difficulty: 2, pretext: "Acme Pay held a payment on your account pending verification.", levers: ["fear", "urgency"] },
    { id: "t6", name: "New sign-in", brand: "umbra", channel: "email", difficulty: 2, pretext: "Umbra VPN detected a new sign-in from an unrecognised device.", levers: ["fear", "authority"] },
    { id: "t7", name: "Mailbox full", brand: "northwind", channel: "email", difficulty: 1, pretext: "Northwind Mail: your mailbox is almost full. Free up space now.", levers: ["urgency"] },
    { id: "t8", name: "Code request", brand: "acmepay", channel: "sms", difficulty: 3, pretext: "Acme Pay: your verification code is 418-902. Do not share it.", levers: ["authority", "familiarity"] }
  ];

  // ---- deterministic fictional target generator
  var FIRST = ["Amelia","Noah","Ines","Omar","Sofia","Liam","Yara","Hugo","Nadia","Theo","Lena","Samir","Clara","Idris","Maya","Ravi","Elena","Tariq","Jonas","Priya","Marco","Dalia","Felix","Zara","Bruno","Aya","Victor","Leila","Oscar","Rania","Milo","Nour","Hana","Diego","Sana","Pavel","Rosa","Kian","Greta","Yusuf"];
  var LAST = ["Hart","Okoro","Benali","Costa","Novak","Dupont","Haddad","Lund","Rossi","Mensah","Khan","Vidal","Ferreira","Saab","Berg","Patel","Moreau","Jalloh","Weiss","Nair"];
  var DEPT = ["Finance","Engineering","Sales","Support","Legal","People","Operations","Marketing"];
  var DEVICE = ["iPhone 15","iPhone 14","Pixel 8","Galaxy S24","Windows 11","macOS 14","iPad Air"];
  var CITY = ["Casablanca","Lisbon","Berlin","Lyon","Warsaw","Dublin","Milan","Accra","Dubai","Manchester","Rotterdam","Lagos","Valencia","Prague"];
  var DOMAIN = ["acme.example","contoso.example","fabrikam.example"];
  var STATUS = ["pending","opened","clicked","reported"];

  // a small seeded PRNG so the data is identical on every load
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  var rand = rng(20261014);
  function pick(a) { return a[Math.floor(rand() * a.length)]; }

  var TARGETS = [];
  for (var i = 0; i < 40; i++) {
    var f = pick(FIRST), l = pick(LAST);
    var dom = pick(DOMAIN);
    var status = STATUS[Math.floor(Math.pow(rand(), 1.4) * STATUS.length)];
    // risk follows status: clicked targets score higher
    var base = status === "clicked" ? 62 : status === "opened" ? 38 : status === "reported" ? 8 : 24;
    var risk = Math.max(2, Math.min(99, Math.round(base + (rand() * 30 - 12))));
    TARGETS.push({
      id: "TGT-" + String(1001 + i),
      name: f + " " + l,
      email: f.toLowerCase() + "." + l.toLowerCase() + "@" + dom,
      dept: pick(DEPT),
      device: pick(DEVICE),
      city: pick(CITY),
      status: status,
      risk: risk,
      template: pick(TEMPLATES).id
    });
  }

  // ---- sample campaigns, each a slice of the target pool
  var CAMPAIGNS = [
    { id: "C-204", name: "Q3 Awareness · Finance", brand: "contoso", template: "t1", targets: TARGETS.slice(0, 16) },
    { id: "C-205", name: "Delivery pretext · All staff", brand: "parcelo", template: "t4", targets: TARGETS.slice(16, 30) },
    { id: "C-206", name: "Payroll check · People", brand: "fabrikam", template: "t3", targets: TARGETS.slice(30, 40) }
  ];

  window.ANTERCEPT_DATA = {
    brands: BRANDS,
    templates: TEMPLATES,
    targets: TARGETS,
    campaigns: CAMPAIGNS
  };
})();
