# Laboratory Sheet

**Module:** MAI5124 AI in Software Engineering  
**Lab:** 02  
**Duration:** 2 hours  
**Topic:** Data-Driven AI for Software Requirements Prioritization

## Scenario

You are the release engineer for a fictional Spotify-style music-streaming product.

The next release has a maximum capacity of:

```text
75 engineer-days
```

You have 12 candidate requirements and three evidence sources:

```text
candidate_backlog.csv       current telemetry + engineering estimates
customer_feedback.csv       958 unstructured feedback records
historical_releases.csv     360 previous release decisions
```

These are synthetic teaching datasets. They are not Spotify internal data.

## Challenge 1: Run the non-ML baseline

Open `main.py`.

Leave:

```python
MODE = "BASELINE"
```

Run Python.

The baseline ranks release value from **support-ticket pressure only**, then applies the same engineering budget and dependency rules.

Use the **Live Product**.

Record:

1. what was selected,
2. how many engineer-days were used,
3. which visible or infrastructure capabilities entered the release,
4. one important source of evidence that the baseline ignores.

Do this before using the ML pipeline.

## Challenge 2: Inspect the datasets

Open the three CSV files in the code workspace.

For the current backlog, distinguish between:

- observed product telemetry,
- support evidence,
- engineering estimates,
- dependency status.

For customer feedback, inspect:

- text,
- severity,
- source channel,
- region,
- subscription plan,
- the analyst-audited label available only for a subset.

For historical releases, inspect:

- the same evidence schema used for past decisions,
- the target label: `SHIPPED_NEXT`, `DEFERRED`, or `REJECTED`.

Your model will learn historical release behaviour. That is useful, but it can also reproduce historical bias.

## Challenge 3: Tune the NLP matcher

Change:

```python
MODE = "ANALYZE"
```

Run Python.

Open **Data & NLP**.

You will see a threshold sweep for:

```text
TF-IDF (unigrams + bigrams)
        +
cosine similarity
```

For each threshold, compare:

- audited matching accuracy,
- feedback coverage,
- number of assigned comments.

Choose a threshold and set:

```python
NLP_SIMILARITY_THRESHOLD = ...
```

Do not choose a number because it "looks normal". Defend it from the audited results.

Then use the **Live feedback matcher** and type at least two new customer comments. Inspect the top requirement matches and cosine similarities.

## Challenge 4: Compare the supervised models

Still in `ANALYZE` mode, open **ML Model**.

Compare:

```text
LOGISTIC_REGRESSION
RANDOM_FOREST
```

using:

- 5-fold macro-F1,
- cross-validated accuracy,
- interpretability.

Select one:

```python
MODEL_KIND = "..."
```

A slightly higher score is not the only possible argument. You may prefer a simpler model if performance is comparable, but you must justify the choice.

## Challenge 5: Implement the feature-engineering join

Complete:

```python
build_current_feature_rows(candidates, feedback_evidence)
```

Your current requirements must use the **same feature schema** as historical release decisions.

Two values come from the NLP pipeline:

```text
feedback_mentions_90d
mean_feedback_severity
```

The remaining fields come from `candidate_backlog.csv`:

```text
affected_mau
support_tickets_90d
engineering_days
dependency_count
premium_share
churn_risk_share
accessibility_or_compliance
incident_linked_count
prerequisite_ready
```

Do not invent `business_value`, `strategic_fit`, or any other arbitrary score.

## Challenge 6: Generate the AI-assisted release

Change:

```python
MODE = "AI_ASSISTED"
```

Run Python.

Now inspect both:

### Data & NLP

For several requirements, inspect the customer comments that were actually matched to them.

Check:

- number of matched comments,
- mean severity,
- similarity values,
- support-ticket count,
- affected monthly users.

### ML Model

Inspect:

- selected model,
- 5-fold macro-F1,
- feature importance,
- `P(SHIPPED_NEXT)`,
- engineering days,
- final selected release.

### Live Product

Use the resulting application.

The release can visibly enable or remove capabilities such as:

- Data Saver,
- Offline Recovery,
- Live Lyrics Translation,
- Accessible Lyrics,
- AI DJ,
- Queue Voting,
- Family Controls,
- Lossless / audio-pipeline capabilities,
- Concert Discovery,
- Podcast Summaries.

The live product is the release consequence of the evidence pipeline.

## Challenge 7: Perform one counterfactual and one ablation

### A. Counterfactual

Use:

```python
COUNTERFACTUAL_OVERRIDES = {
    "REQ-304": {"engineering_days": 25}
}
```

or design another realistic what-if assumption.

Re-run the model and release plan.

Ask:

- Did the rank change?
- Did the release subset change?
- Was the change caused by the prediction or by the budget/dependency constraint?

### B. Feature ablation

Remove one feature from:

```python
MODEL_FEATURES
```

Examples:

```text
feedback_mentions_90d
churn_risk_share
accessibility_or_compliance
engineering_days
```

Re-run.

Record the new cross-validated performance and release outcome.

Restore your final defended configuration before verification.

## Challenge 8: Verify and defend

Click **Verify Requirements**.

The tests check:

- dataset scale,
- audited NLP matching quality,
- feature-schema correctness,
- cross-validated model performance,
- valid release probabilities,
- budget and dependency constraints,
- absence of arbitrary business-value shortcut fields.

In your conclusion answer:

> What would you ship, and what additional evidence would you request before committing engineering resources?

Your answer should distinguish:

```text
AI evidence
from
engineering decision
```

## Completion checklist

- [ ] Baseline release executed and inspected
- [ ] All three datasets inspected
- [ ] NLP threshold chosen from audited evidence
- [ ] Two live feedback-matching experiments completed
- [ ] Logistic Regression and Random Forest compared
- [ ] Model selected and justified
- [ ] Current feature table implemented
- [ ] AI-assisted release generated
- [ ] Feature importance and P(SHIPPED_NEXT) interpreted
- [ ] Counterfactual experiment completed
- [ ] Feature-ablation experiment completed
- [ ] Verification passed
- [ ] Release recommendation defended
- [ ] Report submitted
