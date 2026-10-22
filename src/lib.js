import { useEffect, useState } from "react";
import datos from "./data/zonas.json";

export const { zonas, geo, fuera, w: MAPA_W, h: MAPA_H } = datos;
export const porCodigo = Object.fromEntries(zonas.map((z) => [z.c, z]));

export const ESTADOS = {
  POTENCIAL: { nombre: "Potencial", color: "var(--st-potencial)", accion: "informe", orden: 0,
    lectura: "Tiene muy poca oferta de algún tipo de negocio para los vecinos que hay o que llegan." },
  DECLIVE: { nombre: "Declive", color: "var(--st-declive)", accion: "aixequem", orden: 1,
    lectura: "Pierde vecinos y ya le falta comercio." },
  "EN RIESGO": { nombre: "En riesgo", color: "var(--st-riesgo)", accion: "local", orden: 2,
    lectura: "Hoy tiene comercio, pero pierde demanda." },
  ESTABLE: { nombre: "Estable", color: "var(--st-estable)", accion: null, orden: 3,
    lectura: "Sin señal clara." },
  CONSOLIDADA: { nombre: "Consolidada", color: "var(--st-consolidada)", accion: null, orden: 4,
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
      texto: `${n} ${n === 1 ? "local vacío marcado" : "locales vacíos marcados"} en una zona ${n >= 3 ? "donde se acumulan cierres" : "que pierde demanda"}. Vigila si se suman más: es candidata a Aixequem Persianes.` };
  const polo = z.polos?.[0];
  if ((z.indice ?? 0) >= 1 || polo)
    return { tipo: "ubicacion", titulo: "Oportunidad de ubicación a revisar",
      texto: `Local vacío en una zona que funciona (${Math.round((z.indice ?? 0) * 100)} % del comercio de un barrio típico${polo ? `, ${polo.nombre} a ${polo.dist} m` : ""}). Encaja un negocio que complemente lo que ya atrae gente. Antes, revisa por qué está vacío: precio, estado o tamaño.` };
  return { tipo: "ubicacion", titulo: "Local vacío a revisar",
    texto: "Revisa por qué está vacío (precio, estado, tamaño) y si encaja alguno de los tipos por debajo de lo normal en la zona." };
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

// Estado del usuario que solo vive en su navegador (lista Aixequem, locales marcados).
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
