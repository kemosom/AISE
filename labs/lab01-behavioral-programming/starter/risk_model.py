"""
Supplied teaching model for MAI5124 Lab 01.

The model is a small supervised k-nearest-neighbours classifier over a
historical software-change dataset. It is intentionally simple enough to
inspect in a laboratory, but it is a genuine data-driven predictor rather
than a hand-written release rule.

Important:
- The model estimates defect risk from historical change characteristics.
- It does NOT see current failed-test or critical-security findings.
- Those current engineering signals are handled separately by release policy.
"""

MODEL_FEATURES = [
    "lines_changed",
    "files_changed",
    "test_coverage",
    "static_warnings",
    "prior_defect_rate",
]

# Historical change records used by the supplied teaching model.
# risky = 1 means the change later required rollback/hotfix/defect correction.
HISTORICAL_CHANGES = [
    {"lines_changed": 24,  "files_changed": 2,  "test_coverage": 94, "static_warnings": 0, "prior_defect_rate": 0.05, "risky": 0},
    {"lines_changed": 48,  "files_changed": 3,  "test_coverage": 91, "static_warnings": 1, "prior_defect_rate": 0.08, "risky": 0},
    {"lines_changed": 70,  "files_changed": 5,  "test_coverage": 88, "static_warnings": 1, "prior_defect_rate": 0.10, "risky": 0},
    {"lines_changed": 95,  "files_changed": 6,  "test_coverage": 84, "static_warnings": 2, "prior_defect_rate": 0.12, "risky": 0},
    {"lines_changed": 120, "files_changed": 7,  "test_coverage": 82, "static_warnings": 2, "prior_defect_rate": 0.15, "risky": 0},
    {"lines_changed": 150, "files_changed": 8,  "test_coverage": 78, "static_warnings": 3, "prior_defect_rate": 0.18, "risky": 1},
    {"lines_changed": 190, "files_changed": 10, "test_coverage": 75, "static_warnings": 4, "prior_defect_rate": 0.20, "risky": 1},
    {"lines_changed": 230, "files_changed": 12, "test_coverage": 72, "static_warnings": 5, "prior_defect_rate": 0.24, "risky": 1},
    {"lines_changed": 300, "files_changed": 15, "test_coverage": 68, "static_warnings": 7, "prior_defect_rate": 0.28, "risky": 1},
    {"lines_changed": 420, "files_changed": 20, "test_coverage": 62, "static_warnings": 9, "prior_defect_rate": 0.32, "risky": 1},
    {"lines_changed": 38,  "files_changed": 2,  "test_coverage": 96, "static_warnings": 0, "prior_defect_rate": 0.04, "risky": 0},
    {"lines_changed": 85,  "files_changed": 4,  "test_coverage": 90, "static_warnings": 1, "prior_defect_rate": 0.09, "risky": 0},
    {"lines_changed": 175, "files_changed": 9,  "test_coverage": 80, "static_warnings": 3, "prior_defect_rate": 0.19, "risky": 1},
    {"lines_changed": 260, "files_changed": 13, "test_coverage": 74, "static_warnings": 6, "prior_defect_rate": 0.25, "risky": 1},
    {"lines_changed": 110, "files_changed": 6,  "test_coverage": 86, "static_warnings": 2, "prior_defect_rate": 0.11, "risky": 1},
    {"lines_changed": 165, "files_changed": 9,  "test_coverage": 79, "static_warnings": 4, "prior_defect_rate": 0.17, "risky": 0},
    {"lines_changed": 140, "files_changed": 7,  "test_coverage": 80, "static_warnings": 3, "prior_defect_rate": 0.16, "risky": 0},
    {"lines_changed": 205, "files_changed": 11, "test_coverage": 76, "static_warnings": 4, "prior_defect_rate": 0.22, "risky": 1},
]


def _feature_ranges():
    mins = {
        feature: min(row[feature] for row in HISTORICAL_CHANGES)
        for feature in MODEL_FEATURES
    }
    maxs = {
        feature: max(row[feature] for row in HISTORICAL_CHANGES)
        for feature in MODEL_FEATURES
    }
    return mins, maxs


def _distance(change, history_row, mins, maxs):
    total = 0.0

    for feature in MODEL_FEATURES:
        span = maxs[feature] - mins[feature]
        span = span if span != 0 else 1.0
        delta = (change[feature] - history_row[feature]) / span
        total += delta * delta

    return total ** 0.5


def predict_risk(change, k=7):
    """
    Predict defect risk using distance-weighted k-nearest neighbours.

    Returns:
        {
            "risk_label": "LOW" | "HIGH",
            "risk_probability": float,
            "confidence": float,
            "neighbors_used": int,
        }
    """
    mins, maxs = _feature_ranges()

    neighbors = sorted(
        (
            _distance(change, row, mins, maxs),
            row["risky"],
        )
        for row in HISTORICAL_CHANGES
    )[:k]

    weights = [1.0 / (distance + 0.05) for distance, _ in neighbors]
    risky_weight = sum(
        weight * label
        for weight, (_, label) in zip(weights, neighbors)
    )
    probability = risky_weight / sum(weights)

    risk_label = "HIGH" if probability >= 0.5 else "LOW"
    confidence = max(probability, 1.0 - probability)

    return {
        "risk_label": risk_label,
        "risk_probability": round(probability, 3),
        "confidence": round(confidence, 3),
        "neighbors_used": len(neighbors),
    }
