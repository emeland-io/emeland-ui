import { LIFECYCLE_ORDER } from '@/constants/lifecycle'
import { capabilityLifecycle, type CapabilityLifecycle } from '@/utils/version'
import type { Capability } from '@/types/capability'

export interface CapabilityGroup {
  lifecycle: CapabilityLifecycle
  capabilities: Capability[]
}

/**
 * Card-grid order: lifecycle groups in display order, favorites pinned to the
 * top of their group, alphabetical otherwise
 */
export function groupCapabilitiesByLifecycle(
  capabilities: readonly Capability[],
  isFavorite: (id: string) => boolean = () => false,
): CapabilityGroup[] {
  return LIFECYCLE_ORDER.map((lifecycle) => ({
    lifecycle,
    capabilities: capabilities
      .filter((c) => capabilityLifecycle(c.versions) === lifecycle)
      .sort(
        (a, b) =>
          Number(isFavorite(b.capabilityId)) - Number(isFavorite(a.capabilityId)) ||
          a.displayName.localeCompare(b.displayName),
      ),
  })).filter((g) => g.capabilities.length > 0)
}
