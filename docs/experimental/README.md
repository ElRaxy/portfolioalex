# Portfolio experimental — 13 de octubre de 2026

Checkpoint: `travesuras-1013-02`. Ruta: `/experimental/`.

Portada personal de Alex Micó con ilustración animada, mirada y parpadeo contenidos, gestos dibujados y seis proyectos. La fuente se mantiene en `public/experimental/`. Al terminar el build, `scripts/publish-home.mjs` la publica como `build/index.html`: la URL principal muestra esta versión, conservando las páginas React de inglés, casos y errores.

Las referencias de recursos se convierten en URLs absolutas sin introducir `<base>`, de modo que la navegación por anclas permanece en `/`. Los recursos compartidos siguen en `/editorial/assets/`. Se conservan canonical, favicons, verificación de Search Console y metadatos sociales, adaptando título y descripción a la nueva portada. No se anuncia la portada anterior en inglés como traducción equivalente mediante hreflang.

Validación de integración: `npm run test:home` y `npm run build`. Servir `build/` para revisar la portada real; servir `public/` solo permite revisar la fuente experimental.

## Retomar

Editar `public/experimental/`. Comparar primero esta versión con Alex antes de introducir otra dirección visual. Mantener móvil, tablet, puntos intermedios, scroll nativo en ambos sentidos, reduced-motion y contenido accesible sin JavaScript. No recuperar el símbolo 3D ni mover toda la silla para seguir el puntero.

Para verlo sin compilar: `python3 -m http.server 4203 --directory public`, después abrir `/experimental/`. Las fuentes y el CV compartidos están en `public/editorial/assets/`.

## Verificación del checkpoint

- `npm run build`: PASS; los 17 archivos del prototipo se conservan idénticos en la salida.
- Validación de fuente Travesuras1013 y sintaxis JavaScript: PASS.
- Chrome con ventana en iMac: 320, 390, 650, 651, 820, 1024, 1100 y 1440 px; doce capturas de secciones.
- Reduced-motion y ausencia de JavaScript: 390, 820 y 1440 px.
- Scroll real de ida y vuelta: gestos observados en 390, 820 y 1440 px.
- Hover del personaje: 26 estados de movimiento observados, soporte y silla estables.
- Revisión independiente: sin P1/P2; corregido el pivote de la nota de contacto.
- La regresión ampliada anterior de mirada quedó parcial por pérdida real de foco del navegador. No se presenta como aprobada completa.
- Los archivos publicados son idénticos al prototipo verificado; `runtime-sha256.json` conserva las huellas. Los informes históricos y capturas permanecen en el workspace de trabajo y no se publican.

La verificación anterior corresponde al checkpoint del 13 de octubre. La integración y el despliegue de la portada del 14 de octubre necesitan su propia comprobación en la URL pública; un build correcto no demuestra por sí solo que esté publicada.

## Publicación en Vercel

La rama de producción es `main`. El build genera la nueva portada en `/`, conservando `/experimental/` para comparar la fuente y las páginas prerenderizadas existentes.

Para comprobar una publicación, verificar el dominio público y el SHA del despliegue de producción; el estado correcto de una preview no acredita que el dominio ya haya cambiado.

Reversión de esta integración: revertir el commit `0e9dfc5` en `main` y desplegar el resultado. La portada React vuelve a generarse con el pipeline anterior; el prototipo permanece conservado.

## Entrada viva — 14 de octubre

La entrada se arma antes del primer render con una secuencia CSS coordinada de 1120 ms: nombre, trazo, copy y escena ilustrada. La interacción, el scroll o el cambio de accesibilidad la completan inmediatamente. Los gestos de dibujos recuperan los encuentros bloqueados al volver el foco real. Versión de recursos: `entrada-viva-1014-01`. Verificar con `npm run test:motion-entry` y `npm run test:home` antes del build.

## Film tipográfico — 15 de octubre

Versión `motion-film-1015-01`: apertura de 2100 ms con ALEX/MICÓ, contornos y trazo SVG. Dos paneles azules se separan para revelar el hero ilustrado existente. No se bloquea el scroll; cualquier interacción real libera la entrada. Deep links, restauración de historial, reduced-motion y ausencia de JavaScript muestran directamente el contenido. El panel inferior finaliza la secuencia; el deadline de 5000 ms solo cubre hojas CSS ausentes. Se mantiene el contrato único `portfolioEntry` y los gestos posteriores.

Pruebas: `npm run test:motion-entry` (6 casos), `npm run test:home` y `npm run build`. La validación visual requiere grabar desde about:blank antes de navegar: una captura estática después de `open` no prueba la entrada. La publicación requiere comprobar Production y el dominio real de esta versión; los informes históricos anteriores no la acreditan.
