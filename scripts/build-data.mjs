// Convierte la salida del radar (Python) en src/data/zonas.json para la app.
// Entradas en data/: radar_v3.csv, radar_v2_oportunidades.csv, secciones_mataro.geojson,
// contexto_seccion.csv y prospeccion_seccion.csv (opcionales)
// Uso: npm run datos   (se ejecuta solo con npm run dev / build)
import fs from "node:fs";

function leerCSV(ruta) {
  const txt = fs.readFileSync(ruta, "utf8").replace(/^﻿/, "");
  const filas = [];
  let campo = "", fila = [], dentro = false;
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (dentro) {
      if (ch === '"' && txt[i + 1] === '"') { campo += '"'; i++; }
      else if (ch === '"') dentro = false;
      else campo += ch;
    } else if (ch === '"') dentro = true;
    else if (ch === ",") { fila.push(campo); campo = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && txt[i + 1] === "\n") i++;
      fila.push(campo); campo = "";
      if (fila.some((c) => c !== "")) filas.push(fila);
      fila = [];
    } else campo += ch;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  const [cab, ...resto] = filas;
  return resto.map((f) => Object.fromEntries(cab.map((k, i) => [k, f[i] ?? ""])));
}
const num = (v) => (v === "" || v == null ? null : Number(v));

// Nombres cortos para la interfaz
const CORTO = {
  "panadería/pastelería": "Panadería",
  "carnicería": "Carnicería",
  "supermercado/alimentación": "Supermercado",
  "peluquería/estética y servicios personales": "Peluquería y estética",
  "salud (clínicas, fisio, dentista...)": "Salud",
  "bar/cafetería/restaurante": "Hostelería",
  "ferretería": "Ferretería",
  "floristería": "Floristería",
  "librería/papelería/prensa": "Librería y papelería",
  "bazar": "Bazar",
  "electrónica/electrodomésticos/reparación": "Electrónica y reparación",
  "óptica/ortopedia": "Óptica",
};

const v3 = leerCSV("data/radar_v3.csv");
const v2 = leerCSV("data/radar_v2_oportunidades.csv");

const porSeccion = {};
for (const r of v2) {
  const s = (porSeccion[r.cusec] ??= { vecinos: num(r.vecinos_entorno), renta: num(r.renta_persona), pct65: num(r.pct_65_mas), ops: [] });
  const o = {
    tipo: CORTO[r.tipo] || r.tipo,
    oferta: num(r.oferta), esperado: num(r.esperado), faltan: num(r.faltan),
    // Mismo redondeo que el radar (ratio_oferta), para que la tabla y el texto de la ficha den el mismo %
    pct: r.ratio_oferta !== "" ? Math.round(100 * num(r.ratio_oferta)) : null,
    p: num(r.p_azar), fiable: r.confianza_dato !== "baja",
  };
  if (r.oportunidad === "si") s.ops.push(o);
  // radar_v2.1: huecos que no son oportunidad pero se enseñan en la ficha
  else if (r.estado_hueco === "sensible") (s.otros ??= []).push({ ...o, motivo: r.motivo || `Solo aparece con ${r.radios_hueco} radios: a confirmar` });
  else if (r.estado_hueco === "cubierto") (s.otros ??= []).push({ ...o, motivo: `Cubierto por ${r.cubierto_por}` });
}
for (const s of Object.values(porSeccion)) s.ops.sort((a, b) => a.pct - b.pct);
// Lo que ya hay de sobra (competencia): tipos con al menos 1,5 veces lo normal y 3 negocios o más
for (const r of v2) {
  const ratio = num(r.ratio_oferta);
  if (ratio != null && ratio >= 1.5 && num(r.oferta) >= 3 && r.tipo !== "bar/cafetería/restaurante" && porSeccion[r.cusec])
    (porSeccion[r.cusec].sobra ??= []).push({ tipo: CORTO[r.tipo] || r.tipo, oferta: num(r.oferta), pct: Math.round(100 * ratio) });
}
for (const s of Object.values(porSeccion)) s.sobra?.sort((a, b) => b.pct - a.pct);

// Geometría: misma proyección que la web
const secc = JSON.parse(fs.readFileSync("data/secciones_mataro.geojson", "utf8")).features
  .filter((f) => f.properties.CSEC !== "000" && f.properties.TIPO !== "DISTRITO");
