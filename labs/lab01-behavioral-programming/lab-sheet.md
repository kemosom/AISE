# Lab 01 Practical: Add a Safety Requirement Without Rewriting Existing Behaviour

**Scenario:** Smart fluid-mixing controller  
**Recommended practical time:** 90–120 minutes

## Objective

Use Behavioral Programming to add an overflow-safety requirement to an existing working controller, then verify that the new requirement preserves the tank-capacity invariant.

## What is already provided

The starter project already contains:

- a working `BProgram` coordinator in `helpers.py`,
- a working hot-water b-thread,
- a working cold-water b-thread,
- a working baseline program that runs **without** the safety b-thread,
- automatic volume tracing,
- public verification tests.

You are **not** expected to build the whole system from scratch.

Your main coding task is to implement:

```python
overflow_prevention()
```

and then enable it.

## Task 1: Run the unsafe baseline

Open `main.py` and click **Run Python** without changing anything.

The baseline intentionally runs with:

```python
ENABLE_SAFETY = False
```

Observe:

- the event trace,
- the tank-volume trace,
- the final safety message.

The baseline should run successfully, but it should demonstrate why a safety requirement is needed.

## Task 2: Implement `overflow_prevention()`

Complete only the marked TODO inside `overflow_prevention()`.

Your b-thread must:

1. maintain its own estimate of tank volume,
2. observe `HOT_WATER`, `COLD_WATER`, and `DRAIN_VALVE`,
3. allow normal fill events while volume is below `MAX_CAPACITY`,
4. when volume reaches `MAX_CAPACITY`:
   - block `HOT_WATER`,
   - block `COLD_WATER`,
   - request `DRAIN_VALVE`,
5. after a drain event, reduce volume by `DRAIN_AMOUNT` without going below zero.

Do **not** edit `add_hot_water()` or `add_cold_water()` to add safety checks.

## Task 3: Enable safety and compare

After implementing the safety b-thread, change:

```python
ENABLE_SAFETY = False
```

to:

```python
ENABLE_SAFETY = True
```

Run the program again.

Compare the unsafe and safe executions.

A correct safe execution should:

- still produce all required hot-water and cold-water events,
- introduce at least one drain event,
- never exceed `MAX_CAPACITY`.

## Task 4: Run the public tests

Open **Tests** and run all tests.

The tests check:

- the supplied functional behaviours,
- the unsafe baseline,
- activation of the safety b-thread,
- deterministic execution,
- the complete tank-volume safety invariant.

If a test fails, use the failure message to correct your implementation.

## Task 5: Document the result

Use the **Design** view to inspect or refine the BP architecture, then add relevant evidence to the report.

Your report should contain:

- a short explanation of your safety b-thread,
- baseline versus safe execution evidence,
- public-test results,
- the BP architecture,
- a short discussion answering:

  1. Why is it better to keep the safety rule in a separate b-thread instead of adding capacity checks inside both fill functions?
  2. Does BP remove complexity, or does it move some complexity into event coordination?

## Completion checklist

- [ ] Unsafe baseline executed
- [ ] `overflow_prevention()` implemented
- [ ] `ENABLE_SAFETY = True`
- [ ] Safe execution verified
- [ ] All public tests passed
- [ ] Evidence added to report
- [ ] Report exported to Word
