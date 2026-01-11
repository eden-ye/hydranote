# EDITOR-3202: Descriptor Repository

## Description
Implement the repository of available descriptors for autocomplete suggestions.

## Acceptance Criteria
- [ ] Default descriptors: What, Why, How, Pros, Cons
- [ ] Store descriptors in a retrievable format
- [ ] API to list available descriptors
- [ ] Support for future user-defined descriptors (extensible design)
- [ ] Descriptors have display label and internal key

## Technical Details
```typescript
interface Descriptor {
  key: string;           // 'what', 'why', 'how', 'pros', 'cons'
  label: string;         // 'What is it', 'Why it matters', etc.
  shortLabel: string;    // 'What', 'Why', 'How', 'Pros', 'Cons'
  autoColor?: string;    // For cheatsheet: 'green' for pros, 'red' for cons
}
```
- Store in Zustand store or constant file (for now)
- Future: user preferences stored in IndexedDB/Supabase

## Dependencies
- EDITOR-3201: Descriptor Block Schema

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Part of Epic 2: Descriptor System

## Status
- **Created**: 2026-01-10
- **Status**: pending
- **Epic**: MVP2 - Descriptor System
