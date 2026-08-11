/**
 * Single source of truth for keyboard shortcuts.
 *
 * The `*_KEYS` constants are the physical `KeyboardEvent.key` values the
 * handlers match against; `SHORTCUT_GROUPS` is the human-readable catalog the
 * help overlay (press `?`) and button tooltips render. Keep the two in sync,
 * when a binding changes, update both here so nothing drifts
 */

export const ZOOM_IN_KEYS: readonly string[] = ['+', '=']
export const ZOOM_OUT_KEYS: readonly string[] = ['-', '_']
export const FIT_VIEW_KEY = '0'

/**
 * Letter keys that toggle a graph layer. Values match `KeyboardEvent.key`
 * (lowercase). The key maps to the *resource*, not the button position, `c`
 * always means the Components layer, `i` always Instances, everywhere they
 * appear
 */
export const LAYER_TOGGLE_KEYS = {
  apis: 'a',
  components: 'c',
  systems: 's',
  instances: 'i',
  unmapped: 'u',
} as const

export type LayerName = keyof typeof LAYER_TOGGLE_KEYS

export const GRAPH_TOGGLE_KEYS = {
  fullscreen: 'f',
  graph: 'g',
} as const

export const HELP_KEY = '?'

export interface Shortcut {
  keys: string[]
  label: string
}

export interface ShortcutGroup {
  title: string
  hint?: string
  shortcuts: Shortcut[]
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'List & selection',
    shortcuts: [
      { keys: ['↑'], label: 'Select previous item' },
      { keys: ['↓'], label: 'Select next item' },
      { keys: ['←'], label: 'Move the instance cursor left' },
      { keys: ['→'], label: 'Move the instance cursor right' },
      { keys: ['Enter'], label: 'Open the instance under the cursor' },
      { keys: ['Esc'], label: 'Clear the instance cursor' },
    ],
  },
  {
    title: 'Instance drawer',
    shortcuts: [
      { keys: ['↑'], label: 'Previous instance' },
      { keys: ['↓'], label: 'Next instance' },
      { keys: ['Tab'], label: 'Jump through the drawer relations' },
      { keys: ['Shift', 'Tab'], label: 'Backwards through the drawer relations' },
      { keys: ['Esc'], label: 'Back out / close the drawer' },
    ],
  },
  {
    title: 'Graph',
    shortcuts: [
      { keys: ['Shift', 'Enter'], label: 'Focus the selected / cursor node' },
      { keys: ['Shift', 'Click'], label: 'Focus the clicked node or area' },
      { keys: ['+'], label: 'Zoom in' },
      { keys: ['−'], label: 'Zoom out' },
      { keys: [FIT_VIEW_KEY], label: 'Fit to view' },
      { keys: [GRAPH_TOGGLE_KEYS.graph.toUpperCase()], label: 'Show / hide the graph' },
      { keys: [GRAPH_TOGGLE_KEYS.fullscreen.toUpperCase()], label: 'Toggle fullscreen graph' },
    ],
  },
  {
    title: 'Layers',
    hint: 'Toggle graph layers on or off (availability depends on the view)',
    shortcuts: [
      { keys: [LAYER_TOGGLE_KEYS.components.toUpperCase()], label: 'Components layer' },
      { keys: [LAYER_TOGGLE_KEYS.apis.toUpperCase()], label: 'APIs layer' },
      { keys: [LAYER_TOGGLE_KEYS.instances.toUpperCase()], label: 'Instances' },
      { keys: [LAYER_TOGGLE_KEYS.unmapped.toUpperCase()], label: 'Unmapped instances' },
    ],
  },
  {
    title: 'Sidebar',
    shortcuts: [
      { keys: ['B'], label: 'Sidebar navigation: walk with ↑/↓, Enter to open, Esc to leave' },
      { keys: ['Shift', 'B'], label: 'Collapse / expand the sidebar' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['/'], label: 'Focus the search in the view (Esc to blur)' },
      { keys: [HELP_KEY], label: 'Show this shortcuts panel' },
    ],
  },
]

export function keyHint(key: string): string {
  return `(${key.toUpperCase()})`
}

export function layerKeyHint(layer: LayerName): string {
  return keyHint(LAYER_TOGGLE_KEYS[layer])
}
