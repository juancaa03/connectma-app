import { useEffect, useState } from "react";
import datos from "./data/zonas.json";

export const { zonas, geo, fuera, w: MAPA_W, h: MAPA_H } = datos;
export const porCodigo = Object.fromEntries(zonas.map((z) => [z.c, z]));

export const ESTADOS = {
  POTENCIAL: { nombre: "Potencial", color: "var(--st-potencial)", accion: "informe", orden: 0,
    lectura: "Tiene muy poca oferta de algún tipo de negocio para los vecinos que hay o que llegan." },
  DECLIVE: { nombre: "Declive", color: "var(--st-declive)", accion: "local", orden: 1,
    lectura: "Pierde demanda y ya le falta comercio." },
  "EN RIESGO": { nombre: "En riesgo", color: "var(--st-riesgo)", accion: "local", orden: 2,
    lectura: "Hoy tiene comercio, pero pierde demanda." },
  ESTABLE: { nombre: "Sin señal clara", color: "var(--st-estable)", accion: null, orden: 3,
    lectura: "Algo menos de comercio que una zona típica, sin tendencia clara." },
  CONSOLIDADA: { nombre: "Bien servida", color: "var(--st-consolidada)", accion: null, orden: 4,
    lectura: "Comercio suficiente y demanda estable o creciente." },
};

export const TIPOS = [...new Set(zonas.flatMap((z) => z.ops.map((o) => o.tipo)))].sort((a, b) => a.localeCompare(b, "es"));
export const BARRIOS = [...new Set(zonas.map((z) => z.barrio))].sort((a, b) => a.localeCompare(b, "es"));

export const faltanTotal = (z, soloFiables = true) =>
  z.ops.filter((o) => !soloFiables || o.fiable).reduce((t, o) => t + o.faltan, 0);

// Prioridad de la bandeja: estado, y dentro de cada estado, cuántos negocios faltan
export function ordenar(lista) {
  return [...lista].sort((a, b) =>
    ESTADOS[a.estado].orden - ESTADOS[b.estado].orden ||
    faltanTotal(b) - faltanTotal(a) ||
    a.barrio.localeCompare(b.barrio, "es"));
}

// Local vacío marcado por la técnica: ¿oportunidad de ubicación o síntoma de declive?
export function lecturaLocales(z, locales = []) {
  const n = locales.length;
  if (!n) return null;
  if (["DECLIVE", "EN RIESGO"].includes(z.estado) || n >= 3)
    return { tipo: "alerta", titulo: "Posible síntoma de declive",
      texto: `${n} ${n === 1 ? "local vacío marcado" : "locales vacíos marcados"} en una zona ${n >= 3 ? "donde se acumulan cierres" : "que pierde demanda"}. Vigila si se suman más: es candidata a las ayudas de reactivación (Aixequem Persianes).` };
  const polo = z.polos?.[0];
  if ((z.indice ?? 0) >= 1 || polo)
    return { tipo: "ubicacion", titulo: "Oportunidad de ubicación a revisar",
      texto: `Local vacío en una zona que funciona (${Math.round((z.indice ?? 0) * 100)} % del comercio de un barrio típico${polo ? `, ${polo.nombre} a ${polo.dist} m` : ""}). Encaja un negocio que complemente lo que ya atrae gente. Antes, revisa por qué está vacío: precio, estado o tamaño.` };
  return { tipo: "ubicacion", titulo: "Local vacío a revisar",
    texto: "Revisa por qué está vacío (precio, estado, tamaño) y si encaja alguno de los tipos por debajo de lo normal en la zona." };
}

// Veredicto de la zona: lo primero que se lee en la ficha y en el informe.
// Plantillas fijas a partir de los números: nunca se inventa nada.
const lista = (xs) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`);
const pctTxt = (n) => `${Math.round(n * 100)} %`;

export function cierresTxt(z) {
  const p = z.pros;
  if (!p || p.registros < 10) return null;
  return `Desde 2023 han cerrado ${p.cierres} de sus ${p.registros} negocios registrados (${p.pctCierres} %${p.mediana != null ? `; en la zona típica, ${p.mediana} %` : ""}) y han abierto ${p.aperturas}.`;
}

// Rotación alta: cierres desde 2023 de al menos 1,25 veces los de la zona típica (con 20 negocios registrados o más)
export const rotacionAlta = (z) => z.pros?.registros >= 20 && z.pros.mediana != null && z.pros.pctCierres >= 1.25 * z.pros.mediana;

// Cifras en palabras, sin "pp"
const signo = (n) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmt(Math.abs(n))} %`;
export function vecinosTxt(z) {
  if (z.pobVar != null) return { valor: signo(z.pobVar), nota: `2015–2024 · zona típica ${signo(z.pobTipica)}` };
  if (z.pobRel == null) return { valor: "—", nota: "" };
  return { valor: z.pobRel > 3 ? "Crece" : z.pobRel < -3 ? "Pierde" : "Estable",
    nota: `${z.pobRel > 3 ? "más rápido que" : z.pobRel < -3 ? "frente a" : "como"} una zona típica · serie municipal 2008–2020` };
}
export function rentaTxt(z) {
  if (z.renta == null) return { valor: "—", nota: "" };
  const p = z.rentaPuesto, t = z.rentaTotal;
  const pos = p <= Math.round(t / 5) ? `de las más bajas de Mataró (${p}.ª de ${t})`
    : p > t - Math.round(t / 5) ? `de las más altas de Mataró (${t - p + 1}.ª de ${t})`
    : `en la media de Mataró (mediana ${fmt(z.rentaMediana)} €)`;
  return { valor: `${fmt(z.renta)} €`, nota: `por persona · ${pos}` };
}

