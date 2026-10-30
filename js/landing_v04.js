/* JM × LifeSmart · Landing Construmedia 2026 · v04
   JS vanilla con mejora progresiva: sin JS el contenido se lee completo.
   PRECIOS y CONTACTO = datos de ejemplo para el prototipo (validar con JM antes de publicar). */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---------- Configuración ---------- */

const CONFIG = {
  // Base de datos de leads. Vacío = modo demo (se guardan en este navegador; ver Recursos/leads_demo.html).
  // Con la URL del Apps Script (Recursos/backend_google_sheets) cada cotización se guarda en Google Sheets
  // y el cliente recibe su cotización por correo.
  leadsEndpoint: "",
  storageKey: "jm_leads_v1",
  whatsappJM: "18090000000",          // placeholder: número de ventas de JM sin “+”
};

/* ---------- Datos: capas del sistema (scroll y matriz de niveles) ---------- */

const LAYERS = {
  control:  { name: "Control y voz", icon: "control",  from: "essential", devices: "Panel Nature · Nature X · voz y app" },
  luz:      { name: "Iluminación",   icon: "luz",      from: "essential", devices: "Interruptores Blend · sensor de movimiento" },
  clima:    { name: "Climatización", icon: "clima",    from: "comfort",   devices: "Control de A/C · termostato" },
  cortinas: { name: "Cortinas",      icon: "cortinas", from: "premium",   devices: "Motor de cortina · riel" },
  accesos:  { name: "Accesos",       icon: "accesos",  from: "luxury",    devices: "Cerradura C100 · sensor de puerta" },
  camaras:  { name: "Cámaras",       icon: "camaras",  from: "signature", devices: "Cámara interior y exterior" },
  red:      { name: "Red",           icon: "red",      from: "essential", devices: "Gabinete · Wi-Fi · cableado" },
};
const LAYER_KEYS = Object.keys(LAYERS);
const LEVELS = ["essential", "comfort", "premium", "luxury", "signature"];
const includes = (layer, level) => LEVELS.indexOf(level) >= LEVELS.indexOf(LAYERS[layer].from);
const money = n => "US$ " + (Math.round(n / 100) * 100).toLocaleString("es-DO");
const rangeTxt = (a, b) => `${money(a)}–${money(b).replace("US$ ", "")}`;

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

  rail.addEventListener("click", e => {
    const b = e.target.closest("[data-go]"); if (!b) return;
    const i = +b.dataset.go, r = root.getBoundingClientRect();
    const y = scrollY + r.top + (r.height - innerHeight) * ((i + .75) / n);
    scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
  });
}

/* ---------- 04 · Matriz de soluciones por nivel ---------- */

function initMatrix() {
  const tbody = $("[data-matrix]");
  if (!tbody) return;
  tbody.innerHTML = Object.entries(LAYERS).map(([key, l]) => `
    <tr>
      <th scope="row"><span class="th-in"><svg class="i" aria-hidden="true"><use href="#i-${l.icon}"/></svg><span>${l.name}<small class="th-dev">${l.devices}</small></span></span></th>
      ${LEVELS.map(lv => includes(key, lv)
        ? `<td><span class="mk mk-on" aria-hidden="true"></span><span class="sr">Incluido</span></td>`
        : `<td><span class="mk mk-off" aria-hidden="true"></span><span class="sr">No incluido</span></td>`).join("")}
    </tr>`).join("");
}

/* ---------- 05 · Calculadora: Hogar / Negocio → m² y niveles → soluciones ---------- */

