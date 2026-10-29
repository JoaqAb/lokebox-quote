# TAREA_036 · Cliente pliego, el configurador de cajas dentro de una web de Studio

Brief de Joaquin del 29/10/2026: tres webs de ejemplo para fabricas B2B en Studio. La primera,
Pliego Envases, fabrica ficticia de cajas y bolsas, lleva el configurador de cajas como seccion
central, "Armá tu caja", terminando en consulta por WhatsApp sin precio. Decidido con Joaquin
en el chat del 29/10: la web vive en Studio y el configurador entra embebido desde Quote en
modo vitrina (D168), con un cliente propio. Nada de codigo de Quote se copia a Studio (D167:
Quote puede ser parte de Studio).

## Alcance

- `src/clients/pliego.json`: vertical boxes, misma geometria y opciones que cajasur, marca de
  Pliego, `pricing.display` hidden, `cta` whatsapp, `poweredBy` false, `whatsappMessageHidden`
  sin cifras de precio.
- `public/clients/pliego/logo.svg`: logo en trazos, sin fuentes, mismo criterio que cajasur.
- `src/app/clients.test.ts`: los dos tests que enumeran clientes suman pliego.
- Sin cambios en core ni en verticales. La landing no cambia. pliego no entra al sitemap: es una
  pieza embebida, no una demo publica de Quote.

## Criterios

1. `npx vitest run` en verde, con pliego validado por el core y por la vertical de cajas.
2. `/d/pliego?showcase` carga el configurador con la marca de Pliego y sin precio a la vista.
3. El mensaje de WhatsApp no lleva ninguna cifra de precio.

## Publicacion

Rama `cliente-pliego`, preview de Vercel. Entra a main con el ok de Joaquin a la web de Pliego.
