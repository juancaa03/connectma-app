import { useEffect, useRef, useState } from "react";
import { ESTADOS, fmt, porCodigo, pp } from "../lib.js";
import Mapa from "./Mapa.jsx";

export default function Ficha({ c, cerrar, abrir, enLista, alternarLista, marcados, marcar, informe }) {
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
  const locales = marcados[c] || [];
  const propuesta = enLista.includes(c);

  return (
    <div className="velo" onClick={cerrar}>
      <aside className="ficha" role="dialog" aria-modal="true" aria-labelledby="ficha-t" onClick={(ev) => ev.stopPropagation()} style={{ "--c": e.color }}>
        <header>
          <p className="ficha-estado"><span className="dot" />{e.nombre}</p>
          <h2 id="ficha-t" ref={ref} tabIndex={-1}>{z.barrio}</h2>
          <p className="cod">Sección censal {z.c}</p>
          <button className="cerrar" onClick={cerrar} aria-label="Cerrar ficha">Cerrar</button>
        </header>

        <p className="ficha-texto">{z.ficha}</p>
        <Mapa seleccion={c} alto="220px" onSelect={abrir} etiqueta={`Ubicación de ${z.barrio}`} />

        <dl className="datos">
          <div><dt>Vecinos a 400 m</dt><dd>{fmt(z.vecinos)}</dd></div>
          <div><dt>Comercio de proximidad</dt><dd>{z.indice == null ? "—" : `${fmt(z.indice * 100)} %`}<small>de un barrio típico</small></dd></div>
          <div><dt>Población</dt><dd>{pp(z.pobRel)}<small>vs barrio típico</small></dd></div>
          <div><dt>Renta por persona</dt><dd>{pp(z.rentaRel)}<small>vs barrio típico</small></dd></div>
        </dl>
        {z.revisar && <p className="aviso">El INE cambió los límites de esta sección: la tendencia de población usa la serie municipal 2008–2020.</p>}

        {z.ops.length > 0 && (
          <>
            <h3>Negocios que faltan</h3>
            <table className="ops">
              <thead><tr><th>Tipo</th><th className="n">Hay</th><th className="n">Lo normal</th><th className="n">Faltan</th></tr></thead>
              <tbody>
                {z.ops.map((o) => (
                  <tr key={o.tipo} className={o.fiable ? "" : "dudoso"}>
                    <td>{o.tipo}{!o.fiable && <small> · dato poco fiable</small>}</td>
                    <td className="n">{o.oferta}</td><td className="n">{fmt(o.esperado)}</td><td className="n"><b>{fmt(o.faltan)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <h3>Qué hacer</h3>
        <div className="acciones">
          <button className={`btn${e.accion === "informe" ? " principal" : ""}`} onClick={() => informe(c)}>Generar informe para emprendedor</button>
          <button className={`btn${e.accion === "aixequem" ? " principal" : ""}${propuesta ? " hecho" : ""}`} onClick={() => alternarLista(c)} aria-pressed={propuesta}>
            {propuesta ? "Propuesta para Aixequem Persianes" : "Proponer para Aixequem Persianes"}
          </button>
          <button className={`btn${e.accion === "local" ? " principal" : ""}`} onClick={() => setFormLocal((v) => !v)} aria-expanded={formLocal}>Marcar local vacío</button>
        </div>

        {formLocal && (
          <form className="form-local" onSubmit={(ev) => { ev.preventDefault(); if (dir.trim()) { marcar(c, dir.trim()); setDir(""); setFormLocal(false); } }}>
            <label>Dirección del local
              <input value={dir} onChange={(ev) => setDir(ev.target.value)} placeholder="p. ej. Carrer de Cuba, 45" autoFocus />
            </label>
            <button className="btn principal" type="submit">Guardar local vacío</button>
            <p className="nota">Prototipo: se guarda en este navegador. En el servicio real alimenta el censo municipal y el declive pasa a medirse con cierres.</p>
          </form>
        )}
        {locales.length > 0 && (
          <ul className="locales">{locales.map((l, i) => <li key={i}>Local vacío: {l.dir} <small>({l.fecha})</small></li>)}</ul>
        )}
      </aside>
    </div>
  );
}
