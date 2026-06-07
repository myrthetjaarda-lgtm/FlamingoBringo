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
  approx?: boolean; // date not yet confirmed for this year
  category: "Music" | "Film" | "Art" | "Queer" | "Food" | "Sport" | "Community" | "Tech" | "Club";
  gcalStart?: string; // YYYYMMDD
  gcalEnd?: string;   // YYYYMMDD
  suggestion?: string; // FlamingoBringo-specific tip
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

// Imported from Berlin 2026 Social Year calendar — 38 confirmed events
export const BERLIN_FESTIVALS: FestivalEvent[] = [
  { id: "gruene-woche",       title: "Internationale Grüne Woche",           dates: "16–25 Jan",        month: 1,  where: "Messe Berlin",                              blurb: "Huge international food & agriculture fair — 100+ countries, 400k visitors.",                                              emoji: "🥬", free: false, approx: true,  category: "Food",      gcalStart: "20260116", gcalEnd: "20260125", suggestion: "Great date idea — book tickets early and do a food tour together." },
  { id: "six-days",           title: "Sechstagerennen (Six Day Race)",        dates: "22–26 Jan",        month: 1,  where: "Velodrom, Prenzlauer Berg",                 blurb: "Track cycling spectacle with party atmosphere. Six nights of racing.",                                                    emoji: "🚴", free: false, approx: true,  category: "Sport",     gcalStart: "20260122", gcalEnd: "20260126", suggestion: "Fun group night out — the atmosphere is more concert than sport." },
  { id: "ctm",                title: "CTM Festival",                          dates: "23 Jan – 1 Feb",   month: 1,  where: "Berghain, HAU & various",                   blurb: "Adventurous electronic/experimental music. Pairs with transmediale.",                                                     emoji: "🎛️", free: false, approx: true,  category: "Club",      gcalStart: "20260123", gcalEnd: "20260201" },
  { id: "transmediale",       title: "transmediale",                          dates: "29 Jan – 1 Feb",   month: 1,  where: "silent green, Neukölln",                    blurb: "Digital culture & media-art festival exploring tech and society.",                                                        emoji: "💻", free: false, approx: true,  category: "Tech",      gcalStart: "20260129", gcalEnd: "20260201" },
  { id: "berlinale",          title: "Berlinale (Film Festival)",             dates: "12–22 Feb",        month: 2,  where: "Potsdamer Platz & citywide cinemas",         blurb: "One of the world's big-three film festivals. Public tickets available. Teddy Award (queer film) included.",              emoji: "🎬", free: false,               category: "Film",      gcalStart: "20260212", gcalEnd: "20260222", suggestion: "Plan a cinema crew — grab public tickets at berlinale.de, they sell out fast." },
  { id: "fruehlingsfest",     title: "Frühlingsfest (Spring funfair)",        dates: "27 Mar – 3 May",   month: 3,  where: "Zentraler Festplatz, Kurt-Schumacher-Damm", blurb: "Funfair: roller coasters, beer tents. Runs into May.",                                                                   emoji: "🎡", free: false, approx: true,  category: "Community", gcalStart: "20260327", gcalEnd: "20260503" },
  { id: "festtage",           title: "Festtage (Staatsoper)",                 dates: "3–12 Apr",         month: 4,  where: "Staatsoper Unter den Linden",                blurb: "Opera & orchestral programme around Easter — one of the finest classical events in Europe.",                             emoji: "🎼", free: false, approx: true,  category: "Music",     gcalStart: "20260403", gcalEnd: "20260412" },
  { id: "cherry",             title: "Cherry Blossom Season",                 dates: "10–30 Apr",        month: 4,  where: "TV-Asahi path & Gärten der Welt, Marzahn",  blurb: "Not a formal festival — an annual ritual for photographers and picnickers.",                                             emoji: "🌸", free: true,  approx: true,  category: "Community", gcalStart: "20260410", gcalEnd: "20260430", suggestion: "Perfect FlamingoBringo moment — plan a cherry blossom picnic at the TV-Asahi path." },
  { id: "gallery-weekend",    title: "Gallery Weekend Berlin",                dates: "24–26 Apr",        month: 4,  where: "50+ galleries citywide",                    blurb: "Concentrated citywide gallery openings with free shuttles.",                                                             emoji: "🖼️", free: true,               category: "Art",       gcalStart: "20260424", gcalEnd: "20260426", suggestion: "Plan a gallery crawl group — 50+ galleries, free entry, free shuttles." },
  { id: "myfest",             title: "MyFest Kreuzberg",                      dates: "1 May",            month: 5,  where: "Kreuzberg (SO36)",                          blurb: "May 1 street festival — alternative to demonstrations, great food and music.",                                           emoji: "✊", free: true,               category: "Community", gcalStart: "20260501", gcalEnd: "20260501", suggestion: "Invite the whole group — it's on your doorstep in Kreuzberg." },
  { id: "theatertreffen",     title: "Theatertreffen",                        dates: "1–18 May",         month: 5,  where: "Berliner Festspiele & venues",               blurb: "10 most notable German-language theatre productions of the season.",                                                     emoji: "🎭", free: false, approx: true,  category: "Art",       gcalStart: "20260501", gcalEnd: "20260518" },
  { id: "karneval",           title: "Karneval der Kulturen",                 dates: "22–25 May",        month: 5,  where: "Kreuzberg (Hermannplatz / Gneisenaustr.)",   blurb: "Berlin's biggest street festival over Whitsun. Grand parade Sun 24 May. ~1.5M visitors. Free.",                       emoji: "🌍", free: true,               category: "Community", gcalStart: "20260522", gcalEnd: "20260525", suggestion: "Make a crew and watch the Sunday parade together — best from Gneisenaustraße." },
  { id: "poesiefestival",     title: "Poesiefestival Berlin",                 dates: "29 May – 14 Jun",  month: 5,  where: "Various venues",                            blurb: "One of Europe's largest poetry festivals.",                                                                              emoji: "📝", free: false, approx: true,  category: "Art",       gcalStart: "20260529", gcalEnd: "20260614" },
  { id: "sternfahrt",         title: "Sternfahrt (mass bike demo)",           dates: "7 Jun",            month: 6,  where: "Converges at Brandenburg Gate",             blurb: "100k–250k cyclists converge on Brandenburg Gate. Environmental festival at the finish.",                               emoji: "🚲", free: true,               category: "Sport",     gcalStart: "20260607", gcalEnd: "20260607", suggestion: "Bike there together — start from Weissensee or Kreuzberg spoke." },
  { id: "lange-nacht-wiss",   title: "Lange Nacht der Wissenschaften",        dates: "13 Jun",           month: 6,  where: "Universities & institutes citywide",         blurb: "Research institutions open late into the night — labs, demos, talks.",                                                  emoji: "🔬", free: false, approx: true,  category: "Tech",      gcalStart: "20260613", gcalEnd: "20260613" },
  { id: "48h-neukoelln",      title: "48 Stunden Neukölln",                   dates: "19–21 Jun",        month: 6,  where: "Neukölln",                                  blurb: "Neighborhood art festival — studios, galleries and courtyards open.",                                                   emoji: "🎨", free: true,  approx: true,  category: "Art",       gcalStart: "20260619", gcalEnd: "20260621", suggestion: "Do a Neukölln art walk with friends — then beers at Klunkerkranich." },
  { id: "fete-musique",       title: "Fête de la Musique",                    dates: "21 Jun",           month: 6,  where: "Citywide, outdoor & free",                  blurb: "Free citywide music day on the summer solstice — hundreds of concerts.",                                               emoji: "🎶", free: true,               category: "Music",     gcalStart: "20260621", gcalEnd: "20260621", suggestion: "Plan a venue-hopping evening — hits every corner of the city." },
  { id: "classic-open-air",   title: "Classic Open Air",                      dates: "9–12 Jul",         month: 7,  where: "Gendarmenmarkt",                            blurb: "Open-air classical concerts on one of Berlin's most beautiful squares.",                                                 emoji: "🎻", free: false,               category: "Music",     gcalStart: "20260709", gcalEnd: "20260712" },
  { id: "stadtfest",          title: "Lesbian & Gay City Festival (Stadtfest)",dates: "18–19 Jul",       month: 7,  where: "Nollendorfplatz / Schöneberg",              blurb: "Europe's largest queer street festival (~350k). The week before Pride. Right in your neighbourhood.",               emoji: "🏳️‍🌈", free: true,             category: "Queer",     gcalStart: "20260718", gcalEnd: "20260719", suggestion: "This is literally outside your front door in Schöneberg — perfect group event." },
  { id: "volksfest",          title: "Volksfest Berlin (summer funfair)",      dates: "9 Jul – 2 Aug",   month: 7,  where: "Zentraler Festplatz",                       blurb: "Summer funfair run — rides, food, beer tents.",                                                                         emoji: "🎠", free: false, approx: true,  category: "Community", gcalStart: "20260709", gcalEnd: "20260802" },
  { id: "csd",                title: "Christopher Street Day (CSD)",          dates: "25 Jul",           month: 7,  where: "City West → Siegessäule / Brandenburg Gate", blurb: "Main Pride parade. Pride Week events run the week before. 500k+ people.",                                             emoji: "🌈", free: true,               category: "Queer",     gcalStart: "20260725", gcalEnd: "20260725", suggestion: "Watching spot tip: Wittenbergplatz or along Kurfürstendamm. Plan brunch before." },
  { id: "canal-pride",        title: "Canal Pride (CSD on the Spree)",        dates: "25 Jul",           month: 7,  where: "On the Spree",                              blurb: "River-borne Pride party during Pride Week.",                                                                            emoji: "⛵", free: false, approx: true,  category: "Queer",     gcalStart: "20260725", gcalEnd: "20260725" },
  { id: "bierfestival",       title: "Berliner Bierfestival",                  dates: "7–9 Aug",          month: 8,  where: "Karl-Marx-Allee",                           blurb: "World's longest beer garden — 2.2km, 350+ breweries from 90 countries.",                                               emoji: "🍺", free: true,  approx: true,  category: "Food",      gcalStart: "20260807", gcalEnd: "20260809", suggestion: "Great group outing — walk the full 2.2km and rate every beer." },
  { id: "tag-offener",        title: "Tag der offenen Tür der Bundesregierung",dates: "15–16 Aug",       month: 8,  where: "Government buildings, Mitte",                blurb: "Federal government open-house weekend — visit the Chancellery and ministries.",                                        emoji: "🏛️", free: true,  approx: true,  category: "Community", gcalStart: "20260815", gcalEnd: "20260816" },
  { id: "pop-kultur",         title: "Pop-Kultur Festival",                    dates: "26–28 Aug",        month: 8,  where: "Kulturbrauerei, Prenzlauer Berg",            blurb: "Indie/electronic music plus talks & commissions. One of Berlin's best boutique festivals.",                           emoji: "🎵", free: false, approx: true,  category: "Music",     gcalStart: "20260826", gcalEnd: "20260828" },
  { id: "lange-nacht-museen", title: "Lange Nacht der Museen (autumn)",        dates: "29 Aug",           month: 8,  where: "Museums citywide",                          blurb: "Late-night museum access — one ticket, all night, 100+ venues.",                                                        emoji: "🌙", free: false, approx: true,  category: "Art",       gcalStart: "20260829", gcalEnd: "20260829", suggestion: "Great group night — plan a route together and end at a bar." },
  { id: "musikfest",          title: "Musikfest Berlin",                       dates: "29 Aug – 15 Sep",  month: 8,  where: "Philharmonie & venues",                     blurb: "Opens the classical concert season — world-class orchestras at the Philharmonie.",                                     emoji: "🎶", free: false, approx: true,  category: "Music",     gcalStart: "20260829", gcalEnd: "20260915" },
  { id: "folsom",             title: "Folsom Europe (leather & fetish)",       dates: "28 Aug – 6 Sep",   month: 8,  where: "Fuggerstr. / Weserstr., Schöneberg",        blurb: "Europe's largest gay leather/fetish festival — street fair finale in Schöneberg.",                                    emoji: "🖤", free: true,  approx: true,  category: "Queer",     gcalStart: "20260828", gcalEnd: "20260906", suggestion: "The Sunday street fair is free and open to everyone — right in Schöneberg." },
  { id: "ifa",                title: "IFA (consumer tech fair)",               dates: "4–9 Sep",          month: 9,  where: "Messe Berlin",                              blurb: "Major consumer electronics fair — biggest new gadget announcements of the year.",                                      emoji: "📱", free: false, approx: true,  category: "Tech",      gcalStart: "20260904", gcalEnd: "20260909" },
  { id: "berlin-art-week",    title: "Berlin Art Week",                        dates: "9–13 Sep",         month: 9,  where: "100+ museums & galleries",                  blurb: "Start of the new art season — Positions art fair, major gallery openings.",                                           emoji: "🖼️", free: false, approx: true,  category: "Art",       gcalStart: "20260909", gcalEnd: "20260913" },
  { id: "berlin-atonal",      title: "Berlin Atonal",                          dates: "9–13 Sep",         month: 9,  where: "Kraftwerk, Mitte",                          blurb: "Experimental audiovisual festival in a former power plant — one of Berlin's most unique venues.",                    emoji: "⚡", free: false, approx: true,  category: "Club",      gcalStart: "20260909", gcalEnd: "20260913" },
  { id: "lollapalooza",       title: "Lollapalooza Berlin",                    dates: "12–13 Sep",        month: 9,  where: "Olympiastadion",                            blurb: "Major multi-stage music festival at the Olympiastadion.",                                                               emoji: "🎸", free: false, approx: true,  category: "Music",     gcalStart: "20260912", gcalEnd: "20260913" },
  { id: "istaf",              title: "ISTAF (athletics)",                      dates: "13 Sep",           month: 9,  where: "Olympiastadion",                            blurb: "International athletics festival — world-class track & field.",                                                         emoji: "🏃", free: false, approx: true,  category: "Sport",     gcalStart: "20260913", gcalEnd: "20260913" },
  { id: "berlin-marathon",    title: "Berlin Marathon",                        dates: "27 Sep",           month: 9,  where: "Citywide, finish at Brandenburg Gate",      blurb: "End-of-September marathon. World record course — tens of thousands run.",                                               emoji: "🏅", free: true,               category: "Sport",     gcalStart: "20260927", gcalEnd: "20260927", suggestion: "Run it, cheer it, or plan a post-race brunch near the finish line." },
  { id: "festival-of-lights", title: "Festival of Lights",                     dates: "2–11 Oct",         month: 10, where: "Landmarks citywide",                        blurb: "Brandenburg Gate, Cathedral, TV Tower illuminated with projections. Free — walk or cycle.",                            emoji: "💡", free: true,  approx: true,  category: "Art",       gcalStart: "20261002", gcalEnd: "20261011", suggestion: "Bike the whole route with friends — from TV Tower to Charlottenburg in one evening." },
  { id: "berlin-food-week",   title: "Berlin Food Week",                       dates: "5–11 Oct",         month: 10, where: "Restaurants & venues citywide",             blurb: "Citywide food festival celebrating Berlin's restaurant scene.",                                                         emoji: "🍽️", free: false, approx: true,  category: "Food",      gcalStart: "20261005", gcalEnd: "20261011", suggestion: "Book a group dinner at one of the special menus — great excuse to eat somewhere fancy." },
  { id: "weihnachtsmaerkte",  title: "Christmas Markets (Weihnachtsmärkte)",   dates: "23 Nov – 26 Dec",  month: 12, where: "Citywide (Gendarmenmarkt, Alexanderplatz…)", blurb: "Dozens of markets citywide — Gendarmenmarkt is the most beautiful.",                                                  emoji: "🎄", free: true,  approx: true,  category: "Community", gcalStart: "20261123", gcalEnd: "20261226", suggestion: "Plan a Glühwein crawl — Gendarmenmarkt, Charlottenburg, Spandau in one day." },
  { id: "nye",                title: "New Year's Eve at Brandenburg Gate",     dates: "31 Dec",           month: 12, where: "Brandenburg Gate / Str. des 17. Juni",     blurb: "Germany's largest open-air NYE party — 1M+ people, fireworks, live music.",                                           emoji: "🎆", free: true,               category: "Community", gcalStart: "20261231", gcalEnd: "20261231", suggestion: "Get there by 20:00 to claim a good spot — meet at Tiergarten S-Bahn." },
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

