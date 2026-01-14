# TEST-604: Priority 3 Critical Paths (High Impact)

**Type**: Testing - Critical User Workflows
**Priority**: P3 (High Impact - Breaks User Workflows)
**Estimated Effort**: 6 hours
**Component**: Frontend E2E Testing
**Dependencies**: TEST-601 (Playwright setup must be complete)

---

## Context

**Priority 3 = Critical Paths**: Features that break core user workflows.

These are the most important user flows - if these break, the app is unusable:
- Users can't create notes → Can't use app
- Users can't edit text → Can't use app
- Users can't collapse/expand → Navigation broken
- AI generation fails → Value proposition broken

**From Retrospective**:
> "Keep the architecture. Improve the testing process."

**Goal**: Ensure core workflows always work - these are smoke tests that gate every release.

---

## Objectives

Write Playwright smoke tests for 4 critical user workflows:

1. **Creating Bullets**: Core note-taking flow
2. **Typing and Editing**: Core content creation
3. **Collapsing/Expanding**: Core navigation
4. **AI Generation**: Core value proposition

---

## Test 1: Creating Bullets (Core Flow)

**File**: `e2e/playwright/critical/creating-bullets.spec.ts`

**Why Critical**: If users can't create bullets, they can't use the app at all.

### Test Cases

```typescript
test.describe('CRITICAL: Creating Bullets', () => {
  test('should create a new bullet with add button', async ({ page }) => {
    // The most basic operation
    await page.click('[data-testid="add-bullet-button"]');

    // Verify: New bullet appears
    await expect(page.locator('[data-block-type="bullet"]')).toBeVisible();

    // Verify: Cursor in bullet
    await expect(page.locator('[data-block-type="bullet"][contenteditable]')).toBeFocused();

    // Verify: No console errors
    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should create bullet with Enter key', async ({ page }) => {
    // Create first bullet
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('First bullet');

    // Press Enter
    await page.keyboard.press('Enter');

    // Verify: Second bullet created
    const bullets = await page.locator('[data-block-type="bullet"]').count();
    expect(bullets).toBe(2);

    // Verify: Cursor in new bullet
    const secondBullet = await page.locator('[data-block-type="bullet"]').nth(1);
    await expect(secondBullet).toBeFocused();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should create nested bullet with Tab', async ({ page }) => {
    // Create parent
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Parent');

    // Create sibling
    await page.keyboard.press('Enter');
    await page.keyboard.type('Child');

    // Indent with Tab
    await page.keyboard.press('Tab');

    // Verify: Second bullet is child of first
    const childBullet = await page.locator('[data-block-type="bullet"]').nth(1);
    const parentId = await childBullet.getAttribute('data-parent-id');
    expect(parentId).toBeTruthy();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should delete empty bullet with Backspace', async ({ page }) => {
    // Create bullet
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Text');

    // Create empty bullet
    await page.keyboard.press('Enter');

    // Delete empty bullet
    await page.keyboard.press('Backspace');

    // Verify: Only one bullet remains
    const bullets = await page.locator('[data-block-type="bullet"]').count();
    expect(bullets).toBe(1);

    // Verify: Cursor in previous bullet
    const firstBullet = await page.locator('[data-block-type="bullet"]').first();
    await expect(firstBullet).toBeFocused();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should maintain bullet creation during rapid operations', async ({ page }) => {
    // Rapidly create 20 bullets
    await page.click('[data-testid="add-bullet-button"]');

    for (let i = 1; i <= 20; i++) {
      await page.keyboard.type(`Bullet ${i}`);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(10); // Minimal wait
    }

    // Verify: All bullets created
    const bullets = await page.locator('[data-block-type="bullet"]').count();
    expect(bullets).toBe(21); // 20 + final empty bullet

    // Verify: All content persisted
    for (let i = 1; i <= 20; i++) {
      await expect(page.locator(`text=Bullet ${i}`)).toBeVisible();
    }

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('SMOKE: should create, edit, and delete bullet (end-to-end)', async ({ page }) => {
    // Full workflow
    // 1. Create
    await page.click('[data-testid="add-bullet-button"]');
    await expect(page.locator('[data-block-type="bullet"]')).toBeVisible();

    // 2. Edit
    await page.keyboard.type('My first note');
    await expect(page.locator('text=My first note')).toBeVisible();

    // 3. Delete
    await page.keyboard.press('Backspace');
    for (let i = 0; i < 'My first note'.length; i++) {
      await page.keyboard.press('Backspace');
    }

    // 4. Delete empty bullet
    await page.keyboard.press('Backspace');

    // Verify: Clean slate
    const bullets = await page.locator('[data-block-type="bullet"]').count();
    expect(bullets).toBe(0);

    expect(consoleMonitor.hasErrors()).toBe(false);
  });
});
```

