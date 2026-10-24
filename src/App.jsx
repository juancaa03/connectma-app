import { useCallback, useEffect, useState } from "react";
import Asesor from "./components/Asesor.jsx";
import Bandeja from "./components/Bandeja.jsx";
import Ficha from "./components/Ficha.jsx";
import Informe from "./components/Informe.jsx";
import VistaMapa from "./components/VistaMapa.jsx";
import { porCodigo, useLocal } from "./lib.js";

const WEB = "https://connectma-web.vercel.app"; // web del equipo

// Navegación por hash (#bandeja, #mapa, #zona/0812102011…) para que cada vista tenga enlace propio
function leerHash() {
  const [vista = "bandeja", c] = location.hash.replace(/^#\/?/, "").split("/");
  return { vista, c: c && porCodigo[c] ? c : null };
}

export default function App() {
  const [ruta, setRuta] = useState(leerHash);
  const [marcados, setMarcados] = useLocal("cma-locales", {});

  useEffect(() => {
    const f = () => setRuta(leerHash());
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);

  const ir = (vista, c) => { location.hash = c ? `${vista}/${c}` : vista; };
  const base = ruta.vista === "zona" || ruta.vista === "informe" ? (sessionStorage.getItem("cma-base") || "bandeja") : ruta.vista;
  useEffect(() => { if (!["zona", "informe"].includes(ruta.vista)) sessionStorage.setItem("cma-base", ruta.vista); }, [ruta.vista]);

  const abrir = useCallback((c) => ir("zona", c), []);
  const cerrar = useCallback(() => ir(base), [base]);
  const informe = (c) => ir("informe", c);
  const marcar = (c, dir) => setMarcados((m) => ({ ...m, [c]: [...(m[c] || []), { dir, fecha: new Date().toLocaleDateString("es-ES") }] }));

  if (ruta.vista === "informe" && ruta.c) return <Informe c={ruta.c} cerrar={() => ir("zona", ruta.c)} />;

  const pestañas = [["bandeja", "Bandeja"], ["mapa", "Mapa"], ["asesor", "Asesor"]];
  return (
    <>
      <header className="top">
        <a className="brand" href={WEB} aria-label="Web de ConnectMA">
          <img src="/assets/icon.png" alt="" width="32" height="32" />
          <span>Connect<b>MA</b></span>
          <span className="sub">Radar comercial</span>
        </a>
        <nav aria-label="Vistas">
          {pestañas.map(([v, n]) => (
            <a key={v} href={`#${v}`} aria-current={base === v ? "page" : undefined}>{n}</a>
          ))}
        </nav>
      </header>
      <main>
        {base === "mapa" && <VistaMapa abrir={abrir} />}
        {base === "asesor" && <Asesor abrir={abrir} informe={informe} />}
        {!["mapa", "asesor"].includes(base) && <Bandeja abrir={abrir} marcados={marcados} />}
      </main>
      <footer className="pie">
        Prototipo de ConnectMA · TecnoChallenge 2026 · Datos abiertos del Ajuntament de Mataró y del INE, agregados por sección censal. <a href={`${WEB}/metodologia`}>Cómo se calcula</a>
      </footer>
      {ruta.vista === "zona" && ruta.c && (
        <Ficha c={ruta.c} cerrar={cerrar} abrir={abrir} marcados={marcados} marcar={marcar} informe={informe} />
      )}
    </>
  );
}
