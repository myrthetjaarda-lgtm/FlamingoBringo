export type GroupPrivacy = "public" | "private" | "invite" | "hidden";
export type GroupRole = "owner" | "admin" | "organizer" | "member";

export interface GroupMember {
  id: string;
  name: string;
  emoji: string;
  role: GroupRole;
  joined: string;
}

export interface GroupActivity {
  id: string;
  kind: "event" | "photo" | "poll" | "expense" | "message";
  text: string;
  by: string;
  when: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  privacy: GroupPrivacy;
  color: "coral" | "lake" | "sun" | "leaf";
  members: GroupMember[];
  recurring: string[];
  templates: { name: string; emoji: string }[];
  upcoming: { id: string; title: string; date: string; emoji: string }[];
  activity: GroupActivity[];
  joinPolicy: "open" | "approval" | "invite";
  memories: { id: string; emoji: string; caption: string }[];
  pendingRequests?: { id: string; name: string; emoji: string }[];
}

export const PRIVACY_META: Record<
  GroupPrivacy,
  { label: string; description: string; emoji: string; tone: "coral" | "lake" | "sun" | "leaf" | "neutral" }
> = {
  public: { label: "Public", description: "Anyone can find & join", emoji: "🌍", tone: "leaf" },
  private: { label: "Private", description: "Visible, request to join", emoji: "🔒", tone: "lake" },
  invite: { label: "Invite-only", description: "Members invite friends", emoji: "✉️", tone: "coral" },
  hidden: { label: "Hidden", description: "Secret — link only", emoji: "🫥", tone: "sun" },
};

export const ROLE_META: Record<GroupRole, { label: string; emoji: string; perms: string[] }> = {
  owner: {
    label: "Owner",
    emoji: "👑",
    perms: ["All permissions", "Delete group", "Transfer ownership"],
  },
  admin: {
    label: "Admin",
    emoji: "🛡️",
    perms: ["Manage members", "Edit settings", "Ban users", "Moderate chat"],
  },
  organizer: {
    label: "Organizer",
    emoji: "🎉",
    perms: ["Create events", "Manage costs", "Invite people", "Edit events"],
  },
  member: {
    label: "Member",
    emoji: "🦩",
    perms: ["Join events", "Chat & post photos", "Vote on polls"],
  },
};

export const PERMISSIONS = [
  { key: "create_events", label: "Create events", roles: ["owner", "admin", "organizer"] },
  { key: "invite", label: "Invite people", roles: ["owner", "admin", "organizer", "member"] },
  { key: "edit_events", label: "Edit events", roles: ["owner", "admin", "organizer"] },
  { key: "manage_costs", label: "Manage costs", roles: ["owner", "admin", "organizer"] },
  { key: "moderate", label: "Moderate chat & photos", roles: ["owner", "admin"] },
  { key: "remove", label: "Remove members", roles: ["owner", "admin"] },
  { key: "ban", label: "Ban users", roles: ["owner", "admin"] },
] as const;

// Groups show their structure & templates, but members start empty —
// real people join via invitations. No seeded fake users.
export const groups: Group[] = [
  {
    id: "lake-crew",
    name: "Lake Crew",
    emoji: "🏖️",
    tagline: "Weissensee regulars & summer day-trippers",
    privacy: "private",
    color: "lake",
    joinPolicy: "approval",
    members: [],
    recurring: ["🦩 Inflatable flamingo", "🛒 Bollerwagen", "🔊 Music box", "🎲 Games"],
    templates: [
      { name: "Lake day", emoji: "🏖️" },
      { name: "Sunset swim", emoji: "🌅" },
      { name: "Picnic", emoji: "🧺" },
    ],
    upcoming: [
      { id: "weissensee", title: "Weissensee Picnic", date: "Sat · 14:00", emoji: "🌞" },
    ],
    activity: [],
    memories: [],
  },
  {
    id: "bbq-crew",
    name: "BBQ Crew",
    emoji: "🔥",
    tagline: "Grill masters & marinade enthusiasts",
    privacy: "invite",
    color: "coral",
    joinPolicy: "invite",
    members: [],
    recurring: ["🔥 Charcoal", "🥩 Marinade kit", "🌽 Corn", "🍺 Cooler"],
    templates: [
      { name: "Backyard BBQ", emoji: "🥩" },
      { name: "Park grill", emoji: "🌳" },
    ],
    upcoming: [],
    activity: [],
    memories: [],
  },
  {
    id: "family",
    name: "Family",
    emoji: "❤️",
    tagline: "Birthdays, dinners & the group chat that never sleeps",
    privacy: "hidden",
    color: "sun",
    joinPolicy: "invite",
    members: [],
    recurring: ["🎂 Birthday cake fund", "📸 Family photo"],
    templates: [{ name: "Birthday", emoji: "🎂" }, { name: "Sunday dinner", emoji: "🍝" }],
    upcoming: [],
    activity: [],
    memories: [],
  },
  {
    id: "work-friends",
    name: "Work Friends",
    emoji: "☕",
    tagline: "After-hours crew",
    privacy: "private",
    color: "leaf",
    joinPolicy: "approval",
    members: [],
    recurring: ["🍻 Bar tab kitty"],
    templates: [{ name: "Afterwork", emoji: "🍻" }],
    upcoming: [],
    activity: [],
    memories: [],
  },
  {
    id: "flatmates",
    name: "Flatmates",
    emoji: "🏠",
    tagline: "Kreuzberg WG",
    privacy: "hidden",
    color: "coral",
    joinPolicy: "invite",
    members: [],
    recurring: ["🧻 Household kitty", "🍝 Sunday dinner"],
    templates: [{ name: "House dinner", emoji: "🍝" }],
    upcoming: [],
    activity: [],
    memories: [],
  },
  {
    id: "festival-friends",
    name: "Festival Friends",
    emoji: "🎪",
    tagline: "Tents, glitter & questionable decisions",
    privacy: "public",
    color: "sun",
    joinPolicy: "open",
    members: [],
    recurring: ["⛺ Tent", "✨ Glitter kit", "🔋 Power bank"],
    templates: [{ name: "Festival trip", emoji: "🎪" }],
    upcoming: [],
    activity: [],
    memories: [],
  },
  {
    id: "birthday-circle",
    name: "Birthday Circle",
    emoji: "🎂",
    tagline: "Surprise planners — keep it quiet",
    privacy: "hidden",
    color: "coral",
    joinPolicy: "invite",
    members: [],
    recurring: ["🎁 Gift kitty"],
    templates: [{ name: "Surprise party", emoji: "🎉" }],
    upcoming: [],
    activity: [],
    memories: [],
  },
];

export function getGroup(id: string) {
  return groups.find((g) => g.id === id);
}
