// Convierte un TTF a typeface JSON de three (el formato de facetype.js), subsetado.
// Herramienta de desarrollo, no entra al bundle. Mismo mapeo que facetype.js: escala a
// resolucion 1000, "c" pasa a "b", las coordenadas se redondean. Los "z" se omiten:
// el lector de three no los usa. Se conserva el copyright y la licencia de la fuente.
// Uso: NODE_PATH=<dir con opentype.js>/node_modules node scripts/typeface.cjs <ttf> <json> <caracteres>
const fs = require('node:fs')
const opentype = require('opentype.js')

const [input, output, chars] = process.argv.slice(2)
if (!input || !output || !chars) {
  throw new Error('uso: node scripts/typeface.cjs <ttf> <json> <caracteres>')
}

const font = opentype.parse(fs.readFileSync(input).buffer)
const scale = (1000 * 100) / ((font.unitsPerEm || 2048) * 72)
const round = (value) => Math.round(value * scale)

const glyphs = {}
for (const char of [...new Set(chars)]) {
  const glyph = font.charToGlyph(char)
  if (glyph.index === 0) {
    throw new Error(`la fuente no tiene el caracter "${char}"`)
  }
  let outline = ''
  for (const command of glyph.path.commands) {
    if (command.type === 'Z') {
      continue
    }
    const parts = [command.type === 'C' ? 'b' : command.type.toLowerCase(), round(command.x), round(command.y)]
    if (command.x1 !== undefined) parts.push(round(command.x1), round(command.y1))
    if (command.x2 !== undefined) parts.push(round(command.x2), round(command.y2))
    outline += parts.join(' ') + ' '
  }
  const box = glyph.getBoundingBox()
  glyphs[char] = { ha: round(glyph.advanceWidth), x_min: round(box.x1), x_max: round(box.x2), o: outline.trim() }
}

const head = font.tables.head
const names = font.names
const result = {
  glyphs,
  familyName: names.fontFamily.en,
  ascender: round(font.ascender),
  descender: round(font.descender),
  underlinePosition: round(font.tables.post.underlinePosition),
  underlineThickness: round(font.tables.post.underlineThickness),
  boundingBox: { yMin: round(head.yMin), xMin: round(head.xMin), yMax: round(head.yMax), xMax: round(head.xMax) },
  resolution: 1000,
  original_font_information: {
    copyright: names.copyright.en,
    license: names.license ? names.license.en : 'SIL Open Font License 1.1',
    licenseURL: names.licenseURL ? names.licenseURL.en : 'https://openfontlicense.org',
  },
  cssFontWeight: 'normal',
  cssFontStyle: 'normal',
}
fs.writeFileSync(output, JSON.stringify(result))
