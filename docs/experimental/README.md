# Portfolio experimental — 13 de octubre de 2026

Checkpoint: `travesuras-1013-02`. Ruta: `/experimental/`.

Prototipo personal de Alex Micó con ilustración animada, mirada y parpadeo contenidos, gestos dibujados y seis proyectos. Se conserva separado de la portada React actual. Esta rama no sustituye la web de producción.

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

Pendiente: aceptación estética final e integración de esta dirección en la portada principal. No se ha verificado un despliegue de producción de esta rama.
