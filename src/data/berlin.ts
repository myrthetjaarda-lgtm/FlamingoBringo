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

export type FestivalEvent = {
  id: string;
  title: string;
  dates: string;
  month: number; // 1–12
  where: string;
  blurb: string;
  emoji: string;
  free: boolean;
  category: "Music" | "Film" | "Art" | "Queer" | "Food" | "Sport" | "Community" | "Tech" | "Club";
  gcalStart?: string; // YYYYMMDD
  gcalEnd?: string;   // YYYYMMDD
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

export const BERLIN_FESTIVALS: FestivalEvent[] = [
  // Winter
  { id: "ctm", title: "CTM Festival", dates: "Late Jan – Feb", month: 1, where: "Berghain / HAU", blurb: "Adventurous electronic & experimental music festival anchored at Berghain and HAU.", emoji: "🎛️", free: false, category: "Music", gcalStart: "20270128", gcalEnd: "20270207" },
  { id: "gruene-woche", title: "Internationale Grüne Woche", dates: "Mid January", month: 1, where: "Messe Berlin", blurb: "Huge food, agriculture and horticulture fair — taste produce from across the globe.", emoji: "🥬", free: false, category: "Food", gcalStart: "20270115", gcalEnd: "20270124" },
  { id: "six-days", title: "Sechstagerennen (Six Days Race)", dates: "January", month: 1, where: "Velodrom", blurb: "Track cycling spectacle — six nights of racing, music and atmosphere in the velodrome.", emoji: "🚴", free: false, category: "Sport", gcalStart: "20270122", gcalEnd: "20270127" },
  { id: "transmediale", title: "transmediale", dates: "Late January", month: 1, where: "silent green, Neukölln", blurb: "Digital art and tech-culture festival exploring the relationship between culture and technology.", emoji: "💻", free: false, category: "Tech", gcalStart: "20270128", gcalEnd: "20270131" },
  { id: "berlinale", title: "Berlinale", dates: "~12 days in February", month: 2, where: "Potsdamer Platz & citywide", blurb: "One of the world's 'big three' film festivals alongside Cannes and Venice. Public tickets available.", emoji: "🎬", free: false, category: "Film", gcalStart: "20270211", gcalEnd: "20270221" },
  { id: "teddy", title: "Teddy Award", dates: "February (during Berlinale)", month: 2, where: "Berlinale venues", blurb: "The world's first and largest queer film award, given at the Berlinale.", emoji: "🧸", free: false, category: "Queer", gcalStart: "20270214", gcalEnd: "20270214" },
  // Spring
  { id: "cherry", title: "Cherry Blossom Season", dates: "April", month: 4, where: "TV Asahi path / Gärten der Welt", blurb: "Not a festival but a genuine Berlin annual ritual — sakura in full bloom along the TV Asahi path.", emoji: "🌸", free: true, category: "Community", gcalStart: "20270405", gcalEnd: "20270420" },
  { id: "fruehlingsfest", title: "Frühlingsfest (Spring Festival)", dates: "Late March – early May", month: 3, where: "Central Fairground (Zentraler Festplatz)", blurb: "Big funfair with rides, food and beer tents. The warm-up to summer funfair season.", emoji: "🎡", free: false, category: "Community", gcalStart: "20270325", gcalEnd: "20270502" },
  { id: "lange-nacht-museen-spring", title: "Lange Nacht der Museen (Spring)", dates: "Late April", month: 4, where: "100+ museums citywide", blurb: "Late-night access to Berlin's museums — one night, one ticket, the whole city.", emoji: "🏛️", free: false, category: "Art", gcalStart: "20270426", gcalEnd: "20270426" },
  { id: "gallery-weekend", title: "Gallery Weekend Berlin", dates: "Late April / Early May", month: 4, where: "50+ galleries citywide", blurb: "Berlin's biggest contemporary art weekend — 50+ galleries open simultaneously.", emoji: "🖼️", free: true, category: "Art", gcalStart: "20270429", gcalEnd: "20270501" },
  { id: "myfest", title: "MyFest Kreuzberg", dates: "May 1", month: 5, where: "Kreuzberg", blurb: "Alternative May Day street festival in Kreuzberg — music, food, community spirit.", emoji: "✊", free: true, category: "Community", gcalStart: "20270501", gcalEnd: "20270501" },
  { id: "karneval", title: "Karneval der Kulturen", dates: "Whitsun / Pentecost weekend", month: 5, where: "Kreuzberg", blurb: "Berlin's biggest street festival with a huge Sunday parade celebrating global cultures.", emoji: "🎭", free: true, category: "Community", gcalStart: "20270523", gcalEnd: "20270526" },
  // Summer
  { id: "sternfahrt", title: "Sternfahrt", dates: "June 7, 2026", month: 6, where: "Brandenburg Gate", blurb: "Mass bike demonstration converging on Brandenburg Gate — thousands of cyclists.", emoji: "🚲", free: true, category: "Sport", gcalStart: "20260607", gcalEnd: "20260607" },
  { id: "fete-musique", title: "Fête de la Musique", dates: "June 21", month: 6, where: "Citywide", blurb: "Free citywide music day — hundreds of free concerts on streets and in courtyards.", emoji: "🎶", free: true, category: "Music", gcalStart: "20260621", gcalEnd: "20260621" },
  { id: "lange-nacht-wiss", title: "Lange Nacht der Wissenschaften", dates: "June", month: 6, where: "Universities & research institutes", blurb: "Long Night of Sciences — labs, experiments and lectures open to the public.", emoji: "🔬", free: false, category: "Tech", gcalStart: "20260613", gcalEnd: "20260613" },
  { id: "48h-neukoelln", title: "48 Stunden Neukölln", dates: "June", month: 6, where: "Neukölln", blurb: "Neighbourhood art festival — studios, galleries and courtyards open for 48 hours.", emoji: "🎨", free: true, category: "Art", gcalStart: "20260620", gcalEnd: "20260621" },
  { id: "stadtfest", title: "Lesbian & Gay City Festival (Stadtfest)", dates: "July 18–19, 2026", month: 7, where: "Nollendorfplatz / Schöneberg", blurb: "Europe's largest queer street festival (~350,000 visitors) — right in Schöneberg.", emoji: "🏳️‍🌈", free: true, category: "Queer", gcalStart: "20260718", gcalEnd: "20260719" },
  { id: "csd", title: "Christopher Street Day (CSD)", dates: "July (last Saturday)", month: 7, where: "Tiergarten / Schöneberg", blurb: "Berlin's big Pride parade through Tiergarten and Schöneberg.", emoji: "🌈", free: true, category: "Queer", gcalStart: "20260725", gcalEnd: "20260725" },
  { id: "canal-pride", title: "Canal Pride / CSD on the Spree", dates: "July (Pride Week)", month: 7, where: "Spree river", blurb: "River-borne Pride party during CSD Pride Week.", emoji: "⛵", free: false, category: "Queer", gcalStart: "20260722", gcalEnd: "20260722" },
  { id: "lollapalooza", title: "Lollapalooza Berlin", dates: "July", month: 7, where: "Olympiastadion", blurb: "Major multi-day music festival at the iconic Olympiastadion.", emoji: "🎸", free: false, category: "Music", gcalStart: "20260718", gcalEnd: "20260719" },
  { id: "classic-open-air", title: "Classic Open Air", dates: "July", month: 7, where: "Gendarmenmarkt", blurb: "Open-air classical concerts at the stunning Gendarmenmarkt.", emoji: "🎻", free: false, category: "Music", gcalStart: "20260701", gcalEnd: "20260705" },
  { id: "staatsoper", title: "Staatsoper für alle", dates: "July", month: 7, where: "Bebelplatz", blurb: "Free open-air opera concert — world-class performance for everyone.", emoji: "🎼", free: true, category: "Music", gcalStart: "20260705", gcalEnd: "20260705" },
  { id: "open-air-season", title: "Open-Air Club Season", dates: "May – September", month: 5, where: "Sisyphos, Else, Birgit & Bier, Wilde Renate", blurb: "Berlin's outdoor rave culture — garden floors at Sisyphos, Else, Birgit & Bier and more.", emoji: "🕺", free: false, category: "Club", gcalStart: "20260501", gcalEnd: "20260930" },
  { id: "folsom", title: "Folsom Europe", dates: "Late August", month: 8, where: "Schöneberg (Fuggerstraße area)", blurb: "Europe's largest leather/fetish festival, centred in Schöneberg.", emoji: "🖤", free: true, category: "Queer", gcalStart: "20260828", gcalEnd: "20260830" },
  { id: "pop-kultur", title: "Pop-Kultur Festival", dates: "Late August", month: 8, where: "Kulturbrauerei", blurb: "Indie/electronic music + discourse festival at Kulturbrauerei.", emoji: "🎵", free: false, category: "Music", gcalStart: "20260826", gcalEnd: "20260828" },
  { id: "tag-offener", title: "Tag der offenen Tür (Federal Government)", dates: "August", month: 8, where: "Government district", blurb: "Federal government open house — visit the Chancellery and ministries.", emoji: "🏛️", free: true, category: "Community", gcalStart: "20260823", gcalEnd: "20260824" },
  // Autumn
  { id: "berlin-art-week", title: "Berlin Art Week", dates: "September", month: 9, where: "100+ museums & galleries", blurb: "The full Berlin art world in one week — major gallery openings, fairs and performances.", emoji: "🎨", free: false, category: "Art", gcalStart: "20260910", gcalEnd: "20260914" },
  { id: "istaf", title: "ISTAF", dates: "September", month: 9, where: "Olympiastadion", blurb: "International athletics festival — world-class track & field at the Olympiastadion.", emoji: "🏃", free: false, category: "Sport", gcalStart: "20260906", gcalEnd: "20260906" },
  { id: "berlin-marathon", title: "Berlin Marathon", dates: "End of September", month: 9, where: "City centre", blurb: "One of the six World Marathon Majors — fast course, electric atmosphere.", emoji: "🏅", free: true, category: "Sport", gcalStart: "20260927", gcalEnd: "20260927" },
  { id: "ifa", title: "IFA (Internationale Funkausstellung)", dates: "September", month: 9, where: "Messe Berlin", blurb: "Global consumer tech fair — the biggest new gadget announcements of the year.", emoji: "📱", free: false, category: "Tech", gcalStart: "20260905", gcalEnd: "20260909" },
  { id: "festival-of-lights", title: "Festival of Lights", dates: "October", month: 10, where: "Landmarks citywide", blurb: "Berlin's iconic landmarks bathed in colourful light projections — free to experience.", emoji: "💡", free: true, category: "Art", gcalStart: "20261003", gcalEnd: "20261012" },
  { id: "lange-nacht-museen-autumn", title: "Lange Nacht der Museen (Autumn)", dates: "Late October", month: 10, where: "100+ museums citywide", blurb: "Second edition of Berlin's famous late-night museum access night.", emoji: "🌙", free: false, category: "Art", gcalStart: "20261025", gcalEnd: "20261025" },
  { id: "berlin-atonal", title: "Berlin Atonal", dates: "August / September", month: 8, where: "Kraftwerk Berlin", blurb: "Experimental audiovisual festival at the legendary power station Kraftwerk.", emoji: "⚡", free: false, category: "Club", gcalStart: "20260827", gcalEnd: "20260831" },
  { id: "berlin-food-week", title: "Berlin Food Week", dates: "October", month: 10, where: "Citywide", blurb: "Autumn food festival celebrating Berlin's diverse restaurant and street food scene.", emoji: "🍽️", free: false, category: "Food", gcalStart: "20261006", gcalEnd: "20261012" },
  // Winter
  { id: "weihnachtsmaerkte", title: "Weihnachtsmärkte (Christmas Markets)", dates: "Late Nov – Dec", month: 12, where: "Citywide", blurb: "Berlin's beloved Christmas markets — Gendarmenmarkt, Charlottenburg and dozens more.", emoji: "🎄", free: true, category: "Community", gcalStart: "20261127", gcalEnd: "20261231" },
  { id: "nye", title: "New Year's Eve at Brandenburg Gate", dates: "December 31", month: 12, where: "Brandenburg Gate", blurb: "Germany's largest open-air NYE party — fireworks, live music and a million people.", emoji: "🎆", free: true, category: "Community", gcalStart: "20261231", gcalEnd: "20261231" },
];

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

