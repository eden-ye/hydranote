# FE-603: User API Key Settings

## Summary
Allow users to configure their own AI API key in the settings panel.

## Approach
**Client-side direct** - Store key in localStorage, make AI calls directly from browser.

### Tradeoffs Considered
| Aspect | Client-Side (chosen) | Backend Proxy |
|--------|---------------------|---------------|
| Security | Key in localStorage | Key encrypted in DB |
| Complexity | Simple | More complex |
| Latency | Faster | +50-100ms |
| Privacy | Direct to AI | Backend sees requests |

## Desired Behavior

### Settings UI
- New section in Settings modal: "AI Configuration"
- Input field for API key (masked)
- Test button to verify key works
- Clear button to remove key

### Usage
- If user key exists, use it for all AI calls
- If no user key, fall back to app's key (with rate limits)
- Show indicator when using personal key

## Acceptance Criteria
- [ ] API key input in settings panel
- [ ] Key stored in localStorage (encrypted if possible)
- [ ] Test button verifies key with simple API call
- [ ] Clear button removes stored key
- [ ] AI calls use user key when available
- [ ] Fallback to app key if no user key
- [ ] Visual indicator for which key is in use

## Security Notes
- Key visible in browser dev tools (inherent to client-side)
- Document this limitation for users
- Consider future backend proxy option for enterprise

## Estimate
6 hours

## Status
- **Created**: 2026-01-13
- **Status**: pending
- **Epic**: MVP3 - Settings