const polys = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);
const lat0 = 41.54 * Math.PI / 180;
const P = ([lon, lat]) => [lon * Math.cos(lat0), -lat];
const area = (ring) => { let a = 0; for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]; return Math.abs(a / 2); };
const km2 = new Map(secc.map((s) => [s.properties.CUSEC, polys(s.geometry).reduce((t, p) => t + area(p[0].map(P)), 0) * 111.32 ** 2]));
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (const s of secc) if (km2.get(s.properties.CUSEC) <= 0.6) for (const p of polys(s.geometry)) for (const [x, y] of p[0].map(P)) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
}
const mg = (maxX - minX) * 0.04; minX -= mg; maxX += mg; minY -= mg; maxY += mg;
const W = 1000, k = W / (maxX - minX), H = Math.round((maxY - minY) * k);
const geo = {};
for (const s of secc) {
  let d = "", cx = 0, cy = 0, n = 0;
  for (const p of polys(s.geometry)) for (const ring of p) {
    const pts = ring.map(P).map(([x, y]) => [(x - minX) * k, (y - minY) * k]);
    d += "M" + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L") + "Z";
    if (ring === p[0]) for (const [x, y] of pts) { cx += x; cy += y; n++; }
  }
  geo[s.properties.CUSEC] = { d, cx: +(cx / n).toFixed(1), cy: +(cy / n).toFixed(1), rural: km2.get(s.properties.CUSEC) > 0.6 };
}

// Polos de atracción (mercados, grandes superficies) a menos de 450 m del centro de cada sección
const polos = fs.existsSync("data/polos.csv") ? leerCSV("data/polos.csv") : [];
const centroLL = {};
for (const s of secc) {
  const anillo = polys(s.geometry)[0][0];
  centroLL[s.properties.CUSEC] = [anillo.reduce((t, p) => t + p[0], 0) / anillo.length, anillo.reduce((t, p) => t + p[1], 0) / anillo.length];
}
const distM = ([lon1, lat1], [lon2, lat2]) => Math.hypot((lon2 - lon1) * Math.cos(lat0) * 111320, (lat2 - lat1) * 111320);
const polosCerca = (c) => polos
  .map((p) => ({ nombre: p.nombre, tipo: p.tipo, dist: Math.round(distM(centroLL[c], [Number(p.lon), Number(p.lat)])) }))
  .filter((p) => p.dist <= 450)
  .sort((a, b) => a.dist - b.dist);

// Contexto (contexto.py): afluencia, obra nueva y extensión. No cambia el estado.
const ctxCSV = fs.existsSync("data/contexto_seccion.csv") ? leerCSV("data/contexto_seccion.csv") : [];
const ctx = Object.fromEntries(ctxCSV.map((r) => [r.cusec, {
  estacion: r.estacion || "", estacionM: num(r.estacion_m),
  bus: num(r.bus_450), educacion: num(r.educacion_450), salud: num(r.salud_450),
  mercado: num(r.mercado_450), equipamiento: num(r.equipamiento_450),
  vivNuevas: num(r.viv_nuevas), anioDesde: num(r.anio_desde), pobExtra: num(r.pob_extra_est),
  obraNueva: r.obra_nueva === "si",
  ext: (r.extension || "").split("; ").filter(Boolean).map((e) => {
    const [tipo, c, barrio, pctVecina, pctAqui, m] = e.split("|");
    return { tipo: CORTO[tipo] || tipo, c, barrio, pctVecina: num(pctVecina), pctAqui: num(pctAqui), m: num(m) };
  }),
}]));

// Registro de prospección del Ajuntament (prospeccion.py): cierres y aperturas medidos desde 2023.
// Solo cifras por sección: las direcciones no salen del radar.
const prosCSV = fs.existsSync("data/prospeccion_seccion.csv") ? leerCSV("data/prospeccion_seccion.csv") : [];
const pros = Object.fromEntries(prosCSV.map((r) => [r.cusec, {
  registros: num(r.registros), abiertos: num(r.abiertos), cierres: num(r.cierres_2023), aperturas: num(r.aperturas_2023),
  pctCierres: num(r.pct_cierres), localesCierre: num(r.locales_cierre_reciente),
}]));
const pctCiudad = prosCSV.filter((r) => num(r.registros) >= 10).map((r) => num(r.pct_cierres)).sort((a, b) => a - b);
const medianaCierres = pctCiudad.length ? pctCiudad[Math.floor(pctCiudad.length / 2)] : null;

