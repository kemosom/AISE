"""
MAI5124 AI in Software Engineering
Lab 02: Data-Driven AI for Software Requirements Prioritization

This lab uses:
- 958 synthetic customer-feedback records,
- 360 synthetic historical release decisions,
- 12 current candidate requirements,
- TF-IDF + cosine similarity for feedback-to-requirement NLP matching,
- Logistic Regression and Random Forest for supervised release prioritization,
- a dependency-aware release optimizer with a 75 engineer-day budget.

The datasets are realistic teaching data. They are NOT Spotify internal data.
"""

import itertools
import json

from data_pipeline import (
    FeedbackRequirementMatcher,
    aggregate_feedback,
    evaluate_audited_matches,
    load_candidates,
    load_feedback,
    load_historical,
    threshold_sweep,
    top_feedback_examples,
)
from priority_model import (
    DEFAULT_FEATURES,
    benchmark_models,
    feature_importance,
    shipped_probability,
    train_model,
    training_fit_metrics,
)


# ---------------------------------------------------------------------------
# STUDENT DECISIONS
# ---------------------------------------------------------------------------

# Start with BASELINE.
# Then use ANALYZE to evaluate the NLP threshold and compare ML models.
# Finally use AI_ASSISTED after completing the decisions and feature pipeline.
MODE = "BASELINE"

# STUDENT DECISION 1:
# Choose this after inspecting the audited NLP threshold sweep.
# Typical useful values are between 0.10 and 0.42, but do not guess.
NLP_SIMILARITY_THRESHOLD = None

# STUDENT DECISION 2:
# Choose after comparing 5-fold macro-F1 and considering interpretability.
# Allowed: "LOGISTIC_REGRESSION" or "RANDOM_FOREST"
MODEL_KIND = None

# You may later remove one or more features for an ablation experiment.
MODEL_FEATURES = DEFAULT_FEATURES.copy()

MAX_RELEASE_DAYS = 75

# Optional what-if experiment.
# Example:
# COUNTERFACTUAL_OVERRIDES = {
#     "REQ-304": {"engineering_days": 25}
# }
COUNTERFACTUAL_OVERRIDES = {}


CANDIDATES = load_candidates()
FEEDBACK = load_feedback()
HISTORICAL = load_historical()
MATCHER = FeedbackRequirementMatcher(CANDIDATES, FEEDBACK)


def apply_counterfactual_overrides(candidates):
    rows = [dict(row) for row in candidates]

    for row in rows:
        updates = COUNTERFACTUAL_OVERRIDES.get(row["id"], {})
        for field, value in updates.items():
            if field not in row:
                raise KeyError(
                    f"Unknown field {field!r} for {row['id']}."
                )
            row[field] = value

    return rows


def baseline_release_value(requirement):
    """
    Transparent non-ML baseline:
    prioritize support pressure, measured by support tickets in the last 90 days.
    """
    return float(requirement["support_tickets_90d"])


def validate_student_choices():
    if NLP_SIMILARITY_THRESHOLD is None:
        raise ValueError(
            "Choose NLP_SIMILARITY_THRESHOLD after running MODE = 'ANALYZE'."
        )

    if not (0.08 <= NLP_SIMILARITY_THRESHOLD <= 0.50):
        raise ValueError(
            "NLP_SIMILARITY_THRESHOLD must be between 0.08 and 0.50."
        )

    if MODEL_KIND not in {
        "LOGISTIC_REGRESSION",
        "RANDOM_FOREST",
    }:
        raise ValueError(
            "Choose MODEL_KIND after comparing the two models in ANALYZE mode."
        )

    if len(MODEL_FEATURES) < 6:
        raise ValueError(
            "Use at least six evidence features for the deployed model."
        )

    unknown = [
        feature
        for feature in MODEL_FEATURES
        if feature not in DEFAULT_FEATURES
    ]
    if unknown:
        raise ValueError(
            "Unknown model feature(s): " + ", ".join(unknown)
        )


