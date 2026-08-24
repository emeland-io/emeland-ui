/** "1 instance" / "3 instances" — naive pluralizer for count labels and tooltips */
export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`
}
