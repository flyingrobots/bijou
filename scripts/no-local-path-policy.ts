/** Report local paths, allowing only the sealed runner's fixed execution layout. */
export function localPathViolations(pathname: string, text: string): readonly string[] {
  const dockerSource = pathname.startsWith('scripts/docker-seal/')
    && !pathname.split('/').some((part) => part === '..' || part === '.');
  const paths = text.match(/\/(?:Users|home)\/[^\s"'`<>(){},;:[\]]*|\b[A-Za-z]:[\\/][^\s"'`<>(){},;:[\]]*/gu) ?? [];
  const violations = paths.filter((path) => !permitted(path, dockerSource));
  if (/file:[/]{2}/u.test(text)) violations.push('file URL');
  return violations;
}

function permitted(path: string, dockerSource: boolean): boolean {
  if (!dockerSource) return false;
  const windows = /^[A-Za-z]:/u.test(path);
  if (!windows && path.includes('\\')) return false;
  const normalized = windows ? path.replace(/\\+/gu, '/') : path;
  if (normalized.split('/').includes('..')) return false;
  // Linux's disposable HOME is fixed by the inspected container profile.
  if (/^\/home\/test(?:\/|$)/u.test(normalized)) return true;
  // Windows image/toolchain and disposable data roots are fixed, not user homes.
  if (/^[Cc]:\/(?:work|temp|home|node|git|windows)(?:\/|$)/iu.test(normalized)) return true;
  return /^[Cc]:\/bijou-test-seal$/iu.test(normalized);
}
