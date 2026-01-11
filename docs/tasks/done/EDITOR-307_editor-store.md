# EDITOR-307: Editor Store (Zustand)

## Description
Create a Zustand store for editor state management. Track current document, selection, and editor mode.

## Acceptance Criteria
- [x] Store created in `frontend/src/stores/editor-store.ts`
- [x] Track current document ID (`currentDocumentId`, `setCurrentDocumentId`)
- [x] Track selection state (`selectedBlockIds`, `setSelectedBlocks`, `clearSelection`)
- [x] Track editor mode (normal, focus) via `selectEditorMode` selector
- [x] Actions for common operations (focus mode, document ID, selection)
- [x] React hooks for accessing state (selectors exported via index.ts)

## Dependencies
- EDITOR-301 (BlockSuite Integration)

## Parallel Safe With
- EDITOR-302, EDITOR-303, EDITOR-304, EDITOR-305, EDITOR-306, AUTH-*, API-*, FE-*

## Notes
- Zustand already installed
- Keep store focused on editor concerns
- Auth and AI have separate stores (FE tickets)

## Status
- **Created**: 2025-01-09
- **Completed**: 2026-01-11
- **Status**: done

## Implementation Summary
Added document ID and selection state tracking to the editor store:
- `currentDocumentId: string | null` - tracks current document
- `selectedBlockIds: string[]` - tracks selected blocks
- `EditorMode` type (`'normal' | 'focus'`) - for editor mode state
- New selectors: `selectCurrentDocumentId`, `selectSelectedBlockIds`, `selectHasSelection`, `selectEditorMode`
- New actions: `setCurrentDocumentId`, `setSelectedBlocks`, `clearSelection`
- All exports updated in `frontend/src/stores/index.ts`
- 27 unit tests (up from 9), 318 total frontend tests passing
