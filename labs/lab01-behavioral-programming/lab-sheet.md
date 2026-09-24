# Lab 01 Practical: Guarding an AI-Assisted Release Decision

**Scenario:** AI-assisted pull-request release workflow  
**Recommended practical time:** 90–120 minutes

## Objective

Integrate a supplied AI defect-risk prediction into a software release workflow, then add an independent Behavioral Programming guardrail that prevents unsafe AI-driven deployment decisions.

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

## Scenario used first

The default pull request is intentionally interesting.

Its structural code-change features look similar to historically low-risk changes, so the AI recommends **DEPLOY**.

However, the current software pipeline contains evidence that should override that recommendation.

Run the baseline before reading the implementation of the guardrail.

## Task 1: Run the AI-only baseline

Open `main.py` and click **Run Python** without editing anything.

The starter begins with:

```python
ENABLE_GUARDRAIL = False
```

Record:

- AI risk label,
- AI confidence,
- failed-test count,
- critical security findings,
- final release decision.

The program should run successfully. There is no intentional Python exception.

Ask yourself:

> Is the AI recommendation alone sufficient to authorize deployment?

## Task 2: Implement `release_guardrail()`

Complete the marked TODO.

Use these release policies:

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

Do not modify `predict_risk()` to enforce these policies. The purpose is to keep the AI model and engineering policy separate.

## Task 3: Enable the guardrail

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

## Task 4: Explore the supplied cases

Change `ACTIVE_CASE` and inspect at least these scenarios:

- a normal low-risk pull request,
- a low-risk AI prediction with failed tests,
- a low-risk AI prediction with a critical security finding,
- a structurally high-risk pull request.

For each case, distinguish between:

1. what the AI predicts,
2. what the software workflow finally allows.

## Task 5: Verify Requirements

Click **Verify Requirements**.

The verification suite checks that:

- the supplied AI model produces valid predictions,
- the AI-only workflow can expose an unsafe recommendation,
- failed tests prevent deployment,
- critical security findings prevent deployment,
- low-confidence or low-coverage cases require review,
- safe changes can still deploy,
- the guardrail does not rewrite the AI model.

## Task 6: Report

Include:

- one AI-only baseline result,
- the corresponding guardrail-enabled result,
- requirement-verification results,
- a short response to the following:

1. Why should the AI prediction remain separate from release policy?
2. What could happen if every safety rule were embedded directly inside the AI model?
3. Does a high-confidence AI prediction prove that deployment is safe?
4. Which parts of this system should remain deterministic even if the AI model changes?

## Completion checklist

- [ ] AI-only baseline executed
- [ ] `release_guardrail()` implemented
- [ ] `ENABLE_GUARDRAIL = True`
- [ ] At least four pull-request cases explored
- [ ] All requirements verified
- [ ] Evidence added to report
- [ ] Report exported to Word
