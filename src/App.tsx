import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ErrorScreen } from './pages/ErrorScreen'
import { IndexPage } from './pages/IndexPage'
import { QuotePage } from './pages/QuotePage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/d/:slug" element={<QuotePage />} />
        <Route path="*" element={<ErrorScreen />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
