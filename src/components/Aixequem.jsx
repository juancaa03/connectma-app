import { ESTADOS, descargarCSV, faltanTotal, fmt, ordenar, porCodigo, pp, zonas } from "../lib.js";

export default function Aixequem({ enLista, alternarLista, abrir, marcados }) {
  const lista = ordenar(enLista.map((c) => porCodigo[c]).filter(Boolean));
  const sugeridas = ordenar(zonas.filter((z) => ["DECLIVE", "EN RIESGO"].includes(z.estado) && !enLista.includes(z.c)));

  const exportar = () => descargarCSV("candidatas_aixequem_persianes.csv", [
    ["Sección", "Barrio", "Estado", "Población vs barrio típico (pp)", "Comercio de proximidad (% de lo típico)", "Negocios que faltan", "Locales vacíos marcados", "Motivo"],
    ...lista.map((z) => [z.c, z.barrio, ESTADOS[z.estado].nombre, z.pobRel, z.indice == null ? "" : Math.round(z.indice * 100),
      z.ops.map((o) => `${o.tipo} (${Math.round(o.faltan)})`).join(", "), (marcados[z.c] || []).length, z.ficha]),
  ]);

  return (
    <div className="pagina">
      <header className="pag-head">
        <h1>Candidatas a Aixequem Persianes</h1>
        <p>La lista que llevarías a la reunión de las ayudas del año. Añade zonas desde su ficha; las sugerencias vienen del radar.</p>
      </header>

      {lista.length === 0 ? (
        <p className="vacio">Aún no has propuesto ninguna zona. Empieza por las sugeridas o abre una ficha y pulsa "Proponer para Aixequem Persianes".</p>
      ) : (
        <>
          <div className="table-scroll">
            <table className="tabla">
              <thead><tr><th>Zona</th><th>Estado</th><th className="n">Población</th><th className="n">Comercio</th><th className="n">Faltan</th><th className="n">Locales vacíos</th><th /></tr></thead>
              <tbody>{lista.map((z) => (
                <tr key={z.c}>
                  <td><button className="link" onClick={() => abrir(z.c)}>{z.barrio}</button> <span className="cod">{z.c}</span></td>
                  <td><span className="dot" style={{ background: ESTADOS[z.estado].color }} /> {ESTADOS[z.estado].nombre}</td>
                  <td className="n">{pp(z.pobRel)}</td>
                  <td className="n">{z.indice == null ? "—" : `${fmt(z.indice * 100)} %`}</td>
                  <td className="n">{Math.round(faltanTotal(z)) || "—"}</td>
                  <td className="n">{(marcados[z.c] || []).length || "—"}</td>
                  <td><button className="link" onClick={() => alternarLista(z.c)}>Quitar</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <button className="btn principal" onClick={exportar}>Exportar lista (CSV)</button>
        </>
      )}

      {sugeridas.length > 0 && (
        <section className="sugeridas">
          <h2>Sugeridas por el radar</h2>
          <ul>{sugeridas.map((z) => (
            <li key={z.c}>
              <span className="dot" style={{ background: ESTADOS[z.estado].color }} />
              <button className="link" onClick={() => abrir(z.c)}>{z.barrio} <span className="cod">{z.c}</span></button>
              <span className="sug-txt">{z.ficha}</span>
              <button className="btn peq" onClick={() => alternarLista(z.c)}>Añadir</button>
            </li>
          ))}</ul>
        </section>
      )}
    </div>
  );
}
