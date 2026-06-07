import { useMemo } from "react";

// Approximate lat/lng centres for Berlin Kieze / Bezirke
const KIEZ_COORDS: Record<string, { lat: number; lng: number; emoji: string }> = {
  "Mitte":                  { lat: 52.5200, lng: 13.4050, emoji: "🏛️" },
  "Prenzlauer Berg":        { lat: 52.5390, lng: 13.4190, emoji: "🍺" },
  "Friedrichshain":         { lat: 52.5157, lng: 13.4540, emoji: "🎬" },
  "Kreuzberg":              { lat: 52.4990, lng: 13.4030, emoji: "🌶️" },
  "Neukölln":               { lat: 52.4810, lng: 13.4350, emoji: "🌻" },
  "Tempelhof":              { lat: 52.4730, lng: 13.3850, emoji: "🛫" },
  "Schöneberg":             { lat: 52.4880, lng: 13.3560, emoji: "🌈" },
  "Charlottenburg":         { lat: 52.5066, lng: 13.3040, emoji: "🎠" },
  "Wilmersdorf":            { lat: 52.4940, lng: 13.3150, emoji: "🦉" },
  "Zehlendorf":             { lat: 52.4310, lng: 13.2630, emoji: "🌲" },
  "Steglitz":               { lat: 52.4570, lng: 13.3220, emoji: "🌿" },
  "Wedding":                { lat: 52.5490, lng: 13.3600, emoji: "💐" },
  "Pankow":                 { lat: 52.5680, lng: 13.4030, emoji: "🌷" },
  "Weißensee":              { lat: 52.5500, lng: 13.4590, emoji: "🦢" },
  "Lichtenberg":            { lat: 52.5120, lng: 13.5000, emoji: "🏭" },
  "Treptow":                { lat: 52.4780, lng: 13.4870, emoji: "🚤" },
  "Köpenick":               { lat: 52.4490, lng: 13.5790, emoji: "🏰" },
  "Spandau":                { lat: 52.5350, lng: 13.1990, emoji: "⚓" },
  "Marzahn":                { lat: 52.5420, lng: 13.5570, emoji: "🌻" },
  "Reinickendorf":          { lat: 52.5830, lng: 13.3450, emoji: "🌊" },
};

// Bounding box for all points so we can normalise to SVG coordinates
const ALL_LATS = Object.values(KIEZ_COORDS).map((c) => c.lat);
const ALL_LNGS = Object.values(KIEZ_COORDS).map((c) => c.lng);
const MIN_LAT = Math.min(...ALL_LATS) - 0.02;
const MAX_LAT = Math.max(...ALL_LATS) + 0.02;
const MIN_LNG = Math.min(...ALL_LNGS) - 0.03;
const MAX_LNG = Math.max(...ALL_LNGS) + 0.03;

const W = 360;
const H = 280;

function project(lat: number, lng: number) {
  const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * W;
  // lat increases northward → invert for SVG y
  const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * H;
  return { x, y };
}

type BubbleEntry = {
  name: string;
  count: number;
  emoji: string;
  x: number;
  y: number;
};

const TONE_COLORS = ["#ef6b53", "#4fa3c7", "#f4c542", "#5ba85b", "#b46fbb", "#e8895a"];

export function NeighborhoodMap({
  counts,
  myNeighborhood,
  onSelect,
}: {
  counts: Record<string, number>;
  myNeighborhood?: string | null;
  onSelect?: (name: string) => void;
}) {
  const bubbles = useMemo<BubbleEntry[]>(() => {
    return Object.entries(KIEZ_COORDS).map(([name, c], i) => {
      const { x, y } = project(c.lat, c.lng);
      return { name, count: counts[name] ?? 0, emoji: c.emoji, x, y };
    });
  }, [counts]);

  const maxCount = Math.max(...bubbles.map((b) => b.count), 1);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ display: "block" }}
      >
        {/* faint grid lines for atmosphere */}
        {[...Array(5)].map((_, i) => (
          <line
            key={`h${i}`}
            x1={0} y1={(H / 4) * i}
            x2={W} y2={(H / 4) * i}
            stroke="#e5e7eb" strokeWidth={0.5}
          />
        ))}
        {[...Array(7)].map((_, i) => (
          <line
            key={`v${i}`}
            x1={(W / 6) * i} y1={0}
            x2={(W / 6) * i} y2={H}
            stroke="#e5e7eb" strokeWidth={0.5}
          />
        ))}

        {bubbles.map((b, i) => {
          const r = b.count > 0 ? 10 + (b.count / maxCount) * 14 : 8;
          const isMe = b.name === myNeighborhood;
          const color = TONE_COLORS[i % TONE_COLORS.length];
          const hasUsers = b.count > 0;

          return (
            <g
              key={b.name}
              onClick={() => onSelect?.(b.name)}
              style={{ cursor: onSelect ? "pointer" : "default" }}
            >
              {/* pulse ring for neighbourhoods with users */}
              {hasUsers && (
                <circle
                  cx={b.x} cy={b.y}
                  r={r + 5}
                  fill={color}
                  opacity={0.12}
                />
              )}
              <circle
                cx={b.x} cy={b.y}
                r={r}
                fill={isMe ? "#ef6b53" : hasUsers ? color : "#f3f4f6"}
                stroke={isMe ? "#c84c35" : hasUsers ? color : "#d1d5db"}
                strokeWidth={isMe ? 2 : 1}
                opacity={hasUsers ? 0.9 : 0.5}
              />
              {/* emoji */}
              <text
                x={b.x} y={b.y - 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={r > 14 ? 11 : 9}
              >
                {b.emoji}
              </text>
              {/* count badge */}
              {b.count > 0 && (
                <text
                  x={b.x + r - 2} y={b.y - r + 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={7}
                  fontWeight="700"
                  fill="white"
                >
                  {/* shown as small dot in circle */}
                </text>
              )}
              {/* label */}
              <text
                x={b.x} y={b.y + r + 7}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={hasUsers ? 7.5 : 6.5}
                fontWeight={hasUsers ? "700" : "400"}
                fill={hasUsers ? "#374151" : "#9ca3af"}
              >
                {b.name.length > 12 ? b.name.slice(0, 11) + "…" : b.name}
              </text>
              {b.count > 0 && (
                <text
                  x={b.x} y={b.y + r + 15}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={6.5}
                  fill="#ef6b53"
                  fontWeight="700"
                >
                  {b.count} {b.count === 1 ? "person" : "people"}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex items-center gap-3 border-t border-border/40 px-3 py-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-coral" /> You
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-lake" /> Friends here
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-muted" /> No one yet
        </span>
      </div>
    </div>
  );
}
