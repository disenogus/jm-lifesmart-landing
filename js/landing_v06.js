/* JM × LifeSmart · Landing Construmedia 2026 · v06 (correcciones del cliente, 02-11-26)
   JS vanilla con mejora progresiva: sin JS el contenido se lee completo.
   Precios = precios de referencia de los kits del brief de LifeSmart (USD); el resto de la estimación es orientativa. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const isMobile = () => matchMedia("(max-width: 760px)").matches;

/* ---------- Configuración ---------- */

const CONFIG = {
  whatsappJM: "18094752210",            // WhatsApp de JM: (809) 475-2210
  // Google Sheet de leads (ver LEADS/LEEME.md). Vacío = modo demo: se guardan en este navegador (LEADS/leads_demo.html).
  leadsEndpoint: "",
  storageKey: "jm_leads_v1",
  ga4: "",                               // ID de Google Analytics 4 (G-XXXXXXX) para medir clics; vacío = solo dataLayer
  igLifeSmart: "",                       // usuario de Instagram de LifeSmart sin @ (pendiente de confirmar)
};

const wa = msg => `https://wa.me/${CONFIG.whatsappJM}${msg ? "?text=" + encodeURIComponent(msg) : ""}`;
const money = n => "US$ " + (Math.round(n / 10) * 10).toLocaleString("en-US");
const rangeTxt = (a, b) => `${money(a)}–${money(b).replace("US$ ", "")}`;

/* ---------- Medición de clics ----------
   Todo elemento con data-track envía un evento. Con CONFIG.ga4 se carga GA4; si hay GTM, basta con dataLayer. */

