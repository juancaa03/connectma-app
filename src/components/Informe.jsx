import { ESTADOS, fmt, porCodigo, pp } from "../lib.js";
import Mapa from "./Mapa.jsx";

// Informe de una página para quien quiere emprender. Se imprime o se guarda como PDF desde el navegador.
export default function Informe({ c, cerrar }) {
  const z = porCodigo[c];
  if (!z) return null;
  const e = ESTADOS[z.estado];
  const hoy = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const fiables = z.ops.filter((o) => o.fiable);
  return (
    <div className="informe-capa">
      <div className="informe-barra no-print">
        <button className="btn principal" onClick={() => window.print()}>Descargar PDF</button>
        <button className="btn" onClick={cerrar}>Volver</button>
        <p>En el diálogo de impresión, elige "Guardar como PDF".</p>
      </div>
      <article className="informe" style={{ "--c": e.color }}>
        <header>
          <img src="/assets/logo.png" alt="ConnectMA" width="130" />
          <div>
            <p className="inf-sup">Informe de zona · {hoy}</p>
            <h1>{z.barrio}</h1>
            <p className="cod">Sección censal {z.c} · Mataró</p>
          </div>
        </header>
        <div className="inf-cuerpo">
          <div>
            <p className="inf-estado"><span className="dot" />{e.nombre}: {e.lectura}</p>
            <p className="inf-ficha">{z.ficha}</p>
            <dl className="datos">
              <div><dt>Vecinos a 400 m a pie</dt><dd>{fmt(z.vecinos)}</dd></div>
              <div><dt>Comercio de proximidad</dt><dd>{z.indice == null ? "—" : `${fmt(z.indice * 100)} %`}<small>de un barrio típico</small></dd></div>
              <div><dt>Población 2015–2024</dt><dd>{pp(z.pobRel)}<small>vs barrio típico</small></dd></div>
              <div><dt>Renta por persona</dt><dd>{pp(z.rentaRel)}<small>vs barrio típico</small></dd></div>
            </dl>
          </div>
          <Mapa seleccion={c} alto="300px" etiqueta={`Ubicación de ${z.barrio}`} />
        </div>
        <h2>Negocios que faltan en la zona</h2>
        {fiables.length ? (
          <table className="ops">
            <thead><tr><th>Tipo de negocio</th><th className="n">Hay ahora</th><th className="n">Lo normal en Mataró</th><th className="n">Faltan</th></tr></thead>
            <tbody>{fiables.map((o) => (
              <tr key={o.tipo}><td>{o.tipo}</td><td className="n">{o.oferta}</td><td className="n">{fmt(o.esperado)}</td><td className="n"><b>{fmt(o.faltan)}</b></td></tr>
            ))}</tbody>
          </table>
        ) : <p>En esta zona no detectamos ningún tipo de negocio de proximidad claramente por debajo de lo normal.</p>}
        <footer>
          <p><b>Cómo se calcula.</b> Se cuentan los vecinos y los negocios en 400 m a la redonda y se comparan con la mediana de los barrios de Mataró. Un hueco solo cuenta si faltan al menos 2 negocios, hay menos de la mitad de lo normal y la probabilidad de que sea casualidad es menor del 5 %.</p>
          <p><b>Fuentes.</b> Censo de actividades del Ajuntament de Mataró (GeoVisor), INE (población y renta por sección censal, 2015–2024). Datos agregados, sin información personal.</p>
          <p><b>Antes de decidir.</b> Un hueco es una hipótesis: compruébalo a pie de calle (mercados, grandes superficies, locales disponibles) y consulta con el servicio de Comerç del Ajuntament.</p>
        </footer>
      </article>
    </div>
  );
}
