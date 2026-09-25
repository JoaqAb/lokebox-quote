// Linea base del refactor de TAREA_032 (D122, fase 1): recorre por cliente una matriz de
// selecciones y guarda la seleccion, el resultado completo del motor y la URL de la hoja; suma
// las URLs de hoja ya publicadas, con su seleccion y su precio decodificados, y un juego chico
// de vistas (desglose formateado, filas de la hoja, fila del lead y mensaje de WhatsApp).
//   node scripts/snapshot-precios.mjs <salida.json>
// La salida es obligatoria: el fixture versionado no se regenera por accidente. Carga los
// modulos del proyecto con el server de Vite en modo middleware, sin navegador.
// Tailwind escanea scripts/, asi que este archivo no escribe nombres de utilidades.
import { writeFile } from 'node:fs/promises'
import { createServer } from 'vite'

const out = process.argv[2]
if (out === undefined) {
  console.error('uso: node scripts/snapshot-precios.mjs <salida.json>')
  process.exit(1)
}

// Texto de 18 caracteres con dos espacios, el tope de SPEC 5.3: 16 letras.
const LONG_TEXT = 'ABCDEFG HIJKLM NOP'

// URLs de hoja que ya estan afuera (D122). grep -rn "/quote?" docs/ scripts/ no da ningun link
// literal: solo la plantilla de TAREA_006. La hoja de quote-northline.pdf no lleva su URL: se
// reconstruye con la seleccion que imprime (letras, BLUE OWL, 1 ft, 2 in, aluminio, retroiluminado,
// sin instalacion, 1, $1,330). El video del listado no muestra la barra de direcciones ni abre la
// hoja: su ultima toma es la misma seleccion.
const PUBLISHED = [
  {
    origin: 'validacion/venta/quote-northline.pdf (Gallery del Catalog, D38 y D110), reconstruida de la hoja impresa',
    slug: 'northline',
    query: 't=letters&x=BLUE+OWL&lh=1&d=d2&m=aluminum&l=back&i=0&q=1',
  },
  {
    origin: 'validacion/venta/video-listado.mp4 (video del Catalog), ultima toma: misma seleccion que la hoja',
    slug: 'northline',
    query: 't=letters&x=BLUE+OWL&lh=1&d=d2&m=aluminum&l=back&i=0&q=1',
  },
]

