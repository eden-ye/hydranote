# EDITOR-301: BlockSuite Basic Integration

## Description
Integrate BlockSuite as the core editor framework. Set up the basic editor instance with default configuration and render it in the React app.

## Acceptance Criteria
- [x] BlockSuite editor instance created and mounted
- [x] Basic text editing works (typing, selection)
- [x] Editor renders in the main App component
- [x] No console errors on load

## Dependencies
- None (foundation ticket)

## Parallel Safe With
- AUTH-*, API-*, FE-*

## Notes
- BlockSuite packages already installed: @blocksuite/block-std, @blocksuite/blocks, @blocksuite/inline, @blocksuite/presets, @blocksuite/store
- Refer to BlockSuite documentation for setup
- This is the foundation for all other EDITOR tickets

## Status
- **Created**: 2025-01-09
- **Completed**: 2026-01-09
- **Status**: completed

## Implementation Details
- `src/components/Editor.tsx` - React component with BlockSuite AffineEditorContainer
- Uses AffineSchemas and PageEditorBlockSpecs as base
- Registers custom Hydra blocks via Schema.register()
- `tsconfig.app.json` updated with `experimentalDecorators: true` for Lit decorators
