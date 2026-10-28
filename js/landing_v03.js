/* JM × LifeSmart · Landing Construmedia 2026 · v03
   JS vanilla con mejora progresiva: sin JS el contenido se lee completo.
   PRECIOS y CONTACTO = datos de ejemplo para el prototipo (validar con JM antes de publicar). */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Configuración ---------- */

const CONFIG = {
  // Base de datos de leads. Vacío = modo demo (se guardan en este navegador; ver Recursos/leads_demo.html).
  // Con la URL del Apps Script (Recursos/backend_google_sheets) cada cotización se guarda en Google Sheets
  // y el cliente recibe su cotización por correo.
  leadsEndpoint: "",
  storageKey: "jm_leads_v1",
  whatsappJM: "18090000000",          // placeholder: número de ventas de JM sin “+”
};

/* ---------- Datos ---------- */

const LAYERS = {
  control:  { name: "Control",       icon: "control",  from: "essential" },
  luz:      { name: "Iluminación",   icon: "luz",      from: "essential" },
  clima:    { name: "Climatización", icon: "clima",    from: "comfort" },
  cortinas: { name: "Cortinas",      icon: "cortinas", from: "premium" },
  accesos:  { name: "Accesos",       icon: "accesos",  from: "luxury" },
  camaras:  { name: "Cámaras",       icon: "camaras",  from: "signature" },
  red:      { name: "Red",           icon: "red",      from: "essential" },
};
const LAYER_KEYS = Object.keys(LAYERS);
const LEVELS = ["essential", "comfort", "premium", "luxury", "signature"];
const LEVEL_NAME = { essential: "Essential", comfort: "Comfort", premium: "Premium", luxury: "Luxury", signature: "Signature" };
const TIPO_NAME = { apartamento: "Apartamento", casa: "Casa", villa: "Villa", torre: "Torre o residencial" };

/* US$/m² de referencia por nivel (placeholder) y ajuste por tipología */
const PRICE_M2 = { essential: [18, 24], comfort: [26, 34], premium: [36, 48], luxury: [52, 68], signature: [75, 95] };
const MIN_UNIT = { essential: 1800, comfort: 2900, premium: 4800, luxury: 7500, signature: 11000 };
const TYPE_FACTOR = { apartamento: 1, casa: 1.05, villa: 1.15, torre: .9 };

const includes = (layer, level) => LEVELS.indexOf(level) >= LEVELS.indexOf(LAYERS[layer].from);
const money = n => "US$ " + (Math.round(n / 100) * 100).toLocaleString("es-DO");

/* ---------- Header ---------- */

