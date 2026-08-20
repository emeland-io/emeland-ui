/**
 * Node-id codec for the graphs that prefix their ids (the api/component
 * graphs). System, context and instance graphs use raw ids. Keep the prefixes
 * and the strip/prefix helpers here so builders, panes and views share one
 * convention
 */
export const ID_PREFIX = {
  api: 'api:',
  component: 'comp:',
  instance: 'inst:',
} as const

export type IdPrefix = keyof typeof ID_PREFIX

export function prefixedId(prefix: IdPrefix, id: string): string {
  return `${ID_PREFIX[prefix]}${id}`
}

export function stripPrefix(prefix: IdPrefix, prefixed: string): string {
  return prefixed.startsWith(ID_PREFIX[prefix])
    ? prefixed.slice(ID_PREFIX[prefix].length)
    : prefixed
}

// id of the dashed frame that groups unmapped instances in the graph lanes
export const UNMAPPED_FRAME_ID = 'frame:unmapped'
