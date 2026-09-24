# Lab 01: Safe Integration of AI Decisions in Software Engineering

**Pre-lab recap:** about 6–8 minutes

You already have the lecture slides. This page only contains the concepts needed for the practical.

## 1. The software-engineering problem

Modern software teams increasingly use AI to support decisions such as defect-risk prediction, code review, test prioritisation, and release readiness.

An AI model may recommend that a pull request is safe to deploy. That recommendation should not automatically become a deployment action.

A software system may also have non-negotiable engineering requirements:

- failed tests must prevent deployment,
- critical security findings must prevent deployment,
- low-confidence AI decisions should require human review.

The design question in this lab is:

> How can an AI recommendation be integrated into a software workflow while keeping engineering constraints independent, explicit, and verifiable?

## 2. The AI component

The supplied project contains a small supervised machine-learning model based on **k-nearest neighbours (k-NN)**.

It estimates software-change risk from historical change characteristics such as:

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

The model is intentionally supplied. You are not training a classifier in this lab.

The important point is that an AI prediction is **evidence**, not a software requirement.

## 3. Behavioral Programming

Behavioral Programming (BP) represents independent requirements as behavioral threads, or **b-threads**.

At a synchronization point, b-thread $i$ provides:

$$
S_i = \langle R_i, W_i, B_i \rangle
$$

where:

- $R_i$ contains events requested by the b-thread,
- $W_i$ contains events it wants to observe,
- $B_i$ contains events it blocks.

The coordinator selects from:

$$
E_{\mathrm{candidate}}
=
\left(\bigcup_i R_i\right)
\setminus
\left(\bigcup_i B_i\right)
$$

This means an AI component can request **DEPLOY**, while an independent engineering guardrail can block **DEPLOY** and request **HUMAN_REVIEW** or **BLOCK_RELEASE**.

## 4. Why combine AI and BP?

Consider a change for which the AI predicts:

```text
AI risk: LOW
AI confidence: 0.90
AI recommendation: DEPLOY
```

but the current CI pipeline reports:

```text
failed tests: 2
critical security findings: 1
```

The AI prediction may still be reasonable given the features on which it was trained. The software workflow, however, must not deploy the change.

A separate behavioral guardrail can enforce:

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

The AI model does not need to be rewritten. The engineering policy remains a separate requirement.

## 5. What you will do

You will work with a realistic pull-request release workflow.

The project already contains:

- a supplied k-NN defect-risk model,
- historical software-change examples,
- an AI recommendation b-thread,
- a Behavioral Programming coordinator,
- several pull-request scenarios.

You will:

1. run an AI-only baseline,
2. observe a case where the AI recommends deployment despite current CI/security evidence,
3. implement one independent `release_guardrail()` b-thread,
4. enable the guardrail,
5. compare the resulting release decision,
6. verify the requirements automatically,
7. explain why the combined design is safer and more maintainable.

The coding is the experiment. The learning goal is how to integrate AI into a software system responsibly and modularly.