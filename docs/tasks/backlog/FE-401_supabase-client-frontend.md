# FE-401: Supabase Client (Frontend)

## Description
Initialize Supabase client in the frontend. Set up authentication methods and session management.

## Acceptance Criteria
- [ ] Supabase client in `frontend/src/services/supabase.ts`
- [ ] Client uses anon key from environment
- [ ] Auth methods exported (signIn, signOut, getSession)
- [ ] Session listener for auth state changes
- [ ] TypeScript types for user

## Dependencies
- None (foundation for frontend auth)

## Parallel Safe With
- AUTH-*, API-*, EDITOR-*

## Notes
- @supabase/supabase-js already installed
- Use VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Frontend uses anon key (not service key)

## Status
- **Created**: 2025-01-09
- **Status**: pending
- **Phase**: 3
