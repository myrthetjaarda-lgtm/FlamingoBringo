import { Instagram, Facebook } from "lucide-react";

export function instagramUrl(handle: string) {
  const h = handle.trim().replace(/^@/, "");
  if (/^https?:\/\//i.test(handle)) return handle;
  return `https://instagram.com/${h}`;
}

export function facebookUrl(value: string) {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  return `https://facebook.com/${v.replace(/^@/, "")}`;
}

export function SocialLinks({
  instagram,
  facebook,
  size = "sm",
}: {
  instagram?: string | null;
  facebook?: string | null;
  size?: "sm" | "md";
}) {
  if (!instagram && !facebook) return null;
  const cls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {instagram && (
        <a
          href={instagramUrl(instagram)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-2.5 py-1 text-[11px] font-semibold text-coral"
        >
          <Instagram className={cls} /> Instagram
        </a>
      )}
      {facebook && (
        <a
          href={facebookUrl(facebook)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-lake/15 px-2.5 py-1 text-[11px] font-semibold text-lake"
        >
          <Facebook className={cls} /> Facebook
        </a>
      )}
    </div>
  );
}
