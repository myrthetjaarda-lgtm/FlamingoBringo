-- Schedule the fetch-festivals Edge Function to run daily via pg_cron.
--
-- One-time manual setup after this migration runs (values are secrets, so
-- they're not committed to the repo):
--   1. Deploy the function:      supabase functions deploy fetch-festivals
--   2. Set its shared secret:    supabase secrets set CRON_SECRET=<a random string>
--   3. In the SQL editor, store that same value for pg_cron to send back:
--        select vault.create_secret('<the same random string>', 'festivals_cron_secret');
-- Until step 3 is done, the cron job below will run but the function will
-- reject its requests with 401 (safe default — no accidental writes).

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'fetch-festivals-daily',
  '0 4 * * *', -- 04:00 UTC daily
  $$
  SELECT net.http_post(
    url := 'https://ugyerbycgotkfilepbfw.supabase.co/functions/v1/fetch-festivals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'festivals_cron_secret'),
        ''
      )
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
