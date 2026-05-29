// Berlin local layer — mock data for spots, neighborhoods, weather and tonight/weekend ideas.

export type SpotCategory =
  | "Lake"
  | "Park"
  | "Beer garden"
  | "Open-air cinema"
  | "Food market"
  | "Rooftop"
  | "Viewpoint"
  | "Flea market"
  | "Club"
  | "Sports"
  | "Picnic spot";

export type Weather = "sunny" | "warm" | "cloudy" | "rainy" | "cool" | "evening";

export type Spot = {
  id: string;
  name: string;
  emoji: string;
  category: SpotCategory;
  neighborhood: string;
  blurb: string;
  vibe: string[]; // tags
  bestFor: Weather[];
  walkMin?: number; // mock distance from "you"
  crowdedness: "quiet" | "moderate" | "busy";
  rating: number; // 0-5
  tip?: string;
  link?: string;
};

export type Neighborhood = {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  friendsHere: number;
  topSpots: string[]; // spot ids
};

export type LocalEvent = {
  id: string;
  title: string;
  when: string;
  where: string;
  category: "Music" | "Market" | "Cinema" | "Sports" | "Community" | "Food";
  emoji: string;
  free: boolean;
};

export type WeatherForecast = {
  day: string;
  high: number; // °C
  low: number;
  condition: Weather;
  emoji: string;
  sunset: string;
  rainChance: number; // %
};

