# Lab 01: Behavioral Programming for Modular Software Design

**Pre-lab recap:** about 8–10 minutes

You already have the lecture material. This page only summarizes the concepts needed for the practical.

## 1. The idea

Behavioral Programming (BP) represents software requirements as independent **behavioral threads (b-threads)**.

Each b-thread describes one requirement. The b-threads do not call one another directly. Instead, they synchronize by proposing, observing, or blocking events.

For this lab, the system has three requirements:

- request hot-water fill events,
- request cold-water fill events,
- prevent the tank from exceeding its safe capacity.

The key software-engineering question is:

> Can we add the safety requirement without rewriting the two functional fill behaviours?

## 2. Request–Wait–Block

At each synchronization point, b-thread *i* provides three event sets:

$$S_i = \langle R_i, W_i, B_i \rangle$$

where:

- $R_i$ = events requested by b-thread *i*,
- $W_i$ = events it wants to observe,
- $B_i$ = events it currently blocks.

The coordinator forms the candidate event set:

$$E_{\mathrm{candidate}} = \left(\bigcup_i R_i\right) \setminus \left(\bigcup_i B_i\right)$$

So an event can be selected only if:

1. at least one b-thread requests it, and
2. no active b-thread blocks it.

## 3. Minimal Python pattern

A b-thread is implemented as a Python generator:

```python
def add_hot_water():
    for _ in range(FILL_CYCLES):
        yield {
            "request": [HOT_WATER],
            "waitFor": [],
            "block": [],
        }
```

The supplied coordinator resumes a b-thread when a selected event is one that the thread requested or waited for.

## 4. Safety invariant

Let $v_k$ be the tank volume after event $k$ and $C_{\max}$ the safe capacity.

The required invariant is:

$$0 \le v_k \le C_{\max} \qquad \text{for every dispatched event } k$$

The safety b-thread should therefore observe fill events and, when the capacity boundary is reached, block further fill events and request a drain event.

The important design constraint is that this safety logic must remain **independent** of the hot-water and cold-water b-threads.

## 5. What you will do

In the practical you will:

1. run the supplied system **without** safety protection and observe the violation,
2. implement one missing function: `overflow_prevention()`,
3. enable the safety b-thread,
4. run the system again and compare the trace,
5. execute public tests that verify the safety invariant,
6. capture evidence in the integrated report.

That is the complete task. The starter code is intentionally provided so you can focus on the software-design concept rather than writing a behavioral-programming engine from scratch.
