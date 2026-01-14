# TEST-603: Priority 2 Complex Interactions (High Risk)

**Type**: Testing - Complex Interactions Coverage
**Priority**: P2 (High Risk - Prone to Breaking)
**Estimated Effort**: 10 hours
**Component**: Frontend E2E Testing
**Dependencies**: TEST-601 (Playwright setup must be complete)

---

## Context

**Priority 2 = Complex Interactions**: Features prone to breaking due to complexity.

These features involve:
- Multiple systems interacting (Yjs + BlockSuite + React)
- Asynchronous operations (IndexedDB, network sync)
- Complex state management (drag & drop, live updates)
- Race conditions and timing issues

**From Retrospective**:
> "The bugs aren't architectural flaws. They're from:
> - Not understanding the framework deeply enough before using it
> - Not testing edge cases
> - Not verifying in browser before marking complete"

**Goal**: Catch complex interaction bugs during development, not after deployment.

---

## Objectives

Write Playwright tests for 4 complex interaction areas:

1. **Drag and Drop**: Position + hierarchy + visual feedback
2. **Portal Live Sync**: Yjs synchronization + IndexedDB persistence
3. **Focus Mode Navigation**: State management + UI updates
4. **IndexedDB Persistence**: Data integrity + corruption handling

---

## Test 1: Drag and Drop (Position + Hierarchy)

**File**: `e2e/playwright/complex/drag-and-drop.spec.ts`

**Complexity**:
- Coordinate calculations
- Drop zone detection
- Hierarchy preservation
- Visual feedback timing
- Mouse event sequences

### Test Cases

```typescript
test.describe('Complex: Drag and Drop', () => {
  test('should maintain correct position during rapid drags', async ({ page }) => {
    // Create 10 bullets
    for (let i = 1; i <= 10; i++) {
      await createBullet(page, `Bullet ${i}`);
    }

    // Rapidly drag Bullet 1 → 5 → 10
    await dragBullet(page, 'Bullet 1', 'Bullet 5', 'after');
    await page.waitForTimeout(50); // Minimal wait
    await dragBullet(page, 'Bullet 1', 'Bullet 10', 'after');

    // Verify: Final position correct
    const lastBullet = await page.locator('[data-block-type="bullet"]').last();
    await expect(lastBullet).toHaveText('Bullet 1');

    // Verify: No position drift
    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should preserve hierarchy during multi-level drag', async ({ page }) => {
    // Create structure:
    // - Parent 1
    //   - Child 1A
    //     - Grandchild 1A1
    //   - Child 1B
    // - Parent 2

    await createComplexNestedStructure(page);

    // Drag Child 1A (with grandchild) to Parent 2
    await dragBullet(page, 'Child 1A', 'Parent 2', 'child');

    // Verify: Grandchild still nested under Child 1A
    const grandchild = await page.locator('[data-block-id="grandchild-1a1"]');
    const parent = await grandchild.evaluate((el) => el.closest('[data-parent-id]'));
    expect(parent.getAttribute('data-parent-id')).toBe('child-1a');

    // Verify: Entire subtree moved
    const child1AParent = await page.locator('[data-block-id="child-1a"]')
      .evaluate((el) => el.getAttribute('data-parent-id'));
    expect(child1AParent).toBe('parent-2');
  });

  test('should handle drag cancellation gracefully', async ({ page }) => {
    await createBullet(page, 'Source');
    await createBullet(page, 'Target');

    // Get original position
    const originalPosition = await getBulletPosition(page, 'Source');

    // Start drag
    await page.hover('[data-block-id="source"] .grip-handle');
    await page.mouse.down();
    await page.mouse.move(100, 200);

    // Cancel with Escape
    await page.keyboard.press('Escape');

    // Verify: Bullet returned to original position
    const currentPosition = await getBulletPosition(page, 'Source');
    expect(currentPosition.y).toBeCloseTo(originalPosition.y, 1);

    // Verify: No visual artifacts left
    await expect(page.locator('[data-testid="drop-indicator"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="drag-ghost"]')).not.toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should show correct drop zones during drag', async ({ page }) => {
    // Create nested structure
    await createBullet(page, 'Parent');
    await createChildBullet(page, 'Child');
    await createBullet(page, 'Target');

    // Start dragging Child
    await page.hover('[data-block-id="child"] .grip-handle');
    await page.mouse.down();

    // Move over Target - should show drop zones
    const targetElement = await page.locator('[data-block-id="target"]');
    const targetBox = await targetElement.boundingBox();
    await page.mouse.move(targetBox.x, targetBox.y);

    // Verify: Drop zones visible (before, after, child)
    await expect(page.locator('[data-drop-zone="before"]')).toBeVisible();
    await expect(page.locator('[data-drop-zone="after"]')).toBeVisible();
    await expect(page.locator('[data-drop-zone="child"]')).toBeVisible();

    // Verify: Drop zones positioned correctly
    const dropZones = await page.locator('[data-drop-zone]').all();
    expect(dropZones.length).toBeGreaterThanOrEqual(3);

    await page.mouse.up();
    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should handle simultaneous drags (concurrent users)', async ({ page, context }) => {
    // Open second page (simulating concurrent user)
    const page2 = await context.newPage();
    await page2.goto('/');

    // Both users create bullets
    await createBullet(page, 'User 1 Bullet');
    await createBullet(page2, 'User 2 Bullet');

    // Both drag at same time (Yjs conflict resolution)
    await Promise.all([
      dragBullet(page, 'User 1 Bullet', 'User 2 Bullet', 'after'),
      dragBullet(page2, 'User 2 Bullet', 'User 1 Bullet', 'after'),
    ]);

    // Wait for sync
    await page.waitForTimeout(500);

    // Verify: Both pages show consistent state
    const page1Order = await page.locator('[data-block-type="bullet"]').allTextContents();
    const page2Order = await page2.locator('[data-block-type="bullet"]').allTextContents();

    expect(page1Order).toEqual(page2Order);
    expect(consoleMonitor.hasErrors()).toBe(false);
  });
});
```

