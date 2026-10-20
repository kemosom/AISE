# Lab 02 | AI-Assisted Requirements Prioritization: Spotify Playlist Case Study

**Case:** You are a requirements engineer designing a *new playlist-management interface that uses Spotify's Web API*. You are **not** modifying Spotify's proprietary application.

**Teaching question:** Can an AI recommend which software features to build first, and how do we prevent the recommendation from violating documented technical requirements?

## 1. How this connects to Lecture 2

- **Early Requirements Engineering (2.2):** identify and assess requirements.
- **MVP selection (2.3):** choose valuable features when development time is limited.
- **Basic and Integrated Release Planning (2.4-2.5):** turn stakeholder preferences into a feasible release; enforce dependencies and hard constraints.
- **Stakeholder Recommendation (2.6):** explain who should validate ambiguous API requirements.
- **Research Issues (2.7):** investigate AI-generated unsupported claims and decision bias.

## 2. Our real primary source: Spotify developer documentation

Open these *public, official* references:

- **D1: [Spotify Playlists, including public/private/collaborative status and snapshots](https://developer.spotify.com/documentation/web-api/concepts/playlists)**
- **D2: [Change Playlist Details](https://developer.spotify.com/documentation/web-api/reference/change-playlist-details)**
- **D3: [Add Items to Playlist](https://developer.spotify.com/documentation/web-api/reference/add-items-to-playlist)**
- **D4: [Remove Playlist Items](https://developer.spotify.com/documentation/web-api/reference/remove-items-playlist)**

### What D1 actually says

A playlist can be public OR collaborative, **but not both at the same time**. The Web API's public setting means appearance on the user's profile and in search; it is **not the same as access control**. Managing individual collaborators is not supported through that API. Playlist changes have version snapshots.

These are documented product/API facts. **They are not customer-preference scores.**

## 3. Case assumptions, not Spotify facts

The lab gives you six candidate requirements, three fictional stakeholder rating columns (1 to 5), and fictional engineering-day estimates. The scenario has **8 available engineer-days**.

Do not present these numbers as Spotify research, telemetry, implementation costs, or survey results. They are classroom assumptions to demonstrate the Lecture 2 optimization concepts.

## 4. Utility analysis and optimization

We combine the given stakeholder ratings using a transparent, normalized weighted utility:

\[
U(r)=0.50 L(r)+0.30 P(r)+0.20 E(r).
\]

The stakeholder weights sum to 1. Different legitimate weight choices may produce different rankings; weights are decision-policy assumptions, not AI discoveries.

For each feasible release subset S:

\[
\max \sum_{r \in S} U(r)
\]

subject to total implementation effort no greater than 8 engineer-days, prerequisites being selected first or together, and the documented public/collaborative rule never being violated.

The Python starter enumerates 64 possible combinations. You only need to complete **two small functions** to make the result trustworthy.

## 5. Where the AI actually appears

Use a *real generative AI model in another browser tab*. Give it the source evidence and six candidate requirements, ask for a proposed ranking with citations and a structured result, then **audit** the returned recommendation.

The browser lab does not pretend that a rule-based priority score is itself an LLM. The Python program is a deterministic engineering verifier; the external model provides a live, potentially fallible recommendation.

This is a deliberately lightweight example of **grounded LLM-assisted requirements engineering, structured outputs, evidence traceability, and human-in-the-loop verification**.

## 6. What the lab does NOT require

No Spotify account, Spotify Premium, Spotify API credentials, paid AI API key, or Python installation. Everything except the student-chosen public AI assistant runs inside the course website.

**Caution:** Spotify's 2026 Development Mode imposes premium-owner and user limits. We therefore study genuine API requirements and validate a *local design*, without making live authenticated Spotify API calls.

## Your outcome

A justified feature release, tested hard constraints, and a short report demonstrating where the AI helped, where it was wrong or uncertain, and why a software engineer must still make the final decision.
