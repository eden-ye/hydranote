import Editor from './components/Editor'
import { AuthProvider, Header, SpotlightModal } from './components'
import { useSpotlight } from './hooks/useSpotlight'
import './App.css'

function AppContent() {
  const spotlight = useSpotlight()

  const handleSpotlightSubmit = (query: string) => {
    // TODO: Integrate with AI generation store (FE-405)
    console.log('AI generation requested:', query)
    spotlight.close()
  }

  return (
    <div className="app">
      <Header />
      <main className="app-main">
        <Editor />
      </main>
      <SpotlightModal
        isOpen={spotlight.isOpen}
        onClose={spotlight.close}
        onSubmit={handleSpotlightSubmit}
        isLoading={spotlight.isLoading}
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
