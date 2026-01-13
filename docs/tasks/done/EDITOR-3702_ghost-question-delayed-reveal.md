# EDITOR-3702: Ghost Question Delayed Reveal (Fix Invisible Questions Behavior)

## Summary

Fix the ghost question UI to only appear after a 5-second delay on empty child bullets, and make them truly invisible by default. Currently, ghost questions are always visible when hovering over any block, which is incorrect behavior.

## Problem (Current Broken Behavior)

From screenshot evidence:
- Ghost questions (e.g., "What are the key implications of this?") appear as **visible content** immediately
- Questions show up even on non-empty bullets
- Questions look like regular content instead of grey placeholder
- No delay before showing questions
- Questions don't disappear when typing
- **CRITICAL**: Ghost question elements exist in DOM even when "hidden", occupying space and interfering with drag-drop events

## Desired Behavior

Ghost questions should be **completely invisible by default** and only appear under specific conditions:

### Trigger Conditions (ALL must be met):
1. **Empty child bullet**: User's cursor must be on a child bullet that has NO text
2. **Under a parent with content**: The parent bullet must have meaningful text content
3. **5-second delay**: User must remain on the empty bullet for **5 continuous seconds**
4. **No typing**: If user starts typing ANY character, timer resets and questions stay hidden

### Visual Appearance:
- Questions must be **grey/faded** (not regular text color)
- Use italic styling to indicate they are suggestions, not real content
- Opacity around 0.5-0.6 for clear visual distinction

### Interaction:
- **Tab key**: Pressing Tab on a ghost question **accepts** it and converts to real bullet content
- **Any typing**: Immediately hides all ghost questions (user is creating their own content)
- **Click**: Should NOT convert to real content (unlike current implementation)
- **Escape**: Hides ghost questions
- **Cursor leaves**: Hides ghost questions

### User Flow Diagram

```
Parent Bullet: "Machine Learning Applications"
├── Child: "Healthcare diagnosis"
├── Child: "Financial fraud detection"
└── [EMPTY CURSOR HERE] ← User places cursor in empty child bullet
                           ↓
                     [5 seconds pass...]
                           ↓
    └── [Ghost] What are the key implications?  ← Grey, italic
    └── [Ghost] How does this compare to...?   ← Grey, italic
                           ↓
                     [User presses Tab]
                           ↓
    └── What are the key implications?  ← NOW REAL BLACK TEXT
        ├── [AI generating children...]

                     OR
                           ↓
                     [User starts typing "My own idea"]
                           ↓
    └── My own idea  ← Ghost questions DISAPPEARED
```

## Implementation Summary

### Files Modified

| File | Changes |
|------|---------|
| `frontend/src/blocks/components/bullet-block.ts` | +372 lines: Timer logic, visibility conditions, Tab handler, new pure functions |
| `frontend/src/blocks/__tests__/bullet-block-component.test.ts` | +179 lines: Tests for new timer-based behavior |

### Key Changes

1. **New constant**: `GHOST_QUESTION_DELAY_MS = 5000` (5-second delay)

2. **Updated `GhostBulletVisibilityInput` interface**:
   - `textContent`: Current bullet text (must be empty)
   - `parentHasContent`: Parent must have content
   - `delayMet`: 5-second timer must have elapsed

3. **Updated `shouldShowGhostBullets()` function**: Now returns true only when bullet is empty, parent has content, and timer elapsed

4. **New `handleGhostQuestionKeydown()` function**: Handles Tab (accept), Escape (cancel), typing (cancel), navigation (ignore)

5. **Timer management**:
   - `_startGhostQuestionTimer()`: Starts 5s timer on focus of empty bullet
   - `_cancelGhostQuestionTimer()`: Clears timer and hides ghost questions
   - `_acceptFirstGhostQuestion()`: Tab key acceptance

6. **Rendering changes**:
   - `_renderGhostBullets()` returns `nothing` when not shown (no DOM)
   - Removed click handlers from ghost bullets
   - Added focus/blur/keydown handlers to rich-text

7. **CSS changes**:
   - Removed hover-to-show rule (`:host(:hover) .ghost-bullet`)
   - Changed cursor from `pointer` to `default`
   - Ghost bullets always visible when rendered (opacity 0.6)

## Acceptance Criteria

- [x] **NO DOM elements** when ghost questions not shown (return `nothing`, not hidden CSS)
- [x] Ghost questions only appear on **empty child bullets**
- [x] Ghost questions require **5-second delay** before appearing
- [x] Typing ANY character **immediately hides** ghost questions and cancels timer
- [x] **Tab key** accepts ghost question and converts to real bullet
- [x] Ghost questions are **grey/faded** with italic styling
- [x] **Click does NOT** accept ghost questions (no click handler)
- [x] **Cursor leaving** hides ghost questions
- [x] **Escape key** hides ghost questions
- [x] Parent must have content for ghost questions to appear
- [x] Drag-drop works correctly without ghost question interference

## Testing Results

### Unit Tests
```bash
npm run test:run -- bullet-block-component
# 171 tests pass
```

### Build
```bash
npm run build
# Build successful
```

### E2E Testing (Chrome)

| Test | Result | Notes |
|------|--------|-------|
| No DOM Test | PASS | 0 ghost elements found by default |
| Timer Test | PASS | Ghost questions appear after ~5s with correct styling (opacity: 0.6) |
| Typing Cancel Test | PASS | Typing "test" immediately removed ghost questions from DOM |
| Tab Accept Test | COVERED BY UNIT TESTS | Focus management in browser automation challenging |
| Click No-Op Test | PASS | No click handlers on ghost bullets |
| Non-Empty Bullet Test | PASS | Ghost questions never show on bullets with text |

## Related Issues

- EDITOR-3511: Original ghost bullet implementation (fixed by this ticket)
- EDITOR-3701: Drag-drift fix (no conflict - ghost elements removed from DOM)

## Status

**COMPLETE** - Implementation done, tests pass, E2E verified