def build_current_feature_rows(candidates, feedback_evidence):
    """
    STUDENT TASK: construct the feature table for current requirements.

    Historical release decisions use the columns in DEFAULT_FEATURES.
    Your current requirements must be transformed into the SAME feature schema.

    The first two features come from the NLP-matched customer feedback:
        feedback_mentions_90d
        mean_feedback_severity

    The remaining fields come from current product telemetry and engineering
    estimates in candidate_backlog.csv.

    Return a list of dictionaries. Each row must include:
        id, title, description, visual_feature, prerequisite,
        every feature in DEFAULT_FEATURES

    Do not invent scores such as business_value=9 or strategic_fit=8.
    """

    # TODO: implement the feature-engineering join.
    #
    # Hints:
    #   evidence = feedback_evidence[requirement["id"]]
    #   evidence["feedback_mentions_90d"]
    #   evidence["mean_feedback_severity"]
    #
    # Copy measurable fields such as affected_mau, support_tickets_90d,
    # engineering_days, dependency_count, premium_share, churn_risk_share,
    # accessibility_or_compliance, incident_linked_count, prerequisite_ready.
    raise NotImplementedError(
        "Build the current feature table from NLP evidence + telemetry."
    )


def _dependency_valid(selected_ids, requirement):
    prerequisite = requirement.get("prerequisite", "")
    prerequisite_ready = int(requirement.get("prerequisite_ready", 0))

    if not prerequisite:
        return prerequisite_ready == 1

    return prerequisite_ready == 1 or prerequisite in selected_ids


def optimize_release(requirements, value_by_id, budget=MAX_RELEASE_DAYS):
    """
    Exhaustively search all 2^N subsets.

    N=12 in this lab, so exhaustive search is small (4096 subsets) and makes
    the release decision reproducible. A subset is valid when:
    - total engineering days <= budget
    - every unmet prerequisite is included in the same release
    """
    best = None

    for mask in range(1 << len(requirements)):
        selected = [
            requirements[index]
            for index in range(len(requirements))
            if mask & (1 << index)
        ]

        total_days = sum(row["engineering_days"] for row in selected)
        if total_days > budget:
            continue

        selected_ids = {row["id"] for row in selected}

        if any(
            not _dependency_valid(selected_ids, row)
            for row in selected
        ):
            continue

        total_value = sum(
            float(value_by_id[row["id"]])
            for row in selected
        )

        candidate = {
            "selected": selected,
            "days_used": total_days,
            "objective_value": total_value,
        }

        if best is None:
            best = candidate
            continue

        if total_value > best["objective_value"]:
            best = candidate
        elif (
            abs(total_value - best["objective_value"]) < 1e-12
            and total_days < best["days_used"]
        ):
            best = candidate

    return best or {
        "selected": [],
        "days_used": 0,
        "objective_value": 0.0,
    }


def analyze_mode():
    print("=" * 78)
    print("LAB 02 | DATA + NLP + MODEL ANALYSIS")
    print("=" * 78)
    print(
        f"Dataset: {len(FEEDBACK)} feedback records | "
        f"{len(HISTORICAL)} historical release decisions | "
        f"{len(CANDIDATES)} current requirements"
    )

    print()
    print("NLP THRESHOLD SWEEP")
    print("-" * 78)

    sweep = threshold_sweep(MATCHER)
    for row in sweep:
        print(
            f"threshold={row['threshold']:.2f} | "
            f"audited accuracy={row['accuracy']:.3f} | "
            f"coverage={row['coverage']:.3f} | "
            f"assigned={row['assigned_count']}"
        )

    print()
    print("MODEL COMPARISON | 5-FOLD CROSS-VALIDATION")
    print("-" * 78)

    benchmark = benchmark_models(
        HISTORICAL,
        DEFAULT_FEATURES,
    )

    for kind, metrics in benchmark.items():
        print(
            f"{kind:<20} | "
            f"macro-F1={metrics['macro_f1_mean']:.3f} "
            f"(+/- {metrics['macro_f1_std']:.3f}) | "
            f"accuracy={metrics['accuracy_mean']:.3f}"
        )

    payload = {
        "mode": "ANALYZE",
        "data": {
            "feedback_rows": len(FEEDBACK),
            "historical_rows": len(HISTORICAL),
            "candidate_rows": len(CANDIDATES),
        },
        "threshold_sweep": sweep,
        "benchmarks": benchmark,
    }

    print("__AISE_ANALYSIS__ " + json.dumps(payload, separators=(",", ":")))
    print()
    print(
        "Next: choose an NLP threshold and model kind, then implement "
        "build_current_feature_rows()."
    )


