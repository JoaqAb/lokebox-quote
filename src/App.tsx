import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LandingPage } from './landing/LandingPage'
import { ErrorScreen } from './pages/ErrorScreen'

// Las dos rutas de cliente se cargan con React.lazy (SPEC 3): asi / no descarga el vendor 3D.
// Desde la version 2.13 (D121) la vista de cada vertical tambien llega con React.lazy, desde el
// registro de src/app, y el cotizador muestra la pantalla de carga mientras baja. El fallback de
// la ruta es un div vacio del alto de la ventana, sin texto ni color propio. / y la ruta comodin
// quedan estaticas.
const QuotePage = lazy(async () => ({ default: (await import('./pages/QuotePage')).QuotePage }))
const QuoteSheetPage = lazy(async () => ({ default: (await import('./pages/QuoteSheetPage')).QuoteSheetPage }))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-dvh" />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/d/:slug" element={<QuotePage />} />
          <Route path="/d/:slug/quote" element={<QuoteSheetPage />} />
          <Route path="*" element={<ErrorScreen />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
