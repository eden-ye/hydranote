# Testing Workflow (TDD)

## Local Development Setup

For local development, you can run backend and frontend **natively** (without Docker):

```bash
# Terminal 1: Backend (native)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend (native)
cd frontend
npm install
npm run dev
```

**Note**: Docker is NOT required for local development. Native execution is faster for iterative development.

---

## Pre-Commit Requirements

**CRITICAL**: Before committing, you MUST run Docker builds to ensure CI/CD compatibility:

```bash
# Build frontend (TypeScript check + Vite build)
npm run build --prefix frontend

# Build backend Docker image (matches CI/CD environment)
docker build -t hydra-backend ./backend
```

**Why Docker build before commit?**
- CI/CD runs in Docker containers with different environments (Linux, specific Python/Node versions)
- Native builds may pass locally but fail in CI due to platform differences
- Docker build catches dependency issues, missing files, and environment mismatches

---

## Automated Testing Pipeline

For each task/feature, execute this sequence:

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
│  4. BUILD (Required before commit)                          │
├─────────────────────────────────────────────────────────────┤
│  $ npm run build --prefix frontend                          │
│  $ docker build -t hydra-backend ./backend                  │
│  → Must succeed before continuing                           │
│  → Docker build ensures CI/CD compatibility                 │
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

---

## Bruno Collection Structure

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

### Example Bruno File

**`bruno/collections/ai/generate-structure.bru`**:
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

---

## E2E Expectation Format

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
