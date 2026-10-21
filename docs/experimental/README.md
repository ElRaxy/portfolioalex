# Portfolio experimental · F1

La portada estática vive en `public/experimental/`. Usa HTML, CSS y JavaScript vanilla, papel `--paper: #fafaf7` y cobalto `--blue: #2449f5`, sin dependencias nuevas. El orden es Inicio → Trabajo → Sobre mí → Contacto. Los cuatro artículos, sus capturas, la demo nativa de Sereno y «Más trabajo» conservan su contenido.

## Propietarios

- `index.html`: contenido servido, valores finales de las nueve métricas, cápsula, índice de proyectos y bootstrap mínimo de la entrada antes de las hojas CSS.
- `app.js`: modalidad de teclado, navegación nativa a anclas respetando movimiento reducido y copia del correo con mensajes de resultado. La demo de Sereno conserva sus controles HTML/CSS y el desplegable nativo.
- `movimiento.js`: único controlador del movimiento; entrada, línea rotativa, menú móvil, sección activa mediante IntersectionObserver, apariciones de una sola ejecución y cuentas visuales. No anima a partir de eventos de scroll.
- `styles.css`: tokens, base tipográfica y contenido compartido; `portada-personal.css`: hero; `recorrido-personal.css`: composición de Trabajo, Sobre mí y Contacto; `movimiento.css`: cápsula, índice, tiempos, curvas, estados animados y alternativas accesibles.
- `sereno-demo.css`: estilos existentes de la demo, conservados.

## Navegación y frases

La cápsula mide 52 px en escritorio y conserva su geometría al recorrer la página. Su nombre lleva a Inicio; los tres enlaces llevan a Trabajo, Sobre mí y Contacto. Un subrayado único cambia con `transform` en 250 ms y el enlace actual usa `aria-current="location"`. Hasta 820 px, «Menú» controla un panel; Escape lo cierra y devuelve el foco, y activar un enlace también lo cierra. Sin JavaScript, los enlaces permanecen disponibles.

Las frases provisionales se editan en los tres `li` de `template#capsula-frases`, dentro de `index.html`. La primera también está servida en `.capsula-linea`; al cambiarla hay que mantener ambas copias sincronizadas:

1. Desarrollador full stack
2. Interfaces, APIs y automatización
3. Productos propios con IA

Cada frase cambia a los 4200 ms; su entrada dura 550 ms, `translateY(3px)` y blur de 2 px, con `cubic-bezier(.33,.6,.67,1)`. El punto tiene un halo de 1800 ms, escala 1 a 1,67 y opacidad 1 a 0. Hover o foco dentro pausan ambos. Tras regresar a la primera frase al completar una vuelta, ambos se detienen. La línea es decorativa (`aria-hidden`), sin región viva.

El índice enlaza a los cuatro artículos. Strev y Sereno incluyen además «Ver caso», como enlace separado. Hover/foco: cobalto al 5 %, flecha 16 px, entrada 500 ms `cubic-bezier(.52,0,.34,1)` y salida 400 ms; el texto no se desplaza.

## Movimiento

| Gesto | Contrato |
| --- | --- |
| Entrada del nombre | 30 px, blur 9 px, 1000 ms `cubic-bezier(.15,.1,.3,1)`; segunda línea +100 ms |
| Acento | `scaleX(0)` a 1, 1100 ms `cubic-bezier(.2,1,.3,1)`, retraso 400 ms |
| Copy del hero | 20 px y opacidad, 700 ms `cubic-bezier(.3,0,.3,1)`, desde 300 ms con pasos de 100 ms |
| Cápsula | Opacidad, 400 ms con retraso 1200 ms; cierre de entrada a 1600 ms |
| Apariciones | 20 px, 700 ms `cubic-bezier(.3,0,.3,1)`, escalonado de 100 ms dentro del grupo; una sola vez y `unobserve` |
| Tres titulares | Marcador cobalto al 18 %, `background-size` de 0 a 100 %, 800 ms y retraso 200 ms |
| Nueve cifras | Copia visual `aria-hidden`, 900 ms con salida cúbica; original final en el flujo, miles con punto formateado a mano |
| Resto de enlaces y botones | Color/intensidad en 300 ms, sin cambio geométrico |

El bootstrap siempre añade `html.js`. Solo arma `data-entrada` con movimiento permitido, navegación distinta de `back_forward`, `scrollY < 5` y hash vacío o `#inicio`. La entrada termina con la cápsula y cuenta con una red autónoma de 2000 ms si el controlador no llega. No espera a las fuentes ni bloquea clics o scroll.

Con movimiento reducido no hay entrada, apariciones, cuentas, rotación ni halo; el subrayado cambia sin transición. El contenido servido es visible sin JavaScript. Sin IntersectionObserver los bloques quedan visibles. No hay escena fija en F1; esa fase, los casos y el buscador de navegación tienen contratos separados.

Sobre mí usa dos columnas desde 1024 px, con la bio y ficha a la izquierda y métodos y recorrido a la derecha. La altura objetivo de 900 px a 1440 px requiere comprobación visual: los tests de DOM/CSS no miden composición real.

## Build y comprobación

El build genera las páginas React existentes y `scripts/publish-home.mjs` publica esta portada como `build/index.html`. Convierte recursos en URLs absolutas sin introducir `base`; mantiene anclas locales y las páginas inglesas y de caso. Los recursos compartidos siguen en `/editorial/assets/`.

```sh
npm run build
node --test scripts/check-prerender.test.mjs scripts/publish-home.test.mjs scripts/test-motion-journey.mjs scripts/test-movimiento.mjs
node scripts/check-prerender.mjs
```

`test-motion-journey.mjs` conserva los contratos literales de contenido y la huella del markup de la demo. `test-movimiento.mjs` comprueba estructura, reloj falso, estados accesibles y constantes CSS. El guard de prerender exige `app.js` y `movimiento.js` y mantiene sus controles de las páginas React.

Versión de CSS/JS: `?v=f1-1021-01`. `runtime-sha256.json` registra las huellas SHA-256 de los ficheros públicos reales. El informe y la salida íntegra de esta tarea están en `projects/portfolioalex/progress/revision-2026-10-20/ship_f1.md` y `f1-node-tests.log` del workspace.

La comprobación visual corresponde a Claude, por separado. Esta tarea no hace commit, push ni despliegue; un build correcto no acredita publicación ni aceptación estética.
