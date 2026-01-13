# EDITOR-3511: Ghost Bullet Suggestions (Inline AI Suggestions)

## Summary

Transform the "Explore Further" suggestions from a separate bottom section into inline ghost bullets that appear directly under parent bullets. When clicked, ghost bullets become real bullets and auto-generate their children via AI.

## Current Behavior

The "Explore Further" feature currently displays suggestions in a **separate section** at the bottom of the editor:
- Rendered by `GhostQuestions.tsx` component
- Shows a "EXPLORE FURTHER" header with grey background
- Displays suggestions as styled list items (not actual bullets)
- Only visible in focus mode
- Click handler is a placeholder (console.log)

## Desired Behavior

Ghost bullet suggestions should appear as **inline grey bullets** directly under parent bullets:

1. **Visual**: Grey, slightly faded bullet points positioned under their parent
2. **Interaction**:
   - Clickable - when clicked, transforms into a real bullet
   - On transformation, auto-triggers AI expansion to generate children
3. **Positioning**: Appears at the end of a parent's children (not in a separate section)
4. **Context-aware**: Suggestions relate to the parent bullet's content

### User Flow

```
Parent Bullet
├── Child 1
├── Child 2
└── [Ghost] What are the implications of this?  ← Grey, clickable
         ↓ (user clicks)
└── What are the implications of this?  ← Now a real bullet
    ├── [AI generating children...]
    └── Generated child 1
    └── Generated child 2
```

## Technical Approach

### Option A: BlockSuite Native Ghost Blocks
Create a new block type `hydra:ghost-bullet` that:
- Renders with ghost styling (grey, faded)
- On click, converts to `hydra:bullet` and triggers expansion
- Pros: Native to BlockSuite, proper document structure
- Cons: More complex, new block type to maintain

### Option B: Inline Ghost UI in Bullet Block
Add ghost suggestion rendering within `bullet-block.ts`:
- After real children, render ghost suggestion elements
- On click, create new real bullet + trigger expansion
- Pros: Simpler, contained within existing component
- Cons: Not actual blocks, may have positioning issues

### Recommended: Option B (Inline Ghost UI)
- Less architectural change
- Easier to iterate on UX
- Can upgrade to Option A later if needed

## Implementation Tasks

- [ ] Remove or hide `GhostQuestions.tsx` component from bottom section
- [ ] Add ghost bullet rendering in `bullet-block.ts` after children
- [ ] Style ghost bullets: grey color, italic, subtle background, hover state
- [ ] Wire click handler to:
  1. Create real `hydra:bullet` block with suggestion text
  2. Auto-trigger `hydra-expand-block` event for AI generation
- [ ] Generate context-aware suggestions based on parent content
- [ ] Handle loading state while AI generates children
- [ ] Add dismiss/hide functionality for individual ghost suggestions

## Acceptance Criteria

- [ ] Ghost bullets appear under parent bullets (not in separate section)
- [ ] Ghost bullets are visually distinct (grey, faded appearance)
- [ ] Clicking a ghost bullet converts it to a real bullet
- [ ] After conversion, AI automatically generates children for the new bullet
- [ ] Ghost suggestions are contextually relevant to parent content
- [ ] Loading state shown during AI generation

## Files to Modify

- `frontend/src/blocks/components/bullet-block.ts` - Add ghost bullet rendering
- `frontend/src/components/Editor.tsx` - Remove GhostQuestions from bottom
- `frontend/src/components/GhostQuestions.tsx` - May be deprecated or repurposed
- `frontend/src/styles/` - Ghost bullet styling

## Dependencies

- EDITOR-3505 (Portal subtree editing) - Completed
- AI expansion functionality (useExpandBlock hook) - Exists

## Priority

Medium - UX improvement for AI-assisted note expansion

## Related

- `GhostQuestions.tsx` - Current implementation
- `useExpandBlock.ts` - AI expansion hook
- `bullet-block.ts` - Bullet block component
