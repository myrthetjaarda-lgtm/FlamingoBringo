import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Pencil, Trash2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type Row = {
  id: string;
  thread_type: "group" | "event";
  thread_id: string;
  user_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
};

type ProfileLite = { id: string; display_name: string; emoji_avatar: string };

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatThread({
  threadType,
  threadId,
  title = "Chat",
  emptyHint = "Be the first to say something 🦩",
  isOrganizer = false,
}: {
  threadType: "group" | "event";
  threadId: string;
  title?: string;
  emptyHint?: string;
  isOrganizer?: boolean;
}) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Row[]>([]);
  const [authors, setAuthors] = useState<Record<string, ProfileLite>>({});
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const reload = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("id,thread_type,thread_id,user_id,body,created_at,edited_at")
      .eq("thread_type", threadType)
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) {
      setError(error.message);
      return;
    }
    setMessages((data as Row[]) ?? []);
  };

  // initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await reload();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadType, threadId]);

  // realtime (any change re-syncs the thread)
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${threadType}:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        () => void reload(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadType, threadId]);

  // load missing author profiles
  const missingIds = useMemo(() => {
    const ids = new Set(messages.map((m) => m.user_id));
    Object.keys(authors).forEach((id) => ids.delete(id));
    return Array.from(ids);
  }, [messages, authors]);

  useEffect(() => {
    if (missingIds.length === 0) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, emoji_avatar")
        .in("id", missingIds);
      if (cancelled || !data) return;
      setAuthors((prev) => {
        const next = { ...prev };
        for (const p of data as ProfileLite[]) next[p.id] = p;
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [missingIds]);

  // autoscroll
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !user || sending) return;
    setSending(true);
    setError(null);
    const { error } = await supabase.from("messages").insert({
      thread_type: threadType,
      thread_id: threadId,
      user_id: user.id,
      body,
    });
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDraft("");
  }

  async function saveEdit(id: string) {
    const body = editDraft.trim();
    if (!body) return;
    const { error } = await supabase
      .from("messages")
      .update({ body, edited_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Couldn't edit message");
      return;
    }
    setEditingId(null);
    setEditDraft("");
    void reload();
  }

  async function remove(id: string) {
    if (!confirm("Remove message?")) return;
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't remove message");
      return;
    }
    void reload();
  }

  return (
    <div className="rounded-3xl border border-border/60 bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <p className="font-display text-sm font-semibold">{title}</p>
        <span className="text-[11px] text-muted-foreground">
          {messages.length} {messages.length === 1 ? "message" : "messages"} · live
        </span>
      </div>
      <div
        ref={scrollerRef}
        className="max-h-[360px] min-h-[160px] space-y-2 overflow-y-auto px-3 py-3"
      >
        {messages.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">{emptyHint}</p>
        )}
        {messages.map((m) => {
          const mine = m.user_id === user?.id;
          const canModify = mine;
          const canDelete = mine || isOrganizer;
          const author = mine
            ? { display_name: profile?.display_name ?? "You", emoji_avatar: profile?.emoji_avatar ?? "🦩" }
            : authors[m.user_id] ?? { display_name: "Friend", emoji_avatar: "🦩" };
          const editing = editingId === m.id;
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-base"
                aria-hidden
              >
                {author.emoji_avatar}
              </span>
              <div className={`max-w-[78%] ${mine ? "items-end text-right" : ""} flex flex-col`}>
                <span className="px-1 text-[10px] font-semibold text-muted-foreground">
                  {author.display_name} · {fmtTime(m.created_at)}
                  {m.edited_at && " · edited"}
                </span>
                {editing ? (
                  <div className="mt-0.5 flex items-center gap-1">
                    <input
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      maxLength={2000}
                      className="flex-1 rounded-xl border border-border/60 bg-background px-2 py-1 text-[13px]"
                    />
                    <button
                      onClick={() => void saveEdit(m.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-coral text-white"
                      aria-label="Save edit"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-muted"
                      aria-label="Cancel edit"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`mt-0.5 whitespace-pre-wrap break-words rounded-2xl px-3 py-1.5 text-[13px] shadow-card ${
                      mine
                        ? "bg-coral text-white"
                        : "bg-background text-foreground border border-border/60"
                    }`}
                  >
                    {m.body}
                  </div>
                )}
                {!editing && (canModify || canDelete) && (
                  <div className={`mt-0.5 flex gap-2 px-1 ${mine ? "justify-end" : ""}`}>
                    {canModify && (
                      <button
                        onClick={() => {
                          setEditingId(m.id);
                          setEditDraft(m.body);
                        }}
                        className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground hover:text-lake"
                      >
                        <Pencil className="h-2.5 w-2.5" /> Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => void remove(m.id)}
                        className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground hover:text-coral"
                      >
                        <Trash2 className="h-2.5 w-2.5" /> Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={send} className="flex items-center gap-2 border-t border-border/60 px-3 py-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
          placeholder={user ? "Write a message…" : "Sign in to chat"}
          disabled={!user || sending}
          className="flex-1 rounded-full bg-secondary px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!user || !draft.trim() || sending}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-coral text-white shadow-card transition disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      {error && <p className="px-4 pb-2 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
