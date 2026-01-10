import { useEffect, useRef } from 'react'
import { AffineSchemas, PageEditorBlockSpecs } from '@blocksuite/blocks'
import { effects as registerBlocksEffects } from '@blocksuite/blocks/effects'
import { AffineEditorContainer } from '@blocksuite/presets'
import { effects as registerPresetsEffects } from '@blocksuite/presets/effects'
import { Schema, DocCollection } from '@blocksuite/store'
import '@toeverything/theme/style.css'

// Import Hydra custom blocks
import { BulletBlockSchema, BulletBlockSpec } from '@/blocks'

// Register all BlockSuite custom elements
// Must call blocks effects first (registers core components)
// Then presets effects (registers editor container and presets)
registerBlocksEffects()
registerPresetsEffects()

export default function Editor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<AffineEditorContainer | null>(null)
  const collectionRef = useRef<DocCollection | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Prevent double initialization in StrictMode
    if (editorRef.current) return

    // Create schema with Affine block schemas and Hydra custom blocks
    const schema = new Schema()
      .register(AffineSchemas)
      .register([BulletBlockSchema])

    // Create document collection
    const collection = new DocCollection({ schema })
    collection.meta.initialize()
    collectionRef.current = collection

    // Create a new document
    const doc = collection.createDoc()
    doc.load(() => {
      // Initialize with a page block as root
      const pageId = doc.addBlock('affine:page', {})
      // Add a note block as container for content
      const noteId = doc.addBlock('affine:note', {}, pageId)
      // Add an initial paragraph block
      doc.addBlock('affine:paragraph', {}, noteId)
    })

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
      if (editorRef.current && container) {
        container.removeChild(editorRef.current)
        editorRef.current = null
      }
      collectionRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      data-testid="editor-container"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '500px',
      }}
    />
  )
}
