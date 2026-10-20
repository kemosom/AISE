# Laboratory Sheet | 2 hours

**Course:** MAI5124 AI in Software Engineering  
**Topic:** AI Techniques for Software Requirements Prioritization  
**Real-world evidence:** Spotify's public developer documentation  
**Scenario:** A fictional team is building a Spotify-compatible playlist-management interface.

## Step 1 (15 min): Study the real source

Open [D1: Spotify Playlists](https://developer.spotify.com/documentation/web-api/concepts/playlists) and [D2: Change Playlist Details](https://developer.spotify.com/documentation/web-api/reference/change-playlist-details).

Answer in your report:

1. Does setting public=true mean the playlist is access-controlled? Cite D1.
2. Can a playlist be public and collaborative at the same time? Cite D1.
3. Who must own the playlist to change its details? Cite D2.

**Important:** Spotify's API documentation is the authoritative source, **not an internal Spotify SRS**. The feature ratings below are fictional classroom assumptions.

## Step 2 (10 min): Run and investigate the flawed baseline

Click **Code**, open **main.py**, and click **Run Python** without making changes.

The intentionally incomplete starter uses only listener preferences and permits every playlist state. Notice that requirement **FR-06**, a public-and-collaborative playlist, can enter the selected release.

Write down why that is a software engineering defect.

## Step 3 (15 min): Enforce the official playlist rule

Locate:

```python
def playlist_policy_ok(public, collaborative):
    return True  # TODO
```

Replace the placeholder with a Boolean expression that implements the D1 rule. Confirm that the release excludes **FR-06**.

Check these cases:

| public | collaborative | Valid? |
|---|---|---|
| False | False | Yes |
| True | False | Yes |
| False | True | Yes |
| True | True | **No** |

**Do not reject FR-02 and FR-03 merely because the app supports both features**. They are mutually exclusive *states of one playlist*, not mutually exclusive app features.

## Step 4 (15 min): Implement Lecture 2 utility analysis

The supplied stakeholder evaluations are scenario assumptions.

Edit `requirement_utility(row)` so that it computes:

```text
utility = 0.50 * listeners
        + 0.30 * product
        + 0.20 * engineering
```

Do not use the provided listener-only placeholder. For FR-01, the correct result is **3.70**.

Run Python. Record the ranked requirements and the feasible release under the **8 engineer-day** budget.

## Step 5 (25 min): Obtain a real, evidence-grounded AI recommendation

Open a free-access general-purpose LLM that you can use in your browser (e.g., ChatGPT). No API key is required for this exercise.

Open the official documentation links **D1** and **D2** first, then copy the prompt below into your AI assistant.

### Prompt to copy into the AI assistant

```text
Act as a software requirements engineer. We are building a hypothetical
client for Spotify's playlist Web API. Our authoritative source is:
D1 https://developer.spotify.com/documentation/web-api/concepts/playlists
D2 https://developer.spotify.com/documentation/web-api/reference/change-playlist-details
D3 https://developer.spotify.com/documentation/web-api/reference/add-items-to-playlist
D4 https://developer.spotify.com/documentation/web-api/reference/remove-items-playlist

Real documented constraints to verify:
- Spotify playlist public=true and collaborative=true cannot coexist.
- Public visibility on a Spotify profile is not the same as access control.
- Playlist updates require appropriate ownership/authorization.
- Playlist item changes use version/snapshot mechanisms.

These candidates and their estimates are fictional teaching assumptions:
FR-01 edit playlist title/description, 2 days; stakeholder ratings L=3, P=4, E=5.
FR-02 publish playlist to owner's profile, 2 days; L=4, P=5, E=4.
FR-03 private collaborative playlist, 4 days; L=5, P=4, E=3.
FR-04 add playlist item, 2 days; L=5, P=4, E=5.
FR-05 remove playlist item with snapshot awareness, 4 days; L=3, P=3, E=4;
      this scenario requires FR-04 to be implemented with or before it.
FR-06 enable public AND collaborative on the same playlist, 2 days; L=5, P=5, E=5.

Our total budget is 8 engineer-days. The stakeholder weights are
L=0.50, P=0.30, E=0.20. Do not invent Spotify usage data or developer costs.

Return a single JSON object with exactly these keys:
"ranked_ids": all six requirement IDs in your preferred order;
"infeasible_ids": IDs that violate API requirements, with reasons;
"release_ids": your feasible recommended subset of IDs;
"total_engineer_days": total effort for the selected subset;
"evidence": short API claims with source IDs D1-D4 and their URLs;
"uncertainties": claims that cannot be supported from those documents;
"recommended_reviewer": who should validate the most important uncertainty.
Use JSON arrays and objects, not Markdown prose. Explain key decisions inside
the JSON values. If you cannot inspect a source, explicitly mark it unverified.
Do not assume that being ranked highly makes an invalid requirement shippable.
```

**No response is guaranteed to be correct.** If your model cannot access URLs, provide it with the short verified excerpts from the lab theory. Do not claim it independently retrieved the pages.

Record the exact AI model/tool used, the date, and its suggested subset in your report. Preserve its explanation.

## Step 6 (15 min): Audit the AI, not just its answer

From the model's ranking, copy *only the ordered IDs* into the list at the top of `main.py`:

```python
AI_SUGGESTED_ORDER = ["FR-03", "FR-04", "FR-02", "FR-01", "FR-05", "FR-06"]
```

(The order above is an **illustration**, not a supplied AI answer.) Run Python.

The program can flag unknown IDs, repeated IDs, and the documented state conflict. It cannot verify every natural-language claim in the model's explanation. You must inspect those against D1-D4 yourself.

Explain whether the LLM suggested FR-06 or otherwise overlooked a rule or dependency.

## Step 7 (15 min): Test one what-if scenario

Temporarily set `BUDGET_DAYS = 6`, rerun, and record whether the chosen release changes.

Restore `BUDGET_DAYS = 8` before testing. Click **Verify Requirements**. Fix any failed checks.

## Step 8 (10 min): Submit the case-study report

Use the **Report** tab. Include:

- Two documented Spotify rules, each with a source link.
- Before/after results of repairing the policy rule and utility function.
- Stakeholder ranking versus AI-proposed ranking, with at least one reason for disagreement.
- The selected release, total utility and engineering days.
- Evidence that FR-06 is prohibited, plus a budget/dependency check.
- An explanation of one uncertainty and the stakeholder who should validate it.
- Final decision: what should be implemented first, and why?

Do not report fictional estimates as Spotify measurements.

**Deliverable:** A short evidence-based requirements-prioritization case study, working Python guardrails, passed tests, and the integrated report.
