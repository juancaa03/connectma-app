import { useState } from "react";
import { BARRIOS, ESTADOS, TIPOS, fmt, pp, zonas } from "../lib.js";
import Mapa from "./Mapa.jsx";

// Asesor para quien emprende: elige qué negocio quiere abrir y, si quiere, en qué barrio.
// Todo se calcula con los datos del radar; no se guarda ningún perfil.
export default function Asesor({ abrir, informe }) {
  const [tipo, setTipo] = useState("");
  const [barrio, setBarrio] = useState("");

  const candidatas = tipo
    ? zonas
        .map((z) => ({ z, o: z.ops.find((o) => o.tipo === tipo) }))
        .filter(({ z, o }) => o && (!barrio || z.barrio === barrio))
        .sort((a, b) => (b.z.demanda === "crece") - (a.z.demanda === "crece") || a.o.pct - b.o.pct)
    : [];
  const extension = tipo
    ? zonas.map((z) => ({ z, e: z.ctx?.ext?.find((e) => e.tipo === tipo) }))
        .filter(({ z, e }) => e && (!barrio || z.barrio === barrio) && !candidatas.some((c) => c.z.c === z.c))
    : [];
  const set = new Set([...candidatas, ...extension].map(({ z }) => z.c));

  const porque = (z, o) => {
    const partes = [`hay ${o.oferta} y lo normal serían ~${fmt(o.esperado)} para sus ${fmt(z.vecinos)} vecinos a 450 m`];
    if (z.demanda === "crece") partes.push(`la zona gana demanda (${pp(z.pobRel)} de población frente al barrio típico)`);
    if (z.demanda === "cae") partes.push("ojo: la zona pierde demanda");
    if (!o.fiable) partes.push("dato de hostelería poco fiable, compruébalo a pie de calle");
    const t = partes.join("; ") + ".";
    return t[0].toUpperCase() + t.slice(1);
  };

  return (
    <div className="pagina asesor">
      <header className="pag-head">
        <h1>¿Dónde encaja tu negocio?</h1>
        <p>Para la primera cita con quien quiere emprender. Elige el tipo de negocio y, si quieres, un barrio. No se guarda nada.</p>
      </header>
      <form className="asesor-form" onSubmit={(e) => e.preventDefault()}>
        <label className="campo">Negocio que quiere abrir
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Elige un tipo</option>
            {TIPOS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="campo">Barrio de interés
          <select value={barrio} onChange={(e) => setBarrio(e.target.value)}>
            <option value="">Cualquiera</option>
            {BARRIOS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </label>
      </form>

      {!tipo && <p className="vacio">Elige un tipo de negocio para ver en qué zonas faltan.</p>}
      {tipo && (
        <div className="asesor-res">
          <div>
            <h2>{candidatas.length ? `${candidatas.length} ${candidatas.length === 1 ? "zona" : "zonas"} con poca oferta de ${tipo.toLowerCase()}` : `No detectamos huecos de ${tipo.toLowerCase()}${barrio ? ` en ${barrio}` : ""}`}</h2>
            {!candidatas.length && <p>Eso no significa que no pueda funcionar: significa que la zona ya tiene lo normal para sus vecinos. {barrio && "Prueba sin filtrar por barrio para ver dónde sí faltan."}</p>}
            <ol className="recos">{candidatas.map(({ z, o }) => (
              <li key={z.c} style={{ "--c": ESTADOS[z.estado].color }}>
                <h3><button className="link" onClick={() => abrir(z.c)}>{z.barrio}</button> <span className="cod">{z.c}</span></h3>
                <p className="reco-n">{o.pct} % de lo normal</p>
                <p>{porque(z, o)}</p>
                <button className="btn peq" onClick={() => informe(z.c)}>Informe de la zona</button>
              </li>
            ))}</ol>
            {extension.length > 0 && (
              <>
                <h2 className="ext-t">Funciona al lado, aquí casi no hay</h2>
                <ol className="recos">{extension.map(({ z, e }) => (
                  <li key={z.c} style={{ "--c": ESTADOS[z.estado].color }}>
                    <h3><button className="link" onClick={() => abrir(z.c)}>{z.barrio}</button> <span className="cod">{z.c}</span></h3>
                    <p className="reco-n">{e.pctAqui} % de lo normal; {e.pctVecina} % en {e.barrio}, a {e.m} m</p>
                    <p>{tipo} funciona en la zona de al lado y aquí apenas hay: candidata a extenderlo.</p>
                    <button className="btn peq" onClick={() => informe(z.c)}>Informe de la zona</button>
                  </li>
                ))}</ol>
              </>
            )}
          </div>
          <Mapa resaltar={(z) => set.has(z.c)} onSelect={abrir} alto="480px" etiqueta={`Zonas con poca oferta de ${tipo}`} />
        </div>
      )}
    </div>
  );
}
