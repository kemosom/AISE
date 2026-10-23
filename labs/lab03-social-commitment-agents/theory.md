# Social commitments in distributed systems

A creator accepts a brand's invitation to make a promotional video. The creator uploads the video. A platform checks compliance. The brand reviews the result. A payment service settles the creator's fee. Each participant has a different goal.

An ordinary message log can tell us that the brand sent "approved". It does not tell us whether the creator received the promised payout. Social commitments make the responsibilities explicit.

## 1. Agents, goals, and shared data

An agent is a software component that can make decisions and act toward a goal. The creator agent seeks payment for completed work. The brand agent seeks acceptable content. The compliance agent checks whether the video meets the agreed rules. The payment service processes a payout.

The agents share a campaign artifact. It stores the invitation, acceptance, deliverable, decisions, and payment evidence. They can observe its state while retaining separate responsibilities.

## 2. Conditional social commitments

The notation C(debtor, creditor, condition, outcome) describes an obligation that becomes active when a condition occurs.

- Debtor: the party that must produce the outcome.
- Creditor: the party entitled to expect that outcome.
- Condition: the event that activates the obligation.
- Outcome: the required result.

Example: C(Payment Service, Creator, Video Published, Payout Settled).

The payment service is the processing debtor in our software model. This simplified relationship does not replace the legal allocation of payment responsibility in a real contract.

## 3. Commitment lifecycle

| State | Meaning |
|---|---|
| CONDITIONAL | One or more triggering events have not occurred. |
| ACTIVE | All triggers occurred, but the required outcome is still pending and the deadline has not passed. |
| FULFILLED | The outcome occurred after activation and by the deadline. |
| VIOLATED | The required outcome was late or remains missing after its deadline. |

A late delivery does not become timely simply because the file arrives eventually. We keep the violation visible.

If several events activate a commitment, activation occurs on the latest trigger day. The deadline is activation day plus the permitted number of days. The outcome must occur on or after activation and no later than the deadline. Day 6 is valid for an obligation activated on Day 1 with five days allowed.

## 4. Invitations and the four patterns

Entice: a brand sends a paid collaboration offer.

Cooperate: the creator submits a video while the brand reviews it and the platform coordinates the next steps.

Withdraw: the brand removes an offer before it is accepted.

Give up: the creator declines an offer.

The last two operations affect an unaccepted offer. They cannot silently cancel an accepted agreement. The offer lifecycle and the commitment lifecycle are related but different.

## 5. Event order and repeated messages

Each event records an ID, type, and day. The order matters. "Video published" before "video approved" must not be treated as valid evidence of an agreed approval process. Likewise, "payout requested" cannot substitute for "payout settled".

Distributed applications may deliver the same event twice. The event ID provides idempotency: identical repeats are counted once. Reusing an ID for two different events is an error.

## 6. TikTok One workflow

TikTok One supports invitations, creator content production, reviews, requested edits, publication, and compensation. In the documented online-payment flow, an advertiser pays into the platform before production, the funds are held, and the creator receives payout after publication.

The classroom brand, creator, payment amount, deadlines, events, and simplified agent rules are fictional.

Official references:

- [Creating a creator marketing project](https://ads.tiktok.com/help/article/how-to-create-a-new-creator-marketing-project-in-tiktok-one)
- [Completing creator deliverables](https://ads.tiktok.com/resources/help/article/how-creators-can-complete-deliverables-for-tiktok-one?lang=en)
- [Finding and joining projects](https://ads.tiktok.com/resources/help/article/how-creators-can-find-and-join-tiktok-one-projects?lang=en-GB)

## 7. Check your understanding

1. Which party owes payment processing after a video is published?
2. Can the creator's submission commitment remain CONDITIONAL while the brand's funding commitment is ACTIVE?
3. What evidence proves that the video was delivered on time?
4. Why is a message announcing a payout not sufficient to establish fulfillment?
5. Why must withdrawal after acceptance be rejected?


## 7. Programming agents through an event bus

An event-driven application does not place all business logic in one long procedure. Each service receives events and decides which events to emit. The event queue delivers them in simulated time order.

For example, the creator receives an escrow_funded event and decides when to submit the video. The compliance service receives video_submitted and produces a pass or fail event. The brand reviews passing work. The payment service processes a request only after publication.

The supplied simulator uses a priority queue. Each queued item has an event day and a sequence number. This makes execution reproducible when multiple events share a day. The event log can then be replayed to reconstruct the campaign and its commitments.

## 8. Distributed-system engineering skills

**Idempotency.** Network delivery may repeat the same message. Identical event IDs represent the same event. The receiver should not process them twice. Conflicting payloads that reuse an ID must be rejected.

**Retries.** A failed payout request can lead to another request with a new ID and an incremented attempt number. The original settlement obligation retains its deadline. A later retry does not extend that contract automatically.

**Causal order.** An outcome must not be counted before the event that activates its obligation.

**Separation of concerns.** Agents determine actions and publish events. The commitment monitor determines which obligations those actions satisfy. Neither component should substitute for the other.

## 9. Compare actual generated behavior

In the agent experiments, changing delivery_delay changes when the creator submits the video. Changing payment_failures changes the number and timing of settlement attempts. These settings generate different event logs, and the ledger evaluates those logs. The experiment therefore tests program behavior rather than relabeling a predetermined result.

This is a deterministic multi-agent system. It does not claim that a learned AI model controls the agents.
