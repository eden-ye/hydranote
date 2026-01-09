# AUTH-104: Rate Limiting (Redis)

## Description
Implement rate limiting for AI generation endpoints using Redis. Track user's AI generation count.

## Acceptance Criteria
- [ ] Redis client initialized in `backend/app/services/redis.py`
- [ ] Rate limiter middleware/dependency
- [ ] Track generations per user (50 limit)
- [ ] Return 429 when limit exceeded
- [ ] Increment atomic counter in user_profiles table
- [ ] Tests for rate limiting logic

## Dependencies
- AUTH-101 (Supabase Client Backend)

## Parallel Safe With
- AUTH-102, AUTH-103, EDITOR-*, FE-*

## Notes
- redis package already installed
- 50 generations per user (free tier)
- Counter in user_profiles.ai_generations_used
- Use increment_ai_generation() Supabase function

## Status
- **Created**: 2025-01-09
- **Status**: pending
- **Phase**: 3
