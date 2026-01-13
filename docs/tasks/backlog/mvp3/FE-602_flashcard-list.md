# FE-602: Flashcard List

## Summary
New list in left panel showing folded bullets with children/descriptors, sorted by last flashcard timestamp (least recently reviewed first).

## Desired Behavior

### List Contents
Only bullets that:
- Have children bullets OR descriptors
- Are currently folded (collapsed)

### Sorting
Ascending by last flashcard timestamp (oldest first = needs review)

### Flashcard Behaviors (update timestamp)
- Fold then expand a bullet (counts as 1 flashcard)
- Click dashing button twice (hide then show = 1 flashcard)

### Marking
- Users can mark bullets for the flashcard list (similar to favorites)
- Marking button appears on right of each item
- Only marked items appear in this list

## Acceptance Criteria
- [ ] New "Flashcard" section in left panel
- [ ] Shows only bullets with children/descriptors
- [ ] Sorted by last flashcard timestamp ascending
- [ ] Fold+expand updates timestamp
- [ ] Double dashing click updates timestamp
- [ ] Marking button to add/remove from list
- [ ] List is collapsible (folded by default)

## Technical Notes
- New state: `flashcardBlockIds: string[]`
- New state: `flashcardTimestamps: Map<string, number>`
- Persist to localStorage

## Future Enhancement
Will become spaced repetition system in later MVP (add priority, score, intervals).

## Estimate
8 hours

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Learning Features