---

## Test 2: Portal Live Sync (Yjs + IndexedDB)

**File**: `e2e/playwright/complex/portal-sync.spec.ts`

**Complexity**:
- Yjs CRDT synchronization
- IndexedDB persistence layer
- React component updates
- Portal content mirroring
- Concurrent edits

### Test Cases

```typescript
test.describe('Complex: Portal Live Sync', () => {
  test('should sync portal content in real-time', async ({ page }) => {
    // Create target bullet
    await createBullet(page, 'Target Bullet');
    await createChildBullet(page, 'Child 1');

    // Create portal to target
    await createPortalTo(page, 'Target Bullet');

    // Edit target content
    await page.locator('[data-block-id="target-bullet"]').click();
    await page.keyboard.type(' EDITED');

    // Verify: Portal shows updated content immediately
    await expect(page.locator('[data-portal-id] >> text=Target Bullet EDITED')).toBeVisible();

    // Verify: No sync errors
    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should handle rapid edits to portal target', async ({ page }) => {
    await createBullet(page, 'Target');
    await createPortalTo(page, 'Target');

    const targetInput = page.locator('[data-block-id="target"] [contenteditable]');

    // Rapid edits (simulate fast typing)
    for (let i = 0; i < 20; i++) {
      await targetInput.type(`${i}`);
      await page.waitForTimeout(10); // 10ms between keystrokes
    }

    // Wait for sync
    await page.waitForTimeout(200);

    // Verify: Portal shows all characters
    const portalContent = await page.locator('[data-portal-id]').textContent();
    expect(portalContent).toContain('0123456789');

    // Verify: No dropped characters or sync conflicts
    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should persist portal state across page reload', async ({ page }) => {
    // Create portal structure
    await createBullet(page, 'Target');
    await createChildBullet(page, 'Child 1');
    await createChildBullet(page, 'Child 2');
    await createPortalTo(page, 'Target');

    // Wait for IndexedDB persistence
    await page.waitForTimeout(500);

    // Get current state
    const beforeReload = await getPortalState(page);

    // Reload page
    await page.reload();

    // Wait for load
    await page.waitForLoadState('networkidle');

    // Verify: Portal state restored
    const afterReload = await getPortalState(page);
    expect(afterReload).toEqual(beforeReload);

    // Verify: Portal still functional
    await page.locator('[data-block-id="target"] [contenteditable]').type(' AFTER RELOAD');
    await expect(page.locator('[data-portal-id] >> text=AFTER RELOAD')).toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should handle portal to deeply nested content', async ({ page }) => {
    // Create deep nesting (5 levels)
    await createBullet(page, 'Level 1');
    for (let i = 2; i <= 5; i++) {
      await createChildBullet(page, `Level ${i}`);
    }

    // Create portal to Level 1 (includes all 5 levels)
    await createPortalTo(page, 'Level 1');

    // Verify: All levels visible in portal
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(`[data-portal-id] >> text=Level ${i}`)).toBeVisible();
    }

    // Edit deep child
    await page.locator('[data-block-id="level-5"]').click();
    await page.keyboard.type(' DEEP EDIT');

    // Verify: Portal shows deep edit
    await expect(page.locator('[data-portal-id] >> text=Level 5 DEEP EDIT')).toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should resolve conflicts during offline sync', async ({ page, context }) => {
    // Create portal
    await createBullet(page, 'Target');
    await createPortalTo(page, 'Target');

    // Simulate offline
    await context.setOffline(true);

    // Edit while offline
    await page.locator('[data-block-id="target"]').type('OFFLINE EDIT');

    // Open second tab (simulating another device)
    const page2 = await context.newPage();
    await page2.goto('/');

    // Second tab edits same content
    await page2.locator('[data-block-id="target"]').type('SECOND TAB EDIT');

    // Go back online
    await context.setOffline(false);

    // Wait for sync
    await page.waitForTimeout(1000);

    // Verify: Yjs CRDT resolved conflict
    const page1Content = await page.locator('[data-block-id="target"]').textContent();
    const page2Content = await page2.locator('[data-block-id="target"]').textContent();

    // Both should show same merged content
    expect(page1Content).toBe(page2Content);

    // Verify: Portal reflects merged state
    const portalContent = await page.locator('[data-portal-id]').textContent();
    expect(portalContent).toBe(page1Content);

    expect(consoleMonitor.hasErrors()).toBe(false);
  });
});
```

