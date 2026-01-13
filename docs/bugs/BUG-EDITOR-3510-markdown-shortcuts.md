# BUG-EDITOR-3510: Markdown Shortcuts Not Converting

## Summary
Markdown shortcuts (e.g., `[] `, `[x] `, `1. `, `- `, `# `) are not converting to their respective block types when followed by a space.

## Severity
**High** - Core feature of EDITOR-3510 is non-functional

## Steps to Reproduce
1. Navigate to http://localhost:5173
2. Create a new bullet
3. Type `[] Test checkbox` and press space after `[]`
4. Expected: Bullet converts to checkbox type
5. Actual: Text remains as `[] Test checkbox` - no conversion

## Root Cause Analysis
In `bullet-block.ts`:
- Line ~3060: `_handleKeydown` checks `parseMarkdownShortcut(textWithSpace)` to decide if shortcut applies
- Line ~3472: `_handleMarkdownShortcut()` calls `parseMarkdownShortcut(currentText)` WITHOUT the space
- The regex patterns in `markdown-shortcuts.ts` require a space after the shortcut pattern
- Since `_handleMarkdownShortcut()` doesn't include the space, the patterns never match

## Expected Behavior
Typing markdown shortcuts should auto-convert:
- `[] ` or `[ ] ` -> Unchecked checkbox
- `[x] ` -> Checked checkbox
- `1. ` -> Numbered list
- `- ` or `* ` -> Bullet list
- `# ` -> Heading 1
- `## ` -> Heading 2
- `### ` -> Heading 3
- `--- ` -> Divider

## Affected Files
- `frontend/src/blocks/components/bullet-block.ts` - `_handleMarkdownShortcut()` method
- `frontend/src/blocks/utils/markdown-shortcuts.ts` - Pattern definitions

## Proposed Fix
In `_handleMarkdownShortcut()`, pass `currentText + ' '` (or the text that includes the space) to `parseMarkdownShortcut()` instead of just `currentText`.

## Test Evidence
Screenshot shows bullets with raw text `[]`, `[] My checkbox task`, `[]Test checkbox` - none converted to checkboxes.

## Related Ticket
EDITOR-3510: Block Type System

## Status
**Open** - Awaiting fix
