# Portfolio de Alex Micó Robles

Portfolio personal bilingüe en castellano e inglés. Presenta experiencia, formación, stack y proyectos, e incluye tema claro/oscuro y un formulario de contacto servido por una función de Vercel.

## Stack

- React 19 y React DOM.
- Create React App mediante `react-scripts`.
- CSS.
- GSAP y Motion para las animaciones.
- i18next y react-i18next para la traducción.
- React Icons.
- Vercel Functions y la API de Resend para el formulario de contacto.
- Testing Library para las utilidades de pruebas incluidas en el proyecto.

Las versiones concretas están declaradas en `package.json` y bloqueadas en `package-lock.json`.

## Arranque local

Requisitos: Node.js y npm.

```bash
git clone https://github.com/ElRaxy/portfolioalex.git
cd portfolioalex
npm install
npm start
```

`npm start` abre el servidor de desarrollo. Para generar la versión de producción:

```bash
npm run build
```

## Variables de entorno

El endpoint `api/contact.js` utiliza estas variables en el entorno del servidor:

```dotenv
RESEND_API_KEY=
CONTACT_TO=
CONTACT_FROM=
```

`CONTACT_FROM` debe corresponder a un remitente admitido por la configuración de Resend. No se deben exponer estas variables en código cliente ni confirmar sus valores en el repositorio.

## Estructura

```text
api/
└── contact.js                 Función del formulario de contacto
public/                        HTML base y archivos públicos
src/
├── assets/                    Recursos estáticos importados por React
├── componets/                 Componentes y estilos por sección
├── context/                   Contextos de React
├── i18n/                      Configuración y traducciones ES/EN
├── App.jsx                    Composición de la página
└── index.js                   Punto de entrada
```

El nombre `componets` se mantiene porque es el directorio real del proyecto.

## Despliegue

El proyecto está preparado para Vercel: el frontend se construye con `npm run build` y `api/contact.js` se publica como función serverless. Antes de desplegar hay que configurar `RESEND_API_KEY`, `CONTACT_TO` y `CONTACT_FROM` en las variables de entorno del proyecto en Vercel. Los despliegues enlazados al repositorio se generan a partir de cada cambio en la rama configurada.

La versión pública está en [portfolioalex-mico.vercel.app](https://portfolioalex-mico.vercel.app).

## Licencia

MIT. Consulta [LICENSE](LICENSE).
