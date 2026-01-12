import { useEffect, useRef, useState, useCallback } from 'react'
import { AffineSchemas, PageEditorBlockSpecs } from '@blocksuite/blocks'
import { effects as registerBlocksEffects } from '@blocksuite/blocks/effects'
import { AffineEditorContainer } from '@blocksuite/presets'
import { effects as registerPresetsEffects } from '@blocksuite/presets/effects'
import { Schema, DocCollection, Doc, type BlockModel } from '@blocksuite/store'
import { IndexeddbPersistence } from 'y-indexeddb'
import '@toeverything/theme/style.css'

// Import Hydra custom blocks
import { BulletBlockSchema, BulletBlockSpec, PortalBlockSchema, PortalBlockSpec } from '@/blocks'
import { HYDRA_DB_PREFIX, type PersistenceStatus } from '@/hooks'
// FE-406: Focus mode navigation
import { useFocusMode } from '@/hooks/useFocusMode'
// FE-407: Breadcrumb navigation
import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb'
// FE-409: Ghost questions
import { GhostQuestions, type GhostQuestion } from './GhostQuestions'
// FE-408: Expand block hook
import { useExpandBlock, type ExpandBlockContext } from '@/hooks/useExpandBlock'
// EDITOR-3601: Descriptor generation context
import type { DescriptorGenerationContext } from '@/blocks/components/bullet-block'
// Auth store for token
import { useAuthStore, selectAccessToken } from '@/stores/auth-store'
// EDITOR-3203: Descriptor autocomplete
import { DescriptorAutocomplete } from './DescriptorAutocomplete'
import { useEditorStore } from '@/stores/editor-store'
import type { Descriptor } from '@/blocks/utils/descriptor-repository'
// EDITOR-3204: Descriptor insertion
import { findDuplicateDescriptor, removeTriggerText } from '@/blocks/utils/descriptor-insertion'
import { isValidDescriptorType, type DescriptorType } from '@/blocks/utils/descriptor'
import type { BulletBlockModel } from '@/blocks/schemas/bullet-block-schema'
// EDITOR-3405: Portal picker
import { PortalPicker } from './PortalPicker'
import { extractBulletsFromDoc, filterBullets, type BulletItem, type DocumentWithRoot } from '@/blocks/utils/portal-picker'
import { removePortalSlashCommand } from '@/blocks/utils/portal-slash-command'
// EDITOR-3602: Auto-generate after descriptor
import {
  shouldAutoGenerate,
  buildAutoGenerateContext,
  createDebouncedAutoGenerate,
  DEFAULT_AUTO_GENERATE_SETTINGS,
} from '@/blocks/utils/auto-generate'
// EDITOR-3409/3410: Portal search modal
import { PortalSearchModal } from './PortalSearchModal'
import { createPortalAsSibling, type DocWithBlocks } from '@/blocks/utils/portal-insertion'
import type { RecentItem } from '@/utils/frecency'
import type { FuzzySearchResult } from '@/utils/fuzzy-search'
// EDITOR-3502: Reorganization modal
import { ReorganizationModal, type PortalConnection } from './ReorganizationModal'
import { extractConcepts, semanticSearch } from '@/services/api-client.mock'
import type { ConceptMatch } from '@/stores/editor-store'
// EDITOR-3503: Toast notifications
import { toast } from 'sonner'

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

/**
 * Build breadcrumb items from root to the given block
 * FE-407: Traverses up the tree to build ancestor path
 */
function buildBreadcrumbPath(doc: Doc, blockId: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = []
  let currentBlock = doc.getBlockById(blockId)

  while (currentBlock) {
    // Only include hydra:bullet blocks in the breadcrumb
    if (currentBlock.flavour === 'hydra:bullet') {
      const text = (currentBlock as BlockModel & { text?: { toString(): string } }).text?.toString() || 'Untitled'
      items.unshift({ id: currentBlock.id, text })
    }
    currentBlock = currentBlock.parent
  }

  return items
}