def baseline_mode():
    candidates = apply_counterfactual_overrides(CANDIDATES)

    value_by_id = {
        row["id"]: baseline_release_value(row)
        for row in candidates
    }

    plan = optimize_release(
        candidates,
        value_by_id,
        budget=MAX_RELEASE_DAYS,
    )

    ranking = sorted(
        candidates,
        key=lambda row: (
            -value_by_id[row["id"]],
            row["engineering_days"],
            row["id"],
        ),
    )

    print("=" * 78)
    print("LAB 02 | SUPPORT-PRESSURE BASELINE")
    print("=" * 78)
    print(
        f"Release budget: {plan['days_used']}/{MAX_RELEASE_DAYS} engineer-days"
    )
    print()
    for index, row in enumerate(ranking, start=1):
        print(
            f"{index:>2}. {row['id']} | {row['title']:<28} | "
            f"tickets={row['support_tickets_90d']:<4} | "
            f"days={row['engineering_days']}"
        )

    payload = {
        "mode": "BASELINE",
        "budget": MAX_RELEASE_DAYS,
        "budget_used": plan["days_used"],
        "data": {
            "feedback_rows": len(FEEDBACK),
            "historical_rows": len(HISTORICAL),
            "candidate_rows": len(CANDIDATES),
        },
        "selected": [
            {
                "id": row["id"],
                "title": row["title"],
                "visual_feature": row["visual_feature"],
                "engineering_days": row["engineering_days"],
                "score": value_by_id[row["id"]],
            }
            for row in plan["selected"]
        ],
        "ranking": [
            {
                "id": row["id"],
                "title": row["title"],
                "description": row["description"],
                "engineering_days": row["engineering_days"],
                "support_tickets_90d": row["support_tickets_90d"],
                "affected_mau": row["affected_mau"],
                "visual_feature": row["visual_feature"],
                "baseline_value": value_by_id[row["id"]],
            }
            for row in ranking
        ],
    }

    print("__AISE_PREVIEW__ " + json.dumps(payload, separators=(",", ":")))


