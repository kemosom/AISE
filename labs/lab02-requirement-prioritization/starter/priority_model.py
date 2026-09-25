"""
Supervised prioritization models for MAI5124 Lab 02.

The models learn patterns from historical release decisions. They do not use a
hand-written business-value score. Inputs are measurable product evidence,
engineering estimates, and NLP-derived feedback evidence.
"""

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler


DEFAULT_FEATURES = [
    "feedback_mentions_90d",
    "affected_mau",
    "support_tickets_90d",
    "mean_feedback_severity",
    "engineering_days",
    "dependency_count",
    "premium_share",
    "churn_risk_share",
    "accessibility_or_compliance",
    "incident_linked_count",
    "prerequisite_ready",
]


def matrix(rows, features):
    return np.array(
        [
            [float(row[feature]) for feature in features]
            for row in rows
        ],
        dtype=float,
    )


def labels(rows):
    return np.array([row["decision"] for row in rows])


def make_model(kind):
    if kind == "LOGISTIC_REGRESSION":
        return make_pipeline(
            StandardScaler(),
            LogisticRegression(
                max_iter=2500,
                class_weight="balanced",
                random_state=5124,
            ),
        )

    if kind == "RANDOM_FOREST":
        return RandomForestClassifier(
            n_estimators=220,
            max_depth=8,
            min_samples_leaf=3,
            class_weight="balanced_subsample",
            random_state=5124,
        )

    raise ValueError(
        "MODEL_KIND must be 'LOGISTIC_REGRESSION' or 'RANDOM_FOREST'."
    )


def benchmark_models(historical_rows, features):
    X = matrix(historical_rows, features)
    y = labels(historical_rows)

    cv = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=5124,
    )

    results = {}
    for kind in ("LOGISTIC_REGRESSION", "RANDOM_FOREST"):
        model = make_model(kind)
        f1 = cross_val_score(
            model,
            X,
            y,
            cv=cv,
            scoring="f1_macro",
        )
        accuracy = cross_val_score(
            model,
            X,
            y,
            cv=cv,
            scoring="accuracy",
        )
        results[kind] = {
            "macro_f1_mean": float(f1.mean()),
            "macro_f1_std": float(f1.std()),
            "accuracy_mean": float(accuracy.mean()),
        }

    return results


def train_model(historical_rows, features, kind):
    X = matrix(historical_rows, features)
    y = labels(historical_rows)

    model = make_model(kind)
    model.fit(X, y)
    return model


def shipped_probability(model, rows, features):
    X = matrix(rows, features)
    probabilities = model.predict_proba(X)
    classes = list(model.classes_)
    index = classes.index("SHIPPED_NEXT")
    return probabilities[:, index]


def feature_importance(model, features):
    if hasattr(model, "feature_importances_"):
        values = model.feature_importances_
    elif hasattr(model, "named_steps"):
        estimator = model.named_steps["logisticregression"]
        values = np.mean(np.abs(estimator.coef_), axis=0)
    else:
        return []

    total = float(np.sum(values))
    normalized = values if total <= 0 else values / total

    rows = [
        {
            "feature": feature,
            "importance": float(value),
        }
        for feature, value in zip(features, normalized)
    ]
    rows.sort(key=lambda row: -row["importance"])
    return rows


def training_fit_metrics(model, historical_rows, features):
    X = matrix(historical_rows, features)
    y = labels(historical_rows)
    prediction = model.predict(X)
    return {
        "accuracy": float(accuracy_score(y, prediction)),
        "macro_f1": float(
            f1_score(y, prediction, average="macro")
        ),
    }
