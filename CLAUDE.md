# FlamingoBringo — Claude Code Notes

## Session Log

### 2026-06-11

**Branch:** `claude/youthful-gates-cujB7`
**Last commit:** `263799f Trigger rebuild: updated VITE_SUPABASE env vars to ugyerbycgotkfilepbfw`

#### What was worked on
This session was a planning/clarification session. No code changes were made to FlamingoBringo itself.

The user arrived with a CareerCompass v2 session prompt (a separate React/TypeScript job search management app) but this environment only contains the FlamingoBringo codebase. The session was spent clarifying the mismatch and preparing a full feature specification for CareerCompass v2 to be implemented in the correct environment.

#### Decisions made
- Confirmed FlamingoBringo and CareerCompass v2 are **separate apps** in separate repos. No CareerCompass features should be built into FlamingoBringo.
- Compiled a comprehensive session prompt + feature spec for CareerCompass v2, covering four new feature areas (see below), for use when the user opens the correct session.

#### Bugs fixed
None — no code was modified this session.

#### Feature specification drafted (for CareerCompass v2, NOT this repo)
The following features were designed and a full implementation prompt was written:

1. **Education Certificates** — Upload certificates per education entry in Profile → Documents tab. Fields: name, issuing body, issue/expiry date, file (base64). Expiry warnings. Individual download. Stored as `profile.educationCertificates[]`.

2. **Application Pack Bulk Download** — "Download Pack" button on each application. Checkbox modal to select: CV, Cover Letter, Education Certificates, Passport copy, Visa copy. Bundles selected files into a ZIP via JSZip named `{Company}_{Role}_ApplicationPack.zip`.

3. **Business Travel Tracker** — New Tools page. Log trips (destination, country, dates, purpose, employer-paid, per diem). Auto-calc working days abroad, home-office days, days per country. Tax insights: 183-day rule warnings, German Homeoffice-Pauschale estimate. CSV export for tax filing.

4. **Household Board** — New Tools page with two distinct tabs:
   - **"I'm Looking"** — post and browse housing search requests (city, budget, rooms, move-in date, pets)
   - **"Available Now"** — post and browse property listings (rent, sqm, furnished, photos, pets allowed)
   - Contact via mailto, edit/delete own posts, filter/search by city and criteria.

#### Current state of FlamingoBringo features
- App is a social events/neighbourhood app (Berlin-focused)
- Routes: index, discover, berlin, friends, groups, groups.$id, event.$id, profile, reset-password
- Recent commits are infrastructure: Supabase env var updates triggering Vercel rebuilds
- No feature work in progress on this branch

#### Risks / blockers
- **Wrong repo in session:** The CareerCompass v2 session prompt was loaded into a FlamingoBringo environment. User needs to start a new session against the CareerCompass v2 repository to implement the planned features.
- The `list_repos` MCP tool was unavailable so no other repos could be checked programmatically.

#### Next recommended tasks
**For FlamingoBringo:** No pending tasks identified this session.

**For CareerCompass v2 (in correct session):**
1. Add `EducationCertificate`, `TravelTrip`, `HouseholdListing`, `HouseholdSearch` types to `src/types.ts`
2. Implement Education Certificates section in Profile → Documents tab
3. Implement Application Pack ZIP download (add `jszip` dependency)
4. Implement Business Travel Tracker page + tax insights panel
5. Implement Household Board page with Searching / Listing tabs
6. Add "Travel Tracker" and "Household Board" to the sidebar nav under Tools
