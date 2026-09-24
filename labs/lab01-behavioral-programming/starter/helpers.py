"""
Behavioral Programming Engine for MAI5124 Lab 01.
Implements the Request-Wait-Block (RWB) synchronization coordinator.
"""
from typing import Dict, List, Set, Any, Generator

class Event:
    def __init__(self, name: str, payload: Any = None):
        self.name = name
        self.payload = payload

    def __repr__(self):
        return f"Event('{self.name}')"

    def __eq__(self, other):
        if isinstance(other, str):
            return self.name == other
        if isinstance(other, Event):
            return self.name == other.name
        return False

    def __hash__(self):
        return hash(self.name)


class BProgram:
    def __init__(self):
        self.threads: List[Generator] = []
        self.history: List[str] = []

    def add_bthread(self, generator_func):
        """Register a generator as a behavioral thread."""
        gen = generator_func()
        self.threads.append(gen)

    def run(self, max_steps: int = 50) -> List[str]:
        """
        Coordinates the execution of registered b-threads using
        the Request-Wait-Block (RWB) protocol.
        """
        # Prime all b-threads to their first yield
        current_syncs: List[Dict[str, Any]] = []
        active_threads: List[Generator] = []

        for t in self.threads:
            try:
                sync_spec = next(t)
                current_syncs.append(sync_spec)
                active_threads.append(t)
            except StopIteration:
                pass

        step = 0
        while active_threads and step < max_steps:
            step += 1
            # Aggregate requested and blocked events
            requested: Set[str] = set()
            blocked: Set[str] = set()

            for spec in current_syncs:
                req = spec.get('request', [])
                if isinstance(req, str):
                    req = [req]
                requested.update(req)

                blk = spec.get('block', [])
                if isinstance(blk, str):
                    blk = [blk]
                blocked.update(blk)

            # Candidate events: requested minus blocked
            candidates = [e for e in requested if e not in blocked]
            if not candidates:
                # Deadlock or all requests satisfied
                break

            # Deterministic selection: pick first candidate
            selected_event = candidates[0]
            self.history.append(selected_event)
            print(f"[STEP {step:02d}] Dispatched Event: >> {selected_event} <<")

            # Advance all threads that either requested or waited for this event
            new_syncs = []
            new_active = []

            for t, spec in zip(active_threads, current_syncs):
                req = spec.get('request', [])
                if isinstance(req, str):
                    req = [req]
                wfor = spec.get('waitFor', [])
                if isinstance(wfor, str):
                    wfor = [wfor]

                interested = (selected_event in req) or (selected_event in wfor)
                if interested:
                    try:
                        next_spec = t.send(selected_event)
                        new_syncs.append(next_spec)
                        new_active.append(t)
                    except StopIteration:
                        # Thread completed
                        pass
                else:
                    # Thread stays at current synchronization state
                    new_syncs.append(spec)
                    new_active.append(t)

            current_syncs = new_syncs
            active_threads = new_active

        return self.history
