# EDITOR-3201: Descriptor Block Schema

## Description
Create the data model for descriptors - pseudo-child bullets that categorize content (What, Why, How, Pros, Cons).

## Acceptance Criteria
- [ ] Descriptor stored as special child bullet with `isDescriptor: true` flag
- [ ] Descriptor has `descriptorType` field (what, why, how, pros, cons, custom)
- [ ] Render with `|` prefix visual indicator
- [ ] Descriptor children are regular bullets (actual content)
- [ ] Support custom descriptor types (user-defined)

## Technical Details
```typescript
interface DescriptorProps {
  isDescriptor: boolean;
  descriptorType: 'what' | 'why' | 'how' | 'pros' | 'cons' | 'custom';
  descriptorLabel?: string; // For custom types
}
```
- Extends existing bullet block schema
- Visual rendering: `| What is it` with pipe prefix
- Descriptors behave like bullets but with special styling

## Dependencies
- None (foundation ticket)

## Parallel Safe With
- API-*, AUTH-*, FE-*

## Notes
Part of Epic 2: Descriptor System. This is the foundation for cheatsheet and auto-generation features.

## Status
- **Created**: 2026-01-10
- **Status**: pending
- **Epic**: MVP2 - Descriptor System
