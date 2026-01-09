# MVP1 Feature Specification

## 1. Outline Editor (BlockSuite-based)

### Bullet Structure
- Each bullet limited to ~20 words (soft limit, AI-guided)
- Folding/collapsing with triangle markers (▶/▼)
- Hierarchical nesting (1-5 levels)

### Inline Detail Display (Computed UI View)
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

### Bullet Data Model
```typescript
{
  text: string;                    // "Cache"
  isCollapsed: boolean;            // UI state
  lastExpandTimestamp: number;     // For analytics
  collapsedSeparator: string;      // " + " | ", " | " | "
  children: Bullet[];              // Always exist, visibility toggled
}
```

### Focus Mode
- Click any bullet to make it the "root" (zoom in)
- Breadcrumb navigation to go back up the hierarchy
- Only focused bullet's subtree is visible

### Special Marker Blocks
- `%Template`, `%Visualization`, etc. as visual markers
- Auto-colored (distinct colors per marker type)
- Configurable marker types
- No special behavior in MVP1 (just visual distinction)

---

## 2. AI Structure Generation

### Spotlight Command (Ctrl+P)
- Elegant overlay input box (like macOS Spotlight)
- Type a sentence → AI generates 1-5 level hierarchical structure
- Streaming response with smooth animation

### Expand Button (→)
- Each bullet has a hover-visible "→" button
- If children exist: expand/show children
- If no children: AI generates deeper content

### Ghost Questions (Focus Mode Only)
- 3 grey/shadow bullets appear as children in focus view
- Inspiring questions to prompt deeper thinking
- Not visible in normal (non-focus) view
- Positioned like normal bullets but visually distinct

---

## 3. Authentication & Rate Limiting

### Google OAuth (via Supabase Auth)
- Login via Google account
- JWT tokens for session management

### Free Tier
- 50 total AI API calls per user (lifetime limit for MVP1)
- Counter displayed in UI
- Graceful handling when limit reached

---

## 4. Data Storage

### Supabase (Cloud PostgreSQL)
- Two separate projects for SAT/Prod isolation
- User data, rate limiting, note metadata
- Row-level security enabled

### Local-First (IndexedDB)
- Note content stored in browser via y-indexeddb
- Works offline
- Zero-lag editing (no network round-trip)
- Sync to Supabase for backup (future)
