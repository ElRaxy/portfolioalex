# Portfolio experimental · F1

La portada estática vive en `public/experimental/`. Usa HTML, CSS y JavaScript vanilla, papel `--paper: #fafaf7` y cobalto `--blue: #2449f5`, sin dependencias nuevas. El orden es Inicio → Trabajo → Sobre mí → Contacto. Los cuatro artículos, sus capturas, la demo nativa de Sereno y «Más trabajo» conservan su contenido.

## Propietarios

- `index.html`: contenido servido, valores finales de las nueve métricas, cápsula, índice de proyectos y bootstrap mínimo de la entrada antes de las hojas CSS.
- `app.js`: modalidad de teclado, navegación a anclas con curva propia para clics de puntero y salto nativo instantáneo con teclado o movimiento reducido y copia del correo con mensajes de resultado. La demo de Sereno conserva sus controles HTML/CSS y el desplegable nativo.
- `movimiento.js`: único controlador del movimiento; entrada, línea rotativa, menú móvil, sección activa mediante IntersectionObserver, apariciones de una sola ejecución, cuentas visuales y secuencia del personaje de Contacto. Solo el módulo interno de secuencia responde al scroll del usuario; la navegación programática vive en `app.js` y comunica inicio y fin mediante eventos, sin otro controlador de movimiento decorativo.
- `styles.css`: tokens, base tipográfica y contenido compartido; `portada-personal.css`: hero; `recorrido-personal.css`: composición de Trabajo, Sobre mí y Contacto; `movimiento.css`: cápsula, índice, tiempos, curvas, estados animados y alternativas accesibles.
- `sereno-demo.css`: estilos existentes de la demo, conservados.

## Navegación y frases

La cápsula mide 52 px en escritorio y conserva su geometría al recorrer la página. Su nombre lleva a Inicio; los tres enlaces llevan a Trabajo, Sobre mí y Contacto. Un subrayado único cambia con `transform` en 250 ms y opacidad en 150 ms, ambos con `var(--ease-out)`; el color del enlace acompaña los 250 ms y usa `aria-current="location"`. El indicador crece y se encoge en la posición de su enlace y se recoloca sin transición tras resize o carga de fuentes. La sección activa queda bloqueada en el destino durante el salto: los callbacks intermedios solo actualizan la banda observada. Al completar permanece en el destino; al cancelar se recupera la última sección de la banda. Hasta 820 px, «Menú» controla un panel con entrada de 300 ms y salida de 200 ms que incluye `visibility`; Escape lo cierra y devuelve el foco, y activar un enlace también lo cierra. Sin JavaScript, los enlaces permanecen disponibles.

Las frases aprobadas por Alex el 2026-10-21 se editan en los nueve `li` de `template#capsula-frases`, dentro de `index.html`. La primera también está servida en `.capsula-linea`; al cambiarla hay que mantener ambas copias sincronizadas:

1. Soy desarrollador de Alicante
2. Estoy puliendo Strev por dentro
3. Terminé DAW en junio de 2026
4. Con Smarty pruebo un año de mercado
5. Ya trabajo en Anuubis Solutions
6. Seguimos con Marky en simulación
7. También me gusta diseñar pantallas
8. Uso Claude Code y Codex a diario
9. Me fastidia que vuelva el mismo bug

Cada frase cambia a los 4200 ms; su entrada dura 550 ms, `translateY(3px)` y blur de 2 px, con `cubic-bezier(.33,.6,.67,1)`. Se solapa con una copia saliente en la misma celda de rejilla: 200 ms `var(--ease-out)`, hasta −3 px, opacidad 0 y blur de 2 px. La copia se vacía al terminar los 550 ms. Hover, foco dentro y pestaña oculta pausan las dos animaciones y conservan sus tiempos restantes. El punto tiene un halo de 1800 ms, escala 1 a 1,67 y opacidad 1 a 0, gobernado por `data-halo`; `data-pausa` congela su fase. Tras regresar a la primera frase se retira `data-rotando`, y el halo termina en el siguiente `animationiteration` de `halo`, con un tope de 1800 ms que también se pausa. Las dos líneas son decorativas (`aria-hidden`), sin región viva; con movimiento reducido no hay relevo ni halo.

