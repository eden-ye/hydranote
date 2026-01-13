# FE-507: New User Onboarding Page

## Summary
Create a default editorial page shown to new users (no localStorage) that demonstrates all main features.

## Detection
- Check if `hydranote` localStorage key exists
- If not, show onboarding page instead of empty editor
- After user interacts, set flag to not show again

## Features to Demonstrate

### Block Types
- Checkbox (`- [ ]`)
- Numbered list (`1.`)
- Regular bullet

### Navigation
- Zoom in/out (focus mode)
- Expand/fold bullets

### Cheat Sheet Features
- Dashing button (—)
- Hiding content in cheat sheet
- Inline preview toggle

### AI Features
- Tab to generate children
- Ghost bullet suggestions

## Content Structure
```
Welcome to Hydra Notes
├── Getting Started
│   ├── [ ] Try checking this checkbox
│   ├── 1. This is a numbered list
│   └── Regular bullet point
├── Navigation — click to zoom in
│   ├── Click the bullet to zoom in
│   └── Use breadcrumb to zoom out
├── Cheat Sheet Mode
│   ├── The dashing button — hides content
│   └── Click dash to toggle
└── AI Features
    ├── Press Tab at end of bullet to generate
    └── Ghost bullets suggest new ideas
```

## Acceptance Criteria
- [ ] Onboarding page shows for new users (no localStorage)
- [ ] Demonstrates all main features listed above
- [ ] Interactive - user can try features
- [ ] Sets flag after first interaction (don't show again)
- [ ] Can be re-accessed from settings/help

## Files to Create/Modify
- `frontend/src/components/OnboardingPage.tsx` (new)
- `frontend/src/components/Editor.tsx` (conditional render)
- `frontend/src/utils/onboarding.ts` (detection logic)

## Estimate
6 hours

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP2 - Onboarding
