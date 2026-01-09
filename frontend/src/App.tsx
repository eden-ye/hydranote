import Editor from './components/Editor'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Hydra Notes</h1>
      </header>
      <main className="app-main">
        <Editor />
      </main>
    </div>
  )
}

export default App
