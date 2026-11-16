export function canonicalDogfoodDebtPath(path: string): string {
  return path.replace(/\.part\d+(?=\.tsx?$)/u, '');
}
