/**
 * Mapping state of an instance's parent reference:
 * - `unmapped`: no parent reference at all (allowed by the model; triggers a finding)
 * - `unresolved`: references a parent resource that does not exist
 * - `undefined`: the parent reference resolves fine
 */
export type MappingState = 'unmapped' | 'unresolved'

export function mappingStateOf(
  parentId: string | undefined,
  parentExists: boolean,
): MappingState | undefined {
  if (!parentId) return 'unmapped'
  return parentExists ? undefined : 'unresolved'
}
