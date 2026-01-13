# EDITOR-3510: Block Type System (Checkbox, Numbered List, Bullet List, Heading)

## Description

Implement AFFiNE-style block types with slash menu and markdown shortcuts. Add support for multiple block types (checkbox, numbered list, bullet list with visual marker, headings) with both slash command (`/`) selection and markdown shortcut auto-conversion.

## Automation Status
**SEMI-AUTO** - Requires Chrome E2E testing

## Acceptance Criteria

### Slash Menu (`/` command)
- [x] Type `/` at line start opens dropdown popover below cursor
- [x] Dropdown filters as user types (fuzzy match)
- [x] Arrow Up/Down navigates menu items
- [x] Enter selects highlighted item
- [x] Escape closes menu
- [x] Menu items: Bullet, Numbered, Checkbox, Heading 1-3, Portal, Divider

### Markdown Shortcuts (auto-convert on space)
- [x] `[]` or `[ ]` + space → Checkbox (unchecked)
- [x] `[x]` + space → Checkbox (checked)
- [x] `1.` + space → Numbered list
- [x] `-` or `*` + space → Bullet list with visual marker
- [x] `#` + space → Heading 1
- [x] `##` + space → Heading 2
- [x] `###` + space → Heading 3
- [x] `---` + space → Divider (horizontal line)

### Visual Markers
- [x] Bullet list shows bullet icon (rotates by nesting depth: •, ◦, ▪, ▫)
- [x] Numbered list shows number prefix (1., 2., etc.)
- [x] Checkbox shows clickable checkbox icon
- [x] Checkbox click toggles checked state
- [x] Headings show larger font sizes (h1=28px, h2=24px, h3=20px)
- [x] Divider renders as horizontal line (no editable text)

### Block Behavior
- [x] All block types support expand/collapse
- [x] Headings support nested children (collapsible)
- [x] Numbered lists auto-compute order from sibling position
- [x] Tab/Shift+Tab indent/outdent works for all types

## Technical Details

### Schema Changes
Extend `BulletBlockProps`:
```typescript
blockType: 'bullet' | 'numbered' | 'checkbox' | 'heading1' | 'heading2' | 'heading3' | 'divider'
isChecked: boolean  // For checkbox type
```

### Files Modified/Created
| File | Action | Purpose |
|------|--------|---------|
| `blocks/schemas/bullet-block-schema.ts` | Modified | Add `blockType`, `isChecked` props |
| `blocks/components/bullet-block.ts` | Modified | Add prefix rendering, markdown detection |
| `blocks/utils/markdown-shortcuts.ts` | Created | Pattern matching for markdown shortcuts |
| `blocks/utils/numbered-list.ts` | Created | Compute list numbers from siblings |
| `blocks/utils/block-icons.ts` | Created | SVG icons for bullet types |
| `blocks/utils/slash-menu.ts` | Created | Slash menu data and utilities |
| `blocks/utils/index.ts` | Modified | Export new utilities |
| `components/SlashMenu.tsx` | Created | Slash menu dropdown component |
| `components/SlashMenu.css` | Created | Slash menu styles |
| `stores/editor-store.ts` | Modified | Add slash menu state |
| `components/Editor.tsx` | Modified | Wire slash menu events |

### Test Files Created
| File | Tests |
|------|-------|
| `blocks/__tests__/markdown-shortcuts.test.ts` | 21 tests |
| `blocks/__tests__/numbered-list.test.ts` | 11 tests |
| `blocks/__tests__/block-icons.test.ts` | 19 tests |
| `blocks/__tests__/slash-menu.test.ts` | 13 tests |
| `components/__tests__/SlashMenu.test.tsx` | 18 tests |

## Implementation Summary

### Markdown Shortcuts
- Parses patterns like `[]`, `[x]`, `1.`, `-`, `*`, `#`, `##`, `###`, `---` followed by space
- Automatically converts block type and removes the markdown prefix from text
- Preserves any remaining text after the shortcut

### Slash Menu
- Opens when `/` is typed at the start of an empty line
- Shows 7 menu items: Bullet, Numbered, Checkbox, Heading 1-3, Divider
- Fuzzy filtering by label, blockType, and keywords
- Keyboard navigation (Arrow keys, Enter, Escape)

### Visual Prefixes
- Bullet: Rotates markers by depth (•, ◦, ▪, ▫)
- Numbered: Computes consecutive list numbers from siblings
- Checkbox: Clickable SVG checkbox icon
- Headings: Font size styling (28px, 24px, 20px)
- Divider: Horizontal line (no text content)

## Dependencies
- None (extends existing bullet block)

## Parallel Safe With
- AUTH-*, API-*, FE-*

## Status
- **Created**: 2026-01-12
- **Completed**: 2026-01-13
- **Status**: completed
- **Epic**: MVP2 - Editor Enhancements
- **Commits**: To be added after merge
