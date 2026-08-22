import { createContext, useContext } from 'react'

// El prerender no tiene `window`, asi que un componente que lea la ruta de ahi
// la ve siempre como la portada: en las paginas de caso las anclas de la nav
// salian sueltas (`#about`) apuntando a secciones que en ese HTML no existen, y
// solo se arreglaban al hidratar. La ruta se sirve desde arriba, donde se sabe.
export const RoutePathnameContext = createContext(null)

export const useRoutePathname = () => {
  const desdeArriba = useContext(RoutePathnameContext)
  if (desdeArriba) return desdeArriba

  try {
    return typeof window === 'undefined' ? '/' : window.location.pathname
  } catch {
    return '/'
  }
}
