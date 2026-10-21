"""MAI5124 Lab 02 | Spotify playlist requirements prioritization case study.

Only the documented API rules are factual Spotify claims. Candidate feature
requirements, stakeholder ratings and development-day estimates are fictional
classroom scenario data for a hypothetical Spotify-compatible interface.

No Spotify credentials, API calls, third-party Python packages, or trained AI
model are required. Students use a live LLM separately and audit its output.
"""

# SOURCE DOCUMENTATION (accessed October 2026):
# D1 https://developer.spotify.com/documentation/web-api/concepts/playlists
# D2 https://developer.spotify.com/documentation/web-api/reference/change-playlist-details
# D3 https://developer.spotify.com/documentation/web-api/reference/add-items-to-playlist
# D4 https://developer.spotify.com/documentation/web-api/reference/remove-items-playlist

BUDGET_DAYS = 8

# Fictional stakeholder inputs, not Spotify survey results. Weights sum to 1.
STAKEHOLDER_WEIGHTS = {"listeners": 0.50, "product": 0.30, "engineering": 0.20}

# PASTE AN AI-PROPOSED ORDER HERE AFTER USING THE GROUNDED PROMPT.
# Example: ["FR-03", "FR-01", "FR-06", "FR-04", "FR-02", "FR-05"]
AI_SUGGESTED_ORDER = []

# Classroom scope: build a new interface to existing Spotify Web API features.
# These are NOT Spotify's internal development priorities or workload estimates.
REQUIREMENTS = [
    {"id": "FR-01", "title": "Edit playlist title and description", "days": 2,
     "ratings": {"listeners": 3, "product": 4, "engineering": 5},
     "requires": [], "public": False, "collaborative": False, "source": "D2"},
    {"id": "FR-02", "title": "Publish a playlist on its owner's profile", "days": 2,
     "ratings": {"listeners": 4, "product": 5, "engineering": 4},
     "requires": [], "public": True, "collaborative": False, "source": "D1"},
    {"id": "FR-03", "title": "Enable private collaborative playlist editing", "days": 4,
     "ratings": {"listeners": 5, "product": 4, "engineering": 3},
     "requires": [], "public": False, "collaborative": True, "source": "D1"},
    {"id": "FR-04", "title": "Add an item to an owned playlist", "days": 2,
     "ratings": {"listeners": 5, "product": 4, "engineering": 5},
     "requires": [], "public": False, "collaborative": False, "source": "D3"},
    {"id": "FR-05", "title": "Remove an item with snapshot awareness", "days": 4,
     "ratings": {"listeners": 3, "product": 3, "engineering": 4},
     "requires": ["FR-04"], "public": False, "collaborative": False, "source": "D1/D4"},
    {"id": "FR-06", "title": "Allow public AND collaborative status together", "days": 2,
     "ratings": {"listeners": 5, "product": 5, "engineering": 5},
     "requires": [], "public": True, "collaborative": True, "source": "D1"},
]


def playlist_policy_ok(public, collaborative):
    """STUDENT TASK 1: enforce Spotify's documented playlist-status rule.

    The current placeholder accepts invalid configurations. Replace it with
    one Boolean expression. Source D1 says both attributes cannot be true.
    """
    return True  # TODO: fix this rule, then run Verify Requirements


def requirement_utility(row):
    """STUDENT TASK 2: combine THREE stakeholder ratings with their weights.

    The current placeholder only considers listeners. Use the supplied
    STAKEHOLDER_WEIGHTS dictionary and row['ratings'] dictionary.
    """
    return float(row["ratings"]["listeners"])  # TODO: weighted utility


def feasible_release(selected, budget=BUDGET_DAYS):
    """Hard constraints apply irrespective of what an LLM recommends."""
    if sum(row["days"] for row in selected) > budget:
        return False
    ids = {row["id"] for row in selected}
    for row in selected:
        if not playlist_policy_ok(row["public"], row["collaborative"]):
            return False
        if not set(row["requires"]).issubset(ids):
            return False
    return True


