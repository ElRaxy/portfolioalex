# Fase K — rejilla animada del hero

## Ficheros tocados

- `src/componets/header/HeroGrid.jsx`: nuevo componente de 24 × 14 puntos, montaje condicionado por viewport y preferencia de movimiento, onda GSAP, reacción al puntero, pausa por visibilidad y cleanups.
- `src/componets/header/Header.jsx`: integración de `HeroGrid` detrás del contenido existente, sin modificar la timeline de entrada.
- `src/componets/header/header.css`: rejilla, puntos, máscara radial y capas del contenido.
- `fase-k-codex.md`: este resumen de implementación y verificación.

## Números finales

- Rejilla: 24 columnas × 14 filas = 336 puntos.
- Punto: 3 px, redondo, `var(--accent)`, opacidad de reposo `0.12` en ambos temas.
- Onda: opacidad máxima `0.55`, escala máxima `1.6`, duración `0.8 s`, easing `sine.inOut`.
- Stagger: grid `[14, 24]`, origen inicial `center`, cantidad `1.6 s`.
- Bucle: `repeat: -1`, `repeatDelay: 1.4 s`, `yoyo: true`.
- Puntero: nuevo origen `[fila, columna]` con una relanzada como máximo cada `400 ms`.
- Renderizado: solo desde `1025 px` y con `prefers-reduced-motion: no-preference`.
- Máscara: elipse `70% 60%` en `30% 40%`, transparente al `75%`.

El color de reposo calculado al componer el punto sobre cada fondo es `#23282f` en oscuro y `#e2e9f0` en claro. El contenido permanece en una capa superior (`z-index: 1`) y la rejilla en `z-index: 0`. La inspección visual automatizada no pudo ejecutarse porque este entorno no dispone de navegador y bloquea la apertura de puertos locales; las comprobaciones de estructura, tokens, capas, responsive y build sí se completaron.

## Verificación

### `npx eslint src api --ext .js,.jsx`

Código de salida: `0`.

```text
Browserslist: browsers data (caniuse-lite) is 15 months old. Please run:
  npx update-browserslist-db@latest
  Why you should do it regularly: https://github.com/browserslist/update-db#readme
```

### `CI=false npm run build`

Código de salida: `0`.

```text
> react-portfolio-website@0.1.0 build
> GENERATE_SOURCEMAP=false react-scripts build

Creating an optimized production build...
Browserslist: browsers data (caniuse-lite) is 15 months old. Please run:
  npx update-browserslist-db@latest
  Why you should do it regularly: https://github.com/browserslist/update-db#readme
Browserslist: browsers data (caniuse-lite) is 15 months old. Please run:
  npx update-browserslist-db@latest
  Why you should do it regularly: https://github.com/browserslist/update-db#readme
Compiled successfully.

File sizes after gzip:

  180.22 kB  build/static/js/main.b2c007e6.js
  4.61 kB    build/static/css/main.a0a833e0.css

The project was built assuming it is hosted at /.
You can control this with the homepage field in your package.json.

The build folder is ready to be deployed.
You may serve it with a static server:

  npm install -g serve
  serve -s build

Find out more about deployment here:

  https://cra.link/deployment
```
