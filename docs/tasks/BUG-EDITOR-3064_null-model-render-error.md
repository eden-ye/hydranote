# BUG-EDITOR-3064: Fix "Cannot read properties of null (reading 'id')" Error

## Symptom

Console shows repeated errors on production:
```
TypeError: Cannot read properties of null (reading 'id')
    at s.render (index-BRGnhJ-V.js:40726:2314)
```

Error occurs during page load and during block operations.

## Root Cause

BlockSuite's `BlockComponent` base class accesses `this.model.id` in its internal render path **before** our guard overrides run.

During block deletion or rapid operations:
1. `this.model` becomes `null`
2. Base class tries to access `this.model.id`
3. Error thrown before our `shouldUpdate()` or `render()` guards can prevent it

## Current Guards (Insufficient)

```typescript
// These exist but don't catch all cases
override shouldUpdate(): boolean {
  if (!this.model) return false
  return true
}

override render(): unknown {
  if (!this.model) return html``
  return super.render()  // Base class may still access model.id internally
}
```

## Proposed Fix

Add a defensive model getter to prevent null access:

```typescript
// Option A: Defensive getter (preferred)
override get model(): BulletBlockModel {
  const model = super.model
  if (!model) {
    // Return dummy object during teardown to prevent errors
    return {
      id: '',
      text: '',
      expanded: true,
      children: []
    } as unknown as BulletBlockModel
  }
  return model
}

// Option B: Try-catch wrapper (fallback)
override render(): unknown {
  try {
    if (!this.model) return html``
    return super.render()
  } catch (e) {
    console.warn('[BulletBlock] Render error during teardown:', e)
    return html``
  }
}
```

## Files to Modify

- `frontend/src/blocks/components/bullet-block.ts`

## Acceptance Criteria

- [ ] No "Cannot read properties of null" errors in console on page load
- [ ] No errors during block creation/deletion
- [ ] All existing tests pass (219 frontend tests)
- [ ] Production build succeeds

## Testing

1. Load production app
2. Create/delete bullets rapidly
3. Check console for errors
4. Run `npm run test:run` - all tests pass

## Priority

Medium - App still functions but console errors affect debugging and user confidence.

## Related

- EDITOR-3063 (Delete parent unindents children) - may trigger this during deletion
- EDITOR-3052 (Keyboard behaviors) - rapid Enter/Backspace may trigger this

## Status

- **Created**: 2026-01-11
- **Status**: open
- **Phase**: 2 (MVP1)