const unique = (values) => [...new Set(values)]

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const load = (path) => server.ssrLoadModule(path)
  const { getClient, listClientSlugs } = await load('/src/clients/index.ts')
  const { materialsForMode, priceDisplayOf, priceRulesFromClient, pricingModeOf } = await load('/src/core/clientConfig.ts')
  const { calculatePrice } = await load('/src/core/pricing/calculatePrice.ts')
  const { decodeQuoteParams, encodeQuoteParams } = await load('/src/core/quote/quoteParams.ts')
  const { formatArea, formatCurrency, formatLineDetail } = await load('/src/core/pricing/format.ts')
  const { resolveLineLabel } = await load('/src/core/pricing/lineLabels.ts')
  const { buildLeadRow } = await load('/src/core/lead/leadRow.ts')
  const { buildWhatsappMessage } = await load('/src/core/lead/whatsapp.ts')
  const { signLeadSelection, signLeadTokens, signWhatsappTemplate } = await load('/src/verticals/signs/leadTokens.ts')
  const { signQuoteRows } = await load('/src/verticals/signs/quoteRows.ts')
  const { areaUnitSymbol } = await load('/src/verticals/signs/visuals.ts')

  const snapshot = { generatedFrom: 'TAREA_032 fase 1', totals: {}, cases: [], published: [], views: [] }

  for (const slug of listClientSlugs()) {
    const config = getClient(slug)
    const { options } = config
    const rules = priceRulesFromClient(config)
    const display = priceDisplayOf(config)
    const areaUnit = areaUnitSymbol(config.units.area)
    const quantities = unique([options.quantity.min, 2, 5, options.quantity.max]).filter(
      (q) => q >= options.quantity.min && q <= options.quantity.max,
    )
    const texts = unique([options.signText.default, LONG_TEXT])
    const pick = (range, key) => range[key]
    let count = 0

    const cases = []
    for (const type of options.types) {
      const mode = type.pricing
      const sizes = ['min', 'default', 'max']
      const depths = mode === 'letters' ? options.depths.map((d) => d.id) : [options.depths[0].id]
      for (const material of materialsForMode(options, mode)) {
        for (const lighting of options.lighting) {
          for (const installation of [false, true]) {
            for (const quantity of quantities) {
              for (const size of sizes) {
                for (const depthId of depths) {
                  for (const text of texts) {
                    cases.push({
                      type: type.id,
                      text,
                      width: mode === 'area' ? pick(options.width, size) : options.width.default,
                      height: mode === 'area' ? pick(options.height, size) : options.height.default,
                      letterHeight: mode === 'letters' ? pick(options.letterHeight, size) : options.letterHeight.default,
                      depthId,
                      materialId: material.id,
                      lightingId: lighting.id,
                      installation,
                      quantity,
                    })
                  }
                }
              }
            }
          }
        }
      }
    }

    for (const selection of cases) {
      const result = calculatePrice(rules, selection)
      const query = encodeQuoteParams(selection, pricingModeOf(options, selection.type))
      snapshot.cases.push({ slug, selection, result, query })
      count += 1
    }
    snapshot.totals[slug] = count

    // Vistas: por tipo, iluminacion, instalacion y cantidad min y 5, con el texto default y el
    // primer material del modo. Es lo que ve el visitante y lo que se guarda en leads.
    for (const type of options.types) {
      for (const lighting of options.lighting) {
        for (const installation of [false, true]) {
          for (const quantity of unique([options.quantity.min, 5])) {
            const selection = {
              type: type.id,
              text: options.signText.default,
              width: options.width.default,
              height: options.height.default,
              letterHeight: options.letterHeight.default,
              depthId: options.depths.at(-1).id,
              materialId: materialsForMode(options, type.pricing)[0].id,
              lightingId: lighting.id,
              installation,
              quantity,
            }
            const result = calculatePrice(rules, selection)
            const breakdown = result.lines.map((line) => ({
              label: resolveLineLabel(line.labelKey, config.texts),
              detail: formatLineDetail(line.detailValues, config.currency, config.locale, areaUnit, config.units.length),
              amount: formatCurrency(line.amount, config.currency, config.locale),
            }))
            const caption = result.letters === undefined ? formatArea(result.area, config.locale, areaUnit) : null
            const leadSelection = signLeadSelection(config, selection)
            const whatsapp =
              config.cta === 'form'
                ? null
                : buildWhatsappMessage(signWhatsappTemplate(config, selection, display), signLeadTokens(config, selection, result, display))
            snapshot.views.push({
              slug,
              selection,
              caption,
              breakdown,
              sheetRows: signQuoteRows(config, selection),
              leadRow: buildLeadRow({ clientSlug: slug, channel: 'whatsapp', selection: leadSelection, result }),
              whatsapp,
            })
          }
        }
      }
    }
  }

  for (const entry of PUBLISHED) {
    const config = getClient(entry.slug)
    const selection = decodeQuoteParams(config.options, new URLSearchParams(entry.query))
    if (selection === null) {
      throw new Error(`URL publicada que no decodifica: ${entry.query}`)
    }
    const result = calculatePrice(priceRulesFromClient(config), selection)
    snapshot.published.push({ ...entry, selection, result })
  }

  // Un caso por linea: el diff de git se lee caso por caso.
  const lines = [
    '{',
    `"generatedFrom": ${JSON.stringify(snapshot.generatedFrom)},`,
    `"totals": ${JSON.stringify(snapshot.totals)},`,
    '"cases": [',
    snapshot.cases.map((item) => JSON.stringify(item)).join(',\n'),
    '],',
    '"published": [',
    snapshot.published.map((item) => JSON.stringify(item)).join(',\n'),
    '],',
    '"views": [',
    snapshot.views.map((item) => JSON.stringify(item)).join(',\n'),
    ']',
    '}',
  ]
  await writeFile(out, lines.join('\n') + '\n')
  console.log(JSON.stringify(snapshot.totals), `total ${String(snapshot.cases.length)}`, `publicadas ${String(snapshot.published.length)}`, `vistas ${String(snapshot.views.length)}`)
} finally {
  await server.close()
}
