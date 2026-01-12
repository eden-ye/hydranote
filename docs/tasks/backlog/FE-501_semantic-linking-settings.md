# FE-501: Semantic Linking Settings

## Description
Add settings UI for configuring semantic linking behavior including similarity threshold.

## Automation Status
**✅ AUTO** - 100% automated by Claude Code

## Acceptance Criteria
- [ ] Toggle: Enable/disable semantic linking feature
- [ ] Slider: Similarity threshold (0.5 - 1.0), default 0.8
- [ ] Input: Max suggestions per concept (1-10), default 3
- [ ] Settings persisted in user preferences (IndexedDB + Supabase sync)
- [ ] Settings accessible from main settings panel
- [ ] Show threshold explanation: "Higher = more precise, Lower = more results"

## Technical Details

### Settings Store
```typescript
interface SemanticLinkingSettings {
  enabled: boolean;           // Default: true
  threshold: number;          // Default: 0.8
  maxSuggestionsPerConcept: number;  // Default: 3
}

// In settings store
const semanticLinkingSettings = {
  enabled: true,
  threshold: 0.8,
  maxSuggestionsPerConcept: 3,
};
```

### UI Component
```typescript
// Settings panel section
<section class="settings-section">
  <h3>Semantic Linking</h3>

  <div class="setting-row">
    <label>Enable semantic linking</label>
    <toggle bind:checked={settings.enabled} />
  </div>

  <div class="setting-row" class:disabled={!settings.enabled}>
    <label>
      Similarity threshold
      <span class="hint">Higher = more precise matches</span>
    </label>
    <input type="range"
           min="0.5" max="1.0" step="0.05"
           bind:value={settings.threshold} />
    <span class="value">{settings.threshold}</span>
  </div>

  <div class="setting-row" class:disabled={!settings.enabled}>
    <label>Max suggestions per concept</label>
    <input type="number" min="1" max="10"
           bind:value={settings.maxSuggestionsPerConcept} />
  </div>
</section>
```

### Threshold Guide (in UI)
| Threshold | Meaning |
|-----------|---------|
| 0.9+ | Very similar (same concept) |
| 0.8 | Related (recommended default) |
| 0.7 | Loosely related |
| 0.5-0.6 | Distant connections |

## Dependencies
- None (settings infrastructure should exist)

## Parallel Safe With
- EDITOR-*, API-*, AUTH-*

## Notes
Part of Epic 5: Semantic Linking. User control over feature behavior.

**Design Doc**: See `docs/design/semantic-search.md` for full architecture.

## Status
- **Created**: 2026-01-10
- **Updated**: 2026-01-12 (threshold default changed to 0.8)
- **Status**: pending
- **Epic**: MVP2 - Semantic Linking
