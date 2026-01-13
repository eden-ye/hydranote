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

## Implemented Fix

Added a defensive model getter with a cached dummy model object:

```typescript
// In bullet-block.ts

// Cached dummy model to avoid creating new objects on each access
private _cachedDummyModel: ReturnType<typeof createDummyModel> | null = null

// Override model getter to return dummy when null
override get model(): BulletBlockModel {
  try {
    const baseModel = super.model
    if (!baseModel) {
      if (!this._cachedDummyModel) {
        this._cachedDummyModel = createDummyModel()
      }
      return this._cachedDummyModel as unknown as BulletBlockModel
    }
    return baseModel
  } catch {
    // BlockSuiteError: MissingViewModelError or null access
    if (!this._cachedDummyModel) {
      this._cachedDummyModel = createDummyModel()
    }
    return this._cachedDummyModel as unknown as BulletBlockModel
  }
}

// Pure function to create dummy model
export function createDummyModel(): {
  id: string
  text: DummyText
  isExpanded: boolean
  children: never[]
  isDescriptor: boolean
  descriptorType: null
  descriptorLabel: undefined
  cheatsheetVisible: boolean
  __isDummy: true
} {
  return {
    id: '',
    text: { toString: () => '', length: 0, yText: undefined },
    isExpanded: true,
    children: [],
    isDescriptor: false,
    descriptorType: null,
    descriptorLabel: undefined,
    cheatsheetVisible: true,
    __isDummy: true,
  }
}

// Helper to check if model is dummy
export function isDummyModel(model: unknown): boolean {
  if (!model || typeof model !== 'object') return false
  return (model as DummyModelMarker).__isDummy === true
}
```

Also updated:
- `shouldUpdate()` to use `isDummyModel()` check
- `renderBlock()` to use `isDummyModel()` check
- `_hasChildren` to return false for dummy models
- `_safeModel` to return null for dummy models

## Files Modified

- `frontend/src/blocks/components/bullet-block.ts`
- `frontend/src/blocks/__tests__/bullet-block-component.test.ts`

## Test Results

- All 749 frontend tests pass
- Build succeeds
- Unit tests added for `createDummyModel()` and `isDummyModel()`

## E2E Testing

Chrome E2E testing shows:
- App renders correctly with bullet content
- Some errors still appear from BlockSuite's internal components (`@blocksuite_presets_effects.js`)
- These remaining errors are from BlockSuite's built-in blocks, not our custom bullet-block

## Limitations

The fix addresses null model errors in our **custom bullet-block component**. However, BlockSuite's internal block components (ParagraphBlock, etc.) may still throw these errors as they're part of the library code we cannot modify.

## Ongoing Observations

### FE-504 E2E Testing (2026-01-13)

During Chrome E2E testing for FE-504, the following errors were observed on page load:

```
TypeError: Cannot read properties of null (reading 'id')
    at _a.render (chunk-AHQXWQTX.js?v=995835ba:368:42)
    at _a.update (chunk-Z45B7JUF.js?v=995835ba:46:24)
    at _a.performUpdate (chunk-XQCYXLS3.js?v=995835ba:737:14)
    at p.<anonymous> (chunk-7LCCMC76.js?v=995835ba:3124:17)
    at p.c (chunk-7LCCMC76.js?v=995835ba:3060:19)
    at E (chunk-7LCCMC76.js?v=995835ba:3094:8)
    at _a.performUpdate (chunk-7LCCMC76.js?v=995835ba:3121:24)
    at _a.scheduleUpdate (chunk-XQCYXLS3.js?v=995835ba:683:25)
    at _a.__enqueueUpdate (chunk-XQCYXLS3.js?v=995835ba:659:25)
```

**Analysis**: These errors come from BlockSuite's bundled chunks (Lit component rendering), not from our custom bullet-block component. The error occurs when:
1. IndexedDB contains orphaned block references from previous sessions
2. BlockSuite tries to render blocks that no longer exist in the document tree
3. The Lit component's `render()` method accesses `this.model.id` before checking if model is null

**Impact**:
- App continues to function normally
- Does not affect user experience
- Only visible in browser console

**Potential Fixes** (not implemented):
1. Clear IndexedDB on version updates to remove orphaned blocks
2. Add migration script to clean up orphaned block references
3. Wait for upstream BlockSuite fix

## Acceptance Criteria

- [x] Defensive model getter implemented in bullet-block
- [x] All existing tests pass (749 frontend tests)
- [x] Production build succeeds
- [x] Unit tests added for null model handling utilities
- [ ] No errors from bullet-block component (verified - errors now from BlockSuite internals)

## Commits

- `fix(editor): Add defensive model getter to prevent null id errors (BUG-EDITOR-3064)`

## Priority

Medium - App still functions but console errors affect debugging and user confidence.

## Related

- EDITOR-3063 (Delete parent unindents children) - may trigger this during deletion
- EDITOR-3052 (Keyboard behaviors) - rapid Enter/Backspace may trigger this
- EDITOR-3405 (Orphaned block handling) - related null model guards

## Status

- **Created**: 2026-01-11
- **Partial Fix**: 2026-01-12
- **Status**: open (orphaned blocks issue remains)
- **Phase**: 2 (MVP1)

**Note**: Our custom bullet-block fix is complete, but BlockSuite internal components still throw errors from orphaned blocks in IndexedDB. This is tracked in sprint-tracker.md under "Active Bugs".
