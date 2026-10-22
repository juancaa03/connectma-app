import { useState } from "react";
import { ESTADOS, TIPOS, zonas } from "../lib.js";
import Mapa from "./Mapa.jsx";

export default function VistaMapa({ abrir }) {
  const [tipo, setTipo] = useState("");
  const max = tipo ? Math.max(...zonas.map((z) => z.ops.find((o) => o.tipo === tipo)?.faltan || 0)) : 0;
  const color = tipo
    ? (z) => {
        const f = z.ops.find((o) => o.tipo === tipo)?.faltan || 0;
        return f ? `color-mix(in srgb, var(--sun) ${Math.round(35 + 65 * (f / max))}%, white)` : "var(--st-vacio)";
      }
    : undefined;
  return (
    <div className="pagina vista-mapa">
      <header className="pag-head fila-head">
        <div>
          <h1>Mapa del radar</h1>
          <p>Pulsa una zona para abrir su ficha.</p>
        </div>
        <label className="campo">Ver dónde falta
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Estado de cada zona</option>
            {TIPOS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
      </header>
      <Mapa color={color} onSelect={abrir} alto="72vh" />
      <ul className="leyenda">
        {tipo
          ? <><li><span className="dot" style={{ background: "var(--sun)" }} />Más intenso = faltan más negocios de {tipo.toLowerCase()}</li><li><span className="dot" style={{ background: "var(--st-vacio)" }} />Sin hueco</li></>
          : Object.entries(ESTADOS).map(([k, e]) => <li key={k}><span className="dot" style={{ background: e.color }} />{e.nombre}</li>)}
      </ul>
      <p className="nota">En gris claro, la periferia (urbanizaciones y polígonos, 4,9 % de la población): fuera del análisis porque allí la compra es en coche, no a pie.</p>
    </div>
  );
}
