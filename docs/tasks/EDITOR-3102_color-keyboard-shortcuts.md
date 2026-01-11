# EDITOR-3102: Keyboard Shortcuts for Coloring

## Description
Implement keyboard shortcuts (Cmd+Alt+0-6) for applying background colors to selected text.

## Acceptance Criteria
- [x] Cmd+Alt+1 through Cmd+Alt+6 apply colors (yellow, green, blue, purple, pink, gray)
- [x] Cmd+Alt+0 clears/removes highlight
- [x] Shortcut on already-colored text with same color removes the color (toggle)
- [x] Works with text selection in rich-text editor
- [ ] Visual feedback when color is applied ⚠️ **BLOCKED - see findings below**
- [x] Shortcuts registered via BlockSuite's bindHotKey system

## Technical Details
- Key bindings: Cmd+Alt+1-6 for colors, Cmd+Alt+0 to clear
- Uses mark API from EDITOR-3101
- Toggle behavior: same color removes, different color replaces

## Dependencies
- EDITOR-3101: Color Palette System ✅ Completed

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Part of Epic 1: Background Coloring

---

## Implementation Progress

### Completed Work (2026-01-11)

**Files Modified:**
- `frontend/src/blocks/components/bullet-block.ts`
- `frontend/src/blocks/__tests__/bullet-block-component.test.ts`

**Code Added:**

1. **Helper Functions** (lines 100-134):
   ```typescript
   export const HIGHLIGHT_SHORTCUT_MAP: Record<string, ColorId | '__clear__'>
   export function getColorFromShortcutKey(key: string): ColorId | '__clear__' | null
   export function getHighlightAction(currentColor, newColor): 'apply' | 'remove' | 'replace'
   ```

2. **Keyboard Shortcuts** in `_bindKeyboardShortcuts()` (lines 682-724):
   - `'Mod-Alt-1'` through `'Mod-Alt-6'` for colors
   - `'Mod-Alt-0'` to clear highlight
   - All shortcuts check `_hasTextSelection()` guard before proceeding

3. **Apply Highlight Method** `_applyHighlight()` (lines 734-766):
   - Gets InlineEditor from rich-text component
   - Checks for valid selection range
   - Implements toggle behavior (same color = remove)
   - Uses `formatText()` API to apply/remove format

**Tests Added:**
- Shortcut key mapping tests
- Toggle behavior tests (apply, remove, replace)
- Shortcut detection tests

**Test Results:**
- ✅ 300 unit tests passing
- ✅ Build passes

---

## Technical Findings & Blockers

### Issue: Visual Highlight Not Rendering

**Symptom:**
- Keyboard shortcut fires correctly (console shows `[Highlight] Applied: yellow`)
- `formatText()` stores the attribute in Yjs
- BUT no visual highlight appears in the DOM

**Root Cause:**
BlockSuite's `rich-text` component only renders **built-in** inline marks (bold, italic, underline) as `data-v-*` attributes. Our custom `highlight` attribute is stored in Yjs but not rendered to DOM.

**Evidence:**
```javascript
document.querySelectorAll('[data-v-highlight]').length // Returns 0
```

### BlockSuite Architecture Insight

1. **Built-in marks**: `bold`, `italic`, `underline`, `strike`, `code`, `link` → render as `data-v-*` attributes
2. **Custom marks**: Require either:
   - Custom `AttributeRenderer` function
   - OR use built-in `background` attribute from `@blocksuite/affine-rich-text`

### Solution Options

**Option A: Use Built-in `background` Attribute** (Recommended)
- BlockSuite has `BackgroundInlineSpecExtension` in `@blocksuite/affine-rich-text`
- Change attribute name from `highlight` to `background`
- Pass hex color value directly (e.g., `#FEF3C7`)
- Update CSS to use `[data-v-background="#FEF3C7"]` selectors

**Option B: Custom AttributeRenderer**
- Create custom renderer function
- Configure InlineEditor with `setAttributeRenderer()`
- More complex, requires deeper BlockSuite integration

---

## Next Steps

1. [ ] Update `_applyHighlight()` to use `background` attribute with hex color values
2. [ ] Update CSS selectors from `[data-v-highlight="yellow"]` to `[data-v-background="#FEF3C7"]` etc.
3. [ ] Re-test in Chrome to verify visual rendering
4. [ ] Complete Chrome E2E validation
5. [ ] Commit and create PR
6. [ ] Merge to main

---

## Cost Analysis

### Time Cost
| Phase | Estimated Time | Notes |
|-------|---------------|-------|
| Wait after EDITOR-3101 | 3 min | Per user instruction |
| Read task & context | 10 min | |
| Move ticket to active | 2 min | |
| Create branch | 2 min | |
| Write tests | 20 min | Shortcut mapping, toggle behavior |
| Implement shortcuts | 30 min | bindHotKey, _applyHighlight() |
| Fix TypeScript errors | 15 min | Unused imports, type assertions |
| Run tests & build | 5 min | 300 tests pass |
| **Chrome E2E - Initial** | 20 min | Discovered shortcut works but no visual |
| **Debug cycle 1** | 30 min | Check console logs, confirm handler fires |
| **Debug cycle 2** | 45 min | Inspect DOM, find no data-v-highlight |
| **Research BlockSuite** | 40 min | Web search, fetch docs, understand architecture |
| **Root cause analysis** | 20 min | Identify AttributeRenderer requirement |
| Document findings | 15 min | Update ticket with technical findings |
| **Total** | **~4 hours** | **2.5 hours on debugging/research** |

### Token Cost (Estimated)
| Activity | Tokens (Input) | Tokens (Output) |
|----------|---------------|-----------------|
| File reads (~15 files) | ~25,000 | - |
| Code generation | ~3,000 | ~4,000 |
| Chrome E2E (multiple cycles) | ~15,000 | ~3,000 |
| Web searches (3x) | ~5,000 | ~2,000 |
| Web fetches (BlockSuite docs) | ~8,000 | ~1,500 |
| Debugging/inspection | ~10,000 | ~2,000 |
| **Total** | **~66,000** | **~12,500** |

### Assessment
⚠️ **Over budget** - 4 hours for what should be ~1 hour task

**Root Causes of Overrun:**
1. **Insufficient upfront research** - Should have researched BlockSuite custom attributes BEFORE implementing
2. **Assumed CSS approach would work** - Copied pattern from EDITOR-3101 without verifying it works for custom marks
3. **Late discovery of architectural limitation** - Only discovered `AttributeRenderer` requirement after full implementation
4. **Multiple Chrome E2E cycles** - Each debug cycle is expensive (screenshots, DOM inspection)

**Lessons Learned:**
1. For new framework features, research architecture FIRST before coding
2. Test rendering in browser EARLY (before writing all tests)
3. BlockSuite's `rich-text` only renders built-in marks by default
4. Custom marks need either `AttributeRenderer` or use built-in attributes like `background`

**Recommended Approach (if redoing):**
1. Quick spike: Try `formatText({background: '#FEF3C7'})` in browser console first (5 min)
2. If works → implement with confidence
3. If not → research before proceeding
4. Would have saved ~2.5 hours

---

## Status
- **Created**: 2026-01-10
- **Status**: in_progress
- **Epic**: MVP2 - Background Coloring
- **Branch**: `editor/EDITOR-3102-color-keyboard-shortcuts`
