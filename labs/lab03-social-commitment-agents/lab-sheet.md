# Lab 03: TikTok Creator Campaign

**Course:** MAI5124 AI in Software Engineering  
**Duration:** 2 hours  
**Tools:** TikTok Case, Python, Verify Requirements, Report

## Campaign

NovaSound offers MayaTech RM 1,200 to promote wireless earbuds in a TikTok video.

The brand sends the invitation. The creator accepts it. The brand funds escrow. The creator submits a video. Compliance review and brand review follow. An approved video is published, and the payment service settles the payout.

The following deadlines belong to our fictional classroom contract. Days start with the invitation on Day 0.

| ID | Debtor → Creditor | Trigger | Required outcome | Days allowed |
|---|---|---|---|---|
| K1 | Brand → Creator | Offer accepted | Escrow funded | 1 |
| K2 | Creator → Brand | Offer accepted AND escrow funded | Video submitted | 5 |
| K3 | Brand → Creator | Video submitted | Brand review recorded | 2 |
| K4 | Creator → Brand | Video approved | Video published | 2 |
| K5 | Payment Service → Creator | Video published | Payout settled | 3 |

This lab uses one submission round. A compliance rejection prevents publication until a corrected submission is reviewed, but revision is outside this two-hour exercise.

## Part A: Explore the case (25 minutes)

1. Open TikTok Case and choose SUCCESS.
2. Examine the simulated video, invitation, fee, and project history.
3. Open the Commitment Ledger. For K1, K2, and K5, identify the debtor, creditor, trigger, outcome, and deadline.
4. Calculate the K2 deadline from the activation day. Answer the first two report questions using these observations.

## Part B: Complete Python (60 minutes)

5. Open Code and run main.py. Inspect the initial results in TikTok Case.
6. Edit transition_offer(state, event_type). Only an OFFERED invitation can be accepted, withdrawn, or declined. Raise ValueError for an invalid transition.
7. Edit commitment_state(rule, observed, as_of_day). Determine whether triggers have occurred; calculate activation and deadline; detect timely completion and violation.
8. Edit unique_events(events). Ignore repeated identical IDs. Raise ValueError when the same ID has different contents.
9. Run Python again and verify that SUCCESS has five FULFILLED commitments.

## Part C: Investigate failures (20 minutes)

10. Compare LATE_DELIVERY with SUCCESS. Why is K2 violated?
11. Open PAYOUT_MISSED. What evidence is missing for K5?
12. Open WITHDRAWN_OFFER. Explain why all five commitments remain CONDITIONAL.
13. Open COMPLIANCE_REJECTED. Why are publication and payout still CONDITIONAL?
14. Compare DUPLICATE_PAYOUT and SUCCESS. Why should their unique event counts match?

## Part D: Verify and report (15 minutes)

15. Run Verify Requirements and correct any failing tests.
16. Complete the five short report questions. Use event days, statuses, and test results as evidence.
17. Enter your student name and ID and submit once.

## Course alignment

**CLO1 / PLO1:** Explain roles, obligations, and limitations of message-only coordination.  
**CLO2 / PLO2:** Implement and verify the commitment engine.  
**CLO3 / PLO7 (supporting):** Interpret the scenario ledger and tests.

## Final question

Suppose a real distributed payment service retransmits the same payout confirmation. Explain why event IDs matter and what additional evidence a real payment audit would need.

The simulator does not access TikTok accounts, real videos, or payment systems.
