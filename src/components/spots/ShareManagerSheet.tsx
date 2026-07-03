import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Link2, X, Copy, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { fetchMyShares, createShare, revokeShare, type ShareRow } from "@/lib/spots";

function shareUrl(token: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/share/${token}`;
}

export function ShareManagerSheet({
  open,
  onClose,
  ownerId,
}: {
  open: boolean;
  onClose: () => void;
  ownerId: string;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: shares, isLoading } = useQuery({
    queryKey: ["recommendation-shares", ownerId],
    queryFn: () => fetchMyShares(ownerId),
    enabled: open,
  });

  if (!open) return null;

  const active = (shares ?? []).filter((s) => !s.revoked_at);

  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createShare({ owner_id: ownerId, name: name.trim() });
      setName("");
      await queryClient.invalidateQueries({ queryKey: ["recommendation-shares", ownerId] });
      toast.success("Share link created");
    } catch {
      toast.error("Couldn't create share link");
    } finally {
      setSaving(false);
    }
  };

  const copy = async (s: ShareRow) => {
    try {
      await navigator.clipboard.writeText(shareUrl(s.token));
      setCopiedId(s.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const revoke = async (s: ShareRow) => {
    try {
      await revokeShare(s.id);
      await queryClient.invalidateQueries({ queryKey: ["recommendation-shares", ownerId] });
      toast.success("Share link revoked");
    } catch {
      toast.error("Couldn't revoke link");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-border/60 bg-card p-5 pb-8 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold">Share your spots 🦩</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-3 text-xs text-muted-foreground">
          Anyone with the link can see your list and add their own recommendations — no account
          needed.
        </p>

        <div className="mb-4 flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this link, e.g. Berlin trip 2026"
            maxLength={60}
            className="flex-1 rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none"
          />
          <button
            onClick={submit}
            disabled={saving || !name.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-background/50 p-4 text-center text-xs text-muted-foreground">
            No share links yet — create one above.
          </div>
        ) : (
          <div className="space-y-2">
            {active.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-3"
              >
                <Link2 className="h-4 w-4 shrink-0 text-lake" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{shareUrl(s.token)}</p>
                </div>
                <button
                  onClick={() => copy(s)}
                  aria-label="Copy link"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => revoke(s)}
                  aria-label="Revoke link"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {copiedId === s.id && (
                  <span className="text-[10px] font-semibold text-leaf">Copied!</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
