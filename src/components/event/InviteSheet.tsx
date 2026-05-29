import { useState } from "react";
import { Mail, MessageCircle, Send, Link2, X } from "lucide-react";

function buildChannels(shareUrl: string, shareMsg: string, subject: string) {
  const full = `${shareMsg} ${shareUrl}`;
  return [
    { k: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="h-4 w-4" />, href: `https://wa.me/?text=${encodeURIComponent(full)}` },
    { k: "sms", label: "SMS", icon: <MessageCircle className="h-4 w-4" />, href: `sms:?body=${encodeURIComponent(full)}` },
    { k: "telegram", label: "Telegram", icon: <Send className="h-4 w-4" />, href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMsg)}` },
    { k: "email", label: "Email", icon: <Mail className="h-4 w-4" />, href: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(full)}` },
  ];
}

export function InviteSheet({
  open,
  onClose,
  eventName,
  shareUrl,
  when,
}: {
  open: boolean;
  onClose: () => void;
  eventName: string;
  shareUrl: string;
  when?: string;
}) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  const shareMsg = `Join us at ${eventName} 🦩${when ? ` · ${when}` : ""} →`;
  const channels = buildChannels(shareUrl, shareMsg, eventName);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl border border-border/60 bg-card p-5 pb-8 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold">Invite friends 🦩</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {channels.map((c) => (
            <a
              key={c.k}
              href={c.href}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-1 rounded-2xl border border-border/60 bg-card px-2 py-3 text-[11px] font-semibold transition active:scale-95"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-coral/15 text-coral">{c.icon}</span>
              {c.label}
            </a>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <button
            onClick={copyLink}
            className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 text-left shadow-card"
          >
            <Link2 className="h-5 w-5 text-lake" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{copied ? "Copied! ✨" : "Copy invite link"}</p>
              <p className="truncate text-[11px] text-muted-foreground">{shareUrl}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
