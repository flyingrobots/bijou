export function tableStoryLabel(id: string): string {
  return id
    .split('-')
    .map(word => word.length <= 3 ? word.toUpperCase() : `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}
