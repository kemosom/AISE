# Lab 01 Practical: Behavioral Programming

**Scenario:** Smart Fluid-Mixing Controller  
**Recommended practical time:** 2–2.5 hours

## Laboratory objective

Build and verify a small requirement-oriented controller in which functional behaviours and a safety invariant are implemented as independent b-threads.

You will start from a working behavioral-programming engine. You are responsible for completing the application-level behaviours, validating the event trace, and explaining the software-engineering implications.

## Files provided

- `helpers.py`: supplied behavioral-programming coordinator. Read it, but do not modify it unless instructed.
- `main.py`: student implementation file.
- Public tests: formative tests that check required behaviour.
- Visual Designer: use it to model the relationship among b-threads, coordinator, and dispatched events.

## Configuration

The starter program defines:

- `FILL_CYCLES = 5`
- `MAX_CAPACITY = 8`
- `DRAIN_AMOUNT = 3`

Do not hard-code different values inside individual b-threads. Use the provided constants so that the design remains configurable.

## Task 1: Inspect the supplied coordinator

Open `helpers.py`.

Identify where the coordinator:

1. primes each generator,
2. collects requested events,
3. collects blocked events,
4. forms the candidate set,
5. selects an event,
6. resumes interested b-threads.

In your report, explain why event selection must be deterministic for reproducible testing in this laboratory.

## Task 2: Complete the cold-water b-thread

`add_hot_water()` is provided as a worked example.

Implement `add_cold_water()` so that it requests exactly `FILL_CYCLES` `COLD_WATER` events using the same synchronization structure.

Run the program before implementing the safety monitor and inspect the event trace.

Record what happens to the simulated tank volume.

## Task 3: Implement the independent safety b-thread

Complete `overflow_prevention()`.

Requirements:

1. Maintain an internal estimate of tank volume.
2. Observe `HOT_WATER`, `COLD_WATER`, and `DRAIN_VALVE`.
3. While the volume is below `MAX_CAPACITY`, do not block normal fill events.
4. When the volume reaches `MAX_CAPACITY`:
   - block `HOT_WATER`,
   - block `COLD_WATER`,
   - request `DRAIN_VALVE`.
5. After a drain event, reduce the tracked volume by `DRAIN_AMOUNT`, but never below zero.
6. Do not modify `add_hot_water()` to implement safety logic.

This last requirement is important. The safety rule must remain modular.

## Task 4: Build and run the complete behavioral program

Complete `build_program()` by registering:

- `add_hot_water`
- `add_cold_water`
- `overflow_prevention`

Run `main.py`.

Your output should show:

- deterministic event dispatch,
- both hot-water and cold-water events,
- at least one drain event,
- no tank-volume violation.

Do not claim the system is safe only because it runs without an exception. Safety must be checked against the invariant.

## Task 5: Verify the safety invariant

Use **Run Tests**.

The public tests check:

- behavioral engine initialization,
- required fill-event generation,
- deterministic event selection,
- presence of drain behaviour,
- the complete volume safety invariant.

If a test fails, use the failure message to diagnose your implementation.

## Task 6: Visualize the software design

In **Visual Design**, construct or refine the architecture so that it clearly contains:

- Hot-water b-thread
- Cold-water b-thread
- Overflow-prevention b-thread
- BProgram coordinator
- Event dispatch / trace

The diagram should show that all b-threads coordinate through the BProgram rather than calling one another directly.

Add the finished design to your report.

## Task 7: Stress-test modularity

After your first successful run:

1. Change `MAX_CAPACITY` from 8 to 6.
2. Run the tests again.
3. Restore it to 8.
4. Change `DRAIN_AMOUNT` from 3 to 2 and run again.

Do not rewrite the functional b-threads.

In your report, discuss what this experiment says about modularity and separation of concerns.

## Report requirements

Complete the integrated report using your own name and student ID.

Include:

1. a concise explanation of the RWB protocol,
2. the final implementation approach,
3. an execution trace or output snapshot,
4. the visual architecture,
5. test evidence,
6. answers to the critical-analysis questions,
7. a short conclusion.

### Critical-analysis questions

1. What coupling would appear if the capacity check were placed directly inside both fill b-threads?
2. Does BP eliminate all forms of software complexity, or does it move some complexity into event coordination? Explain.
3. What is the difference between proving that a `block` rule exists and verifying the actual safety invariant over an execution trace?
4. If two safety b-threads block every requested event, how should the system distinguish intentional shutdown from an erroneous deadlock?
5. Where could an AI technique be integrated into this architecture without weakening the independent safety invariant?

## Completion checklist

- [ ] `add_cold_water()` implemented
- [ ] `overflow_prevention()` implemented independently
- [ ] `build_program()` completed
- [ ] Program executed successfully
- [ ] All public tests passed
- [ ] Visual design completed
- [ ] Modularity stress-test performed
- [ ] Report completed with name and student ID
- [ ] Evidence inserted into report
- [ ] Report exported to Word
