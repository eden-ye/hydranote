# EDITOR-307: Editor Store (Zustand)

## Description
Create a Zustand store for editor state management. Track current document, selection, and editor mode.

## Acceptance Criteria
- [ ] Store created in `frontend/src/stores/editor-store.ts`
- [ ] Track current document ID
- [ ] Track selection state
- [ ] Track editor mode (normal, focus)
- [ ] Actions for common operations
- [ ] React hooks for accessing state

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
- **Status**: pending
