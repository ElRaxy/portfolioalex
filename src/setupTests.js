import '@testing-library/jest-dom'

// jsdom no implementa nada de esto y la web lo usa en el arranque: sin los
// dobles, cualquier render revienta antes de llegar a la primera asercion.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}

if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    observe() {}

    unobserve() {}

    disconnect() {}

    takeRecords() { return [] }
  }
  global.IntersectionObserver = window.IntersectionObserver
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}

    unobserve() {}

    disconnect() {}
  }
  global.ResizeObserver = window.ResizeObserver
}

window.scrollTo = () => {}
