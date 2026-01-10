import { useEffect, useRef, useState } from 'react'
import { AffineSchemas, PageEditorBlockSpecs } from '@blocksuite/blocks'
import { effects as registerBlocksEffects } from '@blocksuite/blocks/effects'
import { AffineEditorContainer } from '@blocksuite/presets'
import { effects as registerPresetsEffects } from '@blocksuite/presets/effects'
import { Schema, DocCollection } from '@blocksuite/store'
import { IndexeddbPersistence } from 'y-indexeddb'
import '@toeverything/theme/style.css'

// Import Hydra custom blocks
import { BulletBlockSchema, BulletBlockSpec } from '@/blocks'
import { HYDRA_DB_PREFIX, type PersistenceStatus } from '@/hooks'

// Register all BlockSuite custom elements
// Must call blocks effects first (registers core components)
// Then presets effects (registers editor container and presets)
registerBlocksEffects()
registerPresetsEffects()

/**
 * Default document ID for the main editor
 */
const DEFAULT_DOC_ID = 'main'

/**
 * Loading indicator component shown while hydrating from IndexedDB
 */
function LoadingIndicator() {
  return (
    <div
      data-testid="editor-loading"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '200px',
        color: '#666',
        fontSize: '14px',
      }}
    >
      <span>Loading document...</span>
    </div>
  )
}

/**
 * Error indicator component shown when persistence fails
 */
function ErrorIndicator({ error }: { error: Error }) {
  return (
    <div
      data-testid="editor-error"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '200px',
        color: '#dc3545',
        fontSize: '14px',
        gap: '8px',
      }}
    >
      <span>Failed to load document</span>
      <span style={{ fontSize: '12px', color: '#666' }}>{error.message}</span>
    </div>
  )
}

export default function Editor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<AffineEditorContainer | null>(null)
  const collectionRef = useRef<DocCollection | null>(null)
  const persistenceRef = useRef<IndexeddbPersistence | null>(null)

  const [persistenceState, setPersistenceState] = useState<{
    status: PersistenceStatus
    error: Error | null
  }>({
    status: 'loading',
    error: null,
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Prevent double initialization in StrictMode
    if (editorRef.current) return

    // Create schema with Affine block schemas and Hydra custom blocks
    const schema = new Schema()
      .register(AffineSchemas)
      .register([BulletBlockSchema])

    // Extend affine:note to accept hydra:bullet as children
    // This is required because BlockSuite validates schemas bidirectionally
    const noteSchema = schema.flavourSchemaMap?.get('affine:note')
    if (noteSchema?.model?.children && Array.isArray(noteSchema.model.children)) {
      noteSchema.model.children.push('hydra:bullet')
    }

    // Create document collection
    const collection = new DocCollection({ schema })
    collection.meta.initialize()
    collectionRef.current = collection

    // Create a new document
    const doc = collection.createDoc()

    // Set up IndexedDB persistence BEFORE loading
    // This allows y-indexeddb to hydrate the doc from stored state
    try {
      const dbName = `${HYDRA_DB_PREFIX}${DEFAULT_DOC_ID}`
      const persistence = new IndexeddbPersistence(dbName, doc.spaceDoc)
      persistenceRef.current = persistence

      // Listen for sync completion
      persistence.on('synced', () => {
        setPersistenceState({ status: 'synced', error: null })
      })

      // Load the document after persistence is set up
      // This initializes the doc structure if it's new
      doc.load(() => {
        // Only add initial blocks if the doc is empty (new document)
        if (doc.isEmpty) {
          const pageId = doc.addBlock('affine:page', {})
          const noteId = doc.addBlock('affine:note', {}, pageId)
          doc.addBlock('affine:paragraph', {}, noteId)
        }
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setPersistenceState({ status: 'error', error: err })
      console.error('Failed to initialize IndexedDB persistence:', err)

      // Still load the doc even if persistence fails
      doc.load(() => {
        if (doc.isEmpty) {
          const pageId = doc.addBlock('affine:page', {})
          const noteId = doc.addBlock('affine:note', {}, pageId)
          doc.addBlock('affine:paragraph', {}, noteId)
        }
      })
    }

    // Create and configure the editor using document.createElement
    // This ensures the custom element is properly registered
    const editor = document.createElement('affine-editor-container') as AffineEditorContainer
    editor.doc = doc
    // Extend page specs with Hydra custom blocks
    editor.pageSpecs = [...PageEditorBlockSpecs, ...BulletBlockSpec]
    editorRef.current = editor

    // Mount the editor to the container
    container.appendChild(editor)

    // Cleanup function
    return () => {
      // Destroy persistence first
      if (persistenceRef.current) {
        persistenceRef.current.destroy()
        persistenceRef.current = null
      }

      if (editorRef.current && container) {
        container.removeChild(editorRef.current)
        editorRef.current = null
      }
      collectionRef.current = null
    }
  }, [])

  // Show loading state while hydrating
  if (persistenceState.status === 'loading') {
    return (
      <div
        ref={containerRef}
        data-testid="editor-container"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '500px',
        }}
      >
        <LoadingIndicator />
      </div>
    )
  }

  // Show error state if persistence failed
  if (persistenceState.status === 'error' && persistenceState.error) {
    return (
      <div
        ref={containerRef}
        data-testid="editor-container"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '500px',
        }}
      >
        <ErrorIndicator error={persistenceState.error} />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      data-testid="editor-container"
      data-persistence-status={persistenceState.status}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '500px',
      }}
    />
  )
}
