# EDITOR-3506: Inline Text Formatting Toolbar

## Overview

Implement a selection-based inline formatting toolbar that appears when text is selected, providing quick access to text formatting options (Bold, Italic, Underline, Strikethrough) plus a Highlight dropdown for text/background colors.

## Reference Implementation

Based on Affine's BlockSuite implementation:
- **Toolbar Widget**: `/blocksuite/affine/widgets/toolbar/src/toolbar.ts`
- **Button Config**: `/blocksuite/affine/inlines/preset/src/command/config.ts`
- **Format Commands**: `/blocksuite/affine/inlines/preset/src/command/text-style.ts`
- **Highlight Dropdown**: `/blocksuite/affine/components/src/highlight-dropdown-menu/dropdown-menu.ts`

## Requirements

### Functional
1. Toolbar appears on text selection (not hover)
2. Toolbar hides when selection is collapsed/empty
3. Buttons toggle formatting on/off for selected text
4. Active state shown when format is applied to selection
5. Highlight dropdown shows Color + Background sections
6. Keyboard shortcuts work regardless of toolbar visibility

### Buttons to Implement

| ID | Name | Icon | Hotkey | Style Key |
|----|------|------|--------|-----------|
| bold | Bold | B | Cmd/Ctrl+B | `bold` |
| italic | Italic | I | Cmd/Ctrl+I | `italic` |
| underline | Underline | U | Cmd/Ctrl+U | `underline` |
| strike | Strikethrough | S̶ | Cmd/Ctrl+Shift+S | `strike` |

### Highlight Dropdown

| Section | Colors | Style Key |
|---------|--------|-----------|
| Color (text) | Default, Red, Orange, Yellow, Green, Teal, Blue, Purple, Grey | `color` |
| Background | Default, Red, Orange, Yellow, Green, Teal, Blue, Purple, Grey | `background` |

**Color values**: CSS variables like `var(--affine-text-highlight-foreground-red)` for text, `var(--affine-text-highlight-red)` for background, or `null` for default.

### Technical

1. **Selection Detection**
   - Subscribe to `TextSelection` changes
   - Check `!selection.isCollapsed()` before showing
   - Get selection range for toolbar positioning

2. **Positioning**
   - Use floating-ui for smart placement
   - Position above selected text with 10px offset
   - Flip/shift to stay in viewport

3. **Format Commands**
   - Use `inlineEditor.formatText(range, styles)` for selections
   - Use `inlineEditor.setMarks(styles)` for empty cursor (next char)
   - Toggle: set to `true` if inactive, `null` if active

4. **Active State Detection**
   - Check if all text in selection has the attribute
   - Use `isTextAttributeActive({ key })` pattern

## Implementation Plan

### Phase 1: Selection Detection & Toolbar Shell
- [ ] Create `InlineToolbar` component
- [ ] Subscribe to text selection changes
- [ ] Show/hide based on selection state
- [ ] Basic positioning above selection

### Phase 2: Button Configuration
- [ ] Define `textFormatConfigs` array (bold, italic, underline, strike)
- [ ] Import/create icons for each button
- [ ] Render buttons from config

### Phase 3: Format Commands
- [ ] Implement `toggleTextStyleCommand`
- [ ] Implement `formatTextCommand`
- [ ] Wire button clicks to commands
- [ ] Test toggle on/off behavior

### Phase 4: Active State & Polish
- [ ] Implement `isTextAttributeActive`
- [ ] Show active state on buttons
- [ ] Add keyboard shortcuts (Cmd+B/I/U, Cmd+Shift+S)
- [ ] Smart positioning with floating-ui

### Phase 5: Highlight Dropdown
- [ ] Create `HighlightDropdownMenu` component
- [ ] Two sections: Color (text) and Background
- [ ] 9 color options per section + Default
- [ ] Pass `{ color: 'var(...)' }` or `{ background: 'var(...)' }` to formatText
- [ ] Define CSS variables for all highlight colors

## Files to Create/Modify

- `frontend/src/components/InlineToolbar.tsx` - New toolbar component
- `frontend/src/components/HighlightDropdown.tsx` - Color/background picker dropdown
- `frontend/src/blocks/note/note-block.ts` - Integrate toolbar widget
- `frontend/src/utils/format-commands.ts` - Formatting utilities
- `frontend/src/styles/highlight-colors.css` - CSS variables for 9 highlight colors

## Acceptance Criteria

- [ ] Toolbar appears above selected text
- [ ] 4 formatting buttons visible: Bold, Italic, Underline, Strikethrough
- [ ] Highlight dropdown with Color + Background sections (9 colors each)
- [ ] Buttons show active state when format applied
- [ ] Keyboard shortcuts work (Cmd+B, Cmd+I, Cmd+U, Cmd+Shift+S)
- [ ] Toolbar repositions to stay in viewport
- [ ] Highlight colors render correctly in text
- [ ] No console errors during formatting operations

## Estimate

**10 hours** (complex widget with dropdown menu)

## Dependencies

- BlockSuite InlineEditor API
- Existing text block implementation

## Notes

- Affine uses `AffineToolbarWidget` as a separate widget class
- Consider whether to implement as widget or inline component
- May need to extend existing keyboard shortcut handling
