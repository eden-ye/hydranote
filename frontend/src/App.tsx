import Editor from './components/Editor'
import { AuthProvider, Header, SpotlightModal } from './components'
import { LeftPanel } from './components/LeftPanel'
import { useSpotlight } from './hooks/useSpotlight'
import { useAIStore, selectCanGenerate, selectGenerationsRemaining } from './stores/ai-store'
// BUG-EDITOR-3508: Import focus mode state for CSS targeting
import { useEditorStore } from './stores/editor-store'
import { Toaster } from 'sonner'
import './App.css'

function AppContent() {
  const spotlight = useSpotlight()

  // BUG-EDITOR-3508: Get focus mode state for CSS targeting on main element
  const focusedBlockId = useEditorStore((state) => state.focusedBlockId)
  const isInFocusMode = focusedBlockId !== null

  // AI Store integration (FE-405)
  const canGenerate = useAIStore(selectCanGenerate)
  const generationsRemaining = useAIStore(selectGenerationsRemaining)
  const setCurrentPrompt = useAIStore((state) => state.setCurrentPrompt)
  const setIsGenerating = useAIStore((state) => state.setIsGenerating)

  const handleSpotlightSubmit = (query: string) => {
    if (!canGenerate) return

    // Update AI store with the prompt and generation state
    setCurrentPrompt(query)
    setIsGenerating(true)
    spotlight.close()
  }

  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <LeftPanel />
        <main className="app-main" data-focus-mode={isInFocusMode ? 'true' : 'false'}>
          <Editor />
        </main>
      </div>
      <SpotlightModal
        isOpen={spotlight.isOpen}
        onClose={spotlight.close}
        onSubmit={handleSpotlightSubmit}
        isLoading={spotlight.isLoading}
        generationsRemaining={generationsRemaining}
        canGenerate={canGenerate}
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="bottom-right" richColors />
    </AuthProvider>
  )
}

export default App