---

## Test 3: Focus Mode Navigation (State Management)

**File**: `e2e/playwright/complex/focus-mode-navigation.spec.ts`

**Complexity**:
- Zustand state updates
- React component re-renders
- URL state synchronization
- Breadcrumb navigation
- Back/forward history

### Test Cases

```typescript
test.describe('Complex: Focus Mode Navigation', () => {
  test('should maintain state during nested focus navigation', async ({ page }) => {
    // Create nested structure
    await createBullet(page, 'Level 1');
    await createChildBullet(page, 'Level 2');
    await createChildBullet(page, 'Level 3');

    // Focus on Level 1
    await page.click('[data-block-id="level-1"] .grip-handle');
    await expect(page.locator('[data-focus-mode="level-1"]')).toBeVisible();

    // Focus on Level 2 (nested focus)
    await page.click('[data-block-id="level-2"] .grip-handle');
    await expect(page.locator('[data-focus-mode="level-2"]')).toBeVisible();

    // Verify: Breadcrumb shows path
    await expect(page.locator('[data-testid="breadcrumb"]')).toContainText('Level 1 / Level 2');

    // Navigate back via breadcrumb
    await page.click('[data-breadcrumb-id="level-1"]');
    await expect(page.locator('[data-focus-mode="level-1"]')).toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should sync focus state across tabs', async ({ page, context }) => {
    await createBullet(page, 'Target');

    // Enter focus mode
    await page.click('[data-block-id="target"] .grip-handle');

    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('/');

    // Wait for state sync
    await page2.waitForTimeout(500);

    // Verify: Second tab also in focus mode
    await expect(page2.locator('[data-focus-mode="target"]')).toBeVisible();

    // Exit focus mode in second tab
    await page2.click('[data-testid="exit-focus-mode"]');

    // Wait for sync
    await page.waitForTimeout(500);

    // Verify: First tab also exited focus mode
    await expect(page.locator('[data-focus-mode]')).not.toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should handle rapid focus mode toggling', async ({ page }) => {
    await createBullet(page, 'Target');

    // Rapidly toggle focus mode 10 times
    for (let i = 0; i < 10; i++) {
      await page.click('[data-block-id="target"] .grip-handle');
      await page.waitForTimeout(50);
      await page.click('[data-testid="exit-focus-mode"]');
      await page.waitForTimeout(50);
    }

    // Verify: Final state consistent
    await expect(page.locator('[data-focus-mode]')).not.toBeVisible();
    await expect(page.locator('[data-block-id="target"]')).toBeVisible();

    // Verify: No state corruption
    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should preserve scroll position during focus navigation', async ({ page }) => {
    // Create 50 bullets
    for (let i = 1; i <= 50; i++) {
      await createBullet(page, `Bullet ${i}`);
    }

    // Scroll to bottom
    await page.locator('[data-block-id="bullet-50"]').scrollIntoViewIfNeeded();
    const scrollBefore = await page.evaluate(() => window.scrollY);

    // Enter focus mode on Bullet 50
    await page.click('[data-block-id="bullet-50"] .grip-handle');

    // Verify: Scroll position maintained (focused bullet still visible)
    const focusedElement = await page.locator('[data-focus-mode="bullet-50"]');
    await expect(focusedElement).toBeInViewport();

    // Exit focus mode
    await page.click('[data-testid="exit-focus-mode"]');

    // Verify: Scroll position restored
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(scrollAfter).toBeCloseTo(scrollBefore, 50);

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should handle focus mode with deleted bullet', async ({ page }) => {
    await createBullet(page, 'Target');
    await createChildBullet(page, 'Child');

    // Enter focus mode
    await page.click('[data-block-id="target"] .grip-handle');

    // Delete focused bullet (simulate another user)
    await page.evaluate(() => {
      // Direct IndexedDB deletion
      // (simulates concurrent deletion)
    });

    // Wait for sync
    await page.waitForTimeout(500);

    // Verify: Gracefully exits focus mode
    await expect(page.locator('[data-focus-mode]')).not.toBeVisible();

    // Verify: Shows message or redirects
    await expect(page.locator('text=Focused item no longer exists')).toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });
});
```