El único `ol.work-index` vive en Inicio, como hermano directo de `.personal-copy` dentro de `.personal-layout`, con el rótulo visible «Proyectos» asociado por `aria-labelledby`. En escritorio, desde 1024 px, el texto queda a la izquierda y el índice a la derecha; por debajo, el índice sigue a los botones del hero en una sola columna. Cada fila conserva número, nombre y resumen literal del artículo, e incluye el estado dentro del enlace: Strev «En beta», Marky y Smarty «En simulación», Sereno «Código abierto». El índice enlaza a los cuatro artículos de Trabajo; al activar una fila con puntero, la curva propia lleva al artículo, actualiza el hash y la cápsula marca «Trabajo». Tras el encabezado de Trabajo aparece directamente Strev. Strev y Sereno incluyen además «Ver caso», como enlace separado. Hover (solo con `(hover:hover) and (pointer:fine)`) y foco: cobalto al 5 %, flecha 16 px, entrada 500 ms `cubic-bezier(.52,0,.34,1)` y salida 400 ms; el texto no se desplaza.

## Movimiento

| Gesto | Contrato |
| --- | --- |
| Entrada del nombre | 30 px, blur 9 px, 1000 ms `cubic-bezier(.15,.1,.3,1)`; segunda línea +100 ms |
| Acento | `scaleX(0)` a 1, 1100 ms `cubic-bezier(.2,1,.3,1)`, retraso 400 ms |
| Copy del hero | 20 px y opacidad, 700 ms `var(--ease-out)`, desde 300 ms con pasos de 100 ms |
| Cápsula | Opacidad y `translate: 0 -6px` a `0 0`, 400 ms `var(--ease-out)` con retraso 1200 ms; cierre de entrada a 1600 ms |
| Apariciones | 20 px, 700 ms `var(--ease-out)`, escalonado de 100 ms dentro del grupo; una sola vez y `unobserve` |
| Tres titulares | Marcador cobalto al 18 %, `background-size` de 0 a 100 %, 800 ms y retraso 200 ms |
| Nueve cifras | Copia visual `aria-hidden`, 900 ms con salida cúbica; original final en el flujo, miles con punto formateado a mano |
| Resto de enlaces y botones | Color/intensidad en 300 ms, sin cambio geométrico |

Las filas del índice esperan al `animationend` de `.name-word.last` (`entrada-nombre`, 1100 ms nominales) antes de usar M2, con retrasos de 0, 100, 200 y 300 ms y una única ejecución. No hay reloj independiente de 1100 ms que pueda adelantarse al nombre: se espera a su aterrizaje real. M1 sigue hasta 1600 ms; su cierre y el fallback inline de 2000 ms conservan la recuperación si no llega el evento. Si no hay entrada (movimiento reducido, `back_forward`, hash profundo o scroll inicial), las filas en pantalla aparecen inmediatamente sin animación. El CSS evita que aparezcan antes de cargar el controlador. Enfocar una fila termina la entrada y la muestra sin retraso para mantener el foco visible.

R2 describe la duración CSS de 700 ms y 20 px de las apariciones; no el último píxel perceptible en una grabación. `var(--ease-out)` es el token `cubic-bezier(.23,1,.32,1)` de `styles.css`. Nombre, acento, marcador y cifras conservan sus curvas y tiempos.

Los bloques ya visibles al arrancar se muestran sin `reveal-pending` (salvo las filas con M1 pendiente). Sin entrada, los cruces iniciales del viewport durante los primeros 150 ms tampoco repiten M2. Las imágenes de Trabajo llevan `decoding="async"`; cuando requieren una aparición esperan `decode()`, con recuperación por error o tope de 400 ms, antes de animar. Las ya visibles no se vuelven a ocultar.

