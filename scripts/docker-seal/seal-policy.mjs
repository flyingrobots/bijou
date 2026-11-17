/** Kernel-visible facts required in addition to the runner's Docker inspection. */
export function verifyKernelSeal(facts) {
  const refuse = (reason) => { throw new Error(`Docker test seal refused: ${reason}`); };
  if (!facts.dockerFile) refuse('missing /.dockerenv');
  if (facts.marker !== 'bijou-test-seal-v1\n') refuse('missing or invalid image seal');
  if (facts.sockets.length !== 0) refuse('Docker socket present');
  if (facts.interfaces.some((name) => name !== 'lo')) refuse('network interface beyond loopback');
  const mounts = facts.mountInfo.trim().split('\n').map(parseMount);
  const root = mounts.find((mount) => mount.path === '/');
  if (root?.type !== 'overlay' || !root.options.includes('ro')) refuse('root must be read-only overlay');
  for (const path of ['/work', '/tmp', '/home/test']) {
    const mount = mounts.find((entry) => entry.path === path);
    if (mount?.type !== 'tmpfs' || mount.root !== '/') refuse(`${path} must be an independent tmpfs`);
  }
  for (const mount of mounts) {
    if (!allowedMount(mount)) refuse(`unexpected mount at ${mount.path}`);
  }
}

function parseMount(line) {
  const [left, right] = line.split(' - ');
  const before = left?.split(' ') ?? [];
  const after = right?.split(' ') ?? [];
  if (before.length < 6 || after.length < 3) throw new Error('Docker test seal refused: malformed mount information');
  const decode = (value) => value.replace(/\\([0-7]{3})/g, (_match, code) => String.fromCharCode(Number.parseInt(code, 8)));
  return { path: decode(before[4]), root: decode(before[3]), options: before[5].split(','), type: after[0] };
}

function allowedMount(mount) {
  const exact = new Map([
    ['/', 'overlay'], ['/work', 'tmpfs'], ['/tmp', 'tmpfs'], ['/home/test', 'tmpfs'],
    ['/proc', 'proc'], ['/dev', 'tmpfs'], ['/dev/pts', 'devpts'], ['/dev/shm', 'tmpfs'],
    ['/dev/mqueue', 'mqueue'], ['/sys', 'sysfs'], ['/sys/fs/cgroup', 'cgroup2'],
  ]);
  if (exact.get(mount.path) === mount.type) return true;
  // Docker --init supplies this executable; the host also requires Init=true.
  if (mount.path === '/usr/sbin/docker-init') return mount.options.includes('ro');
  // Docker supplies these three files even with no user bind mounts.
  if (['/etc/hosts', '/etc/hostname', '/etc/resolv.conf'].includes(mount.path)) return true;
  const procMasks = ['/proc/bus', '/proc/fs', '/proc/irq', '/proc/sys', '/proc/sysrq-trigger'];
  if (procMasks.includes(mount.path)) return mount.type === 'proc' && mount.options.includes('ro');
  const emptyMasks = ['/proc/acpi', '/proc/asound', '/proc/scsi', '/sys/firmware', '/sys/devices/virtual/powercap'];
  if (emptyMasks.includes(mount.path)) return mount.type === 'tmpfs' && mount.options.includes('ro');
  const nullMasks = ['/proc/interrupts', '/proc/kcore', '/proc/keys', '/proc/latency_stats', '/proc/timer_list', '/proc/timer_stats', '/proc/sched_debug'];
  return nullMasks.includes(mount.path) && mount.type === 'tmpfs' && mount.root === '/null';
}
