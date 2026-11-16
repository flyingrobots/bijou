"""Exercise the real Markdown CLI through a Unix PTY, including a terminal resize."""
import errno
import fcntl
import json
import os
import pty
import select
import signal
import struct
import subprocess
import sys
import tempfile
import termios
import time


def cancel(signum, _frame):
    raise SystemExit(128 + signum)


def read_until(master, needle, seconds):
    data = b""
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        remaining = max(0, deadline - time.monotonic())
        ready, _, _ = select.select([master], [], [], min(0.05, remaining))
        if ready:
            try:
                data += os.read(master, 65536)
            except OSError:
                break
            if len(data) > 1048576:
                raise RuntimeError("PTY capture exceeded 1 MiB")
            if needle in data:
                return data
    return data


def wait_while_draining(proc: subprocess.Popen, master: int, seconds: float) -> None:
    """Keep terminal restoration writable without extending the shutdown deadline."""
    deadline = time.monotonic() + seconds
    captured = 0
    while proc.poll() is None:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise subprocess.TimeoutExpired(proc.args, seconds)
        ready, _, _ = select.select([master], [], [], min(0.05, remaining))
        if not ready:
            continue
        try:
            chunk = os.read(master, 65536)
        except OSError as error:
            if error.errno != errno.EIO:
                raise
            chunk = b""  # Linux PTYs report EIO when the slave closes.
        if not chunk:
            proc.wait(timeout=max(0, deadline - time.monotonic()))
            return
        captured += len(chunk)
        if captured > 1048576:
            raise RuntimeError("PTY shutdown capture exceeded 1 MiB")


signal.signal(signal.SIGTERM, cancel)
signal.signal(signal.SIGINT, cancel)
scratch = tempfile.TemporaryDirectory(prefix="bijou-font-resize-")
source = os.path.join(scratch.name, "document.md")
with open(source, "w") as document:
    document.write("alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima\n")
master, slave = pty.openpty()
fcntl.ioctl(slave, termios.TIOCSWINSZ, struct.pack("HHHH", 20, 40, 0, 0))


def session():
    os.setsid()
    fcntl.ioctl(slave, termios.TIOCSCTTY, 0)


# Exercise a real interactive terminal, independent of CI/color shell settings.
environment = os.environ.copy()
for variable in ("CI", "NO_COLOR", "TERM_PROGRAM", "BIJOU_ACCESSIBLE"):
    environment.pop(variable, None)
environment["TERM"] = "xterm-256color"
proc = subprocess.Popen(
    ["node", "--import", "tsx", "examples/markdown-font/main.ts", source,
     "--offline", *sys.argv[1:]],
    stdin=slave, stdout=slave, stderr=slave, preexec_fn=session, close_fds=True,
    env=environment,
)
os.close(slave)
try:
    initial = read_until(master, b"q quit", 8)
    if b"q quit" not in initial:
        raise RuntimeError("CLI failed to paint initial frame: " + repr(initial[-500:]))
    fcntl.ioctl(master, termios.TIOCSWINSZ, struct.pack("HHHH", 20, 80, 0, 0))
    os.killpg(proc.pid, signal.SIGWINCH)
    resized = read_until(master, b"foxtrot golf hotel", 3)
    os.write(master, b"q")
    # Restoring terminal settings can wait for output to drain on macOS.
    wait_while_draining(proc, master, 5)
    if proc.returncode != 0:
        raise RuntimeError("CLI exited " + str(proc.returncode))
    print(json.dumps({
        "initialHasWidePhrase": b"foxtrot golf hotel" in initial,
        "resizedHasWidePhrase": b"foxtrot golf hotel" in resized,
    }))
finally:
    if proc.poll() is None:
        os.killpg(proc.pid, signal.SIGKILL)
        proc.wait(timeout=5)
    os.close(master)
    scratch.cleanup()