// Posibles locales vacíos (prospeccion.py): cerrados desde 2023 sin actividad nueva en la misma dirección.
// Base del asesor: dirección, qué había y cuándo cerró. Nunca el nombre del negocio.
const TIPO_ANTES = [
  [/forn de pa|fleca|pastisseria/i, "Panadería"], [/carnisseria|xarcuteria/i, "Carnicería"],
  [/supermercat|queviures|comestibles/i, "Supermercado"], [/perruqueria \/ barberia|est[eè]tica/i, "Peluquería y estética"],
  [/serveis de salut/i, "Salud"], [/restaurant|bar \/ cafeteria/i, "Hostelería"], [/ferreteria/i, "Ferretería"],
  [/floristeria/i, "Floristería"], [/papereria|llibreria/i, "Librería y papelería"], [/basar/i, "Bazar"],
  [/m[oò]bils|electrodom|locutori/i, "Electrónica y reparación"], [/[oò]ptica/i, "Óptica"],
];
const localesCSV = fs.existsSync("data/locales_vacios.csv") ? leerCSV("data/locales_vacios.csv") : [];
const localesPor = {};
for (const r of localesCSV) (localesPor[r.cusec] ??= []).push({
  dir: r.direccion, lon: num(r.lon), lat: num(r.lat), antes: r.antes, fecha: r.fecha_cierre,
  tipoAntes: (TIPO_ANTES.find(([rx]) => rx.test(r.antes)) || [])[1] || null,
});

// Referencias de la ciudad para enseñar cifras sin "pp": variación de vecinos de la zona típica y orden de renta
const mediana = (xs) => { const s = xs.filter((x) => x != null).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
const pobVar = Object.fromEntries(v2.map((r) => [r.cusec, num(r.pob_var_pct)]));
const pobTipica = mediana(v3.filter((r) => r.revisar_limites !== "si").map((r) => pobVar[r.cusec] ?? null));
const rentas = v3.map((r) => porSeccion[r.cusec]?.renta).filter((x) => x != null).sort((a, b) => a - b);

const fechaNum = (f) => { const [d, m, a] = (f || "").split("/"); return Number(`${a || 0}${(m || "0").padStart(2, "0")}${(d || "0").padStart(2, "0")}`); };
for (const l of Object.values(localesPor)) l.sort((a, b) => fechaNum(b.fecha) - fechaNum(a.fecha));

const zonas = v3.map((r) => {
  const s = porSeccion[r.cusec] || { ops: [] };
  return {
    c: r.cusec,
    barrio: r.barrio,
    estado: r.estado,
    demanda: r.demanda,
    pobRel: num(r.pob_rel_pp),
    rentaRel: num(r.renta_rel_pp),
    fuentePob: r.fuente_poblacion,
    indice: num(r.indice_actividad),
    revisar: r.revisar_limites === "si",
    ficha: r.ficha.replace(/^[^:]+:\s*/, "").replace(/; (huecos|por debajo de lo normal): .*$/, "."),
    vecinos: s.vecinos,
    renta: s.renta,
    rentaPuesto: s.renta != null ? rentas.indexOf(s.renta) + 1 : null, // 1 = la más baja
    rentaTotal: rentas.length,
    rentaMediana: mediana(rentas),
    pobVar: r.revisar_limites === "si" ? null : pobVar[r.cusec] ?? null, // % de vecinos 2015-2024 (INE)
    pobTipica,
    pct65: s.pct65,
    ops: s.ops,
    otros: s.otros || [],
    sobra: s.sobra || [],
    polos: polosCerca(r.cusec),
    ctx: ctx[r.cusec] || null,
    pros: pros[r.cusec] ? { ...pros[r.cusec], mediana: medianaCierres } : null,
    locales: localesPor[r.cusec] || [],
  };
});

// Locales con cierre reciente y sin actividad nueva (prospeccion.py): base del asesor de locales.
// Se proyectan con la misma escala que el mapa para pintarlos como puntos.
const locCSV = fs.existsSync("data/locales_vacios.csv") ? leerCSV("data/locales_vacios.csv") : [];
const enZona = new Set(zonas.map((z) => z.c));
const locales = locCSV.filter((r) => enZona.has(r.cusec)).map((r, i) => {
  const [x, y] = P([Number(r.lon), Number(r.lat)]);
  return { id: i, c: r.cusec, dir: r.direccion, antes: r.antes, cierre: r.fecha_cierre,
    x: +((x - minX) * k).toFixed(1), y: +((y - minY) * k).toFixed(1) };
});

const fuera = Object.entries(geo).filter(([c]) => !zonas.some((z) => z.c === c)).map(([c]) => c);
fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync("src/data/zonas.json", JSON.stringify({ w: W, h: H, geo, zonas, fuera, locales }));

const cuenta = zonas.reduce((m, z) => ((m[z.estado] = (m[z.estado] || 0) + 1), m), {});
console.log(`zonas.json: ${zonas.length} zonas`, cuenta, `| ${zonas.reduce((t, z) => t + z.ops.length, 0)} oportunidades | ${fuera.length} rurales | ${locales.length} locales con cierre reciente`);
