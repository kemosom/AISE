# Laboratory Sheet

**Module:** MAI5124 AI in Software Engineering  
**Lab:** 02  
**Duration:** 2 hours  
**Topic:** AI Techniques for Software Requirements Prioritization

## Your role

You are the release engineer for a fictional Spotify-style music-streaming product.

The next release has a strict budget of **9 effort points**. Eight candidate requirements are competing for that budget.

You are not being asked to reproduce one lecturer-selected ranking. You must investigate the evidence, design a defensible policy, implement it, stress-test it, and decide what you would actually ship.

## Challenge 1: Diagnose the baseline before using AI

Open `main.py`.

Leave:

```python
MODE = "BASELINE"
```

Click **Run Python**, then use the **Live Product** on the right.

Do not just read the ranking. Interact with the release.

Your first job is to answer:

1. Which requirements were selected?
2. Which visible product capabilities became available?
3. Which requirement did the vote-only method exclude that you think deserves reconsideration?
4. Why is "most votes" an incomplete software-engineering rule?

Write your hypothesis in Report Section 1 **before** designing the AI policy.

## Challenge 2: Interrogate the NLP model

Open the **NLP Model** tab.

Select at least three backlog requirements with different predicted classes.

For each one, inspect:

```text
P(HIGH)
P(MEDIUM)
P(LOW)
confidence
evidence_tokens
```

Now use the **Live NLP Playground**.

Create two semantically similar requirements using different wording. Example:

```text
Improve playback reliability on unstable mobile networks.
Keep music playing when commuters temporarily lose mobile connectivity.
```

Run both through the model.

Think about:

- Did the probabilities change?
- Which words appear to influence the model?
- Should two requirements with similar intent receive materially different release priority because they were phrased differently?

Capture one interesting or surprising observation for your report.

## Challenge 3: Design your own release policy

In `main.py`, the policy values are deliberately left as `None`.

Choose your own values subject to these engineering constraints:

```text
0.30 <= AI_WEIGHT <= 0.60
0.10 <= BUSINESS_WEIGHT <= 0.30
0.10 <= STRATEGIC_WEIGHT <= 0.30
0.05 <= VOTE_WEIGHT <= 0.25

AI_WEIGHT + BUSINESS_WEIGHT + STRATEGIC_WEIGHT + VOTE_WEIGHT = 1.0

0.00 <= ACCESSIBILITY_BONUS <= 0.10
0.02 <= EFFORT_PENALTY <= 0.08
```

There is **no single required weighting**.

Before coding the score, decide:

- How much authority should historical NLP evidence have?
- How much should current strategic and business value matter?
- Should accessibility receive an explicit bonus?
- How strongly should expensive features be penalized?

Record your rationale in Report Section 3.

## Challenge 4: Implement the hybrid score

Complete:

```python
ai_assisted_priority_score(requirement, prediction)
```

Your function must use:

- `prediction["p_high"]`
- normalized business value
- normalized strategic fit
- normalized user demand
- your accessibility bonus
- your implementation-effort penalty

Normalize:

```text
business value = business_value / 10
strategic fit  = strategic_fit / 10
user demand    = min(user_votes / 100, 1)
```

Clamp the final score to `0.0 ... 1.0`.

The implementation should express **your policy**, not a copied lecturer formula.

## Challenge 5: Ship the AI-assisted release

Change:

```python
MODE = "AI_ASSISTED"
```

Run Python again.

Now inspect both:

- **NLP Model** for the ranking and evidence;
- **Live Product** for what the release actually does.

Use the product. Depending on your selected requirements, you may be able to:

- launch AI DJ,
- translate lyrics,
- enlarge accessible lyrics,
- vote in a collaborative queue,
- use Data Saver,
- see Lossless status,
- discover concerts,
- inspect AI podcast summaries.

Compare this release with the baseline.

A different ranking is not automatically better. You must decide whether the change is justified.

## Challenge 6: Stress-test your decision

Perform **both** experiments.

### Experiment A: wording sensitivity

In the Live NLP Playground, rewrite one requirement without changing its intent.

Record the before/after probabilities.

Explain whether the difference is acceptable and what it implies for using NLP in requirements engineering.

### Experiment B: policy sensitivity

Change your policy while keeping it valid.

For example:

- reduce AI_WEIGHT and redistribute the weight to business or strategic fit;
- increase EFFORT_PENALTY;
- remove the ACCESSIBILITY_BONUS;
- increase the accessibility bonus while reducing another signal.

Run the release again.

Record:

- which ranking positions changed,
- whether the selected release changed,
- which product features appeared or disappeared,
- what this tells you about the stability of the decision.

Restore the policy you ultimately defend before verification.

## Challenge 7: Verify engineering requirements

Click **Verify Requirements**.

The tests check whether:

- NLP probabilities are valid,
- the supplied model has acceptable validation performance,
- the baseline is reproducible,
- your policy satisfies the stated constraints,
- your function correctly implements **your own** policy,
- changing NLP probability actually changes the score,
- ranking and budget rules remain valid.

The tests intentionally do **not** require one lecturer-selected set of weights.

## Challenge 8: Defend the release

In the report, make an explicit recommendation:

> Would you ship the baseline release or your AI-assisted release?

Support the decision using:

- model probabilities and confidence,
- your weighting rationale,
- budget usage,
- visible product impact,
- wording-sensitivity evidence,
- policy-sensitivity evidence,
- limitations and possible historical-data bias.

A strong answer can defend either release if the reasoning is technically sound.

## Completion checklist

- [ ] Baseline executed and used
- [ ] Baseline weakness identified
- [ ] Three backlog requirements inspected in the NLP model
- [ ] Two alternative wordings tested
- [ ] Release policy designed and justified
- [ ] Hybrid score implemented
- [ ] AI-assisted release executed and used
- [ ] Wording-sensitivity experiment completed
- [ ] Policy-sensitivity experiment completed
- [ ] Engineering requirements verified
- [ ] Final release recommendation defended
- [ ] Report submitted
