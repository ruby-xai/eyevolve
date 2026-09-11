# Architecture

EYEVOLVE is a small Next.js App Router application. It intentionally avoids
databases, auth, real satellite imagery, real maps, real computer vision, and
real telephony.

## Runtime Shape

```txt
Browser React app
-> localStorage persistence
-> /api/evolve
-> OpenAI Responses API, when OPENAI_API_KEY exists
```

The browser is authoritative for the evolving session. Server memory is never
used as persistence.

## Important Files

- `src/app/page.tsx`: main client app, state transitions, evolution loop.
- `src/app/api/evolve/route.ts`: server-only OpenAI integration and fallback.
- `src/lib/types.ts`: shared state, scene, policy, and API types.
- `src/lib/scenes.ts`: predefined satellite observation library.
- `src/lib/scoring.ts`: attention, action, and ignore scoring.
- `src/lib/learning.ts`: online learning, bounded proposal application, uncertainty updates.
- `src/lib/autonomy.ts`: confidence/agreement/autonomy mode calculations.
- `src/lib/scenario-selector.ts`: uncertainty-driven next-scene selection.
- `src/lib/storage.ts`: `localStorage` load/save/reset.

## Persisted State

The app stores one object:

```ts
type EyevolveState = {
  version: number
  policy: EyevolvePolicy
  currentSceneId: string
  seenSceneIds: string[]
  interactionHistory: InteractionEvent[]
  evolutionHistory: EvolutionEvent[]
  currentMode: "human" | "ai-review" | "exception-management" | "autonomous"
}
```

Storage key:

```txt
localStorage["eyevolve.state.v1"]
```

## Policy Model

EYEVOLVE separates attention from actionability:

```ts
type EyevolvePolicy = {
  generation: number
  attentionWeights: FeatureWeights
  actionWeights: FeatureWeights
  actionThreshold: number
  ignoreThreshold: number
  confidence: number
  autonomy: number
  observationsSeen: number
  judgmentsObserved: number
  aiAgreements: number
  aiCorrections: number
  uncertaintyByDimension: FeatureWeights
  learnedRules: LearnedRule[]
}
```

Feature dimensions:

```txt
humanSafety
urgency
infrastructure
environmental
behavioral
visualNoise
wildlifeProximity
```

## Scoring

Each detected change carries semantic features. The current policy scores those
features:

```txt
attentionScore = dot(change.features, policy.attentionWeights)
actionScore    = dot(change.features, policy.actionWeights)
```

Visual noise reduces attention. Ignore behavior uses:

```txt
ignoreScore = visualNoiseWeight * features.visualNoise - attentionScore * 0.5
ignored     = ignoreScore >= ignoreThreshold
```

## Learning

Human ranking trains attention with a tiny online learner:

```txt
targetImportance = rank position mapped from 1.0 to 0.0
error = targetImportance - attentionScore(change)
attentionWeights[d] += learningRate * error * change.features[d]
```

Human intervention choices train actionability:

```txt
targetActionability = 1 if selected for intervention, otherwise 0
error = targetActionability - actionScore(change)
actionWeights[d] += learningRate * error * change.features[d]
```

Weights are always clamped to `0-1`.

## OpenAI Evolution Proposal

The server route calls OpenAI only when `OPENAI_API_KEY` exists. The model does
not return full app state. It returns bounded proposals:

```ts
type EvolutionProposal = {
  proposedPolicyDeltas: {
    attention?: Partial<FeatureWeights>
    action?: Partial<FeatureWeights>
  }
  learnedRule?: string
  nextLearningObjective?: string
  nextScenarioType?: string
  reasoningSummary: string
}
```

Every delta is validated and clamped to `[-0.08, 0.08]` before being applied.
If the request fails, the app uses a deterministic local proposal.

## Autonomy

Autonomy is earned through evidence and agreement:

```txt
autonomy =
  0.10
  + 0.20 * evidence
  + 0.35 * agreementRate
  + 0.25 * confidence
  - 0.20 * correctionRate
```

Repeated correction can lower autonomy.

## UI Modes

The UI mode comes from autonomy, not generation number:

```txt
0.00-0.35  Human learning
0.35-0.68  AI review
0.68-0.82  Exception management
0.82-1.00  Autonomous
```

This means the app can fail to earn more autonomy if the user keeps correcting
it, which is an important part of the demo.
