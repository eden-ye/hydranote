# EDITOR-3053u: Fallback - Keystroke Queue (Unhappy Path)

## Description

If EDITOR-3053 (rich-text migration) fails or takes too long, implement keystroke queue as fallback to fix the focus bug (EDITOR-3052) without requiring rich-text migration.

## When to Use This Ticket

Trigger this ticket if:
- rich-text component has breaking API differences
- BlockSuite canary version has incompatibilities
- Integration takes >3 days without progress
- Critical blocker discovered in rich-text approach

## Background

This approach intercepts keystrokes during block creation:
1. Before creating new block, start capture mode
2. Capture all keystrokes in a buffer (prevent default)
3. Once new block renders and focuses, replay buffered keystrokes
4. Disable capture mode

This works because:
- Keystrokes are captured before browser routes them to wrong element
- Buffer holds input until DOM is ready
- Works with existing contenteditable (no rich-text needed)

## Scope

- Create `frontend/src/blocks/utils/keystroke-queue.ts`
- Intercept keystrokes during block creation
- Buffer keystrokes while new block renders
- Replay buffered keystrokes to new block's contenteditable

## Files to Create/Modify

- `frontend/src/blocks/utils/keystroke-queue.ts` (NEW)
- `frontend/src/blocks/components/bullet-block.ts` - Integrate queue

## Implementation

### keystroke-queue.ts
```typescript
/**
 * Keystroke queue for buffering input during async block creation.
 * Captures keystrokes, prevents them from going to wrong element,
 * then replays them to the correct element after render.
 */
class KeystrokeQueue {
  private buffer: KeyboardEvent[] = []
  private pasteBuffer: string | null = null
  private pendingBlockId: string | null = null
  private isComposing = false

  startCapture(pendingBlockId: string) {
    this.pendingBlockId = pendingBlockId
    this.buffer = []
    this.pasteBuffer = null

    document.addEventListener('keydown', this.captureKeydown, true)
    document.addEventListener('keypress', this.captureKeypress, true)
    document.addEventListener('paste', this.capturePaste, true)
    document.addEventListener('compositionstart', this.onCompositionStart, true)
    document.addEventListener('compositionend', this.onCompositionEnd, true)
  }

  private captureKeydown = (e: KeyboardEvent) => {
    if (!this.pendingBlockId) return
    if (this.isComposing) return // Don't intercept during IME

    // Only capture printable characters, not special keys
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault()
      e.stopPropagation()
      this.buffer.push(e)
    }
  }

  private captureKeypress = (e: KeyboardEvent) => {
    if (!this.pendingBlockId) return
    // Prevent default to avoid double input
    e.preventDefault()
    e.stopPropagation()
  }

  private capturePaste = (e: ClipboardEvent) => {
    if (!this.pendingBlockId) return
    e.preventDefault()
    e.stopPropagation()
    this.pasteBuffer = e.clipboardData?.getData('text/plain') || null
  }

  private onCompositionStart = () => {
    this.isComposing = true
  }

  private onCompositionEnd = (e: CompositionEvent) => {
    this.isComposing = false
    if (!this.pendingBlockId) return
    // Capture composed text
    if (e.data) {
      // Store as synthetic event
      this.buffer.push({
        key: e.data,
        type: 'composition',
      } as any)
    }
  }

  async replayTo(element: HTMLElement) {
    this.removeListeners()

    // Focus the element first
    element.focus()

    // Replay buffered keystrokes
    for (const event of this.buffer) {
      if ((event as any).type === 'composition') {
        // Insert composed text directly
        document.execCommand('insertText', false, event.key)
      } else {
        document.execCommand('insertText', false, event.key)
      }
    }

    // Replay paste if any
    if (this.pasteBuffer) {
      document.execCommand('insertText', false, this.pasteBuffer)
    }

    this.reset()
  }

  cancel() {
    this.removeListeners()
    this.reset()
  }

  private removeListeners() {
    document.removeEventListener('keydown', this.captureKeydown, true)
    document.removeEventListener('keypress', this.captureKeypress, true)
    document.removeEventListener('paste', this.capturePaste, true)
    document.removeEventListener('compositionstart', this.onCompositionStart, true)
    document.removeEventListener('compositionend', this.onCompositionEnd, true)
  }

  private reset() {
    this.buffer = []
    this.pasteBuffer = null
    this.pendingBlockId = null
    this.isComposing = false
  }
}

export const keystrokeQueue = new KeystrokeQueue()
```

### Integration in bullet-block.ts
```typescript
import { keystrokeQueue } from '../utils/keystroke-queue'

// In _createSibling():
private _createSibling(): void {
  const newBlockId = this.doc.addBlock(...)

  // Start capturing keystrokes
  keystrokeQueue.startCapture(newBlockId)

  // Set pending focus (existing pattern)
  HydraBulletBlock._pendingFocusBlockId = newBlockId
}

// In firstUpdated() of new block:
override firstUpdated(): void {
  if (HydraBulletBlock._pendingFocusBlockId === this.model.id) {
    const contentDiv = this.querySelector('.bullet-content') as HTMLElement
    if (contentDiv) {
      keystrokeQueue.replayTo(contentDiv)
    }
    HydraBulletBlock._pendingFocusBlockId = null
  }
}
```

## Edge Cases to Handle

- [x] Paste events (`paste` event listener)
- [x] IME composition (`compositionstart`, `compositionend`)
- [ ] Special keys during capture (Escape to cancel)
- [ ] Multiple rapid Enter presses
- [ ] Timeout if block never renders

## Acceptance Criteria

- [ ] Focus bug fixed without rich-text migration
- [ ] All 12 E2E scenarios pass
- [ ] No regression in text editing

## E2E Testing Checklist

- [ ] Enter → type immediately → text in new block
- [ ] Enter → paste → pasted content in new block
- [ ] Enter → IME input → characters in new block
- [ ] Rapid Enter presses → each creates new block correctly
- [ ] All existing keyboard shortcuts still work

## Dependencies

- None (standalone alternative to EDITOR-3053 path)

## Parallel Safe With

- AUTH-*, API-* (different codebase areas)

## Related Tickets

- **EDITOR-3052**: Parent ticket (this fixes the bug as fallback)
- **EDITOR-3053**: This is the fallback for 3053

## Link

This is the **unhappy path** for EDITOR-3053. If 3053 (rich-text migration) fails, switch to this ticket.

## Status

- **Created**: 2026-01-10
- **Status**: pending (activate only if EDITOR-3053 fails)
