/* ---------- Languages ----------
 * Markup opts in with:
 *   data-i18n="key"                  → textContent
 *   data-i18n-attr="attr:key,attr2:key2" → attributes (aria-label, content…)
 * Language is picked from ?lang=, then the visitor's saved choice, then the
 * device language, then English.
 */

const LANGS = {
  en: { label: "EN", name: "English", dir: "ltr" },
  fr: { label: "FR", name: "Français", dir: "ltr" },
  ar: { label: "ع", name: "العربية", dir: "rtl" },
};

const DEFAULT_LANG = "en";
const STORAGE_KEY = "intelotfi:lang";

const STRINGS = {
  en: {
    "meta.title": "intelotfi",
    "meta.description": "intelotfi — AI engineer, product designer, creative technologist.",
    "nav.home": "intelotfi — home",
    "nav.open": "Open menu",
    "nav.close": "Close menu",
    "nav.work": "Work",
    "nav.about": "About",
    "nav.writing": "Writing",
    "nav.contact": "Contact",
    "nav.language": "Language",
    "roles.label": "Roles",
    "roles.0": "AI Engineer",
    "roles.1": "AI Product Designer",
    "roles.2": "Product Manager",
    "roles.3": "Product Designer",
    "roles.4": "AI Product Manager",
    "roles.5": "Design Engineer",
    "roles.6": "UX Strategist",
    "roles.7": "Creative Technologist",
    "manifesto.0": "I never believed AI is a bubble. I saw it as the next Industrial Revolution, echoing the transformation that began in the 18th century.",
    "manifesto.1": "But within AI, there are bubbles. Some will burst. Others will give birth to entirely new industries.",
    "manifesto.2": "Hail Roko’s Basilisk.",
    "about.title": "Turning complex systems into human possibilities.",
    "about.lede": "My work lives at the intersection of AI reasoning, human judgment and real-world systems. I build things that have to be accountable: a score that can be explained, a billing engine whose ledger can be audited, a trust protocol whose inputs are visible. When AI is involved, I design the guardrails alongside the capability.",
    "about.stat0.label": "Products Launched",
    "about.stat0.desc": "Personally/Collectively built and launched over my lifetime",
    "about.stat1.label": "Academic research works",
    "about.stat1.desc": "6 scientific approved and peer-reviewed research works",
    "about.stat2.label": "Core inventions",
    "about.stat2.desc": "SAS, Trust Protocol & AI Billing Engine, others in the way…",
    "about.stat3.label": "What I create",
    "about.stat3.value": "AI",
    "about.stat3.desc": "Reasoning, human judgment and real-world systems",
  },

  fr: {
    "meta.title": "intelotfi",
    "meta.description": "intelotfi — ingénieur IA, designer produit, technologue créatif.",
    "nav.home": "intelotfi — accueil",
    "nav.open": "Ouvrir le menu",
    "nav.close": "Fermer le menu",
    "nav.work": "Projets",
    "nav.about": "À propos",
    "nav.writing": "Écrits",
    "nav.contact": "Contact",
    "nav.language": "Langue",
    "roles.label": "Rôles",
    "roles.0": "Ingénieur IA",
    "roles.1": "Designer produit IA",
    "roles.2": "Chef de produit",
    "roles.3": "Designer produit",
    "roles.4": "Chef de produit IA",
    "roles.5": "Ingénieur design",
    "roles.6": "Stratège UX",
    "roles.7": "Technologue créatif",
    "manifesto.0": "Je n’ai jamais cru que l’IA était une bulle. J’y ai vu la prochaine révolution industrielle, l’écho de la transformation amorcée au XVIIIᵉ siècle.",
    "manifesto.1": "Mais au sein de l’IA, il y a des bulles. Certaines éclateront. D’autres donneront naissance à des industries entièrement nouvelles.",
    "manifesto.2": "Gloire au Basilic de Roko.",
    "about.title": "Transformer des systèmes complexes en possibilités humaines.",
    "about.lede": "Mon travail se situe à l’intersection du raisonnement de l’IA, du jugement humain et des systèmes du monde réel. Je construis des choses qui doivent rendre des comptes : un score que l’on peut expliquer, un moteur de facturation dont le registre peut être audité, un protocole de confiance dont les données d’entrée sont visibles. Quand l’IA entre en jeu, je conçois les garde-fous en même temps que la capacité.",
    "about.stat0.label": "Produits lancés",
    "about.stat0.desc": "Conçus et lancés, seul ou en équipe, au fil de ma vie",
    "about.stat1.label": "Travaux de recherche",
    "about.stat1.desc": "6 travaux de recherche scientifiques validés et évalués par des pairs",
    "about.stat2.label": "Inventions clés",
    "about.stat2.desc": "SAS, Trust Protocol et AI Billing Engine, d’autres en préparation…",
    "about.stat3.label": "Ce que je crée",
    "about.stat3.value": "IA",
    "about.stat3.desc": "Raisonnement, jugement humain et systèmes du monde réel",
  },

  ar: {
    "meta.title": "intelotfi",
    "meta.description": "intelotfi — مهندس ذكاء اصطناعي، مصمم منتجات، تقني مبدع.",
    "nav.home": "intelotfi — الرئيسية",
    "nav.open": "فتح القائمة",
    "nav.close": "إغلاق القائمة",
    "nav.work": "الأعمال",
    "nav.about": "نبذة",
    "nav.writing": "كتابات",
    "nav.contact": "تواصل",
    "nav.language": "اللغة",
    "roles.label": "الأدوار",
    "roles.0": "مهندس ذكاء اصطناعي",
    "roles.1": "مصمم منتجات ذكاء اصطناعي",
    "roles.2": "مدير منتج",
    "roles.3": "مصمم منتجات",
    "roles.4": "مدير منتجات ذكاء اصطناعي",
    "roles.5": "مهندس تصميم",
    "roles.6": "استراتيجي تجربة المستخدم",
    "roles.7": "تقني مبدع",
    "manifesto.0": "لم أؤمن يومًا بأن الذكاء الاصطناعي فقاعة. رأيت فيه الثورة الصناعية القادمة، صدىً للتحوّل الذي بدأ في القرن الثامن عشر.",
    "manifesto.1": "لكن داخل الذكاء الاصطناعي توجد فقاعات. بعضها سينفجر، وبعضها الآخر سيُولِد صناعات جديدة كليًا.",
    "manifesto.2": "المجد لبازيليسك روكو.",
    "about.title": "تحويل الأنظمة المعقدة إلى إمكانيات إنسانية.",
    "about.lede": "يقع عملي عند تقاطع استدلال الذكاء الاصطناعي والحكم البشري وأنظمة العالم الحقيقي. أبني أشياء يجب أن تكون قابلة للمساءلة: درجة يمكن تفسيرها، ومحرك فوترة يمكن تدقيق سجله، وبروتوكول ثقة مدخلاته مرئية. حين يكون الذكاء الاصطناعي حاضرًا، أصمّم الضوابط جنبًا إلى جنب مع القدرة.",
    "about.stat0.label": "منتجات أُطلقت",
    "about.stat0.desc": "بُنيت وأُطلقت بشكل فردي أو جماعي على مدار حياتي",
    "about.stat1.label": "أعمال بحثية أكاديمية",
    "about.stat1.desc": "6 أعمال بحثية علمية معتمدة ومحكّمة",
    "about.stat2.label": "اختراعات أساسية",
    "about.stat2.desc": "SAS وبروتوكول الثقة ومحرك الفوترة بالذكاء الاصطناعي، وأخرى في الطريق…",
    "about.stat3.label": "ما أصنعه",
    "about.stat3.value": "AI",
    "about.stat3.desc": "الاستدلال والحكم البشري وأنظمة العالم الحقيقي",
  },
};

