# Lab 02 teaching datasets

These datasets are **synthetic but structurally realistic**. They are designed for MAI5124 laboratory work and do not contain Spotify internal data, private customer data, or proprietary release decisions.

- `candidate_backlog.csv`: 12 current candidate requirements with operational/product telemetry and engineering estimates.
- `customer_feedback.csv`: 958 anonymized synthetic feedback records across channels, regions, and plans. A subset contains an analyst-audited requirement label so students can evaluate NLP matching quality.
- `historical_releases.csv`: 360 synthetic historical release decisions with measurable evidence used to train and evaluate prioritization models.

The lab intentionally separates raw evidence from AI-derived evidence:
1. TF-IDF + cosine similarity maps unstructured feedback to candidate requirements.
2. Aggregated NLP evidence joins operational telemetry and engineering estimates.
3. Supervised ML learns historical release-decision patterns.
4. Students evaluate, challenge, and apply the ranking under budget and dependency constraints.
