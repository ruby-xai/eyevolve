# Demo Guide

Use this walkthrough when showing EYEVOLVE to a reviewer.

## Before the Demo

1. Add `.env.local`:

   ```txt
   OPENAI_API_KEY=your_key_here
   OPENAI_MODEL=gpt-5.6-terra
   ```

2. Start the app:

   ```txt
   npm run dev
   ```

3. Open the local URL.
4. Click **Reset evolution** so the demo begins at Generation 1.

If no key is configured, the app still runs. The header will indicate the local
policy engine instead of AI-driven policy.

## 60-90 Second Script

1. "EYEVOLVE watches satellite deltas and learns what I care about."
2. Generation 1: rank roadway obstruction and swerving traffic above cloud and shadow changes.
3. Mark the roadway hazard as requiring intervention.
4. Submit judgment and pause on the transition screen.
5. Point to attention/action weight diffs and autonomy changing.
6. Generation 2: rank unattended forest fire highest and select intervention.
7. Continue and explain that the policy, not a hard-coded level, drives the next behavior.
8. In AI review mode, accept the AI judgment if it looks right, or correct it.
9. Show that correction can reduce trust/autonomy.
10. In exception management, point out auto-suppressed noise.
11. In autonomous mode, show the simulated dispatch call.
12. End on history: "The user did not configure automation. Their use created it."

## What to Emphasize

- Attention and actionability are separate learned policies.
- OpenAI proposes bounded deltas; the app validates and applies them.
- Autonomy is earned through agreement, not forced by generation.
- Uncertainty selects the next observation after training scenes.
- The interface itself evolves as autonomy changes.
- State persists through refresh because it lives in `localStorage`.

## Good Demo Choices

Generation 1:

- Put "Animal obstructing roadway" and "Vehicles swerving" near the top.
- Mark one or both as requiring intervention.

Generation 2:

- Put "Unattended fire outside camp zone" at the top.
- Mark it as requiring intervention.

AI review:

- Click **Yes, matches my judgment** to earn autonomy.
- Or click **Correct EYEVOLVE** to demonstrate that trust can decrease.

## Resetting

Use **Reset evolution** in the header. This deletes:

```txt
localStorage["eyevolve.state.v1"]
```

and returns the app to Generation 1.
