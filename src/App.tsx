import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LandingPage } from './landing/LandingPage'
import { ErrorScreen } from './pages/ErrorScreen'

// Las dos rutas de cliente se cargan con React.lazy (SPEC 3): asi / no descarga el vendor 3D.
// La regla de no lazy loading es del preview dentro del cotizador, no de la ruta: la ruta
// entera es un chunk y el preview llega junto con su panel. El fallback es un div vacio del
// alto de la ventana, sin texto ni color propio. / y la ruta comodin quedan estaticas.
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
