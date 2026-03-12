#!/usr/bin/env python3

import json
import os
import selectors
import signal
import subprocess
import sys
import time
import fcntl
import struct
import termios

MARKER_PREFIX = "__BIJOU_STEP__:"


def set_window_size(fd: int, rows: int, cols: int) -> None:
    packed = struct.pack("HHHH", rows, cols, 0, 0)
    fcntl.ioctl(fd, termios.TIOCSWINSZ, packed)


def apply_step(master_fd: int, proc: subprocess.Popen[bytes], step: dict) -> None:
    step_type = step.get("type", "input")

    if step_type == "input":
        payload = step["input"].encode("utf-8", "surrogatepass")
        os.write(master_fd, payload)
        return

    if step_type == "resize":
        rows = int(step["rows"])
        cols = int(step["cols"])
        if rows <= 0 or cols <= 0:
            raise RuntimeError("resize step requires positive rows and cols")
        set_window_size(master_fd, rows, cols)
        os.kill(proc.pid, signal.SIGWINCH)
        return

    raise RuntimeError(f"Unsupported PTY step type: {step_type}")


def flush_ready_output(selector: selectors.BaseSelector, master_fd: int, timeout: float) -> None:
    events = selector.select(timeout)
    for _key, _mask in events:
        try:
            chunk = os.read(master_fd, 4096)
        except OSError:
            chunk = b""
        if chunk:
            sys.stdout.buffer.write(chunk)
            sys.stdout.buffer.flush()


def capture_until(selector: selectors.BaseSelector, master_fd: int, deadline: float) -> None:
    while True:
        now = time.monotonic()
        if now >= deadline:
            break
        flush_ready_output(selector, master_fd, max(0.0, min(0.05, deadline - now)))
    flush_ready_output(selector, master_fd, 0.0)


def main() -> int:
    raw_spec = os.environ.get("BIJOU_PTY_SPEC")
    if raw_spec is None:
        raise RuntimeError("BIJOU_PTY_SPEC is required")

    spec = json.loads(raw_spec)
    argv = spec["argv"]
    cwd = spec["cwd"]
    steps = spec.get("steps", [])
    proc = None

    env = os.environ.copy()
    for key, value in spec.get("env", {}).items():
        if value is None:
            env.pop(key, None)
        else:
            env[key] = str(value)

    master_fd, slave_fd = os.openpty()
    try:
        rows = int(spec.get("rows", 24))
        cols = int(spec.get("cols", 80))
        set_window_size(master_fd, rows, cols)
        proc = subprocess.Popen(
            argv,
            cwd=cwd,
            env=env,
            stdin=slave_fd,
            stdout=slave_fd,
            stderr=slave_fd,
            close_fds=True,
        )
    finally:
        os.close(slave_fd)

    selector = selectors.DefaultSelector()
    selector.register(master_fd, selectors.EVENT_READ)

    next_step_index = 0
    next_deadline = time.monotonic() + (
        steps[0].get("delayMs", 0) / 1000 if steps else 3600
    )

    try:
        while True:
            now = time.monotonic()
            while next_step_index < len(steps) and now >= next_deadline:
                step = steps[next_step_index]
                apply_step(master_fd, proc, step)
                label = step.get("label")
                if label:
                    capture_ms = max(0, int(step.get("captureMs", 250)))
                    capture_until(selector, master_fd, time.monotonic() + (capture_ms / 1000))
                    sys.stdout.write(f"\n{MARKER_PREFIX}{label}\n")
                    sys.stdout.flush()
                next_step_index += 1
                if next_step_index < len(steps):
                    next_deadline = time.monotonic() + (steps[next_step_index].get("delayMs", 0) / 1000)
                else:
                    next_deadline = time.monotonic() + 3600

            timeout = max(0.0, min(0.05, next_deadline - now))
            flush_ready_output(selector, master_fd, timeout)

            if proc.poll() is not None:
                break

        while True:
            try:
                chunk = os.read(master_fd, 4096)
            except OSError:
                break
            if not chunk:
                break
            sys.stdout.buffer.write(chunk)
            sys.stdout.buffer.flush()
    finally:
        if proc is not None and proc.poll() is None:
            proc.kill()
        selector.close()
        os.close(master_fd)

    return proc.wait()


if __name__ == "__main__":
    raise SystemExit(main())