---

## Test 2: Typing and Editing (Core Flow)

**File**: `e2e/playwright/critical/typing-editing.spec.ts`

**Why Critical**: If users can't type, they can't create content.

### Test Cases

```typescript
test.describe('CRITICAL: Typing and Editing', () => {
  test('should type text in bullet', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');

    // Type text
    await page.keyboard.type('Hello World');

    // Verify: Text appears
    await expect(page.locator('text=Hello World')).toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should support all basic keyboard operations', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Hello World');

    // Move cursor with arrows
    await page.keyboard.press('ArrowLeft'); // Before 'd'
    await page.keyboard.press('ArrowLeft'); // Before 'l'

    // Delete character
    await page.keyboard.press('Backspace');

    // Type new character
    await page.keyboard.type('L');

    // Verify: Text changed from "World" to "WorLd"
    await expect(page.locator('text=Hello WorLd')).toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should handle text selection and replacement', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Hello World');

    // Select "World" (Shift+Ctrl+Left)
    await page.keyboard.press('End');
    await page.keyboard.press('Shift+Control+ArrowLeft');

    // Replace with new text
    await page.keyboard.type('Universe');

    // Verify: Text replaced
    await expect(page.locator('text=Hello Universe')).toBeVisible();
    await expect(page.locator('text=World')).not.toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should support copy/paste', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Copy this text');

    // Select all
    await page.keyboard.press('Control+A');

    // Copy
    await page.keyboard.press('Control+C');

    // Create new bullet
    await page.keyboard.press('Enter');

    // Paste
    await page.keyboard.press('Control+V');

    // Verify: Text pasted in second bullet
    const bullets = await page.locator('[data-block-type="bullet"]').all();
    expect(bullets.length).toBe(2);

    const secondBullet = await bullets[1].textContent();
    expect(secondBullet).toContain('Copy this text');

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should support undo/redo', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Original text');

    // Edit
    await page.keyboard.type(' ADDED');

    // Undo
    await page.keyboard.press('Control+Z');

    // Verify: Addition removed
    await expect(page.locator('text=Original text')).toBeVisible();
    await expect(page.locator('text=ADDED')).not.toBeVisible();

    // Redo
    await page.keyboard.press('Control+Shift+Z');

    // Verify: Addition restored
    await expect(page.locator('text=Original text ADDED')).toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should handle special characters and Unicode', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');

    // Type special characters
    const specialText = 'Special: @#$%^&*()_+-={}[]|:";\'<>?,./~`';
    await page.keyboard.type(specialText);

    // Type Unicode
    await page.keyboard.press('Enter');
    const unicodeText = 'Unicode: 你好世界 🚀 ñ é ü';
    await page.keyboard.type(unicodeText);

    // Verify: All characters rendered
    await expect(page.locator(`text=${specialText}`)).toBeVisible();
    await expect(page.locator(`text=${unicodeText}`)).toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('SMOKE: should handle realistic typing session', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');

    // Simulate realistic typing with typos and corrections
    await page.keyboard.type('Teh quick');
    await page.keyboard.press('ArrowLeft'); // Before 'q'
    await page.keyboard.press('ArrowLeft'); // Before ' '
    await page.keyboard.press('ArrowLeft'); // Before 'T'
    await page.keyboard.press('ArrowRight'); // After 'T'
    await page.keyboard.press('Backspace'); // Delete 'e'
    await page.keyboard.type('h');
    await page.keyboard.press('ArrowRight'); // After 'h'
    await page.keyboard.type('e'); // Insert 'e'

    // Continue typing
    await page.keyboard.press('End');
    await page.keyboard.type(' brown fox');

    // Verify: Final text correct
    await expect(page.locator('text=The quick brown fox')).toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });
});
```

---

## Test 3: Collapsing/Expanding (Core Feature)

**File**: `e2e/playwright/critical/collapse-expand.spec.ts`

**Why Critical**: If users can't collapse/expand, they can't navigate large documents.

### Test Cases

```typescript
test.describe('CRITICAL: Collapsing/Expanding', () => {
  test('should collapse nested bullets', async ({ page }) => {
    // Create nested structure
    await createBullet(page, 'Parent');
    await createChildBullet(page, 'Child 1');
    await createChildBullet(page, 'Child 2');

    // Click collapse toggle
    await page.click('[data-block-id="parent"] [data-testid="collapse-toggle"]');

    // Verify: Children hidden
    await expect(page.locator('text=Child 1')).not.toBeVisible();
    await expect(page.locator('text=Child 2')).not.toBeVisible();

    // Verify: Parent still visible
    await expect(page.locator('text=Parent')).toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should expand collapsed bullets', async ({ page }) => {
    // Create and collapse
    await createBullet(page, 'Parent');
    await createChildBullet(page, 'Child');
    await page.click('[data-block-id="parent"] [data-testid="collapse-toggle"]');

    // Expand
    await page.click('[data-block-id="parent"] [data-testid="collapse-toggle"]');

    // Verify: Child visible again
    await expect(page.locator('text=Child')).toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should maintain collapse state across page reload', async ({ page }) => {
    // Create nested structure
    await createBullet(page, 'Parent');
    for (let i = 1; i <= 5; i++) {
      await createChildBullet(page, `Child ${i}`);
    }

    // Collapse
    await page.click('[data-block-id="parent"] [data-testid="collapse-toggle"]');

    // Wait for persistence
    await page.waitForTimeout(500);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify: Still collapsed
    await expect(page.locator('text=Parent')).toBeVisible();
    await expect(page.locator('text=Child 1')).not.toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should collapse/expand deeply nested structure', async ({ page }) => {
    // Create 4-level nesting
    await createBullet(page, 'Level 1');
    await createChildBullet(page, 'Level 2');
    await createChildBullet(page, 'Level 3');
    await createChildBullet(page, 'Level 4');

    // Collapse Level 1
    await page.click('[data-block-id="level-1"] [data-testid="collapse-toggle"]');

    // Verify: All children hidden
    await expect(page.locator('text=Level 2')).not.toBeVisible();
    await expect(page.locator('text=Level 3')).not.toBeVisible();
    await expect(page.locator('text=Level 4')).not.toBeVisible();

    // Expand Level 1
    await page.click('[data-block-id="level-1"] [data-testid="collapse-toggle"]');

    // Verify: Direct children visible
    await expect(page.locator('text=Level 2')).toBeVisible();

    // Collapse Level 2
    await page.click('[data-block-id="level-2"] [data-testid="collapse-toggle"]');

    // Verify: Level 2 visible, but Level 3 & 4 hidden
    await expect(page.locator('text=Level 2')).toBeVisible();
    await expect(page.locator('text=Level 3')).not.toBeVisible();
    await expect(page.locator('text=Level 4')).not.toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should handle rapid collapse/expand', async ({ page }) => {
    await createBullet(page, 'Parent');
    await createChildBullet(page, 'Child');

    const toggle = page.locator('[data-block-id="parent"] [data-testid="collapse-toggle"]');

    // Rapidly toggle 10 times
    for (let i = 0; i < 10; i++) {
      await toggle.click();
      await page.waitForTimeout(50);
    }

    // Verify: Final state consistent
    // (After 10 toggles, should be back to expanded)
    await expect(page.locator('text=Child')).toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('SMOKE: should navigate large document using collapse', async ({ page }) => {
    // Create document with 5 top-level bullets, each with 5 children
    for (let i = 1; i <= 5; i++) {
      await createBullet(page, `Section ${i}`);
      for (let j = 1; j <= 5; j++) {
        await createChildBullet(page, `Item ${i}-${j}`);
      }
    }

    // Collapse all sections
    for (let i = 1; i <= 5; i++) {
      await page.click(`[data-block-id="section-${i}"] [data-testid="collapse-toggle"]`);
    }

    // Verify: Only section headers visible
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(`text=Section ${i}`)).toBeVisible();
      await expect(page.locator(`text=Item ${i}-1`)).not.toBeVisible();
    }

    // Expand Section 3
    await page.click(`[data-block-id="section-3"] [data-testid="collapse-toggle"]`);

    // Verify: Only Section 3 items visible
    for (let j = 1; j <= 5; j++) {
      await expect(page.locator(`text=Item 3-${j}`)).toBeVisible();
    }
    await expect(page.locator(`text=Item 1-1`)).not.toBeVisible();
    await expect(page.locator(`text=Item 2-1`)).not.toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });
});
```

---

## Test 4: AI Generation (Value Proposition)

**File**: `e2e/playwright/critical/ai-generation.spec.ts`

**Why Critical**: AI generation is the core value proposition - if it fails, users lose the main benefit.

### Test Cases

```typescript
test.describe('CRITICAL: AI Generation', () => {
  test('should trigger AI generation with Tab key', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');

    // Type prompt and trigger AI
    await page.keyboard.type('Write a haiku about testing');
    await page.keyboard.press('Tab');

    // Verify: Loading indicator appears
    await expect(page.locator('[data-testid="ai-loading"]')).toBeVisible();

    // Wait for generation (max 10 seconds)
    await expect(page.locator('[data-testid="ai-result"]')).toBeVisible({ timeout: 10000 });

    // Verify: AI content appears in new bullet
    const bullets = await page.locator('[data-block-type="bullet"]').count();
    expect(bullets).toBeGreaterThan(1);

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should handle AI generation error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/generate', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'AI service unavailable' })
      });
    });

    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Test prompt');
    await page.keyboard.press('Tab');

    // Verify: Error message shown
    await expect(page.locator('text=AI generation failed')).toBeVisible();

    // Verify: Original prompt preserved
    await expect(page.locator('text=Test prompt')).toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should show AI generation count/limit', async ({ page }) => {
    // Verify: Usage indicator visible
    await expect(page.locator('[data-testid="ai-usage-count"]')).toBeVisible();

    // Get current count
    const beforeCount = await page.locator('[data-testid="ai-usage-count"]').textContent();

    // Generate
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Quick test');
    await page.keyboard.press('Tab');

    await expect(page.locator('[data-testid="ai-result"]')).toBeVisible({ timeout: 10000 });

    // Verify: Count incremented
    const afterCount = await page.locator('[data-testid="ai-usage-count"]').textContent();
    expect(afterCount).not.toBe(beforeCount);

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should handle rate limiting', async ({ page }) => {
    // Mock rate limit response
    await page.route('**/api/generate', route => {
      route.fulfill({
        status: 429,
        body: JSON.stringify({ error: 'Rate limit exceeded' })
      });
    });

    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Test prompt');
    await page.keyboard.press('Tab');

    // Verify: Rate limit message shown
    await expect(page.locator('text=Rate limit reached')).toBeVisible();

    // Verify: User can still use app
    await expect(page.locator('[data-testid="add-bullet-button"]')).toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should cancel AI generation', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Long generation prompt');
    await page.keyboard.press('Tab');

    // Wait for loading indicator
    await expect(page.locator('[data-testid="ai-loading"]')).toBeVisible();

    // Cancel with Escape
    await page.keyboard.press('Escape');

    // Verify: Loading stopped
    await expect(page.locator('[data-testid="ai-loading"]')).not.toBeVisible();

    // Verify: No AI content added
    const bullets = await page.locator('[data-block-type="bullet"]').count();
    expect(bullets).toBe(1);

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('SMOKE: should complete full AI generation workflow', async ({ page }) => {
    // 1. Check usage count
    const initialCount = await page.locator('[data-testid="ai-usage-count"]').textContent();

    // 2. Create bullet with prompt
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('List 3 benefits of testing');

    // 3. Trigger AI generation
    await page.keyboard.press('Tab');

    // 4. Wait for result
    await expect(page.locator('[data-testid="ai-result"]')).toBeVisible({ timeout: 10000 });

    // 5. Verify content generated
    const bullets = await page.locator('[data-block-type="bullet"]').count();
    expect(bullets).toBeGreaterThan(1);

    // 6. Verify usage count updated
    const finalCount = await page.locator('[data-testid="ai-usage-count"]').textContent();
    expect(finalCount).not.toBe(initialCount);

    // 7. Verify can continue using app
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('Another note');
    await expect(page.locator('text=Another note')).toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });
});
```

---

## Acceptance Criteria

- [ ] All 4 critical path test files created
- [ ] Tests cover the most essential user workflows
- [ ] Each workflow has a comprehensive smoke test
- [ ] Error handling and edge cases covered
- [ ] All tests pass: `npx playwright test e2e/playwright/critical/`
- [ ] Tests run quickly (<30 seconds total for smoke tests)
- [ ] Tests are deterministic (no flaky failures)
- [ ] Can be used as smoke tests for every deployment

---

## Testing Strategy

### Step 4: Run Tests
```bash
# Run critical path tests first (smoke tests)
npx playwright test e2e/playwright/critical/ --grep="SMOKE"

