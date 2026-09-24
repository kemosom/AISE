"""
MAI5124 AI in Software Engineering
Lab 01: Behavioral Programming

STUDENT TASK
------------
1. Run this file once with ENABLE_SAFETY = False.
2. Observe the unsafe baseline.
3. Implement overflow_prevention().
4. Set ENABLE_SAFETY = True.
5. Run again and verify the public tests.

The functional hot-water and cold-water behaviours are already provided.
"""

from helpers import BProgram

HOT_WATER = "HOT_WATER"
COLD_WATER = "COLD_WATER"
DRAIN_VALVE = "DRAIN_VALVE"

FILL_CYCLES = 5
MAX_CAPACITY = 8
DRAIN_AMOUNT = 3

# Keep False for the first baseline run.
# Change to True only after implementing overflow_prevention().
ENABLE_SAFETY = False


def add_hot_water():
    """Existing functional requirement: request HOT_WATER."""
    for _ in range(FILL_CYCLES):
        yield {
            "request": [HOT_WATER],
            "waitFor": [],
            "block": [],
        }


def add_cold_water():
    """Existing functional requirement: request COLD_WATER."""
    for _ in range(FILL_CYCLES):
        yield {
            "request": [COLD_WATER],
            "waitFor": [],
            "block": [],
        }


def overflow_prevention():
    """
    TODO: Implement the independent safety requirement.

    Required behaviour:
    - track the observed tank volume;
    - while volume < MAX_CAPACITY, observe relevant events;
    - when volume >= MAX_CAPACITY, block HOT_WATER and COLD_WATER
      and request DRAIN_VALVE;
    - after DRAIN_VALVE, subtract DRAIN_AMOUNT without going below zero.

    Hint:
    A b-thread receives the selected event from:

        event = yield {
            "request": [...],
            "waitFor": [...],
            "block": [...],
        }
    """

    # Write your implementation here.
    # Keep this function as a generator by retaining the unreachable yield
    # until you replace the TODO with your own loop.
    return
    yield


def build_program(enable_safety=None):
    """Build the controller with or without the safety requirement."""
    if enable_safety is None:
        enable_safety = ENABLE_SAFETY

    bp = BProgram()
    bp.add_bthread(add_hot_water)
    bp.add_bthread(add_cold_water)

    if enable_safety:
        bp.add_bthread(overflow_prevention)

    return bp


def calculate_volume_trace(trace):
    """Return the tank volume after every dispatched event."""
    volume = 0
    volumes = []

    for event in trace:
        if event in (HOT_WATER, COLD_WATER):
            volume += 1
        elif event == DRAIN_VALVE:
            volume = max(0, volume - DRAIN_AMOUNT)

        volumes.append(volume)

    return volumes


def main():
    print("=" * 58)
    print("MAI5124 Lab 01 | Behavioral Programming")
    print("=" * 58)
    print(f"Safety protection: {'ON' if ENABLE_SAFETY else 'OFF'}")

    bp = build_program()
    trace = bp.run(max_steps=50)
    volumes = calculate_volume_trace(trace)

    print("\nEvent trace:")
    print(" -> ".join(trace) if trace else "(no events dispatched)")

    print("\nVolume after each event:")
    print(volumes)

    max_volume = max(volumes, default=0)

    if max_volume <= MAX_CAPACITY:
        print(
            f"\nSafety check: PASS "
            f"(maximum observed volume = {max_volume}, limit = {MAX_CAPACITY})"
        )
    else:
        print(
            f"\nSafety check: FAIL "
            f"(maximum observed volume = {max_volume}, limit = {MAX_CAPACITY})"
        )
        if not ENABLE_SAFETY:
            print(
                "This failure is expected for Task 1. "
                "Implement overflow_prevention() and enable safety."
            )

    return trace


if __name__ == "__main__":
    main()
