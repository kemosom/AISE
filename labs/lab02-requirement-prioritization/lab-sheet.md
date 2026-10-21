# Lab 02 | Spotify Playlist Requirements Case Study (2 hours)

**Course:** MAI5124 AI in Software Engineering  
**Lecture 2 topic:** AI Techniques for Software Requirements Prioritization  
**Scenario:** Your team is designing a hypothetical playlist-management client using Spotify's documented Web API. The app in this lab is a **working local simulation**, not Spotify's real application.

**No installation or Spotify account is needed.** Python runs inside the course website. Use ChatGPT or Gemini in a separate browser tab for the AI activity.

## Step 1 (15 min): Explore the Spotify Case and real evidence

1. Click **Spotify Case** in the lab navigation. You will see a Spotify-style application.
2. On the right, click **D1**, **D2**, **D3**, and **D4**. Read the short source summaries and use **Open official documentation** for the full specifications.
3. D1: [Playlists](https://developer.spotify.com/documentation/web-api/concepts/playlists).
   D2: [Change Playlist Details](https://developer.spotify.com/documentation/web-api/reference/change-playlist-details).
   D3: [Add Playlist Items](https://developer.spotify.com/documentation/web-api/reference/add-items-to-playlist).
   D4: [Remove Playlist Items](https://developer.spotify.com/documentation/web-api/reference/remove-items-playlist).
4. Note two API constraints in your report, each with its official D1-D4 URL.

**Important:** The documentation is genuine. The six feature proposals, ratings, eight-day budget, and demo playlist are **fictional teaching inputs**. Do not attribute them to Spotify.

## Step 2 (10 min): Interact with the product and find a conflict

Inside **Spotify Case**:

1. Change the playlist title, click **Save**. Which requirement does this represent?
2. Click **Add track**, then remove a track. Identify the matching source for each action.
3. Try **Publish playlist** and **Collaborative**, then click **Try invalid FR-06**.
4. Write down the observed issue. According to D1, should one playlist be both public and collaborative?

The simulator deliberately lets you explore an unsafe baseline. It does not send requests to Spotify's servers. Playing a demo track uses locally generated synthetic sound.

## Step 3 (10 min): Run the deliberately flawed Python baseline

1. Click **Code** and open `main.py`.
2. Click **Run Python** without changing the starter code.
3. Return to **Spotify Case**. Look at **AI-assisted release comparison** and the policy message.
4. Record whether the release includes **FR-06**. Explain why a high utility value alone cannot make it valid.

## Step 4 (15 min): Fix the documented Spotify constraint

In `main.py`, find:

```python
def playlist_policy_ok(public, collaborative):
    return True  # TODO
```

Replace `return True` with a Boolean rule that rejects the case where **both parameters are True**.

| public | collaborative | Correct result |
|---|---|---|
| False | False | Allowed |
| True | False | Allowed |
| False | True | Allowed |
| True | True | Rejected |

Run Python, return to **Spotify Case**, then try **Try invalid FR-06** again. Your new Python policy should now prevent it.

**Distinction:** The app may support both FR-02 (publish) and FR-03 (collaboration). What Spotify disallows is having *both statuses on the same playlist*.

## Step 5 (15 min): Implement stakeholder utility

In `main.py`, replace the listener-only placeholder in `requirement_utility(row)` with:

```text
utility = 0.50 * listener_rating
        + 0.30 * product_rating
        + 0.20 * engineering_rating
```

These weights and ratings are classroom assumptions. For **FR-01**, the expected utility is **3.70**.

Run Python and return to **Spotify Case**. Observe the feasible release selected under **8 engineer-days**, then note the selected IDs, total effort, and utility.

## Step 6 (20 min): Use ChatGPT or Gemini to challenge the decision

1. Go to **Spotify Case → External AI review**.
2. Click **Copy grounded case prompt**.
3. Open **ChatGPT** or **Gemini** using the buttons in the panel, and paste the prompt.
4. Ask the AI to rank the requirements and suggest a feasible release, including source references.
5. Compare the model's recommendation with D1-D4. Do not accept unsourced claims.
6. Record the model, its proposed requirement IDs, and one error, limitation or uncertainty.

The model may not be able to open URLs. If it cannot read the official sources, check them yourself and give the model the short excerpts. Never claim that the model retrieved sources when it did not.

## Step 7 (15 min): Verify AI ranking and engineering constraints

1. Return to **Code**, and enter the IDs suggested by the model:

```python
AI_SUGGESTED_ORDER = ["FR-03", "FR-04", "FR-02", "FR-01", "FR-05", "FR-06"]
```

This is an **illustrative order**, not the correct AI answer.

2. Click **Run Python**. Read the **AI REVIEW** section of the output.
3. Temporarily change `BUDGET_DAYS = 6`, rerun, and observe which features are selected. Check **Spotify Case**.
4. Restore `BUDGET_DAYS = 8`.
5. Click **Verify Requirements** and resolve any failed checks.

The Python tests, not the LLM, must enforce documented rules, effort limits, and dependencies.

## Step 8 (20 min): Prepare and submit your report

Use the **Report** tab. Include:

- Two real Spotify API constraints and their D1-D4 URLs.
- The actions you tested in the Spotify-style simulator and the FR-06 failure.
- Your corrected Boolean policy and weighted utility calculation.
- The 8-day release selection and the 6-day comparison.
- ChatGPT/Gemini model used, its recommendation, and your critical assessment.
- Evidence from the verification tests and a conclusion stating which features you recommend.

You can use the integrated Word export. **Submit only after completing the report.** Instructor preview uses a dry-run submission and does not consume a student ID.

**Learning outcome:** Analyze real API requirements, inspect software behavior, use an LLM for a recommendation, and independently verify a feasible release.
