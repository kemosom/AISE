# Lab 01 Practical: Add a Safety Requirement Without Rewriting Existing Behaviour

**Scenario:** Smart fluid-mixing controller  
**Recommended practical time:** 90 minutes

## Objective

Use Behavioral Programming to add one independent overflow-safety requirement to an existing controller and verify that the tank-capacity invariant is preserved.

## Course alignment

This practical supports the course outcomes concerned with understanding AI-related software-engineering concepts and selecting/applying appropriate methods and tools.

**Programming is not the learning outcome by itself.** The code is the mechanism used to apply the design method, observe its behaviour, and verify the result.

## What is already provided

You receive:

- the `BProgram` coordinator in `helpers.py`,
- a working hot-water b-thread,
- a working cold-water b-thread,
- a baseline program that runs without safety,
- volume tracing,
- automated public tests.

You do **not** build the system from scratch.

The only function you must implement is:

```python
overflow_prevention()
```

## Task 1: Run the unsafe baseline

Open `main.py` and click **Run Python** without changing anything.

The starter uses:

```python
ENABLE_SAFETY = False
```

The program should run normally and show:

- the event trace,
- the volume after each event,
- a failed safety check.

That failure is intentional. It demonstrates the problem before the safety requirement is added.

## Task 2: Implement `overflow_prevention()`

Complete the marked TODO.

Your b-thread must:

1. maintain its own estimate of tank volume,
2. observe `HOT_WATER`, `COLD_WATER`, and `DRAIN_VALVE`,
3. allow fill events while volume is below `MAX_CAPACITY`,
4. when volume reaches `MAX_CAPACITY`:
   - block `HOT_WATER`,
   - block `COLD_WATER`,
   - request `DRAIN_VALVE`,
5. after a drain event, reduce volume by `DRAIN_AMOUNT` without going below zero.

Do **not** add safety checks inside `add_hot_water()` or `add_cold_water()`.

## Task 3: Enable safety

Change:

```python
ENABLE_SAFETY = False
```

to:

```python
ENABLE_SAFETY = True
```

Run the program again.

A correct run should still execute all required fill events, introduce drain events when necessary, and never exceed `MAX_CAPACITY`.

## Task 4: Verify

Open **Tests** and run all public tests.

Use the test messages to diagnose any failure.

## Task 5: Report

In the report, include:

- a short explanation of your `overflow_prevention()` logic,
- unsafe versus safe execution evidence,
- public-test results,
- the BP design diagram,
- a short answer to both questions:

1. Why is a separate safety b-thread preferable to duplicating capacity checks inside both fill functions?
2. Does BP remove complexity, or does it move some complexity into event coordination?

## Completion checklist

- [ ] Unsafe baseline executed
- [ ] `overflow_prevention()` implemented
- [ ] `ENABLE_SAFETY = True`
- [ ] Safe execution verified
- [ ] All public tests passed
- [ ] Evidence added to report
- [ ] Report exported to Word
