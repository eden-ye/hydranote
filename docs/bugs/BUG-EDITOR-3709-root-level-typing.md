# BUG-EDITOR-3709: Prevent Root-Level Typing in Editor

## Symptoms

- Users can type at the root level of the editor (outside of any bullet)
- A "Type '/' for commands" placeholder appears at the root level
- Content typed at root level is not properly structured in the hierarchy

## Expected Behavior

- Users should NEVER be able to type at the root level
- All content must exist within bullets (hierarchical structure)
- The root level should not accept text input or show typing placeholders
- Only the first bullet (title bullet) should be directly editable at the top level

## Root Cause Analysis

### Hypothesis

The BlockSuite editor's page block or root note block may be accepting keyboard input when it shouldn't. The "Type '/' for commands" placeholder suggests a default BlockSuite behavior that needs to be disabled for our hierarchical note-taking application.

### Areas to Investigate

1. **page-block configuration**: Check if the page block is configured to prevent direct text input
2. **note-block root**: The root note block may be allowing text entry
3. **Event handling**: Keyboard events at the root level should be intercepted and redirected to the first bullet
4. **Placeholder text**: The "Type '/' for commands" placeholder should not appear at root level

## Proposed Solution

1. Disable text input on the root page/note block
2. Remove or hide the "Type '/' for commands" placeholder at root level
3. Redirect any typing at root level to create/focus the first bullet
4. Ensure the editor always has at least one bullet for user input

## Impact

- Medium priority - affects data structure integrity
- Users may accidentally create orphaned content outside the bullet hierarchy
- Confusing UX where some content doesn't follow hierarchical rules

## Acceptance Criteria

- [ ] No placeholder text appears at the root level
- [ ] Clicking at root level focuses the first bullet (or creates one)
- [ ] Typing at root level is either blocked or redirected to bullets
- [ ] All content remains within the bullet hierarchy

## Timeline

- Reported: 2026-01-13
- Status: Pending
