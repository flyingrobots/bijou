import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DRIVER_PATH = resolve(ROOT, 'scripts/pty-driver.py');

function runPython(source: string) {
  return spawnSync('python3', ['-c', source, DRIVER_PATH], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PYTHONDONTWRITEBYTECODE: '1',
    },
  });
}

describe('pty-driver apply_step', () => {
  it('ignores late steps once the child has exited and tolerates expected shutdown races', () => {
    const result = runPython(`
import errno
import importlib.util
import pathlib
import sys

driver_path = pathlib.Path(sys.argv[1])
spec = importlib.util.spec_from_file_location("pty_driver", driver_path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class DeadProc:
    pid = 999999

    def poll(self):
        return 0

module.apply_step(-1, DeadProc(), {"type": "input", "input": "x"})
module.apply_step(-1, DeadProc(), {"type": "resize", "rows": 24, "cols": 80})

class LiveProc:
    pid = 123

    def poll(self):
        return None

module.os.write = lambda _fd, _payload: (_ for _ in ()).throw(OSError(errno.EPIPE, "broken pipe"))
module.os.kill = lambda _pid, _sig: (_ for _ in ()).throw(OSError(errno.ESRCH, "gone"))
module.set_window_size = lambda _fd, _rows, _cols: None

module.apply_step(1, LiveProc(), {"type": "input", "input": "x"})
module.apply_step(1, LiveProc(), {"type": "resize", "rows": 24, "cols": 80})

print("ok")
`);

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('ok');
    expect(result.stderr).toBe('');
  });

  it('re-raises unexpected PTY write errors', () => {
    const result = runPython(`
import errno
import importlib.util
import pathlib
import sys

driver_path = pathlib.Path(sys.argv[1])
spec = importlib.util.spec_from_file_location("pty_driver", driver_path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class LiveProc:
    pid = 123

    def poll(self):
        return None

module.os.write = lambda _fd, _payload: (_ for _ in ()).throw(OSError(errno.EBADF, "bad fd"))

try:
    module.apply_step(1, LiveProc(), {"type": "input", "input": "x"})
except OSError as exc:
    print(exc.errno)
    raise SystemExit(0)

raise SystemExit(1)
`);

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('9');
    expect(result.stderr).toBe('');
  });

  it('keeps resize checkpoints safe when the scheduled step runs after process exit', () => {
    const result = runPython(`
import importlib.util
import json
import os
import pathlib
import sys

driver_path = pathlib.Path(sys.argv[1])
spec = importlib.util.spec_from_file_location("pty_driver", driver_path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class DeadProc:
    pid = 123

    def poll(self):
        return 0

    def wait(self):
        return 0

    def kill(self):
        raise AssertionError("kill should not be called")

class FakeSelector:
    def register(self, *_args, **_kwargs):
        return None

    def select(self, _timeout):
        return []

    def close(self):
        return None

module.os.environ["BIJOU_PTY_SPEC"] = json.dumps({
    "argv": ["python3", "-c", "print('ignored')"],
    "cwd": ".",
    "steps": [{
        "type": "resize",
        "rows": 30,
        "cols": 100,
        "delayMs": 0,
        "label": "resize-after-exit",
    }],
})

module.os.openpty = lambda: (10, 11)
module.os.close = lambda _fd: None
module.os.kill = lambda *_args, **_kwargs: (_ for _ in ()).throw(AssertionError("os.kill should not run"))
module.os.read = lambda *_args, **_kwargs: b""
module.subprocess.Popen = lambda *_args, **_kwargs: DeadProc()
module.selectors.DefaultSelector = lambda: FakeSelector()
resize_calls = []
module.set_window_size = lambda fd, rows, cols: resize_calls.append((fd, rows, cols))
module.capture_until = lambda *_args, **_kwargs: None
module.flush_ready_output = lambda *_args, **_kwargs: None
module.time.monotonic = lambda: 0.0

result = module.main()
assert resize_calls == [(10, 24, 80)], resize_calls
print(result)
`);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('__BIJOU_STEP__:resize-after-exit');
    expect(result.stdout.trim().endsWith('0')).toBe(true);
    expect(result.stderr).toBe('');
  });
});