---

## Test 4: IndexedDB Persistence (Data Integrity)

**File**: `e2e/playwright/complex/indexeddb-persistence.spec.ts`

**Complexity**:
- Asynchronous persistence
- Transaction ordering
- Corruption recovery
- Migration handling
- Quota management

### Test Cases

```typescript
test.describe('Complex: IndexedDB Persistence', () => {
  test('should persist large document without data loss', async ({ page }) => {
    // Create 100 bullets with nested content
    for (let i = 1; i <= 100; i++) {
      await createBullet(page, `Bullet ${i}`);
      if (i % 10 === 0) {
        await createChildBullet(page, `Child ${i}`);
      }
    }

    // Wait for persistence
    await page.waitForTimeout(1000);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify: All bullets present
    for (let i = 1; i <= 100; i++) {
      await expect(page.locator(`text=Bullet ${i}`)).toBeVisible();
    }

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should handle rapid saves without corruption', async ({ page }) => {
    await createBullet(page, 'Test');

    const input = page.locator('[data-block-id="test"] [contenteditable]');

    // Rapidly type 200 characters
    const longText = 'a'.repeat(200);
    await input.type(longText, { delay: 0 });

    // Wait for all persistence operations
    await page.waitForTimeout(500);

    // Reload to verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify: All characters persisted
    const content = await page.locator('[data-block-id="test"]').textContent();
    expect(content).toContain(longText);

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should recover from corrupted IndexedDB', async ({ page }) => {
    await createBullet(page, 'Good Data');

    // Corrupt IndexedDB
    await page.evaluate(() => {
      // Write invalid data to IndexedDB
      const request = indexedDB.open('hydra-notes');
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(['blocks'], 'readwrite');
        const store = tx.objectStore('blocks');
        store.put({ id: 'corrupted', data: null }); // Invalid data
      };
    });

    // Reload page
    await page.reload();

    // Verify: App loads (handles corruption)
    await expect(page.locator('[data-testid="editor"]')).toBeVisible();

    // Verify: Good data still accessible
    await expect(page.locator('text=Good Data')).toBeVisible();

    // Verify: Corrupted data removed or isolated
    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should handle storage quota exceeded', async ({ page }) => {
    // Mock quota exceeded scenario
    await page.evaluate(() => {
      // Override IndexedDB to simulate quota error
      const originalPut = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function(...args) {
        throw new DOMException('QuotaExceededError');
      };
    });

    // Try to create bullet
    await createBullet(page, 'Test');

    // Verify: Graceful error handling
    await expect(page.locator('text=Storage quota exceeded')).toBeVisible();

    // Verify: App still functional
    await expect(page.locator('[data-testid="editor"]')).toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });

  test('should maintain referential integrity during cascade operations', async ({ page }) => {
    // Create parent with 10 children
    await createBullet(page, 'Parent');
    for (let i = 1; i <= 10; i++) {
      await createChildBullet(page, `Child ${i}`);
    }

    // Create portals to some children
    await createPortalTo(page, 'Child 5');
    await createPortalTo(page, 'Child 8');

    // Delete parent (should cascade)
    await deleteBullet(page, 'Parent');

    // Wait for cascade operations
    await page.waitForTimeout(500);

    // Reload to verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify: Parent and all children deleted
    await expect(page.locator('text=Parent')).not.toBeVisible();
    for (let i = 1; i <= 10; i++) {
      await expect(page.locator(`text=Child ${i}`)).not.toBeVisible();
    }

    // Verify: Orphaned portals cleaned up
    await expect(page.locator('[data-portal-target="child-5"]')).not.toBeVisible();

    expect(consoleMonitor.hasErrors()).toBe(false);
  });
});
```

