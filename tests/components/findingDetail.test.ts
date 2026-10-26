import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FindingDetail from '@/components/findings/FindingDetail.vue'
import type { Finding } from '@/types/finding'

const finding: Finding = {
  findingId: 'f1',
  displayName: 'Version mismatch',
  findingType: { findingTypeId: 'ft1', displayName: 'VersionMismatch' },
  resources: [
    { resourceId: 'si1', displayName: 'Application (ber-prod)', resourceType: 'SystemInstance' },
    { resourceId: 'mi1', displayName: 'CPU utilization', resourceType: 'MetricInstance' },
    { resourceId: 'nt1', displayName: 'git-sensor', resourceType: 'NodeType' },
    { resourceId: 't1', displayName: 'backend CPU warning', resourceType: 'Threshold' },
  ],
  annotations: {},
}

function mountDetail() {
  return mount(FindingDetail, { props: { finding, kind: 'VersionMismatch' } })
}

describe('FindingDetail resources', () => {
  it('links instances and types, leaves resources without a view as text', () => {
    const w = mountDetail()
    const titles = w.findAll('button[title^="Go to"]').map((b) => b.attributes('title'))
    expect(titles).toEqual(['Go to System Instance', 'Go to Metric Instance', 'Go to Node Type'])
    expect(w.text()).toContain('backend CPU warning')
    expect(w.find('button[title="Go to Threshold"]').exists()).toBe(false)
  })

  it('emits the resource type and id of a clicked link', async () => {
    const w = mountDetail()
    await w.find('button[title="Go to Metric Instance"]').trigger('click')
    expect(w.emitted('navigateResource')).toEqual([['MetricInstance', 'mi1']])
  })

  it('opens the finding type from the kind tag', async () => {
    const w = mountDetail()
    await w.find('button[title="Show finding type"]').trigger('click')
    expect(w.emitted('openType')).toEqual([['ft1']])
  })
})
