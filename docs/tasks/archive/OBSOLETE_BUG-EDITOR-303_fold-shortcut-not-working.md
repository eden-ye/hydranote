# BUG-EDITOR-303: Fold Shortcut (Cmd+.) Not Working

## Symptoms
- Pressing Cmd+. (Mac) or Ctrl+. (Windows/Linux) when cursor is in a bullet block does NOT toggle fold
- The keyboard shortcut was implemented in EDITOR-303 but doesn't work

## Root Cause
The keydown event listener is added to the `hydra-bullet-block` custom element:
```typescript
override connectedCallback(): void {
  super.connectedCallback()
  this.addEventListener('keydown', this._boundKeydownHandler)
}
```

However, BlockSuite manages focus at the `AFFINE-PAGE-ROOT` level, so keydown events have target=`AFFINE-PAGE-ROOT` instead of bubbling through `hydra-bullet-block`.

## Evidence
Console debug shows:
```
DOC KEYDOWN: key=., metaKey=true, ctrlKey=false, target=AFFINE-PAGE-ROOT
```

The event never reaches the hydra-bullet-block element.

## Fix Options
1. **Register with BlockSuite's keyboard system** - Use BlockSuite's built-in keyboard shortcut registration
2. **Document-level listener** - Add listener at document level, check if selection is within hydra:bullet
3. **Use BlockSuite events** - Integrate with BlockSuite's event handling instead of native DOM

## Affected Version
- EDITOR-303 commit: 39b55ee

## Priority
High - Core folding functionality is broken

## Resolution
Will be fixed as part of **EDITOR-306 (Keyboard Shortcuts)** which should implement all keyboard shortcuts using BlockSuite's keyboard registration system instead of native DOM event listeners.

## Status
- **Created**: 2026-01-09
- **Status**: deferred to EDITOR-306
