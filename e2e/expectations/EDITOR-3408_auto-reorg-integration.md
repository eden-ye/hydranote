# EDITOR-3408: Auto-Reorg Integration E2E Test

## Prerequisites
- Backend running locally (`python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000`)
- Frontend running locally (`npm run dev`)
- User logged in with valid auth token
- OpenAI API key configured for semantic search

## Test Scenarios

### Scenario 1: Auto-Reorg Triggers on Document Changes
**Steps:**
1. Open Hydra Notes editor at http://localhost:5173
2. Type content in a bullet (e.g., "Machine learning neural networks")
3. Wait 3-4 seconds (2s debounce + processing time)
4. Open browser console (F12)

**Expected:**
- Console shows "[AutoReorg] Setting up document observer"
- Console shows "[AutoReorg] Triggered for document: main"
- Console shows "[AutoReorg] Using mock API for concept extraction" (when backend not connected)
- OR "[AutoReorg] Using real API for concept extraction" (when backend connected)
- No JavaScript errors in console

### Scenario 2: Auto-Reorg Status Updates in Store
**Steps:**
1. Open React DevTools or browser console
2. Type content in a bullet
3. Observe the auto-reorg status in editor store

**Expected:**
- Status transitions: 'idle' -> 'processing' -> 'completed' -> 'idle'
- Status resets to 'idle' after 2 seconds

### Scenario 3: Auto-Reorg with Real Backend (Integration)
**Prerequisites:**
- Backend running with OpenAI API key configured
- VITE_API_URL environment variable set

**Steps:**
1. Start backend: `cd backend && python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
2. Start frontend with API URL: `VITE_API_URL=http://localhost:8000 npm run dev`
3. Login to get auth token
4. Type meaningful content (e.g., "Deep learning transformer architecture")
5. Wait for auto-reorg to trigger
6. Check console for API calls

**Expected:**
- Console shows "[AutoReorg] Using real API for concept extraction"
- Console shows "[AutoReorg] Semantic search for concept: <concept_name>"
- Network tab shows POST to `/api/ai/extract-concepts`
- Network tab shows POST to `/api/notes/semantic-search`
- No 401 Unauthorized errors (auth token valid)
- Console shows "[AutoReorg] Completed: { portalsCreated: X, conceptsExtracted: Y, ... }"

### Scenario 4: Auto-Reorg Disabled
**Steps:**
1. Set autoReorgEnabled to false in editor store (via console):
   ```javascript
   useEditorStore.getState().setAutoReorgEnabled(false)
   ```
2. Type content in a bullet
3. Wait 3-4 seconds

**Expected:**
- No "[AutoReorg] Triggered" messages in console
- No API calls made

### Scenario 5: Error Handling
**Steps:**
1. Start frontend without backend running
2. Set VITE_API_URL to backend URL
3. Type content and wait for auto-reorg

**Expected:**
- Console shows "[AutoReorg] Failed: <error message>"
- Status returns to 'idle' after error
- No crash or unhandled exceptions

## Success Criteria
- [ ] Auto-reorg triggers after 2s debounce on document changes
- [ ] Console logs show correct status transitions
- [ ] No JavaScript errors in browser console
- [ ] Real API client used when VITE_API_URL is set
- [ ] Mock API client used when VITE_API_URL is not set
- [ ] Auto-reorg can be disabled via store
- [ ] Errors are handled gracefully

## Manual Verification
Since auto-reorg is a background process, verification is done via:
1. Browser console logs
2. Network tab API calls
3. React DevTools store inspection