window.dataLayer = window.dataLayer || [];
function track(name, params = {}) {
  window.dataLayer.push({ event: "jm_click", jm_event: name, ...params });
  if (window.gtag) window.gtag("event", name, params);
}
function initTracking() {
  if (CONFIG.ga4) {
    const s = document.createElement("script"); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.ga4}`; document.head.appendChild(s);
    window.gtag = function () { window.dataLayer.push(arguments); }; window.gtag("js", new Date()); window.gtag("config", CONFIG.ga4);
  }
  document.addEventListener("click", e => { const t = e.target.closest("[data-track]"); if (t) track(t.dataset.track); });
  $$("details[data-track-open]").forEach(d => d.addEventListener("toggle", () => { if (d.open) track(d.dataset.trackOpen); }));
}

/* ---------- Header + menú móvil ---------- */

function initHeader() {
  const header = $("[data-header]");
  const onScroll = () => header.classList.toggle("is-solid", window.scrollY > 24);
  onScroll();
  addEventListener("scroll", onScroll, { passive: true });

  const btn = $("[data-menu-btn]"), menu = $("[data-menu]");
  const setMenu = open => {
    btn.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    document.body.classList.toggle("menu-open", open);
  };
  btn.addEventListener("click", () => setMenu(btn.getAttribute("aria-expanded") !== "true"));
  $$("a", menu).forEach(a => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  const links = $$("[data-nav] a");
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) links.forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  links.forEach(a => { const s = $(a.getAttribute("href")); if (s) io.observe(s); });

  // Barra fija del celular: se oculta mientras se llena el formulario (el teclado la taparía)
  const lead = $("[data-lead]");
  lead?.addEventListener("focusin", () => document.body.classList.add("typing"));
  lead?.addEventListener("focusout", () => document.body.classList.remove("typing"));
}

/* ---------- 1 · Hero en slideshow ----------
   Cada diapositiva tiene su video (se carga solo cuando le toca), su título y su texto; los botones son fijos. */

function initHero() {
  const root = $("[data-hero]"); if (!root) return;
  const slides = $$("[data-slide]", root), dots = $("[data-dots]", root), pauseBtn = $("[data-pause]", root);
  const DUR = 8000;
  let i = 0, timer = 0, paused = reduceMotion;
  dots.innerHTML = slides.map((s, k) => `<button type="button" role="tab" aria-label="Diapositiva ${k + 1}" aria-selected="${k === 0}"><span class="dot-n">0${k + 1}</span><span class="dot-bar"><i></i></span></button>`).join("");
  const bars = $$("button", dots);

  const load = v => { if (v && !v.src && v.dataset.src) { v.src = v.dataset.src; v.load(); } };
  const show = k => {
    const prev = slides[i]; i = (k + slides.length) % slides.length;
    slides.forEach((s, n) => { s.classList.toggle("is-active", n === i); s.setAttribute("aria-hidden", String(n !== i)); });
    bars.forEach((b, n) => { b.setAttribute("aria-selected", String(n === i)); b.classList.remove("is-run"); });
    const v = $("video", slides[i]); load(v);
    $("video", prev)?.pause();
    if (!paused && v) { v.currentTime = 0; v.play().catch(() => {}); }
    load($("video", slides[(i + 1) % slides.length]));            // precarga la siguiente
    clearTimeout(timer);
    if (!paused) { void bars[i].offsetWidth; bars[i].classList.add("is-run"); timer = setTimeout(() => show(i + 1), DUR); }
  };
  dots.addEventListener("click", e => { const b = e.target.closest("button"); if (b) { track("hero_dot", { n: bars.indexOf(b) + 1 }); show(bars.indexOf(b)); } });
  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.setAttribute("aria-label", paused ? "Reproducir" : "Pausar");
    $("use", pauseBtn).setAttribute("href", paused ? "#i-play" : "#i-pause");
    const v = $("video", slides[i]);
    if (paused) { clearTimeout(timer); bars[i].classList.remove("is-run"); v?.pause(); } else { v?.play().catch(() => {}); show(i); }
  });
  if (paused) { $("use", pauseBtn).setAttribute("href", "#i-play"); pauseBtn.setAttribute("aria-label", "Reproducir"); }
  // Pausa automática fuera de pantalla (ahorra batería y datos)
  new IntersectionObserver(([en]) => { const v = $("video", slides[i]); if (!en.isIntersecting) v?.pause(); else if (!paused) v?.play().catch(() => {}); }).observe(root);
  // Deslizar en celular
  let x0 = null;
  root.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
  root.addEventListener("touchend", e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1)); x0 = null; });
  show(0);
}


/* ---------- Datos: las 7 soluciones del stand y los 5 kits del brief ---------- */

const SOLS = {
  control:  { name: "Control",       icon: "control",  from: 0, line: "El cerebro de la casa: escenas como «Llegar», «Cine» o «Dormir» desde un panel, el celular o la voz.", devices: ["Smart Station", "Nature X PRO", "Nature 7 PRO", "CUBE Clicker"], key: "Smart Station y paneles" },
  luz:      { name: "Iluminación",   icon: "luz",      from: 0, line: "Cada ambiente con su intensidad y su horario. Se enciende al pasar y se apaga cuando no hay nadie.", devices: ["BLEND Switch PRO", "Smart Light Switch", "CUBE Motion Sensor"], key: "Interruptores y sensores" },
  clima:    { name: "Climatización", icon: "clima",    from: 1, line: "El aire por zonas: la casa llega fresca, con horarios y consumo bajo control.", devices: ["Nature Thermostat", "Central A/C Controller", "SPOT Mini"], key: "Termostato Nature" },
  cortinas: { name: "Cortinas",      icon: "cortinas", from: 1, line: "Motores silenciosos que abren con el sol y cierran con la noche, o con una sola orden.", devices: ["Quicklink Curtain Motor", "BLEND Curtain Controller", "Motor tubular"], key: "Motor y control de cortinas" },
  accesos:  { name: "Accesos",       icon: "accesos",  from: 2, line: "La puerta te reconoce en 0.3 s: huella, código, NFC o celular, con permisos por persona.", devices: ["Cerradura C100", "Cerradura C200", "Cerradura Classic"], key: "Cerradura inteligente" },
  camaras:  { name: "Cámaras",       icon: "camaras",  from: null, line: "Entrada y áreas comunes bajo vigilancia, con alertas en la misma app que la luz y el clima.", devices: ["Cámara interior", "Cámara exterior"], key: "Se cotizan aparte" },
  red:      { name: "Red",           icon: "red",      from: 0, line: "La base que lo sostiene todo: hasta 500 equipos por central y un alcance de hasta 400 m en interior.", devices: ["Smart Station", "Protocolo CoSS", "Wi-Fi"], key: "Smart Station" },
};
const SOL_KEYS = Object.keys(SOLS);
const fromLabel = f => f === null ? "Adicional · se cotiza aparte" : f === 0 ? "En todos los kits" : `Desde el kit ${KITS[f].name}`;

const KITS = [
  { id: "essential", name: "Essential", seg: "Entrada", tipo: "Apto 2 hab · 74–100 m²", price: 405, plus: "1.3–3.5 %", m2: 87,
    line: "Para empezar: luces, sensores, control remoto y enchufes inteligentes.",
    top: ["Smart Station (hub)", "Interruptores inteligentes", "Sensor de movimiento CUBE", "Control remoto SPOT Mini"],
    has: ["control", "luz", "red"],
    eq: [[1, "LS082WH", "Smart Station Hub"], [2, "LS123WH", "Smart Light Switch 1 vía"], [2, "LS124WH", "Smart Light Switch 2 vías"], [2, "LS062WH", "Cube Motion Sensor"], [1, "LS251WH", "SPOT Mini"], [2, "LS069WH", "CUBE Clicker"], [2, "BSD57+", "Smart Plug con monitor"]] },
  { id: "comfort", name: "Comfort", seg: "Medio-alto", tipo: "Apto 3 hab · 100–150 m²", price: 1190, plus: "1.1–4.7 %", m2: 125,
    line: "Confort, clima, iluminación, cortinas y escenas.",
    top: ["Panel Nature Mini PRO", "Interruptores BLEND PRO", "Termostato Nature", "Control de cortinas BLEND"],
    has: ["control", "luz", "clima", "cortinas", "red"],
    eq: [[1, "LS082WH", "Smart Station Hub"], [1, "LS268-WH2", "Nature Mini PRO 2-way"], [3, "LS240-GR1", "BLEND Switch PRO 1 vía"], [3, "LS240-GR2", "BLEND Switch PRO 2 vías"], [2, "LS240-GR3", "BLEND Switch PRO 3 vías"], [1, "LS220-WT1", "Nature Thermostat"], [3, "LS235WH", "Motion Sensor Pro"], [1, "LS063WH", "Cube Environmental Sensor"], [2, "LS251WH", "SPOT Mini"], [2, "LS240-WCN", "BLEND Curtain Controller PRO"], [3, "BSD57+", "Smart Plug con monitor"], [3, "LS069WH", "CUBE Clicker"]] },
  { id: "premium", name: "Premium", seg: "Alto", tipo: "Apto de lujo · 150–350 m²", price: 2613, plus: "1.3–5.0 %", m2: 250,
    line: "Acceso, clima, cortinas, sensores y control central.",
    top: ["Paneles Nature Mini L", "Cerradura C100", "Motor de cortina Quicklink", "Termostato Nature"],
    has: ["control", "luz", "clima", "cortinas", "accesos", "red"],
    eq: [[1, "LS082WH", "Smart Station Hub"], [2, "LS218-WH2", "Nature Mini L 2-way"], [1, "LS268-WH2", "Nature Mini PRO 2-way"], [5, "LS240-GR1", "BLEND Switch PRO 1 vía"], [4, "LS240-GR2", "BLEND Switch PRO 2 vías"], [3, "LS240-GR3", "BLEND Switch PRO 3 vías"], [2, "LS220-WT1", "Nature Thermostat"], [1, "LS212", "Central A/C Controller PRO"], [4, "LS235WH", "Motion Sensor Pro"], [2, "LS063WH", "Cube Environmental Sensor"], [3, "LS251WH", "SPOT Mini"], [4, "LS240-WCN", "BLEND Curtain Controller PRO"], [2, "BCM100D", "Quicklink Curtain Motor 3.2 m"], [4, "BSD57+", "Smart Plug con monitor"], [2, "LS143", "General Controller"], [4, "LS069WH", "CUBE Clicker"], [1, "C100", "Cerradura C100"]] },
  { id: "luxury", name: "Luxury", seg: "Premium", tipo: "Villa · 345–622 m²", price: 4797, plus: "1.4–4.2 %", m2: 480,
    line: "Pantalla grande, cerraduras, cortinas, clima y seguridad.",
    top: ["Panel Nature 7 PRO", "Cerraduras C100 y Classic", "Motores de cortina", "Termostatos Nature Mini PRO"],
    has: ["control", "luz", "clima", "cortinas", "accesos", "red"],
    eq: [[2, "LS082WH", "Smart Station Hub"], [1, "LS227", "Nature 7 PRO"], [2, "LS218-WH3", "Nature Mini L 3-way"], [2, "LS268-WH2", "Nature Mini PRO 2-way"], [8, "LS240-GR1", "BLEND Switch PRO 1 vía"], [6, "LS240-GR2", "BLEND Switch PRO 2 vías"], [4, "LS240-GR3", "BLEND Switch PRO 3 vías"], [3, "LS268-WT1", "Nature Mini PRO Thermostat"], [2, "LS212", "Central A/C Controller PRO"], [6, "LS235WH", "Motion Sensor Pro"], [3, "LS063WH", "Cube Environmental Sensor"], [4, "LS251WH", "SPOT Mini"], [6, "LS240-WCN", "BLEND Curtain Controller PRO"], [4, "BCM100D", "Quicklink Curtain Motor 3.2 m"], [2, "V2", "Motor tubular 35 mm"], [6, "BSD57+", "Smart Plug con monitor"], [4, "LS143", "General Controller"], [6, "LS069WH", "CUBE Clicker"], [1, "LS101GS", "Cerradura Classic"], [1, "C100", "Cerradura C100"]] },
  { id: "signature", name: "Signature", seg: "Ultra-lujo", tipo: "Villa · 740 m² o más", price: 9501, plus: "0.7–4.8 %", m2: 900,
    line: "Diseño dorado, paneles premium, calidad del aire y cerraduras biométricas.",
    top: ["Nature X PRO (calidad del aire)", "Paneles Nature 7 PRO", "BLEND PRO Metal Gold", "Cerraduras C200 y C100"],
    has: ["control", "luz", "clima", "cortinas", "accesos", "red"],
    eq: [[3, "LS082WH", "Smart Station Hub"], [1, "LS280-AQ", "Nature X PRO"], [2, "LS227", "Nature 7 PRO"], [1, "—", "Base de escritorio Nature 7"], [4, "LS218-WH3", "Nature Mini L 3-way"], [3, "LS268-WH2", "Nature Mini PRO 2-way"], [6, "LS240-MD1", "BLEND PRO Metal Gold 1 vía"], [6, "LS240-MD2", "BLEND PRO Metal Gold 2 vías"], [4, "LS240-MD3", "BLEND PRO Metal Gold 3 vías"], [8, "LS240-GR1", "BLEND Switch PRO 1 vía"], [6, "LS240-GR2", "BLEND Switch PRO 2 vías"], [5, "LS268-WT1", "Nature Mini PRO Thermostat"], [3, "LS212", "Central A/C Controller PRO"], [10, "LS235WH", "Motion Sensor Pro"], [5, "LS063WH", "Cube Environmental Sensor"], [6, "LS251WH", "SPOT Mini"], [10, "LS240-WCN", "BLEND Curtain Controller PRO"], [8, "BCM100D", "Quicklink Curtain Motor 3.2 m"], [4, "V2", "Motor tubular 35 mm"], [4, "V2-25", "Motor tubular 25 mm"], [10, "BSD57+", "Smart Plug con monitor"], [6, "LS143", "General Controller"], [10, "LS069WH", "CUBE Clicker"], [1, "LS101GS", "Cerradura Classic"], [2, "C200", "Cerradura C200"], [2, "C100", "Cerradura C100"]] },
];
const kitQty = k => k.eq.reduce((a, b) => a + b[0], 0);

/* Capas de la casa de dos plantas = las 7 soluciones del stand, en el mismo orden */
const LAYER_KEYS = SOL_KEYS;

/* ---------- Dibujo isométrico (común) ---------- */

const C30 = Math.cos(Math.PI / 6);
const NS = "http://www.w3.org/2000/svg";
function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

/* ---------- 02 · Casa de dos plantas (scroll-motion) ----------
   Planta en metros: x = ancho (0–10), y = fondo (0–6,5), z = altura.
   La planta alta flota arriba y a la derecha (despiece) para que ninguna tape a la otra:
   su origen está desplazado (OX, OY, OZ). La escalera queda justo debajo del hueco de la planta alta. */

const S = 36;
const P = (x, y, z = 0) => [(x + y) * C30 * S, ((x - y) * .5 - z) * S];
const pts = arr => arr.map(p => P(...p).map(v => v.toFixed(1)).join(",")).join(" ");
const line = (g, cls, ...p) => el("polyline", { class: cls, points: pts(p), pathLength: 1 }, g);
const poly = (g, cls, ...p) => el("polygon", { class: cls, points: pts(p) }, g);

function box(g, cls, x0, y0, z0, x1, y1, z1) {
  poly(g, cls + " box-top", [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
  poly(g, cls + " box-side", [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
  poly(g, cls + " box-side", [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]);
}
function ring(g, cls, x, y, z, r) {
  const n = 28, p = [];
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; p.push([x + Math.cos(a) * r, y + Math.sin(a) * r, z]); }
  return el("polyline", { class: cls, points: pts(p), pathLength: 1 }, g);
}
function label(g, x, y, z, text, dx = 26, dy = -22) {
  const [cx, cy] = P(x, y, z);
  const l = el("g", { class: "lbl" }, g);
  el("line", { x1: cx, y1: cy, x2: cx + dx, y2: cy + dy }, l);
  const t = el("text", { x: cx + dx + (dx >= 0 ? 6 : -6), y: cy + dy + 4, "text-anchor": dx >= 0 ? "start" : "end" }, l);
  t.textContent = text;
}
function dot(g, x, y, z, big) {
  const [cx, cy] = P(x, y, z);
  const d = el("g", { class: "dev", style: `transform-origin:${cx}px ${cy}px` }, g);
  el("circle", { class: "dev-halo", cx, cy, r: big ? 13 : 9 }, d);
  el("circle", { class: "dev-core", cx, cy, r: big ? 4.5 : 3.2 }, d);
  return d;
}

function buildIso(svg) {
  const W = 10, D = 6.5, H = 2.6, zc = H - .1;
  const OX = 3.23, OY = 3.23, OZ = 7.4;                       // desplazamiento de la planta alta
  const u = (x, y, z = 0) => [x + OX, y + OY, z + OZ];         // coordenadas de la planta alta → mundo
  const U = arr => arr.map(p => u(...p));

  // Placa de una planta: losa, suelo, retícula, muros del fondo y muros cortados al frente
  function plate(g, o) {
    poly(g, "slab", o(0, 0, -.3), o(W, 0, -.3), o(W, 0, 0), o(0, 0, 0));
    poly(g, "slab", o(W, 0, -.3), o(W, D, -.3), o(W, D, 0), o(W, 0, 0));
    poly(g, "floor", o(0, 0, 0), o(W, 0, 0), o(W, D, 0), o(0, D, 0));
    for (let x = 1; x < W; x++) line(g, "grid", o(x, 0, 0), o(x, D, 0));
    for (let y = 1; y < D; y++) line(g, "grid", o(0, y, 0), o(W, y, 0));
    poly(g, "wall", o(0, D, 0), o(W, D, 0), o(W, D, H), o(0, D, H));
    poly(g, "wall", o(0, 0, 0), o(0, D, 0), o(0, D, H), o(0, 0, H));
    poly(g, "wall cut", o(0, 0, 0), o(W, 0, 0), o(W, 0, .3), o(0, 0, .3));
    poly(g, "wall cut", o(W, 0, 0), o(W, D, 0), o(W, D, .3), o(W, 0, .3));
    line(g, "ceil", o(0, 0, H), o(0, D, H), o(W, D, H));
  }
  const lo = (x, y, z = 0) => [x, y, z];
  const fl = (g, txt, at, dx, dy) => {
    const [x, y] = P(...at);
    el("text", { class: "flr", x: x + dx, y: y + dy, "text-anchor": "end" }, g).textContent = txt;
  };

  /* Planta baja: acceso, cocina, comedor, sala y escalera */
  const base = el("g", { class: "iso-base" }, svg);
  plate(base, lo);
  poly(base, "door", [0, 4, 0], [0, 5, 0], [0, 5, 2.1], [0, 4, 2.1]);
  const f = el("g", { class: "iso-furn" }, svg);
  box(f, "furn", .3, 5.9, 0, 3.6, D, .9);                // cocina
  box(f, "furn", .3, 6.2, 1.5, 3.6, D, 2.1);             // gabinetes altos
  box(f, "furn", 1.2, 3.8, 0, 3, 4.6, .92);              // isla
  box(f, "furn", 1, 1.2, .7, 2.6, 2.4, .76);             // comedor
  box(f, "furn", 4.6, 1, 0, 7.4, 1.8, .75);              // sofá
  box(f, "furn", 4.8, 6.1, 0, 7.2, D, .5);               // mueble TV
  box(f, "furn", 5.1, 6.42, .8, 6.9, D, 1.6);            // TV
  for (let i = 0; i < 8; i++) box(f, "furn", 8.2, 3.4 + i * .375, 0, 9.8, 3.4 + (i + 1) * .375, (i + 1) * H / 8);   // escalera
  fl(base, "PLANTA BAJA", [0, 0, 0], -16, 4);

  /* Planta alta: dos dormitorios, pasillo con el hueco de la escalera y balcón */
  plate(base, u);
  poly(base, "wall", ...U([[4.8, 2.6, 0], [4.8, D, 0], [4.8, D, H], [4.8, 2.6, H]]));
  poly(base, "wall", ...U([[6.8, 2.6, 0], [6.8, D, 0], [6.8, D, H], [6.8, 2.6, H]]));
  poly(base, "wall cut", ...U([[0, 2.6, 0], [4.8, 2.6, 0], [4.8, 2.6, .3], [0, 2.6, .3]]));
  poly(base, "wall cut", ...U([[6.8, 2.6, 0], [W, 2.6, 0], [W, 2.6, .3], [6.8, 2.6, .3]]));
  poly(base, "void", ...U([[4.97, .17, .01], [6.57, .17, .01], [6.57, 3.17, .01], [4.97, 3.17, .01]]));   // hueco de escalera
  const bu = (x0, y0, z0, x1, y1, z1) => box(f, "furn", x0 + OX, y0 + OY, z0 + OZ, x1 + OX, y1 + OY, z1 + OZ);
  bu(.6, 3.9, 0, 2.8, 6.2, .5);                           // cama A
  bu(2.95, 5.7, 0, 3.45, 6.2, .5);                        // mesa de noche A
  bu(7.4, 3.9, 0, 9.6, 6.2, .5);                          // cama B
  bu(6.95, 5.7, 0, 7.3, 6.2, .5);                         // mesa de noche B
  bu(W, .4, 0, W + 1.4, 2.6, .12);                        // balcón
  line(f, "rail", ...U([[W, .4, .12], [W + 1.4, .4, .12], [W + 1.4, .4, 1.1], [W, .4, 1.1]]));
  line(f, "rail", ...U([[W + 1.4, .4, 1.1], [W + 1.4, 2.6, 1.1], [W + 1.4, 2.6, .12]]));
  fl(base, "PLANTA ALTA", u(0, 0, 0), -16, 4);

  // La escalera sube por un mismo eje: líneas guía entre la planta baja y el hueco de la planta alta
  [[8.2, 6.4], [9.8, 6.4]].forEach(([x, y]) => line(base, "guide", [x, y, H], [x, y, OZ]));

  // Capas (en orden del recorrido)
  const L = {};
  const layer = k => (L[k] = el("g", { class: "iso-layer", "data-layer": k }, svg));

  // 01 Control y voz: panel Nature junto a la entrada + Smart Station en la cocina; Nature X en la mesa de noche
  let g = layer("control");
  poly(g, "panel", [0, 3.3, 1.15], [0, 3.9, 1.15], [0, 3.9, 1.45], [0, 3.3, 1.45]);
  line(g, "wire", [0, 3.6, 1.3], [0, 3.6, zc], [0, 6.2, zc], [.9, 6.2, zc], [.9, 6.2, .95]);
  ring(g, "wave", .9, 6.2, .95, .9); ring(g, "wave w2", .9, 6.2, .95, 1.6);
  dot(g, 0, 3.6, 1.3, true); dot(g, .9, 6.2, .95);
  label(g, 0, 3.6, 1.3, "PANEL NATURE", -30, 26);
  box(g, "unit", ...u(7.02, 5.84, .5), ...u(7.24, 6.06, .62));
  ring(g, "wave", ...u(7.13, 5.95, .62), .8); ring(g, "wave w2", ...u(7.13, 5.95, .62), 1.5);
  dot(g, ...u(7.13, 5.95, .62), true);
  label(g, ...u(7.13, 5.95, .62), "NATURE X", 30, -26);

  // 02 Iluminación: un bus por el cielo raso en cada planta; sube por la escalera
  g = layer("luz");
  const lightsLo = [[1.8, 5.2], [2, 1.8], [3.6, 3], [5.4, 4.6], [6.2, 1.6]];
  line(g, "wire", [0, 2.8, 1.2], [0, 2.8, zc], [0, 3, zc], [9, 3, zc], [9, 6.4, zc], [9, 6.4, OZ + zc]);
  lightsLo.forEach(([x, y]) => line(g, "wire", [x, 3, zc], [x, y, zc]));
  lightsLo.forEach(([x, y]) => { ring(g, "pool", x, y, 0, .7); dot(g, x, y, zc); });
  const lightsUp = [[1.8, 5], [8.4, 5], [2.8, 1.2], [8.4, 1.2]];
  line(g, "wire", ...U([[5.77, 3.17, zc], [1.8, 3.17, zc]]));
  line(g, "wire", ...U([[5.77, 3.17, zc], [8.4, 3.17, zc]]));
  lightsUp.forEach(([x, y]) => line(g, "wire", ...U([[x, 3.17, zc], [x, y, zc]])));
  lightsUp.forEach(([x, y]) => { ring(g, "pool", ...u(x, y, 0), .7); dot(g, ...u(x, y, zc)); });
  dot(g, 0, 2.8, 1.2);
  label(g, 0, 2.8, 1.2, "BLEND", -30, 28);

  // 03 Climatización: sala abajo, un equipo por dormitorio arriba
  g = layer("clima");
  const ac = (o, x) => {
    box(g, "unit", ...o(x, 6.25, 2.05), ...o(x + 1.4, D, 2.4));
    [-.3, .3].forEach(d => line(g, "air", o(x + .7 + d, 6.1, 1.95), o(x + .7 + d * 1.2, 5, 1.55), o(x + .7 + d * 1.4, 4, 1.25)));
    dot(g, ...o(x + .7, 6.3, 2.22));
  };
  ac(lo, 5.2); ac(u, 1); ac(u, 7.8);
  label(g, ...u(8.5, 6.3, 2.22), "A/C POR ZONAS", 28, -26);

  // 04 Cortinas: ventanal de la sala (abajo) y del dormitorio B (arriba)
  g = layer("cortinas");
  line(g, "track", [4.2, 0, H - .15], [8, 0, H - .15]);
  for (let x = 4.4; x <= 5.8; x += .35) line(g, "fold", [x, 0, H - .2], [x + .06, 0, .35]);
  line(g, "track", ...U([[W, 3, H - .15], [W, 6, H - .15]]));
  for (let y = 4.6; y <= 5.9; y += .35) line(g, "fold", ...U([[W, y, H - .2], [W, y + .06, .35]]));
  dot(g, 8, 0, H - .15); dot(g, ...u(W, 3, H - .15));
  label(g, 8, 0, H - .15, "MOTOR DE CORTINA", 30, 30);

  // 05 Accesos: cerradura C100 en la entrada + sensor en la puerta del balcón
  g = layer("accesos");
  poly(g, "door-on", [0, 4, 0], [0, 5, 0], [0, 5, 2.1], [0, 4, 2.1]);
  line(g, "path", [.4, 4.5, 0], [4.1, 4.5, 0], [4.1, 2.4, 0]);
  dot(g, 0, 4.15, 1.05, true); dot(g, ...u(W, 1.5, 1.1));
  label(g, 0, 4.15, 1.05, "CERRADURA C100", -30, 28);

  // 06 Cámaras: interior en la sala, exterior en el balcón
  g = layer("camaras");
  poly(g, "cone", [.25, .25, 2.45], [3.4, 1, 0], [1.4, 3.2, 0]);
  poly(g, "cone", ...U([[W + 1.25, 2.5, 2.2], [W + .2, .5, .12], [W + 1.3, .5, .12]]));
  dot(g, .25, .25, 2.45, true); dot(g, ...u(W + 1.25, 2.5, 2.2));
  label(g, .25, .25, 2.45, "CÁMARA INTERIOR", -30, -24);

  // 07 Red: gabinete abajo, Wi-Fi en cada planta y cableado que sube por la escalera
  g = layer("red");
  box(g, "unit", .35, 5.05, 0, .9, 5.6, 1.1);
  line(g, "wire net", [.62, 5.3, 1.1], [.62, 5.3, H - .02], [4.6, 5.3, H - .02], [4.6, 3.2, H - .02]);
  line(g, "wire net", [4.6, 5.3, H - .02], [9.3, 5.3, H - .02], [9.3, 6.4, H - .02], [9.3, 6.4, OZ + H - .02]);
  line(g, "wire net", ...U([[6.07, 3.17, H - .02], [6.07, 5.2, H - .02], [5.8, 5.2, H - .02]]));
  [[lo, 4.6, 3.2], [u, 5.8, 5.2]].forEach(([o, x, y]) => {
    ring(g, "wave", ...o(x, y, H - .02), 1.3); ring(g, "wave w2", ...o(x, y, H - .02), 2.3);
    dot(g, ...o(x, y, H - .02), true);
  });
  dot(g, .62, 5.3, 1.1);
  label(g, ...u(5.8, 5.2, H - .02), "WI-FI EN CADA PLANTA", 30, -30);

  // Encuadre: viewBox ajustado al dibujo
  const bb = svg.getBBox(), pad = 28;
  svg.setAttribute("viewBox", `${(bb.x - pad).toFixed(0)} ${(bb.y - pad).toFixed(0)} ${(bb.width + pad * 2).toFixed(0)} ${(bb.height + pad * 2).toFixed(0)}`);
  return LAYER_KEYS.map(k => L[k]);
}

/* Prototipo isométrico del inmueble: se arma por niveles y por soluciones.
   Coordenadas en metros; el viewBox se adapta con una transición suave. */
const Q = (x, y, z = 0) => [(x + y) * C30, (x - y) * .5 - z];
const qp = arr => arr.map(p => Q(...p).map(v => v.toFixed(2)).join(",")).join(" ");

function makeProto(svg) {
  let vb = null, anim = 0, prev = { tipo: null, lv: 0, sols: [] };

  const setVB = target => {
    if (!vb || reduceMotion) { vb = target; svg.setAttribute("viewBox", vb.join(" ")); return; }
    const from = vb.slice(), t0 = performance.now();
    cancelAnimationFrame(anim);
    const step = now => {
      const k = Math.min(1, (now - t0) / 420), e = 1 - Math.pow(1 - k, 3);
      vb = from.map((v, i) => v + (target[i] - v) * e);
      svg.setAttribute("viewBox", vb.map(v => v.toFixed(2)).join(" "));
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  };

  return function render(s) {
    const T = TYPES[s.tipo].proto || TYPES[s.tipo];   // la torre usa su superficie total de referencia
    const A = s.m2 / s.lv, W = Math.sqrt(A * T.ratio), D = A / W, fh = T.fh, Ht = s.lv * fh;
    const ref = Math.sqrt(T.m2[3] / T.lv[2] * T.ratio);           // tamaño de referencia del tipo: marcadores constantes
    const m = ref / 26;                                             // unidad de marcador
    const typeChanged = prev.tipo !== s.tipo;
    svg.textContent = "";
    const g = (cls, parent = svg, style) => el("g", style ? { class: cls, style } : { class: cls }, parent);
    const pg = (p, cls, ...a) => el("polygon", { class: cls, points: qp(a) }, p);
    const pl = (p, cls, ...a) => el("polyline", { class: cls, points: qp(a) }, p);
    const cir = (p, cls, x, y, z, r) => { const [cx, cy] = Q(x, y, z); return el("circle", { class: cls, cx, cy, r }, p); };
    const ell = (p, cls, x, y, z, r) => { const a = []; for (let i = 0; i <= 24; i++) { const t = i / 24 * Math.PI * 2; a.push([x + Math.cos(t) * r, y + Math.sin(t) * r, z]); } return pl(p, cls, ...a); };

    // Terreno (villa/finca) o huella en el suelo
    const ground = g("p-ground");
    const mg = T.lot ? Math.max(W, D) * .55 : Math.max(W, D) * .12;
    pg(ground, T.lot ? "p-lot" : "p-shadow", [-mg, -mg, 0], [W + mg, -mg, 0], [W + mg, D + mg, 0], [-mg, D + mg, 0]);
    if (T.lot) [[-mg * .55, D * .3], [-mg * .5, D * .85], [W + mg * .5, D * .2], [W * .3, D + mg * .6], [W * .8, D + mg * .5]]
      .forEach(([x, y]) => { ell(ground, "p-tree", x, y, 0, m * 2.4); cir(ground, "p-tree-c", x, y, 0, m * .5); });

    // Niveles: placa + caras de vidrio + aristas; los nuevos entran desde arriba
    const many = s.lv > 12;
    for (let i = 0; i < s.lv; i++) {
      const z0 = i * fh, z1 = z0 + fh, isNew = !typeChanged && i >= prev.lv;
      const fg = g("p-floor" + (isNew ? " is-new" : ""), svg, `--d:${isNew ? (i - prev.lv) * 70 : 0}ms`);
      pg(fg, "p-plate", [0, 0, z0], [W, 0, z0], [W, D, z0], [0, D, z0]);
      pg(fg, "p-face", [0, 0, z0], [W, 0, z0], [W, 0, z1], [0, 0, z1]);
      pg(fg, "p-face p-face-r", [W, 0, z0], [W, D, z0], [W, D, z1], [W, 0, z1]);
      if (!many) {
        pl(fg, "p-band", [0, 0, z0 + fh * .82], [W, 0, z0 + fh * .82], [W, D, z0 + fh * .82]);
        pl(fg, "p-edge", [0, D, z0], [0, D, z1]);
      }
    }
    const roof = g("p-roof");
    pg(roof, "p-top", [0, 0, Ht], [W, 0, Ht], [W, D, Ht], [0, D, Ht]);
    pl(roof, "p-edge", [0, 0, 0], [0, 0, Ht]); pl(roof, "p-edge", [W, 0, 0], [W, 0, Ht]); pl(roof, "p-edge", [W, D, 0], [W, D, Ht]);

    // Soluciones dibujadas sobre el inmueble (cada una con su forma; las nuevas se encienden)
    const every = many ? Math.ceil(s.lv / 10) : 1;          // en torres altas, una muestra por cada pocos pisos
    const floors = [...Array(s.lv).keys()].filter(i => i % every === 0 || i === s.lv - 1);
    const sol = k => g("p-sol p-" + k + (!typeChanged && !prev.sols.includes(k) ? " is-new" : ""));
    const on = k => s.sols.includes(k);

    if (on("luz")) {
      const sg = sol("luz"), nx = clamp(Math.round(W / (ref / 3)), 2, 5), ny = clamp(Math.round(D / (ref / 3)), 2, 4);
      floors.forEach(i => { for (let a = 1; a <= nx; a++) for (let b = 1; b <= ny; b++)
        cir(sg, "p-dot", W * a / (nx + 1), D * b / (ny + 1), i * fh + .05, m * .55); });
    }
    if (on("clima")) {
      const sg = sol("clima");
      floors.forEach(i => { const z = i * fh + fh * .78;
        pg(sg, "p-unit", [W * .45, D, z], [W * .45 + m * 3, D, z], [W * .45 + m * 3, D, z + m * .9], [W * .45, D, z + m * .9]);
        [-1, 1].forEach(d => pl(sg, "p-air", [W * .45 + m * 1.5 + d * m * .6, D - m * .3, z - m * .2], [W * .45 + m * 1.5 + d * m, D - m * 3, z - m * 1.6])); });
    }
    if (on("cortinas")) {
      const sg = sol("cortinas");
      floors.forEach(i => { const z = i * fh + fh * .8;
        pl(sg, "p-track", [W * .12, 0, z], [W * .58, 0, z]);
        for (let a = 0; a < 5; a++) pl(sg, "p-fold", [W * .12 + a * m * .7, 0, z], [W * .12 + a * m * .7, 0, i * fh + fh * .15]); });
    }
    if (on("musica")) {
      const sg = sol("musica");
      floors.forEach(i => { const z = i * fh + .02; [1, 1.9, 2.8].forEach(r => ell(sg, "p-wave", W * .68, D * .4, z, m * r)); });
    }
    if (on("accesos")) {
      const sg = sol("accesos"), dw = Math.max(1, m * 1.6), dh = Math.min(fh * .75, 2.4);
      pg(sg, "p-door", [W * .78, 0, 0], [W * .78 + dw, 0, 0], [W * .78 + dw, 0, dh], [W * .78, 0, dh]);
      if (s.seg === "negocio") floors.forEach(i => cir(sg, "p-dot", W * .9, D * .15, i * fh + fh * .4, m * .55));
    }
    if (on("alarma")) {
      const sg = sol("alarma");
      floors.forEach(i => { cir(sg, "p-ring", W * .08, D * .9, i * fh + fh * .6, m * .9); cir(sg, "p-dot", W * .08, D * .9, i * fh + fh * .6, m * .35); });
      cir(sg, "p-siren", W, 0, Math.min(fh * .85, 2.6), m * 1.1);
    }
    if (on("camaras")) {
      const sg = sol("camaras"), c = m * 4.5;
      pg(sg, "p-cone", [W, 0, Math.min(fh, 3) * .9], [W + c, -c * .3, 0], [W + c * .3, -c, 0]);
      pg(sg, "p-cone", [0, 0, Math.min(fh, 3) * .9], [-c * .3, -c, 0], [-c, -c * .3, 0]);
      if (s.lv > 2) pg(sg, "p-cone", [W, D, Ht], [W + c, D + c * .2, Ht - c * .6], [W + c * .2, D + c, Ht - c * .6]);
    }
    if (on("red")) {
      const sg = sol("red");
      pl(sg, "p-riser", [W * .15, D * .82, 0], [W * .15, D * .82, Ht]);
      floors.forEach(i => ell(sg, "p-wave", W * .15, D * .82, i * fh + fh * .9, m * 2));
    }
    if (on("control")) {
      const sg = sol("control");
      pg(sg, "p-unit", [W * .3, 0, 1], [W * .3 + m * 1.4, 0, 1], [W * .3 + m * 1.4, 0, 1 + m * 1.8], [W * .3, 0, 1 + m * 1.8]);
      [1.6, 2.8].forEach(r => ell(sg, "p-wave", W * .32, D * .55, .02, m * r));
      cir(sg, "p-dot", W * .32, D * .55, .02, m * .6);
    }
    if (on("energia")) {
      const sg = sol("energia"), cols = clamp(Math.round(W / (ref / 4)), 2, 6), rows = clamp(Math.round(D / (ref / 4)), 2, 4);
      const pw = W * .6 / cols, pd = D * .55 / rows;
      for (let a = 0; a < cols; a++) for (let b = 0; b < rows; b++) {
        const x = W * .2 + a * pw, y = D * .22 + b * pd;
        pg(sg, "p-solar", [x, y, Ht + .05], [x + pw * .86, y, Ht + .05], [x + pw * .86, y + pd * .82, Ht + .05], [x, y + pd * .82, Ht + .05]);
      }
    }

    // Encuadre: lo que se ve ahora ∪ el tamaño de referencia del tipo (para que crecer se note)
    const box3 = (w, d, h, mgn) => [[-mgn, -mgn, 0], [w + mgn, -mgn, 0], [w + mgn, d + mgn, 0], [-mgn, d + mgn, 0], [0, 0, h], [w, 0, h], [w, d, h], [0, d, h]];
    const refD = T.m2[3] / T.lv[2] / ref;
    const all = [...box3(W, D, Ht, mg + m * 5), ...box3(ref, refD, T.lv[2] * fh, ref * .25)].map(p => Q(...p));
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = (x1 - x0) * .06;
    setVB([x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2]);

    prev = { tipo: s.tipo, lv: s.lv, sols: s.sols.slice() };
  };
}

/* ---------- 2 · Kits: tarjetas + comparativa ---------- */

let pickKit = () => {};   // la define la calculadora
function initKits() {
  const root = $("[data-kits]"); if (!root) return;
  root.innerHTML = KITS.map((k, n) => `
    <article class="kit${n === 2 ? " is-featured" : ""}">
      <figure class="kit-img"><img src="Assets/kits/kit_${k.id}.webp" alt="Equipos del kit ${k.name}" loading="lazy" width="900" height="400"></figure>
      <div class="kit-body">
        <p class="kicker">${k.seg}</p>
        <h3 class="kit-name">Kit ${k.name}</h3>
        <p class="kit-price">US$${k.price.toLocaleString("en-US")}<small>precio de referencia</small></p>
        <p class="kit-tipo">${k.tipo}</p>
        <ul class="kit-inc">${k.top.map(t => `<li><svg class="i" aria-hidden="true"><use href="#i-check"/></svg>${t}</li>`).join("")}</ul>
        <p class="kit-plus">Plusvalía percibida est.<sup>1</sup> <b>${k.plus}</b></p>
        <button class="btn btn-block btn-ghost" type="button" data-kit="${k.id}" data-track="kit_calcular_${k.id}">Calcular con este kit</button>
      </div>
    </article>`).join("");
  root.addEventListener("click", e => { const b = e.target.closest("[data-kit]"); if (b) pickKit(b.dataset.kit); });

  // Comparativa completa
  const mk = on => on ? `<span class="mk mk-on" aria-hidden="true"></span><span class="sr">Incluido</span>` : `<span class="mk mk-off" aria-hidden="true"></span><span class="sr">No incluido</span>`;
  $("[data-compare]").innerHTML = `
    <caption class="sr">Comparativa de los 5 kits</caption>
    <thead><tr><th scope="col"><span class="sr">Concepto</span></th>${KITS.map(k => `<th scope="col"><span class="lvl">${k.name}</span><span class="lvl-d">${k.seg}</span></th>`).join("")}</tr></thead>
    <tbody>
      <tr><th scope="row">Proyecto</th>${KITS.map(k => `<td>${k.tipo}</td>`).join("")}</tr>
      <tr><th scope="row">Precio de referencia</th>${KITS.map(k => `<td><b>US$${k.price.toLocaleString("en-US")}</b></td>`).join("")}</tr>
      <tr><th scope="row">Plusvalía percibida est.<sup>1</sup></th>${KITS.map(k => `<td>${k.plus}</td>`).join("")}</tr>
      ${SOL_KEYS.map(s => `<tr><th scope="row"><span class="th-in"><svg class="i" aria-hidden="true"><use href="#i-${SOLS[s].icon}"/></svg>${SOLS[s].name}</span></th>${KITS.map(k => `<td>${s === "camaras" ? `<span class="mk-txt">Aparte</span>` : mk(k.has.includes(s))}</td>`).join("")}</tr>`).join("")}
      <tr><th scope="row">Equipos incluidos</th>${KITS.map(k => `<td>${kitQty(k)}</td>`).join("")}</tr>
    </tbody>`;
  $("[data-kit-lists]").innerHTML = KITS.map(k => `
    <details class="kit-list"><summary>Equipo completo · Kit ${k.name} <span>${kitQty(k)} equipos</span><svg class="i" aria-hidden="true"><use href="#i-plus"/></svg></summary>
      <ul>${k.eq.map(([q, c, n]) => `<li><b>${q}×</b> ${n} <code>${c}</code></li>`).join("")}</ul></details>`).join("");
}

/* ---------- 3 · Calculadora: tipo → tamaño → soluciones; el precio sale del kit que cubre lo elegido ---------- */

const TYPES = {
  apartamento: { name: "Apartamento", seg: "hogar",   m2: [40, 400, 10, 120],  lv: [1, 1, 1],  ratio: 1.5, fh: 3,   reco: ["control", "luz", "clima", "red"], f: 1,
                 note: "Precio por apartamento." },
  torre:       { name: "Torre",       seg: "hogar",   m2: [40, 300, 10, 90],   lv: [1, 75, 10], ratio: 1.3, fh: 3,   reco: ["control", "luz", "clima", "red"], f: 1, units: true,
                 proto: { m2: [0, 0, 0, 3600], lv: [1, 75, 10], ratio: 1.3, fh: 3 },   // referencia del dibujo: 40 apartamentos de 90 m²
                 note: "Se calcula por unidad y se multiplica por la cantidad de apartamentos." },
  villa:       { name: "Villa",       seg: "hogar",   m2: [150, 2000, 10, 480], lv: [1, 3, 2],  ratio: 1.8, fh: 3.2, reco: ["control", "luz", "clima", "cortinas", "accesos", "red"], f: 1, lot: true,
                 note: "Incluye el perímetro del terreno." },
  comercio:    { name: "Comercio",    seg: "negocio", m2: [30, 10000, 10, 300], lv: [1, 10, 1], ratio: 1.6, fh: 3.4, reco: ["control", "luz", "clima", "accesos", "camaras", "red"], f: 1.1,
                 note: "Oficinas, locales, hoteles, galpones y edificios corporativos." },
};
const nivelTxt = n => `${n} ${n === 1 ? "nivel" : "niveles"}`;

function estimate(s) {
  const T = TYPES[s.tipo], priced = s.sols.filter(k => SOLS[k].from !== null);
  if (!priced.length) return null;
  // el kit elegido en «Calcular con este kit» manda; si no, el menor kit que cubre las soluciones
  const kit = s.kit ? KITS.find(k => k.id === s.kit) : KITS[Math.max(...priced.map(k => SOLS[k].from))];
  const m2u = s.m2, factor = clamp(Math.pow(m2u / kit.m2, .8), .8, 4);     // más metros → más equipos
  let unit = kit.price * factor * T.f, total = unit, units = 1;
  if (T.units) { units = s.units; const vol = units >= 100 ? .85 : units >= 50 ? .9 : units >= 20 ? .95 : 1; total = unit * units * vol; }
  return { kit, unit, units, lo: total * .9, hi: total * 1.15, m2Total: m2u * units };
}
const describe = s => TYPES[s.tipo].units ? `Torre · ${s.units} apartamentos de ${s.m2} m²` : `${TYPES[s.tipo].name} · ${s.m2.toLocaleString("es-DO")} m²${s.lv > 1 ? " · " + nivelTxt(s.lv) : ""}`;

let calcState = null;
function initCalc() {
  const form = $("[data-calc-form]"); if (!form) return;
  const m2 = form.m2, lv = form.niveles, un = form.unidades;
  const bubbles = $("[data-bubbles]"), reco = $("[data-reco]"), legend = $("[data-legend]");
  const range = $("[data-sum-range]"), unit = $("[data-sum-unit]"), kitBadge = $("[data-kit-badge]");
  const render = makeProto($("[data-proto]"));
  let selected = new Set(TYPES.apartamento.reco), forcedKit = null;   // forcedKit: kit elegido desde su tarjeta

  // Precio siempre visible en celular: una píldora fija arriba mientras se llena
  const pin = document.createElement("div"); pin.className = "calc-pin"; pin.setAttribute("aria-hidden", "true"); form.prepend(pin);

  bubbles.innerHTML = SOL_KEYS.map(k => `
    <button type="button" class="bubble" data-solb="${k}" aria-pressed="false">
      <svg class="i" aria-hidden="true"><use href="#i-${SOLS[k].icon}"/></svg>${SOLS[k].name}<span class="bubble-reco" aria-hidden="true"></span>
    </button>`).join("");

  const setType = (tipo, keep) => {
    const T = TYPES[tipo];
    [m2.min, m2.max, m2.step] = T.m2.slice(0, 3); if (!keep) m2.value = T.m2[3];
    [lv.min, lv.max] = T.lv.slice(0, 2); if (!keep) lv.value = T.lv[2];
    $("[data-levels]").hidden = T.lv[0] === T.lv[1] || !!T.units;
    $("[data-units]").hidden = !T.units;
    $("[data-m2-label]").textContent = T.units ? "Metros por apartamento" : "Metros cuadrados";
    $("[data-type-note]").textContent = T.note;
    if (!keep) selected = new Set(T.reco);
  };
  const read = () => {
    const tipo = form.tipo.value, T = TYPES[tipo];
    return { kit: forcedKit, tipo, seg: T.seg, m2: +m2.value, lv: T.units ? Math.max(1, Math.ceil(+un.value / 4)) : +lv.value, units: T.units ? +un.value : 1, sols: SOL_KEYS.filter(k => selected.has(k)) };
  };

  const update = () => {
    const s = read(), T = TYPES[s.tipo], e = estimate(s);
    $("[data-out-m2]").textContent = s.m2.toLocaleString("es-DO") + " m²";
    $("[data-out-lv]").textContent = s.lv;
    $("[data-out-units]").textContent = s.units;
    $$(".bubble", bubbles).forEach(b => { const k = b.dataset.solb; b.setAttribute("aria-pressed", String(selected.has(k))); b.classList.toggle("is-reco", T.reco.includes(k)); });
    reco.innerHTML = `<span class="reco-dot" aria-hidden="true"></span>Con punto: las recomendadas para ${T.name.toLowerCase()}.`;
    if (e) {
      range.textContent = rangeTxt(e.lo, e.hi);
      unit.textContent = T.units ? `${s.units} apartamentos · ≈ ${money(e.unit)} cada uno` : `≈ US$ ${Math.round(e.lo / s.m2)}–${Math.round(e.hi / s.m2)} por m² · equipos e instalación`;
      kitBadge.innerHTML = `Kit sugerido: <b>${e.kit.name}</b> · plusvalía percibida est. ${e.kit.plus}`;
      pin.innerHTML = `<span>Estimado</span><b>${rangeTxt(e.lo, e.hi)}</b>`;
    } else {
      range.textContent = "US$ —"; unit.textContent = "Elige al menos una solución"; kitBadge.textContent = ""; pin.innerHTML = `<span>Estimado</span><b>US$ —</b>`;
    }
    legend.innerHTML = s.sols.map(k => `<li><svg class="i" aria-hidden="true"><use href="#i-${SOLS[k].icon}"/></svg><span>${SOLS[k].name}<em>${SOLS[k].key}</em></span></li>`).join("") || `<li class="is-empty">Toca una solución para empezar.</li>`;
    $("[data-open-lead]").disabled = !e;
    // El prototipo isométrico se dibuja con la superficie total (en torre: unidades × m²)
    render({ tipo: s.tipo, seg: s.seg, m2: e ? e.m2Total : s.m2 * s.units, lv: s.lv, sols: s.sols });
    calcState = { ...s, est: e };
  };

  form.addEventListener("change", e => { if (e.target.name === "tipo") { forcedKit = null; setType(e.target.value); track("calc_tipo", { tipo: e.target.value }); } update(); });
  form.addEventListener("input", e => { if (e.target.type === "range") update(); });
  bubbles.addEventListener("click", e => { const b = e.target.closest("[data-solb]"); if (!b) return; const k = b.dataset.solb; forcedKit = null; selected.has(k) ? selected.delete(k) : selected.add(k); track("calc_solucion", { solucion: k }); update(); });

  // «Calcular con este kit»: precarga tipo, metros y las soluciones que cubre el kit
  pickKit = id => {
    const k = KITS.find(x => x.id === id), tipo = k.m2 >= 345 ? "villa" : "apartamento";
    form.tipo.value = tipo; setType(tipo); m2.value = clamp(k.m2, +m2.min, +m2.max);
    selected = new Set(k.has); forcedKit = k.id; update();
    $("#calculadora").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };

  setType("apartamento"); update();
  initLead(() => calcState);
}

/* ---------- Cotización: guarda en el Google Sheet y abre WhatsApp ---------- */

function folio() {
  const d = new Date(), yymm = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0");
  return `JM-CM${yymm}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
async function saveLead(lead) {
  try { const all = JSON.parse(localStorage.getItem(CONFIG.storageKey) || "[]"); all.push(lead); localStorage.setItem(CONFIG.storageKey, JSON.stringify(all)); } catch (e) { /* sin almacenamiento */ }
  if (!CONFIG.leadsEndpoint) return { ok: true, demo: true };
  try { await fetch(CONFIG.leadsEndpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(lead) }); return { ok: true }; }
  catch (e) { return { ok: false }; }
}
function initLead(getState) {
  const lead = $("[data-lead]"), sum = $("[data-lead-sum]"), thanks = $("[data-thanks]"), err = $("[data-lead-err]");
  $("[data-open-lead]").addEventListener("click", () => {
    const s = getState(); if (!s.est) return;
    lead.hidden = false; thanks.hidden = true;
    sum.textContent = `${describe(s)} · ${s.sols.map(k => SOLS[k].name).join(", ")} · ${rangeTxt(s.est.lo, s.est.hi)}.`;
    lead.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    setTimeout(() => $("input[name=nombre]", lead).focus({ preventScroll: true }), 450);
  });
  lead.addEventListener("submit", e => {
    e.preventDefault();
    let first = null;
    $$("input, select", lead).forEach(el => { const bad = !el.checkValidity(); (el.closest(".f") || el.closest(".check"))?.classList.toggle("is-error", bad); if (bad && !first) first = el; });
    if (first) { err.textContent = "Revisa los campos marcados."; first.focus(); return; }
    err.textContent = "";
    const s = getState(), d = Object.fromEntries(new FormData(lead));
    const r = {
      folio: folio(), fecha: new Date().toISOString(), nombre: d.nombre.trim(), whatsapp: d.whatsapp.trim(), correo: (d.correo || "").trim(), perfil: d.perfil,
      tipo: TYPES[s.tipo].name, m2: s.m2, unidades: s.units, niveles: s.lv, soluciones: s.sols.map(k => SOLS[k].name).join(", "),
      kit: s.est.kit.name, rango: rangeTxt(s.est.lo, s.est.hi), origen: new URLSearchParams(location.search).get("utm_content") || "web",
    };
    const msg = `Hola JM, soy ${r.nombre}. Quiero mi cotización (${r.folio}):\n• ${describe(s)}\n• Soluciones: ${r.soluciones}\n• Kit sugerido: ${r.kit}\n• Estimado: ${r.rango}`;
    // WhatsApp se abre dentro del clic (si no, el navegador lo bloquea); el guardado en el Sheet sigue en segundo plano
    const w = window.open(wa(msg), "_blank", "noopener");
    track("cotizacion_enviada", { kit: r.kit, tipo: r.tipo });
    saveLead(r);
    $("[data-thanks-t]").textContent = `¡Listo, ${r.nombre.split(" ")[0]}! Ya tenemos tu proyecto.`;
    $("[data-thanks-folio]").textContent = r.folio;
    $("[data-thanks-wa]").href = wa(msg);
    lead.hidden = true; thanks.hidden = false;
    thanks.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    thanks.focus({ preventScroll: true });
    if (!w) $("[data-thanks-wa]").classList.add("is-pulse");
  });
  $("[data-thanks-new]").addEventListener("click", () => { thanks.hidden = true; lead.reset(); $("#calculadora").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); });
}

