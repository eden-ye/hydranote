# Hydra Notes: Development Roadmap

## Project Overview

A cognitive scaffolding tool that respects human working memory limits. Transform single sentences into structured, multi-level notes with AI assistance.

**Core Philosophy**: Human brain cache is limited and single-thread. Logic jumps from 1 notation → 3-5 keywords → further. This app uses folding, inline details, and information limits to reduce cognitive and reading load. And Organize AI's output with user's output to build their own Knowledge graph.

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
- [ ] Expand button (→) logic (Default open/closed is configurable in setting panel)
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

### MVP2 (23 tickets across 6 epics)

**Epic 1: Background Coloring** (3 tickets)
- EDITOR-3101: Color Palette System
- EDITOR-3102: Keyboard Shortcuts (Cmd+Alt+3-9)
- EDITOR-3103: Context Menu Color Picker

**Epic 2: Descriptor System** (4 tickets)
- EDITOR-3201: Descriptor Block Schema (|What, |Why, |How, |Pros, |Cons)
- EDITOR-3202: Descriptor Repository
- EDITOR-3203: Descriptor Autocomplete UI (~trigger)
- EDITOR-3204: Descriptor Selection & Insertion

**Epic 3: Cheatsheet** (4 tickets)
- EDITOR-3301: Cheatsheet Rendering Engine
- EDITOR-3302: Cheatsheet Auto-Colors (Pros=green, Cons=red)
- EDITOR-3303: Descriptor Visibility Toggle (eye icon)
- EDITOR-3304: Cheatsheet Separator Styling (=> | vs.)

**Epic 4: Portal** (5 tickets) - *pulled from MVP4*
- EDITOR-3401: Portal Block Schema
- EDITOR-3402: Portal Rendering (cool border)
- EDITOR-3403: Live Sync (Source → Portal)
- EDITOR-3404: Portal Editing (Portal → Source)
- EDITOR-3405: Portal Creation UI

**Epic 5: Semantic Linking** (4 tickets)
- API-301: Embedding/Vector Storage Setup
- API-302: Semantic Search Endpoint
- EDITOR-3501: Auto-Connect on AI Generation
- FE-501: Semantic Linking Settings

**Epic 6: Auto AI Generation** (3 tickets)
- EDITOR-3601: Tab Trigger at Deepest Level
- EDITOR-3602: Auto-Generate After Descriptor
- FE-502: Auto-Generation Settings

### MVP3
- CRDT sync (multi-device)
- Conflict resolution
- Multi-model AI generation
- Reference/double link

### MVP4
- Cross-document portals (MVP2 portal is same-document only)
- Portal merging into same bullet

### MVP5
- Real-time collaboration
- AI content visual distinction

## Key Features
- AI generation + being re-organized with existing note
  - How do I do AI generation and link to existing note?
    - Auto re-organize with existing note
      - Semantically search existing note with limit on depth
      - Send to AI with prompt
    - (MVP4) Merging into same bullet (High risk, need to do it separately)
- Folding as cheatsheet
    - How to balance the right side of bullet
      - In my design, when folded, this is a cheatsheet
      - "What is it" is still necessary
      - User can choose what can be shown and what cannot be
      - images are never shown
      - Use | to devide each descriptor
      - Use vs. if have both pros and cons
      - Use static background color to color the certain descriptor, like green for pros, red for cons
- Auto-complete descriptor + Auto AI generation
  - How do I smoothly design this AI generation process
    - (MVP4) User hit Ctrl+Enter on a bullet, then bullet will expand and auto generate based on Top 3 descriptor ---- how do we determine top 3 descriptor? Firstly it would be a call to AI
    - (MVP2) Need a repo of descriptor. After user typing, Hydra will based on the father of descriptor to auto generate 1-5 bullets about concise key points
      - What is it
      - How it works
      - What makes it different
      - ...
- Multi-model AI generation
  - How do I generate multi-model content
    - I just need to find an image, and some links. That's it
    - In the future we can think of code block
- Portal
- Reference/double link





