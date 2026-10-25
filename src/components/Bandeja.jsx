import { useMemo, useState } from "react";
import { BARRIOS, ESTADOS, TIPOS, avisoObra, lecturaLocales, datosCiudad, ordenar, rotacionAlta, veredicto, zonas } from "../lib.js";
import Mapa from "./Mapa.jsx";

export default function Bandeja({ abrir, marcados }) {
  const [estado, setEstado] = useState("ACCION");
  const [barrio, setBarrio] = useState("");
  const [tipo, setTipo] = useState("");

  const lista = useMemo(() => ordenar(zonas.filter((z) =>
    (estado === "TODAS" || (estado === "ROTACION" ? rotacionAlta(z) : estado === "EXTENSION" ? z.ctx?.ext?.length > 0 : estado === "ACCION" ? ["POTENCIAL", "DECLIVE", "EN RIESGO"].includes(z.estado) || z.ops.some((o) => o.fiable) || marcados[z.c]?.length > 0 : z.estado === estado)) &&
    (!barrio || z.barrio === barrio) &&
    (!tipo || z.ops.some((o) => o.tipo === tipo)))), [estado, barrio, tipo, marcados]);

  const dc = useMemo(datosCiudad, []);
  const cuenta = (e) => zonas.filter((z) => z.estado === e).length;
  const visibles = new Set(lista.map((z) => z.c));

  return (
    <div className="bandeja">
      <aside className="filtros" aria-label="Filtros">
        <fieldset>
          <legend>Estado</legend>
          {[["ACCION", "Requieren acción", zonas.filter((z) => ["POTENCIAL", "DECLIVE", "EN RIESGO"].includes(z.estado) || z.ops.some((o) => o.fiable) || marcados[z.c]?.length > 0).length],
            ...Object.keys(ESTADOS).map((e) => [e, ESTADOS[e].nombre, cuenta(e)]),
            ["EXTENSION", "Extender lo que funciona", zonas.filter((z) => z.ctx?.ext?.length > 0).length],
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
        <section className="ciudad" aria-label="Lo que dicen los datos de Mataró">
          <h2>Lo que dicen los datos de Mataró</h2>
          <div className="ciudad-grid">
            <article>
              <h3>Donde menos renta, más cierres</h3>
              <p>Desde 2023 ha cerrado el <b>{dc.cierresBaja} %</b> de los negocios registrados en las zonas de renta más baja, frente al <b>{dc.cierresAlta} %</b> en las de renta más alta.</p>
              <p className="ciudad-accion">Prioridad para RetailLab, Aixequem Persianes y la OME.</p>
              <button className="btn peq" onClick={() => setEstado("ROTACION")}>Ver zonas con rotación alta</button>
            </article>
            <article>
              <h3>{dc.locales} locales cerrados sin actividad nueva</h3>
              <p>Cerrados desde 2023 y sin ningún negocio nuevo registrado en la misma dirección, según el registro de prospección del Ajuntament.</p>
              <p className="ciudad-accion">Bolsa de locales para quien emprende: en cada ficha y en el Asesor.</p>
            </article>
            <article>
              <h3>{dc.extZonas} zonas para una segunda tienda</h3>
              <p>Un tipo de negocio funciona en la zona de al lado y aquí casi no hay.</p>
              <p className="ciudad-accion">Ayudar al comercio que ya funciona a abrir donde falta.</p>
              <button className="btn peq" onClick={() => setEstado("EXTENSION")}>Ver estas zonas</button>
            </article>
          </div>
          <p className="nota">Renta: zonas ordenadas por renta por persona (INE) y divididas en tres grupos iguales; solo zonas con 20 o más negocios registrados. Es una relación, no una causa.</p>
        </section>
        <header className="cola-head">
          <h1>{lista.length} {lista.length === 1 ? "zona" : "zonas"}</h1>
          <p>Ordenadas por prioridad: primero potencial, declive y riesgo; dentro de cada estado, las que más se apartan de lo normal. Los porcentajes son la oferta de cada tipo frente a lo normal en Mataró; en salud, óptica, peluquería, electrónica, floristería y librería, frente a barrios de renta parecida.</p>
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
                  <span className="fila-ficha">{veredicto(z).texto}</span>
                  {ops.length > 0 && (
                    <span className="huecos">
                      {ops.slice(0, 4).map((o) => (
                        <span key={o.tipo} className={`hueco${o.fiable ? "" : " dudoso"}`}>{o.tipo} <b>{o.pct} %</b></span>
                      ))}
                    </span>
                  )}
                  <span className="fila-meta">
                    {ops.length > 0 && <span>{ops.length} {ops.length === 1 ? "tipo" : "tipos"} muy por debajo de lo normal</span>}
                    {marcados[z.c]?.length > 0 && <span className={`tag ${lecturaLocales(z, marcados[z.c]).tipo}`}>{lecturaLocales(z, marcados[z.c]).titulo}</span>}
                    {avisoObra(z) && <span className={`tag ${avisoObra(z).tipo}`}>{avisoObra(z).corto}</span>}
                    {rotacionAlta(z) && <span className="tag alerta">Rotación alta: {z.pros.pctCierres} % de cierres desde 2023</span>}
                    {z.ctx?.ext?.length > 0 && <span className="tag">Extender: {z.ctx.ext.map((e) => e.tipo).join(", ")}</span>}
                    {z.revisar && <span className="tag gris">Datos de población a revisar</span>}
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
