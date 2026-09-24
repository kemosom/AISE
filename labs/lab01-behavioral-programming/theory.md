# Lab 01 Theory: Behavioral Programming for Modular Software Design

**Course:** MAI5124 AI in Software Engineering  
**Topic:** AI for Software Design: Interweaving AI and Behavioral Programming Towards Better Programming Environments  
**Estimated theory reading:** 35–45 minutes

## Why this topic matters

Software systems rarely fail because a programmer cannot write an `if` statement. They become difficult to maintain when many requirements interact inside the same controller. A new safety constraint, exception, or policy may require edits across several branches of a state machine. Those edits can introduce regressions because the implementation of one requirement is entangled with the implementation of another.

**Behavioral Programming (BP)** addresses this design problem by representing requirements as independent behavioral threads, or **b-threads**. Each b-thread describes only one aspect of the required behaviour. A coordinator repeatedly considers what all active b-threads request, what they are waiting for, and what they forbid, then selects the next event.

The software-engineering question in this lab is therefore not simply "can we make the tank work?" It is:

> Can a requirement-oriented design let us add a safety rule without rewriting the existing functional behaviours?

That question is directly relevant to maintainability, incremental design, verification, and intelligent coordination.

## 1. From centralised control to requirement-oriented behaviour

Consider a fluid-mixing controller with three requirements:

1. The hot-water subsystem must request hot-water fill events.
2. The cold-water subsystem must request cold-water fill events.
3. The tank must never exceed its safe capacity.

A conventional implementation may place all three requirements in one controller:

```python
if hot_required and volume < MAX_CAPACITY:
    add_hot_water()
elif cold_required and volume < MAX_CAPACITY:
    add_cold_water()
elif volume >= MAX_CAPACITY:
    drain()
```

This is understandable at small scale. The problem appears when the system gains new requirements such as maintenance lockout, temperature constraints, emergency drain, operator override, or energy-saving policies. The same control structure gradually becomes the meeting point for every requirement.

BP takes a different approach. Each requirement becomes a separate b-thread. The b-threads do not call one another. They synchronize through events and a coordinator.

## 2. The Request-Wait-Block model

At a synchronization point, a b-thread yields a specification containing three event sets:

- **Request (R):** events the b-thread proposes for execution.
- **WaitFor (W):** events the b-thread wants to observe.
- **Block (B):** events the b-thread forbids at that synchronization point.

For active b-threads (t_1,ldots,t_n), let

[
S_i = \langle R_i, W_i, B_i \rangle
]

be the synchronization specification of b-thread (i).

The coordinator forms the candidate set

[
E_{cand} =
\left(\bigcup_i R_i\right)
\setminus
\left(\bigcup_i B_i\right).
]

An event is therefore selectable only when:

1. at least one active b-thread requests it, and
2. no active b-thread blocks it.

After an event is selected, each b-thread that requested or waited for that event is resumed. Other b-threads remain at their current synchronization point.

## 3. A minimal b-thread

A b-thread can be implemented as a Python generator. The generator yields a synchronization dictionary and is resumed when a relevant event occurs.

```python
def request_hot_water():
    for _ in range(3):
        selected = yield {
            "request": ["HOT_WATER"],
            "waitFor": [],
            "block": []
        }
```

This thread expresses one requirement only: request three hot-water events. It does not know anything about cold water, draining, or tank capacity.

That separation is deliberate.

## 4. Safety as an independent requirement

Suppose the tank has a maximum safe capacity. The safety requirement can be introduced as another b-thread.

Conceptually:

```text
observe fill events
update estimated volume

IF volume < MAX_CAPACITY
    wait for relevant events

IF volume >= MAX_CAPACITY
    block HOT_WATER
    block COLD_WATER
    request DRAIN_VALVE
```

The important design property is that the existing hot-water and cold-water b-threads do not need to be rewritten. The safety rule is added by composition.

This illustrates a key software-engineering benefit of BP: **incremental requirement integration**.

## 5. Coordination is not the same as "AI"

Behavioral Programming itself should not be mislabeled as machine learning or a multi-agent AI algorithm. In this course it is relevant because it provides a structured way to coordinate independent behavioural requirements and can serve as a substrate for intelligent decision rules, planners, learned policies, or agents.

For example, a future b-thread could request an event based on:

- a learned anomaly detector,
- a reinforcement-learning policy,
- a probabilistic risk score,
- a rule-based expert system.

The BP coordinator would still resolve the interaction among that intelligent component and other functional or safety requirements.

In this lab, however, the focus is **software design and coordination**, not model training.

## 6. Event selection and determinism

If several events are requested and none are blocked, a coordinator needs a selection policy. Examples include:

- fixed priority,
- round-robin selection,
- heuristic scoring,
- random selection,
- search-based selection.

For this introductory lab, the supplied `BProgram` uses a deterministic first-requested policy. Determinism is useful because repeated runs of the same program should produce the same trace, making debugging and testing easier.

Later systems may use more sophisticated selection policies.

## 7. Deadlock and completion

If no unblocked requested event exists, execution cannot proceed.

This may mean:

- all useful behaviour has completed, or
- active requirements are in conflict.

A good implementation should therefore distinguish normal completion from a genuine behavioural deadlock where requests remain but all are blocked.

You will inspect this condition when you analyse the execution trace.

## 8. Safety invariant used in this lab

Let (v_k) be the tank volume after event (k), and let (C_{max}) be the safe capacity.

The required safety invariant is

[
0 \le v_k \le C_{max}
\quad \text{for every event } k.
]

A fill event increases the volume by one unit:

[
v_{k+1}=v_k+1.
]

A drain event removes a fixed amount:

[
v_{k+1}=\max(0,v_k-D).
]

Passing the lab does not mean merely producing a `block` field. Your implementation must preserve this invariant across the complete event trace.

## 9. What you should be able to explain before coding

Before selecting **Begin Lab**, make sure you can answer these questions:

1. Why can separate b-threads improve requirement modularity?
2. What makes an event eligible for selection?
3. What is the difference between `request`, `waitFor`, and `block`?
4. Why should a safety b-thread be independent of the fill b-threads?
5. What evidence would demonstrate that the safety invariant actually holds?
6. What would count as a behavioural deadlock?

You will use these ideas in the implementation and in your laboratory report.
