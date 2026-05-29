# Event & Profile Overhaul

This is a large scope touching DB, event page, and profile. I'll ship it in one coordinated change.

## 1. Database (single migration)

New tables, all RLS-protected:

- `events` — id, name, organizer_id (→ profiles), starts_at, location, description, prizes (text), created_at
  - SELECT: authenticated; INSERT/UPDATE/DELETE: organizer only
- `bring_items` — id, event_id, name, emoji, quantity, ingredients (text), required (bool), claimed_by (uuid, nullable), status ('pending'|'confirmed')
  - SELECT: authenticated; INSERT/UPDATE/DELETE: organizer of event OR claimer (for claim toggle)
- Extend `profiles`: add `email`, `phone`, `dietary` (text[]), `default_location`, `avatar_url`

For now, the existing event routes use static data. I'll wire the **single demo event** (`event.$id`) to read from `events` + `bring_items` so the redesign is real, not mock. Users can seed an event via organizer UI later — out of scope for this turn; I'll insert one starter event row tied to the first signed-in user who visits.

## 2. Event page redesign (`src/routes/event.$id.tsx`)

```text
┌─────────────────────────────────────────┐
│ At a Glance                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 🦩 Picnic at Weissensee                 │
│ 👤 Organized by Myrthe · ✉ contact      │
│ 📅 Sat 31 May · 14:00                   │
│ 📍 Weissensee Lake, Berlin              │
└─────────────────────────────────────────┘
```

- Organizer block: name + email (if visible), "Edit event" button only if `user.id === organizer_id`.
- Prizes section: visible to all; editable inline by organizer.

## 3. BringMaster rewrite (`src/components/event/BringMaster.tsx`)

Each row shows:
- emoji + name + `qty` + status badge (confirmed/pending)
- "Who's bringing": display_name of claimer or empty state
- Collapsible ingredients toggle (chevron) — `ingredients` text
- Action button:
  - unclaimed → **"I'll bring this"** (coral)
  - claimed by me → **"You're bringing this · Unclaim"** (leaf)
  - claimed by other → **"Taken by {name}"** (muted, disabled)

Click handler calls server fn that updates `bring_items.claimed_by` to `auth.uid()` or `null`. Realtime subscription refreshes the list.

## 4. Contribution Overview (new component `ContributionTable.tsx`)

Rendered on event page below bring list:

| Person | Items | Count | Status |
|---|---|---|---|
| Myrthe | Halloumi, Drinks | 2 | ✓ confirmed |
| Jonas  | Bread             | 1 | ⏳ pending  |

Aggregated client-side from `bring_items`. Empty state when nobody's claimed yet.

## 5. Prizes section

Organizer-only editable textarea stored in `events.prizes`. Display as a "🏆 Prizes" card for all attendees.

## 6. Profile page (`src/routes/profile.tsx`)

Extend existing edit form:
- name, email (from auth, read-only), phone, default_location, dietary (chip multi-select), avatar (emoji stays + optional image URL later)
- Single Save button writes to `profiles`, shows toast, reliable error state.

## 7. Technical notes

- Server fns in `src/lib/event.functions.ts` with `requireSupabaseAuth`: `claimItem`, `unclaimItem`, `updateEvent`, `getEventWithItems`.
- Realtime: subscribe to `bring_items` filtered by event_id for live updates.
- All new colors use existing tokens (coral, leaf, sun, lake).
- Mobile-first: existing AppShell already mobile-optimized; new sections use same card pattern.

## Out of scope (will not do this turn)

- Multi-event creation UI (organizer creates new events from scratch)
- Avatar image upload (sticking with emoji + URL field)
- Email/SMS notifications
- "Filter contributions by event" across multiple events (only one event exists)

Ready to proceed?