# Then run all critical tests
npx playwright test e2e/playwright/critical/
```

### Step 7: Chrome E2E
- Manually verify each critical workflow
- Test with slow network
- Test with browser extensions
- Add discovered edge cases to tests (step 7.6)

### Step 7.5: Browser Verification
- Verify each critical path works manually
- Test on clean browser profile
- Screenshot: All smoke tests green
- Document any workarounds needed

---

## Success Metrics

- [ ] All critical paths have comprehensive coverage
- [ ] Smoke tests complete in <30 seconds
- [ ] Full critical suite completes in <2 minutes
- [ ] Zero false positives
- [ ] Tests can gate deployments

---

## CI/CD Integration

These tests should run on:
- Every PR (full suite)
- Every merge to main (full suite)
- Every deployment (smoke tests only)
- Nightly (full suite)

**Recommended CI configuration**:
```yaml
# Fast smoke test (blocks deployment)
- name: Run Critical Smoke Tests
  run: npx playwright test e2e/playwright/critical/ --grep="SMOKE"
  timeout-minutes: 2

# Full critical suite (blocks merge)
- name: Run All Critical Tests
  run: npx playwright test e2e/playwright/critical/
  timeout-minutes: 5
```

---

## Related Tickets

- **Depends on**: TEST-601 (Playwright setup)
- **Blocks**: All deployments (smoke tests must pass)
- **Validates**: Core user workflows

---

## Notes

**Why these 4 workflows?**

1. **Creating Bullets**: If broken → Can't use app at all
2. **Typing/Editing**: If broken → Can't create content
3. **Collapsing/Expanding**: If broken → Can't navigate large documents
4. **AI Generation**: If broken → Lose main value proposition

**Smoke Test Definition**:
- Tests the happy path end-to-end
- Runs in <10 seconds
- No mocking (uses real backend)
- Gates every deployment

**Best Practices**:
- Keep smoke tests fast and focused
- Mock only external services (AI API)
- Use realistic user behavior
- Verify console errors in every test

---

## Definition of Done

- [ ] All 4 critical path test files implemented
- [ ] All tests passing in CI
- [ ] Smoke tests complete in <30 seconds
- [ ] Full suite completes in <2 minutes
- [ ] No false positives after 10 consecutive runs
- [ ] Documentation updated with smoke test process
- [ ] CI/CD configured to run tests on every deployment
- [ ] Screenshot evidence: All smoke tests green
