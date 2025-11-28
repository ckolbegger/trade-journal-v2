import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ServiceProvider } from '@/contexts/ServiceContext'
import { Layout } from '@/components/Layout'
import { Home } from '@/pages/Home'
import { PositionCreate } from '@/pages/PositionCreate'
import { PositionDetail } from '@/pages/PositionDetail'
import { ComingSoon } from '@/pages/ComingSoon'

function App() {
  return (
    <ServiceProvider>
      <Router>
        <Routes>
          {/* Position Create and Position Detail have their own layout (header + bottom actions) */}
          <Route path="/position/create" element={<PositionCreate />} />
          <Route path="/position/:id" element={<PositionDetail />} />

          {/* Other routes use the main Layout with bottom navigation */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/dashboard" element={<Layout><Home /></Layout>} />
          <Route path="/journal" element={<Layout><ComingSoon page="Journal" /></Layout>} />
          <Route path="/settings" element={<Layout><ComingSoon page="Settings" /></Layout>} />
        </Routes>
      </Router>
    </ServiceProvider>
  )
}

export default App
