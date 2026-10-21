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

## Step 5 (25 min): Chat with a real LLM inside the lab

1. Click the **AI Assistant** tab in the laboratory. It connects to a real open-weight conversational model using the instructor's server-side Hugging Face Inference Providers account. Students do **not** need API tokens or software installations.
2. Open the links to **D1: Spotify Playlists** and **D2: Change Playlist Details** shown above the chat. The assistant has short verified course excerpts as context; it does **not** browse those web pages live.
3. Click **Audit FR-06**, read the model's explanation, and compare its claims with D1 and D2. Identify the invalid requirement.
4. Click **Propose a release**, then press **Send**. Ask the model for:
   - `ranked_ids`: all six feature IDs in priority order;
   - `infeasible_ids`: proposed features that violate the API;
   - `release_ids` and `total_engineer_days`: a feasible release within the budget;
   - `evidence` and `uncertainties`: sources and unsupported claims.
5. Inspect its answer. The model is expected to reason from provided documents and scenario data, but it can still make errors. Note whether it respected the Spotify rules, budget, and FR-05 dependency. **Do not treat its proposed rankings as the verified engineering decision.**
6. Record the model name, the date, the exact recommendation, at least one relevant citation, and one limitation in your report.

**If the AI Assistant says "Model not yet configured" or reports exhausted inference credits**, notify your lecturer. Continue the independent Python and reporting steps; the chatbot must not silently substitute hard-coded answers.

**Source note:** The model receives static course-prepared source excerpts plus fictional stakeholder ratings. It does not fetch the current Spotify documents itself. Verify any API claim by opening D1-D4.

## Step 6 (15 min): Audit the AI, not just its answer

From the **AI Assistant** response, copy *only the ordered IDs* into the list at the top of `main.py`:

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
