import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useFindingsStore } from '@/stores/findings'
import type { ResourceType } from '@/types/common'

export interface NavItem {
  label: string
  route: string
  type?: ResourceType
  chip?: string
  badge?: number
}

export interface NavSection {
  title: string
  phase?: string
  items: NavItem[]
}

export function useNavigation() {
  const findingsStore = useFindingsStore()

  const headerNavigation = computed<NavSection[]>(() => [
    {
      title: 'Overview',
      items: [
        {
          label: 'Findings',
          route: '/findings',
          type: 'Finding',
          badge: findingsStore.findings.length > 0 ? findingsStore.findings.length : undefined,
        },
      ],
    },
    {
      title: 'Landscape',
      items: [
        { label: 'Nodes', route: '/nodes', type: 'Node' },
        { label: 'Graph', route: '/graph', chip: 'Gr' },
        { label: 'Sensors', route: '/sensors', chip: 'Se' },
        { label: 'Filters', route: '/filters', chip: 'Fi' },
        { label: 'Injectors', route: '/injectors', chip: 'In' },
      ],
    },
  ])

  const phaseNavigation: NavSection[] = [
    {
      title: 'Context',
      phase: 'P0',
      items: [{ label: 'Contexts', route: '/contexts', type: 'Context' }],
    },
    {
      title: 'Structure',
      phase: 'P1',
      items: [
        { label: 'Systems', route: '/systems', type: 'System' },
        { label: 'Components', route: '/components', type: 'Component' },
        { label: 'APIs', route: '/apis', type: 'API' },
      ],
    },
    {
      title: 'Identity',
      phase: 'P2',
      items: [
        { label: 'Identities', route: '/identities', type: 'Identity' },
        { label: 'OrgUnits', route: '/orgunits', type: 'OrgUnit' },
        { label: 'Groups', route: '/groups', type: 'Group' },
        { label: 'Permissions', route: '/permissions', chip: 'Pe' },
      ],
    },
    {
      title: 'Capabilities',
      phase: 'P3',
      items: [
        { label: 'Features', route: '/features', chip: 'Fe' },
        { label: 'Orders', route: '/orders', chip: 'Or' },
      ],
    },
    {
      title: 'Observability',
      phase: 'P6',
      items: [{ label: 'Metrics', route: '/metrics', chip: 'Me' }],
    },
    {
      title: 'Capacity',
      phase: 'P7',
      items: [{ label: 'Capacities', route: '/capacities', chip: 'Ca' }],
    },
  ]

  return { headerNavigation, phaseNavigation }
}

export function useNavEntry() {
  const route = useRoute()
  const { headerNavigation, phaseNavigation } = useNavigation()

  return computed<{ item: NavItem; section: NavSection } | undefined>(() => {
    for (const section of [...headerNavigation.value, ...phaseNavigation]) {
      const item = section.items.find((i) => i.route === route.path)
      if (item) return { item, section }
    }
    return undefined
  })
}
