// Imagen de Open Graph, 1200x630 (SPEC 13). Sale de la demo EN abierta en ese tamano exacto:
// lo que se comparte es el producto andando, no una portada de texto. Se corre a mano con
// `node scripts/og.mjs` cuando cambia la demo, y el PNG queda versionado en public/.
// Mismo arranque que scripts/capturas.mjs: dev server propio, Supabase bloqueado, y el server
// abajo al terminar. Tailwind escanea scripts/, asi que este archivo no escribe nombres de
// utilidades.
import { spawn } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { chromium } from 'playwright'

const ROOT = new URL('..', import.meta.url)
const OUT = new URL('public/og-lokebox-quote.png', ROOT)
const PORT = 5289
const BASE = `http://localhost:${String(PORT)}`
const PATH_ON_SITE = '/d/northline'
// La medida que piden Open Graph y Twitter para la tarjeta grande.
const SIZE = { width: 1200, height: 630 }
// La escena tarda en asentarse despues de que la red queda quieta.
const SETTLE_MS = 3000
const LAUNCH = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }

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
      const res = await fetch(`${BASE}${PATH_ON_SITE}`)
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

const server = startServer()
let browser
try {
  await waitForServer()
  browser = await chromium.launch(LAUNCH)
  const page = await browser.newPage({ viewport: SIZE, deviceScaleFactor: 1 })
  await page.route('**/*.supabase.co/**', (route) => route.abort())
  await page.goto(`${BASE}${PATH_ON_SITE}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(SETTLE_MS)
  await page.screenshot({ path: OUT.pathname })
  await page.close()
  const { size } = await stat(OUT)
  console.log(`og-lokebox-quote.png ${String(SIZE.width)}x${String(SIZE.height)}, ${String(size)} bytes`)
} finally {
  await browser?.close()
  stopServer(server)
}
