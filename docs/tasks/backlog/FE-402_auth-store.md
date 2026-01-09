# FE-402: Auth Store (Zustand)

## Description
Create Zustand store for authentication state. Track current user, session, and auth loading state.

## Acceptance Criteria
- [ ] Store in `frontend/src/stores/auth-store.ts`
- [ ] Track current user object
- [ ] Track session state
- [ ] Track loading/initializing state
- [ ] Actions: setUser, clearUser, initialize
- [ ] React hooks for accessing auth state

## Dependencies
- FE-401 (Supabase Client Frontend)

## Parallel Safe With
- AUTH-*, API-*, EDITOR-*

## Notes
- Zustand already installed
- Sync with Supabase auth state changes
- Used by protected routes and components

## Status
- **Created**: 2025-01-09
- **Status**: pending
- **Phase**: 3
