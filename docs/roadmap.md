# Hydra Notes: Development Roadmap

## Project Overview

A cognitive scaffolding tool that respects human working memory limits. Transform single sentences into structured, multi-level notes with AI assistance.

**Core Philosophy**: Human brain cache is limited and single-thread. Logic jumps from 1 notation → 3-5 keywords → further. This app uses folding, inline details, and information limits to reduce cognitive load.

---

## Phase 1: Project Setup ✅
- [x] Initialize monorepo structure
- [x] Set up React + Vite + TypeScript
- [x] Set up FastAPI project
- [x] Create Supabase projects (SAT + Prod)
- [x] Initialize Bruno collections
- [x] Set up Docker Compose

## Phase 2: Core Editor (Current)
- [ ] Integrate BlockSuite basic editor
- [ ] Create bullet block schema
- [ ] Implement folding/collapsing
- [ ] Implement computed inline detail view
- [ ] Set up IndexedDB persistence
- [ ] Add keyboard shortcuts

## Phase 3: Authentication
- [ ] Supabase Auth integration
- [ ] Google OAuth flow
- [ ] JWT middleware in FastAPI
- [ ] Rate limiting table + service

## Phase 4: AI Integration
- [ ] Claude API service with streaming
- [ ] WebSocket endpoint
- [ ] Spotlight modal (Ctrl+P)
- [ ] Expand button (→) logic
- [ ] Ghost questions in focus mode

## Phase 5: Focus Mode
- [ ] Focus mode navigation
- [ ] Breadcrumb component
- [ ] Ghost question rendering

## Phase 6: Polish & Deploy
- [ ] Marker block styling
- [ ] Rate limit UI
- [ ] Error handling
- [ ] Docker production config
- [ ] Final E2E testing

---

## Future Phases

### MVP2
- Custom marker colors
- Two-panel layout (keywords + details)
- Auto-connect to existing notes (semantic linking)
- AI content visual distinction

### MVP3
- CRDT sync (multi-device)
- Real-time collaboration
- Conflict resolution
