from __future__ import annotations

import importlib
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
STARTER = ROOT / "labs" / "lab01-behavioral-programming" / "starter"

sys.path.insert(0, str(STARTER))

main = importlib.import_module("main")
risk_model = importlib.import_module("risk_model")
helpers = importlib.import_module("helpers")


def check(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def validate_starter_execution() -> None:
    # The shipped starter must run without a student implementation.
    result = main.evaluate_case("PR-1042", enable_guardrail=False, verbose=False)
    check(result["decision"] == main.DEPLOY, "Starter baseline did not produce DEPLOY.")
    check(
        result["prediction"]["risk_label"] == "LOW",
        "PR-1042 should expose the intended low-risk AI recommendation.",
    )
    check(
        result["change"]["critical_security_findings"] == 1,
        "PR-1042 must retain the current security finding used by the exercise.",
    )


def validate_model_contract() -> None:
    for case_id, change in main.PULL_REQUESTS.items():
        prediction = risk_model.predict_risk(change)
        check(prediction["risk_label"] in {"LOW", "HIGH"}, f"{case_id}: bad label")
        check(
            0.0 <= prediction["risk_probability"] <= 1.0,
            f"{case_id}: bad probability",
        )
        check(
            0.5 <= prediction["confidence"] <= 1.0,
            f"{case_id}: bad confidence",
        )


def validate_behavioral_engine() -> None:
    bp = helpers.BProgram()

    def requester():
        yield {"request": ["DEPLOY"], "waitFor": [], "block": []}

    def blocker():
        yield {
            "request": ["BLOCK_RELEASE"],
            "waitFor": [],
            "block": ["DEPLOY"],
        }

    bp.add_bthread(requester)
    bp.add_bthread(blocker)

    trace = bp.run(max_steps=3)
    check(trace == ["BLOCK_RELEASE"], f"Unexpected RWB trace: {trace}")


def validate_boundary_case() -> None:
    prediction = risk_model.predict_risk(main.PULL_REQUESTS["PR-1093"])
    check(prediction["risk_label"] == "LOW", "PR-1093 should be LOW risk.")
    check(
        prediction["confidence"] < main.MIN_AI_CONFIDENCE,
        "PR-1093 no longer exercises the low-confidence review case.",
    )


if __name__ == "__main__":
    validate_starter_execution()
    validate_model_contract()
    validate_behavioral_engine()
    validate_boundary_case()
    print("Lab 01 smoke validation passed.")
