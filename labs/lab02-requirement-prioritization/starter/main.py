"""
MAI5124 AI in Software Engineering
Lab 02: AI Techniques for Software Requirements Prioritization

STUDENT TASK
------------
1. Run the vote-only BASELINE.
2. Inspect the right-side product preview.
3. Implement ai_assisted_priority_score().
4. Set MODE = "AI_ASSISTED".
5. Run again and compare both the ranking and the visible release.
6. Verify requirements and complete the report.
"""

import json

from priority_model import evaluate_model, predict_priority
from requirements_data import CANDIDATE_REQUIREMENTS


RELEASE_BUDGET = 9

# Start with the transparent vote-only baseline.
MODE = "BASELINE"

# STUDENT DECISION 1: design your release policy.
#
# Choose values that satisfy:
#   0.30 <= AI_WEIGHT <= 0.60
#   0.10 <= BUSINESS_WEIGHT <= 0.30
#   0.10 <= STRATEGIC_WEIGHT <= 0.30
#   0.05 <= VOTE_WEIGHT <= 0.25
#   AI_WEIGHT + BUSINESS_WEIGHT + STRATEGIC_WEIGHT + VOTE_WEIGHT == 1.0
#   0.00 <= ACCESSIBILITY_BONUS <= 0.10
#   0.02 <= EFFORT_PENALTY <= 0.08
#
# There is no single accepted weighting. Your values must be technically valid
# and justified in the report.
AI_WEIGHT = None
BUSINESS_WEIGHT = None
STRATEGIC_WEIGHT = None
VOTE_WEIGHT = None
ACCESSIBILITY_BONUS = None
EFFORT_PENALTY = None


def clamp(value, lower=0.0, upper=1.0):
    return max(lower, min(upper, value))


def baseline_priority_score(requirement):
    """
    Transparent baseline: stakeholder/user demand only.
    """
    return clamp(requirement["user_votes"] / 100.0)


def validate_policy():
    """
    Validate the policy chosen by the student before AI-assisted planning.
    """
    values = {
        "AI_WEIGHT": AI_WEIGHT,
        "BUSINESS_WEIGHT": BUSINESS_WEIGHT,
        "STRATEGIC_WEIGHT": STRATEGIC_WEIGHT,
        "VOTE_WEIGHT": VOTE_WEIGHT,
        "ACCESSIBILITY_BONUS": ACCESSIBILITY_BONUS,
        "EFFORT_PENALTY": EFFORT_PENALTY,
    }

    missing = [name for name, value in values.items() if value is None]
    if missing:
        raise ValueError(
            "Design the AI-assisted release policy first. "
            "Set these constants: " + ", ".join(missing)
        )

    core_total = (
        AI_WEIGHT
        + BUSINESS_WEIGHT
        + STRATEGIC_WEIGHT
        + VOTE_WEIGHT
    )

    if abs(core_total - 1.0) > 1e-9:
        raise ValueError(
            f"Core policy weights must sum to 1.0, not {core_total:.3f}."
        )


def ai_assisted_priority_score(requirement, prediction):
    """
    STUDENT DECISION 2: implement your hybrid priority score.

    Your score MUST use:
      - prediction["p_high"]
      - normalized business value
      - normalized strategic fit
      - normalized user demand
      - an accessibility bonus
      - an implementation-effort penalty

    Use the policy constants you chose above.

    The score must be clamped to [0.0, 1.0].
    """

    # TODO:
    # 1. Normalize business_value, strategic_fit, and user_votes.
    # 2. Combine them with prediction["p_high"] using your chosen weights.
    # 3. Add the accessibility bonus when applicable.
    # 4. Penalize implementation effort.
    # 5. Clamp and return the final score.
    raise NotImplementedError(
        "Implement ai_assisted_priority_score() using your chosen policy."
    )


def moscow_label(score):
    if score >= 0.75:
        return "MUST"
    if score >= 0.55:
        return "SHOULD"
    if score >= 0.35:
        return "COULD"
    return "WONT"


def rank_requirements(mode=None):
    """
    Score and rank every candidate requirement.
    """
    selected_mode = mode or MODE
    rows = []

    for requirement in CANDIDATE_REQUIREMENTS:
        prediction = predict_priority(requirement)

        if selected_mode == "BASELINE":
            score = baseline_priority_score(requirement)
        elif selected_mode == "AI_ASSISTED":
            validate_policy()
            score = ai_assisted_priority_score(requirement, prediction)
        else:
            raise ValueError(
                "MODE must be either 'BASELINE' or 'AI_ASSISTED'"
            )

        rows.append(
            {
                **requirement,
                "score": score,
                "moscow": moscow_label(score),
                "prediction": prediction,
            }
        )

    return sorted(
        rows,
        key=lambda row: (-row["score"], row["effort"], row["id"]),
    )


