# Project Retrospective: MVP2 Bug Cycle

**Date**: 2026-01-14

---

## The Problem

Features marked "complete" after unit tests pass, but broken in browser.

**Pattern:**
```
Tests pass ✅ → Build succeeds ✅ → Mark complete → Feature broken in browser ❌
```

**Impact:** ~40-60% of time spent fixing "complete" work.

---

## Root Causes

| Cause | Weight | Example |
|-------|--------|---------|
| No browser verification | 50% | EDITOR-3508: 42 tests pass, feature doesn't work |
| E2E tests not run | 30% | Tests written but not executed before completion |
| Missing spike tests | 15% | Used unfamiliar API without testing first |
| Framework complexity | 5% | BlockSuite + Lit + Yjs edge cases |

---

## Bug Examples

| Bug | Tests | Reality |
|-----|-------|---------|
| EDITOR-3508 (Focus Mode) | 42 pass | Content filtering broken |
| EDITOR-3510 (Markdown) | 82 pass | Shortcuts don't convert |
| BUG-001 (Portal) | Pass | 12+ console errors, crash |

---

## Fix: Add Browser Verification Gate

**New Step 7.5 (between E2E and completion):**

```
□ Open http://localhost:5173
□ Open DevTools Console
□ Console shows ZERO errors
□ Feature works manually
□ Screenshot: working feature + clean console

BLOCKING: Cannot mark complete if any check fails
```

---

## Key Rules Added to CLAUDE.md

1. **Spike test unfamiliar APIs** (5 min in console before implementation)
2. **Check console errors during ALL Chrome testing**
3. **Add null checks in Lit component `renderBlock()` methods**

---

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Bug rate after completion | ~30% | <10% |
| Rework time | ~45% | <15% |
| Console errors at completion | Unknown | 0 |

---

## Summary

**Problem:** Marking features complete before browser verification.

**Solution:** Add mandatory browser verification step with clean console check.

**Expected result:** ~30-40% reduction in development time.
