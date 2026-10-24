import { ESTADOS, fmt, porCodigo, pp, veredicto } from "../lib.js";
import Contexto from "./Contexto.jsx";
import Mapa from "./Mapa.jsx";

// Informe de una página para quien quiere emprender: qué falta, qué sobra, cómo va la zona y dónde hay locales.
// Se imprime o se guarda como PDF desde el navegador.
export default function Informe({ c, cerrar }) {
  const z = porCodigo[c];
  if (!z) return null;
  const e = ESTADOS[z.estado];
  const v = veredicto(z);
  const hoy = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const fiables = z.ops.filter((o) => o.fiable);
  const locales = (z.locales || []).slice(0, 5);
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

        <section className="veredicto inf-veredicto">
          <h2>{v.titulo}</h2>
          <p>{v.texto}</p>
        </section>

        <div className="inf-cuerpo">
          <dl className="datos">
            <div><dt>Vecinos a 5 min andando</dt><dd>{fmt(z.vecinos)}</dd><small>a 450 m</small></div>
            <div><dt>Comercio de proximidad</dt><dd>{z.indice == null ? "—" : `${fmt(z.indice * 100)} %`}</dd><small>de una zona típica</small></div>
            <div><dt>Población 2015–2024</dt><dd>{pp(z.pobRel)}</dd><small>vs zona típica</small></div>
            <div><dt>Cierres desde 2023</dt>
              {z.pros?.registros >= 10
                ? <><dd>{z.pros.pctCierres} %</dd><small>{z.pros.cierres} de {z.pros.registros}{z.pros.mediana != null ? ` · típica ${z.pros.mediana} %` : ""}</small></>
                : <><dd>—</dd><small>pocos registros</small></>}
            </div>
          </dl>
          <Mapa seleccion={c} alto="260px" etiqueta={`Ubicación de ${z.barrio}`} />
        </div>

        <h2>Qué falta aquí</h2>
        {fiables.length ? (
          <table className="ops">
            <thead><tr><th>Tipo de negocio</th><th className="n">Hay ahora</th><th className="n">Lo normal</th><th className="n">% de lo normal</th></tr></thead>
            <tbody>{fiables.map((o) => (
              <tr key={o.tipo}><td>{o.tipo}</td><td className="n">{o.oferta}</td><td className="n">{fmt(o.esperado)}</td><td className="n"><b>{o.pct} %</b></td></tr>
            ))}</tbody>
          </table>
        ) : <p>Ningún tipo de negocio de proximidad está claramente por debajo de lo normal en esta zona.</p>}

        {z.sobra?.length > 0 && (
          <>
            <h2>Qué ya hay de sobra</h2>
            <p>Mucha competencia en: {z.sobra.map((s) => `${s.tipo.toLowerCase()} (${s.oferta}, el ${s.pct} % de lo normal)`).join(", ")}.</p>
          </>
        )}

        {locales.length > 0 && (
          <>
            <h2>Locales que han cerrado hace poco</h2>
            <ul className="inf-locales">{locales.map((l) => (
              <li key={l.dir}><b>{l.dir}</b> · antes, {l.antes ? l.antes.toLowerCase() : "sin categoría"} · cerró el {l.fecha}</li>
            ))}</ul>
            <p className="nota">Cierres de 2025–2026 sin actividad nueva registrada en la dirección{z.locales.length > locales.length ? ` (${z.locales.length} en total en la zona)` : ""}. Comprueba que siguen disponibles.</p>
          </>
        )}

        <Contexto z={z} compacto />

        <footer>
          <p><b>Antes de decidir.</b> Un hueco es una hipótesis: compruébalo a pie de calle (mercados, grandes superficies, locales disponibles) y consulta con el servicio de Comerç del Ajuntament o con la Oficina Mataró Empresa.</p>
          <p><b>Cómo se calcula.</b> Se cuentan los vecinos y los negocios a 300, 450 y 600 m a la redonda y se comparan con lo normal en las zonas residenciales de Mataró (sin el centro); en salud, óptica, peluquería, electrónica, floristería y librería, con zonas de renta parecida. Un tipo solo aparece si, con el radio de 450 m y al menos otro, hay menos de la mitad de lo normal, faltan al menos 2 negocios, la probabilidad de que sea casualidad es menor del 5 % y el registro de prospección del Ajuntament lo confirma. Se descartan los casos cubiertos por un mercado municipal o una gran superficie cercana.</p>
          <p><b>Fuentes.</b> Censo de actividades y registro de prospección del Ajuntament de Mataró, INE (población y renta por sección censal, 2015–2024), Catastro (obra nueva) y OpenStreetMap. Datos agregados, sin información personal.</p>
        </footer>
      </article>
    </div>
  );
}
