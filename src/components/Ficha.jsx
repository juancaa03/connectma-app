import { useEffect, useRef, useState } from "react";
import { ESTADOS, avisoObra, fmt, lecturaLocales, porCodigo, rentaTxt, rotacionAlta, vecinosTxt, veredicto } from "../lib.js";
import Contexto from "./Contexto.jsx";
import Mapa from "./Mapa.jsx";

// Ficha para la técnica de Comerç: primero el veredicto y la acción; los detalles, plegados.
export default function Ficha({ c, cerrar, abrir, marcados, marcar, informe }) {
  const z = porCodigo[c];
  const ref = useRef(null);
  const [formLocal, setFormLocal] = useState(false);
  const [dir, setDir] = useState("");
  useEffect(() => { ref.current?.focus(); setFormLocal(false); }, [c]);
  useEffect(() => {
    const k = (e) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [cerrar]);
  if (!z) return null;
  const e = ESTADOS[z.estado];
  const v = veredicto(z);
  const obra = avisoObra(z);
  const marcadosAqui = marcados[c] || [];
  const lectura = lecturaLocales(z, marcadosAqui);
  const fiables = z.ops.filter((o) => o.fiable);
  const accionLocal = e.accion === "local";
  const vec = vecinosTxt(z), ren = rentaTxt(z);

  return (
    <div className="velo" onClick={cerrar}>
      <aside className="ficha" role="dialog" aria-modal="true" aria-labelledby="ficha-t" onClick={(ev) => ev.stopPropagation()} style={{ "--c": e.color }}>
        <header>
          <p className="ficha-estado"><span className="dot" />{e.nombre}</p>
          <h2 id="ficha-t" ref={ref} tabIndex={-1}>{z.barrio}</h2>
          <p className="cod">Sección censal {z.c}</p>
          <button className="cerrar" onClick={cerrar} aria-label="Cerrar ficha">Cerrar</button>
        </header>

        <section className="veredicto">
          <h3>{v.titulo}</h3>
          <p>{v.texto}</p>
          {obra?.tipo === "alerta" && <p className="veredicto-aviso"><b>{obra.corto}.</b> {obra.texto}</p>}
          <div className="acciones">
            <button className={`btn${accionLocal ? "" : " principal"}`} onClick={() => informe(c)}>Generar informe para emprendedor</button>
            <button className={`btn${accionLocal ? " principal" : ""}`} onClick={() => setFormLocal((x) => !x)} aria-expanded={formLocal}>Marcar local vacío</button>
          </div>
          {formLocal && (
            <form className="form-local" onSubmit={(ev) => { ev.preventDefault(); if (dir.trim()) { marcar(c, dir.trim()); setDir(""); setFormLocal(false); } }}>
              <label>Dirección del local
                <input value={dir} onChange={(ev) => setDir(ev.target.value)} placeholder="p. ej. Carrer de Cuba, 45" autoFocus />
              </label>
              <button className="btn principal" type="submit">Guardar local vacío</button>
              <p className="nota">Prototipo: se guarda en este navegador. En el servicio real alimentaría el registro municipal.</p>
            </form>
          )}
          {marcadosAqui.length > 0 && (
            <ul className="locales">{marcadosAqui.map((l, i) => <li key={i}>Local vacío: {l.dir} <small>({l.fecha})</small></li>)}</ul>
          )}
          {lectura && <div className={`lectura ${lectura.tipo}`} role="status"><b>{lectura.titulo}.</b> {lectura.texto}</div>}
        </section>

        <Mapa seleccion={c} alto="200px" onSelect={abrir} etiqueta={`Ubicación de ${z.barrio}`} />

        <dl className="datos tres">
          <div><dt>Vecinos a 5 min</dt><dd>{fmt(z.vecinos)}</dd><small>a 450 m andando</small></div>
          <div><dt>Comercio de proximidad</dt><dd>{z.indice == null ? "—" : `${fmt(z.indice * 100)} %`}</dd><small>de una zona típica</small></div>
          <div><dt>Cierres desde 2023</dt>
            {z.pros?.registros >= 10
              ? <><dd>{z.pros.pctCierres} %</dd><small>{z.pros.cierres} de {z.pros.registros} negocios{z.pros.mediana != null ? ` · zona típica ${z.pros.mediana} %` : ""}</small>{rotacionAlta(z) && <small className="rot">Rotación alta</small>}</>
              : <><dd>—</dd><small>pocos registros</small></>}
          </div>
        </dl>

        {fiables.length > 0 && (
          <>
            <h3>Qué falta</h3>
            <table className="ops">
              <thead><tr><th>Tipo</th><th className="n">Hay</th><th className="n">Lo normal</th><th className="n">% de lo normal</th></tr></thead>
              <tbody>{fiables.map((o) => (
                <tr key={o.tipo}><td>{o.tipo}</td><td className="n">{o.oferta}</td><td className="n">{fmt(o.esperado)}</td><td className="n"><b>{o.pct} %</b></td></tr>
              ))}</tbody>
            </table>
          </>
        )}

        {z.locales?.length > 0 && (
          <details className="plegable">
            <summary>{z.locales.length} {z.locales.length === 1 ? "local cerró" : "locales cerrados"} desde 2023 sin actividad nueva</summary>
            <ul className="locales-lista">{z.locales.map((l) => (
              <li key={l.dir} className="local">
                <p className="local-dir"><b>{l.dir}</b></p>
                <p>Antes: {l.antes ? l.antes.toLowerCase() : "sin categoría"} · cerró el {l.fecha}</p>
              </li>
            ))}</ul>
            <p className="nota">Registro de prospección del Ajuntament. Posibles locales vacíos: comprobar a pie de calle.</p>
          </details>
        )}

        <details className="plegable">
          <summary>Más datos de la zona</summary>
          <dl className="datos">
            <div><dt>Vecinos</dt><dd>{vec.valor}</dd><small>{vec.nota}</small></div>
            <div><dt>Renta</dt><dd>{ren.valor}</dd><small>{ren.nota}</small></div>
          </dl>
          {z.pros?.registros >= 10 && <p className="nota">Aperturas desde 2023: {z.pros.aperturas}. El registro anota mejor los cierres que las aperturas de negocios antiguos: sirve para comparar zonas entre sí.</p>}
          {z.polos?.length > 0 && <p className="cerca">Cerca: {z.polos.map((p) => `${p.nombre} (${p.dist} m)`).join(" · ")}</p>}
          {z.revisar && <p className="aviso">El INE cambió los límites de esta sección: la tendencia de población usa la serie municipal 2008–2020.</p>}
          {z.sobra?.length > 0 && <p>Ya hay de sobra: {z.sobra.map((s) => `${s.tipo.toLowerCase()} (${s.pct} % de lo normal)`).join(", ")}.</p>}
          <Contexto z={z} abrir={abrir} />
          {z.otros?.length > 0 && (
            <>
              <h3>A confirmar</h3>
              <ul className="otros">{z.otros.map((o) => <li key={o.tipo}><b>{o.tipo}</b> ({o.pct} % de lo normal). {o.motivo}.</li>)}</ul>
            </>
          )}
        </details>
      </aside>
    </div>
  );
}
