// Set de capturas de validacion (TAREA_018, landing desde TAREA_013): 21 PNG en validacion/
// para que Canal B vea el preview y la landing. Levanta el dev server, abre chromium con Playwright, bloquea Supabase y baja el
// server al terminar. Se corre con `npm run capturas`. No hace builds ni toca dist/.
// Con `npm run capturas -- premium <carpeta>` (TAREA_023) saca en cambio la matriz de
// comparacion del bloque 10: por cliente, los tres tipos, los tres materiales (desde TAREA_024),
// en modo cartel y en las dos fotos, con las tres luces. Escribe solo en esa carpeta y no toca
// el resto de validacion/.
// Desde TAREA_024 la matriz suma, con luz none y front, el cuadro cartel60: modo cartel girado 60
// grados. Con `premium <carpeta> sinbloom` la misma matriz sale con el dev server sin bloom
// (VITE_QUOTE_BLOOM=off), la referencia del criterio de bloom. cartel60 sale tambien con
// luz front: la mascara de la cara es lo que cambia de none a front. Desde TAREA_025 cartel60 sale
// tambien con luz back.
import { spawn } from 'node:child_process'
import { mkdir, readFile, rm, stat } from 'node:fs/promises'
import { chromium } from 'playwright'

const ROOT = new URL('..', import.meta.url)
const PREMIUM = process.argv[2] === 'premium'
const NO_BLOOM = PREMIUM && process.argv[4] === 'sinbloom'
const OUT = PREMIUM ? new URL(`${process.argv[3] ?? ''}/`.replace(/\/+$/, '/'), ROOT) : new URL('validacion/', ROOT)
if (PREMIUM && process.argv[3] === undefined) {
  throw new Error('uso: npm run capturas -- premium <carpeta>')
}
const PORT = 5288
const BASE = `http://localhost:${String(PORT)}`
const SLUGS = ['northline', 'norte']
// Espera fija despues de cada cambio de tipo, de vista o de modo de luz.
const SETTLE_MS = 1500
// Despues de un arrastre: OrbitControls tiene damping y sigue girando unos frames.
const DRAG_SETTLE_MS = 3000
const DESKTOP = { width: 1440, height: 900 }
const MOBILE = { width: 390, height: 844 }
// La landing se revisa en los tres anchos, con la pagina entera: es una sola columna larga.
const LANDING_WIDTHS = [390, 768, 1440]
// La misma configuracion de navegador que las capturas de G3 de TAREA_017.
const LAUNCH = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }
// La matriz premium va con la GPU del equipo (ANGLE sobre OpenGL): con el pipeline de render de
// TAREA_023, swiftshader dibuja entre 1 y 4 cuadros por segundo a 1440 y las capturas vencen.
const GPU_LAUNCH = { args: ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist'] }

const counters = { aborted: 0, supabaseCompleted: 0 }

function startServer() {
  const server = spawn('node_modules/.bin/vite', ['--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    detached: true,
    stdio: 'ignore',
    env: NO_BLOOM ? { ...process.env, VITE_QUOTE_BLOOM: 'off' } : process.env,
  })
  return server
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
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`el dev server no respondio en ${BASE}`)
}

// Etiquetas de los botones, leidas del JSON del cliente: el script no depende de ids en el DOM.
async function labelsOf(slug) {
  const config = JSON.parse(await readFile(new URL(`src/clients/${slug}.json`, ROOT), 'utf8'))
  const byId = (list, id) => {
    const found = list.find((item) => item.id === id)
    if (found === undefined) {
      throw new Error(`${slug}: falta "${id}" en el JSON`)
    }
    return found.label
  }
  return {
    signOnly: config.texts.viewSignOnly,
    facade: byId(config.options.types, 'facade'),
    letters: byId(config.options.types, 'letters'),
    totem: byId(config.options.types, 'totem'),
    front: byId(config.photos, 'front-day'),
    night: byId(config.photos, 'front-night'),
    back: byId(config.options.lighting, 'back'),
    lights: ['none', 'front', 'back'].map((id) => ({ id, label: byId(config.options.lighting, id) })),
    materials: config.options.materials.map((item) => ({ id: item.id, label: item.label })),
  }
}

async function openPage(browser, slug, viewport) {
  return openPath(browser, `/d/${slug}`, viewport)
}

async function openPath(browser, path, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  await page.route('**/*.supabase.co/**', (route) => {
    counters.aborted += 1
    return route.abort()
  })
  page.on('requestfinished', (request) => {
    if (new URL(request.url()).hostname.endsWith('supabase.co')) {
      counters.supabaseCompleted += 1
    }
  })
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
  // Si el preview tiene pantalla de carga, se espera a que la escena dibuje su primer frame.
  await page.waitForFunction(() => document.querySelector('[aria-busy="true"]') === null)
  await page.waitForTimeout(SETTLE_MS)
  return page
}

// Sin foco ni scroll, asi el recorte coincide con el marco del preview.
async function resetScroll(page) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    window.scrollTo(0, 0)
  })
}

async function choose(page, label) {
  await page.getByRole('button', { name: label, exact: true }).click()
  await page.waitForTimeout(SETTLE_MS)
}

