# VAPID Key Generation Guide

Use VAPID keys for Web Push.

## Generate keys
Option A (Node script):
```bash
node -e "const webpush=require('web-push');console.log(webpush.generateVAPIDKeys())"
```

Option B (web-push CLI):
```bash
npx web-push generate-vapid-keys
```

## Where to store keys
- Public key: `VITE_VAPID_PUBLIC_KEY` in frontend runtime env
- Private key: `VAPID_PRIVATE_KEY` in server/Edge Function secret store only

## Security rules
- Never commit `VAPID_PRIVATE_KEY`
- Rotate keys if leaked
- Keep environment-specific key pairs (staging vs production)