export default function Editor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<AffineEditorContainer | null>(null)
  const collectionRef = useRef<DocCollection | null>(null)
  const persistenceRef = useRef<IndexeddbPersistence | null>(null)
  const docRef = useRef<Doc | null>(null)

  const [persistenceState, setPersistenceState] = useState<{
    status: PersistenceStatus
    error: Error | null
  }>({
    status: 'loading',
    error: null,
  })

  // FE-406: Focus mode state
  const { isInFocusMode, focusedBlockId, enterFocusMode, exitFocusMode } = useFocusMode()

  // FE-407: Breadcrumb items (computed when focusedBlockId changes)
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([])

  // FE-409: Ghost questions state
  const [ghostQuestions, setGhostQuestions] = useState<GhostQuestion[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [dismissedQuestions, setDismissedQuestions] = useState<Set<string>>(new Set())

  // Update breadcrumb when focus changes
  useEffect(() => {
    if (isInFocusMode && focusedBlockId && docRef.current) {
      const items = buildBreadcrumbPath(docRef.current, focusedBlockId)
      setBreadcrumbItems(items)

      // FE-409: Generate placeholder ghost questions when entering focus mode
      // In production, these would come from AI generation
      setIsLoadingQuestions(true)
      setDismissedQuestions(new Set())

      // Simulate AI question generation delay
      setTimeout(() => {
        setGhostQuestions([
          { id: 'q1', text: 'What are the key implications of this point?' },
          { id: 'q2', text: 'How does this relate to the broader context?' },
          { id: 'q3', text: 'What evidence supports this idea?' },
        ])
        setIsLoadingQuestions(false)
      }, 500)
    } else {
      setBreadcrumbItems([])
      setGhostQuestions([])
    }
  }, [isInFocusMode, focusedBlockId])

  // FE-407: Handle breadcrumb navigation
  const handleBreadcrumbNavigate = useCallback((id: string) => {
    enterFocusMode(id)
  }, [enterFocusMode])

  // FE-409: Handle ghost question click
  const handleQuestionClick = useCallback((question: GhostQuestion) => {
    // In production, this would trigger AI expansion
    console.log('[GhostQuestions] Question clicked:', question.text)
  }, [])

  // FE-409: Handle ghost question dismiss
  const handleQuestionDismiss = useCallback((questionId: string) => {
    setDismissedQuestions(prev => new Set([...prev, questionId]))
  }, [])

  // FE-408: Expand block hook
  const { expandBlock, canExpand, isExpanding } = useExpandBlock()
  const accessToken = useAuthStore(selectAccessToken)

  // EDITOR-3203: Descriptor autocomplete state
  const {
    autocompleteOpen,
    autocompleteQuery,
    autocompleteBlockId,
    autocompleteSelectedIndex,
    openAutocomplete,
    closeAutocomplete,
    setAutocompleteQuery,
    setAutocompleteSelectedIndex,
  } = useEditorStore()
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 })

  // EDITOR-3405: Portal picker state
  const {
    portalPickerOpen,
    portalPickerQuery,
    portalPickerBlockId,
    portalPickerSelectedIndex,
    openPortalPicker,
    closePortalPicker,
    setPortalPickerQuery,
    setPortalPickerSelectedIndex,
  } = useEditorStore()
  const [portalPickerPosition, setPortalPickerPosition] = useState({ top: 0, left: 0 })
  const [allBullets, setAllBullets] = useState<BulletItem[]>([])
  const filteredBullets = filterBullets(allBullets, portalPickerQuery)

  // EDITOR-3602: Auto-generate after descriptor state
  const {
    autoGenerateEnabled,
    autoGenerateStatus,
    startAutoGenerate,
    setAutoGenerateStatus,
    completeAutoGenerate,
    cancelAutoGenerate,
    resetAutoGenerate,
  } = useEditorStore()
  const autoGenerateRef = useRef<{ trigger: () => void; cancel: () => void } | null>(null)
  const wasExpandingRef = useRef(false)

  // EDITOR-3410: Portal search modal state
  const {
    portalSearchCurrentBulletId,
    openPortalSearchModal,
    closePortalSearchModal,
  } = useEditorStore()

  // EDITOR-3502: Reorganization modal state
  const {
    reorgModalOpen,
    reorgModalDocumentId,
    autoReorgThreshold,
    openReorgModal,
    closeReorgModal,
    setReorgModalStatus,
    setReorgModalConceptMatches,
    setReorgModalError,
  } = useEditorStore()

  // EDITOR-3602: Track expansion completion for auto-generate
  useEffect(() => {
    // Detect when isExpanding transitions from true to false
    if (wasExpandingRef.current && !isExpanding && autoGenerateStatus === 'generating') {
      console.log('[AutoGenerate] Generation completed')
      completeAutoGenerate()
      // Reset after a short delay
      setTimeout(() => resetAutoGenerate(), 1000)
    }
    wasExpandingRef.current = isExpanding
  }, [isExpanding, autoGenerateStatus, completeAutoGenerate, resetAutoGenerate])

  // FE-408: Handle expand event from bullet blocks
  const handleExpandEvent = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<ExpandBlockContext>
    const context = customEvent.detail

    if (!accessToken) {
      console.warn('[Expand] No access token available')
      return
    }

    if (!canExpand) {
      console.warn('[Expand] Cannot expand - rate limit reached or expansion in progress')
      return
    }

    console.log('[Expand] Expanding block:', context.blockId)
    expandBlock(context, accessToken)
  }, [accessToken, canExpand, expandBlock])

  // EDITOR-3601: Handle descriptor generation event (Tab trigger at deepest level)
  const handleDescriptorGenerateEvent = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<DescriptorGenerationContext>
    const context = customEvent.detail

    if (!accessToken) {
      console.warn('[DescriptorGenerate] No access token available')
      return
    }

    if (!canExpand) {
      console.warn('[DescriptorGenerate] Cannot generate - rate limit reached or generation in progress')
      return
    }

    console.log('[DescriptorGenerate] Generating for descriptor:', context.descriptorType, 'block:', context.blockId)

    // Build expand context from descriptor context
    // Use the descriptor type to build a more specific prompt
    const expandContext: ExpandBlockContext = {
      blockId: context.blockId,
      blockText: context.blockText,
      siblingTexts: context.siblingTexts,
      parentText: context.parentText,
    }

    // Log additional context for debugging
    console.log('[DescriptorGenerate] Context:', {
      descriptorType: context.descriptorType,
      descriptorLabel: context.descriptorLabel,
      grandparentText: context.grandparentText,
    })

    expandBlock(expandContext, accessToken)
  }, [accessToken, canExpand, expandBlock])

  // EDITOR-3203: Handle descriptor autocomplete open event
  const handleAutocompleteOpenEvent = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<{ blockId: string; position: { top: number; left: number } }>
    const { blockId, position } = customEvent.detail

    setAutocompletePosition(position)
    openAutocomplete(blockId)
  }, [openAutocomplete])

  // EDITOR-3203/3204: Handle descriptor selection and insertion
  const handleDescriptorSelect = useCallback((descriptor: Descriptor) => {
    console.log('[Autocomplete] Descriptor selected:', descriptor.key)

    const doc = docRef.current
    if (!doc || !autocompleteBlockId) {
      console.warn('[Autocomplete] No doc or blockId available')
      closeAutocomplete()
      return
    }

    // Validate descriptor type
    if (!isValidDescriptorType(descriptor.key)) {
      console.warn('[Autocomplete] Invalid descriptor type:', descriptor.key)
      closeAutocomplete()
      return
    }
    const descriptorType = descriptor.key as DescriptorType

    // Get the parent block where ~ was typed
    const parentBlock = doc.getBlockById(autocompleteBlockId) as BulletBlockModel | null
    if (!parentBlock) {
      console.warn('[Autocomplete] Parent block not found:', autocompleteBlockId)
      closeAutocomplete()
      return
    }

    // EDITOR-3204: Check for duplicate descriptor among children
    const existingDescriptorId = findDuplicateDescriptor(parentBlock, descriptorType)

    if (existingDescriptorId) {
      console.log('[Autocomplete] Focusing existing descriptor:', existingDescriptorId)
      // Remove trigger text from parent
      const currentText = parentBlock.text.toString()
      const newText = removeTriggerText(currentText, descriptorType)
      if (newText !== currentText) {
        parentBlock.text.delete(0, parentBlock.text.length)
        if (newText) {
          parentBlock.text.insert(newText, 0)
        }
      }
      // Focus the existing descriptor
      // Note: Direct focus via DOM since we're in React, BlockSuite will handle selection
      setTimeout(() => {
        const blockElement = document.querySelector(`hydra-bullet-block[data-block-id="${existingDescriptorId}"]`)
        const richText = blockElement?.querySelector('rich-text .inline-editor') as HTMLElement | null
        richText?.focus()
      }, 0)
      closeAutocomplete()
      return
    }

    // EDITOR-3204: Create new descriptor child bullet
    console.log('[Autocomplete] Creating new descriptor:', descriptorType)

    // Remove trigger text from parent
    const currentText = parentBlock.text.toString()
    const newText = removeTriggerText(currentText, descriptorType)
    if (newText !== currentText) {
      parentBlock.text.delete(0, parentBlock.text.length)
      if (newText) {
        parentBlock.text.insert(newText, 0)
      }
    }

    // Expand parent if collapsed
    if (!parentBlock.isExpanded) {
      doc.updateBlock(parentBlock, { isExpanded: true })
    }

    // Create new descriptor child bullet
    const newBlockId = doc.addBlock(
      'hydra:bullet',
      {
        text: new doc.Text(),
        isDescriptor: true,
        descriptorType: descriptorType,
        isExpanded: true,
      },
      parentBlock,
      0 // Insert as first child
    )

    console.log('[Autocomplete] Created descriptor block:', newBlockId)

    // Focus the new descriptor
    setTimeout(() => {
      const blockElement = document.querySelector(`hydra-bullet-block[data-block-id="${newBlockId}"]`)
      const richText = blockElement?.querySelector('rich-text .inline-editor') as HTMLElement | null
      richText?.focus()
    }, 0)

    // EDITOR-3602: Trigger auto-generate after descriptor insertion
    const shouldTrigger = shouldAutoGenerate({
      autoGenerateEnabled,
      isGenerating: autoGenerateStatus === 'pending' || autoGenerateStatus === 'generating',
      descriptorType,
    })

    if (shouldTrigger && accessToken && canExpand) {
      console.log('[AutoGenerate] Starting auto-generation for descriptor:', descriptorType)

      // Get parent text for context
      const parentText = parentBlock.text?.toString() || ''

      // Get grandparent text for additional context
      const grandparent = parentBlock.parent
      const grandparentText = grandparent?.flavour === 'hydra:bullet'
        ? (grandparent as BulletBlockModel).text?.toString() || null
        : null

      // Build auto-generate context
      const autoGenContext = buildAutoGenerateContext({
        descriptorBlockId: newBlockId,
        descriptorType,
        parentText,
        grandparentText,
      })

      // Start auto-generation with debounce
      startAutoGenerate(newBlockId)

      // Cancel any existing debounced call
      if (autoGenerateRef.current) {
        autoGenerateRef.current.cancel()
      }

      // Create new debounced call
      autoGenerateRef.current = createDebouncedAutoGenerate(
        () => {
          console.log('[AutoGenerate] Debounce complete, triggering generation')
          setAutoGenerateStatus('generating')

          // Build expand context for the descriptor
          const expandContext: ExpandBlockContext = {
            blockId: autoGenContext.descriptorBlockId,
            blockText: '', // Empty for new descriptor
            siblingTexts: [],
            parentText: autoGenContext.parentText,
          }

          // expandBlock is async via WebSocket - completion is tracked by isExpanding state
          expandBlock(expandContext, accessToken)

          // Completion will be detected via the isExpanding state change
          // The useEffect below will handle cleanup when isExpanding becomes false
        },
        DEFAULT_AUTO_GENERATE_SETTINGS.debounceMs
      )

      autoGenerateRef.current.trigger()
    }

    closeAutocomplete()
  }, [
    autocompleteBlockId,
    closeAutocomplete,
    autoGenerateEnabled,
    autoGenerateStatus,
    accessToken,
    canExpand,
    startAutoGenerate,
    setAutoGenerateStatus,
    expandBlock,
    completeAutoGenerate,
    cancelAutoGenerate,
    resetAutoGenerate,
  ])

  // EDITOR-3405: Handle portal picker open event
  const handlePortalPickerOpenEvent = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<{ blockId: string; position: { top: number; left: number } }>
    const { blockId, position } = customEvent.detail

    const doc = docRef.current
    if (!doc || !doc.root) {
      console.warn('[PortalPicker] No doc or doc.root available')
      return
    }

    // Extract all bullets from document
    const bullets = extractBulletsFromDoc(doc as DocumentWithRoot)
    setAllBullets(bullets)

    setPortalPickerPosition(position)
    openPortalPicker(blockId)
  }, [openPortalPicker])

  // EDITOR-3405: Handle portal selection and creation
  const handlePortalSelect = useCallback((bullet: BulletItem) => {
    console.log('[PortalPicker] Bullet selected:', bullet.id)

    const doc = docRef.current
    if (!doc || !portalPickerBlockId) {
      console.warn('[PortalPicker] No doc or blockId available')
      closePortalPicker()
      return
    }

    // Get the parent block where portal should be inserted
    const parentBlock = doc.getBlockById(portalPickerBlockId) as BulletBlockModel | null
    if (!parentBlock) {
      console.warn('[PortalPicker] Parent block not found:', portalPickerBlockId)
      closePortalPicker()
      return
    }

    // Remove /portal command from parent text if present
    const currentText = parentBlock.text.toString()
    const newText = removePortalSlashCommand(currentText)
    if (newText !== currentText) {
      parentBlock.text.delete(0, parentBlock.text.length)
      if (newText.trim()) {
        parentBlock.text.insert(newText.trim(), 0)
      }
    }

    // Create portal block as child of current block
    const newBlockId = doc.addBlock(
      'hydra:portal',
      {
        sourceDocId: doc.id,
        sourceBlockId: bullet.id,
        isCollapsed: false,
        syncStatus: 'synced',
      },
      parentBlock,
      0 // Insert as first child
    )

    console.log('[PortalPicker] Created portal block:', newBlockId)

    // Focus the parent block after portal creation
    setTimeout(() => {
      const blockElement = document.querySelector(`hydra-bullet-block[data-block-id="${portalPickerBlockId}"]`)
      const richText = blockElement?.querySelector('rich-text .inline-editor') as HTMLElement | null
      richText?.focus()
    }, 0)

    closePortalPicker()
  }, [portalPickerBlockId, closePortalPicker])

  // EDITOR-3410: Handle portal search modal selection
  const handlePortalSearchSelect = useCallback((item: RecentItem | FuzzySearchResult) => {
    console.log('[PortalSearchModal] Item selected:', item)

    const doc = docRef.current
    if (!doc || !portalSearchCurrentBulletId) {
      console.warn('[PortalSearchModal] No doc or currentBulletId available')
      closePortalSearchModal()
      return
    }

    try {
      // Create portal as sibling below current bullet
      const portalId = createPortalAsSibling(
        doc as unknown as DocWithBlocks,
        portalSearchCurrentBulletId,
        item.documentId,
        item.blockId
      )

      console.log(`[PortalSearchModal] Created portal ${portalId} as sibling below ${portalSearchCurrentBulletId}`)

      // Focus the new portal or the original bullet
      setTimeout(() => {
        const blockElement = document.querySelector(`hydra-bullet-block[data-block-id="${portalSearchCurrentBulletId}"]`)
        const richText = blockElement?.querySelector('rich-text .inline-editor') as HTMLElement | null
        richText?.focus()
      }, 0)
    } catch (error) {
      console.error('[PortalSearchModal] Failed to create portal:', error)
    }
  }, [portalSearchCurrentBulletId, closePortalSearchModal])

  // EDITOR-3502: Run concept extraction and semantic search for reorganization modal
  const runReorgAnalysis = useCallback(async () => {
    const doc = docRef.current
    if (!doc || !reorgModalDocumentId) return

    try {
      // Extract document text from all bullet blocks
      const bullets: string[] = []
      const extractText = (block: BlockModel) => {
        if (block.flavour === 'hydra:bullet') {
          const text = (block as BulletBlockModel).text?.toString() || ''
          if (text.trim()) bullets.push(text)
        }
        block.children.forEach(extractText)
      }
      if (doc.root) {
        doc.root.children.forEach(extractText)
      }
      const documentText = bullets.join('\n')

      if (!documentText.trim()) {
        setReorgModalStatus('loaded')
        setReorgModalConceptMatches([])
        return
      }

      // Step 1: Extract concepts
      setReorgModalStatus('extracting')
      const concepts = await extractConcepts(documentText)

      if (concepts.length === 0) {
        setReorgModalStatus('loaded')
        setReorgModalConceptMatches([])
        return
      }

      // Step 2: Semantic search for each concept
      setReorgModalStatus('searching')
      const conceptMatches: ConceptMatch[] = []

      for (const concept of concepts) {
        const results = await semanticSearch({
          query: concept.name,
          limit: 5,
          threshold: autoReorgThreshold,
          excludeDocIds: [reorgModalDocumentId],
        })

        // Pre-select top match above threshold
        const selectedMatches = new Set<string>()
        if (results.length > 0 && results[0].score >= autoReorgThreshold) {
          selectedMatches.add(results[0].blockId)
        }

        conceptMatches.push({
          concept: concept.name,
          category: concept.category,
          matches: results,
          selectedMatches,
        })
      }

      setReorgModalConceptMatches(conceptMatches)
      setReorgModalStatus('loaded')
    } catch (error) {
      console.error('[ReorgModal] Analysis failed:', error)
      setReorgModalError(error instanceof Error ? error.message : 'Analysis failed')
      setReorgModalStatus('error')
    }
  }, [
    reorgModalDocumentId,
    autoReorgThreshold,
    setReorgModalStatus,
    setReorgModalConceptMatches,
    setReorgModalError,
  ])

  // EDITOR-3502: Trigger analysis when modal opens
  useEffect(() => {
    if (reorgModalOpen && reorgModalDocumentId) {
      runReorgAnalysis()
    }
  }, [reorgModalOpen, reorgModalDocumentId, runReorgAnalysis])

  // EDITOR-3502/3503: Handle connections from reorganization modal
  const handleReorgConnect = useCallback((connections: PortalConnection[]) => {
    console.log('[ReorgModal] Creating connections:', connections)

    const doc = docRef.current
    if (!doc) {
      console.warn('[ReorgModal] No doc available')
      return
    }

    // Find the last bullet in the document to add portals after
    let lastBulletId: string | null = null
    const findLastBullet = (block: BlockModel) => {
      if (block.flavour === 'hydra:bullet') {
        lastBulletId = block.id
      }
      // Continue searching in children (depth-first, so last visible bullet)
      for (let i = block.children.length - 1; i >= 0; i--) {
        findLastBullet(block.children[i])
        if (lastBulletId && block.children[i].flavour === 'hydra:bullet') {
          // Found in children, use that
          return
        }
      }
    }
    if (doc.root) {
      doc.root.children.forEach(findLastBullet)
    }

    if (!lastBulletId) {
      console.warn('[ReorgModal] No bullet found to add portals after')
      return
    }

    // EDITOR-3503: Create portals for each connection and track count
    let createdCount = 0
    for (const connection of connections) {
      try {
        const portalId = createPortalAsSibling(
          doc as unknown as DocWithBlocks,
          lastBulletId,
          connection.sourceDocId,
          connection.sourceBlockId
        )
        console.log(`[ReorgModal] Created portal ${portalId} for ${connection.contextPath}`)
        lastBulletId = portalId // Chain portals after each other
        createdCount++
      } catch (error) {
        console.error('[ReorgModal] Failed to create portal:', error)
      }
    }

    // EDITOR-3503: Show success toast with count
    if (createdCount > 0) {
      toast.success(`Created ${createdCount} connection${createdCount === 1 ? '' : 's'}`)
    }
  }, [])

  // EDITOR-3502: Handle reorganization modal close
  const handleReorgClose = useCallback(() => {
    console.log('[ReorgModal] Modal closed')
    closeReorgModal()
  }, [closeReorgModal])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Prevent double initialization in StrictMode
    if (editorRef.current) return

    // Create schema with Affine block schemas and Hydra custom blocks
    const schema = new Schema()
      .register(AffineSchemas)
      .register([BulletBlockSchema, PortalBlockSchema])

    // Extend affine:note to accept hydra:bullet and hydra:portal as children
    // This is required because BlockSuite validates schemas bidirectionally
    const noteSchema = schema.flavourSchemaMap?.get('affine:note')
    if (noteSchema?.model?.children && Array.isArray(noteSchema.model.children)) {
      noteSchema.model.children.push('hydra:bullet', 'hydra:portal')
    }

    // Extend hydra:bullet to accept hydra:portal as children
    const bulletSchema = schema.flavourSchemaMap?.get('hydra:bullet')
    if (bulletSchema?.model?.children && Array.isArray(bulletSchema.model.children)) {
      bulletSchema.model.children.push('hydra:portal')
    }

    // Create document collection
    const collection = new DocCollection({ schema })
    collection.meta.initialize()
    collectionRef.current = collection

    // Create a new document
    const doc = collection.createDoc()
    docRef.current = doc

    // Set up IndexedDB persistence BEFORE loading
    // This allows y-indexeddb to hydrate the doc from stored state
    try {
      const dbName = `${HYDRA_DB_PREFIX}${DEFAULT_DOC_ID}`
      const persistence = new IndexeddbPersistence(dbName, doc.spaceDoc)
      persistenceRef.current = persistence

      // Load the document first (required to connect Yjs)
      doc.load()

      // Wait for sync completion before checking if empty
      // This ensures we don't overwrite restored data
      persistence.on('synced', () => {
        // Only add initial blocks if the doc is truly empty (new document)
        // Check after sync to ensure IndexedDB data is loaded
        if (doc.isEmpty) {
          const pageId = doc.addBlock('affine:page', {})
          const noteId = doc.addBlock('affine:note', {}, pageId)
          doc.addBlock('hydra:bullet', {}, noteId)
        }
        setPersistenceState({ status: 'synced', error: null })
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPersistenceState({ status: 'error', error: err })
      console.error('Failed to initialize IndexedDB persistence:', err)

      // Still load the doc even if persistence fails
      doc.load()
      if (doc.isEmpty) {
        const pageId = doc.addBlock('affine:page', {})
        const noteId = doc.addBlock('affine:note', {}, pageId)
        doc.addBlock('hydra:bullet', {}, noteId)
      }
    }

    // Create and configure the editor using document.createElement
    // This ensures the custom element is properly registered
    const editor = document.createElement('affine-editor-container') as AffineEditorContainer
    editor.doc = doc
    // Extend page specs with Hydra custom blocks
    editor.pageSpecs = [...PageEditorBlockSpecs, ...BulletBlockSpec, ...PortalBlockSpec]
    editorRef.current = editor

    // Mount the editor to the container
    container.appendChild(editor)

    // FE-406: Add double-click handler for focus mode
    const handleDoubleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Find the closest hydra-bullet-block element
      const bulletBlock = target.closest('hydra-bullet-block')
      if (bulletBlock) {
        const blockId = bulletBlock.getAttribute('data-block-id')
        if (blockId) {
          enterFocusMode(blockId)
        }
      }
    }
    container.addEventListener('dblclick', handleDoubleClick)

    // FE-408: Add expand event listener
    container.addEventListener('hydra-expand-block', handleExpandEvent as EventListener)

    // EDITOR-3601: Add descriptor generation event listener
    container.addEventListener('hydra-descriptor-generate', handleDescriptorGenerateEvent as EventListener)

    // EDITOR-3203: Add autocomplete open event listener
    container.addEventListener('hydra-descriptor-autocomplete-open', handleAutocompleteOpenEvent as EventListener)

    // EDITOR-3405: Add portal picker open event listener
    container.addEventListener('hydra-portal-picker-open', handlePortalPickerOpenEvent as EventListener)

    // EDITOR-3602: Cancel auto-generation when user starts typing
    // EDITOR-3410: Cmd+S portal search modal
    // EDITOR-3502: Cmd+Shift+L reorganization modal
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey

      // EDITOR-3502: Cmd+Shift+L / Ctrl+Shift+L - Open reorganization modal
      if (isCmdOrCtrl && event.shiftKey && event.key.toLowerCase() === 'l') {
        event.preventDefault()

        const doc = docRef.current
        if (doc) {
          console.log('[ReorgModal] Opening reorganization modal for document:', doc.id)
          openReorgModal(doc.id)
        }
        return
      }

      // EDITOR-3410: Cmd+S / Ctrl+S - Open portal search modal
      if (isCmdOrCtrl && event.key === 's') {
        event.preventDefault() // Prevent browser save dialog

        // Find currently focused bullet from DOM
        const activeElement = document.activeElement
        const bulletBlock = activeElement?.closest('hydra-bullet-block')
        const currentBulletId = bulletBlock?.getAttribute('data-block-id')

        if (currentBulletId) {
          console.log('[PortalSearchModal] Opening modal for bullet:', currentBulletId)
          openPortalSearchModal(currentBulletId)
        }
        return
      }

      // Only cancel on printable characters (not modifiers, arrows, etc.)
      if (
        autoGenerateStatus === 'pending' &&
        event.key.length === 1 &&
        !event.metaKey &&
        !event.ctrlKey
      ) {
        console.log('[AutoGenerate] Cancelling due to user typing')
        if (autoGenerateRef.current) {
          autoGenerateRef.current.cancel()
        }
        cancelAutoGenerate()
        resetAutoGenerate()
      }
    }
    container.addEventListener('keydown', handleKeyDown)

    // Cleanup function
    return () => {
      container.removeEventListener('dblclick', handleDoubleClick)
      container.removeEventListener('hydra-expand-block', handleExpandEvent as EventListener)
      container.removeEventListener('hydra-descriptor-generate', handleDescriptorGenerateEvent as EventListener)
      container.removeEventListener('hydra-descriptor-autocomplete-open', handleAutocompleteOpenEvent as EventListener)
      container.removeEventListener('hydra-portal-picker-open', handlePortalPickerOpenEvent as EventListener)
      container.removeEventListener('keydown', handleKeyDown)
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
      docRef.current = null
    }
  }, [enterFocusMode, handleExpandEvent, handleDescriptorGenerateEvent, handleAutocompleteOpenEvent, handlePortalPickerOpenEvent, autoGenerateStatus, cancelAutoGenerate, resetAutoGenerate, openPortalSearchModal, openReorgModal])

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

  // FE-409: Filter out dismissed questions
  const visibleQuestions = ghostQuestions.filter(q => !dismissedQuestions.has(q.id))

  return (
    <div
      data-testid="editor-wrapper"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '500px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* FE-407: Show breadcrumb in focus mode */}
      {isInFocusMode && breadcrumbItems.length > 0 && (
        <Breadcrumb
          items={breadcrumbItems}
          onNavigate={handleBreadcrumbNavigate}
          onExitFocusMode={exitFocusMode}
        />
      )}

      {/* EDITOR-3602: Auto-generate indicator */}
      {(autoGenerateStatus === 'pending' || autoGenerateStatus === 'generating') && (
        <div
          data-testid="auto-generate-indicator"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#f0f9ff',
            borderBottom: '1px solid #bae6fd',
            fontSize: '13px',
            color: '#0369a1',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              border: '2px solid #0ea5e9',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <span>
            {autoGenerateStatus === 'pending'
              ? 'Preparing to generate content...'
              : 'Generating content...'}
          </span>
          <button
            onClick={() => {
              if (autoGenerateRef.current) {
                autoGenerateRef.current.cancel()
              }
              cancelAutoGenerate()
              resetAutoGenerate()
            }}
            style={{
              marginLeft: 'auto',
              padding: '4px 8px',
              backgroundColor: 'transparent',
              border: '1px solid #0ea5e9',
              borderRadius: '4px',
              color: '#0369a1',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Editor container */}
      <div
        ref={containerRef}
        data-testid="editor-container"
        data-persistence-status={persistenceState.status}
        data-focus-mode={isInFocusMode ? 'true' : 'false'}
        data-focused-block-id={focusedBlockId || undefined}
        data-auto-generate-status={autoGenerateStatus}
        style={{
          flex: 1,
          width: '100%',
          minHeight: '400px',
        }}
      />

      {/* FE-409: Show ghost questions in focus mode */}
      {isInFocusMode && (visibleQuestions.length > 0 || isLoadingQuestions) && (
        <GhostQuestions
          questions={visibleQuestions}
          isLoading={isLoadingQuestions}
          onQuestionClick={handleQuestionClick}
          onDismiss={handleQuestionDismiss}
        />
      )}

      {/* EDITOR-3203: Descriptor autocomplete dropdown */}
      <DescriptorAutocomplete
        isOpen={autocompleteOpen}
        query={autocompleteQuery}
        selectedIndex={autocompleteSelectedIndex}
        position={autocompletePosition}
        onSelect={handleDescriptorSelect}
        onClose={closeAutocomplete}
        onQueryChange={setAutocompleteQuery}
        onSelectedIndexChange={setAutocompleteSelectedIndex}
      />

      {/* EDITOR-3405: Portal picker dropdown */}
      <PortalPicker
        isOpen={portalPickerOpen}
        bullets={filteredBullets}
        selectedIndex={portalPickerSelectedIndex}
        position={portalPickerPosition}
        onSelect={handlePortalSelect}
        onClose={closePortalPicker}
        onQueryChange={setPortalPickerQuery}
        onSelectedIndexChange={setPortalPickerSelectedIndex}
      />

      {/* EDITOR-3410: Portal search modal (Cmd+S) */}
      <PortalSearchModal onSelect={handlePortalSearchSelect} />

      {/* EDITOR-3502: Reorganization modal (Cmd+Shift+L) */}
      <ReorganizationModal onConnect={handleReorgConnect} onClose={handleReorgClose} />
    </div>
  )
}
