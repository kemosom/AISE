# Lab 01: AI for Software Design: Behavioral Programming

**Course:** MAI5124 AI in Software Engineering  
**Unit:** Software Design & Behavioral Specification  
**Estimated Time:** 3 Hours

---

## 1. Overview & Context

Traditional software architectures enforce centralized coordination logic through monolithic state machines or branching control flows. When requirements change or new safety constraints emerge, modifying a centralized system often introduces catastrophic regression faults.

**Behavioral Programming (BP)** is an operational paradigm founded on independent strands of behavior called **b-threads**. Instead of writing an overarching controller:
1. Each b-thread represents a distinct, autonomous requirement or safety invariant.
2. At every synchronization point, b-threads announce their intentions using three modalities:
   - **Requested events (R):** Events this thread proposes for immediate execution.
   - **Waited-for events (W):** Events this thread is interested in listening to.
   - **Blocked events (B):** Events this thread strictly prohibits from occurring.
3. An impartial execution coordinator (Arbiter) selects an event that is **requested by at least one b-thread** and **blocked by none**.
4. The selected event is dispatched to all waiting threads simultaneously.

In this laboratory, you will design, simulate, verify, and document a multi-agent behavioral system for an automated industrial fluid control unit.

---

## 2. Learning Outcomes

By completing this laboratory, you will be able to:
1. **Formulate concurrent software requirements** as independent, non-interfering b-threads.
2. **Apply the Request-Wait-Block (RWB) protocol** to enforce critical safety invariants without rewriting core business logic.
3. **Execute and analyze behavioral event traces** using Pyodide in Python.
4. **Evaluate conflict resolution** and verify deadlock-free operation through automated assertion suites.
5. **Formulate a structured academic technical report** incorporating code, execution traces, visual topologies, and analytical discussion.

---

## 3. Background & Theoretical Formulation

### The Synchronization Protocol

Let $T = \{t_1, t_2, \dots, t_n\}$ be the set of active b-threads. At step $k$, each thread yields a synchronization tuple:

$$S_i = \langle R_i, W_i, B_i \rangle$$

The central coordinator computes the set of candidate events $E_{cand}$:

$$E_{cand} = \left( \bigcup_{i=1}^n R_i \right) \setminus \left( \bigcup_{j=1}^n B_j \right)$$

- If $E_{cand} = \emptyset$ and some threads have unfulfilled requests, a behavioral deadlock or completion state occurs.
- If $E_{cand} \neq \emptyset$, an event $e \in E_{cand}$ is selected according to priority or heuristic selection, and all threads where $e \in (R_i \cup W_i)$ resume execution.

---

## 4. Required Tasks

### Task 1: Basic Pumping B-Threads
Inspect `starter/helpers.py` to understand the `BProgram` engine. Then, in `main.py`, implement:
- `add_hot_water()`: Requests `HOT_WATER` up to 5 times.
- `add_cold_water()`: Requests `COLD_WATER` up to 5 times.
- Run the simulation and observe the interwoven execution trace.

### Task 2: Safety Invariant Enforcement
Add an autonomous safety monitor b-thread:
- `overflow_prevention()`: Maintains a running tally of tank volume.
- When the volume reaches the threshold (e.g. 8 units), yield a `block` rule for both `HOT_WATER` and `COLD_WATER`, while requesting `DRAIN_VALVE`.
- Verify that no excess water events are dispatched once the capacity is reached.

### Task 3: Visual Design & Verification
1. Use the **Visual Design** panel to map out the interactions between your B-Threads, the Arbiter, and the Event Dispatcher.
2. Click **Run Tests** in the workspace toolbar to ensure all 4 verification assertions pass.
3. Use **Add to Report** to attach your execution log, plot, and visual graph as empirical evidence in your report.

---

## 5. Deliverables & Checklist

- [ ] Complete `main.py` with functional `add_hot_water`, `add_cold_water`, and `overflow_prevention` b-threads.
- [ ] Run public automated tests and achieve 100% passing results.
- [ ] Document all six sections in the **Report** workspace.
- [ ] Embed the event execution trace and visual flow diagram in the report.
- [ ] Review Word document preview or download `.docx`.
- [ ] Submit lab before deadline.
