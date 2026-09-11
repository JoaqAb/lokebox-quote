# DECISIONES

- 11/09/2026: stack cerrado. Vite + React + TypeScript + Tailwind, React Three Fiber, Supabase propio, deploy en Vercel.
- 11/09/2026: arquitectura en tres capas, con la capa de cliente en JSON.
- 11/09/2026: la primera vertical es cartelería.
- 11/09/2026: el 3D entra en el MVP, con una escena simple.
- 11/09/2026: el quote imprimible se resuelve con HTML de impresión, sin librerías PDF.
- 11/09/2026: los precios de la demo son ficticios.
- 11/09/2026: el nombre del producto es Lokebox Quote.
- 11/09/2026: la demo usa un cliente ficticio. La identidad Lokebox aparece solo en la landing y en el "Powered by".
- 11/09/2026: SPEC.md versión 1.0 cerrado como fuente de verdad del alcance. Se edita, no se contradice.
- 11/09/2026: dos tipos de cartel en el MVP, facade y totem. El totem lleva recargo fijo por estructura, definido en el JSON del cliente.
- 11/09/2026: el motor de precios tiene la firma calculatePrice(rules, selection). El formateo de moneda queda afuera, en format.ts, para que el motor sea copiable a Lokey sin cambios.
- 11/09/2026: el precio se calcula en precisión completa y se redondea solo al final, para que los tests tengan números exactos.
- 11/09/2026: los precios ES se derivan de los EN con dólar de referencia 1500 y factor de mercado local 0,45, redondeados al millar, y quedan marcados como placeholder hasta tener precios reales de una cartelería.
- 11/09/2026: vitest como runner de tests. Es la única librería nueva del bloque 1.
- 11/09/2026: el primer deploy en Vercel se hace al cerrar el bloque del lunes, sin dominio propio, para no dejar el deploy para el final. El dominio quote.lokebox.com se conecta el miércoles.
- 11/09/2026: cero strings de UI hardcodeados. Todo texto visible sale de texts en el JSON del cliente, con las 34 claves listadas en SPEC 10.
- 11/09/2026: si el 3D no rinde en mobile, el orden de degradación es bloom, sombras, órbita. No se vuelve a 2D.
