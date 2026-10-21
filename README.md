# ConnectMA · prototipo (Resultado 7)

Bandeja de decisiones para el servicio de Comerç del Ajuntament de Mataró: zonas con potencial, en riesgo y en declive, cada una con su acción.
Vite + React, sin backend. Datos abiertos agregados por sección censal.

## Arrancar
    npm install
    npm run dev          # http://localhost:5173

## Actualizar los datos
Copia en `data/` los ficheros que generan los scripts de Python (`radar_v3.csv`, `radar_v2_oportunidades.csv`, `secciones_mataro.geojson`)
y ejecuta `npm run datos`. Genera `src/data/zonas.json`.

## Vistas
- `#bandeja`: lista priorizada con filtros por estado, barrio y negocio que falta.
- `#zona/<sección>`: ficha con datos, negocios que faltan y acciones.
- `#informe/<sección>`: informe de una página para imprimir o guardar en PDF.
- `#mapa`: mapa por estado o por negocio que falta.
- `#aixequem`: zonas propuestas para Aixequem Persianes, exportables a CSV.
- `#asesor`: dónde encaja un tipo de negocio.

La lista Aixequem y los locales vacíos se guardan en el navegador (prototipo). En producción irían a la base de datos municipal.

## Publicar
Importa el repo en Vercel: detecta Vite solo.
