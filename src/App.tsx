import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ErrorScreen } from './pages/ErrorScreen'
import { IndexPage } from './pages/IndexPage'
import { QuotePage } from './pages/QuotePage'
import { QuoteSheetPage } from './pages/QuoteSheetPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/d/:slug" element={<QuotePage />} />
        <Route path="/d/:slug/quote" element={<QuoteSheetPage />} />
        <Route path="*" element={<ErrorScreen />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
