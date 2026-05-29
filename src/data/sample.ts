export type RSVP = "coming" | "maybe" | "declined";

export interface Attendee {
  id: string;
  name: string;
  emoji: string;
  rsvp: RSVP;
  relation?: string;
  bringing?: string[];
  neighborhood?: string;
  transport?: "walking" | "bike" | "public" | "car";
  invitedBy?: string;
}

// Real-attendee data lives in the database. The app no longer ships seeded
// fake people — empty states render until users join.
export const attendees: Attendee[] = [];

export interface BringItem {
  id: string;
  name: string;
  emoji: string;
  required: boolean;
  claimedBy?: string;
  qty?: string;
}

export const bringList: BringItem[] = [
  { id: "1", name: "Drinks", emoji: "🥤", required: true },
  { id: "2", name: "Sunscreen", emoji: "🧴", required: true },
  { id: "3", name: "Sunglasses", emoji: "🕶️", required: false },
  { id: "4", name: "Towel", emoji: "🏖️", required: true },
  { id: "5", name: "Bathing suit", emoji: "👙", required: true },
  { id: "6", name: "Blanket", emoji: "🧺", required: true },
  { id: "7", name: "Flip-flops", emoji: "🩴", required: false },
  { id: "8", name: "Swimming shoes", emoji: "👟", required: false },
];

export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  category: string;
  labels: string[];
  votes: number;
  claimedBy?: string;
}

export const foodList: FoodItem[] = [
  { id: "f1", name: "Baguette", emoji: "🥖", category: "Snacks", labels: ["Vegetarian"], votes: 0 },
  { id: "f2", name: "Tomatoes", emoji: "🍅", category: "Healthy", labels: ["Vegan", "Gluten-free"], votes: 0 },
  { id: "f3", name: "Fruit", emoji: "🍓", category: "Fruit", labels: ["Vegan"], votes: 0 },
  { id: "f4", name: "Nuts", emoji: "🥜", category: "Snacks", labels: ["Vegan"], votes: 0 },
  { id: "f5", name: "Chips", emoji: "🍟", category: "Snacks", labels: ["Vegetarian"], votes: 0 },
  { id: "f6", name: "Boiled eggs", emoji: "🥚", category: "Healthy", labels: ["Vegetarian", "Gluten-free"], votes: 0 },
  { id: "f7", name: "Dips", emoji: "🥣", category: "Snacks", labels: ["Vegetarian"], votes: 0 },
  { id: "f8", name: "Ham", emoji: "🥓", category: "BBQ", labels: [], votes: 0 },
];

export interface DrinkItem {
  id: string;
  name: string;
  emoji: string;
  category: string;
  alcohol: boolean;
  votes: number;
  claimedBy?: string;
}

export const drinkList: DrinkItem[] = [
  { id: "d1", name: "Sparkling water", emoji: "💧", category: "Water", alcohol: false, votes: 0 },
  { id: "d2", name: "Cold beers", emoji: "🍺", category: "Beer", alcohol: true, votes: 0 },
  { id: "d3", name: "Rosé", emoji: "🍷", category: "Wine", alcohol: true, votes: 0 },
  { id: "d4", name: "Lemonade", emoji: "🍋", category: "Soft drinks", alcohol: false, votes: 0 },
  { id: "d5", name: "Iced tea", emoji: "🧊", category: "Tea", alcohol: false, votes: 0 },
];

export interface LogisticItem {
  id: string;
  name: string;
  emoji: string;
  status: "have" | "need";
  by?: string;
}

export const logistics: LogisticItem[] = [
  { id: "l1", name: "Garbage bags", emoji: "🗑️", status: "need" },
  { id: "l2", name: "Knives", emoji: "🔪", status: "need" },
  { id: "l3", name: "Aluminum foil", emoji: "📦", status: "need" },
  { id: "l4", name: "Water (big)", emoji: "🚰", status: "need" },
  { id: "l5", name: "Parasol", emoji: "⛱️", status: "need" },
  { id: "l6", name: "Storage box", emoji: "📦", status: "need" },
  { id: "l7", name: "Power bank", emoji: "🔋", status: "need" },
  { id: "l8", name: "Napkins", emoji: "🧻", status: "need" },
];

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  splitCount: number;
}

export const expenses: Expense[] = [];

export interface Message {
  id: string;
  author: string;
  emoji: string;
  text: string;
  time: string;
  isOrganizer?: boolean;
}

// Real chat lives in the messages table via ChatThread — no seeded fake messages.
export const messages: Message[] = [];

export interface Poll {
  question: string;
  options: { id: string; label: string; emoji: string; votes: number }[];
}

export const backupPlanPoll: Poll = {
  question: "If it rains, where to?",
  options: [
    { id: "a", label: "Stay — Plan A Weissensee", emoji: "☀️", votes: 0 },
    { id: "b", label: "Indoor café (Mitte)", emoji: "☕", votes: 0 },
    { id: "c", label: "Move to an indoor venue", emoji: "🌙", votes: 0 },
  ],
};

/* ────────────────────────────────────────────────────────────
   Find-a-Date (Doodle-style)
   ──────────────────────────────────────────────────────────── */

export type Availability = "yes" | "maybe" | "no";

export interface DateOption {
  id: string;
  date: string;
  time: string;
  yes: number;
  maybe: number;
  no: number;
}

export const dateOptions: DateOption[] = [
  { id: "do1", date: "Sat 30 May", time: "13:00", yes: 0, maybe: 0, no: 0 },
  { id: "do2", date: "Sun 31 May", time: "14:00", yes: 0, maybe: 0, no: 0 },
  { id: "do3", date: "Sun 31 May", time: "16:00", yes: 0, maybe: 0, no: 0 },
  { id: "do4", date: "Sat 06 Jun", time: "13:00", yes: 0, maybe: 0, no: 0 },
];

/* ────────────────────────────────────────────────────────────
   Tickets & entrance fees
   ──────────────────────────────────────────────────────────── */

export type PaymentStatus = "paid" | "pending";

export interface TicketItem {
  id: string;
  title: string;
  emoji: string;
  amount: number;
  currency: string;
  paidBy?: string;
  splitCount: number;
  status: PaymentStatus;
  perPerson?: boolean;
}

export const tickets: TicketItem[] = [
  { id: "t1", title: "Lake entrance", emoji: "🎟️", amount: 4, currency: "€", splitCount: 0, status: "pending", perPerson: true },
  { id: "t2", title: "Boat rental (2h)", emoji: "🚣", amount: 36, currency: "€", splitCount: 0, status: "pending" },
  { id: "t3", title: "Parking", emoji: "🅿️", amount: 6, currency: "€", splitCount: 0, status: "pending" },
  { id: "t4", title: "Sunbed reservation", emoji: "🛋️", amount: 12, currency: "€", splitCount: 0, status: "pending" },
];

/* ────────────────────────────────────────────────────────────
   Travel / meetup
   ──────────────────────────────────────────────────────────── */

export interface MeetupSuggestion {
  id: string;
  place: string;
  time: string;
  neighborhood: string;
  count: number;
}

export const meetupSuggestions: MeetupSuggestion[] = [];