export const SPOTS: Spot[] = [
  {
    id: "weissensee",
    name: "Weißer See",
    emoji: "🏊",
    category: "Lake",
    neighborhood: "Weißensee",
    blurb: "Calm lake with a tiny beach, pedalos and shady picnic lawns.",
    vibe: ["Family-friendly", "Swim", "Picnic"],
    bestFor: ["sunny", "warm"],
    walkMin: 18,
    crowdedness: "moderate",
    rating: 4.6,
    tip: "Arrive before 12:00 on weekends to grab a shaded spot.",
  },
  {
    id: "schlachtensee",
    name: "Schlachtensee",
    emoji: "🌊",
    category: "Lake",
    neighborhood: "Zehlendorf",
    blurb: "Crystal-clear S-Bahn lake, perfect for a long swim loop.",
    vibe: ["Swim", "Forest", "Quiet"],
    bestFor: ["sunny", "warm"],
    walkMin: 45,
    crowdedness: "busy",
    rating: 4.8,
    tip: "Walk 10 min north for emptier spots.",
  },
  {
    id: "tempelhof",
    name: "Tempelhofer Feld",
    emoji: "🛼",
    category: "Park",
    neighborhood: "Neukölln",
    blurb: "Old airport turned giant park — kites, BBQs, skating, sunsets.",
    vibe: ["BBQ", "Skate", "Sunset"],
    bestFor: ["sunny", "warm", "evening"],
    walkMin: 12,
    crowdedness: "busy",
    rating: 4.7,
    tip: "BBQ only in the marked grilling zones.",
  },
  {
    id: "viktoriapark",
    name: "Viktoriapark",
    emoji: "⛰️",
    category: "Viewpoint",
    neighborhood: "Kreuzberg",
    blurb: "Waterfall hill with one of the best skyline sunsets in town.",
    vibe: ["Sunset", "Hill", "Date"],
    bestFor: ["sunny", "evening"],
    walkMin: 22,
    crowdedness: "moderate",
    rating: 4.5,
  },
  {
    id: "prater",
    name: "Prater Garten",
    emoji: "🍺",
    category: "Beer garden",
    neighborhood: "Prenzlauer Berg",
    blurb: "Berlin's oldest beer garden — long benches, pretzels, chestnut trees.",
    vibe: ["Group", "Beer", "Classic"],
    bestFor: ["warm", "evening", "cloudy"],
    walkMin: 25,
    crowdedness: "busy",
    rating: 4.4,
    tip: "Cash works best at the outdoor bar.",
  },
  {
    id: "freiluftkino",
    name: "Freiluftkino Friedrichshain",
    emoji: "🎬",
    category: "Open-air cinema",
    neighborhood: "Friedrichshain",
    blurb: "Open-air cinema tucked into Volkspark — bring a blanket.",
    vibe: ["Cinema", "Date", "Chill"],
    bestFor: ["evening", "warm"],
    walkMin: 30,
    crowdedness: "moderate",
    rating: 4.6,
  },
  {
    id: "markthalle9",
    name: "Markthalle Neun",
    emoji: "🥟",
    category: "Food market",
    neighborhood: "Kreuzberg",
    blurb: "Street Food Thursdays + weekend breakfast market.",
    vibe: ["Food", "Group", "Indoor"],
    bestFor: ["rainy", "cool", "cloudy"],
    walkMin: 20,
    crowdedness: "busy",
    rating: 4.5,
    tip: "Thu 17:00–22:00 is the iconic Street Food slot.",
  },
  {
    id: "klunkerkranich",
    name: "Klunkerkranich",
    emoji: "🌇",
    category: "Rooftop",
    neighborhood: "Neukölln",
    blurb: "Rooftop bar above a parking garage — sunset & DJ sets.",
    vibe: ["Sunset", "Drinks", "Date"],
    bestFor: ["evening", "warm"],
    walkMin: 8,
    crowdedness: "busy",
    rating: 4.5,
    tip: "Get there 45 min before sunset to skip the queue.",
  },
  {
    id: "mauerpark",
    name: "Mauerpark Flohmarkt",
    emoji: "🛍️",
    category: "Flea market",
    neighborhood: "Prenzlauer Berg",
    blurb: "Sundays only — flea market, karaoke amphitheatre, picnic hill.",
    vibe: ["Sunday", "Karaoke", "Browse"],
    bestFor: ["sunny", "cloudy", "warm"],
    walkMin: 28,
    crowdedness: "busy",
    rating: 4.3,
  },
  {
    id: "treptower",
    name: "Treptower Park",
    emoji: "🌳",
    category: "Picnic spot",
    neighborhood: "Treptow",
    blurb: "Riverside lawns by the Spree, boat rentals, shady trees.",
    vibe: ["Picnic", "Boat", "Family"],
    bestFor: ["sunny", "warm"],
    walkMin: 24,
    crowdedness: "moderate",
    rating: 4.5,
  },
  {
    id: "volleyball-mitte",
    name: "Monbijoupark beach volleyball",
    emoji: "🏐",
    category: "Sports",
    neighborhood: "Mitte",
    blurb: "Free sand courts right by the Spree.",
    vibe: ["Sports", "Group"],
    bestFor: ["sunny", "warm"],
    walkMin: 35,
    crowdedness: "moderate",
    rating: 4.2,
    tip: "Bring your own ball — first come, first served.",
  },
  {
    id: "about-blank",
    name: "://about blank",
    emoji: "🕺",
    category: "Club",
    neighborhood: "Friedrichshain",
    blurb: "Garden club for warm nights — techno + open-air courtyard.",
    vibe: ["Night", "Dance"],
    bestFor: ["evening"],
    walkMin: 30,
    crowdedness: "busy",
    rating: 4.4,
  },
];

export const NEIGHBORHOODS: Neighborhood[] = [
  {
    id: "neukolln",
    name: "Neukölln",
    emoji: "🌻",
    blurb: "Tempelhof, rooftop sunsets, Sunday markets and döner royalty.",
    friendsHere: 6,
    topSpots: ["tempelhof", "klunkerkranich"],
  },
  {
    id: "kreuzberg",
    name: "Kreuzberg",
    emoji: "🌶️",
    blurb: "Markthalle Neun, the Landwehrkanal, and Viktoriapark sunsets.",
    friendsHere: 4,
    topSpots: ["markthalle9", "viktoriapark"],
  },
  {
    id: "prenzlauer-berg",
    name: "Prenzlauer Berg",
    emoji: "🍺",
    blurb: "Beer gardens, Sunday flohmarkt, leafy Kollwitzkiez calm.",
    friendsHere: 3,
    topSpots: ["prater", "mauerpark"],
  },
  {
    id: "friedrichshain",
    name: "Friedrichshain",
    emoji: "🎬",
    blurb: "Volkspark, open-air cinema and late nights at RAW.",
    friendsHere: 5,
    topSpots: ["freiluftkino", "about-blank"],
  },
  {
    id: "weissensee",
    name: "Weißensee",
    emoji: "🦢",
    blurb: "Quiet lakeside vibes a short ride out from the centre.",
    friendsHere: 2,
    topSpots: ["weissensee"],
  },
  {
    id: "mitte",
    name: "Mitte",
    emoji: "🏛️",
    blurb: "Monbijoupark volleyball, museum runs, riverside strolls.",
    friendsHere: 3,
    topSpots: ["volleyball-mitte"],
  },
];

