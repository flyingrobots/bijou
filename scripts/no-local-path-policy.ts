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
  return /^\/home\/test(?:\/|$)/u.test(normalized);
}
