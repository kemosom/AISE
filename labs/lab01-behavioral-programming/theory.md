# Lab 01: Safe Integration of AI Decisions in Software Engineering

**Pre-lab recap:** about 8 minutes

You already have the lecture slides. This page contains only the concepts needed for the practical.

## 1. The software-engineering problem

Modern software teams increasingly use AI to support defect-risk prediction, code review, test prioritisation, and release readiness.

An AI model may recommend that a pull request is safe to deploy. That recommendation should not automatically become a deployment action.

A software system may also have non-negotiable engineering requirements:

- failed tests must prevent deployment,
- critical security findings must prevent deployment,
- low-confidence AI decisions should require human review.

The design question is:

> How should an AI recommendation be integrated into a software workflow so that the system remains maintainable, auditable, and safe?

## 2. Engineering decision before coding

Before you implement anything, compare three possible integration strategies.

### Strategy A: AI has direct release authority

```text
AI model
   ↓
DEPLOY / REVIEW / BLOCK
```

This is simple, but deterministic engineering requirements become dependent on the model decision.

### Strategy B: Put every release rule inside the AI model

```text
code-change features + CI/security signals
                ↓
             AI model
                ↓
      DEPLOY / REVIEW / BLOCK
```

This can use more information, but explicit policies become harder to audit and may depend on retraining, model behaviour, and training data.

### Strategy C: Separate prediction from software policy

```text
AI prediction ──────────────┐
                            ├── decision coordinator ── final action
CI/security requirements ───┘
```

The AI provides evidence and a recommendation. Independent software rules retain authority over deterministic constraints.

Before coding, judge these strategies using:

- auditability,
- maintainability,
- deterministic safety constraints,
- dependence on model retraining,
- handling of uncertainty and human review.

For this laboratory, you will implement Strategy C using Behavioral Programming. Your report must explain **why** it is appropriate for this release-governance scenario rather than simply stating that it was provided.

## 3. The AI component

The supplied project contains a small supervised machine-learning model based on **k-nearest neighbours (k-NN)**.

It estimates software-change risk from historical characteristics such as:

- lines changed,
- files changed,
- test coverage,
- static-analysis warnings,
- prior defect rate.

The model returns:

```text
risk_label
risk_probability
confidence
```

The model is supplied. You are not training a classifier in this lab.

The important distinction is:

> An AI prediction is evidence. It is not automatically a software requirement or deployment authority.

## 4. Behavioral Programming

Behavioral Programming (BP) represents independent requirements as behavioral threads, or **b-threads**.

At a synchronization point, b-thread $i$ provides:

$$
S_i = \langle R_i, W_i, B_i \rangle
$$

where:

- $R_i$ contains requested events,
- $W_i$ contains events being observed,
- $B_i$ contains blocked events.

The coordinator selects from:

$$
E_{\mathrm{candidate}}
=
\left(\bigcup_i R_i\right)
\setminus
\left(\bigcup_i B_i\right)
$$

This lets an AI component request **DEPLOY**, while an independent engineering guardrail can block **DEPLOY** and request **HUMAN_REVIEW** or **BLOCK_RELEASE**.

## 5. Why combine AI and explicit software policy?

Suppose the AI predicts:

```text
AI risk: LOW
AI confidence: 0.90
AI recommendation: DEPLOY
```

but the current pipeline reports:

```text
failed tests: 2
critical security findings: 1
```

The AI prediction may still be internally consistent with the features it was trained on. The release workflow should still reject automatic deployment.

A separate guardrail can enforce:

```text
IF failed_tests > 0:
    block DEPLOY
    request BLOCK_RELEASE

IF critical_security_findings > 0:
    block DEPLOY
    request BLOCK_RELEASE

IF AI confidence is below the accepted threshold:
    block DEPLOY
    request HUMAN_REVIEW
```

The AI model remains unchanged. The engineering policy remains explicit and independently verifiable.

## 6. Course alignment

This lab contributes primarily to:

- **CLO1 → PLO1:** investigate how AI is applied in a software-engineering workflow and identify limitations of AI-only decisions.
- **CLO2 → PLO2:** compare alternative integration strategies, justify an appropriate method, and apply it to the software system.

It also introduces quantitative interpretation through risk probability and confidence, which prepares you for **CLO3 → PLO7**. Full quantitative performance evaluation is developed later and culminates in the Final Project.

## 7. What you will do

You will:

1. compare three AI-integration strategies before coding,
2. justify the separated AI + policy architecture,
3. run an AI-only release baseline,
4. implement one independent `release_guardrail()` b-thread,
5. enable the guardrail,
6. compare multiple pull-request scenarios,
7. verify the stated software requirements,
8. interpret the results and connect the pattern to your Final Project.

The coding is the experiment. The Master's-level task is the engineering judgment, system integration, verification, and interpretation around the AI component.
