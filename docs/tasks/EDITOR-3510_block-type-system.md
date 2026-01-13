# EDITOR-3510: Block Type System (Checkbox, Numbered List, Bullet List, Heading)

## Description

Implement AFFiNE-style block types with slash menu and markdown shortcuts. Add support for multiple block types (checkbox, numbered list, bullet list with visual marker, headings) with both slash command (`/`) selection and markdown shortcut auto-conversion.

## Automation Status
**SEMI-AUTO** - Requires Chrome E2E testing

## Acceptance Criteria

### Slash Menu (`/` command)
- [ ] Type `/` at line start opens dropdown popover below cursor
- [ ] Dropdown filters as user types (fuzzy match)
- [ ] Arrow Up/Down navigates menu items
- [ ] Enter selects highlighted item
- [ ] Escape closes menu
- [ ] Menu items: Bullet, Numbered, Checkbox, Heading 1-3, Portal, Divider

### Markdown Shortcuts (auto-convert on space)
- [ ] `[]` or `[ ]` + space → Checkbox (unchecked)
- [ ] `[x]` + space → Checkbox (checked)
- [ ] `1.` + space → Numbered list
- [ ] `-` or `*` + space → Bullet list with visual marker
- [ ] `#` + space → Heading 1
- [ ] `##` + space → Heading 2
- [ ] `###` + space → Heading 3
- [ ] `---` + space → Divider (horizontal line)

### Visual Markers
- [ ] Bullet list shows bullet icon (rotates by nesting depth: •, ◦, ▪, ▫)
- [ ] Numbered list shows number prefix (1., 2., etc.)
- [ ] Checkbox shows clickable checkbox icon
- [ ] Checkbox click toggles checked state
- [ ] Headings show larger font sizes (h1=28px, h2=24px, h3=20px)
- [ ] Divider renders as horizontal line (no editable text)

### Block Behavior
- [ ] All block types support expand/collapse
- [ ] Headings support nested children (collapsible)
- [ ] Numbered lists auto-compute order from sibling position
- [ ] Tab/Shift+Tab indent/outdent works for all types

## Technical Details

### Schema Changes
Extend `BulletBlockProps`:
```typescript
blockType: 'bullet' | 'numbered' | 'checkbox' | 'heading1' | 'heading2' | 'heading3' | 'divider'
isChecked: boolean  // For checkbox type
```

### Files to Modify
| File | Action | Purpose |
|------|--------|---------|
| `blocks/schemas/bullet-block-schema.ts` | Modify | Add `blockType`, `isChecked` props |
| `blocks/components/bullet-block.ts` | Modify | Add prefix rendering, markdown detection |
| `blocks/utils/markdown-shortcuts.ts` | Create | Pattern matching for markdown shortcuts |
| `blocks/utils/numbered-list.ts` | Create | Compute list numbers from siblings |
| `blocks/utils/block-icons.ts` | Create | SVG icons for bullet types |
| `components/SlashMenu.tsx` | Create | Slash menu dropdown component |
| `components/Editor.tsx` | Modify | Wire slash menu events |

### Reference
Copy behavior from AFFiNE codebase:
- Slash menu: `/blocksuite/affine/widgets/slash-menu/`
- List block: `/blocksuite/affine/blocks/list/`
- Paragraph/headings: `/blocksuite/affine/blocks/paragraph/`

## Dependencies
- None (extends existing bullet block)

## Parallel Safe With
- AUTH-*, API-*, FE-*

## Status
- **Created**: 2026-01-12
- **Status**: in-progress
- **Epic**: MVP2 - Editor Enhancements
