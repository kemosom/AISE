"""
Minimal Behavioral Programming engine for MAI5124 Lab 01.

The engine implements Request-Wait-Block synchronization. It intentionally
uses a deterministic first-requested event policy so repeated executions of
the same student program produce the same trace.
"""

from typing import Any, Dict, Generator, List, Sequence, Set


def _as_list(value: Any) -> List[str]:
    """Normalize a synchronization field to a list of event names."""
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    return list(value)


class BProgram:
    def __init__(self):
        self.threads: List[Generator] = []
        self.history: List[str] = []
        self.termination_reason: str | None = None

    def add_bthread(self, generator_func):
        """Register a generator function as a behavioral thread."""
        generator = generator_func()
        if not hasattr(generator, "send"):
            raise TypeError(
                f"{getattr(generator_func, '__name__', 'b-thread')} "
                "must return a Python generator"
            )
        self.threads.append(generator)

    @staticmethod
    def _ordered_requested_events(
        sync_specs: Sequence[Dict[str, Any]],
    ) -> List[str]:
        """
        Collect requests in stable b-thread registration order.

        A set is deliberately not used here because Python set iteration is
        not an event-priority policy and may change the observed trace.
        """
        ordered: List[str] = []
        seen: Set[str] = set()

        for spec in sync_specs:
            for event in _as_list(spec.get("request", [])):
                if event not in seen:
                    ordered.append(event)
                    seen.add(event)

        return ordered

    def run(self, max_steps: int = 50) -> List[str]:
        """Execute registered b-threads using RWB synchronization."""
        current_syncs: List[Dict[str, Any]] = []
        active_threads: List[Generator] = []

        for thread in self.threads:
            try:
                sync_spec = next(thread)
                if not isinstance(sync_spec, dict):
                    raise TypeError("A b-thread must yield a synchronization dictionary")
                current_syncs.append(sync_spec)
                active_threads.append(thread)
            except StopIteration:
                pass

        step = 0

        while active_threads and step < max_steps:
            requested = self._ordered_requested_events(current_syncs)

            blocked: Set[str] = set()
            for spec in current_syncs:
                blocked.update(_as_list(spec.get("block", [])))

            candidates = [event for event in requested if event not in blocked]

            if not candidates:
                has_pending_request = bool(requested)
                self.termination_reason = "deadlock" if has_pending_request else "completed"
                break

            selected_event = candidates[0]
            self.history.append(selected_event)
            step += 1

            print(f"[STEP {step:02d}] {selected_event}")

            new_syncs: List[Dict[str, Any]] = []
            new_active: List[Generator] = []

            for thread, spec in zip(active_threads, current_syncs):
                requested_by_thread = _as_list(spec.get("request", []))
                waited_for = _as_list(spec.get("waitFor", []))

                interested = (
                    selected_event in requested_by_thread
                    or selected_event in waited_for
                )

                if interested:
                    try:
                        next_spec = thread.send(selected_event)
                        if not isinstance(next_spec, dict):
                            raise TypeError(
                                "A b-thread must yield a synchronization dictionary"
                            )
                        new_syncs.append(next_spec)
                        new_active.append(thread)
                    except StopIteration:
                        pass
                else:
                    new_syncs.append(spec)
                    new_active.append(thread)

            current_syncs = new_syncs
            active_threads = new_active

        if step >= max_steps and active_threads:
            self.termination_reason = "max_steps"
        elif not active_threads and self.termination_reason is None:
            self.termination_reason = "completed"

        return list(self.history)
