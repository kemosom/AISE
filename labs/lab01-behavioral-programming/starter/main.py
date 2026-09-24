"""
MAI5124 AI in Software Engineering
Lab 01: Behavioral Programming Reference Implementation

Student: Ahmed Ali (24012345)
"""
from helpers import BProgram

def add_hot_water():
    """B-Thread: Requests HOT_WATER 4 times."""
    for i in range(4):
        yield {
            'request': ['HOT_WATER'],
            'waitFor': ['COLD_WATER'],
            'block': []
        }

def add_cold_water():
    """B-Thread: Requests COLD_WATER 4 times."""
    for i in range(4):
        yield {
            'request': ['COLD_WATER'],
            'waitFor': ['HOT_WATER'],
            'block': []
        }

def overflow_prevention():
    """
    Safety Invariant B-Thread:
    Maintains liquid volume state and blocks water injection
    when capacity threshold is reached.
    """
    capacity = 0
    max_threshold = 6

    while True:
        if capacity >= max_threshold:
            # Enforce safety invariant: strictly BLOCK positive events
            yield {
                'request': ['DRAIN_VALVE'],
                'waitFor': ['DRAIN_VALVE'],
                'block': ['HOT_WATER', 'COLD_WATER']
            }
            capacity -= 2
        else:
            event = yield {
                'request': [],
                'waitFor': ['HOT_WATER', 'COLD_WATER', 'DRAIN_VALVE'],
                'block': []
            }
            if event in ['HOT_WATER', 'COLD_WATER']:
                capacity += 1
            elif event == 'DRAIN_VALVE':
                capacity = max(0, capacity - 2)

def main():
    print("=" * 60)
    print("AISE Lab Studio: Lab 01 Behavioral Simulation Running...")
    print("=" * 60)

    bp = BProgram()
    bp.add_bthread(add_hot_water)
    bp.add_bthread(add_cold_water)
    bp.add_bthread(overflow_prevention)

    trace = bp.run(max_steps=20)

    print("\n--- Simulation Summary ---")
    print(f"Total Events Dispatched: {len(trace)}")
    print(f"Event Trace: {' -> '.join(trace)}")
    print("Safety Invariant: Overflow safely mitigated by coordinator.")

if __name__ == '__main__':
    main()
