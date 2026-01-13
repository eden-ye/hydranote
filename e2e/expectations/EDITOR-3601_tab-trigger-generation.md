# EDITOR-3601: Tab Trigger at Deepest Level - E2E Test Expectations

## Feature Description
When user presses Tab at the maximum indentation level (can't indent further), trigger AI generation for the parent descriptor.

## Test Scenarios

### Scenario 1: Tab Triggers AI Generation Under Descriptor
**Precondition**: Auto-generation is disabled (to isolate Tab trigger behavior)

**Steps**:
1. Navigate to http://localhost:5173
2. Create a bullet block with text "Product features"
3. Type `~what` to insert a "What" descriptor
4. Press Enter to create a child bullet
5. Press Tab (should trigger generation since no previous sibling exists)
6. **Expected**: Console log shows "[DescriptorGenerate] Generating for descriptor:"
7. **Expected**: Loading indicator appears
8. **Expected**: Generated bullets appear as children
9. **Expected**: No console errors

### Scenario 2: Tab Indents Normally When Previous Sibling Exists
**Precondition**: None

**Steps**:
1. Navigate to the editor
2. Create a descriptor with two child bullets
3. In the second child bullet, press Tab
4. **Expected**: Bullet indents under first sibling (normal Tab behavior)
5. **Expected**: AI generation does NOT trigger
6. **Expected**: No console errors

### Scenario 3: Tab Does Nothing When Not Under Descriptor
**Precondition**: None

**Steps**:
1. Navigate to the editor
2. Create a regular bullet (no descriptor parent)
3. Press Tab when there's no previous sibling
4. **Expected**: Nothing happens (can't indent at root level)
5. **Expected**: AI generation does NOT trigger
6. **Expected**: No console errors

## Verification Checklist
- [ ] Tab triggers AI generation when under descriptor with no previous sibling
- [ ] Generated content appears correctly
- [ ] Tab works normally (indents) when previous sibling exists
- [ ] Tab does nothing when not under a descriptor
- [ ] No console errors during generation
- [ ] Loading indicator displays during generation
