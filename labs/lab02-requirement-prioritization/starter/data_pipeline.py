"""
Lab 02 data and NLP pipeline.

This module performs genuine TF-IDF vectorization and cosine-similarity matching
with scikit-learn. It maps unstructured customer feedback onto candidate
software requirements and aggregates the matched evidence.

Datasets are synthetic teaching data, not Spotify internal data.
"""

import csv
from collections import Counter, defaultdict

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _read_csv(path):
    with open(path, "r", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def _to_number(row, field, kind=float):
    value = row.get(field, "")
    if value in ("", None):
        return 0 if kind is int else 0.0
    return kind(value)


def load_candidates(path="candidate_backlog.csv"):
    rows = _read_csv(path)
    numeric_int = {
        "affected_mau",
        "support_tickets_90d",
        "engineering_days",
        "dependency_count",
        "accessibility_or_compliance",
        "incident_linked_count",
        "prerequisite_ready",
    }
    numeric_float = {"premium_share", "churn_risk_share"}

    parsed = []
    for row in rows:
        item = dict(row)
        for field in numeric_int:
            item[field] = _to_number(row, field, int)
        for field in numeric_float:
            item[field] = _to_number(row, field, float)
        parsed.append(item)
    return parsed


def load_feedback(path="customer_feedback.csv"):
    rows = _read_csv(path)
    for row in rows:
        row["severity"] = _to_number(row, "severity", int)
    return rows


def load_historical(path="historical_releases.csv"):
    rows = _read_csv(path)
    int_fields = {
        "feedback_mentions_90d",
        "affected_mau",
        "support_tickets_90d",
        "engineering_days",
        "dependency_count",
        "accessibility_or_compliance",
        "incident_linked_count",
        "prerequisite_ready",
    }
    float_fields = {
        "mean_feedback_severity",
        "premium_share",
        "churn_risk_share",
    }

    parsed = []
    for row in rows:
        item = dict(row)
        for field in int_fields:
            item[field] = _to_number(row, field, int)
        for field in float_fields:
            item[field] = _to_number(row, field, float)
        parsed.append(item)
    return parsed


def requirement_document(requirement):
    return f"{requirement['title']}. {requirement['description']}"


class FeedbackRequirementMatcher:
    """
    TF-IDF + cosine-similarity matcher.

    The vectorizer is fitted jointly on requirement descriptions and customer
    feedback so vocabulary and inverse-document-frequency statistics come from
    the actual lab corpus.
    """

    def __init__(self, candidates, feedback):
        self.candidates = candidates
        self.feedback = feedback

        requirement_docs = [requirement_document(row) for row in candidates]
        feedback_docs = [row["text"] for row in feedback]
        corpus = requirement_docs + feedback_docs

        self.vectorizer = TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2),
            min_df=2,
            sublinear_tf=True,
            max_features=5000,
        )
        matrix = self.vectorizer.fit_transform(corpus)
        requirement_count = len(requirement_docs)

        self.requirement_matrix = matrix[:requirement_count]
        self.feedback_matrix = matrix[requirement_count:]
        self.similarity_matrix = cosine_similarity(
            self.feedback_matrix,
            self.requirement_matrix,
        )

    def match_single(self, text):
        vector = self.vectorizer.transform([text])
        similarities = cosine_similarity(
            vector,
            self.requirement_matrix,
        )[0]
        order = np.argsort(similarities)[::-1]
        top = []

        for index in order[:5]:
            requirement = self.candidates[int(index)]
            top.append(
                {
                    "id": requirement["id"],
                    "title": requirement["title"],
                    "similarity": float(similarities[index]),
                }
            )

        return top

    def match_all(self, threshold):
        matches = []

        for feedback_index, row in enumerate(self.feedback):
            similarities = self.similarity_matrix[feedback_index]
            best_index = int(np.argmax(similarities))
            best_similarity = float(similarities[best_index])
            best_requirement = self.candidates[best_index]

            predicted_id = (
                best_requirement["id"]
                if best_similarity >= threshold
                else "OTHER"
            )

            matches.append(
                {
                    **row,
                    "predicted_requirement_id": predicted_id,
                    "best_requirement_id": best_requirement["id"],
                    "best_requirement_title": best_requirement["title"],
                    "similarity": best_similarity,
                }
            )

        return matches


def evaluate_audited_matches(matches):
    audited = [
        row
        for row in matches
        if row.get("audited_requirement_id")
    ]

    if not audited:
        return {
            "audited_count": 0,
            "accuracy": 0.0,
            "correct": 0,
            "incorrect": 0,
        }

    correct = sum(
        row["predicted_requirement_id"] == row["audited_requirement_id"]
        for row in audited
    )

    return {
        "audited_count": len(audited),
        "accuracy": correct / len(audited),
        "correct": correct,
        "incorrect": len(audited) - correct,
    }


def threshold_sweep(matcher, thresholds=None):
    if thresholds is None:
        thresholds = [
            0.10,
            0.14,
            0.18,
            0.22,
            0.26,
            0.30,
            0.34,
            0.38,
            0.42,
        ]

    rows = []
    for threshold in thresholds:
        matches = matcher.match_all(threshold)
        metrics = evaluate_audited_matches(matches)
        assigned = sum(
            row["predicted_requirement_id"] != "OTHER"
            for row in matches
        )
        rows.append(
            {
                "threshold": threshold,
                "accuracy": metrics["accuracy"],
                "audited_count": metrics["audited_count"],
                "assigned_count": assigned,
                "coverage": assigned / len(matches),
            }
        )

    return rows


def aggregate_feedback(matches, candidates):
    """
    Aggregate unstructured feedback after NLP matching.

    These values become candidate features that can be compared with the same
    evidence fields in historical release decisions.
    """
    bucket = defaultdict(list)

    for row in matches:
        requirement_id = row["predicted_requirement_id"]
        if requirement_id != "OTHER":
            bucket[requirement_id].append(row)

    result = {}
    for candidate in candidates:
        requirement_id = candidate["id"]
        rows = bucket.get(requirement_id, [])

        if rows:
            mean_severity = sum(row["severity"] for row in rows) / len(rows)
            mean_similarity = sum(row["similarity"] for row in rows) / len(rows)
            channel_count = len({row["channel"] for row in rows})
            region_count = len({row["region"] for row in rows})
            plan_count = len({row["plan"] for row in rows})
        else:
            mean_severity = 0.0
            mean_similarity = 0.0
            channel_count = 0
            region_count = 0
            plan_count = 0

        result[requirement_id] = {
            "feedback_mentions_90d": len(rows),
            "mean_feedback_severity": mean_severity,
            "mean_match_similarity": mean_similarity,
            "channel_count": channel_count,
            "region_count": region_count,
            "plan_count": plan_count,
        }

    return result


def top_feedback_examples(matches, requirement_id, limit=4):
    rows = [
        row
        for row in matches
        if row["predicted_requirement_id"] == requirement_id
    ]
    rows.sort(
        key=lambda row: (
            -row["similarity"],
            -row["severity"],
            row["feedback_id"],
        )
    )

    return [
        {
            "feedback_id": row["feedback_id"],
            "text": row["text"],
            "severity": row["severity"],
            "similarity": row["similarity"],
            "channel": row["channel"],
            "region": row["region"],
        }
        for row in rows[:limit]
    ]


def feedback_distribution(matches):
    counts = Counter(
        row["predicted_requirement_id"]
        for row in matches
    )
    return dict(counts)
