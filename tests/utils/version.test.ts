import { describe, it, expect } from 'vitest'
import { capabilityLifecycle, latestVersionRef, versionStatus } from '@/utils/version'
import { fulfilledItemCount, orderStatus } from '@/utils/orders'
import type { Order } from '@/types/order'

const NOW = new Date('2026-06-01T00:00:00Z')

describe('versionStatus', () => {
  it('is available without lifecycle bounds', () => {
    expect(versionStatus({ version: '1.0.0' }, NOW)).toBe('available')
  })

  it('is upcoming before availableFrom', () => {
    expect(versionStatus({ version: '2.0.0', availableFrom: '2026-12-01T00:00:00Z' }, NOW)).toBe(
      'upcoming',
    )
  })

  it('is deprecated after deprecatedFrom', () => {
    expect(
      versionStatus(
        {
          version: '1.0.0',
          availableFrom: '2025-01-01T00:00:00Z',
          deprecatedFrom: '2026-03-01T00:00:00Z',
        },
        NOW,
      ),
    ).toBe('deprecated')
  })

  it('is terminated after terminatedFrom, trumping deprecation', () => {
    expect(
      versionStatus(
        {
          version: '1.0.0',
          deprecatedFrom: '2025-06-01T00:00:00Z',
          terminatedFrom: '2026-01-01T00:00:00Z',
        },
        NOW,
      ),
    ).toBe('terminated')
  })
})

describe('latestVersionRef', () => {
  it('picks the highest version numerically, not lexically', () => {
    const latest = latestVersionRef([
      { capabilityVersionId: 'a', version: { version: '2.9.0' } },
      { capabilityVersionId: 'b', version: { version: '2.10.0' } },
    ])
    expect(latest?.capabilityVersionId).toBe('b')
  })

  it('returns undefined for empty input', () => {
    expect(latestVersionRef(undefined)).toBeUndefined()
    expect(latestVersionRef([])).toBeUndefined()
  })
})

describe('capabilityLifecycle', () => {
  it('reports no versions without any', () => {
    expect(capabilityLifecycle(undefined, NOW)).toBe('no versions')
  })

  it('stays available while an available version exists next to an upcoming one', () => {
    expect(
      capabilityLifecycle(
        [
          {
            capabilityVersionId: 'a',
            version: { version: '3.0.0', availableFrom: '2026-12-01T00:00:00Z' },
          },
          {
            capabilityVersionId: 'b',
            version: { version: '2.1.0', availableFrom: '2026-02-01T00:00:00Z' },
          },
        ],
        NOW,
      ),
    ).toBe('available')
  })

  it('is deprecated when no version is available or upcoming', () => {
    expect(
      capabilityLifecycle(
        [
          {
            capabilityVersionId: 'a',
            version: { version: '0.9.0', deprecatedFrom: '2026-01-01T00:00:00Z' },
          },
        ],
        NOW,
      ),
    ).toBe('deprecated')
  })
})

describe('orderStatus', () => {
  function order(instances: (string | undefined)[]): Order {
    return {
      orderId: 'o',
      displayName: 'o',
      items: instances.map((systemInstance, i) => ({
        orderItemId: `i${i}`,
        capability: 'c',
        ...(systemInstance ? { systemInstance } : {}),
        annotations: {},
      })),
      annotations: {},
    }
  }

  it('is open without fulfilled items', () => {
    expect(orderStatus(order([undefined]))).toBe('Open')
    expect(fulfilledItemCount(order([undefined]))).toBe(0)
  })

  it('is partial when only some items are fulfilled', () => {
    expect(orderStatus(order(['s1', undefined]))).toBe('Partial')
  })

  it('is fulfilled when every item has a system instance', () => {
    expect(orderStatus(order(['s1', 's2']))).toBe('Fulfilled')
  })
})
