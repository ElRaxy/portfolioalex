import React, { Component } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import './i18n';

const rootElement = document.getElementById('root');
const prerenderedMarkup = rootElement.innerHTML;

// Si React revienta en cliente, devolvemos el HTML prerenderizado en vez de
// dejar la pagina en blanco. `getDerivedStateFromError` es lo que corta el
// ciclo: sin el, render() vuelve a pintar el arbol roto y el error se repite.
class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    rootElement.innerHTML = prerenderedMarkup;
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const app = (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

if (rootElement.firstChild) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
