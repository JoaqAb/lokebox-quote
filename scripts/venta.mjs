// Material de venta (D43, D101): las ocho capturas de validacion/venta/, 01 a 08, con el layout
// vigente. Mismas escenas, tamanos y densidad que las del 17/09, que se sacaron a mano. Despues
// `python3 validacion/venta/subir.py` arma las seis de validacion/venta/subir/.
// Se corre con `node scripts/venta.mjs`. Mismo arranque que scripts/og.mjs: dev server propio,
// Supabase cortado y el server abajo al terminar. Va con la GPU del equipo, como la matriz
// premium de scripts/capturas.mjs: con el pipeline de render, swiftshader no llega.
// Tailwind escanea scripts/, asi que este archivo no escribe nombres de utilidades.
import { spawn } from 'node:child_process'
import { mkdir, readFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const ROOT = new URL('..', import.meta.url)
const OUT = new URL('validacion/venta/', ROOT)
const PORT = 5291
const BASE = `http://localhost:${String(PORT)}`
const SLUG = 'northline'
const LAUNCH = { args: ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist'] }
// Escritorio: 1440x900 a 2x. Mobile: 440x956 a 3x, y la 08 390x844 a 2x, como las del 17/09.
const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }
const MOBILE = { viewport: { width: 440, height: 956 }, deviceScaleFactor: 3 }
const MOBILE_SMALL = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }
// Espera despues de cada eleccion, y despues de un arrastre, que sigue unos cuadros por el damping.
const SETTLE_MS = 1500
const DRAG_SETTLE_MS = 3000

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function startServer() {
  return spawn('node_modules/.bin/vite', ['--port', String(PORT), '--strictPort'], {
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
      const res = await fetch(`${BASE}/d/${SLUG}`)
      if (res.ok) {
        return
      }
    } catch {
      // Todavia no escucha.
    }
    await wait(500)
  }
  throw new Error(`el dev server no respondio en ${BASE}`)
}

async function open(browser, device) {
  const page = await browser.newPage(device)
  await page.route('**/*.supabase.co/**', (route) => route.abort())
  await page.goto(`${BASE}/d/${SLUG}`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.querySelector('[aria-busy="true"]') === null)
  await wait(SETTLE_MS)
  return page
}

async function choose(page, label) {
  await page.getByRole('button', { name: label, exact: true }).click()
  await wait(SETTLE_MS)
}

async function setText(page, texts, value) {
  await page.getByLabel(texts.signTextLabel, { exact: true }).fill(value)
  await wait(SETTLE_MS)
}

async function toTop(page) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await wait(300)
}

// Giro del modo cartel: arrastre horizontal desde el centro del canvas.
async function rotate(page, degrees) {
  await toTop(page)
  const box = await page.locator('canvas').boundingBox()
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  const dx = (degrees / 360) * box.height
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let step = 1; step <= 20; step += 1) {
    await page.mouse.move(x + (dx * step) / 20, y)
    await wait(16)
  }
  await page.mouse.up()
  await wait(DRAG_SETTLE_MS)
}

async function shot(page, name) {
  await page.screenshot({ path: new URL(name, OUT).pathname })
  console.log(name)
}

const server = startServer()
let browser
try {
  await waitForServer()
  await mkdir(OUT, { recursive: true })
  const config = JSON.parse(await readFile(new URL(`src/clients/${SLUG}.json`, ROOT), 'utf8'))
  const { texts, options, photos } = config
  const label = (list, id) => list.find((item) => item.id === id).label
  const front = photos[0].label
  browser = await chromium.launch(LAUNCH)

  // 01: letras corporeas, aluminio, retroiluminadas, girado.
  let page = await open(browser, DESKTOP)
  await choose(page, label(options.types, 'letters'))
  await setText(page, texts, 'BLUE OWL')
  await choose(page, label(options.materials, 'aluminum'))
  await choose(page, label(options.lighting, 'back'))
  await rotate(page, -25)
  await shot(page, '01-desktop-letras-backlit.png')
  await page.close()

  // 02: cartel de fachada con lo que trae al cargar (PVC, sin luz), girado.
  page = await open(browser, DESKTOP)
  await rotate(page, -15)
  await shot(page, '02-desktop-base-pvc.png')
  // 03: aluminio con luz frontal.
  await choose(page, label(options.materials, 'aluminum'))
  await choose(page, label(options.lighting, 'front'))
  await toTop(page)
  await shot(page, '03-desktop-aluminio-frontlit.png')
  // 04: la misma seleccion sobre la foto de frente.
  await choose(page, front)
  await toTop(page)
  await shot(page, '04-desktop-vista-fachada.png')
  await page.close()

  // 05 y 06: mobile al cargar, en modo cartel y sobre la foto.
  page = await open(browser, MOBILE)
  await rotate(page, -15)
  await shot(page, '05-mobile-base.png')
  await choose(page, front)
  await toTop(page)
  await shot(page, '06-mobile-vista-fachada.png')
  await page.close()

  // 07: final del panel con el desglose, retroiluminado y sin instalacion, y el pedido enviado.
  page = await open(browser, MOBILE)
  await choose(page, label(options.lighting, 'back'))
  await choose(page, texts.installationNo)
  await page.getByRole('button', { name: texts.ctaForm, exact: true }).click()
  await page.getByLabel(texts.formName).fill('Dana')
  await page.getByLabel(texts.formContact).fill('dana@example.com')
  await page.getByRole('button', { name: texts.formSubmit, exact: true }).click()
  await page.getByText(texts.thanksTitle).waitFor({ timeout: 10000 })
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await wait(SETTLE_MS)
  await shot(page, '07-mobile-desglose-y-lead.png')
  await page.close()

  // 08: letras en el telefono chico, como la 01.
  page = await open(browser, MOBILE_SMALL)
  await choose(page, label(options.types, 'letters'))
  await setText(page, texts, 'BLUE OWL')
  await choose(page, label(options.materials, 'aluminum'))
  await choose(page, label(options.lighting, 'back'))
  await rotate(page, -25)
  await shot(page, '08-mobile-letras-backlit.png')
  await page.close()
} finally {
  await browser?.close()
  stopServer(server)
}
