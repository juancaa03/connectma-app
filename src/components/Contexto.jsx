import { avisoObra } from "../lib.js";

// Contexto de la zona: afluencia, obra nueva y extensión. Información para el criterio de la técnica; no cambia el estado.
export default function Contexto({ z, abrir, compacto = false }) {
  const x = z.ctx;
  if (!x) return null;
  const obra = avisoObra(z);
  const chips = [
    x.estacionM != null && x.estacionM <= 800 && `Estación ${x.estacion ? `(${x.estacion}) ` : ""}a ${x.estacionM} m`,
    x.bus > 0 && `${x.bus} ${x.bus === 1 ? "parada" : "paradas"} de bus`,
    x.educacion > 0 && `${x.educacion} ${x.educacion === 1 ? "centro educativo" : "centros educativos"}`,
    x.salud > 0 && `${x.salud} ${x.salud === 1 ? "centro de salud" : "centros de salud"}`,
    x.mercado > 0 && `${x.mercado === 1 ? "mercado municipal" : `${x.mercado} mercados`}`,
    x.equipamiento > 0 && `${x.equipamiento} ${x.equipamiento === 1 ? "equipamiento" : "equipamientos"} (biblioteca, deporte)`,
  ].filter(Boolean);
  return (
    <section className="contexto">
      {obra && <div className={`lectura ${obra.tipo}`}><b>{obra.corto}.</b> {obra.texto}</div>}
      {chips.length > 0 && (
        <>
          <h3>Qué atrae gente a menos de 450 m</h3>
          <ul className="chips">{chips.map((t) => <li key={t}>{t}</li>)}</ul>
        </>
      )}
      {x.ext?.length > 0 && (
        <>
          <h3>Extender lo que funciona al lado</h3>
          <ul className="ext">{x.ext.map((e) => (
            <li key={e.tipo + e.c}>
              <b>{e.tipo}</b>: {e.pctVecina} % de lo normal en{" "}
              {abrir && !compacto ? <button className="link" onClick={() => abrir(e.c)}>{e.barrio} ({e.c})</button> : `${e.barrio} (${e.c})`}
              , a {e.m} m; aquí, {e.pctAqui} %.
            </li>
          ))}</ul>
          {!compacto && <p className="nota">Mide concentración, no crecimiento: con el histórico del censo se podría ver qué actividad está creciendo.</p>}
        </>
      )}
    </section>
  );
}
