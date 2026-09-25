# Lab 02: AI Techniques for Software Requirements Prioritization

## 1. The engineering problem

A software team rarely has enough time to implement every requested feature. Requirements arrive from users, product managers, accessibility teams, operations, security teams, and business stakeholders. They are usually written in natural language and often conflict in value, cost, urgency, and strategic importance.

In this lab, you work with a **fictional Spotify-style music-streaming backlog**. The product context is intentionally familiar, but the backlog and historical decisions are teaching data and are **not Spotify internal data**.

Your release team has a fixed implementation budget of **9 effort points**. The question is not simply:

> Which feature has the most votes?

The stronger question is:

> How should an AI model contribute to prioritization when product value, strategic fit, implementation effort, accessibility impact, and stakeholder demand must all be considered?

## 2. Baseline: prioritization by user votes

The starter program first ranks requirements only by the number of user votes.

This is useful as a baseline because it is simple and transparent. It is also limited. A vote-only ranking can over-prioritize expensive or highly visible features while under-prioritizing requirements that are strategically important, accessibility-related, or strongly associated with historically high-priority work.

You will run this baseline first and observe the resulting release directly in the product preview.

## 3. AI technique: supervised NLP classification

The supplied model is a lightweight **Multinomial Naive Bayes text classifier** trained on historical requirement statements labelled:

- HIGH
- MEDIUM
- LOW

The model learns how words occur across the three historical priority classes.

Conceptually:

```text
priority evidence
    = prior class probability
    + evidence contributed by the words in the requirement
```

For a new requirement, the model returns:

- predicted priority class,
- probability of HIGH priority,
- probability of MEDIUM priority,
- probability of LOW priority,
- prediction confidence,
- influential text tokens.

In the coding workspace, the **NLP Model** tab exposes these values visually. You can click any backlog requirement to inspect its probability distribution and evidence tokens. A **Live NLP Playground** also lets you type a completely new requirement and run it through the same Python model.

The purpose is not to treat the predicted class as the final decision. The model supplies **learned evidence** to the release-planning process.

## 4. Hybrid AI-assisted prioritization

A release decision needs more than text classification. Your AI-assisted score combines:

```text
55%  learned HIGH-priority probability
20%  business value
15%  strategic fit
10%  user demand
+5%  accessibility bonus when applicable
-4%  penalty for each effort point above 1
```

This creates a hybrid decision:

```text
historical requirement patterns
            +
current product evidence
            +
implementation cost
            ↓
AI-assisted release priority
```

You will implement this integration in one function. The model itself is already supplied.

## 5. What you should learn from the comparison

A Master's-level result is not simply that one ranking is "better." Your analysis should explain:

- why the baseline and AI-assisted rankings differ,
- which signals caused the change,
- whether the learned model is sufficiently reliable to influence release planning,
- which requirements become visible in the product when the ranking changes,
- what risks arise if historical product decisions contain bias,
- why implementation effort and accessibility impact should not disappear inside a black-box model.

The right-side workspace is part of the evidence. It has three views:

1. **Live Product**: an interactive Spotify-style application where prioritized requirements visibly enable features.
2. **NLP Model**: the actual classifier output, probabilities, confidence, evidence tokens, validation metrics, and a live text playground.
3. **Console**: the raw Python execution trace.

The product mockup is interactive: play/pause, track selection, search, queue voting, lyrics controls, volume, progress, and other functions respond to the release plan. Its audio is generated locally by the browser for teaching and does not stream Spotify catalogue music.

## Continue to the laboratory

Open **Steps** and complete the tasks in order.
