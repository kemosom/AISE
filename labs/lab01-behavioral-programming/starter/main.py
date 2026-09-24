"""
MAI5124 AI in Software Engineering
Lab 01: Safe AI-Assisted Software Release with Behavioral Programming

STUDENT TASK
------------
1. Run this file once with ENABLE_GUARDRAIL = False.
2. Observe the AI-only release decision.
3. Implement release_guardrail(change, prediction).
4. Set ENABLE_GUARDRAIL = True.
5. Run again, compare the decision, and verify requirements.

The AI model and Behavioral Programming coordinator are already provided.
"""

from helpers import BProgram
from risk_model import predict_risk

DEPLOY = "DEPLOY"
HUMAN_REVIEW = "HUMAN_REVIEW"
BLOCK_RELEASE = "BLOCK_RELEASE"

MIN_AI_CONFIDENCE = 0.70
MIN_TEST_COVERAGE = 70

# Start with the AI-only baseline.
ENABLE_GUARDRAIL = False

# Change this after completing the default case.
ACTIVE_CASE = "PR-1042"


PULL_REQUESTS = {
    "PR-1001": {
        "title": "Update customer profile validation",
        "lines_changed": 40,
        "files_changed": 3,
        "test_coverage": 92,
        "static_warnings": 1,
        "prior_defect_rate": 0.06,
        "failed_tests": 0,
        "critical_security_findings": 0,
    },
    "PR-1042": {
        "title": "Refactor authentication token refresh",
        "lines_changed": 65,
        "files_changed": 4,
        "test_coverage": 89,
        "static_warnings": 1,
        "prior_defect_rate": 0.08,
        "failed_tests": 0,
        "critical_security_findings": 1,
    },
    "PR-1057": {
        "title": "Modify invoice calculation service",
        "lines_changed": 55,
        "files_changed": 3,
        "test_coverage": 93,
        "static_warnings": 0,
        "prior_defect_rate": 0.07,
        "failed_tests": 2,
        "critical_security_findings": 0,
    },
    "PR-1088": {
        "title": "Large checkout workflow redesign",
        "lines_changed": 330,
        "files_changed": 16,
        "test_coverage": 67,
        "static_warnings": 8,
        "prior_defect_rate": 0.30,
        "failed_tests": 0,
        "critical_security_findings": 0,
    },
    "PR-1093": {
        "title": "Search-service refactor near the model boundary",
        "lines_changed": 100,
        "files_changed": 5,
        "test_coverage": 75,
        "static_warnings": 2,
        "prior_defect_rate": 0.15,
        "failed_tests": 0,
        "critical_security_findings": 0,
    },
}


def ai_recommendation(change, prediction):
    """
    Supplied AI decision behavior.

    LOW predicted risk requests DEPLOY.
    HIGH predicted risk requests HUMAN_REVIEW.
    """
    if prediction["risk_label"] == "LOW":
        yield {
            "request": [DEPLOY],
            "waitFor": [],
            "block": [],
        }
    else:
        yield {
            "request": [HUMAN_REVIEW],
            "waitFor": [],
            "block": [DEPLOY],
        }


def release_guardrail(change, prediction):
    """
    TODO: Implement the independent release-policy b-thread.

    Policy A: HARD BLOCK
    If failed_tests > 0 OR critical_security_findings > 0:
        - block DEPLOY
        - request BLOCK_RELEASE

    Policy B: HUMAN REVIEW
    Otherwise, if prediction confidence < MIN_AI_CONFIDENCE
    OR test_coverage < MIN_TEST_COVERAGE:
        - block DEPLOY
        - request HUMAN_REVIEW

    Policy C: ALLOW AI DECISION
    Otherwise:
        - request nothing
        - wait for DEPLOY or HUMAN_REVIEW

    Do not modify predict_risk() to implement these policies.
    """

    # TODO: replace this placeholder with your b-thread logic.
    # This default placeholder simply observes the AI decision so the
    # starter remains executable before you implement the guardrail.
    yield {
        "request": [],
        "waitFor": [DEPLOY, HUMAN_REVIEW, BLOCK_RELEASE],
        "block": [],
    }


def build_release_program(change, prediction, enable_guardrail=None):
    """Build the AI-assisted release-decision program."""
    if enable_guardrail is None:
        enable_guardrail = ENABLE_GUARDRAIL

    bp = BProgram()

    bp.add_bthread(lambda: ai_recommendation(change, prediction))

    if enable_guardrail:
        bp.add_bthread(lambda: release_guardrail(change, prediction))

    return bp


def evaluate_case(case_id, enable_guardrail=None, verbose=True):
    """Run one pull-request case and return its prediction and final decision."""
    change = PULL_REQUESTS[case_id]
    prediction = predict_risk(change)

    bp = build_release_program(
        change,
        prediction,
        enable_guardrail=enable_guardrail,
    )
    trace = bp.run(max_steps=5)
    decision = trace[0] if trace else "NO_DECISION"

    if verbose:
        print("=" * 68)
        print(f"{case_id}: {change['title']}")
        print("=" * 68)
        print(
            "AI prediction: "
            f"{prediction['risk_label']} risk "
            f"(p={prediction['risk_probability']:.3f}, "
            f"confidence={prediction['confidence']:.3f})"
        )
        print(
            "Engineering evidence: "
            f"coverage={change['test_coverage']}%, "
            f"failed_tests={change['failed_tests']}, "
            f"critical_security_findings="
            f"{change['critical_security_findings']}"
        )
        print(
            "Guardrail: "
            f"{'ENABLED' if (ENABLE_GUARDRAIL if enable_guardrail is None else enable_guardrail) else 'DISABLED'}"
        )
        print(f"Final workflow decision: {decision}")

        if (
            decision == DEPLOY
            and (
                change["failed_tests"] > 0
                or change["critical_security_findings"] > 0
            )
        ):
            print(
                "WARNING: AI-only recommendation conflicts with "
                "current engineering evidence."
            )

    return {
        "case_id": case_id,
        "change": change,
        "prediction": prediction,
        "trace": trace,
        "decision": decision,
    }


def main():
    result = evaluate_case(ACTIVE_CASE)

    print("\nStudent task:")
    if not ENABLE_GUARDRAIL:
        print(
            "1. Inspect the AI-only decision above.\n"
            "2. Implement release_guardrail().\n"
            "3. Set ENABLE_GUARDRAIL = True.\n"
            "4. Run again and compare the final decision."
        )
    else:
        print(
            "Explore the remaining PULL_REQUESTS and run "
            "Verify Requirements."
        )

    return result


if __name__ == "__main__":
    main()
