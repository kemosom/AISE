# Lab 02: AI Techniques for Software Requirements Prioritization

## The problem

A real product team does not receive neat values such as `business_value = 9`.

It receives evidence from different systems:

- customer feedback and support conversations,
- product telemetry,
- support-ticket volume,
- engineering estimates,
- dependency information,
- accessibility or compliance obligations,
- incident history,
- historical release decisions.

Most customer feedback is unstructured text. Historical prioritization decisions are also imperfect because they reflect previous organisational choices.

This lab treats AI as **decision support**, not as an automatic product manager.

## Data used in this laboratory

The Spotify-style scenario is fictional. The datasets are **synthetic but structurally realistic** and contain no Spotify internal data.

You will work with:

- **958 customer-feedback records**
- **360 historical release decisions**
- **12 current candidate requirements**

The data are deliberately large enough that manual inspection alone is not practical.

## AI technique 1: NLP evidence extraction

The first problem is to connect free-text customer feedback to candidate requirements.

The lab uses a real scikit-learn pipeline:

```text
customer feedback
      ↓
TF-IDF vectorization
(unigrams + bigrams)
      ↓
cosine similarity
      ↓
candidate requirement
```

A subset of the feedback has an analyst-audited requirement label. You use those audited records to choose a similarity threshold.

The threshold creates a real precision/coverage trade-off:

- threshold too low: unrelated feedback is incorrectly assigned;
- threshold too high: relevant feedback is discarded as OTHER.

## AI technique 2: supervised release prioritization

The second problem is to learn from historical release decisions.

Historical rows contain measurable evidence such as:

```text
feedback mentions
affected monthly users
support tickets
feedback severity
engineering days
dependency count
premium-user share
churn-risk share
accessibility/compliance
incident-linked count
prerequisite readiness
```

You compare two real scikit-learn models:

- Logistic Regression
- Random Forest

using **5-fold cross-validation** and **macro-F1**.

The selected model outputs:

```text
P(SHIPPED_NEXT)
```

for each current requirement.

There is no manually weighted `business_value` or `strategic_fit` score.

## Release planning is still software engineering

A high model probability does not automatically mean a feature can ship.

The final plan must satisfy:

- a **75 engineer-day budget**,
- explicit requirement dependencies,
- prerequisite readiness.

The lab searches feasible release combinations and selects the subset with the strongest model-supported release value.

The result is then applied to the interactive Spotify-style product so you can see what the release would actually expose to users.

## What you are expected to question

You should not finish the lab by saying "Random Forest ranked this first."

You should ask:

- Was the NLP matching threshold defensible?
- Did the model generalise across folds?
- Which historical features drive the prediction?
- Are those historical patterns desirable or potentially biased?
- Does changing one engineering estimate change the release?
- Does removing one feature materially alter the ranking?
- Would you commit engineering resources based on this evidence?

Open **Steps** and perform the investigation.
