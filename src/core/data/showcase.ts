// Modo vitrina (D168): la demo embebida en lokebox.com/quote lleva ?showcase en la
// direccion. En ese modo el cotizador no escribe nada: ni visita, ni lead, ni la marca
// de sessionStorage. Asi lokebox.com sigue sin medir visitas ni guardar datos en el
// navegador, como dicen sus legales. Un cliente que embebe su propio Quote no lleva el
// parametro y registra todo como siempre.

export function isShowcase(search: string): boolean {
  return new URLSearchParams(search).has('showcase')
}

// Se toma una sola vez, al cargar el modulo, como la config de datos.
export const SHOWCASE: boolean = typeof window !== 'undefined' && isShowcase(window.location.search)
