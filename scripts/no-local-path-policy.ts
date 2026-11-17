/** Report local paths, allowing only the sealed runner's fixed execution layout. */
export function localPathViolations(pathname: string, text: string): readonly string[] {
  const dockerSource = pathname.startsWith('scripts/docker-seal/')
    && !pathname.split('/').some((part) => part === '..' || part === '.');
  const paths = text.match(/\/(?:Users|home)\/[^\s"'`<>(){},;:[\]]*|\b[A-Za-z]:[\\/][^\s"'`<>(){},;:[\]]*/gu) ?? [];
  const violations = paths.filter((path) => !permitted(pathname, path, dockerSource));
  if (/file:[/]{2}/u.test(text)) violations.push('file URL');
  return violations;
}

function permitted(pathname: string, path: string, dockerSource: boolean): boolean {
  if (!dockerSource) return false;
  const windows = /^[A-Za-z]:/u.test(path);
  if (!windows && path.includes('\\')) return false;
  const normalized = windows ? path.replace(/\\+/gu, '/') : path;
  if (normalized.split('/').includes('..')) return false;
  // Linux's disposable HOME is fixed by the inspected container profile.
  if (/^\/home\/test(?:\/|$)/u.test(normalized)) return true;
  // Windows image/toolchain and disposable data roots are fixed, not user homes.
  if (/^[Cc]:\/(?:work|temp|home|node|git|windows)(?:\/|$)/iu.test(normalized)) return true;
  if (/^[Cc]:\/bijou-test-seal$/iu.test(normalized)) return true;
  // Native quota APIs address the independently verified container volume root.
  if (pathname === 'scripts/docker-seal/windows-measure.ps1' && /^[Cc]:\/$/u.test(normalized)) return true;
  // Only the two host orchestration boundaries address the shared lock store.
  return ['scripts/docker-seal/run.mjs', 'scripts/docker-seal/bootstrap.mjs'].includes(pathname)
    && /^\/Users\/Shared\/git-locks\/workstation\.git$/u.test(normalized);
}
