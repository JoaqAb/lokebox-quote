// Material de vitrina (TAREA_031, D114 y D118): seis capturas por cliente en
// validacion/vitrina/<slug>/ y la grilla validacion/vitrina/00-grilla.png, para el portfolio de
// Upwork y la web nueva. Corre contra el build local: `npm run build` y despues
// `node scripts/vitrina.mjs`. Levanta `vite preview`, corta Supabase y baja el server al terminar.
// Al final lista cada archivo con su peso y sus dimensiones.
// La configuracion de portada se fija con clics en el panel, como scripts/venta.mjs: el JSON no
// se toca. Va con la GPU del equipo, como venta.mjs.
// Tailwind escanea scripts/, asi que este archivo no escribe nombres de utilidades.
import { spawn } from 'node:child_process'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const ROOT = new URL('..', import.meta.url)
const OUT = new URL('validacion/vitrina/', ROOT)
const PORT = 5292
const BASE = `http://localhost:${String(PORT)}`
const LAUNCH = { args: ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist'] }
const SETTLE_MS = 1500
// Ancho del panel de escritorio (SPEC 4.1): el preview mide la ventana menos esto.
const PANEL_PX = 400
const SHEET = { width: 1920, height: 1080, square: 480, gap: 40, background: '#F2F1EE' }

// Portada de cada cliente. northline y norte repiten la toma 01 del material de venta de TAREA_029.
const COVERS = [
  { slug: 'northline', type: 'letters', text: 'BLUE OWL', material: 'aluminum', lighting: 'back' },
  { slug: 'norte', type: 'letters', material: 'aluminum', lighting: 'back' },
  { slug: 'halcyon', type: 'letters', material: 'brass', lighting: 'back', depth: 1 },
  { slug: 'afterglow', type: 'letters', material: 'pink-acrylic', lighting: 'front' },
  { slug: 'alba', type: 'totem', material: 'aluminio', lighting: 'front' },
]

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function startServer() {
  return spawn('node_modules/.bin/vite', ['preview', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore',
  })
}

function stopServer(server) {
  try {
    process.kill(-server.pid, 'SIGTERM')
  } catch {
    // Ya termino: no hay nada que bajar.
  }
}

async function waitForServer() {
  const deadline = Date.now() + 60000
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/d/northline`)
      if (res.ok) {
        return
      }
    } catch {
      // Todavia no escucha.
    }
    await wait(500)
  }
  throw new Error(`el server de preview no respondio en ${BASE}`)
}

async function open(browser, slug, device) {
  const page = await browser.newPage(device)
  await page.route('**/*.supabase.co/**', (route) => route.abort())
  await page.goto(`${BASE}/d/${slug}`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.querySelector('[aria-busy="true"]') === null)
  await wait(SETTLE_MS)
  return page
}

async function choose(page, label) {
  await page.getByRole('button', { name: label, exact: true }).click()
  await wait(SETTLE_MS)
}

// Pone la portada con clics en el panel, en el orden del panel: tipo, texto, profundidad,
// material y luz.
async function applyCover(page, config, cover) {
  const { options, texts } = config
  const label = (list, id) => list.find((item) => item.id === id).label
  await choose(page, label(options.types, cover.type))
  if (cover.text !== undefined) {
    await page.getByLabel(texts.signTextLabel, { exact: true }).fill(cover.text)
    await wait(SETTLE_MS)
  }
  if (cover.depth !== undefined) {
    await choose(page, options.depths[cover.depth].label)
  }
  await choose(page, label(options.materials, cover.material))
  await choose(page, label(options.lighting, cover.lighting))
  await page.evaluate(() => window.scrollTo(0, 0))
  await wait(300)
}

// Captura solo el preview a una medida exacta: la ventana se ajusta para que la zona del preview
// mida eso, y se recorta la zona.
async function previewShot(browser, config, cover, size, path) {
  const page = await open(browser, cover.slug, { viewport: { width: size.width + PANEL_PX, height: size.height + 200 }, deviceScaleFactor: 1 })
  const header = await page.evaluate(() => document.querySelector('[data-preview-area]').getBoundingClientRect().top)
  await page.setViewportSize({ width: size.width + PANEL_PX, height: size.height + Math.round(header) })
  await wait(SETTLE_MS)
  await applyCover(page, config, cover)
  const zone = await page.locator('[data-preview-zone]').boundingBox()
  await page.screenshot({ path, clip: { x: zone.x, y: zone.y, width: size.width, height: size.height } })
  await page.close()
}

// Ancho y alto de un PNG, del bloque IHDR.
async function pngSize(url) {
  const data = await readFile(url)
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) }
}

const server = startServer()
let browser
const written = []
try {
  await waitForServer()
  browser = await chromium.launch(LAUNCH)
  for (const cover of COVERS) {
    const dir = new URL(`${cover.slug}/`, OUT)
    await mkdir(dir, { recursive: true })
    const config = JSON.parse(await readFile(new URL(`src/clients/${cover.slug}.json`, ROOT), 'utf8'))
    const file = (name) => {
      const url = new URL(name, dir)
      written.push(url)
      return url.pathname
    }

    let page = await open(browser, cover.slug, { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
    await applyCover(page, config, cover)
    await page.screenshot({ path: file('01-desktop-cartel.png') })
    for (const [index, name] of [[0, '02-desktop-dia.png'], [1, '03-desktop-noche.png']]) {
      await choose(page, config.photos[index].label)
      await page.evaluate(() => window.scrollTo(0, 0))
      await wait(300)
      await page.screenshot({ path: file(name) })
    }
    await page.close()

    page = await open(browser, cover.slug, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
    await applyCover(page, config, cover)
    await page.screenshot({ path: file('04-mobile.png') })
    await page.close()

    await previewShot(browser, config, cover, { width: 1080, height: 1080 }, file('05-cuadrado.png'))
    await previewShot(browser, config, cover, { width: 1200, height: 630 }, file('06-ancho.png'))
  }

  // Grilla de los cinco cuadrados sobre fondo liso, sin texto: tres arriba y dos abajo, centrados.
  // Se dibuja en un canvas de la pagina, sin estilos.
  const squares = await Promise.all(
    COVERS.map(async (cover) => `data:image/png;base64,${(await readFile(new URL(`${cover.slug}/05-cuadrado.png`, OUT))).toString('base64')}`),
  )
  const sheet = await browser.newPage({ viewport: { width: SHEET.width, height: SHEET.height }, deviceScaleFactor: 1 })
  await sheet.setContent(`<canvas width="${String(SHEET.width)}" height="${String(SHEET.height)}"></canvas>`)
  const dataUrl = await sheet.evaluate(async ({ sources, layout }) => {
    const canvas = document.querySelector('canvas')
    const context = canvas.getContext('2d')
    context.fillStyle = layout.background
    context.fillRect(0, 0, layout.width, layout.height)
    const { square, gap } = layout
    const top = (layout.height - 2 * square - gap) / 2
    const rowLeft = (count) => (layout.width - count * square - (count - 1) * gap) / 2
    for (const [index, source] of sources.entries()) {
      const image = new Image()
      image.src = source
      await image.decode()
      const row = index < 3 ? 0 : 1
      const col = row === 0 ? index : index - 3
      context.drawImage(image, rowLeft(row === 0 ? 3 : 2) + col * (square + gap), top + row * (square + gap), square, square)
    }
    return canvas.toDataURL('image/png')
  }, { sources: squares, layout: SHEET })
  await sheet.close()
  const sheetUrl = new URL('00-grilla.png', OUT)
  written.push(sheetUrl)
  await writeFile(sheetUrl, Buffer.from(dataUrl.split(',')[1], 'base64'))

  for (const url of written) {
    const { width, height } = await pngSize(url)
    const { size } = await stat(url)
    console.log(`${url.pathname.slice(new URL('validacion/', ROOT).pathname.length)} ${String(width)}x${String(height)} ${String(Math.round(size / 1024))} kB`)
  }
  console.log(`${String(written.length)} archivos`)
} finally {
  await browser?.close()
  stopServer(server)
}
