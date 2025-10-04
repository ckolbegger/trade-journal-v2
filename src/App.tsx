import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Home } from '@/pages/Home'
import { PositionCreate } from '@/pages/PositionCreate'
import { PositionDetail } from '@/pages/PositionDetail'
import TradeExecution from '@/pages/TradeExecution'
import { ComingSoon } from '@/pages/ComingSoon'

function App() {
  return (
    <Router>
      <Routes>
        {/* Position Create and Position Detail have their own layout (header + bottom actions) */}
        <Route path="/position/create" element={<PositionCreate />} />
        <Route path="/position/:id" element={<PositionDetail />} />
        <Route path="/trade-execution/:positionId" element={<TradeExecution />} />

        {/* Other routes use the main Layout with bottom navigation */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/dashboard" element={<Layout><Home /></Layout>} />
        <Route path="/journal" element={<Layout><ComingSoon page="Journal" /></Layout>} />
        <Route path="/settings" element={<Layout><ComingSoon page="Settings" /></Layout>} />
      </Routes>
    </Router>
  )
}

export default App