---

## Acceptance Criteria

- [ ] All 4 test files created with comprehensive coverage
- [ ] Tests cover complex multi-system interactions
- [ ] Async operations properly handled with appropriate waits
- [ ] Concurrent scenarios tested (multiple tabs/users)
- [ ] Error recovery and edge cases covered
- [ ] All tests pass: `npx playwright test e2e/playwright/complex/`
- [ ] Tests are deterministic (no flaky failures)
- [ ] Each test completes in <15 seconds
- [ ] Helper functions created for complex scenarios

---

## Testing Strategy

### Step 4: Run Tests
```bash
npx playwright test e2e/playwright/complex/ --workers=1
# Run sequentially to avoid test interference
```

### Step 7: Chrome E2E
- Test concurrent scenarios manually
- Verify Yjs sync behavior
- Test with network throttling
- Add discovered edge cases to tests (step 7.6)

### Step 7.5: Browser Verification
- Open DevTools Network tab
- Monitor IndexedDB in Application tab
- Verify Yjs doc states
- Screenshot: Clean console + passing tests

---

## Success Metrics

- [ ] Complex interactions tested comprehensively
- [ ] No race conditions in tests
- [ ] Concurrent scenarios work correctly
- [ ] All tests pass 10 times consecutively (no flakes)
- [ ] Tests complete in <2 minutes total

---

## Related Tickets

- **Depends on**: TEST-601 (Playwright setup)
- **Validates**: Yjs integration, IndexedDB persistence, state management
- **Prevents**: Sync conflicts, data corruption, state inconsistencies

---

## Definition of Done

- [ ] All 4 complex interaction test files implemented
- [ ] All tests passing in CI
- [ ] No false positives after 10 consecutive runs
- [ ] Documentation updated with complex testing patterns
- [ ] Screenshot evidence: All tests green in HTML report