def select_release(budget=BUDGET_DAYS):
    """Find the best feasible subset, enumerating 2^6 = 64 combinations."""
    best = []
    best_key = (-1.0, 0)
    for mask in range(1 << len(REQUIREMENTS)):
        selected = [row for i, row in enumerate(REQUIREMENTS) if mask & (1 << i)]
        if not feasible_release(selected, budget):
            continue
        total_utility = sum(requirement_utility(row) for row in selected)
        total_days = sum(row["days"] for row in selected)
        candidate_key = (round(total_utility, 9), -total_days)
        if candidate_key > best_key:
            best, best_key = selected, candidate_key
    return best


def audit_ai_order(order):
    """Check whether an LLM's ranked IDs contain unsupported feature requests.

    This checks IDs and a documented hard rule, not the factual correctness
    of every possible natural-language claim made by the LLM.
    """
    known = {row["id"]: row for row in REQUIREMENTS}
    issues = []
    seen = set()
    for feature_id in order:
        if feature_id in seen:
            issues.append(f"Repeated requirement: {feature_id}")
        seen.add(feature_id)
        if feature_id not in known:
            issues.append(f"Unknown requirement: {feature_id}")
        else:
            row = known[feature_id]
            if not playlist_policy_ok(row["public"], row["collaborative"]):
                issues.append(f"{feature_id} conflicts with D1: public and collaborative cannot both be true")
    return issues


def show_results():
    import json
    print("LAB 02 | REAL SPOTIFY API RULES + CLASSROOM RELEASE DECISION")
    print("Sources: D1 Spotify Playlists | D2 Change Details | D3 Add Items | D4 Remove Items")
    print("Fictional classroom inputs: stakeholder ratings, development days and budget.")
    print(f"Budget: {BUDGET_DAYS} engineer-days")
    print("\nPRIORITY RANKING")
    ranked = sorted(REQUIREMENTS, key=lambda r: -requirement_utility(r))
    for index, row in enumerate(ranked, 1):
        rule_ok = playlist_policy_ok(row["public"], row["collaborative"])
        print(f"{index}. {row['id']} | utility={requirement_utility(row):.2f} | "
              f"{row['days']} days | policy={'OK' if rule_ok else 'BLOCKED'} | {row['title']}")
    selected = select_release()
    chosen = [row["id"] for row in selected]
    print("\nRELEASE SELECTION")
    print("Included:", ", ".join(chosen) if chosen else "(none)")
    print("Effort:", sum(row["days"] for row in selected), "/", BUDGET_DAYS, "engineer-days")
    print("Total utility:", round(sum(requirement_utility(r) for r in selected), 2))
    print("All hard constraints met:", feasible_release(selected))
    print("\nAI REVIEW")
    if AI_SUGGESTED_ORDER:
        print("LLM ranking:", ", ".join(AI_SUGGESTED_ORDER))
        issues = audit_ai_order(AI_SUGGESTED_ORDER)
        print("Automated issues:", issues or "None found by these limited checks")
        print("Compare this ranking with the verified release; explain differences in your report.")
    else:
        print("No LLM proposal pasted yet. Use the prompt from the lab sheet.")
    print("\nStudent edits: fix playlist_policy_ok(), implement requirement_utility(),")
    print("then obtain an AI ranking, paste it, vary BUDGET_DAYS and interpret results.")

    # Machine-readable event consumed only by the local Spotify case interface.
    # All values reflect the actual student's current Python implementation.
    # The music UI is a simulator; this is not a live Spotify API response.
    payload = {
        "budget": BUDGET_DAYS,
        "days_used": sum(row["days"] for row in selected),
        "selected_ids": chosen,
        "policy_enforced": not playlist_policy_ok(True, True),
        "utility_example": requirement_utility(REQUIREMENTS[0]),
        "total_utility": round(sum(requirement_utility(r) for r in selected), 2),
    }
    print("__AISE_PLAYLIST__ " + json.dumps(payload, separators=(",", ":")))


if __name__ == "__main__":
    show_results()
