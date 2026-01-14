# TEST-602: Priority 1 Regression Tests (High Value)

**Type**: Testing - Regression Coverage
**Priority**: P1 (High Value - Prevent Known Bugs)
**Estimated Effort**: 8 hours
**Component**: Frontend E2E Testing
**Dependencies**: TEST-601 (Playwright setup must be complete)

---

## Context

**Priority 1 = Regression Protection**: Features that have ALREADY had bugs.

These are the most valuable tests to write because:
1. We know these areas are fragile
2. We have real bug examples to test against
3. They provide immediate ROI by preventing rework
4. They validate our fixes actually work

**From Retrospective**:
> "Bug rate: ~30% of completed tickets have critical bugs"
> "Rework time: ~45% of original implementation time"
> "Time to bug discovery: 1-2 days after marking complete"

**Goal**: Reduce bug rate from 30% to <10% by catching issues during development.

---

## Objectives

Write Playwright regression tests for 4 features that previously had critical bugs:

1. **EDITOR-3508**: Focus mode filtering (content filtering didn't work)
2. **EDITOR-3510**: Markdown shortcuts (shortcuts didn't convert)
3. **EDITOR-3701**: Drag positioning (drag drift near parent)
4. **BUG-001**: Orphaned portal handling (null model crashes)

---

## Test Structure

Each test file should follow this structure:

```typescript
import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../utils/console-monitor';

test.describe('[TICKET]: [Feature Name]', () => {
  let consoleMonitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    consoleMonitor = new ConsoleMonitor(page);
    await page.goto('/');
    // Setup: Create test data, authenticate, etc.
  });

  test.describe('Happy Path (from Step 2 - BEFORE CODING)', () => {
    // Tests that would be written BEFORE implementation
    // Cover basic acceptance criteria
  });

  test.describe('Regression: [Bug Title]', () => {
    // Tests that specifically prevent the bug from returning
    // Cover edge cases discovered during Chrome MCP
  });

  test.describe('Console Error Monitoring', () => {
    // Verify no console errors during all interactions
  });
});
```

---

## Test 1: EDITOR-3508 - Focus Mode Filtering

**File**: `e2e/playwright/EDITOR-3508/focus-mode.spec.ts`

**Bug Summary** (from `docs/tasks/done/EDITOR-3508_focus-mode-zoom.md`):
- Feature marked complete with 42 passing unit tests
- **Actual bug**: Content filtering didn't work - all bullets still visible in focus mode
- **Root cause**: No conditional rendering implemented, only state management
- **Impact**: Core feature completely non-functional

### Test Cases

```typescript
test.describe('EDITOR-3508: Focus Mode Filtering', () => {
  test('should enter focus mode when clicking grip handle', async ({ page }) => {
    // Create nested bullets
    await createBullet(page, 'Parent');
    await createChildBullet(page, 'Child 1');
    await createChildBullet(page, 'Child 2');

    // Click grip handle on Parent
    await page.click('[data-block-id="parent"] .grip-handle');

    // Verify focus mode activated
    await expect(page.locator('[data-focus-mode="true"]')).toBeVisible();
  });

  test('REGRESSION: should filter content to show only focused bullet descendants', async ({ page }) => {
    // Create structure:
    // - Root
    //   - Parent (focus on this)
    //     - Child 1
    //     - Child 2
    //   - Sibling (should be hidden)

    await createNestedStructure(page);

    // Enter focus mode on Parent
    await page.click('[data-block-id="parent"] .grip-handle');

    // Verify: Parent and its children visible
    await expect(page.locator('text=Parent')).toBeVisible();
    await expect(page.locator('text=Child 1')).toBeVisible();
    await expect(page.locator('text=Child 2')).toBeVisible();

    // Verify: Siblings and root NOT visible
    await expect(page.locator('text=Sibling')).not.toBeVisible();
    await expect(page.locator('text=Root')).not.toBeVisible();
  });

  test('REGRESSION: should restore all content when exiting focus mode', async ({ page }) => {
    await createNestedStructure(page);

    // Enter focus mode
    await page.click('[data-block-id="parent"] .grip-handle');

    // Exit focus mode
    await page.click('[data-testid="exit-focus-mode"]');

    // Verify: All bullets visible again
    await expect(page.locator('text=Root')).toBeVisible();
    await expect(page.locator('text=Parent')).toBeVisible();
    await expect(page.locator('text=Child 1')).toBeVisible();
    await expect(page.locator('text=Sibling')).toBeVisible();
  });

  test('should have zero console errors during focus mode interaction', async ({ page }) => {
    await createNestedStructure(page);
    consoleMonitor.clearErrors();

    // Full interaction cycle
    await page.click('[data-block-id="parent"] .grip-handle');
    await page.waitForTimeout(100);
    await page.click('[data-testid="exit-focus-mode"]');

    expect(consoleMonitor.hasErrors()).toBe(false);
  });
});
```

---

## Test 2: EDITOR-3510 - Markdown Shortcuts

**File**: `e2e/playwright/EDITOR-3510/markdown-shortcuts.spec.ts`

**Bug Summary** (from `docs/tasks/done/EDITOR-3510_block-type-system.md`):
- Feature marked complete with 82 passing unit tests
- **Actual bug**: Markdown shortcuts didn't convert blocks
- **Root cause**: Off-by-one error in text parsing - didn't include trailing space
- **Impact**: Core feature non-functional

### Test Cases

```typescript
test.describe('EDITOR-3510: Markdown Shortcuts', () => {
  test('REGRESSION: should convert "[] " to checkbox', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');

    // Type markdown syntax
    await page.keyboard.type('[] ');

    // Verify: Checkbox appears
    await expect(page.locator('[type="checkbox"]')).toBeVisible();

    // Verify: "[]" text removed
    await expect(page.locator('text=[]')).not.toBeVisible();

    // Verify: No console errors
    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('REGRESSION: should convert "1. " to numbered list', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('1. ');

    // Verify: Number appears
    await expect(page.locator('[data-block-type="numbered"]')).toBeVisible();

    // Verify: No console errors
    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('REGRESSION: should convert "# " to heading 1', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('# ');

    // Verify: Heading style applied
    await expect(page.locator('[data-block-type="heading1"]')).toBeVisible();

    // Verify: No console errors
    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should NOT convert without trailing space', async ({ page }) => {
    await page.click('[data-testid="add-bullet-button"]');
    await page.keyboard.type('[]');

    // Verify: Still text, not checkbox
    await expect(page.locator('text=[]')).toBeVisible();
    await expect(page.locator('[type="checkbox"]')).not.toBeVisible();
  });

  test('should support all markdown syntax variants', async ({ page }) => {
    const shortcuts = [
      { input: '[] ', expected: 'checkbox' },
      { input: '1. ', expected: 'numbered' },
      { input: '* ', expected: 'bullet' },
      { input: '- ', expected: 'bullet' },
      { input: '# ', expected: 'heading1' },
      { input: '## ', expected: 'heading2' },
      { input: '### ', expected: 'heading3' },
    ];

    for (const { input, expected } of shortcuts) {
      await page.click('[data-testid="add-bullet-button"]');
      await page.keyboard.type(input);
      await expect(page.locator(`[data-block-type="${expected}"]`)).toBeVisible();

      // Clean up for next test
      await page.keyboard.press('Backspace');
    }

    expect(consoleMonitor.hasErrors()).toBe(false);
  });
});
```

---

## Test 3: EDITOR-3701 - Drag Positioning

**File**: `e2e/playwright/EDITOR-3701/drag-positioning.spec.ts`

**Bug Summary** (from `docs/tasks/done/EDITOR-3701_drag-drift-fix.md`):
- **Actual bug**: Drag drift when dropping near parent bullet
- **Root cause**: Incorrect drop zone calculation
- **Impact**: Frustrating UX, bullets end up in wrong position

### Test Cases

```typescript
test.describe('EDITOR-3701: Drag Positioning', () => {
  test('should drag bullet to new position', async ({ page }) => {
    // Create bullets
    await createBullet(page, 'Bullet 1');
    await createBullet(page, 'Bullet 2');
    await createBullet(page, 'Bullet 3');

    // Drag Bullet 1 to after Bullet 3
    await dragBullet(page, 'Bullet 1', 'Bullet 3', 'after');

    // Verify order: Bullet 2, Bullet 3, Bullet 1
    const bullets = await page.locator('[data-block-type="bullet"]').allTextContents();
    expect(bullets).toEqual(['Bullet 2', 'Bullet 3', 'Bullet 1']);
  });

  test('REGRESSION: should not drift when dropping near parent', async ({ page }) => {
    // Create nested structure
    await createBullet(page, 'Parent');
    await createChildBullet(page, 'Child');
    await createBullet(page, 'Target');

    // Get initial position of Target
    const targetBefore = await getBulletPosition(page, 'Target');

    // Drag Child near Parent (trigger drift scenario)
    await dragBulletNearParent(page, 'Child', 'Parent');

    // Verify: Target position unchanged (no drift)
    const targetAfter = await getBulletPosition(page, 'Target');
    expect(targetAfter.y).toBeCloseTo(targetBefore.y, 1);
  });

  test('REGRESSION: should maintain hierarchy when dragging', async ({ page }) => {
    // Create structure:
    // - Parent
    //   - Child 1
    //   - Child 2
    // - Target

    await createNestedStructure(page);

    // Drag Parent to after Target
    await dragBullet(page, 'Parent', 'Target', 'after');

    // Verify: Children still nested under Parent
    const parentChildren = await page.locator('[data-parent-id="parent"]').count();
    expect(parentChildren).toBe(2);
  });

  test('should show drop indicator at correct position', async ({ page }) => {
    await createBullet(page, 'Bullet 1');
    await createBullet(page, 'Bullet 2');

    // Start dragging
    await page.hover('[data-block-id="bullet-1"] .grip-handle');
    await page.mouse.down();

    // Move to drop zone
    await page.mouse.move(100, 200);

    // Verify: Drop indicator visible at correct position
    await expect(page.locator('[data-testid="drop-indicator"]')).toBeVisible();

    await page.mouse.up();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });
});
```

---

## Test 4: BUG-001 - Orphaned Portal Handling

**File**: `e2e/playwright/BUG-001/orphaned-portal.spec.ts`

**Bug Summary** (from `docs/bugs/BUG-001-orphaned-portal-crash.md`):
- **Actual bug**: Portal picker doesn't open, app crashes with null model errors
- **Root cause**: Orphaned portals in IndexedDB, no null checks in Lit components
- **Impact**: 12+ JavaScript errors, entire feature unusable
- **Learning**: "Tests pass ≠ Production safe"

### Test Cases

```typescript
test.describe('BUG-001: Orphaned Portal Handling', () => {
  test('should open portal picker without errors', async ({ page }) => {
    await page.click('[data-testid="create-portal-button"]');

    // Verify: Modal opens
    await expect(page.locator('[data-testid="portal-picker-modal"]')).toBeVisible();

    // Verify: No console errors
    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('REGRESSION: should handle orphaned portal gracefully', async ({ page }) => {
    // Create a portal
    await createPortal(page, 'Target Bullet');

    // Simulate orphan: delete target bullet from IndexedDB
    await page.evaluate(() => {
      // Direct IndexedDB manipulation to create orphan state
      // (Implementation depends on your IndexedDB structure)
    });

    // Reload page to trigger orphan detection
    await page.reload();

    // Verify: App loads without crash
    await expect(page.locator('[data-testid="editor"]')).toBeVisible();

    // Verify: No console errors (defensive null checks work)
    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('REGRESSION: should show orphaned portal placeholder', async ({ page }) => {
    // Create orphaned portal scenario
    await createOrphanedPortal(page);

    // Verify: Orphan indicator visible
    await expect(page.locator('[data-testid="orphaned-portal-indicator"]')).toBeVisible();

    // Verify: Can still interact with other bullets
    await page.click('[data-testid="add-bullet-button"]');
    await expect(page.locator('[data-testid="new-bullet"]')).toBeVisible();
  });

  test('should cascade delete portals when target deleted', async ({ page }) => {
    // Create bullet with portal
    await createBullet(page, 'Target');
    await createPortalTo(page, 'Target');

    // Delete target bullet
    await deleteBullet(page, 'Target');

    // Verify: Portal also removed (cascade delete)
    await expect(page.locator('[data-portal-target="Target"]')).not.toBeVisible();

    // Verify: No console errors
    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should handle portal to deleted bullet during creation', async ({ page }) => {
    // Open portal picker
    await page.click('[data-testid="create-portal-button"]');

    // Select bullet that will be deleted
    await page.click('[data-testid="portal-target-bullet"]');

    // Another user deletes the bullet (simulate with IndexedDB)
    await page.evaluate(() => {
      // Delete bullet from IndexedDB
    });

    // Try to create portal
    await page.click('[data-testid="confirm-portal"]');

    // Verify: Error message shown (not crash)
    await expect(page.locator('text=Target no longer exists')).toBeVisible();

    // Verify: No console errors (graceful error handling)
    expect(consoleMonitor.hasErrors()).toBe(false);
  });
});
```

---

## Acceptance Criteria

- [ ] All 4 test files created with comprehensive coverage
- [ ] Tests cover both happy path and regression scenarios
- [ ] Console error monitoring included in all tests
- [ ] All tests pass: `npx playwright test e2e/playwright/EDITOR-3508 EDITOR-3510 EDITOR-3701 BUG-001`
- [ ] Helper functions created for common operations:
  - `createBullet()`, `createChildBullet()`, `createNestedStructure()`
  - `dragBullet()`, `dragBulletNearParent()`, `getBulletPosition()`
  - `createPortal()`, `createOrphanedPortal()`, `deleteBullet()`
- [ ] Each test runs in <10 seconds
- [ ] Tests are deterministic (no flaky failures)
- [ ] Screenshot evidence: All tests passing in Playwright HTML report

---

## Testing Strategy

### Step 4: Run Tests
```bash
# All regression tests should pass
npx playwright test e2e/playwright/EDITOR-3508
npx playwright test e2e/playwright/EDITOR-3510
npx playwright test e2e/playwright/EDITOR-3701
npx playwright test e2e/playwright/BUG-001

# Should complete in <1 minute total
```

### Step 7: Chrome E2E
- Manually verify each regression scenario in browser
- Try to break the tests with edge cases
- Add any discovered edge cases to tests (step 7.6)

### Step 7.5: Browser Verification
- Run frontend: `npm run dev`
- Run tests and watch browser
- Verify console clean throughout
- Screenshot: Passing test report + clean console

---

## Success Metrics

- [ ] All 4 feature areas have regression coverage
- [ ] Tests catch the original bugs if reintroduced
- [ ] Zero false positives (tests don't fail randomly)
- [ ] Tests complete in <1 minute total
- [ ] Console monitoring detects errors correctly

---

## Related Tickets

- **Depends on**: TEST-601 (Playwright setup)
- **Prevents regressions for**: EDITOR-3508, EDITOR-3510, EDITOR-3701, BUG-001
- **Related bugs**: `docs/bugs/BUG-001-orphaned-portal-crash.md`
- **Related tasks**: `docs/tasks/done/EDITOR-3508_focus-mode-zoom.md`, etc.

---

## Notes

**From Retrospective**:
> "These are your most fragile areas. Test them first."
> "If E2E tested before marking complete: Find issues during implementation ~2 hours, Rework: ~13% of original time"

**Why Priority 1?**
- We have real bug examples to test against
- We know these areas are fragile
- Immediate ROI by preventing rework
- Validates our fixes actually work

**Test Writing Tips**:
1. Write happy path tests BEFORE coding (step 2)
2. Add regression tests AFTER Chrome MCP exploration (step 7.6)
3. Every test should verify console has zero errors
4. Use data-testid attributes for stable selectors
5. Avoid hard waits - use proper `waitFor*` methods

---

## Definition of Done

- [ ] All 4 test files implemented with full coverage
- [ ] All tests passing in CI
- [ ] Helper functions documented in `e2e/playwright/utils/`
- [ ] Tests added to CI pipeline
- [ ] Screenshot evidence: All tests green in HTML report
- [ ] No false positives after 3 consecutive runs
- [ ] Documentation updated with regression test locations
