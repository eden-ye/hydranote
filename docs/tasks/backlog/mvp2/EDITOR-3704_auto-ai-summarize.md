# EDITOR-3704: Auto AI Summarize

## Summary
Automatically summarize bullets with >30 words into a short notation (<5 words). The notation appears before the dashing button, with original content after.

## Desired Behavior

### Auto-Summarization
When a bullet has >30 words:
1. AI generates a notation (key words, <5 words)
2. Layout: `• Notation — Original long content...`
3. Dashing button separates notation from original

### User Override
- User can click on notation to edit/replace it
- User's custom notation persists (not overwritten by AI)

### Configuration
- Feature can be enabled/disabled in settings
- Threshold configurable (default: 30 words)

### Cheat Sheet Behavior
- Cheat sheet by default hides children bullets >10 words
- Only shows notation/short content in cheat sheet view

## Acceptance Criteria
- [ ] Bullets >30 words auto-generate notation
- [ ] Notation is <5 words (key words/concepts)
- [ ] Dashing button between notation and original
- [ ] User can replace AI notation with custom text
- [ ] Feature toggle in settings panel
- [ ] Cheat sheet hides children >10 words by default
- [ ] Works with existing AI service

## Technical Notes
- Use existing Claude API integration
- Cache notations to avoid repeated API calls
- Debounce to avoid API spam while typing

## Files to Modify
- `frontend/src/blocks/components/bullet-block.ts` - Notation rendering
- `frontend/src/stores/editor-store.ts` - Settings state
- `frontend/src/components/SettingsModal.tsx` - Toggle setting

## Dependencies
- Existing AI generation infrastructure (Tab trigger)

## Estimate
8 hours

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP2 - AI Features
