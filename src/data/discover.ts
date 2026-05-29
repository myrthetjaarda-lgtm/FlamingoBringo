export type SocialMode =
  | "Looking for plans"
  | "Chill only"
  | "Party mode"
  | "Outdoor mode"
  | "Sports mood"
  | "Quiet weekend"
  | "Family time"
  | "Lake mode ☀️";

export type AvailabilityStatus =
  | "In Berlin"
  | "Traveling"
  | "On holiday"
  | "Busy"
  | "Open for plans"
  | "Working remotely"
  | "Free this weekend";

export type Person = {
  id: string;
  name: string;
  emoji: string;
  neighborhood: string;
  status: AvailabilityStatus;
  mode: SocialMode;
  interests: string[];
  freeWindow?: string;
  awayUntil?: string;
  distanceKm?: number;
};

export const INTERESTS = [
  "BBQs", "Lakes", "Open-air cinema", "Cinema", "Museums", "Clubs",
  "Festivals", "Markets", "Karaoke", "Hiking", "Board games", "Tech meetups",
  "Sports", "Volleyball", "Swimming", "Dancing", "Beer gardens",
  "Food markets", "Picnics", "Cycling",
] as const;

// Real people come from the profiles table. No seeded fake users.
export const people: Person[] = [];

export type Suggestion = {
  id: string;
  emoji: string;
  title: string;
  where: string;
  why: string;
  matches: number;
  tone: "coral" | "lake" | "sun" | "leaf";
  when: string;
};

export const suggestions: Suggestion[] = [
  { id: "weissensee", emoji: "🏖️", title: "Weißensee swim & picnic",
    where: "Weißer See · Pankow", when: "Sat 14:00",
    why: "Sunny 27° · classic lake day", matches: 0, tone: "lake" },
  { id: "freiluftkino", emoji: "🎬", title: "Freiluftkino Hasenheide",
    where: "Hasenheide · Neukölln", when: "Tonight 21:30",
    why: "Open-air cinema under the stars", matches: 0, tone: "coral" },
  { id: "biergarten", emoji: "🍺", title: "Prater Biergarten",
    where: "Kastanienallee · P-Berg", when: "Fri 18:00",
    why: "Warm evening in a Berlin classic", matches: 0, tone: "sun" },
  { id: "tempelhof", emoji: "🛼", title: "Tempelhofer Feld sunset",
    where: "Tempelhofer Feld", when: "Sun 19:45",
    why: "Endless skies + skate culture", matches: 0, tone: "leaf" },
  { id: "markt", emoji: "🥕", title: "Markthalle Neun Streetfood",
    where: "Eisenbahnstr. · Kreuzberg", when: "Thu 17:00",
    why: "Berlin's iconic food market night", matches: 0, tone: "coral" },
  { id: "volley", emoji: "🏐", title: "Beach volley @ Beach Mitte",
    where: "Caroline-Michaelis-Str.", when: "Sun 16:00",
    why: "Pickup games all afternoon", matches: 0, tone: "lake" },
];

export const heatmap = [
  { area: "Neukölln", count: 0, tone: "coral" as const },
  { area: "Kreuzberg", count: 0, tone: "lake" as const },
  { area: "P-Berg", count: 0, tone: "sun" as const },
  { area: "Friedrichshain", count: 0, tone: "leaf" as const },
  { area: "Mitte", count: 0, tone: "lake" as const },
  { area: "Wedding", count: 0, tone: "coral" as const },
];

export const spontaneous: { emoji: string; text: string; by: string; in: number }[] = [];
