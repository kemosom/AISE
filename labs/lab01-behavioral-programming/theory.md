# Lab 01: Behavioral Programming for Modular Software Design

**Pre-lab recap:** about 5 minutes

You already have the lecture slides. This page only contains the concepts needed to complete the practical.

## 1. Core idea

Behavioral Programming (BP) represents software requirements as independent **behavioral threads (b-threads)**.

In this lab, three requirements interact:

- add hot water,
- add cold water,
- prevent tank overflow.

The design question is simple:

> Can we add the safety requirement without rewriting the two existing fill behaviours?

That is the software-engineering point of the lab.

## 2. Request–Wait–Block

At a synchronization point, b-thread $i$ provides:

$$
S_i = \langle R_i, W_i, B_i \rangle
$$

where $R_i$ is the set of requested events, $W_i$ is the set of events being observed, and $B_i$ is the set of blocked events.

The coordinator selects from:

$$
E_{\mathrm{candidate}}
=
\left(\bigcup_i R_i\right)
\setminus
\left(\bigcup_i B_i\right)
$$

So an event can run only when at least one b-thread requests it and no active b-thread blocks it.

A simple b-thread looks like this:

```python
def add_hot_water():
    for _ in range(FILL_CYCLES):
        yield {
            "request": [HOT_WATER],
            "waitFor": [],
            "block": [],
        }
```

## 3. Safety requirement

Let $v_k$ be the tank volume after event $k$, and let $C_{\max}$ be the safe capacity.

The required invariant is:

$$
0 \le v_k \le C_{\max}
$$

The safety b-thread observes fill events. When the tank reaches the limit, it must block further fill events and request a drain event.

The important constraint is that the safety logic stays **separate** from the existing hot-water and cold-water functions.

## 4. What you will actually code

You are **not** building the entire system.

The coordinator and both fill behaviours are already provided.

Your coding task is only to complete:

```python
overflow_prevention()
```

You will first run the supplied unsafe baseline, then implement the safety b-thread, enable it, run again, and verify the result with automated tests.

The code is therefore the experiment used to understand and evaluate the software-design method.