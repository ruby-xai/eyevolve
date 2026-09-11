# Agent Instructions for EYEVOLVE

EYEVOLVE is a take-home prototype demonstrating an autocatalytic product loop:
user behavior teaches the application what to notice, when to act, how much
autonomy it has earned, and what it should observe next.

## Core Product Principle

Preserve this idea in every change:

> The user does not configure the automation. Their use of EYEVOLVE creates it.

## Technical Constraints

Do not add:

- Database or backend persistence.
- Authentication.
- Firebase, Supabase, Postgres, SQLite, Redis, Prisma, vector DBs.
- Real satellite APIs, map providers, computer vision, or geospatial services.
- Real phone calls, Twilio, or emergency-service integrations.
- LangChain, multi-agent frameworks, or source-code self-modification.

Use only:

- React state for transient runtime state.
- Browser `localStorage` for persisted EYEVOLVE session state.
- The server-side OpenAI Responses API route for bounded evolution proposals.

## OpenAI Rules

The browser must never call OpenAI directly.

Use:

```txt
OPENAI_API_KEY
OPENAI_MODEL
```

Do not use:

```txt
NEXT_PUBLIC_OPENAI_API_KEY
```

The model may propose bounded policy deltas only. The app remains authoritative:
validate, clamp, apply, recalculate, persist.

## Files to Understand First

- `src/app/page.tsx`: main product loop and state transitions.
- `src/app/api/evolve/route.ts`: OpenAI integration and local fallback.
- `src/lib/types.ts`: data contracts.
- `src/lib/learning.ts`: online learning and bounded proposal application.
- `src/lib/scoring.ts`: attention/action/ignore scoring.
- `src/lib/scenario-selector.ts`: uncertainty-driven scene choice.
- `src/lib/scenes.ts`: data-driven observations.

## UX Rules

- Keep the app as a working mission-control surface, not a landing page.
- Make evolution visible: policy diffs, history, activity trace, and mode changes.
- Keep scenes data-driven; do not create bespoke React scene components.
- Prefer simple SVG primitives over heavy graphics libraries.
- Use restrained motion: tile reveal, highlights, transitions, transcript reveal.

## Validation

Before handing off meaningful changes, run:

```txt
npm run build
```

For demo changes, manually verify:

1. Reset evolution.
2. Complete road training.
3. Complete campsite fire training.
4. Accept or correct AI review.
5. Confirm persistence after refresh.
6. Confirm OpenAI fallback still works without a key.