// El marco del preview es el primer ancestro del canvas con borde redondeado. Tailwind escanea
// scripts/ en busca de clases, asi que este archivo evita escribir nombres de utilidades.
async function captureFrame(page, name) {
  await resetScroll(page)
  const clip = await page.locator('canvas').evaluate((canvas) => {
    let node = canvas.parentElement
    while (node !== null && getComputedStyle(node).borderTopLeftRadius === '0px') {
      node = node.parentElement
    }
    if (node === null) {
      throw new Error('no se encontro el marco del preview')
    }
    const rect = node.getBoundingClientRect()
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
  })
  await page.screenshot({ path: new URL(name, OUT).pathname, clip })
}

// Arrastre corto que empieza en el centro del canvas y termina dentro de el. Uno que termina
// afuera deja un puntero colgado en OrbitControls (decision del 14/09). OrbitControls gira
// 2 pi por alto de canvas arrastrado.
async function rotate(page, degrees) {
  await resetScroll(page)
  const box = await page.locator('canvas').boundingBox()
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  const dx = (degrees / 360) * box.height
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let step = 1; step <= 20; step += 1) {
    await page.mouse.move(x + (dx * step) / 20, y)
    await page.waitForTimeout(16)
  }
  await page.mouse.up()
  await page.waitForTimeout(DRAG_SETTLE_MS)
}

async function captureClient(browser, slug) {
  const labels = await labelsOf(slug)
  const files = []
  const frame = async (page, name) => {
    await captureFrame(page, name)
    files.push(name)
  }

  const page = await openPage(browser, slug, DESKTOP)
  await frame(page, `${slug}-facade-cartel-frente.png`)
  await choose(page, labels.letters)
  await frame(page, `${slug}-letters-cartel-frente.png`)
  await choose(page, labels.totem)
  await frame(page, `${slug}-totem-cartel-frente.png`)
  await rotate(page, 45)
  await frame(page, `${slug}-totem-cartel-45.png`)
  await choose(page, labels.front)
  await frame(page, `${slug}-totem-vista-front.png`)
  await choose(page, labels.night)
  await frame(page, `${slug}-totem-vista-night.png`)
  await choose(page, labels.facade)
  await choose(page, labels.back)
  await frame(page, `${slug}-facade-vista-night-back.png`)
  await page.close()

  for (const [viewport, name] of [
    [DESKTOP, `${slug}-desktop-1440.png`],
    [MOBILE, `${slug}-mobile-390.png`],
  ]) {
    const fresh = await openPage(browser, slug, viewport)
    await fresh.screenshot({ path: new URL(name, OUT).pathname })
    files.push(name)
    await fresh.close()
  }
  return files
}

// Matriz del bloque 10: tipo, material, luz y vista. Los nombres son estables entre corridas
// para comparar antes y despues archivo por archivo. El material va en el nombre desde
// TAREA_024: es lo que hay que poder comparar entre acabados.
async function capturePremium(browser, slug) {
  const labels = await labelsOf(slug)
  const views = [
    { id: 'cartel', label: labels.signOnly },
    { id: 'vista-day', label: labels.front },
    { id: 'vista-night', label: labels.night },
  ]
  const files = []
  const page = await openPage(browser, slug, DESKTOP)
  for (const type of ['facade', 'letters', 'totem']) {
    await choose(page, labels[type])
    for (const material of labels.materials) {
      await choose(page, material.label)
      for (const light of labels.lights) {
        await choose(page, light.label)
        for (const view of views) {
          await choose(page, view.label)
          const name = `${slug}-${type}-${material.id}-${light.id}-${view.id}.png`
          await captureFrame(page, name)
          files.push(name)
          if (view.id === 'cartel') {
            await rotate(page, 60)
            const turned = `${slug}-${type}-${material.id}-${light.id}-cartel60.png`
            await captureFrame(page, turned)
            files.push(turned)
          }
        }
      }
    }
  }
  // La foto sola de cada vista, con el canvas oculto: la referencia para medir que la foto
  // fuera del cartel no cambia (TAREA_024). Es una capa HTML y no depende del cartel.
  for (const view of views.slice(1)) {
    await choose(page, view.label)
    await page.locator('canvas').evaluate((canvas) => {
      canvas.style.visibility = 'hidden'
    })
    const name = `${slug}-foto-${view.id}.png`
    await captureFrame(page, name)
    files.push(name)
    await page.locator('canvas').evaluate((canvas) => {
      canvas.style.visibility = ''
    })
  }
  await page.close()
  return files
}

async function captureLanding(browser) {
  const files = []
  for (const width of LANDING_WIDTHS) {
    const name = `landing-${String(width)}.png`
    const page = await openPath(browser, '/', { width, height: DESKTOP.height })
    await page.screenshot({ path: new URL(name, OUT).pathname, fullPage: true })
    files.push(name)
    await page.close()
  }
  return files
}

const server = startServer()
let browser = null
try {
  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })
  await waitForServer()
  browser = await chromium.launch(PREMIUM ? GPU_LAUNCH : LAUNCH)
  const files = []
  for (const slug of SLUGS) {
    files.push(...(await (PREMIUM ? capturePremium(browser, slug) : captureClient(browser, slug))))
  }
  if (!PREMIUM) {
    files.push(...(await captureLanding(browser)))
  }
  for (const name of files) {
    const { size } = await stat(new URL(name, OUT))
    console.log(`${name} ${String(size)} bytes`)
  }
  console.log(`${String(files.length)} archivos en ${OUT.pathname}`)
  console.log(`requests a supabase.co abortadas: ${String(counters.aborted)}, completadas: ${String(counters.supabaseCompleted)}`)
} finally {
  if (browser !== null) {
    await browser.close()
  }
  stopServer(server)
}
