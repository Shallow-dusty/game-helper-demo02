# Offline Operations Test Plan

## Scope
Validate offline behavior for sandbox/local workflows and queued operations.

## Manual test cases
1. Open app, enter sandbox mode, disable network, verify core interactions still work.
2. Re-enable network, verify no crash and state remains usable.
3. Force refresh while offline and validate service worker fallback behavior.
4. Validate user-facing offline indicators/messages.

## Browser tools
- Chrome DevTools -> Network -> Offline
- Application -> Service Workers

## Pass criteria
- No fatal errors in console
- UI remains interactive for offline-capable features
- Network-dependent features fail gracefully
