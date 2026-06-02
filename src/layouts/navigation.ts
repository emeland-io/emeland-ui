import type { Component } from 'vue'
import { IconCube } from '@tabler/icons-vue'

export interface NavItem {
  label: string
  route: string
  icon: Component
  badge?: 'dot' | number
}

export interface NavSection {
  title: string
  phase?: string
  items: NavItem[]
}

export const headerNavigation: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Findings', route: '/findings', icon: IconCube, badge: 'dot' }],
  },
  {
    title: 'Landscape',
    items: [
      { label: 'Models', route: '/models', icon: IconCube },
      { label: 'Nodes', route: '/nodes', icon: IconCube },
      { label: 'Graph', route: '/graph', icon: IconCube },
      { label: 'Sensors', route: '/sensors', icon: IconCube },
      { label: 'Filters', route: '/filters', icon: IconCube },
      { label: 'Injectors', route: '/injectors', icon: IconCube },
    ],
  },
]

export const phaseNavigation: NavSection[] = [
  {
    title: 'Context',
    phase: 'P0',
    items: [{ label: 'Contexts', route: '/contexts', icon: IconCube }],
  },
  {
    title: 'Structure',
    phase: 'P1',
    items: [
      { label: 'Systems', route: '/systems', icon: IconCube },
      { label: 'Components', route: '/components', icon: IconCube },
      { label: 'APIs', route: '/apis', icon: IconCube },
    ],
  },
  {
    title: 'Identity',
    phase: 'P2',
    items: [
      { label: 'Identities', route: '/identities', icon: IconCube },
      { label: 'OrgUnits', route: '/orgunits', icon: IconCube },
      { label: 'Groups', route: '/groups', icon: IconCube },
      { label: 'Permissions', route: '/permissions', icon: IconCube },
    ],
  },
  {
    title: 'Capabilities',
    phase: 'P3',
    items: [
      { label: 'Features', route: '/features', icon: IconCube },
      { label: 'Orders', route: '/orders', icon: IconCube },
    ],
  },
  {
    title: 'Observability',
    phase: 'P6',
    items: [{ label: 'Metrics', route: '/metrics', icon: IconCube }],
  },
  {
    title: 'Capacity',
    phase: 'P7',
    items: [{ label: 'Capacities', route: '/capacities', icon: IconCube }],
  },
]
