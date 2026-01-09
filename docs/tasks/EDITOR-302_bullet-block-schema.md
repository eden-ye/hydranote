# EDITOR-302: Bullet Block Schema

## Description
Create a custom BlockSuite block schema for hierarchical bullet points. Each bullet should support text content, children (nested bullets), and metadata for folding state.

## Acceptance Criteria
- [x] Custom bullet block schema defined in `frontend/src/blocks/schemas/`
- [x] Block supports text content with ~20 word soft limit
- [x] Block supports nested children (hierarchical structure)
- [x] Block has folding state metadata (expanded/collapsed)
- [x] Block registered with BlockSuite editor

## Dependencies
- EDITOR-301 (BlockSuite Integration)

## Parallel Safe With
- AUTH-*, API-*, FE-*

## Notes
- Follow BlockSuite block definition patterns
- Consider AI-guided word limits (~20 words per bullet)
- Schema should support future inline detail view

## Status
- **Created**: 2025-01-09
- **Completed**: 2026-01-09
- **Status**: completed

## Implementation Details

### Files Created
- `frontend/src/blocks/schemas/bullet-block-schema.ts` - Block schema definition
- `frontend/src/blocks/components/bullet-block.ts` - Lit component for rendering
- `frontend/src/blocks/specs/bullet-block-spec.ts` - BlockSuite spec registration
- `frontend/src/blocks/index.ts` - Module exports
- `frontend/src/blocks/__tests__/bullet-block-schema.test.ts` - Unit tests

### Schema Details
- **Flavour**: `hydra:bullet`
- **Props**:
  - `text: Text` - Collaborative text via Yjs
  - `isExpanded: boolean` - Folding state (default: true)
- **Metadata**:
  - `role: 'content'`
  - `parent: ['affine:note', 'hydra:bullet']` - Can nest under notes or other bullets
  - `children: ['hydra:bullet']` - Supports hierarchical nesting

### Integration
- Schema registered with `Schema.register([BulletBlockSchema])`
- Spec added to `PageEditorBlockSpecs` array in Editor component
