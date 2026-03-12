import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DRIVER_PATH = resolve(ROOT, 'scripts/pty-driver.py');

function runPython(source: string) {
  return spawnSync('python3', ['-c', source, DRIVER_PATH], {
    encoding: 'utf8',
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
});