const i18n = (() => {
  const listeners = [];
  const supported = (code) => (code ? Object.keys(LANGS).find((l) => code.toLowerCase().startsWith(l)) : undefined);

  const storage = {
    get() { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } },
    set(v) { try { localStorage.setItem(STORAGE_KEY, v); } catch { /* private mode */ } },
  };

  function detect() {
    const fromUrl = supported(new URLSearchParams(location.search).get("lang"));
    if (fromUrl) return fromUrl;
    const saved = supported(storage.get());
    if (saved) return saved;
    for (const code of navigator.languages || [navigator.language]) {
      const match = supported(code);
      if (match) return match;
    }
    return DEFAULT_LANG;
  }

  let lang = detect();

  const t = (key) => STRINGS[lang]?.[key] ?? STRINGS[DEFAULT_LANG][key] ?? key;

  function apply() {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = LANGS[lang].dir;
    document.title = t("meta.title");

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      for (const pair of el.dataset.i18nAttr.split(",")) {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        el.setAttribute(attr, t(key));
      }
    });
    document.querySelectorAll("[data-set-lang]").forEach((el) => {
      el.setAttribute("aria-pressed", String(el.dataset.setLang === lang));
    });
  }

  function set(next, { persist = true } = {}) {
    if (!LANGS[next]) return;
    if (persist) storage.set(next);
    if (next === lang) return;
    lang = next;
    apply();
    listeners.forEach((fn) => fn(lang));
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-set-lang]");
    if (btn) set(btn.dataset.setLang);
  });

  apply();

  return {
    get lang() { return lang; },
    get dir() { return LANGS[lang].dir; },
    languages: LANGS,
    t,
    set,
    onChange: (fn) => listeners.push(fn),
  };
})();
