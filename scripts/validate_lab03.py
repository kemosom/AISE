"""Smoke tests for the unreleased TikTok Lab 03 teaching package.

The starter intentionally fails public mastery tests. This script checks
that the editor can run it, the eleven case payloads are structurally sound,
and the student release guard remains closed.
"""
from pathlib import Path
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / "labs" / "lab03-social-commitment-agents"
MANIFEST = json.loads((LAB / "manifest.json").read_text(encoding="utf-8"))
TESTS = json.loads((LAB / "tests" / "public-tests.json").read_text(encoding="utf-8"))
REPORT = json.loads((LAB / "report-template.json").read_text(encoding="utf-8"))

assert MANIFEST["labNumber"] == 3
assert MANIFEST["id"] == "lab03-social-commitment-agents"
assert len(MANIFEST["tasks"]) == 8
assert len(REPORT["sections"]) == 5
assert len(TESTS) == 7
assert sum(int(test["weight"]) for test in TESTS) == 100
assert all(test["testCode"].strip() for test in TESTS)

result = subprocess.run(
    [sys.executable, str(LAB / "starter" / "main.py")],
    capture_output=True, text=True, check=True,
)
lines = [line for line in result.stdout.splitlines() if line.startswith("CASE_STATE=")]
assert len(lines) == 1, "Python marker must occur once."
cases = json.loads(lines[0].split("=", 1)[1])
assert set(cases) == {
    "SUCCESS", "LATE_DELIVERY", "PAYOUT_MISSED",
    "WITHDRAWN_OFFER", "COMPLIANCE_REJECTED", "DUPLICATE_PAYOUT",
    "AGENT_NORMAL", "AGENT_CREATOR_LATE", "AGENT_PAYMENT_RETRY",
    "AGENT_PAYMENT_OUTAGE", "AGENT_REJECTED",
}
for key, item in cases.items():
    assert len(item["ledger"]) == 5, key
    assert {row["id"] for row in item["ledger"]} == {"K1", "K2", "K3", "K4", "K5"}
    assert all({"debtor", "creditor", "when", "do", "within", "status"} <= set(row) for row in item["ledger"])
    assert item["as_of_day"] >= max(event["day"] for event in item["events"])
assert len(cases["SUCCESS"]["events"]) == 9
assert cases["WITHDRAWN_OFFER"]["offer_state"] == "WITHDRAWN"
assert cases["AGENT_NORMAL"]["offer_state"] == "ACCEPTED"
assert cases["AGENT_NORMAL"]["event_count"] == 2
assert all(item["id"].startswith("K") for item in cases["AGENT_PAYMENT_RETRY"]["ledger"])

# Students should not get a completed answer in their starter.
assert cases["PAYOUT_MISSED"]["ledger"][-1]["status"] != "VIOLATED"
assert cases["DUPLICATE_PAYOUT"]["event_count"] > cases["SUCCESS"]["event_count"]

app = (ROOT / "src" / "App.tsx").read_text(encoding="utf-8")
assert "manifest.labNumber <= 2" in app, "Lab 03 was accidentally released."
assert "instructorSelectedLabId === 'lab03-social-commitment-agents'" in app
print("Lab 03 smoke checks passed. Student navigation remains locked.")
