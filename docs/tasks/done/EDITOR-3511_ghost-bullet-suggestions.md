# EDITOR-3511: Ghost Bullet Suggestions (Inline AI Suggestions)

## Summary

Transform the "Explore Further" suggestions from a separate bottom section into inline ghost bullets that appear directly under parent bullets. When clicked, ghost bullets become real bullets and auto-generate their children via AI.

## Current Behavior

The "Explore Further" feature currently displays suggestions in a **separate section** at the bottom of the editor:
- Rendered by `GhostQuestions.tsx` component
- Shows a "EXPLORE FURTHER" header with grey background
- Displays suggestions as styled list items (not actual bullets)
- Only visible in focus mode
- Click handler is a placeholder (console.log)

## Desired Behavior

Ghost bullet suggestions should appear as **inline grey bullets** directly under parent bullets:

1. **Visual**: Grey, slightly faded bullet points positioned under their parent
2. **Interaction**:
   - Clickable - when clicked, transforms into a real bullet
   - On transformation, auto-triggers AI expansion to generate children
3. **Positioning**: Appears at the end of a parent's children (not in a separate section)
4. **Context-aware**: Suggestions relate to the parent bullet's content

### User Flow

```
Parent Bullet
├── Child 1
├── Child 2
└── [Ghost] What are the implications of this?  ← Grey, clickable
         ↓ (user clicks)
└── What are the implications of this?  ← Now a real bullet
    ├── [AI generating children...]
    └── Generated child 1
    └── Generated child 2
```

## Technical Approach

### Option A: BlockSuite Native Ghost Blocks
Create a new block type `hydra:ghost-bullet` that:
- Renders with ghost styling (grey, faded)
- On click, converts to `hydra:bullet` and triggers expansion
- Pros: Native to BlockSuite, proper document structure
- Cons: More complex, new block type to maintain

### Option B: Inline Ghost UI in Bullet Block ✅ IMPLEMENTED
Add ghost suggestion rendering within `bullet-block.ts`:
- After real children, render ghost suggestion elements
- On click, create new real bullet + trigger expansion
- Pros: Simpler, contained within existing component
- Cons: Not actual blocks, may have positioning issues

### Recommended: Option B (Inline Ghost UI)
- Less architectural change
- Easier to iterate on UX
- Can upgrade to Option A later if needed

## Implementation Tasks

- [x] Remove or hide `GhostQuestions.tsx` component from bottom section
- [x] Add ghost bullet rendering in `bullet-block.ts` after children
- [x] Style ghost bullets: grey color, italic, subtle background, hover state
- [x] Wire click handler to:
  1. Create real `hydra:bullet` block with suggestion text
  2. Auto-trigger `hydra-expand-block` event for AI generation
- [x] Generate context-aware suggestions based on parent content
- [x] Handle loading state while AI generates children
- [x] Add dismiss/hide functionality for individual ghost suggestions

## Acceptance Criteria

- [x] Ghost bullets appear under parent bullets (not in separate section)
- [x] Ghost bullets are visually distinct (grey, faded appearance)
- [x] Clicking a ghost bullet converts it to a real bullet
- [x] After conversion, AI automatically generates children for the new bullet
- [x] Ghost suggestions are contextually relevant to parent content
- [x] Loading state shown during AI generation

## Files Modified

- `frontend/src/blocks/components/bullet-block.ts` - Added ghost bullet rendering, styling, and click handlers
- `frontend/src/components/Editor.tsx` - Removed GhostQuestions from bottom section
- `frontend/src/blocks/__tests__/bullet-block-component.test.ts` - Added 15 new tests for ghost bullet functionality

## Implementation Details

### Pure Logic Functions Added (bullet-block.ts:300-411)
- `GhostSuggestion` interface - Represents a ghost suggestion
- `GhostSuggestionContext` interface - Context for generating suggestions
- `GhostBulletVisibilityInput` interface - Input for visibility check
- `shouldShowGhostBullets()` - Determines if ghost bullets should be shown
- `generateGhostSuggestions()` - Generates suggestion questions based on context

### Component Methods Added (bullet-block.ts:3041-3184)
- `_handleGhostBulletClick()` - Converts ghost to real bullet and triggers AI expansion
- `_handleGhostBulletDismiss()` - Dismisses a ghost suggestion
- `_renderGhostBullets()` - Renders ghost bullet suggestions inline

### CSS Styles Added (bullet-block.ts:1079-1167)
- `.ghost-bullets-container` - Container for ghost bullets
- `.ghost-bullet` - Ghost bullet styling (opacity, hover effects)
- `.ghost-bullet-icon` - Grey bullet icon
- `.ghost-bullet-text` - Italic grey text styling
- `.ghost-bullet-dismiss` - Dismiss button
- `.ghost-bullet.loading` - Loading state with pulse animation

### State Variables Added (bullet-block.ts:1176-1186)
- `_dismissedGhostIds: Set<string>` - Tracks dismissed suggestions
- `_loadingGhostId: string | null` - Tracks loading ghost bullet

## E2E Test Scenarios

### Scenario 1: Ghost Bullet Visibility
1. Navigate to http://localhost:5173
2. Create a bullet with text "Machine learning applications"
3. Hover over the bullet
4. Verify: Ghost bullets appear below with grey text

### Scenario 2: Ghost Bullet Click
1. Click on a ghost bullet (e.g., "What are the key implications of this?")
2. Verify: Ghost bullet converts to real bullet
3. Verify: AI expansion event is dispatched

### Scenario 3: Ghost Bullet Dismiss
1. Hover over a ghost bullet
2. Click the X dismiss button
3. Verify: Ghost bullet is removed from list

### Scenario 4: Collapsed Block
1. Create a bullet with children
2. Collapse the bullet (click expand toggle)
3. Verify: Ghost bullets are NOT shown when collapsed

## Test Results

### Unit Tests: ✅ PASS
```
npm run test:run
Test Files: 59 passed (59)
Tests: 1310 passed (1310)
```

### Build: ✅ PASS
```
npm run build
✓ built in 6.66s
```

### Chrome E2E: 📋 PENDING
Chrome E2E testing requires manual verification:
- Frontend dev server running at http://localhost:5173
- Scenarios documented above ready for execution

## Dependencies

- EDITOR-3505 (Portal subtree editing) - Completed
- AI expansion functionality (useExpandBlock hook) - Exists

## Priority

Medium - UX improvement for AI-assisted note expansion

## Related

- `GhostQuestions.tsx` - Original implementation (now deprecated for this feature)
- `useExpandBlock.ts` - AI expansion hook
- `bullet-block.ts` - Bullet block component

## Status

🟢 **IMPLEMENTATION COMPLETE** - Ready for Chrome E2E testing and merge
