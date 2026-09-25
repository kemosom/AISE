from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / "labs" / "lab02-requirement-prioritization"
STARTER = LAB / "starter"

sys.path.insert(0, str(STARTER))

from data_pipeline import (
    FeedbackRequirementMatcher,
    aggregate_feedback,
    evaluate_audited_matches,
    load_candidates,
    load_feedback,
    load_historical,
    threshold_sweep,
)
from priority_model import (
    DEFAULT_FEATURES,
    benchmark_models,
    feature_importance,
    shipped_probability,
    train_model,
)

import os
os.chdir(LAB / "data")

candidates = load_candidates()
feedback = load_feedback()
historical = load_historical()
matcher = FeedbackRequirementMatcher(candidates, feedback)

sweep = threshold_sweep(matcher)
best = max(sweep, key=lambda row: (row["accuracy"], row["coverage"]))
threshold = best["threshold"]
matches = matcher.match_all(threshold)
audit = evaluate_audited_matches(matches)
evidence = aggregate_feedback(matches, candidates)

rows = []
for requirement in candidates:
    nlp = evidence[requirement["id"]]
    rows.append(
        {
            "id": requirement["id"],
            "title": requirement["title"],
            "description": requirement["description"],
            "visual_feature": requirement["visual_feature"],
            "prerequisite": requirement["prerequisite"],
            "feedback_mentions_90d": nlp["feedback_mentions_90d"],
            "affected_mau": requirement["affected_mau"],
            "support_tickets_90d": requirement["support_tickets_90d"],
            "mean_feedback_severity": nlp["mean_feedback_severity"],
            "engineering_days": requirement["engineering_days"],
            "dependency_count": requirement["dependency_count"],
            "premium_share": requirement["premium_share"],
            "churn_risk_share": requirement["churn_risk_share"],
            "accessibility_or_compliance": requirement["accessibility_or_compliance"],
            "incident_linked_count": requirement["incident_linked_count"],
            "prerequisite_ready": requirement["prerequisite_ready"],
        }
    )

benchmarks = benchmark_models(historical, DEFAULT_FEATURES)
kind = max(
    benchmarks,
    key=lambda name: benchmarks[name]["macro_f1_mean"],
)
model = train_model(historical, DEFAULT_FEATURES, kind)
probabilities = shipped_probability(model, rows, DEFAULT_FEATURES)

# local copy of the dependency-aware optimizer so validation is independent
def dependency_valid(selected_ids, requirement):
    prerequisite = requirement.get("prerequisite", "")
    ready = int(requirement.get("prerequisite_ready", 0))
    if not prerequisite:
        return ready == 1
    return ready == 1 or prerequisite in selected_ids

best_plan = None
values = {
    row["id"]: float(probability)
    for row, probability in zip(rows, probabilities)
}
for mask in range(1 << len(rows)):
    selected = [
        rows[index]
        for index in range(len(rows))
        if mask & (1 << index)
    ]
    days = sum(row["engineering_days"] for row in selected)
    if days > 75:
        continue
    selected_ids = {row["id"] for row in selected}
    if any(not dependency_valid(selected_ids, row) for row in selected):
        continue
    value = sum(values[row["id"]] for row in selected)
    candidate = (value, -days, selected)
    if best_plan is None or candidate[:2] > best_plan[:2]:
        best_plan = candidate

assert len(feedback) >= 900
assert len(historical) >= 300
assert len(candidates) == 12
assert audit["audited_count"] >= 200
assert audit["accuracy"] >= 0.70
assert benchmarks[kind]["macro_f1_mean"] >= 0.55
assert len(probabilities) == len(rows)
assert all(0.0 <= float(p) <= 1.0 for p in probabilities)
assert best_plan is not None

value, neg_days, selected = best_plan
days = -neg_days

print("LAB02_REFERENCE_VALIDATION")
print(f"feedback_rows={len(feedback)}")
print(f"historical_rows={len(historical)}")
print(f"audited_rows={audit['audited_count']}")
print(f"best_threshold={threshold:.2f}")
print(f"audited_accuracy={audit['accuracy']:.4f}")
for name, metric in benchmarks.items():
    print(
        f"{name}: macro_f1={metric['macro_f1_mean']:.4f}, "
        f"accuracy={metric['accuracy_mean']:.4f}"
    )
print(f"selected_model={kind}")
print("top_feature_importance=" + ", ".join(
    f"{item['feature']}:{item['importance']:.3f}"
    for item in feature_importance(model, DEFAULT_FEATURES)[:6]
))
print("ranking=" + ", ".join(
    f"{row['id']}:{values[row['id']]:.3f}"
    for row in sorted(rows, key=lambda item: -values[item["id"]])
))
print(f"release_days={days}")
print("release=" + ", ".join(row["id"] for row in selected))
