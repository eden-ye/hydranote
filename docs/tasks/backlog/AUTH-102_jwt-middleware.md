# AUTH-102: JWT Middleware

## Description
Implement JWT verification middleware for FastAPI. Validate Supabase JWT tokens on protected routes.

## Acceptance Criteria
- [ ] JWT middleware in `backend/app/middleware/auth.py`
- [ ] Verifies Supabase JWT tokens
- [ ] Extracts user info from token
- [ ] Dependency injection for protected routes
- [ ] Returns 401 for invalid/missing tokens
- [ ] Tests for valid and invalid tokens

## Dependencies
- AUTH-101 (Supabase Client Backend)

## Parallel Safe With
- EDITOR-*, FE-*

## Notes
- python-jose already installed
- JWT secret from Supabase project settings
- Token contains user ID and email

## Status
- **Created**: 2025-01-09
- **Status**: pending
- **Phase**: 3
