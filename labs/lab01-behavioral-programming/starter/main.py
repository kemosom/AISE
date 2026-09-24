"""
MAI5124 AI in Software Engineering
Lab 01: Behavioral Programming

Complete the TODO sections. Do not put the tank-safety rule inside the
functional fill b-threads. The purpose of the lab is to keep requirements
independent and coordinate them through BProgram.
"""

from helpers import BProgram

HOT_WATER = "HOT_WATER"
COLD_WATER = "COLD_WATER"
DRAIN_VALVE = "DRAIN_VALVE"

FILL_CYCLES = 5
MAX_CAPACITY = 8
DRAIN_AMOUNT = 3


def add_hot_water():
    """Worked example: request HOT_WATER exactly FILL_CYCLES times."""
    for _ in range(FILL_CYCLES):
        yield {
            "request": [HOT_WATER],
            "waitFor": [],
            "block": [],
        }


def add_cold_water():
    """
    TODO 1:
    Implement the cold-water functional b-thread.

    Requirements:
    - request COLD_WATER exactly FILL_CYCLES times;
    - do not implement capacity or drain logic here.
    """
    raise NotImplementedError("TODO: implement add_cold_water()")
    yield


def overflow_prevention():
    """
    TODO 2:
    Implement an independent safety b-thread.

    Track the observed tank volume. When the volume reaches MAX_CAPACITY,
    block HOT_WATER and COLD_WATER and request DRAIN_VALVE. After draining,
    subtract DRAIN_AMOUNT without allowing the tracked volume to become
    negative.
    """
    raise NotImplementedError("TODO: implement overflow_prevention()")
    yield


def build_program():
    """
    TODO 3:
    Register all three b-threads and return the configured BProgram.
    """
    bp = BProgram()

    # Example:
    # bp.add_bthread(add_hot_water)

    raise NotImplementedError("TODO: register all required b-threads")
    return bp


def calculate_volume_trace(trace):
    """Convert an event trace to volume-after-event values."""
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

    bp = build_program()
    trace = bp.run(max_steps=50)
    volumes = calculate_volume_trace(trace)

    print("\nEvent trace:")
    print(" -> ".join(trace) if trace else "(no events dispatched)")

    print("\nVolume after each event:")
    print(volumes)

    if volumes and max(volumes) <= MAX_CAPACITY:
        print(f"Safety check: PASS (maximum observed volume = {max(volumes)})")
    elif not volumes:
        print("Safety check: no events were produced.")
    else:
        print(
            f"Safety check: FAIL (observed {max(volumes)} > "
            f"MAX_CAPACITY={MAX_CAPACITY})"
        )

    return trace


if __name__ == "__main__":
    main()
