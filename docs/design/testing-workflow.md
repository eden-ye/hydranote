# Testing Workflow (TDD)

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
