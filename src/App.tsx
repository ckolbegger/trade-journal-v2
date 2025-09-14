import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { EmptyState } from '@/pages/EmptyState'
import { ComingSoon } from '@/pages/ComingSoon'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<EmptyState />} />
          <Route path="/journal" element={<ComingSoon page="Journal" />} />
          <Route path="/settings" element={<ComingSoon page="Settings" />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