export function veredicto(z) {
  const v = veredictoBase(z);
  if (rotacionAlta(z) && !["DECLIVE", "EN RIESGO"].includes(z.estado))
    v.texto += ` Pero aquí cierran más negocios que en una zona típica (${z.pros.pctCierres} % desde 2023, frente al ${z.pros.mediana} %): conviene saber por qué antes de abrir.`;
  return v;
}

function veredictoBase(z) {
  const ops = z.ops.filter((o) => o.fiable);
  const tipos = ops.slice(0, 3).map((o) => o.tipo.toLowerCase());
  const comercio = z.indice == null ? null : pctTxt(z.indice);
  // La demanda la decide la población; solo si está plana, la renta. El texto dice cuál de las dos fue.
  const crecePob = z.pobRel != null && z.pobRel > 3, caePob = z.pobRel != null && z.pobRel < -3;
  const demanda = z.demanda === "crece" ? (crecePob ? "La zona gana vecinos" : "La renta sube más que en Mataró")
    : z.demanda === "cae" ? (caePob ? "La zona pierde vecinos" : "La renta se queda atrás respecto a Mataró") : "La demanda está estable";
  const cierres = cierresTxt(z);
  switch (z.estado) {
    case "POTENCIAL":
      if (ops.length) {
        const o = ops[0];
        return { titulo: `Oportunidad: falta ${lista(tipos)}`,
          texto: `Para unos ${fmt(z.vecinos)} vecinos a 5 minutos andando hay ${o.oferta} de ${o.tipo.toLowerCase()}, cuando lo normal serían unos ${fmt(o.esperado)} (el ${o.pct} %). ${demanda}.` };
      }
      return { titulo: "Zona con poco comercio en general",
        texto: `Tiene el ${comercio} del comercio de proximidad de una zona típica y ${z.demanda === "crece" && crecePob ? "gana vecinos" : "su renta sube más que en Mataró"}, pero ningún tipo concreto destaca. Conviene comprobarlo a pie de calle.` };
    case "DECLIVE":
      return { titulo: "Prioridad de intervención",
        texto: `${demanda} y ya tiene solo el ${comercio} del comercio de una zona típica. ${cierres ? cierres + " " : ""}Candidata a las ayudas de reactivación (Aixequem Persianes).` };
    case "EN RIESGO":
      return { titulo: "Vigilar: hoy tiene comercio, pero pierde demanda",
        texto: `Tiene el ${comercio} del comercio de una zona típica, pero ${caePob ? "pierde vecinos" : "su renta se queda atrás respecto a Mataró"}. ${cierres || "Conviene vigilar los locales que cierran."}` };
    case "ESTABLE":
      return { titulo: "Sin señal clara", texto: `Tiene el ${comercio} del comercio de una zona típica y la demanda está estable.` };
    default:
      return { titulo: "Zona bien servida", texto: `Tiene el ${comercio} del comercio de una zona típica y la demanda está estable o crece.${ops.length ? ` Aun así, falta ${lista(tipos)}.` : ""}` };
  }
}

// Aviso de obra nueva: la población real es mayor que la del INE 2024
export function avisoObra(z) {
  const x = z.ctx;
  if (!x?.obraNueva) return null;
  const base = `~${x.vivNuevas} viviendas en edificios terminados desde ${x.anioDesde} (unos ${x.pobExtra} vecinos que el INE 2024 aún no cuenta).`;
  if (["DECLIVE", "EN RIESGO"].includes(z.estado))
    return { tipo: "alerta", corto: "Obra nueva: revisar estado", texto: `${base} La zona puede no estar perdiendo demanda: revísala antes de tratarla como ${z.estado === "DECLIVE" ? "zona en declive" : "zona en riesgo"}.` };
  if (z.estado === "POTENCIAL") return { tipo: "ubicacion", corto: "Obra nueva", texto: `${base} El potencial real es mayor que el que muestra el radar.` };
  return { tipo: "info", corto: "Obra nueva", texto: `${base} La demanda real es algo mayor que la calculada.` };
}

export const fmt = (n, d = 0) => (n == null ? "—" : n.toLocaleString("es-ES", { maximumFractionDigits: d, minimumFractionDigits: d, useGrouping: "always" }));
export const pp = (n) => (n == null ? "—" : `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmt(Math.abs(n), 1)} pp`);

// Estado del usuario que solo vive en su navegador (locales marcados).
// En producción iría a la base de datos municipal.
export function useLocal(clave, inicial) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(clave); return s ? JSON.parse(s) : inicial; } catch { return inicial; }
  });
  useEffect(() => { try { localStorage.setItem(clave, JSON.stringify(v)); } catch { /* sin almacenamiento */ } }, [clave, v]);
  return [v, setV];
}

export function descargarCSV(nombre, filas) {
  const esc = (x) => `"${String(x ?? "").replace(/"/g, '""')}"`;
  const txt = filas.map((f) => f.map(esc).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + txt], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: nombre });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
