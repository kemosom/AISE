# Laboratory Sheet

**Module:** MAI5124 AI in Software Engineering  
**Lab:** 02  
**Duration:** 2 hours  
**Topic:** AI Techniques for Software Requirements Prioritization

## Scenario

You are supporting release planning for a large music-streaming application.

The current backlog contains eight candidate requirements. The team can spend a maximum of **9 effort points** in the next release.

The backlog is fictional and used only for teaching.

## Task 1: Inspect the candidate backlog

Open `requirements_data.py`.

Each requirement contains:

- natural-language title and description,
- user votes,
- business value,
- strategic fit,
- implementation effort,
- accessibility impact,
- a visual feature key used by the product preview.

Do not edit the historical training examples.

## Task 2: Run the baseline

Open `main.py`.

Leave:

```python
MODE = "BASELINE"
```

Click **Run Python**.

The baseline uses user votes as the priority score.

On the right, open **Live Product** and inspect the release that the vote-only method produces. Use the interface: play a generated demo track, search the library, change tracks, adjust volume, and inspect which release features are available.

Record:

1. which requirements were selected,
2. how much of the 9-point budget was used,
3. what changed visually in the Spotify-style interface.

## Task 3: Inspect the supplied NLP model

Open `priority_model.py`.

The model is already implemented. It learns from historical requirement statements using Multinomial Naive Bayes and returns a probability distribution over HIGH, MEDIUM, and LOW priority.

You are **not** required to rewrite the classifier.

Open the **NLP Model** tab.

Click several candidate requirements and inspect:

```text
P(HIGH)
P(MEDIUM)
P(LOW)
confidence
evidence_tokens
validation accuracy
macro-F1
```

Then use the **Live NLP Playground** to type one new requirement of your own. This playground executes the same Python Naive Bayes model from `priority_model.py`; it is not a separate JavaScript approximation.

## Task 4: Implement the AI-assisted score

Complete:

```python
ai_assisted_priority_score(requirement, prediction)
```

Use this exact engineering design:

```text
score =
    0.55 × p_high
  + 0.20 × normalized business value
  + 0.15 × normalized strategic fit
  + 0.10 × normalized user votes
  + 0.05 accessibility bonus when applicable
  - 0.04 × (effort - 1)
```

Normalization:

```text
business value / 10
strategic fit / 10
min(user votes / 100, 1)
```

Clamp the final score to the range 0.0 to 1.0.

The starter placeholder deliberately returns the baseline score so the program remains executable before you implement the function.

## Task 5: Switch to AI-assisted release planning

Change:

```python
MODE = "AI_ASSISTED"
```

Run the program again.

The release planner will:

1. rank requirements by your AI-assisted score,
2. select requirements greedily while staying within the 9-point budget,
3. convert the scores to MoSCoW-style labels,
4. send the selected plan to the live product preview.

Compare the new interface with the baseline.

Interact with the release-specific features. Depending on the selected requirements, you may see:

- AI DJ context mix,
- live lyrics translation,
- accessible enlarged lyrics,
- collaborative queue voting,
- data-saver mode,
- lossless playback indicator,
- concert discovery,
- podcast AI summaries.

You should be able to **see and use** the effect of the prioritization decision, not only read a list of IDs.

## Task 6: Perform one sensitivity experiment

Change only:

```python
AI_WEIGHT
```

Try a lower value such as:

```python
AI_WEIGHT = 0.35
```

To keep the score interpretable, move the removed weight to one or more of the other product signals.

Run the program again and observe whether the release plan changes.

Restore the original design before verification:

```python
AI_WEIGHT = 0.55
BUSINESS_WEIGHT = 0.20
STRATEGIC_WEIGHT = 0.15
VOTE_WEIGHT = 0.10
```

## Task 7: Verify Requirements

Click **Verify Requirements**.

The verification suite checks:

- the NLP model returns valid probabilities,
- the historical validation set produces acceptable classification performance,
- the baseline remains vote-driven,
- your AI-assisted scoring equation is implemented correctly,
- the release plan never exceeds the effort budget,
- requirements are ranked consistently,
- the AI-assisted plan differs meaningfully from the vote-only baseline.

## Task 8: Report

Your report should include:

- the release-planning decision before coding,
- the vote-only baseline,
- the AI-assisted model and scoring method,
- a comparison of the two visible product releases,
- requirement-verification evidence,
- your sensitivity experiment,
- critical discussion of bias, confidence, cost, accessibility, and decision authority,
- a concise conclusion.

## Completion checklist

- [ ] Baseline executed
- [ ] Vote-only product preview inspected
- [ ] NLP model output inspected
- [ ] AI-assisted scoring function implemented
- [ ] AI-assisted product preview inspected
- [ ] One sensitivity experiment completed
- [ ] Requirements verified
- [ ] Report completed
- [ ] Final report submitted
