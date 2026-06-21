# Study Companion (Generic / Shareable PWA)

A mobile-first PWA that builds a personalized study schedule for **any course, any university**. First-time visitors go through a short setup wizard; everything after that is generated and stored locally on their device.

This is the shareable counterpart to the personal "Sir PA" app — same sage/cream design, but with no hardcoded courses, names, or timetables. Anyone can use it for their own semester.

## How it works

1. **First visit** → 5-step setup wizard:
   - Name + what to call your study assistant ("Coach", "Sir", "Tutor", etc.)
   - Semester start date, length, and key exam periods (midterms/finals)
   - Course list (code, name, lecturer, status)
   - Weekly timetable — tap slots to assign lectures
   - Review — a 5-phase study plan is generated automatically

2. **After setup** → Home (today's schedule + next-up card) and Week (full weekly timeline, tap any study block to edit).

3. **All data stays in `localStorage`** on that device/browser — no backend, no accounts. Settings → "Reset everything" wipes it and restarts the wizard.

## How the study plan is generated

For each lecture in the user's timetable, the generator (`src/data/planGenerator.js`):
- Places a **post-lecture review** block in the next free slot the same day (immediate reinforcement)
- Places a **pre-lecture prep** block in the prior free slot, if free
- Fills remaining slots (capped at 4 study blocks/day to preserve free time) with practice/review/mock/project sessions, rotating across courses
- Reserves one Sunday slot for weekly planning
- Adds a protected rest slot during the finals phase

The 5 phases (Foundation → Intensification → Midterm Prep → Post-Midterm → Finals Prep) are positioned automatically based on the user's exam-period dates. If no exam dates are given, it falls back to a simple halfway split.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output in `dist/`.

## Deploying

Same as any Vite app — push to GitHub, import into Vercel (auto-detects Vite, builds with `npm run build`, serves `dist/`). HTTPS is automatic, which is required for PWA install prompts.

## Project structure

- `src/data/profile.js` — the single localStorage-backed profile object (all user data)
- `src/data/constants.js` — generic date/phase helpers, default time slots, activity templates
- `src/data/planGenerator.js` — builds the 5-phase study plan from any course list + timetable
- `src/data/schedule.js` — combines profile + generated plan + user edits for display
- `src/wizard/` — the 5-step setup flow
- `src/pages/` — Home, Week, Settings
- `src/components/` — bottom nav, edit modal, toast

## Customizing the icons

Replace the three files in `public/icons/` (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`) with your own branding — same filenames and sizes.
