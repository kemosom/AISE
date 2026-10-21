# Lab 02 | AI-Assisted Requirements Prioritization: Spotify Playlist Case Study

**Case:** Your team is developing a playlist-management application using Spotify's Web API. You have six proposed features and a limited development budget.

**Question:** Which features should your team develop first, and how can AI help you make that decision?

## 1. Spotify Software Requirements

Before developing a feature, a software engineer needs to understand what it should do. Spotify provides documentation describing how its playlist API works. We will use four documents:

- **D1: Playlists.** Playlist settings, including public and collaborative playlists.
- **D2: Change Playlist Details.** Updating a playlist title, description, and settings.
- **D3: Add Playlist Items.** Adding songs to a playlist.
- **D4: Remove Playlist Items.** Removing songs from a playlist.

D1–D4 are the document labels used in this lab. You can read their summaries and open the official Spotify pages from **Spotify Case → Official API Evidence**.

A **functional requirement (FR)** describes something an application should do. For example, FR-01 means the user should be able to edit a playlist title. We assign each requirement an ID so we can discuss, implement, and test it.

## 2. Proposed Features

Your team has received six feature requests:

- **FR-01:** Edit a playlist title and description.
- **FR-02:** Publish a playlist on the owner's profile.
- **FR-03:** Create a private collaborative playlist.
- **FR-04:** Add a song to a playlist.
- **FR-05:** Remove a song from a playlist.
- **FR-06:** Make the same playlist both public and collaborative.

Use the Spotify documents to check these requests. In particular, compare FR-06 with the playlist settings described in D1.

The Spotify-style application in **Spotify Case** lets you try these actions. It is a classroom version of a playlist application.

## 3. Choosing Features for the Next Release

The team has **8 engineer-days** available for its next release. Each proposed feature requires some development time, so you cannot build everything at once.

We will use example ratings from three groups: listeners, product stakeholders, and engineers. Each group gives a score from 1 to 5. Their contributions to the overall score are:

- **Listeners:** 50%
- **Product stakeholders:** 30%
- **Engineers:** 20%

The utility score of a requirement is:

\[
U(r) = 0.50L(r) + 0.30P(r) + 0.20E(r)
\]

Here, L, P, and E are the three ratings. For example, if FR-01 receives ratings of 3, 4, and 5:

\[
U(\mathrm{FR\text{-}01}) = 0.50(3) + 0.30(4) + 0.20(5) = 3.70
\]

These ratings, effort estimates, and the eight-day budget are example values for this case study.

A **release plan** is the group of features we choose to develop next. The Python program selects the combination with the highest total utility while checking the development budget and technical rules.

There is also a project dependency: **FR-05 requires FR-04**. For this exercise, the team will not plan the remove-song feature without first including the add-song feature.

## 4. Checking the Requirements

You will first test the playlist features in **Spotify Case**. Then you will run Python and correct two functions:

- **playlist_policy_ok():** Checks whether public and collaborative settings are allowed together.
- **requirement_utility():** Calculates a requirement's score using all three stakeholder ratings.

After each change, run the code again and return to **Spotify Case** to see the effect on the release plan.

## 5. Comparing Your Decision with AI

Use **Copy grounded case prompt** in Spotify Case and paste it into ChatGPT or Gemini. Ask the model which features it recommends for the next release.

Compare its recommendation with your Python results. Check whether it follows Spotify's playlist rules, the eight-day budget, and the FR-04/FR-05 dependency.

You will finish by submitting a short report describing your tests, Python changes, release selection, and AI comparison.
