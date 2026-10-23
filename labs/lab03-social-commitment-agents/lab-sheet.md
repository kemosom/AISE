# Lab 03: TikTok Creator Campaign and Multi-Agent Simulation

**Course:** MAI5124 AI in Software Engineering  
**Duration:** 2 hours  
**Tools:** TikTok Case, Python, Verify Requirements, Report

## Project brief

NovaSound offers MayaTech RM 1,200 to promote wireless earbuds on TikTok. You will implement the software agents that coordinate the invitation, funding, video submission, review, publication, and payout.

The TikTok Case includes a scrollable short-video feed, six supplied event histories, five agent-generated experiments, and a commitment ledger. The short videos are open-license demonstration clips. They are not real NovaSound content.

## The campaign contract

| ID | Debtor to creditor | Condition | Promised result | Days allowed |
|---|---|---|---|---|
| K1 | Brand to Creator | Offer accepted | Escrow funded | 1 |
| K2 | Creator to Brand | Accepted offer and escrow funded | Video submitted | 5 |
| K3 | Brand to Creator | Video submitted | Review recorded | 2 |
| K4 | Creator to Brand | Video approved | Video published | 2 |
| K5 | Payment Service to Creator | Video published | Payout settled | 3 |

The identities, fee, day limits, and service policies are fictional lab data.

## Part A. Explore the system (15 minutes)

1. Open TikTok Case. Scroll the video feed and try the playback, like, follow, and mute controls.
2. Open the successful campaign history and examine the event timeline.
3. Select K1, K2, and K5 in the Commitment Ledger. Identify each debtor, creditor, trigger, result, and deadline.

## Part B. Implement the commitment engine (30 minutes)

4. Open Code and run main.py. The starting implementation deliberately contains incomplete logic.
5. Complete transition_offer(state, event_type). Reject an attempt to withdraw an accepted agreement.
6. Complete unique_events(events). Process identical retransmissions once. A reused ID with different content must raise ValueError.
7. Complete commitment_state(rule, observed, as_of_day). Use the actual trigger day, deadline, and outcome event. Distinguish CONDITIONAL, ACTIVE, FULFILLED, and VIOLATED.

## Part C. Program the agents (40 minutes)

8. Locate agent_reactions(message, policy). One example is implemented: an approved video becomes published the following day.
9. Implement the remaining event handlers from the code's decision table:
   - Brand: fund accepted work, and record a review.
   - Creator: submit a funded video, then publish approved content.
   - Compliance: assess content and pass or fail it.
   - Payment service: request payout, retry failed attempts, and issue a settlement event.
10. Keep all agent responses as events. Do not directly set ledger states.
11. Run Python. Compare AGENT_NORMAL, AGENT_CREATOR_LATE, AGENT_PAYMENT_RETRY, AGENT_PAYMENT_OUTAGE, and AGENT_REJECTED in TikTok Case.

## Part D. Fault injection (20 minutes)

12. Change AGENT_CREATOR_LATE delivery_delay from 8 to 4. Predict the effect on K2 and run Python.
13. Change AGENT_PAYMENT_RETRY payment_failures from 2 to 4. Predict K5's result and run Python.
14. Restore delivery_delay=8 and payment_failures=2. Run Verify Requirements and aim to pass all seven tests.
15. Compare a repeated payment-confirmation event with a new payment transaction. Explain how the event queue treats each.

## Part E. Report (15 minutes)

Answer the five report questions. Quote event days and the measured commitment states. Add a code snapshot and your verification results. Enter your name and student ID and submit once.

## Course alignment

**CLO1 / PLO1:** Analyze social commitments and coordination in a distributed software system.  
**CLO2 / PLO2:** Implement agents, event processing, and commitment verification in Python.  
**CLO3 / PLO7 (secondary):** Interpret simulated failure rates and unmet obligations.

The practical uses deterministic policies, not a machine-learning recommendation engine. All operations are local simulations without TikTok accounts or real payments.
