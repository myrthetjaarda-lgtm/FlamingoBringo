
-- Group/event chat messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_type TEXT NOT NULL CHECK (thread_type IN ('group','event')),
  thread_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_thread ON public.messages (thread_type, thread_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read messages"
  ON public.messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users insert own messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own messages"
  ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own messages"
  ON public.messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
