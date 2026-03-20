# Supabase Edge Function Deployment

This project uses Supabase Edge Functions under `supabase/functions/`.

## Functions in repo
- `supabase/functions/filter-game-state`
- `supabase/functions/ask-ai`
- `supabase/functions/game-operation`
- `supabase/functions/push-subscription`

## Deploy (CLI)
1. Login: `supabase login`
2. Link project: `supabase link --project-ref <project_ref>`
3. Deploy function:
   - `supabase functions deploy filter-game-state`
   - `supabase functions deploy ask-ai`
   - `supabase functions deploy game-operation`
   - `supabase functions deploy push-subscription`
4. Set secrets:
   - `supabase secrets set OPENAI_API_KEY=...`
   - `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`
   - `supabase secrets set VAPID_PRIVATE_KEY=...`
5. Verify logs:
   - `supabase functions logs --project-ref <project_ref> --function filter-game-state`
   - `supabase functions logs --project-ref <project_ref> --function game-operation`
   - `supabase functions logs --project-ref <project_ref> --function push-subscription`

## Post-deploy validation
- Confirm function HTTP 200 for valid payload
- Confirm auth and CORS behavior for invalid payload
- Confirm frontend integration path uses deployed endpoint