Los clics de puntero en anclas usan `easeInOutCubic` (`t < .5 ? 4*t*t*t : 1 - (-2*t + 2)**3/2`) y `min(900, max(420, abs(distancia) * .32))` ms, portados de `src/lib/smoothScroll.js`. El destino descuenta `scroll-margin-top` y queda limitado al scroll disponible. `history.pushState` actualiza el hash sin un salto adicional; atrás conserva el historial del navegador y cancela cualquier salto en curso. Al terminar, el foco pasa al destino con `preventScroll`; el `tabindex` temporal se retira al perder foco. Teclado, clic con `detail === 0` y movimiento reducido mantienen el salto nativo instantáneo. Rueda, toque, teclas de navegación, reducción en vivo o salida de página cancelan el rAF; hay una red de 1500 ms. El final lo comunica el controlador de anclas: se ignora `scrollend` nativo porque puede llegar entre sus escrituras instantáneas. La rueda sigue nativa y no hay bucle perpetuo ni librería de scroll. Sobre mí tiene `scroll-margin-top:16px` desde 1024 px: con sus 56 px de padding, el rótulo queda a 72 px frente al borde inferior de cápsula en 68 px; falta comprobarlo visualmente.

El bootstrap siempre añade `html.js`. Solo arma `data-entrada` con movimiento permitido, navegación distinta de `back_forward`, `scrollY < 5` y hash vacío o `#inicio`. La entrada termina con la cápsula y cuenta con una red autónoma de 2000 ms si el controlador no llega. No espera a las fuentes ni bloquea clics o scroll.

Con movimiento reducido no hay entrada, apariciones, cuentas, rotación ni halo; el subrayado cambia sin transición. El contenido servido es visible sin JavaScript. Sin IntersectionObserver los bloques quedan visibles. No hay escena fija en F1; esa fase, los casos y el buscador de navegación tienen contratos separados.

Sobre mí usa dos columnas desde 1024 px, con la bio y ficha a la izquierda y métodos y recorrido a la derecha. La altura objetivo de 900 px a 1440 px requiere comprobación visual: los tests de DOM/CSS no miden composición real.

## Build y comprobación

### Secuencia de Contacto — ronda 4

El dibujo de `.contact-intro` usa 56 imágenes decorativas dentro de un único `role="img"`, conservando su descripción accesible. Son 52 SVG distintos de `assets/secuencia/`: pasos `s01` a `s09`, `s10`, `s11`, `s10`, `s13`, `s10`, `s11`, `s10` y `s17` a `s56`. Los SVG se conservan byte a byte respecto al prototipo de ronda 4; `assets/contacto/` se elimina para evitar mezclar dibujos de rondas distintas en caché. Solo los extremos tienen `src`; los 54 pasos intermedios usan `data-src`.

El módulo interno de `movimiento.js` conserva `a = cajaTopAbs + offsetHeight - innerHeight` y `b = min(scrollMax, cajaTopAbs - 76)`. Limita el progreso a `[0,1]` y obtiene `round(p * (N - 1))`, con `N` leído del número de imágenes (56). Recalcula las medidas en `resize`, tras `decode()` y mediante ResizeObserver sobre `document.body`.

El cabezal tiene posición continua: avanza `min(dt, 50) / 50` hacia el objetivo en ambos sentidos. El primer rAF fija el origen temporal (sin avanzar), descartando la espera de carga o reposo; a 60 Hz el primer cambio y los siguientes ocurren cada tres refrescos. Una pausa nunca avanza más de un paso en un callback. Se pinta solo el paso inferior con fracción menor que 0,5 y el superior en caso contrario. El bucle termina cuando la posición alcanza el objetivo, aunque el dibujo objetivo ya estuviera visible. No hay parámetros de URL, fundidos ni depuración.

