import { ESTADOS, MAPA_H, MAPA_W, fuera, geo, porCodigo } from "../lib.js";

// Mapa SVG de las secciones. color(z) decide el relleno; sin teselas ni dependencias.
export default function Mapa({ color, seleccion, onSelect, resaltar, alto, etiqueta = "Mapa de Mataró por secciones" }) {
  const relleno = color || ((z) => ESTADOS[z.estado].color);
  return (
    <svg className="mapa" viewBox={`0 0 ${MAPA_W} ${MAPA_H}`} role="img" aria-label={etiqueta} style={alto ? { maxHeight: alto } : undefined}>
      {fuera.map((c) => <path key={c} d={geo[c].d} className="sec rural" />)}
      {Object.keys(porCodigo).map((c) => {
        const z = porCodigo[c];
        const activo = seleccion === c;
        const tenue = resaltar && !resaltar(z);
        return (
          <path
            key={c}
            d={geo[c].d}
            className={`sec${activo ? " activo" : ""}${tenue ? " tenue" : ""}${onSelect ? " clic" : ""}`}
            style={{ fill: relleno(z) }}
            onClick={onSelect ? () => onSelect(c) : undefined}
            onKeyDown={onSelect ? (e) => (e.key === "Enter" || e.key === " ") && onSelect(c) : undefined}
            tabIndex={onSelect ? 0 : -1}
            aria-label={onSelect ? `${z.barrio}, ${ESTADOS[z.estado].nombre}` : undefined}
          >
            <title>{`${z.barrio} · ${ESTADOS[z.estado].nombre}`}</title>
          </path>
        );
      })}
      {seleccion && geo[seleccion] && (
        <path d={geo[seleccion].d} className="sec contorno" pointerEvents="none" />
      )}
    </svg>
  );
}
