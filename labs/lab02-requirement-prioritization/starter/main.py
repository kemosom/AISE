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

# Restore these values before running Verify Requirements.
AI_WEIGHT = 0.55
BUSINESS_WEIGHT = 0.20
STRATEGIC_WEIGHT = 0.15
VOTE_WEIGHT = 0.10
ACCESSIBILITY_BONUS = 0.05
EFFORT_PENALTY = 0.04


def clamp(value, lower=0.0, upper=1.0):
    return max(lower, min(upper, value))


def baseline_priority_score(requirement):
    """
    Transparent baseline: stakeholder/user demand only.
    """
    return clamp(requirement["user_votes"] / 100.0)


def ai_assisted_priority_score(requirement, prediction):
    """
    TODO: Implement the AI-assisted release-priority score.

    Required design:

        AI_WEIGHT          * prediction["p_high"]
      + BUSINESS_WEIGHT    * (business_value / 10)
      + STRATEGIC_WEIGHT   * (strategic_fit / 10)
      + VOTE_WEIGHT        * min(user_votes / 100, 1)
      + ACCESSIBILITY_BONUS if accessibility_impact is True
      - EFFORT_PENALTY     * (effort - 1)

    Clamp the final result to [0.0, 1.0].

    The placeholder deliberately returns the vote-only baseline so the
    starter program runs before you implement the function.
    """

    # TODO: replace this placeholder with the hybrid AI-assisted score.
    return baseline_priority_score(requirement)


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
    Keep the browser-preview payload intentionally small and JSON-safe.
    """
    return {
        "mode": plan["mode"],
        "budget": plan["budget"],
        "budget_used": plan["budget_used"],
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
                "score": round(row["score"], 4),
                "predicted_priority": row["prediction"]["label"],
                "p_high": round(row["prediction"]["p_high"], 4),
                "confidence": round(row["prediction"]["confidence"], 4),
                "evidence_tokens": row["prediction"]["evidence_tokens"],
                "effort": row["effort"],
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
        print("Next: implement ai_assisted_priority_score(), then set MODE = 'AI_ASSISTED'.")
    else:
        print("Compare the visible release with the baseline, then Verify Requirements.")

    return plan


if __name__ == "__main__":
    main()
