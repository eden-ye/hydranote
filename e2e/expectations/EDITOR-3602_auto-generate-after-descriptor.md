# EDITOR-3602: Auto-Generate After Descriptor - E2E Test Expectations

## Feature Description
Optionally auto-generate content immediately after a descriptor is created, with debouncing and cancellation support.

## Test Scenarios

### Scenario 1: Auto-Generation Triggers After Descriptor Insertion
**Precondition**: Auto-generation is enabled in settings

**Steps**:
1. Navigate to http://localhost:5173
2. Enable auto-generation (if settings UI exists, or verify default state)
3. Create a bullet with text "Features"
4. Type `~what` to insert a descriptor
5. **Expected**: "Preparing to generate content..." indicator appears
6. **Expected**: After 500ms, indicator changes to "Generating content..."
7. **Expected**: Generated bullets appear as children
8. **Expected**: Indicator disappears when complete
9. **Expected**: No console errors

### Scenario 2: User Can Cancel Pending Generation by Typing
**Precondition**: Auto-generation is enabled

**Steps**:
1. Navigate to the editor
2. Create a bullet and insert a descriptor (`~why`)
3. Wait for "Preparing to generate content..." indicator
4. Immediately start typing in the editor (before 500ms elapses)
5. **Expected**: Generation is cancelled
6. **Expected**: Indicator disappears
7. **Expected**: No generated content appears
8. **Expected**: No console errors

### Scenario 3: User Can Cancel Active Generation
**Precondition**: Auto-generation is enabled

**Steps**:
1. Navigate to the editor
2. Create a bullet and insert a descriptor (`~how`)
3. Wait for generation to start (after 500ms debounce)
4. Click the "Cancel" button in the indicator
5. **Expected**: Generation stops
6. **Expected**: Indicator disappears
7. **Expected**: Partial content may exist but no more content streams
8. **Expected**: No console errors

### Scenario 4: Auto-Generation Respects Settings
**Precondition**: Auto-generation is disabled

**Steps**:
1. Navigate to the editor
2. Disable auto-generation (or verify it's off)
3. Create a bullet and insert a descriptor
4. **Expected**: No indicator appears
5. **Expected**: No auto-generation occurs
6. **Expected**: No console errors

### Scenario 5: Multiple Descriptors Don't Cause Conflicts
**Precondition**: Auto-generation is enabled

**Steps**:
1. Navigate to the editor
2. Insert first descriptor (`~what`)
3. Wait for generation to complete
4. Insert second descriptor (`~why`)
5. **Expected**: Second generation starts after first completes
6. **Expected**: No overlapping generations
7. **Expected**: No console errors

## Verification Checklist
- [ ] Auto-generation triggers after descriptor insertion when enabled
- [ ] Debounce period (500ms) works correctly
- [ ] User can cancel pending generation by typing
- [ ] User can cancel active generation with Cancel button
- [ ] Auto-generation respects enabled/disabled setting
- [ ] Visual indicators show correct state (pending/generating)
- [ ] No console errors during any scenario
- [ ] Generated content appears correctly