export const LOCAL_EVENTS: LocalEvent[] = [
  { id: "e1", title: "Street Food Thursday", when: "Thu · 17:00", where: "Markthalle Neun", category: "Food", emoji: "🥟", free: true },
  { id: "e2", title: "Sunset DJ at Klunkerkranich", when: "Tonight · 20:00", where: "Neukölln rooftop", category: "Music", emoji: "🎧", free: false },
  { id: "e3", title: "Mauerpark Karaoke", when: "Sun · 15:00", where: "Mauerpark amphitheatre", category: "Community", emoji: "🎤", free: true },
  { id: "e4", title: "Freiluftkino: Past Lives", when: "Fri · 21:30", where: "Volkspark Friedrichshain", category: "Cinema", emoji: "🎬", free: false },
  { id: "e5", title: "Pickup volleyball", when: "Sat · 14:00", where: "Monbijoupark", category: "Sports", emoji: "🏐", free: true },
  { id: "e6", title: "Flohmarkt am Boxhagener Platz", when: "Sun · 10:00", where: "Friedrichshain", category: "Market", emoji: "🛍️", free: true },
];

export const WEEK_FORECAST: WeatherForecast[] = [
  { day: "Today", high: 26, low: 17, condition: "sunny", emoji: "☀️", sunset: "21:15", rainChance: 5 },
  { day: "Fri", high: 28, low: 18, condition: "warm", emoji: "🌤️", sunset: "21:13", rainChance: 10 },
  { day: "Sat", high: 24, low: 16, condition: "cloudy", emoji: "⛅", sunset: "21:11", rainChance: 30 },
  { day: "Sun", high: 21, low: 15, condition: "rainy", emoji: "🌦️", sunset: "21:09", rainChance: 70 },
  { day: "Mon", high: 23, low: 14, condition: "cool", emoji: "🌥️", sunset: "21:07", rainChance: 20 },
];

export const WEATHER_LABEL: Record<Weather, string> = {
  sunny: "Sunny",
  warm: "Warm",
  cloudy: "Cloudy",
  rainy: "Rainy",
  cool: "Cool",
  evening: "Evening",
};

export const BERLIN_CENTER = { lat: 52.520008, lng: 13.404954 };

export const SPOT_COORDS: Record<string, { lat: number; lng: number }> = {
  weissensee:        { lat: 52.5556, lng: 13.4671 },
  schlachtensee:     { lat: 52.4378, lng: 13.2160 },
  tempelhof:         { lat: 52.4756, lng: 13.4034 },
  viktoriapark:      { lat: 52.4881, lng: 13.3814 },
  prater:            { lat: 52.5396, lng: 13.4106 },
  freiluftkino:      { lat: 52.5260, lng: 13.4357 },
  markthalle9:       { lat: 52.5018, lng: 13.4316 },
  klunkerkranich:    { lat: 52.4790, lng: 13.4395 },
  mauerpark:         { lat: 52.5413, lng: 13.4022 },
  treptower:         { lat: 52.4886, lng: 13.4691 },
  "volleyball-mitte":{ lat: 52.5230, lng: 13.4015 },
  "about-blank":     { lat: 52.5057, lng: 13.4761 },
};