function initHeader() {
  const header = $("[data-header]");
  const onScroll = () => header.classList.toggle("is-solid", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const btn = $("[data-menu-btn]"), menu = $("[data-menu]");
  const setMenu = open => {
    btn.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
    header.classList.toggle("is-solid", open || window.scrollY > 24);
  };
  btn.addEventListener("click", () => setMenu(btn.getAttribute("aria-expanded") !== "true"));
  $$("a", menu).forEach(a => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  const links = $$("[data-nav] a");
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  links.forEach(a => { const s = $(a.getAttribute("href")); if (s) io.observe(s); });
}

/* ---------- Esqueleto isométrico del apartamento ----------
   Planta en metros: x = ancho (0–12), y = fondo (0–8), z = altura (0–2,8).
   Proyección isométrica: la esquina del fondo-izquierda queda arriba y el corte mira al espectador. */

const S = 36, C30 = Math.cos(Math.PI / 6);
const P = (x, y, z = 0) => [(x + y) * C30 * S, ((x - y) * .5 - z) * S];
const pts = arr => arr.map(p => P(...p).map(v => v.toFixed(1)).join(",")).join(" ");
const NS = "http://www.w3.org/2000/svg";

function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
const line = (g, cls, ...p) => el("polyline", { class: cls, points: pts(p), pathLength: 1 }, g);
const poly = (g, cls, ...p) => el("polygon", { class: cls, points: pts(p) }, g);

/* Caja alámbrica (mueble o equipo) */
function box(g, cls, x0, y0, z0, x1, y1, z1) {
  poly(g, cls + " box-top", [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
  poly(g, cls + " box-side", [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);   // cara frontal-izquierda
  poly(g, cls + " box-side", [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]);   // cara frontal-derecha
}
/* Elipse isométrica en el plano horizontal (charcos de luz, coberturas) */
function ring(g, cls, x, y, z, r) {
  const n = 28, p = [];
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; p.push([x + Math.cos(a) * r, y + Math.sin(a) * r, z]); }
  return el("polyline", { class: cls, points: pts(p), pathLength: 1 }, g);
}
/* Etiqueta de dispositivo con línea guía (solo visible mientras su capa está activa) */
function label(g, x, y, z, text, dx = 26, dy = -22) {
  const [cx, cy] = P(x, y, z);
  const l = el("g", { class: "lbl" }, g);
  el("line", { x1: cx, y1: cy, x2: cx + dx, y2: cy + dy }, l);
  const t = el("text", { x: cx + dx + (dx >= 0 ? 6 : -6), y: cy + dy + 4, "text-anchor": dx >= 0 ? "start" : "end" }, l);
  t.textContent = text;
}
/* Punto de dispositivo: núcleo + halo */
function dot(g, x, y, z, big) {
  const [cx, cy] = P(x, y, z);
  const d = el("g", { class: "dev", style: `transform-origin:${cx}px ${cy}px` }, g);
  el("circle", { class: "dev-halo", cx, cy, r: big ? 13 : 9 }, d);
  el("circle", { class: "dev-core", cx, cy, r: big ? 4.5 : 3.2 }, d);
  return d;
}

function buildIso(svg) {
  const W = 12, D = 8, H = 2.8;
  const base = el("g", { class: "iso-base" }, svg);

  // Losa y suelo
  poly(base, "slab", [0, 0, -.3], [W, 0, -.3], [W, 0, 0], [0, 0, 0]);
  poly(base, "slab", [W, 0, -.3], [W, D, -.3], [W, D, 0], [W, 0, 0]);
  poly(base, "floor", [0, 0, 0], [W, 0, 0], [W, D, 0], [0, D, 0]);
  // Retícula de piso (cada 1 m), muy tenue
  for (let x = 1; x < W; x++) line(base, "grid", [x, 0, 0], [x, D, 0]);
  for (let y = 1; y < D; y++) line(base, "grid", [0, y, 0], [W, y, 0]);

  // Muros del fondo (completos) con hueco de puerta en el muro izquierdo
  poly(base, "wall", [0, D, 0], [W, D, 0], [W, D, H], [0, D, H]);
  poly(base, "wall", [0, 0, 0], [0, D, 0], [0, D, H], [0, 0, H]);
  poly(base, "door", [0, 5.6, 0], [0, 6.6, 0], [0, 6.6, 2.1], [0, 5.6, 2.1]);
  // Muros cortados (frente y derecha): zócalo bajo para leer el corte
  poly(base, "wall cut", [0, 0, 0], [W, 0, 0], [W, 0, .3], [0, 0, .3]);
  poly(base, "wall cut", [W, 0, 0], [W, D, 0], [W, D, .3], [W, 0, .3]);
  // Tabique del dormitorio con puerta
  poly(base, "wall", [8.4, 4.8, 0], [8.4, D, 0], [8.4, D, H], [8.4, 4.8, H]);
  poly(base, "wall", [8.4, 3.4, 0], [W, 3.4, 0], [W, 3.4, .3], [8.4, 3.4, .3]);
  // Línea de cielo raso (referencia de altura)
  line(base, "ceil", [0, 0, H], [0, D, H], [W, D, H]);

  // Mobiliario
  const f = el("g", { class: "iso-furn" }, svg);
  box(f, "furn", .3, 7.3, 0, 4.6, D, .9);          // cocina
  box(f, "furn", .3, 7.6, 1.5, 4.6, D, 2.2);       // gabinetes altos
  box(f, "furn", 1.6, 4.9, 0, 3.9, 5.8, .92);      // isla
  box(f, "furn", .9, 1.3, .7, 2.7, 2.6, .76);      // comedor
  box(f, "furn", 4.6, 1.8, 0, 7.6, 2.8, .75);      // sofá
  box(f, "furn", 5.1, 7.55, 0, 7.4, D, .5);        // mueble TV
  box(f, "furn", 5.4, 7.92, .9, 7.1, D, 1.75);     // TV
  box(f, "furn", 9.3, 5.4, 0, 11.6, 7.9, .5);      // cama
  box(f, "furn", W, .5, 0, 13.5, 3.2, .12);        // balcón
  line(f, "rail", [W, .5, .12], [13.5, .5, .12], [13.5, .5, 1.1], [W, .5, 1.1]);
  line(f, "rail", [13.5, .5, 1.1], [13.5, 3.2, 1.1], [13.5, 3.2, .12]);

  // Capas (en orden del recorrido)
  const L = {};
  const layer = k => (L[k] = el("g", { class: "iso-layer", "data-layer": k }, svg));

  // Todo el cableado corre en ángulo recto por el cielo raso (zc), como se instala en obra.
  const zc = H - .1;

  // 01 Control: panel Nature junto a la entrada + Smart Station en la cocina + enlace inalámbrico
  let g = layer("control");
  poly(g, "panel", [0, 4.6, 1.15], [0, 5.25, 1.15], [0, 5.25, 1.45], [0, 4.6, 1.45]);
  line(g, "wire", [0, 4.92, 1.3], [0, 4.92, zc], [0, 7.6, zc], [.8, 7.6, zc], [.8, 7.6, .95]);
  ring(g, "wave", .8, 7.6, .95, .9); ring(g, "wave w2", .8, 7.6, .95, 1.6);
  dot(g, 0, 4.92, 1.3, true); dot(g, .8, 7.6, .95);
  label(g, 0, 4.92, 1.3, "PANEL NATURE", -30, 26);

  // 02 Iluminación: bus de iluminación a lo largo del cielo raso con derivaciones a cada luminaria
  g = layer("luz");
  const lights = [[1.6, 6.6], [3.2, 6.6], [1.8, 2], [5, 3.4], [7, 3.4], [6, 6.4], [10.2, 6.6], [10.2, 4.4]];
  line(g, "wire", [0, 5.4, 1.2], [0, 5.4, zc], [10.2, 5.4, zc]);
  lights.forEach(([x, y]) => line(g, "wire", [x, 5.4, zc], [x, y, zc]));
  lights.forEach(([x, y]) => { ring(g, "pool", x, y, 0, .7); dot(g, x, y, zc); });
  dot(g, 0, 5.4, 1.2);
  label(g, 0, 5.4, 1.2, "BLEND", -30, 28);

  // 03 Climatización: equipos en el muro del fondo + flujo de aire + termostato
  g = layer("clima");
  box(g, "unit", 5.9, 7.75, 2.25, 7.3, D, 2.6);
  box(g, "unit", 9.6, 7.75, 2.25, 11, D, 2.6);
  [[6.6, 7.6], [10.3, 7.6]].forEach(([x, y]) => {
    line(g, "air", [x - .3, y, 2.15], [x - .35, y - 1.1, 1.75], [x - .3, y - 2.1, 1.45]);
    line(g, "air", [x + .3, y, 2.15], [x + .35, y - 1.1, 1.75], [x + .4, y - 2.1, 1.45]);
  });
  line(g, "wire", [8.4, 6.2, 1.4], [8.4, 6.2, zc], [8.4, 7.9, zc], [6.6, 7.9, zc]);
  line(g, "wire", [8.4, 7.9, zc], [10.3, 7.9, zc]);
  dot(g, 8.4, 6.2, 1.4); dot(g, 6.6, 7.85, 2.4); dot(g, 10.3, 7.85, 2.4);
  label(g, 6.6, 7.85, 2.4, "A/C POR ZONAS", 28, -26);

  // 04 Cortinas: rieles motorizados en el ventanal de la sala y del dormitorio
  g = layer("cortinas");
  line(g, "track", [3.4, 0, H - .15], [8.2, 0, H - .15]);
  line(g, "track", [W, 3.6, H - .15], [W, 7.8, H - .15]);
  for (let x = 3.6; x <= 5.2; x += .4) line(g, "fold", [x, 0, H - .2], [x + .06, 0, .35]);
  for (let y = 6.2; y <= 7.6; y += .4) line(g, "fold", [W, y, H - .2], [W, y + .06, .35]);
  dot(g, 8.2, 0, H - .15); dot(g, W, 3.6, H - .15);
  label(g, 8.2, 0, H - .15, "MOTOR DE CORTINA", 30, 30);

  // 05 Accesos: cerradura C100 en la entrada, sensor del balcón y recorrido de llegada
  g = layer("accesos");
  poly(g, "door-on", [0, 5.6, 0], [0, 6.6, 0], [0, 6.6, 2.1], [0, 5.6, 2.1]);
  line(g, "path", [.4, 6.1, 0], [2.4, 6.1, 0], [2.4, 3.8, 0], [5.4, 3.8, 0]);
  line(g, "wire", [W, 2.4, 1.1], [W, 2.4, zc], [W, 3.6, zc]);
  dot(g, 0, 5.75, 1.05, true); dot(g, W, 2.4, 1.1);
  label(g, 0, 5.75, 1.05, "CERRADURA C100", -30, 28);

  // 06 Cámaras: entrada, sala y balcón, con su cono de visión dentro del apartamento
  g = layer("camaras");
  poly(g, "cone", [.25, 7.7, 2.6], [.3, 4.9, 0], [2.4, 6.6, 0]);
  poly(g, "cone", [.25, .25, 2.6], [3.6, 1.2, 0], [1.6, 3.6, 0]);
  poly(g, "cone", [13.3, 3.1, 2.3], [12.2, .7, .12], [13.4, .7, .12]);
  dot(g, .25, 7.7, 2.6); dot(g, .25, .25, 2.6, true); dot(g, 13.3, 3.1, 2.3);
  label(g, .25, .25, 2.6, "CÁMARA INTERIOR", -30, -24);

  // 07 Red: gabinete, cableado estructurado en estrella y Wi-Fi: todo conectado
  g = layer("red");
  box(g, "unit", .35, 6.5, 0, .9, 7.2, 1.1);
  line(g, "wire net", [.6, 6.85, 1.1], [.6, 6.85, H - .02], [6, 6.85, H - .02], [6, 4.4, H - .02]);
  line(g, "wire net", [.6, 6.85, H - .02], [.6, 4.92, H - .02]);
  line(g, "wire net", [6, 6.85, H - .02], [10.2, 6.85, H - .02], [10.2, 3.4, H - .02], [W, 3.4, H - .02]);
  line(g, "wire net", [6, 4.4, H - .02], [6, .5, H - .02], [.25, .5, H - .02]);
  ring(g, "wave", 6, 4.4, H - .02, 1.4); ring(g, "wave w2", 6, 4.4, H - .02, 2.6); ring(g, "wave w3", 6, 4.4, H - .02, 3.8);
  dot(g, 6, 4.4, H - .02, true); dot(g, .6, 6.85, 1.1);
  label(g, 6, 4.4, H - .02, "PUNTO DE ACCESO WI-FI", 30, -30);

  // Encuadre: viewBox ajustado al dibujo
  const bb = svg.getBBox(), pad = 24;
  svg.setAttribute("viewBox", `${(bb.x - pad).toFixed(0)} ${(bb.y - pad).toFixed(0)} ${(bb.width + pad * 2).toFixed(0)} ${(bb.height + pad * 2).toFixed(0)}`);
  return LAYER_KEYS.map(k => L[k]);
}

/* ---------- Scroll-motion de capas ---------- */

function initScrolly() {
  const root = $("[data-scrolly]"), svg = $("[data-iso]");
  if (!root || !svg) return;
  const groups = buildIso(svg);
  const cards = $$("[data-step]", root), n = cards.length;
  const num = $("[data-step-n]", root), rail = $("[data-rail]", root);

  rail.innerHTML = cards.map((c, i) =>
    `<button type="button" data-go="${i}" aria-label="Ir a ${$("h3", c).textContent.trim()}"><span></span></button>`).join("");
  const ticks = $$("button", rail);

  let current = -1;
  const setStep = i => {
    if (i === current) return;
    current = i;
    cards.forEach((c, k) => { c.classList.toggle("is-active", k === i); c.setAttribute("aria-hidden", k !== i); });
    ticks.forEach((t, k) => { t.classList.toggle("is-done", k < i); t.classList.toggle("is-active", k === i); });
    num.textContent = String(i + 1).padStart(2, "0");
  };

  // Progreso 0–1 del recorrido fijado → cada capa tiene su tramo; el dibujo avanza y retrocede con el scroll
  const update = () => {
    const r = root.getBoundingClientRect(), vh = innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / (r.height - vh)));
    const f = p * n;
    groups.forEach((g, k) => {
      const t = Math.min(1, Math.max(0, (f - k) / .7));
      g.style.setProperty("--t", t.toFixed(3));
      g.classList.toggle("is-on", t > 0);
      g.classList.toggle("is-past", f >= k + 1);
    });
    setStep(Math.min(n - 1, Math.floor(f)));
    root.classList.toggle("is-complete", p > .985);
  };
  let raf = 0;
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  update();

  // Saltar a una capa desde la barra de progreso
  rail.addEventListener("click", e => {
    const b = e.target.closest("[data-go]"); if (!b) return;
    const i = +b.dataset.go, r = root.getBoundingClientRect();
    const y = scrollY + r.top + (r.height - innerHeight) * ((i + .75) / n);
    scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
  });
}

/* ---------- Matriz de niveles ---------- */

function initMatrix() {
  const tbody = $("[data-matrix]");
  if (!tbody) return;
  tbody.innerHTML = Object.entries(LAYERS).map(([key, l]) => `
    <tr>
      <th scope="row"><span class="th-in"><svg class="i" aria-hidden="true"><use href="#i-${l.icon}"/></svg>${l.name}</span></th>
      ${LEVELS.map(lv => includes(key, lv)
        ? `<td><span class="mk mk-on" aria-hidden="true"></span><span class="sr">Incluido</span></td>`
        : `<td><span class="mk mk-off" aria-hidden="true"></span><span class="sr">No incluido</span></td>`).join("")}
    </tr>`).join("");
}

/* ---------- Calculadora ---------- */

function recommend(tipo, m2) {
  if (tipo === "villa") return m2 >= 450 ? "signature" : "luxury";
  if (tipo === "casa") return m2 >= 300 ? "luxury" : "premium";
  if (tipo === "torre") return m2 >= 140 ? "premium" : "comfort";
  return m2 < 90 ? "essential" : m2 < 160 ? "comfort" : "premium";
}

function estimate(s) {
  const [lo, hi] = PRICE_M2[s.nivel], f = TYPE_FACTOR[s.tipo];
  const uLo = Math.max(lo * s.m2 * f, MIN_UNIT[s.nivel]);
  const uHi = Math.max(hi * s.m2 * f, MIN_UNIT[s.nivel] * 1.25);
  return { uLo, uHi, tLo: uLo * s.units, tHi: uHi * s.units };
}
const rangeTxt = (a, b) => `${money(a)}–${money(b).replace("US$ ", "")}`;

let calcState = null;

function initCalc() {
  const form = $("[data-calc-form]");
  if (!form) return;
  const outM2 = $("[data-out-m2]"), outUnits = $("[data-out-units]"), unitsBox = $("[data-units]");
  const range = $("[data-sum-range]"), unitLbl = $("[data-sum-unit]"), total = $("[data-sum-total]");
  const layersList = $("[data-sum-layers]"), reco = $("[data-reco]");
  let userPickedLevel = false;

  const read = () => {
    const d = new FormData(form);
    return { tipo: d.get("tipo"), m2: +d.get("m2"), units: d.get("tipo") === "torre" ? +d.get("unidades") : 1, nivel: d.get("nivel") };
  };

  const update = () => {
    const s = read();
    outM2.textContent = s.m2 + " m²";
    outUnits.textContent = s.units;
    unitsBox.hidden = s.tipo !== "torre";

    const r = recommend(s.tipo, s.m2);
    $$("[data-levels] label").forEach(l => l.classList.toggle("is-reco", $("input", l).value === r));
    if (!userPickedLevel) { form.nivel.value = r; s.nivel = r; }
    reco.textContent = s.nivel === r ? `Sugerido para ${s.m2} m²: ${LEVEL_NAME[r]}.` : `Para ${s.m2} m² solemos sugerir ${LEVEL_NAME[r]}.`;

    const e = estimate(s);
    range.textContent = rangeTxt(e.uLo, e.uHi);
    unitLbl.textContent = s.units > 1 ? "por unidad" : "por " + (s.tipo === "torre" ? "unidad" : s.tipo);
    total.hidden = s.units <= 1;
    if (s.units > 1) total.textContent = `Proyecto de ${s.units} unidades: ${rangeTxt(e.tLo, e.tHi)}`;

    layersList.innerHTML = LAYER_KEYS.filter(k => includes(k, s.nivel))
      .map(k => `<li><svg class="i" aria-hidden="true"><use href="#i-${LAYERS[k].icon}"/></svg>${LAYERS[k].name}</li>`).join("");

    calcState = { ...s, ...e, recomendado: r };
  };

  form.addEventListener("input", e => {
    if (e.target.name === "nivel") userPickedLevel = true;
    if (e.target.name === "tipo") userPickedLevel = false;
    update();
  });
  update();
  initLead(() => calcState);
}

/* ---------- Cotización preliminar + base de datos de leads ---------- */

function folio() {
  const d = new Date(), yymm = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0");
  return `JM-CM${yymm}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function saveLead(lead) {
  // 1) Copia local (modo demo y respaldo si falla la red)
  try {
    const all = JSON.parse(localStorage.getItem(CONFIG.storageKey) || "[]");
    all.push(lead);
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(all));
  } catch (e) { /* almacenamiento no disponible: seguimos */ }
  // 2) Base de datos real (Google Sheets vía Apps Script u otro endpoint JSON)
  if (!CONFIG.leadsEndpoint) return { ok: true, demo: true };
  try {
    await fetch(CONFIG.leadsEndpoint, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(lead) });
    return { ok: true };
  } catch (e) {
    return { ok: false };
  }
}

function initLead(getState) {
  const lead = $("[data-lead]"), sum = $("[data-lead-sum]"), quote = $("[data-quote]");
  const submit = $("[data-lead-submit]"), err = $("[data-lead-err]");

  const describe = s => `${TIPO_NAME[s.tipo]}${s.units > 1 ? ` · ${s.units} unidades` : ""} · ${s.m2} m²${s.units > 1 ? " c/u" : ""}`;

  $("[data-open-lead]").addEventListener("click", () => {
    const s = getState();
    lead.hidden = false; quote.hidden = true;
    sum.textContent = `${describe(s)} · ${LEVEL_NAME[s.nivel]} · ${rangeTxt(s.uLo, s.uHi)}${s.units > 1 ? " por unidad" : ""}.`;
    lead.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    setTimeout(() => $("input[name=nombre]", lead).focus({ preventScroll: true }), 500);
  });

  lead.addEventListener("submit", async e => {
    e.preventDefault();
    let first = null;
    $$("input, select", lead).forEach(el => {
      const bad = !el.checkValidity();
      (el.closest(".f") || el.closest(".check"))?.classList.toggle("is-error", bad);
      if (bad && !first) first = el;
    });
    if (first) { err.textContent = "Revisa los campos marcados."; first.focus(); return; }
    err.textContent = "";

    const s = getState(), d = Object.fromEntries(new FormData(lead));
    const record = {
      folio: folio(), fecha: new Date().toISOString(),
      nombre: d.nombre.trim(), empresa: (d.empresa || "").trim(), perfil: d.perfil, etapa: d.etapa,
      whatsapp: d.whatsapp.trim(), correo: d.correo.trim(),
      tipo: s.tipo, m2: s.m2, unidades: s.units, nivel: s.nivel, recomendado: s.recomendado,
      capas: LAYER_KEYS.filter(k => includes(k, s.nivel)).map(k => LAYERS[k].name).join(", "),
      rango_unidad: rangeTxt(s.uLo, s.uHi), rango_total: s.units > 1 ? rangeTxt(s.tLo, s.tHi) : "",
      origen: new URLSearchParams(location.search).get("utm_content") || "web",
    };

    submit.disabled = true; submit.textContent = "Generando…";
    const res = await saveLead(record);
    submit.disabled = false; submit.textContent = "Generar mi cotización";
    if (!res.ok) { err.textContent = "No pudimos enviarla. Inténtalo de nuevo o escríbenos por WhatsApp."; return; }

    renderQuote(record);
    lead.hidden = true; quote.hidden = false;
    quote.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  });

  function renderQuote(q) {
    const fecha = new Date(q.fecha).toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
    $("[data-q-folio]").textContent = q.folio;
    $("[data-q-for]").textContent = `Para ${q.nombre}${q.empresa ? " · " + q.empresa : ""} · ${q.perfil}`;
    $("[data-q-proyecto]").textContent = describe({ tipo: q.tipo, units: q.unidades, m2: q.m2 }) + ` · ${q.etapa}`;
    $("[data-q-nivel]").textContent = LEVEL_NAME[q.nivel];
    $("[data-q-capas]").textContent = q.capas;
    $("[data-q-fecha]").textContent = fecha;
    $("[data-q-rango]").textContent = q.rango_total || q.rango_unidad;
    $("[data-q-unidad]").textContent = q.rango_total ? `Total del proyecto · ${q.rango_unidad} por unidad` : "Por unidad, equipos e instalación";
    const msg = `Hola JM, soy ${q.nombre}. Quiero avanzar con mi cotización ${q.folio}: ${LEVEL_NAME[q.nivel]}, ${describe({ tipo: q.tipo, units: q.unidades, m2: q.m2 })}, ${q.rango_total || q.rango_unidad}.`;
    $("[data-q-wa]").href = `https://wa.me/${CONFIG.whatsappJM}?text=${encodeURIComponent(msg)}`;
  }

  $("[data-q-print]").addEventListener("click", () => {
    document.body.classList.add("print-quote");
    window.print();
    setTimeout(() => document.body.classList.remove("print-quote"), 500);
  });
  $("[data-q-new]").addEventListener("click", () => {
    quote.hidden = true; lead.reset(); lead.hidden = true;
    $("#calculadora").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });
}

/* ---------- Calendario (.ics) ---------- */

function initIcs() {
  const a = $("[data-ics]");
  if (!a) return;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//JM Security System//Construmedia 2026//ES",
    "BEGIN:VEVENT", "UID:construmedia2026-stand68@jmsecuritysystem.com", "DTSTAMP:20261028T000000Z",
    "DTSTART;VALUE=DATE:20261113", "DTEND;VALUE=DATE:20261116",
    "SUMMARY:LifeSmart × JM · Stand 68 · Construmedia 2026",
    "LOCATION:Feria Inmobiliaria Construmedia\\, Santo Domingo",
    "DESCRIPTION:Domótica y seguridad en vivo: cerradura C100\\, panel Nature e interruptores Blend.",
    "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  a.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
  a.download = "Construmedia2026_Stand68.ics";
}

/* ---------- Reveals ---------- */

function initReveal() {
  const els = $$(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("is-in")); return; }
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
  }), { rootMargin: "0px 0px -10% 0px" });
  els.forEach(e => io.observe(e));
}

initHeader(); initScrolly(); initMatrix(); initCalc(); initIcs(); initReveal();
