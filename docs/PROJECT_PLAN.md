# Hydra Notes: AI-Powered Hierarchical Note-Taking App

## Project Overview

A cognitive scaffolding tool that respects human working memory limits. Transform single sentences into structured, multi-level notes with AI assistance.

**Core Philosophy**: Human brain cache is limited and single-thread. Logic jumps from 1 notation → 3-5 keywords → further. This app uses folding, inline details, and information limits to reduce cognitive load.

---

## Quick Links

- [MVP1 Features](#mvp1-feature-specification)
- [Technical Architecture](#technical-architecture)
- [Testing Loop](#testing-loop-tdd-workflow)
- [Environment Setup](#environment-configuration)
- [Implementation Order](#implementation-order)

---

## MVP1 Feature Specification

### 1. Outline Editor (BlockSuite-based)

**Bullet Structure**:
- Each bullet limited to ~20 words (soft limit, AI-guided)
- Folding/collapsing with triangle markers (▶/▼)
- Hierarchical nesting (1-5 levels)

**Inline Detail Display** (Computed UI View):
```
Collapsed view: "Cache => Sets + Lines + Tags"
                 ↑ keyword   ↑ children's text joined by separator

Expanded view:
  - Cache
    - Sets
    - Lines
    - Tags
```

**Key clarification**: The `=> Children` suffix is a **UI-computed display**, NOT stored data.
- Children bullets always exist in the data model
- Collapse/expand is a UI toggle only
- Separator (` + `, `, `, ` | `) is user-configurable
- No block creation/deletion on toggle

**Bullet Data Model**:
```typescript
{
  text: string;                    // "Cache"
  isCollapsed: boolean;            // UI state
  lastExpandTimestamp: number;     // For analytics
  collapsedSeparator: string;      // " + " | ", " | " | "
  children: Bullet[];              // Always exist, visibility toggled
}
```

**Focus Mode**:
- Click any bullet to make it the "root" (zoom in)
- Breadcrumb navigation to go back up the hierarchy
- Only focused bullet's subtree is visible

**Special Marker Blocks**:
- `%Template`, `%Visualization`, etc. as visual markers
- Auto-colored (distinct colors per marker type)
- Configurable marker types
- No special behavior in MVP1 (just visual distinction)

### 2. AI Structure Generation

**Spotlight Command (Ctrl+P)**:
- Elegant overlay input box (like macOS Spotlight)
- Type a sentence → AI generates 1-5 level hierarchical structure
- Streaming response with smooth animation

**Expand Button (→)**:
- Each bullet has a hover-visible "→" button
- If children exist: expand/show children
- If no children: AI generates deeper content

**Ghost Questions (Focus Mode Only)**:
- 3 grey/shadow bullets appear as children in focus view
- Inspiring questions to prompt deeper thinking
- Not visible in normal (non-focus) view
- Positioned like normal bullets but visually distinct

### 3. Authentication & Rate Limiting

**Google OAuth** (via Supabase Auth):
- Login via Google account
- JWT tokens for session management

**Free Tier**:
- 50 total AI API calls per user (lifetime limit for MVP1)
- Counter displayed in UI
- Graceful handling when limit reached

### 4. Data Storage

**Supabase (Cloud PostgreSQL)**:
- Two separate projects for SAT/Prod isolation
- User data, rate limiting, note metadata
- Row-level security enabled

**Local-First (IndexedDB)**:
- Note content stored in browser via y-indexeddb
- Works offline
- Zero-lag editing (no network round-trip)
- Sync to Supabase for backup (future)

---

## Technical Architecture

### Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Editor | BlockSuite (custom blocks) |
| State | Zustand |
| Styling | Tailwind CSS |
| Backend | FastAPI (Python 3.12+) |
| AI | Claude API (Anthropic) |
| Realtime | WebSocket (streaming) |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase PostgreSQL (SAT + Prod) |
| Local Storage | IndexedDB (y-indexeddb) |
| API Testing | Bruno (CLI + collections) |
| E2E Testing | Claude-in-Chrome MCP |
| Unit Testing | pytest + vitest |
| Deploy | Docker Compose |

### Project Structure

```
/hydra
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/
│   │   │   │   ├── EditorContainer.tsx
│   │   │   │   ├── BulletBlock.tsx
│   │   │   │   ├── InlineDetailView.tsx
│   │   │   │   ├── Breadcrumb.tsx
│   │   │   │   └── GhostQuestion.tsx
│   │   │   ├── spotlight/
│   │   │   │   └── SpotlightModal.tsx
│   │   │   └── auth/
│   │   │       └── LoginButton.tsx
│   │   ├── blocks/
│   │   │   ├── schemas/
│   │   │   │   └── bullet-block-schema.ts
│   │   │   ├── services/
│   │   │   │   └── bullet-block-service.ts
│   │   │   └── specs/
│   │   │       └── bullet-block-spec.ts
│   │   ├── stores/
│   │   │   ├── editor-store.ts
│   │   │   ├── auth-store.ts
│   │   │   └── ai-store.ts
│   │   ├── hooks/
│   │   │   ├── useBlockSuite.ts
│   │   │   ├── useAIGeneration.ts
│   │   │   └── useFocusMode.ts
│   │   ├── services/
│   │   │   ├── supabase-client.ts
│   │   │   ├── websocket-client.ts
│   │   │   └── storage-service.ts
│   │   └── __tests__/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── stores/
│   ├── package.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   └── Dockerfile
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py
│   │   │   │   ├── ai.py
│   │   │   │   └── user.py
│   │   │   └── websockets/
│   │   │       └── ai_stream.py
│   │   ├── services/
│   │   │   ├── ai_service.py
│   │   │   ├── rate_limiter.py
│   │   │   └── prompt_builder.py
│   │   └── models/
│   │       ├── user.py
│   │       └── schemas.py
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_ai.py
│   │   └── test_rate_limiter.py
│   ├── requirements.txt
│   ├── pytest.ini
│   └── Dockerfile
│
├── bruno/
│   ├── collections/
│   │   ├── auth/
│   │   │   ├── google-login.bru
│   │   │   └── me.bru
│   │   ├── ai/
│   │   │   ├── generate-structure.bru
│   │   │   └── expand-bullet.bru
│   │   └── user/
│   │       └── get-limits.bru
│   ├── environments/
│   │   ├── local.bru
│   │   ├── sat.bru
│   │   └── prod.bru
│   └── bruno.json
│
├── e2e/
│   ├── expectations/
│   │   ├── editor-basic.md
│   │   ├── focus-mode.md
│   │   ├── ai-generation.md
│   │   └── auth-flow.md
│   └── results/
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── TESTING.md
│   └── DEPLOYMENT.md
│
├── docker-compose.yml
├── docker-compose.sat.yml
├── .env.example
├── .env.local
├── .env.sat
└── .env.prod
```

---

## Testing Loop (TDD Workflow)

### Automated Testing Pipeline

For each task/feature, Claude executes this sequence automatically:

```
┌─────────────────────────────────────────────────────────────┐
│  1. BEFORE CODING                                           │
├─────────────────────────────────────────────────────────────┤
│  □ Write unit tests (pytest/vitest)                         │
│  □ Check Bruno collection for related endpoints             │
│    → If missing: create .bru file with request + assertions │
│  □ Write Chrome E2E expectation (markdown in e2e/expectations/) │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. IMPLEMENTATION                                          │
├─────────────────────────────────────────────────────────────┤
│  □ Write code to make tests pass                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. UNIT TESTS                                              │
├─────────────────────────────────────────────────────────────┤
│  $ pytest backend/tests/ -v                                 │
│  $ npm run test --prefix frontend                           │
│  → Must pass before continuing                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. BUILD                                                   │
├─────────────────────────────────────────────────────────────┤
│  $ npm run build --prefix frontend                          │
│  $ docker build -t hydra-backend ./backend                  │
│  → Must succeed before continuing                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. BRUNO API TESTS                                         │
├─────────────────────────────────────────────────────────────┤
│  $ bru run bruno/collections --env local                    │
│  → Validates all API endpoints                              │
│  → Checks response codes + body assertions                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  6. CHROME E2E (via Claude-in-Chrome MCP)                   │
├─────────────────────────────────────────────────────────────┤
│  □ Open app in Chrome                                       │
│  □ Execute test scenarios from e2e/expectations/            │
│  □ Verify UI renders correctly                              │
│  □ Check for visual regressions                             │
│  □ Validate user flows work end-to-end                      │
│  → Screenshot evidence saved to e2e/results/                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  7. COMMIT (only after all tests pass)                      │
├─────────────────────────────────────────────────────────────┤
│  $ git add -A                                               │
│  $ git commit -m "feat: [description]"                      │
│  → Auto-continue to next task                               │
└─────────────────────────────────────────────────────────────┘
```

### Bruno Collection Structure

```
bruno/collections/
├── auth/
│   ├── google-login.bru        # GET /api/auth/google/login
│   └── me.bru                  # GET /api/auth/me
├── ai/
│   ├── generate-structure.bru  # POST /api/ai/generate
│   └── expand-bullet.bru       # POST /api/ai/expand
└── user/
    └── get-limits.bru          # GET /api/user/limits
```

**Example Bruno file** (`bruno/collections/ai/generate-structure.bru`):
```
meta {
  name: Generate Structure
  type: http
  seq: 1
}

post {
  url: {{baseUrl}}/api/ai/generate
  body: json
  auth: bearer
}

auth:bearer {
  token: {{accessToken}}
}

body:json {
  {
    "input_text": "Explain how CPU caching works",
    "max_levels": 3
  }
}

assert {
  res.status: eq 200
  res.body.bullets: isArray
  res.body.bullets[0].text: isString
}
```

### E2E Expectation Format

**Example** (`e2e/expectations/editor-basic.md`):
```markdown
# Editor Basic Functionality

## Test: Create and fold bullets

### Steps:
1. Navigate to http://localhost:5173
2. Click in editor area
3. Type "Test bullet"
4. Press Enter
5. Press Tab (indent)
6. Type "Child bullet"
7. Click fold icon on parent

### Expected:
- [ ] Parent bullet shows "Test bullet"
- [ ] Child bullet is hidden after fold
- [ ] Fold icon changes from ▼ to ▶
- [ ] No console errors

### Selector hints:
- Editor: [data-testid="editor-container"]
- Bullet: [data-block-type="hydra:bullet"]
- Fold icon: .bullet-marker
```

---

## Environment Configuration

### Supabase Setup (SAT vs Prod)

| Environment | Supabase Project | Purpose |
|-------------|-----------------|---------|
| Local | N/A (mock or SAT) | Development |
| SAT | `hydranote-sat` | Staging/testing |
| Prod | `hydranote-prod` | Production |

### Environment Variables

**.env.local**:
```bash
# Local development
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# Backend
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
ANTHROPIC_API_KEY=sk-ant-xxx
JWT_SECRET=dev-secret
```

**.env.sat**:
```bash
# SAT environment
VITE_SUPABASE_URL=https://hydranote-sat.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_API_URL=https://api-sat.hydranote.app
VITE_WS_URL=wss://api-sat.hydranote.app

SUPABASE_URL=https://hydranote-sat.supabase.co
SUPABASE_SERVICE_KEY=xxx
ANTHROPIC_API_KEY=sk-ant-xxx
JWT_SECRET=sat-secret
```

**.env.prod**:
```bash
# Production environment
VITE_SUPABASE_URL=https://hydranote-prod.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_API_URL=https://api.hydranote.app
VITE_WS_URL=wss://api.hydranote.app

SUPABASE_URL=https://hydranote-prod.supabase.co
SUPABASE_SERVICE_KEY=xxx
ANTHROPIC_API_KEY=sk-ant-xxx
JWT_SECRET=prod-secret-rotated
```

### Docker Compose

**docker-compose.yml** (local dev):
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env.local
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    env_file: .env.local
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev -- --host

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

## Implementation Order

### Phase 1: Project Setup ✅
1. [x] Initialize monorepo structure
2. [x] Set up React + Vite + TypeScript
3. [x] Set up FastAPI project
4. [x] Create Supabase projects (SAT + Prod)
5. [x] Initialize Bruno collections
6. [x] Set up Docker Compose

### Phase 2: Core Editor
7. [ ] Integrate BlockSuite basic editor
8. [ ] Create bullet block schema
9. [ ] Implement folding/collapsing
10. [ ] Implement computed inline detail view
11. [ ] Set up IndexedDB persistence
12. [ ] Add keyboard shortcuts

### Phase 3: Authentication
13. [ ] Supabase Auth integration
14. [ ] Google OAuth flow
15. [ ] JWT middleware in FastAPI
16. [ ] Rate limiting table + service

### Phase 4: AI Integration
17. [ ] Claude API service with streaming
18. [ ] WebSocket endpoint
19. [ ] Spotlight modal (Ctrl+P)
20. [ ] Expand button (→) logic
21. [ ] Ghost questions in focus mode

### Phase 5: Focus Mode
22. [ ] Focus mode navigation
23. [ ] Breadcrumb component
24. [ ] Ghost question rendering

### Phase 6: Polish & Deploy
25. [ ] Marker block styling
26. [ ] Rate limit UI
27. [ ] Error handling
28. [ ] Docker production config
29. [ ] Final E2E testing

---

## Deferred Features

### MVP2
- Custom marker colors
- Two-panel layout (keywords + details)
- Auto-connect to existing notes (semantic linking)
- AI content visual distinction

### MVP3
- CRDT sync (multi-device)
- Real-time collaboration
- Conflict resolution
