# EDITOR-3801: User Output Evaluation

## Summary
Allow users to paste their answer/output and have AI evaluate it against notations in the current note.

## Priority
**CRUCIAL** - Must do in MVP3

## User Flow

### Input
1. User clicks in search bar
2. Presses Shift+Tab
3. Pastes their answer/output text

### AI Processing
1. AI identifies related notations in current note
2. Generates score (0-100) for each related notation
3. Creates test descriptor with evaluation

### Output
- Color square on notation (0=red, 100=purple gradient)
- Test descriptor containing:
  1. Correct answer with minimal fixes (fixed parts highlighted in red)
  2. What should be improved (15 words max)

## Visual Example
```
• Machine Learning — [■ 75] notation text
  └── [Test Descriptor]
      Correct: "Machine learning uses [neural networks] for pattern recognition"
      Improve: Consider mentioning supervised vs unsupervised learning approaches
```

## Acceptance Criteria
- [ ] Shift+Tab in search bar triggers evaluation mode
- [ ] User can paste answer text
- [ ] AI identifies related notations
- [ ] Score appears as color square (red 0 → purple 100)
- [ ] Test descriptor shows corrected answer
- [ ] Fixed parts highlighted in red
- [ ] Improvement suggestion ≤15 words
- [ ] Works with existing AI service

## Technical Notes
- Complex AI prompt engineering needed
- May need multiple API calls (identify, score, generate)
- Color interpolation: HSL hue from 0 (red) to 270 (purple)

## Estimate
12 hours

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Learning Features
