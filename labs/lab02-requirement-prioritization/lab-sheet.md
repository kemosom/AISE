# Lab 02 | Spotify Playlist Requirements Prioritization

**Duration:** 2 hours  
**Task:** Explore a playlist application, fix two Python functions, and decide which features should be included in the next release.

**D1–D4** refer to Spotify documents. **FR-01–FR-06** refer to the six proposed software features. You can find both in the **Spotify Case** tab.

## Step 1 (15 min): Read the Spotify Requirements

1. Open **Spotify Case**.
2. Find **Official API Evidence** and select **D1, D2, D3, and D4**. Use **Open official documentation** to read the Spotify pages.
3. Find two rules that an application using Spotify's playlist API must follow.
4. Record the rules and their document labels in **Report → 1. Spotify Requirements**.

## Step 2 (10 min): Test the Playlist Features

1. Change the playlist title and click **Save** (FR-01).
2. Click **Add track** (FR-04), then remove a track (FR-05).
3. Try the **Publish playlist** and **Collaborative** options.
4. Click **Try invalid FR-06**. What happens? Check D1 to decide whether this setting should be allowed.
5. Describe your tests in **Report → 2. Playlist Testing**.

## Step 3 (10 min): Run the Starting Code

1. Click **Code** and open \`main.py\`.
2. Click **Run Python** without changing anything.
3. Read the selected feature IDs in the output.
4. Return to **Spotify Case → Python release planning results**. Is FR-06 included?

The starting code has two unfinished functions. You will complete them in the next steps.

## Step 4 (15 min): Fix the Playlist Rule

1. In \`main.py\`, find \`playlist_policy_ok(public, collaborative)\`.
2. Replace the \`return True\` placeholder with a rule that returns \`False\` when **both** inputs are \`True\`.
3. Click **Run Python**.
4. Return to **Spotify Case** and try **Try invalid FR-06** again. It should now be blocked.

D1 describes the restriction on one playlist. An application may still support both public playlists and collaborative playlists as separate options.

## Step 5 (15 min): Calculate Feature Priority

1. In \`main.py\`, find \`requirement_utility(row)\`.
2. Replace the listener-only score with the weighted score:

\[
U(r) = 0.50L(r) + 0.30P(r) + 0.20E(r)
\]

L = listeners, P = product stakeholders, and E = engineers. The scores are in \`row["ratings"]\`.

3. Check your calculation: **FR-01 should have a utility of 3.70**.
4. Click **Run Python** and note the selected features, total utility, and effort for the **8-day budget**.
5. Add both Python changes to **Report → 3. Python Changes** and the selected release to **Report → 4. Release Planning**.

## Step 6 (20 min): Ask ChatGPT or Gemini

1. Open **Spotify Case** and find **External AI Review**.
2. Click **Copy grounded case prompt**, then open ChatGPT or Gemini.
3. Paste the prompt and ask the AI to recommend a release.
4. Record the AI's selected features and reasons.
5. Compare the answer with your Python results. Did the AI follow the budget, the FR-04/FR-05 dependency, and the Spotify rules?

Write your comparison in **Report → 5. AI and Verification**.

## Step 7 (15 min): Check the Results

1. Return to **Code**. Copy the AI's ordered feature IDs into \`AI_SUGGESTED_ORDER\` at the top of \`main.py\`.
2. Click **Run Python** and read the **AI REVIEW** output.
3. Change \`BUDGET_DAYS = 8\` to \`BUDGET_DAYS = 6\`, and run the code again. Which features change?
4. Restore \`BUDGET_DAYS = 8\` and click **Run Python**.
5. Click **Verify Requirements**, then run the five checks in the test panel. Fix any failed checks.
6. Record your budget comparison in **Report → 4. Release Planning** and test results in **Report → 5. AI and Verification**.

## Step 8 (20 min): Complete Your Report

Open **Report** and answer these six sections:

1. **Spotify Requirements:** What two Spotify rules did you find? Give their document labels.
2. **Playlist Testing:** What did you test in Spotify Case, and what happened with FR-06?
3. **Python Changes:** What did you change in the two functions? Show the FR-01 utility calculation.
4. **Release Planning:** Which features were selected with 8 days and with 6 days? Give the total utility and effort for each.
5. **AI and Verification:** What did ChatGPT or Gemini recommend? Did it agree with Python? How many checks passed?
6. **Final Recommendation:** Which features would you develop first, and why?

Enter your name and student ID. Review your answers, then click **Submit**.
