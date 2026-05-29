-- Tighten message visibility so Realtime postgres_changes only streams allowed rows.

DROP POLICY IF EXISTS "Authenticated can read messages" ON public.messages;
DROP POLICY IF EXISTS "Users insert own messages" ON public.messages;

CREATE POLICY "Members can read thread messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  (
    thread_type = 'group'
    AND public.is_group_member(thread_id::uuid)
  )
  OR (
    thread_type = 'event'
    AND EXISTS (SELECT 1 FROM public.events e WHERE e.id = thread_id::uuid)
  )
);

CREATE POLICY "Members can post to allowed threads"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    (
      thread_type = 'group'
      AND public.is_group_member(thread_id::uuid)
    )
    OR (
      thread_type = 'event'
      AND EXISTS (SELECT 1 FROM public.events e WHERE e.id = thread_id::uuid)
    )
  )
);