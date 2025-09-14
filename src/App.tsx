import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { EmptyState } from '@/pages/EmptyState'
import { PositionCreate } from '@/pages/PositionCreate'
import { ComingSoon } from '@/pages/ComingSoon'

function App() {
  return (
    <Router>
      <Routes>
        {/* Position Create has its own layout (header + bottom actions) */}
        <Route path="/position/create" element={<PositionCreate />} />

        {/* Other routes use the main Layout with bottom navigation */}
        <Route path="/" element={<Layout><EmptyState /></Layout>} />
        <Route path="/dashboard" element={<Layout><ComingSoon page="Position Dashboard" /></Layout>} />
        <Route path="/journal" element={<Layout><ComingSoon page="Journal" /></Layout>} />
        <Route path="/settings" element={<Layout><ComingSoon page="Settings" /></Layout>} />
      </Routes>
    </Router>
  )
}

export default App
