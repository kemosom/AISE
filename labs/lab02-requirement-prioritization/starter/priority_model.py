"""
Lightweight supervised NLP model for MAI5124 Lab 02.

The implementation is intentionally dependency-free so it runs reliably in the
browser. It is a Multinomial Naive Bayes classifier trained on fictional
historical requirement statements.
"""

import math
import re
from collections import Counter

from requirements_data import HISTORICAL_REQUIREMENTS, VALIDATION_REQUIREMENTS


CLASSES = ("HIGH", "MEDIUM", "LOW")
TOKEN_PATTERN = re.compile(r"[a-z0-9]+")


def tokenize(text):
    return TOKEN_PATTERN.findall(text.lower())


class RequirementPriorityModel:
    def __init__(self, rows):
        self.class_counts = Counter()
        self.word_counts = {label: Counter() for label in CLASSES}
        self.total_words = Counter()
        self.vocabulary = set()

        for row in rows:
            label = row["label"]
            tokens = tokenize(row["text"])
            self.class_counts[label] += 1
            self.word_counts[label].update(tokens)
            self.total_words[label] += len(tokens)
            self.vocabulary.update(tokens)

        self.total_examples = sum(self.class_counts.values())

    def _log_probability(self, text, label):
        tokens = tokenize(text)
        class_prior = (
            self.class_counts[label] + 1
        ) / (self.total_examples + len(CLASSES))

        log_probability = math.log(class_prior)
        denominator = self.total_words[label] + len(self.vocabulary)

        for token in tokens:
            token_probability = (
                self.word_counts[label][token] + 1
            ) / denominator
            log_probability += math.log(token_probability)

        return log_probability

    def _evidence_tokens(self, text):
        evidence = []
        vocab_size = len(self.vocabulary)

        for token in set(tokenize(text)):
            high_probability = (
                self.word_counts["HIGH"][token] + 1
            ) / (self.total_words["HIGH"] + vocab_size)

            medium_probability = (
                self.word_counts["MEDIUM"][token] + 1
            ) / (self.total_words["MEDIUM"] + vocab_size)

            low_probability = (
                self.word_counts["LOW"][token] + 1
            ) / (self.total_words["LOW"] + vocab_size)

            competing_probability = max(medium_probability, low_probability)
            score = math.log(high_probability / competing_probability)
            evidence.append((score, token))

        evidence.sort(reverse=True)
        return [token for score, token in evidence if score > 0][:4]

    def predict(self, text):
        log_scores = {
            label: self._log_probability(text, label)
            for label in CLASSES
        }

        max_log = max(log_scores.values())
        exp_scores = {
            label: math.exp(score - max_log)
            for label, score in log_scores.items()
        }
        total = sum(exp_scores.values())
        probabilities = {
            label: exp_scores[label] / total
            for label in CLASSES
        }

        label = max(probabilities, key=probabilities.get)
        confidence = probabilities[label]

        return {
            "label": label,
            "p_high": probabilities["HIGH"],
            "p_medium": probabilities["MEDIUM"],
            "p_low": probabilities["LOW"],
            "confidence": confidence,
            "evidence_tokens": self._evidence_tokens(text),
        }


MODEL = RequirementPriorityModel(HISTORICAL_REQUIREMENTS)


def predict_priority(requirement):
    text = f"{requirement['title']} {requirement['description']}"
    return MODEL.predict(text)


def evaluate_model():
    labels = list(CLASSES)
    confusion = {
        actual: {predicted: 0 for predicted in labels}
        for actual in labels
    }

    correct = 0
    predictions = []

    for row in VALIDATION_REQUIREMENTS:
        prediction = MODEL.predict(row["text"])
        actual = row["label"]
        predicted = prediction["label"]
        confusion[actual][predicted] += 1
        correct += int(actual == predicted)
        predictions.append((actual, predicted))

    f1_scores = []

    for label in labels:
        tp = confusion[label][label]
        fp = sum(
            confusion[other][label]
            for other in labels
            if other != label
        )
        fn = sum(
            confusion[label][other]
            for other in labels
            if other != label
        )

        precision = tp / (tp + fp) if (tp + fp) else 0.0
        recall = tp / (tp + fn) if (tp + fn) else 0.0

        if precision + recall:
            f1 = 2 * precision * recall / (precision + recall)
        else:
            f1 = 0.0

        f1_scores.append(f1)

    return {
        "accuracy": correct / len(VALIDATION_REQUIREMENTS),
        "macro_f1": sum(f1_scores) / len(f1_scores),
        "confusion": confusion,
        "predictions": predictions,
    }
