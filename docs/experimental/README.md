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

## Boceto a web — 15 de octubre

Versión `intro-story-1015-01`, 2700 ms. Reemplaza el film de paneles por una escena de papel: letras individuales, cursor/trazos, personaje y bug; las palabras y el retrato viajan hacia sus cajas reales en el hero. Medida DOM inicial más refinado único al cargar fuentes antes de1500ms de la fase CSS real; CSS ejecuta el viaje sin JS por frame. Se conserva lifecycle interruptible, deadline5s, reduced/deep/history/noJS directos y composición final. No se añaden recursos/dependencias. Tests:10 lifecycle,1 home y build. Validar filmstrip y convergencia responsive de esta versión antes de darla por publicada.

`intro-story-1015-02`: los ojos del boceto solo aparecen tras decodificar su propia PNG. Sin wait del opener; fallo de imagen mantiene ojos ocultos y una resolución tardía tras cancelación no rearma la escena. Regresión de assets:13tests de lifecycle, incluidos3casos de decodificación.

## Continuidad y rutas responsive — 15 de octubre

`intro-fluid-1015-01`: cursor y bug recorren curvas cúbicas medidas una vez en coordenadas de la escena. Tangentes compartidas y avance continuo evitan cambios bruscos de dirección; las fuentes no retargetean las rutas en marcha. Los sujetos usan tamaños fluidos entre móvil, tablet y escritorio, con una composición específica para pantallas bajas en horizontal. El aterrizaje ocurre entre1500 y2350ms; el cruce a los elementos reales entre2350 y2550ms, con el papel ya retirado y el texto escalonado. La duración total sigue en2700ms.

Se conserva el contrato interruptible, guard de decodificación del retrato, scroll nativo y contenido directo con reduced/deep/history/noJS. No hay dependencias nuevas ni escritura de estilos por frame. Referencias primarias: [offset-path](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/offset-path) y [offset-anchor](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/offset-anchor). Verificar con17tests de motion-entry,1home, build, vídeo y matriz responsive en Chrome headed del iMac; el código revisado por sí solo no prueba suavidad visual.

## Personaje articulado — candidato local del 15 de octubre

`character-acting-1015-01`: cabeza y ojos se articulan juntos; palma y dedos teclean, conservando silla, manga y puño originales. El cursor sale del portátil y el nombre se revela como tinta. Entrada de 2700 ms con reloj compartido y gestos de teclado/mirada/reacción; en el hero hay acciones breves con descansos y mirada que responde al puntero. Los toques conservan el scroll nativo.

El PNG sigue como fallback hasta completar su decode y los load de las cinco capas SVG; sin JavaScript conserva los ojos. Reduced-motion, teclado, ocultación y salida de pantalla cancelan la actuación. `npm run test:character-rig`, `npm run test:motion-entry`, `npm run test:home` y build verifican lógica e integración. Las poses se han rasterizado para inspeccionar uniones; falta revisar movimiento real, carga fría y responsive en Chrome del iMac, pendiente por indicación de Alex. Esta versión queda como candidato local: no sustituye producción sin esa comprobación. Referencias: [clipPath](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/clipPath), [cancelación WAAPI](https://developer.mozilla.org/en-US/docs/Web/API/Animation/cancel).


## Cadencia y continuidad — candidato local del 15 de octubre

`character-rhythm-1015-01`: parpadeo independiente incluso con el puntero quieto, ojos que se adelantan a la cabeza, tecleo irregular con pausas y un saludo breve tras la entrada o un toque. El regreso al centro y una reentrada del puntero parten de la pose actual. Silla, cuerpo, composición y breakpoints no cambian.

La introducción conserva 2700 ms: anticipación desde reposo y relevo simultáneo entre boceto y portada a2350ms, sin la pérdida de opacidad del cruce anterior. Los offsets de los gestos usan reloj lineal y curvas por intervalo, según [Keyframe Formats](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats), para respetar el ritmo previsto.

17 tests del rig +20 de entrada +1 de home y build PASS; revisión independiente sin abiertos. La comprobación real de animación y responsive en Chrome del iMac sigue pendiente por indicación de Alex. Candidato local, sin despliegue.
