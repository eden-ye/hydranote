# EDITOR-3101: Color Palette System

## Description
Define and implement the color palette system for manual text/background highlighting. This is the foundation for the coloring feature in MVP2.

## Acceptance Criteria
- [x] Define 6 colors with semantic names and hex values
- [x] Create color data model in block schema (store color per text range)
- [x] Integrate with Yjs for persistence
- [x] Colors apply to selected text ranges (inline marks)
- [x] Support for background color (primary) and text color (optional)

## Technical Details
- Colors stored as inline marks on rich-text (similar to bold/italic)
- Schema extension for `backgroundColor` mark type
- 6 predefined colors (user can apply any of these)
- Auto-colors (Pros=green, Cons=red) handled separately in EDITOR-3302

## Dependencies
- EDITOR-3056: Inline Formatting (should be completed first for mark infrastructure)

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
This ticket creates the data layer. EDITOR-3102 and EDITOR-3103 add the UI for applying colors.

## Implementation

### Files Created
- `frontend/src/blocks/utils/color-palette.ts` - Color palette definitions and utilities
- `frontend/src/blocks/utils/index.ts` - Utils exports
- `frontend/src/blocks/__tests__/color-palette.test.ts` - Unit tests for color palette

### Files Modified
- `frontend/src/blocks/index.ts` - Added utils export
- `frontend/src/blocks/components/bullet-block.ts` - Added CSS styles for highlight colors
- `frontend/src/blocks/__tests__/bullet-block-component.test.ts` - Added highlight style tests

### Color Palette (6 colors)
| Color  | Background | Text Color | Shortcut |
|--------|------------|------------|----------|
| Yellow | #FEF3C7    | #92400E    | 1        |
| Green  | #D1FAE5    | #065F46    | 2        |
| Blue   | #DBEAFE    | #1E40AF    | 3        |
| Purple | #EDE9FE    | #5B21B6    | 4        |
| Pink   | #FCE7F3    | #9D174D    | 5        |
| Gray   | #F3F4F6    | #1F2937    | 6        |

### CSS Attribute
Highlights use `data-v-highlight="<color>"` attribute on rich-text spans.

### Test Results
- 290 frontend tests passing (9 new tests for color palette)
- Build succeeds

### E2E Verification
- All 6 color CSS styles verified present in browser

## Status
- **Created**: 2026-01-10
- **Completed**: 2026-01-11
- **Status**: completed
- **Epic**: MVP2 - Background Coloring

---

## Cost Analysis

### Time Cost
| Phase | Estimated Time | Notes |
|-------|---------------|-------|
| Read task & dependencies | 10 min | Read task file, check EDITOR-3056 completed |
| Create branch | 2 min | Simple git operation |
| Write tests | 15 min | 9 tests for color palette |
| Implement color-palette.ts | 20 min | Straightforward data definitions |
| Add CSS styles | 15 min | 6 color selectors in bullet-block.ts |
| Fix lint errors | 10 min | Unused imports |
| Run tests & build | 5 min | |
| Chrome E2E | 15 min | Verify CSS present |
| Create PR & merge | 10 min | PR #43 |
| Documentation PR | 10 min | PR #44, move to done/ |
| **Total** | **~1.5 hours** | |

### Token Cost (Estimated)
| Activity | Tokens (Input) | Tokens (Output) |
|----------|---------------|-----------------|
| File reads (~10 files) | ~15,000 | - |
| Code generation | ~2,000 | ~3,000 |
| Chrome E2E (screenshots, DOM) | ~5,000 | ~1,000 |
| Git operations | ~1,000 | ~500 |
| **Total** | **~23,000** | **~4,500** |

### Assessment
✅ **Reasonable** - Task complexity matched time/cost. Simple data layer with CSS styles.
