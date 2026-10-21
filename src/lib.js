import { useEffect, useState } from "react";
import datos from "./data/zonas.json";

export const { zonas, geo, fuera, w: MAPA_W, h: MAPA_H } = datos;
export const porCodigo = Object.fromEntries(zonas.map((z) => [z.c, z]));

export const ESTADOS = {
  POTENCIAL: { nombre: "Potencial", color: "var(--st-potencial)", accion: "informe", orden: 0,
    lectura: "Faltan negocios para los vecinos que hay o que llegan." },
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
