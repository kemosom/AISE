# Lab 01 Practical: Guarding an AI-Assisted Release Decision

**Scenario:** AI-assisted pull-request release workflow  
**Recommended practical time:** 90–120 minutes

## Objective

Evaluate alternative ways of integrating an AI defect-risk predictor into a software release workflow, justify an appropriate architecture, then implement and verify an independent Behavioral Programming guardrail.

## Course alignment

**Primary alignment: CLO1 → PLO1**

You investigate an AI application in software engineering, identify the limitations of AI-only release decisions, and distinguish model prediction from software authority.

**Secondary alignment: CLO2 → PLO2**

You compare alternative integration strategies, justify an appropriate method for the release-governance problem, and apply that method to the supplied software system.

**Preparation for CLO3 → PLO7**

You interpret risk probability and model confidence in context. Full quantitative evaluation of AI-powered software is developed across later labs and the Final Project.

## What is already provided

The starter project contains:

- `risk_model.py`: a supplied supervised k-NN defect-risk model,
- `helpers.py`: the Behavioral Programming coordinator,
- `main.py`: pull-request scenarios and the AI recommendation behaviour,
- automated requirement checks.

You are not expected to build the AI model or Behavioral Programming engine from scratch.

Your main implementation task is:

```python
def release_guardrail(change, prediction):
    ...
```

## Task 1: Engineering decision before coding

Before running the implementation, compare these three approaches:

**A. Direct AI authority**  
The AI model directly decides DEPLOY / REVIEW / BLOCK.

**B. Put all release rules inside the AI model**  
CI, security, and release-policy information are absorbed into one learned decision model.

**C. Separate AI prediction from deterministic release policy**  
The AI provides risk evidence and recommendations, while explicit software rules retain authority over release constraints.

Evaluate the three approaches using:

1. auditability,
2. maintainability,
3. deterministic enforcement of non-negotiable requirements,
4. dependence on model retraining,
5. handling of uncertainty and human review.

Write a short justification for the strategy you consider most appropriate for this scenario.

You will implement Strategy C in the practical, but your justification must explain why it fits this problem.

## Task 2: Run the AI-only baseline

Open `main.py` and click **Run Python** without editing anything.

The starter begins with:

```python
ENABLE_GUARDRAIL = False
```

Record:

- AI risk label,
- risk probability,
- AI confidence,
- failed-test count,
- critical security findings,
- final release decision.

Ask:

> Is a model recommendation sufficient evidence to authorize deployment?

## Task 3: Implement `release_guardrail()`

Complete the marked TODO.

### Hard release block

If either condition is true:

```text
failed_tests > 0
critical_security_findings > 0
```

the b-thread must:

- block `DEPLOY`,
- request `BLOCK_RELEASE`.

### Human-review requirement

If there is no hard release block, but either condition is true:

```text
prediction confidence < MIN_AI_CONFIDENCE
test coverage < MIN_TEST_COVERAGE
```

the b-thread must:

- block `DEPLOY`,
- request `HUMAN_REVIEW`.

### Otherwise

Do not request a competing decision. Observe the AI decision and allow it to proceed.

Do not modify `predict_risk()` to enforce these policies. The purpose is to keep AI inference and software policy separate.

## Task 4: Enable the guardrail

Change:

```python
ENABLE_GUARDRAIL = False
```

to:

```python
ENABLE_GUARDRAIL = True
```

Run the same pull request again.

Compare:

```text
AI-only decision
vs
AI + software guardrail decision
```

Explain what changed and, equally importantly, what did **not** change in the AI model.

## Task 5: Explore the supplied cases

Change `ACTIVE_CASE` and inspect at least:

- a normal low-risk pull request,
- a low-risk AI prediction with failed tests,
- a low-risk AI prediction with a critical security finding,
- a structurally high-risk pull request,
- a low-confidence boundary case.

For each case, distinguish between:

1. what the AI predicts,
2. what the software workflow finally permits,
3. which component has decision authority and why.

## Task 6: Verify Requirements

Click **Verify Requirements**.

The verification suite checks that:

- the supplied AI model produces valid predictions,
- the AI-only workflow can expose an unsafe recommendation,
- failed tests prevent deployment,
- critical security findings prevent deployment,
- low-confidence or low-coverage cases require review,
- safe changes can still deploy.

## Task 7: Report

Include:

- your engineering-decision comparison and justified strategy,
- one AI-only baseline result,
- the corresponding guardrail-enabled result,
- results from at least four pull-request cases,
- requirement-verification evidence,
- a short response to the following:

1. Why should AI prediction remain separate from release policy?
2. What could happen if every deterministic rule were embedded inside the AI model?
3. Does a high-confidence AI prediction prove that deployment is safe?
4. Which parts of the workflow should remain deterministic even if the AI model changes?
5. What is the main conclusion you draw from comparing the AI-only and guarded workflows?

## Completion checklist

- [ ] Three integration strategies compared
- [ ] Strategy choice justified using engineering criteria
- [ ] AI-only baseline executed
- [ ] `release_guardrail()` implemented
- [ ] `ENABLE_GUARDRAIL = True`
- [ ] At least four pull-request cases explored
- [ ] All requirements verified
- [ ] Results interpreted, not only reported
- [ ] Conclusion completed
- [ ] Final report submitted to Supabase
- [ ] Word copy retained for your records
