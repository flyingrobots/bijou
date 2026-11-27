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
  // No Windows path is fixed by any container profile, so none is permitted.
  if (!dockerSource || path.includes('\\') || /^[A-Za-z]:/u.test(path)) return false;
  if (path.split('/').includes('..')) return false;
  // Linux's disposable HOME is fixed by the inspected container profile.
  return /^\/home\/test(?:\/|$)/u.test(path);
}
