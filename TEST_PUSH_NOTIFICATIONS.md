# Push Notification Test Plan

## Preconditions
- Valid `VITE_VAPID_PUBLIC_KEY`
- Valid server-side `VAPID_PRIVATE_KEY`
- Browser permission granted

## Test matrix
1. Permission flow: default -> granted / denied
2. Subscription flow: create, persist, re-load
3. Delivery flow: send push payload and verify notification rendering
4. Interaction flow: click notification and verify deep-link/open behavior
5. Failure flow: expired subscription / invalid key handling

## Pass criteria
- Subscription succeeds for supported browsers
- Notifications are received with expected title/body
- Click action routes to expected app screen