def build_release_plan(mode=None):
    """
    Greedily select the highest-ranked requirements that fit the release
    budget. The ranking algorithm and budget constraint are kept separate.
    """
    selected_mode = mode or MODE
    ranking = rank_requirements(selected_mode)

    selected = []
    budget_used = 0

    for requirement in ranking:
        effort = requirement["effort"]

        if budget_used + effort <= RELEASE_BUDGET:
            selected.append(requirement)
            budget_used += effort

    return {
        "mode": selected_mode,
        "budget": RELEASE_BUDGET,
        "budget_used": budget_used,
        "selected": selected,
        "ranking": ranking,
    }


def preview_payload(plan):
    """
    Send both release-plan evidence and NLP-model evidence to the browser.
    This lets the student inspect the AI model directly instead of treating
    the model as a hidden implementation detail.
    """
    metrics = evaluate_model()

    return {
        "mode": plan["mode"],
        "budget": plan["budget"],
        "budget_used": plan["budget_used"],
        "model": {
            "name": "Multinomial Naive Bayes",
            "accuracy": round(metrics["accuracy"], 4),
            "macro_f1": round(metrics["macro_f1"], 4),
            "classes": ["HIGH", "MEDIUM", "LOW"],
        },
        "selected": [
            {
                "id": row["id"],
                "title": row["title"],
                "score": round(row["score"], 4),
                "moscow": row["moscow"],
                "effort": row["effort"],
                "visual_feature": row["visual_feature"],
            }
            for row in plan["selected"]
        ],
        "ranking": [
            {
                "id": row["id"],
                "title": row["title"],
                "description": row["description"],
                "score": round(row["score"], 4),
                "predicted_priority": row["prediction"]["label"],
                "p_high": round(row["prediction"]["p_high"], 4),
                "p_medium": round(row["prediction"]["p_medium"], 4),
                "p_low": round(row["prediction"]["p_low"], 4),
                "confidence": round(row["prediction"]["confidence"], 4),
                "evidence_tokens": row["prediction"]["evidence_tokens"],
                "effort": row["effort"],
                "user_votes": row["user_votes"],
                "business_value": row["business_value"],
                "strategic_fit": row["strategic_fit"],
                "accessibility_impact": row["accessibility_impact"],
                "visual_feature": row["visual_feature"],
            }
            for row in plan["ranking"]
        ],
    }


def print_release_summary(plan):
    metrics = evaluate_model()

    print("=" * 76)
    print("LAB 02 | AI-ASSISTED SOFTWARE REQUIREMENTS PRIORITIZATION")
    print("=" * 76)
    print(
        f"NLP validation: accuracy={metrics['accuracy']:.3f}, "
        f"macro-F1={metrics['macro_f1']:.3f}"
    )
    print(
        f"Release mode: {plan['mode']} | "
        f"budget={plan['budget_used']}/{plan['budget']} effort points"
    )
    print()
    print("RANKING")
    print("-" * 76)

    for index, row in enumerate(plan["ranking"], start=1):
        prediction = row["prediction"]
        print(
            f"{index:>2}. {row['id']} | {row['title']:<28} "
            f"score={row['score']:.3f} | "
            f"AI={prediction['label']} "
            f"(p_high={prediction['p_high']:.3f}, "
            f"conf={prediction['confidence']:.3f}) | "
            f"effort={row['effort']}"
        )

    print()
    print("SELECTED FOR RELEASE")
    print("-" * 76)

    for row in plan["selected"]:
        print(
            f"{row['id']} | {row['title']} | "
            f"{row['moscow']} | effort={row['effort']}"
        )


def main():
    plan = build_release_plan()
    print_release_summary(plan)

    # The right-side React preview reads this marker and renders the selected
    # requirements inside the Spotify-style interface.
    print(
        "__AISE_PREVIEW__ "
        + json.dumps(preview_payload(plan), separators=(",", ":"))
    )

    print()
    if MODE == "BASELINE":
        print("Next: inspect the NLP model, design your policy weights, implement the hybrid score, then set MODE = 'AI_ASSISTED'.")
    else:
        print("Compare the visible release with the baseline, then Verify Requirements.")

    return plan


if __name__ == "__main__":
    main()