/* Tipos de inmueble: rangos de las barras, proporción de la planta, altura por nivel y soluciones recomendadas */
const TYPES = {
  apartamento: { seg: "hogar",   name: "Apartamento",            m2: [40, 400, 10, 120],     lv: [1, 2, 1],  ratio: 1.5, fh: 3,   reco: ["control", "luz", "clima", "musica", "accesos"],
                 note: "¿Toda una torre residencial? Elige B · Edificio." },
  casa:        { seg: "hogar",   name: "Casa",                   m2: [80, 800, 10, 220],     lv: [1, 3, 2],  ratio: 1.4, fh: 3,   reco: ["control", "luz", "clima", "cortinas", "accesos", "alarma"] },
  villa:       { seg: "hogar",   name: "Villa o finca",          m2: [150, 2000, 10, 450],   lv: [1, 3, 1],  ratio: 1.8, fh: 3.2, lot: true,
                 reco: ["control", "luz", "clima", "cortinas", "accesos", "alarma", "camaras", "red"], note: "Casa de campo, finca o villa de playa: incluye el perímetro del terreno." },
  oficina:     { seg: "negocio", name: "Oficina",                m2: [30, 1500, 10, 180],    lv: [1, 2, 1],  ratio: 1.5, fh: 3,   reco: ["control", "luz", "clima", "accesos", "red"] },
  oficinas:    { seg: "negocio", name: "Oficina de varios pisos", m2: [200, 6000, 50, 900],   lv: [2, 4, 3],  ratio: 1.4, fh: 3.2, reco: ["control", "luz", "clima", "accesos", "camaras", "red", "energia"] },
  galpon:      { seg: "negocio", name: "Galpón o nave",          m2: [300, 10000, 50, 1500], lv: [1, 2, 1],  ratio: 2,   fh: 7,   reco: ["luz", "accesos", "alarma", "camaras", "red", "energia"],
                 note: "Almacenes, naves industriales y centros de distribución." },
  edificio:    { seg: "negocio", name: "Edificio",               m2: [1000, 60000, 500, 6000], lv: [5, 30, 8], ratio: 1.3, fh: 3.2, reco: ["control", "luz", "clima", "accesos", "alarma", "camaras", "red", "energia"],
                 note: "Por ejemplo: hoteles, torres corporativas, clínicas, colegios y plazas comerciales." },
};

/* Soluciones (burbujas). qty = cantidad estimada de equipos; price = US$ de referencia instalado (placeholder). */
const SOLUTIONS = {
  control:  { name: "Control y voz",     icon: "control",  unit: n => `${n} ${n === 1 ? "panel" : "paneles"} y hub`,
              qty: s => s.lv + (s.seg === "negocio" ? 1 : 0),                                   price: n => 450 + 380 * n },
  luz:      { name: "Iluminación",       icon: "luz",      unit: n => `${n} puntos de luz`,
              qty: s => Math.max(4, Math.round(s.m2 / (s.tipo === "galpon" ? 40 : 10))),        price: n => 85 * n },
  clima:    { name: "Climatización",     icon: "clima",    unit: n => `${n} ${n === 1 ? "zona" : "zonas"} de clima`,
              qty: s => Math.max(1, Math.round(s.m2 / (s.tipo === "galpon" ? 250 : s.seg === "negocio" ? 60 : 40))), price: n => 260 * n },
  cortinas: { name: "Cortinas",          icon: "cortinas", unit: n => `${n} ventanales`,
              qty: s => Math.max(2, Math.round(s.m2 / (s.seg === "negocio" ? 60 : 35))),        price: n => 420 * n },
  musica:   { name: "Música",            icon: "musica",   unit: n => `${n} ${n === 1 ? "zona" : "zonas"} de audio`,
              qty: s => clamp(Math.round(s.m2 / 60), 1, s.seg === "negocio" ? 40 : 12),          price: n => 350 * n },
  accesos:  { name: "Accesos",           icon: "accesos",  unit: n => `${n} ${n === 1 ? "cerradura" : "cerraduras"}`,
              qty: s => s.seg === "hogar" ? 1 + (s.tipo === "villa" ? 1 : 0) : s.lv + 1 + (s.tipo === "edificio" ? s.lv : 0), price: n => 650 * n },
  alarma:   { name: "Alarma y sensores", icon: "alarma",   unit: n => `${n} sensores y sirena`,
              qty: s => Math.max(3, Math.round(s.m2 / 40)),                                     price: (n, s) => 250 + 70 * n + 160 * s.lv },
  camaras:  { name: "Cámaras",           icon: "camaras",  unit: n => `${n} cámaras`,
              qty: s => Math.max(2, Math.round(s.m2 / (s.seg === "negocio" ? 250 : 150)) + (s.seg === "negocio" ? s.lv : 0)), price: n => 240 * n },
  red:      { name: "Red Wi-Fi",         icon: "red",      unit: n => `${n} ${n === 1 ? "punto" : "puntos"} Wi-Fi`,
              qty: s => Math.max(1, Math.round(s.m2 / 120)),                                    price: n => 600 + 220 * n },
  energia:  { name: "Energía",           icon: "energia",  unit: n => `${n} ${n === 1 ? "medidor" : "medidores"} de consumo`,
              qty: s => s.lv,                                                                    price: n => 400 + 300 * n },
};
const SOL_KEYS = Object.keys(SOLUTIONS);
const RANGE = [.9, 1.2];   // margen del rango orientativo