/* ---------- 4 · Soluciones: pestañas 01–07 (carrusel en celular) sobre la casa de dos plantas ---------- */

function initSol() {
  const root = $("[data-sol]"), svg = $("[data-iso]"); if (!root || !svg) return;
  const groups = buildIso(svg);                                    // capas en el orden de LAYER_KEYS
  const tabs = $("[data-sol-tabs]"), cards = $("[data-sol-cards]");
  tabs.innerHTML = SOL_KEYS.map((k, i) => `<button type="button" role="tab" id="tab-${k}" aria-controls="card-${k}" aria-selected="${i === 0}" data-i="${i}"><span class="tab-n">0${i + 1}</span><svg class="i" aria-hidden="true"><use href="#i-${SOLS[k].icon}"/></svg>${SOLS[k].name}</button>`).join("");
  cards.innerHTML = SOL_KEYS.map((k, i) => `
    <article class="sol-card" role="tabpanel" id="card-${k}" aria-labelledby="tab-${k}" data-i="${i}">
      <p class="sol-n">0${i + 1} <span>/ 07</span></p>
      <h3 class="h3"><svg class="i" aria-hidden="true"><use href="#i-${SOLS[k].icon}"/></svg>${SOLS[k].name}</h3>
      <p>${SOLS[k].line}</p>
      <ul class="devices">${SOLS[k].devices.map(d => `<li>${d}</li>`).join("")}</ul>
      <p class="step-meta">${fromLabel(SOLS[k].from)}</p>
    </article>`).join("");
  const tabBtns = $$("button", tabs), cardEls = $$(".sol-card", cards);
  let cur = -1;
  const set = (i, fromScroll) => {
    if (i === cur) return; cur = i;
    tabBtns.forEach((b, n) => { b.setAttribute("aria-selected", String(n === i)); b.tabIndex = n === i ? 0 : -1; });
    cardEls.forEach((c, n) => c.classList.toggle("is-active", n === i));
    groups.forEach((g, n) => { g.style.setProperty("--t", "1"); g.classList.add("is-on"); g.classList.toggle("is-past", n !== i); g.classList.toggle("is-focus", n === i); });
    if (isMobile() && !fromScroll) cards.scrollTo({ left: cardEls[i].offsetLeft - cards.offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
    // solo desplaza la fila de pestañas (nunca la página)
    if (!isMobile()) { const b = tabBtns[i]; if (b.offsetLeft < tabs.scrollLeft || b.offsetLeft + b.offsetWidth > tabs.scrollLeft + tabs.clientWidth) tabs.scrollTo({ left: b.offsetLeft - 16, behavior: "smooth" }); }
  };
  tabs.addEventListener("click", e => { const b = e.target.closest("button"); if (b) { set(+b.dataset.i); track("solucion_tab", { solucion: SOL_KEYS[+b.dataset.i] }); } });
  tabs.addEventListener("keydown", e => { if (!/Arrow(Left|Right)/.test(e.key)) return; const n = (cur + (e.key === "ArrowRight" ? 1 : -1) + 7) % 7; set(n); tabBtns[n].focus(); });
  // Celular: al deslizar las tarjetas cambia la capa encendida
  let t = 0;
  cards.addEventListener("scroll", () => { if (!isMobile()) return; clearTimeout(t); t = setTimeout(() => {
    const x = cards.scrollLeft + cards.clientWidth / 2; let best = 0, d = 1e9;
    cardEls.forEach((c, n) => { const m = Math.abs(c.offsetLeft - cards.offsetLeft + c.offsetWidth / 2 - x); if (m < d) { d = m; best = n; } }); set(best, true); }, 90); }, { passive: true });
  set(0);
}

/* ---------- 5 · Productos: carrusel automático + ficha ---------- */

const PRODUCTS = [
  { id: "naturex_pro", name: "Nature X PRO", code: "LS280", live: true, line: "Controla la casa y mide la calidad del aire.",
    spec: [["Control", "Luz, clima, cortinas y escenas"], ["Aire", "Mide CO2 y PM2.5"], ["Kit", "Signature"]] },
  { id: "nature7_pro", name: "Nature 7 PRO", code: "LS227", line: "Pantalla de pared de 7\" para toda la vivienda.",
    spec: [["Pantalla", "7\" táctil de pared"], ["Control", "Luz, clima, cortinas y escenas"], ["Kits", "Luxury y Signature"]] },
  { id: "nature_mini_pro", name: "Nature Mini PRO", code: "LS268", line: "Panel de 4\" con pantalla en cada ambiente.",
    spec: [["Pantalla", "4\" HD"], ["Uso", "Escenas y control rápido por ambiente"], ["Kits", "Comfort a Signature"]] },
  { id: "blend_gray", name: "BLEND Switch PRO", code: "LS240", live: true, line: "Interruptores de diseño en gris metal o dorado.",
    spec: [["Acabado", "Aluminio anodizado: gris o Metal Gold"], ["Botones", "1 a 3 vías"], ["Luz", "LED de 16 millones de colores"]] },
  { id: "c100", name: "Cerradura C100", code: "C100", live: true, line: "Abre con huella en 0.3 s, código, NFC o celular.",
    spec: [["Apertura", "Huella en 0.3 s, código, tarjeta NFC, app y llave"], ["Usuarios", "Hasta 99"], ["Seguridad", "Alarma antipalanca"]] },
  { id: "cube_motion", name: "CUBE Motion Sensor", code: "LS062", live: true, line: "Enciende luces y escenas al detectar movimiento.",
    spec: [["Tamaño", "38.4 × 38.4 × 22.4 mm"], ["Energía", "Pila de botón CR2450, sin cables"], ["Alcance", "Hasta 100 m en campo abierto"]] },
  { id: "thermostat", name: "Nature Thermostat", code: "LS268-WT1", line: "Reemplaza el control del aire acondicionado.",
    spec: [["Equipos", "FCU, central o VRV"], ["Control", "Horarios, presencia y escenas"], ["Kits", "Comfort a Signature"]] },
  { id: "curtain_motor", name: "Quicklink Curtain Motor", code: "BCM100D", line: "Abre y cierra las cortinas, en silencio.",
    spec: [["Incluye", "Motor, riel de 3.2 m y control"], ["Uso", "Abrir, cerrar y programar"], ["Kits", "Premium a Signature"]] },
  { id: "hub", name: "Smart Station", code: "LS082", line: "El cerebro del sistema: coordina toda la casa.",
    spec: [["Capacidad", "Hasta 500 dispositivos"], ["Alcance", "Hasta 400 m interior / 800 m exterior (CoSS)"], ["Compatible", "Alexa, Google Home y Apple HomeKit"]] },
];
function initProducts() {
  const track_ = $("[data-car-track]"), car = $("[data-car]"); if (!track_) return;
  track_.innerHTML = PRODUCTS.map(p => `
    <li class="pcard">
      <figure class="pcard-img"><img src="Assets/productos/${p.id}.webp" alt="${p.name}" loading="lazy">${p.live ? `<span class="tag-live"><span class="dot" aria-hidden="true"></span>En vivo en el Stand 68</span>` : ""}</figure>
      <h3 class="pcard-name">${p.name}</h3>
      <p class="pcard-line">${p.line}</p>
      <button class="link pcard-more" type="button" data-ficha-open="${p.id}" data-track="ficha_${p.id}">Ver ficha <svg class="i"><use href="#i-arrow"/></svg></button>
    </li>`).join("");
  const items = $$(".pcard", track_);
  const step = () => items[0].offsetWidth + parseFloat(getComputedStyle(track_).columnGap || 16);
  const go = dir => {
    const max = track_.scrollWidth - track_.clientWidth - 2;
    const next = dir > 0 && track_.scrollLeft >= max ? 0 : dir < 0 && track_.scrollLeft <= 2 ? max : track_.scrollLeft + dir * step();
    track_.scrollTo({ left: next, behavior: reduceMotion ? "auto" : "smooth" });
  };
  $("[data-car-prev]").addEventListener("click", () => { go(-1); hold(); });
  $("[data-car-next]").addEventListener("click", () => { go(1); hold(); });
  // Pasa solo cada 4 s; se detiene al pasar el cursor, al tocar o al enfocar
  let timer = 0, held = false, visible = false;
  const loop = () => { clearInterval(timer); if (!reduceMotion && !held && visible) timer = setInterval(() => go(1), 4000); };
  const hold = () => { held = true; clearInterval(timer); clearTimeout(car._r); car._r = setTimeout(() => { held = false; loop(); }, 8000); };
  car.addEventListener("pointerenter", () => { held = true; clearInterval(timer); });
  car.addEventListener("pointerleave", () => { held = false; loop(); });
  car.addEventListener("focusin", () => { held = true; clearInterval(timer); });
  track_.addEventListener("touchstart", hold, { passive: true });
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; loop(); }).observe(car);

  // Ficha técnica
  const dlg = $("[data-ficha]");
  track_.addEventListener("click", e => {
    const b = e.target.closest("[data-ficha-open]"); if (!b) return;
    const p = PRODUCTS.find(x => x.id === b.dataset.fichaOpen);
    $("[data-ficha-img]", dlg).src = `Assets/productos/${p.id}.webp`; $("[data-ficha-img]", dlg).alt = p.name;
    $("[data-ficha-code]", dlg).textContent = `${p.code}${p.live ? " · En vivo en el Stand 68" : ""}`;
    $("[data-ficha-t]", dlg).textContent = p.name;
    $("[data-ficha-line]", dlg).textContent = p.line;
    $("[data-ficha-spec]", dlg).innerHTML = p.spec.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
    $("[data-ficha-wa]", dlg).href = wa(`Hola JM, quiero información sobre ${p.name} (${p.code}).`);
    dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
  });
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
}

