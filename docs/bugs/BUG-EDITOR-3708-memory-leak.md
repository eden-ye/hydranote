# BUG-EDITOR-3708: Memory Leak in Event Listeners

## Symptoms

- Memory usage grows from 3.5GB to 4.5GB in ~1 minute
- Memory continues to grow unbounded while app is open
- Affects users with long editing sessions

## Root Cause Analysis

### Primary Issue: bullet-block.ts

The `BulletBlockComponent` class adds event listeners but never removes them:

1. **Rich-text keydown listener (line 1610)**: Added in `firstUpdated()` but no `disconnectedCallback()` exists to remove it
2. **Context menu listeners (lines 1954-1957)**: Only removed when menu closes, not on component unmount
3. **Drag-drop listeners (lines 2745-2747)**: Only removed when drag completes, not on component unmount

Impact: Every bullet block component destruction/recreation accumulates listeners.

### Secondary Issue: useExpandBlock.ts

The WebSocket created for AI expansion (line 116) is not auto-closed on component unmount. While `cancelExpansion()` exists for manual cleanup, React doesn't call it automatically.

### Non-Issue: useEmbeddingSync.ts

Already properly implemented with `clearInterval()` in useEffect cleanup.

## Solution

### Fix 1: Add disconnectedCallback() to bullet-block.ts

```typescript
private _richTextKeydownHandler: ((e: Event) => void) | null = null

// In firstUpdated():
this._richTextKeydownHandler = (e: Event) => this._handleKeydown(e as KeyboardEvent)
richText.addEventListener('keydown', this._richTextKeydownHandler)

// New method:
override disconnectedCallback(): void {
  super.disconnectedCallback()

  const richText = this.querySelector('rich-text') as HTMLElement
  if (richText && this._richTextKeydownHandler) {
    richText.removeEventListener('keydown', this._richTextKeydownHandler)
    this._richTextKeydownHandler = null
  }

  this._hideContextMenu()
  this._cleanupDrag()
}
```

### Fix 2: Add useEffect cleanup to useExpandBlock.ts

```typescript
useEffect(() => {
  return () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }
}, [])
```

## Prevention

- All Lit components must implement `disconnectedCallback()` if they add event listeners
- React hooks using refs for cleanup-requiring resources should add useEffect cleanup
- Code review checklist: "Are all event listeners removed on unmount?"

## Related

- Pattern reference: `portal-block.ts` lines 557-560 (proper disconnectedCallback)
- Pattern reference: `useFocusMode.ts` lines 57-68 (proper useEffect cleanup)

## Timeline

- Reported: 2026-01-13
- Fixed: 2026-01-13
