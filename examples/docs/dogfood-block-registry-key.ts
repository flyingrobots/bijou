export function dogfoodBlockKey(packageName: string, blockName: string): string {
  return `${packageName}/${blockName}`;
}
