#!/usr/bin/env python3

import json
import os
import selectors
import subprocess
import sys
import time


def main() -> int:
    raw_spec = os.environ.get("BIJOU_PTY_SPEC")
    if raw_spec is None:
        raise RuntimeError("BIJOU_PTY_SPEC is required")

    spec = json.loads(raw_spec)
    argv = spec["argv"]
    cwd = spec["cwd"]
    steps = spec.get("steps", [])

    env = os.environ.copy()
    for key, value in spec.get("env", {}).items():
      if value is None:
        env.pop(key, None)
      else:
        env[key] = str(value)

    master_fd, slave_fd = os.openpty()
    try:
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
                payload = steps[next_step_index]["input"].encode("utf-8", "surrogatepass")
                os.write(master_fd, payload)
                next_step_index += 1
                if next_step_index < len(steps):
                    next_deadline = now + (steps[next_step_index].get("delayMs", 0) / 1000)
                else:
                    next_deadline = now + 3600

            timeout = max(0.0, min(0.05, next_deadline - now))
            events = selector.select(timeout)
            for _key, _mask in events:
                try:
                    chunk = os.read(master_fd, 4096)
                except OSError:
                    chunk = b""
                if chunk:
                    sys.stdout.buffer.write(chunk)
                    sys.stdout.buffer.flush()

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
        selector.close()
        os.close(master_fd)

    return proc.wait()


if __name__ == "__main__":
    raise SystemExit(main())
