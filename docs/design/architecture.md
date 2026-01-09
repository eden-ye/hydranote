# Technical Architecture

## Stack

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

---

## Project Structure

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
│   ├── roadmap.md
│   ├── design/
│   ├── features/
│   ├── bugs/
│   ├── api/
│   └── tasks/
│
├── docker-compose.yml
├── docker-compose.sat.yml
├── .env.example
├── .env.local
├── .env.sat
└── .env.prod
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

See `.env.example` for required variables:
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` - Frontend Supabase
- `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` - Backend Supabase
- `ANTHROPIC_API_KEY` - Claude API
- `JWT_SECRET` - Must differ per environment

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
