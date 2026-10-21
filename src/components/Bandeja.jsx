import { useMemo, useState } from "react";
import { BARRIOS, ESTADOS, TIPOS, faltanTotal, ordenar, zonas } from "../lib.js";
import Mapa from "./Mapa.jsx";

export default function Bandeja({ abrir, enLista, marcados }) {
  const [estado, setEstado] = useState("ACCION");
  const [barrio, setBarrio] = useState("");
  const [tipo, setTipo] = useState("");

  const lista = useMemo(() => ordenar(zonas.filter((z) =>
    (estado === "TODAS" || (estado === "ACCION" ? ["POTENCIAL", "DECLIVE", "EN RIESGO"].includes(z.estado) || z.ops.some((o) => o.fiable) : z.estado === estado)) &&
    (!barrio || z.barrio === barrio) &&
    (!tipo || z.ops.some((o) => o.tipo === tipo)))), [estado, barrio, tipo]);

  const cuenta = (e) => zonas.filter((z) => z.estado === e).length;
  const visibles = new Set(lista.map((z) => z.c));

  return (
    <div className="bandeja">
      <aside className="filtros" aria-label="Filtros">
        <fieldset>
          <legend>Estado</legend>
          {[["ACCION", "Requieren acción", zonas.filter((z) => ["POTENCIAL", "DECLIVE", "EN RIESGO"].includes(z.estado) || z.ops.some((o) => o.fiable)).length],
            ...Object.keys(ESTADOS).map((e) => [e, ESTADOS[e].nombre, cuenta(e)]),
            ["TODAS", "Todas", zonas.length]].map(([v, n, k]) => (
            <label key={v} className={`opcion${estado === v ? " on" : ""}`}>
              <input type="radio" name="estado" value={v} checked={estado === v} onChange={() => setEstado(v)} />
              {ESTADOS[v] && <span className="dot" style={{ background: ESTADOS[v].color }} />}
              <span>{n}</span><span className="k">{k}</span>
            </label>
          ))}
        </fieldset>
        <label className="campo">Barrio
          <select value={barrio} onChange={(e) => setBarrio(e.target.value)}>
            <option value="">Todos</option>
            {BARRIOS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </label>
        <label className="campo">Negocio que falta
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Cualquiera</option>
            {TIPOS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <div className="mini-mapa">
          <Mapa alto="260px" resaltar={(z) => visibles.has(z.c)} onSelect={abrir} etiqueta="Zonas de la lista en el mapa" />
          <p className="nota">En color, las zonas de la lista.</p>
        </div>
      </aside>

      <section className="cola" aria-live="polite">
        <header className="cola-head">
          <h1>{lista.length} {lista.length === 1 ? "zona" : "zonas"}</h1>
          <p>Ordenadas por prioridad: primero potencial, declive y riesgo; dentro de cada estado, las que más negocios necesitan.</p>
        </header>
        {lista.length === 0 && <p className="vacio">Ninguna zona cumple estos filtros. Prueba con "Todas" o quita el barrio.</p>}
        <ol className="filas">
          {lista.map((z) => {
            const e = ESTADOS[z.estado];
            const ops = tipo ? z.ops.filter((o) => o.tipo === tipo) : z.ops;
            return (
              <li key={z.c}>
                <button className="fila" style={{ "--c": e.color }} onClick={() => abrir(z.c)}>
                  <span className="fila-estado"><span className="dot" />{e.nombre}</span>
                  <span className="fila-barrio">{z.barrio} <span className="cod">{z.c}</span></span>
                  <span className="fila-ficha">{z.ficha}</span>
                  {ops.length > 0 && (
                    <span className="huecos">
                      {ops.slice(0, 4).map((o) => (
                        <span key={o.tipo} className={`hueco${o.fiable ? "" : " dudoso"}`}>{o.tipo} <b>−{Math.round(o.faltan)}</b></span>
                      ))}
                    </span>
                  )}
                  <span className="fila-meta">
                    {faltanTotal(z) > 0 && <span>Faltan ~{Math.round(faltanTotal(z))} negocios</span>}
                    {enLista.includes(z.c) && <span className="tag">En lista Aixequem</span>}
                    {marcados[z.c]?.length > 0 && <span className="tag">{marcados[z.c].length} local vacío</span>}
                    {z.revisar && <span className="tag gris">Límites revisados</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