/* ---------- 6 · Stand, calendario, WhatsApp y redes ---------- */

function initContact() {
  const visit = $("[data-wa-visit]");
  if (visit) visit.href = wa("Hola JM, quiero agendar una visita al Stand 68 de Construmedia (13–15 nov, Salón Regency).");
  $$("[data-wa]:not([data-thanks-wa]):not([data-ficha-wa])").forEach(a => { if (!a.href.includes("?text=")) a.href = wa("Hola JM, vi la página de LifeSmart × JM y quiero información."); });
  const ig = $("[data-ig-lifesmart]");
  if (ig && CONFIG.igLifeSmart) { ig.href = `https://www.instagram.com/${CONFIG.igLifeSmart}/`; $("[data-ig-lifesmart-handle]", ig).textContent = "@" + CONFIG.igLifeSmart + " (LifeSmart)"; ig.hidden = false; }
  const a = $("[data-ics]"); if (!a) return;
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//JM Security System//Construmedia 2026//ES",
    "BEGIN:VEVENT", "UID:construmedia2026-stand68@jmsecuritysystem.com", "DTSTAMP:20261103T000000Z",
    "DTSTART;VALUE=DATE:20261113", "DTEND;VALUE=DATE:20261116",
    "SUMMARY:LifeSmart × JM · Stand 68 · Construmedia 2026",
    "LOCATION:Salón Regency\\, Hotel Dominican Fiesta\\, Santo Domingo",
    "DESCRIPTION:Stand 68\\, fila superior del Salón Regency. Domótica LifeSmart en vivo. WhatsApp JM: (809) 475-2210.",
    "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  a.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
  a.download = "Construmedia2026_Stand68.ics";
}

function initReveal() {
  const els = $$(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("is-in")); return; }
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -10% 0px" });
  els.forEach(e => io.observe(e));
}

initTracking(); initHeader(); initHero(); initKits(); initCalc(); initSol(); initProducts(); initContact(); initReveal();