def ai_assisted_mode():
    validate_student_choices()

    candidates = apply_counterfactual_overrides(CANDIDATES)
    matches = MATCHER.match_all(NLP_SIMILARITY_THRESHOLD)
    audit = evaluate_audited_matches(matches)
    evidence = aggregate_feedback(matches, candidates)

    current_rows = build_current_feature_rows(
        candidates,
        evidence,
    )

    model_benchmarks = benchmark_models(
        HISTORICAL,
        MODEL_FEATURES,
    )
    model = train_model(
        HISTORICAL,
        MODEL_FEATURES,
        MODEL_KIND,
    )
    probabilities = shipped_probability(
        model,
        current_rows,
        MODEL_FEATURES,
    )
    fit_metrics = training_fit_metrics(
        model,
        HISTORICAL,
        MODEL_FEATURES,
    )

    value_by_id = {
        row["id"]: float(probability)
        for row, probability in zip(current_rows, probabilities)
    }

    plan = optimize_release(
        current_rows,
        value_by_id,
        budget=MAX_RELEASE_DAYS,
    )

    ranking = sorted(
        current_rows,
        key=lambda row: (
            -value_by_id[row["id"]],
            row["engineering_days"],
            row["id"],
        ),
    )

    print("=" * 78)
    print("LAB 02 | AI-ASSISTED REQUIREMENTS PRIORITIZATION")
    print("=" * 78)
    print(
        f"NLP threshold={NLP_SIMILARITY_THRESHOLD:.2f} | "
        f"audited match accuracy={audit['accuracy']:.3f} "
        f"on {audit['audited_count']} audited records"
    )
    print(
        f"Model={MODEL_KIND} | "
        f"5-fold macro-F1="
        f"{model_benchmarks[MODEL_KIND]['macro_f1_mean']:.3f}"
    )
    print(
        f"Release budget: {plan['days_used']}/{MAX_RELEASE_DAYS} engineer-days"
    )
    print()
    print("CURRENT BACKLOG RANKING")
    print("-" * 78)

    for index, row in enumerate(ranking, start=1):
        probability = value_by_id[row["id"]]
        matched = evidence[row["id"]]
        print(
            f"{index:>2}. {row['id']} | {row['title']:<28} | "
            f"P(ship_next)={probability:.3f} | "
            f"feedback={matched['feedback_mentions_90d']:<3} | "
            f"days={row['engineering_days']}"
        )

    importance = feature_importance(
        model,
        MODEL_FEATURES,
    )

    payload = {
        "mode": "AI_ASSISTED",
        "budget": MAX_RELEASE_DAYS,
        "budget_used": plan["days_used"],
        "data": {
            "feedback_rows": len(FEEDBACK),
            "historical_rows": len(HISTORICAL),
            "candidate_rows": len(CANDIDATES),
            "audited_feedback_rows": audit["audited_count"],
        },
        "nlp": {
            "method": "TF-IDF (1-2 grams) + cosine similarity",
            "threshold": NLP_SIMILARITY_THRESHOLD,
            "audited_accuracy": audit["accuracy"],
        },
        "model": {
            "kind": MODEL_KIND,
            "features": MODEL_FEATURES,
            "benchmarks": model_benchmarks,
            "training_fit": fit_metrics,
            "feature_importance": importance,
        },
        "selected": [
            {
                "id": row["id"],
                "title": row["title"],
                "visual_feature": row["visual_feature"],
                "engineering_days": row["engineering_days"],
                "score": value_by_id[row["id"]],
            }
            for row in plan["selected"]
        ],
        "ranking": [
            {
                "id": row["id"],
                "title": row["title"],
                "description": row["description"],
                "visual_feature": row["visual_feature"],
                "engineering_days": row["engineering_days"],
                "affected_mau": row["affected_mau"],
                "support_tickets_90d": row["support_tickets_90d"],
                "feedback_mentions_90d": row["feedback_mentions_90d"],
                "mean_feedback_severity": round(
                    row["mean_feedback_severity"],
                    3,
                ),
                "ship_probability": round(
                    value_by_id[row["id"]],
                    5,
                ),
                "prerequisite": row.get("prerequisite", ""),
                "feedback_examples": top_feedback_examples(
                    matches,
                    row["id"],
                    limit=4,
                ),
            }
            for row in ranking
        ],
    }

    print("__AISE_PREVIEW__ " + json.dumps(payload, separators=(",", ":")))
    print()
    print(
        "Now inspect the AI Evidence tab and the live product. "
        "Then run a counterfactual or feature-ablation experiment."
    )


def main():
    if MODE == "BASELINE":
        baseline_mode()
    elif MODE == "ANALYZE":
        analyze_mode()
    elif MODE == "AI_ASSISTED":
        ai_assisted_mode()
    else:
        raise ValueError(
            "MODE must be 'BASELINE', 'ANALYZE', or 'AI_ASSISTED'."
        )


if __name__ == "__main__":
    main()
