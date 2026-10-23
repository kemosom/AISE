"""
Lab 03: TikTok creator campaign and social commitments.

Complete:
  1. transition_offer() - enforce legal contract negotiation
  2. unique_events() - provide delivery safety
  3. commitment_state() - evaluate triggered obligations and deadlines
  4. agent_reactions() - implement event-driven agents

Run five agent experiments in addition to the supplied traces.

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


# AGENT EXPERIMENTS
# Change these settings, run Python, and compare the ledger in TikTok Case.
# All decisions are deterministic for reproducible verification.
AGENT_POLICIES = {
    "AGENT_NORMAL": {
        "escrow_delay": 1, "delivery_delay": 3,
        "compliance_passes": True, "payment_failures": 0,
        "duplicate_payout": False,
    },
    "AGENT_CREATOR_LATE": {
        "escrow_delay": 1, "delivery_delay": 8,
        "compliance_passes": True, "payment_failures": 0,
        "duplicate_payout": False,
    },
    "AGENT_PAYMENT_RETRY": {
        "escrow_delay": 1, "delivery_delay": 3,
        "compliance_passes": True, "payment_failures": 2,
        "duplicate_payout": True,
    },
    "AGENT_PAYMENT_OUTAGE": {
        "escrow_delay": 1, "delivery_delay": 3,
        "compliance_passes": True, "payment_failures": 5,
        "duplicate_payout": False,
    },
    "AGENT_REJECTED": {
        "escrow_delay": 1, "delivery_delay": 3,
        "compliance_passes": False, "payment_failures": 0,
        "duplicate_payout": False,
    },
}


def agent_reactions(message, policy):
    """TODO 4: Implement agent decisions that generate new messages.

    Return a list of event dictionaries; the event bus schedules them.
    Never directly change the ledger. It must come from the event log.

    Decision table (offsets are relative to the incoming event):
      offer_accepted     -> escrow_funded after escrow_delay
      escrow_funded      -> video_submitted after delivery_delay
      video_submitted    -> compliance_passed/failed after 1 day
      compliance_passed  -> brand_reviewed and brand_approved after 1 day
      compliance_failed  -> brand_reviewed after 1 day
      brand_approved     -> video_published after 1 day
      video_published    -> payout_requested after 1 day (attempt=1)
      payout_requested   -> if attempt <= payment_failures, retry at +1 day
                            else payout_settled on that day. Optionally
                            publish an identical repeated payout event.

    Every retry has a new ID. A retransmitted confirmation must reuse
    the same event ID and contents, so it will be deduplicated.

    Worked example: an approved video is published one day later.
    """
    day = message["day"]
    kind = message["type"]
    if kind == "brand_approved":
        return [event("post-live", day + 1, "video_published")]

    # Implement all the other cases above.
    return []


def simulate_agents(policy):
    """Provided infrastructure: deterministic asynchronous event dispatch.

    Agent responses enter a time-ordered event queue. Duplicate IDs are
    filtered before dispatch. Each independent agent decides what to emit.
    """
    import heapq
    queue = []
    sequence = 0

    def publish(message):
        nonlocal sequence
        sequence += 1
        heapq.heappush(queue, (message["day"], sequence, message))

    publish(event("invitation-1", 0, "offer_sent"))
    publish(event("acceptance-1", 0, "offer_accepted"))

    delivered = []
    while queue:
        day, _, message = heapq.heappop(queue)
        if day > 30:
            break
        candidate = unique_events(delivered + [message])
        if len(candidate) == len(delivered):
            continue
        delivered = candidate
        if len(delivered) > 80:
            raise RuntimeError("Possible infinite retry loop (>80 messages)")
        for response in agent_reactions(message, policy):
            if not isinstance(response, dict) or response["day"] < day:
                raise ValueError("An agent must publish a valid future event")
            publish(response)
    return delivered


def run_case(name):
    """Build a campaign event log, artifact, and commitment ledger."""
    case = SCENARIOS.get(name)
    if case is None:
        policy = AGENT_POLICIES[name]
        case = {"events": simulate_agents(policy), "as_of_day": 20}
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
    names = list(SCENARIOS) + list(AGENT_POLICIES)
    cases = {name: run_case(name) for name in names}
    for name, row in cases.items():
        violations = [c["id"] for c in row["ledger"] if c["status"] == "VIOLATED"]
        print(f"{name:21} | events={row['event_count']:2} | violated={violations}")
    print("CASE_STATE=" + json.dumps(cases, separators=(",", ":")))


if __name__ == "__main__":
    main()
