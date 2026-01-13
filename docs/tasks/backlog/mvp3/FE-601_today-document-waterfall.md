# FE-601: Today Document Waterfall

## Summary
Create a special "Today" document that shows portals for all bullets updated or created today.

## Priority
**CRUCIAL** - Must do in MVP3

## Desired Behavior

### Auto-Population
- Every bullet created or updated today appears as a portal in Today document
- Portals are automatically added as changes happen
- Shows waterfall of activity for the day

### Deduplication
If a new portal would be within 4 levels of an existing portal in Today:
- Skip adding the new portal
- Prevents redundant context

### Layout
```
Today (2026-01-13)
├── [Portal] Updated bullet about AI
├── [Portal] New meeting notes
├── [Portal] Modified project plan
└── ...
```

## Acceptance Criteria
- [ ] Today document auto-creates on first edit of day
- [ ] All created/updated bullets appear as portals
- [ ] Dedup: skip portals within 4 levels of existing
- [ ] Updates in real-time as user works
- [ ] Previous days' documents remain accessible
- [ ] Portals link to source bullets

## Technical Notes
- Track lastModified timestamp on blocks
- Daily document naming: `Today (YYYY-MM-DD)`
- May need background observer for real-time updates

## Estimate
10 hours

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Daily Review
