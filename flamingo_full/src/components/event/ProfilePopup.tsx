import { Phone, Copy, Instagram, Facebook, Download, X } from "lucide-react";
import { toast } from "sonner";
import type { ProfileFull } from "@/lib/events";
import { instagramUrl, facebookUrl } from "@/components/SocialLinks";

function buildVCard(p: ProfileFull) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${p.display_name}`,
    p.phone ? `TEL;TYPE=CELL:${p.phone}` : "",
    p.instagram ? `URL:${instagramUrl(p.instagram)}` : "",
    p.facebook ? `URL:${facebookUrl(p.facebook)}` : "",
    p.bio ? `NOTE:${p.bio.replace(/\n/g, " ")}` : "",
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\n");
}

export function ProfilePopup({
  profile,
  onClose,
}: {
  profile: ProfileFull;
  onClose: () => void;
}) {
  const phoneVisible = profile.show_phone && !!profile.phone;

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const downloadVCard = () => {
    const blob = new Blob([buildVCard(profile)], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.display_name.replace(/\s+/g, "-")}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Contact card saved");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-background p-4 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-coral/10 text-3xl">
            {profile.emoji_avatar}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold">{profile.display_name}</p>
            {profile.bio && (
              <p className="mt-0.5 text-xs text-muted-foreground">{profile.bio}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {profile.dietary.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.dietary.map((d) => (
              <span
                key={d}
                className="rounded-full bg-leaf/15 px-2 py-0.5 text-[11px] font-semibold text-leaf"
              >
                {d}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          {phoneVisible && (
            <a
              href={`tel:${profile.phone}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-coral px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft"
            >
              <Phone className="h-3.5 w-3.5" /> Call
            </a>
          )}
          {phoneVisible && (
            <button
              onClick={() => copy(profile.phone!, "Phone number")}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border/60 px-3 py-2 text-xs font-semibold text-muted-foreground"
            >
              <Copy className="h-3.5 w-3.5" /> Copy phone
            </button>
          )}
          {profile.instagram && (
            <a
              href={instagramUrl(profile.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-coral/10 px-3 py-2 text-xs font-semibold text-coral"
            >
              <Instagram className="h-3.5 w-3.5" /> Instagram
            </a>
          )}
          {profile.facebook && (
            <a
              href={facebookUrl(profile.facebook)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-lake/15 px-3 py-2 text-xs font-semibold text-lake"
            >
              <Facebook className="h-3.5 w-3.5" /> Facebook
            </a>
          )}
          <button
            onClick={downloadVCard}
            className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-full border border-border/60 px-3 py-2 text-xs font-semibold text-muted-foreground"
          >
            <Download className="h-3.5 w-3.5" /> Share contact card (.vcf)
          </button>
        </div>

        {!phoneVisible && !profile.instagram && !profile.facebook && (
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            No public contact details shared.
          </p>
        )}
      </div>
    </div>
  );
}