Los pasos 34 a 56 van en `.sec-cerca`, con los `data-g` del prototipo (1,033 a 1,68). Para una posición `i + f`, `g = G[i] * (G[i+1] / G[i]) ** f`; el visible recibe `scale(g / G[visible])`, con el redondeo a cuatro decimales y la tolerancia de unidad del prototipo. Con escala 1 se quita `transform`. El origen es `50% var(--sec-oy,10%)`, con `--sec-oy:3.36%` en el contenedor. La máscara inferior de `.sec-cerca` (`linear-gradient(to bottom,#000 92.5%,transparent)`, también con prefijo WebKit) queda fija en la caja mientras el dibujo crece.

Un IntersectionObserver sobre Contacto usa un margen vertical de 1,5 veces `innerHeight`, en píxeles. Al entrar convierte `data-src` en `src` y espera la decodificación de las 56 imágenes; mientras espera o si falla alguna permanece el primero. Con movimiento reducido no crea el observer de carga ni solicita animación o imágenes intermedias: queda el 56. Sin JavaScript también se ve solo el 56. Los selectores alcanzan las imágenes anidadas. `quieto()`, la reducción en vivo y `pagehide` limpian todos los transforms y cancelan rAF; `pageshow` persistido reinicia el controlador.

La geometría sigue en `styles.css`: altura de 300 px, 232 en móvil, 196 hasta 500 px y 176 hasta 380 px. Por debajo de 760 px el dibujo queda después del correo y alineado a la izquierda. M1, M2, cápsula, anclas y copy conservan sus contratos.

Las pruebas cubren marcado y accesibilidad, 56 pasos consecutivos de ida y vuelta a 60 Hz, tres refrescos por cambio, un único visible, límite de dt tras pausa, media geométrica a mitad de paso, limpieza de transforms, decode completo, resize, restauración y fallbacks CSS. `publish-home.mjs` conserva su implementación y publica los 54 `data-src` como `/experimental/assets/secuencia/…`. Informe: `projects/portfolioalex/progress/revision-2026-10-20/ship_secuencia-r4-portada.md`; salida íntegra: `secuencia-r4-node-tests.log` en el mismo directorio. La QA visual la hace Claude en el iMac; su aceptación y el commit quedan pendientes de ALEX.

El build genera las páginas React existentes y `scripts/publish-home.mjs` publica esta portada como `build/index.html`. Convierte recursos en URLs absolutas sin introducir `base`; mantiene anclas locales y las páginas inglesas y de caso. Los recursos compartidos siguen en `/editorial/assets/`.

```sh
npm run build
node --test scripts/check-prerender.test.mjs scripts/publish-home.test.mjs scripts/test-motion-journey.mjs scripts/test-movimiento.mjs
node scripts/check-prerender.mjs
```

`test-motion-journey.mjs` conserva los contratos literales de contenido y la huella del markup de la demo. `test-movimiento.mjs` comprueba estructura, reloj falso, estados accesibles y constantes CSS. El guard de prerender exige `app.js` y `movimiento.js` y mantiene sus controles de las páginas React.

Versión de CSS/JS: `?v=f1-1021-01`. `runtime-sha256.json` registra las huellas SHA-256 de los ficheros públicos reales. El informe y la salida íntegra de esta tarea están en `projects/portfolioalex/progress/revision-2026-10-20/ship_f1.md` y `f1-node-tests.log` del workspace.

Hero C registra su informe y salida íntegra en `projects/portfolioalex/progress/revision-2026-10-20/ship_hero-c.md` y `hero-c-node-tests.log` del workspace. La comprobación visual (incluidos 1440×900, 390, 820 y 1023 px) corresponde a Claude, por separado; los tests DOM/CSS no acreditan alturas ni ausencia real de desborde. Esta ronda de fluidez se entrega en el árbol de trabajo, sin commit, push ni despliegue; un build correcto no acredita publicación ni aceptación estética.

Fluidez registra los puntos 1–8 del scout y la cadencia de Contacto en `projects/portfolioalex/progress/revision-2026-10-20/ship_fluidez-portada.md`, con la salida completa de verificación en `fluidez-node-tests.log`. La QA visual sigue reservada a Claude en el iMac y el informe requiere revisión de ALEX antes del merge.