const perM2 = (e, s) => `US$ ${Math.round(e.lo / s.m2)}–${Math.round(e.hi / s.m2)}`;
const nivelTxt = n => `${n} ${n === 1 ? "nivel" : "niveles"}`;
const describe = s => `${TYPES[s.tipo].name} · ${s.m2.toLocaleString("es-DO")} m² · ${nivelTxt(s.lv)}`;

function estimate(s) {
  const items = s.sols.map(k => { const n = SOLUTIONS[k].qty(s); return { k, n, cost: SOLUTIONS[k].price(n, s) }; });
  const sum = items.reduce((a, b) => a + b.cost, 0);
  return { items, lo: sum * RANGE[0], hi: sum * RANGE[1] };
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
    const T = TYPES[s.tipo];
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

let calcState = null;

function initCalc() {
  const form = $("[data-calc-form]");
  if (!form) return;
  const m2 = form.m2, lv = form.niveles;
  const outM2 = $("[data-out-m2]"), outLv = $("[data-out-lv]"), note = $("[data-type-note]");
  const bubbles = $("[data-bubbles]"), reco = $("[data-reco]"), desc = $("[data-desc]");
  const legend = $("[data-legend]"), range = $("[data-sum-range]"), unit = $("[data-sum-unit]");
  const render = makeProto($("[data-proto]"));

  // Burbujas de soluciones
  bubbles.innerHTML = SOL_KEYS.map(k => `
    <button type="button" class="bubble" data-sol="${k}" aria-pressed="false">
      <svg class="i" aria-hidden="true"><use href="#i-${SOLUTIONS[k].icon}"/></svg>${SOLUTIONS[k].name}<span class="bubble-reco" aria-hidden="true"></span>
    </button>`).join("");
  let selected = new Set(), touched = false;

  const setRanges = (tipo, keepValues) => {
    const T = TYPES[tipo];
    [m2.min, m2.max, m2.step] = T.m2.slice(0, 3);
    [lv.min, lv.max] = T.lv.slice(0, 2);
    if (!keepValues) { m2.value = T.m2[3]; lv.value = T.lv[2]; }
    lv.disabled = T.lv[0] === T.lv[1];
    $("[data-m2-min]").textContent = T.m2[0].toLocaleString("es-DO");
    $("[data-m2-max]").textContent = T.m2[1].toLocaleString("es-DO") + " m²";
    $("[data-lv-min]").textContent = T.lv[0];
    $("[data-lv-max]").textContent = T.lv[1];
    note.textContent = T.note || ""; note.hidden = !T.note;
  };
  const useReco = tipo => { selected = new Set(TYPES[tipo].reco); touched = false; };

  const read = () => {
    const d = new FormData(form);
    const tipo = d.get("tipo");
    return { seg: TYPES[tipo].seg, tipo, m2: +m2.value, lv: +lv.value, sols: SOL_KEYS.filter(k => selected.has(k)) };
  };

  const update = () => {
    const s = read(), T = TYPES[s.tipo];
    outM2.textContent = s.m2.toLocaleString("es-DO") + " m²";
    outLv.textContent = nivelTxt(s.lv);
    desc.textContent = describe(s);

    $$(".bubble", bubbles).forEach(b => {
      const k = b.dataset.sol;
      b.setAttribute("aria-pressed", String(selected.has(k)));
      b.classList.toggle("is-reco", T.reco.includes(k));
    });
    const missing = T.reco.filter(k => !selected.has(k));
    reco.innerHTML = `<span class="reco-dot" aria-hidden="true"></span>` + (missing.length && touched
      ? `Para ${T.name.toLowerCase()} solemos sumar también: ${missing.map(k => SOLUTIONS[k].name.toLowerCase()).join(", ")}.`
      : `Recomendadas para ${T.name.toLowerCase()} de ${s.m2.toLocaleString("es-DO")} m²: marcadas con punto.`);

    const e = estimate(s);
    legend.innerHTML = e.items.length
      ? e.items.map(it => `<li><svg class="i" aria-hidden="true"><use href="#i-${SOLUTIONS[it.k].icon}"/></svg><span>${SOLUTIONS[it.k].name}<em>${SOLUTIONS[it.k].unit(it.n)}</em></span></li>`).join("")
      : `<li class="is-empty">Toca una solución para empezar.</li>`;
    range.textContent = e.items.length ? rangeTxt(e.lo, e.hi) : "US$ —";
    unit.textContent = e.items.length ? `≈ ${perM2(e, s)} por m² · equipos e instalación` : "equipos e instalación";
    $("[data-open-lead]").disabled = !e.items.length;

    render(s);
    calcState = { ...s, ...e };
  };

  // Segmento → muestra sus tipos y elige el primero
  const showSeg = seg => {
    $$("[data-types] label").forEach(l => { l.hidden = l.dataset.seg !== seg; });
    const first = $(`[data-types] label[data-seg="${seg}"] input`);
    first.checked = true;
    setRanges(first.value); useReco(first.value);
  };

  form.addEventListener("change", e => {
    if (e.target.name === "segmento") showSeg(e.target.value);
    if (e.target.name === "tipo") { setRanges(e.target.value); useReco(e.target.value); }
    update();
  });
  form.addEventListener("input", e => { if (e.target.type === "range") update(); });
  bubbles.addEventListener("click", e => {
    const b = e.target.closest("[data-sol]"); if (!b) return;
    const k = b.dataset.sol;
    selected.has(k) ? selected.delete(k) : selected.add(k);
    touched = true; update();
  });
  $("[data-use-reco]").addEventListener("click", () => { useReco(read().tipo); update(); });

  showSeg(form.segmento.value);
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
  const solNames = s => s.sols.map(k => SOLUTIONS[k].name).join(", ");
  const equipos = s => s.items.map(it => SOLUTIONS[it.k].unit(it.n)).join(" · ");

  $("[data-open-lead]").addEventListener("click", () => {
    const s = getState();
    lead.hidden = false; quote.hidden = true;
    sum.textContent = `${describe(s)} · ${s.sols.length} soluciones · ${rangeTxt(s.lo, s.hi)}.`;
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
      segmento: s.seg === "hogar" ? "Hogar" : "Comercio o empresa", tipo: TYPES[s.tipo].name, m2: s.m2, niveles: s.lv,
      soluciones: solNames(s), recomendadas: TYPES[s.tipo].reco.map(k => SOLUTIONS[k].name).join(", "),
      equipos: equipos(s), rango_total: rangeTxt(s.lo, s.hi), rango_m2: perM2(s, s),
      origen: new URLSearchParams(location.search).get("utm_content") || "web",
    };

    submit.disabled = true; submit.textContent = "Generando…";
    const res = await saveLead(record);
    submit.disabled = false; submit.textContent = "Generar mi cotización";
    if (!res.ok) { err.textContent = "No pudimos enviarla. Inténtalo de nuevo o escríbenos por WhatsApp."; return; }

    renderQuote(record, s);
    lead.hidden = true; quote.hidden = false;
    quote.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  });

  function renderQuote(q, s) {
    const fecha = new Date(q.fecha).toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
    $("[data-q-folio]").textContent = q.folio;
    $("[data-q-for]").textContent = `Para ${q.nombre}${q.empresa ? " · " + q.empresa : ""} · ${q.perfil}`;
    $("[data-q-proyecto]").textContent = `${q.segmento} · ${describe(s)} · ${q.etapa}`;
    $("[data-q-capas]").textContent = q.soluciones;
    $("[data-q-equipos]").textContent = q.equipos;
    $("[data-q-fecha]").textContent = fecha;
    $("[data-q-rango]").textContent = q.rango_total;
    $("[data-q-unidad]").textContent = `Equipos e instalación · ≈ ${q.rango_m2} por m²`;
    const msg = `Hola JM, soy ${q.nombre}. Quiero avanzar con mi cotización ${q.folio}: ${describe(s)}, ${q.soluciones.toLowerCase()}. Estimado: ${q.rango_total}.`;
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
    "BEGIN:VEVENT", "UID:construmedia2026-stand68@jmsecuritysystem.com", "DTSTAMP:20261030T000000Z",
    "DTSTART;VALUE=DATE:20261113", "DTEND;VALUE=DATE:20261116",
    "SUMMARY:LifeSmart × JM · Stand 68 · Construmedia 2026",
    "LOCATION:Salón Regency\\, Hotel Dominican Fiesta\\, Santo Domingo",
    "DESCRIPTION:Stand 68\\, fila superior del Salón Regency. Domótica y seguridad en vivo: cerradura C100\\, panel Nature\\, Nature X\\, interruptores Blend y sensor de movimiento.",
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
