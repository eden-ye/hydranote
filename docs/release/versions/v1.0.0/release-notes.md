# Release Notes: v1.0.0 - Foundation

**Released**: 2026-01-11
**Status**: Production

## Summary

Foundation release of Hydra Notes - AI-powered hierarchical note-taking application.

## Features

### Editor Core (EDITOR-301 to EDITOR-307)
- BlockSuite-based hierarchical editor
- Bullet block schema with folding support
- Inline detail view
- IndexedDB persistence with Y-indexeddb
- Editor store with document/selection state

### Keyboard Behaviors (EDITOR-3051 to EDITOR-3063)
- Enter: create sibling, split text, create first child
- Backspace: merge with previous, visual hierarchy handling
- Delete: merge with next, unindent children
- Arrow keys: standard text navigation
- Cmd+Enter: toggle fold
- Cmd+B/I/U: inline formatting

### Authentication (AUTH-101 to AUTH-104)
- Supabase backend client
- JWT middleware
- Google OAuth
- Rate limiting

### API Services (API-200 to API-205)
- Claude AI service integration
- Prompt builder
- WebSocket streaming
- Generate/Expand endpoints

### Frontend Integration (FE-401 to FE-409)
- Supabase client frontend
- Auth store
- Login UI
- Spotlight with AI generation count
- Focus mode
- Breadcrumb navigation
- Expand button
- Ghost questions

### Infrastructure (INFRA-001, INFRA-501)
- SAT/PROD deployment separation
- CI/CD pipeline

### Portal Foundation (EDITOR-3401 to EDITOR-3403)
- Portal block schema
- Portal rendering
- Live sync with Yjs

### Color Palette (EDITOR-3101)
- 6 semantic colors defined
- CSS data-v-highlight support

## Tickets Included

45+ tickets from MVP1 development. See `docs/tasks/done/` for full list.
