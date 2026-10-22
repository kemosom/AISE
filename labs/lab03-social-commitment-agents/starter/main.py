"""
Lab 03: TikTok creator campaign and social commitments.

Complete:
  1. transition_offer()
  2. commitment_state()
  3. unique_events()

The simulation uses fictional events and makes no external requests.
"""
import json

OFFER_EVENTS = {"offer_sent", "offer_accepted", "offer_withdrawn", "offer_declined"}

# Each rule uses a conditional commitment and a deadline after activation.
COMMITMENTS = [
    {"id": "K1", "debtor": "Brand", "creditor": "Creator",
     "when": ["offer_accepted"], "do": "escrow_funded", "within": 1},
    {"id": "K2", "debtor": "Creator", "creditor": "Brand",
     "when": ["offer_accepted", "escrow_funded"], "do": "video_submitted", "within": 5},
    {"id": "K3", "debtor": "Brand", "creditor": "Creator",
     "when": ["video_submitted"], "do": "brand_reviewed", "within": 2},
    {"id": "K4", "debtor": "Creator", "creditor": "Brand",
     "when": ["brand_approved"], "do": "video_published", "within": 2},
    {"id": "K5", "debtor": "Payment Service", "creditor": "Creator",
     "when": ["video_published"], "do": "payout_settled", "within": 3},
]


def event(event_id, day, kind):
    return {"id": event_id, "day": day, "type": kind}


SUCCESS = [
    event("e01", 0, "offer_sent"),
    event("e02", 0, "offer_accepted"),
    event("e03", 1, "escrow_funded"),
    event("e04", 4, "video_submitted"),
    event("e05", 5, "compliance_passed"),
    event("e06", 5, "brand_reviewed"),
    event("e07", 5, "brand_approved"),
    event("e08", 6, "video_published"),
    event("e09", 8, "payout_settled"),
]

SCENARIOS = {
    "SUCCESS": {"events": SUCCESS, "as_of_day": 10},
    "LATE_DELIVERY": {
        "events": SUCCESS[:3] + [
            event("l04", 8, "video_submitted"),
            event("l05", 9, "compliance_passed"),
            event("l06", 9, "brand_reviewed"),
            event("l07", 9, "brand_approved"),
            event("l08", 10, "video_published"),
            event("l09", 12, "payout_settled"),
        ],
        "as_of_day": 13,
    },
    "PAYOUT_MISSED": {"events": SUCCESS[:-1], "as_of_day": 11},
    "WITHDRAWN_OFFER": {
        "events": [event("w01", 0, "offer_sent"),
                   event("w02", 1, "offer_withdrawn")],
        "as_of_day": 12,
    },
    "COMPLIANCE_REJECTED": {
        "events": SUCCESS[:4] + [
            event("r05", 5, "compliance_failed"),
            event("r06", 5, "brand_reviewed"),
        ],
        "as_of_day": 12,
    },
    "DUPLICATE_PAYOUT": {
        "events": SUCCESS + [dict(SUCCESS[-1])],
        "as_of_day": 10,
    },
}


def transition_offer(state, event_type):
    """TODO 1: Implement the legal offer transitions.

    States are NONE, OFFERED, ACCEPTED, WITHDRAWN, and DECLINED.
    Reject invalid transitions by raising ValueError.
    """
    # STARTER BUG: accepts offers after they have been withdrawn.
    if event_type == "offer_sent":
        return "OFFERED"
    if event_type == "offer_accepted":
        return "ACCEPTED"
    if event_type == "offer_withdrawn":
        return "WITHDRAWN"
    if event_type == "offer_declined":
        return "DECLINED"
    return state


def unique_events(events):
    """TODO 2: Keep the first record for each event ID in input order.

    Ignore exact repeats. Raise ValueError if an event ID is reused with
    a different event type or day.
    """
    # STARTER BUG: counts a retransmitted payout twice.
    return list(events)


def commitment_state(rule, observed, as_of_day):
    """TODO 3: Evaluate a conditional commitment.

    observed maps event types to lists of occurrence days.
    Use the latest triggering day as the activation day.
    Due day is activation day + rule["within"].
    A valid outcome occurs at or after activation and at or before due.
    Return CONDITIONAL, ACTIVE, FULFILLED, or VIOLATED.
    """
    # STARTER BUG: ignores deadlines and event order.
    if observed.get(rule["do"]):
        return "FULFILLED"
    if all(observed.get(t) for t in rule["when"]):
        return "ACTIVE"
    return "CONDITIONAL"


def run_case(name):
    """Build a simulated campaign artifact and its commitment ledger."""
    case = SCENARIOS[name]
    events = unique_events(case["events"])
    ordered = sorted(events, key=lambda item: item["day"])
    offer_state = "NONE"
    observed = {}

    for item in ordered:
        if item["type"] in OFFER_EVENTS:
            offer_state = transition_offer(offer_state, item["type"])
        observed.setdefault(item["type"], []).append(item["day"])

    ledger = []
    for rule in COMMITMENTS:
        triggers = [observed[kind][0] for kind in rule["when"] if observed.get(kind)]
        activation = max(triggers) if len(triggers) == len(rule["when"]) else None
        ledger.append({
            **rule,
            "trigger_day": activation,
            "deadline_day": (activation + rule["within"]) if activation is not None else None,
            "status": commitment_state(rule, observed, case["as_of_day"]),
        })

    return {
        "name": name,
        "campaign": "NovaSound x MayaTech",
        "fee_rm": 1200,
        "as_of_day": case["as_of_day"],
        "offer_state": offer_state,
        "events": ordered,
        "event_count": len(events),
        "ledger": ledger,
    }


def main():
    cases = {name: run_case(name) for name in SCENARIOS}
    for name, row in cases.items():
        violations = [c["id"] for c in row["ledger"] if c["status"] == "VIOLATED"]
        print(f"{name:21} | events={row['event_count']:2} | violated={violations}")
    print("CASE_STATE=" + json.dumps(cases, separators=(",", ":")))


if __name__ == "__main__":
    main()
