import { describe, it, expect, beforeEach } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useColumnWidths } from '@/composables/useColumnWidths'

const COLUMNS = [
  { key: 'name', min: 120 },
  { key: 'subject', width: 200, min: 96 },
  { key: 'value', width: 128 },
] as const

const KEY = 'test-columns'

function setup(storageKey: string | undefined = KEY) {
  let api!: ReturnType<typeof useColumnWidths<'name' | 'subject' | 'value'>>
  const w = mount(
    defineComponent({
      setup() {
        api = useColumnWidths(COLUMNS, { storageKey })
        return () => h('table', [h('thead', [h('tr', [h('th', { id: 'name-th' }, 'Instance')])])])
      },
    }),
    { attachTo: document.body },
  )
  return { w, api }
}

function drag(
  api: ReturnType<typeof setup>['api'],
  key: 'name' | 'subject' | 'value',
  from: number,
  to: number,
  target?: HTMLElement,
) {
  const down = new MouseEvent('mousedown', { clientX: from, bubbles: true })
  if (target) {
    target.addEventListener('mousedown', (e) => api.onResizeStart(key, e), { once: true })
    target.dispatchEvent(down)
  } else {
    api.onResizeStart(key, down)
  }
  window.dispatchEvent(new MouseEvent('mousemove', { clientX: to }))
  window.dispatchEvent(new MouseEvent('mouseup'))
}

beforeEach(() => {
  localStorage.clear()
})

describe('useColumnWidths', () => {
  it('starts with the declared widths and an auto column', () => {
    const { api, w } = setup()
    expect(api.widths.value).toEqual({ name: undefined, subject: 200, value: 128 })
    expect(api.colStyle('subject')).toEqual({ width: '200px' })
    expect(api.colStyle('name')).toBeUndefined()
    expect(api.hasAuto.value).toBe(true)
    expect(api.minTotalWidth.value).toBe(120 + 200 + 128)
    w.unmount()
  })

  it('drags a fixed column, clamps at its minimum and persists', async () => {
    const { api, w } = setup()
    drag(api, 'subject', 100, 140)
    expect(api.widths.value.subject).toBe(240)
    expect(api.isResizing.value).toBe(false)
    drag(api, 'subject', 300, 0)
    expect(api.widths.value.subject).toBe(96)
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ subject: 96, value: 128 })
    await nextTick()
    w.unmount()
  })

  it('measures an auto column from its header cell and fixes it on drag', () => {
    const { api, w } = setup()
    const th = document.getElementById('name-th')!
    th.getBoundingClientRect = () => ({ width: 300 }) as DOMRect
    drag(api, 'name', 50, 80, th)
    expect(api.widths.value.name).toBe(330)
    expect(api.hasAuto.value).toBe(false)
    expect(api.minTotalWidth.value).toBe(330 + 200 + 128)
    w.unmount()
  })

  it('restores stored widths and resets a column to its initial width', () => {
    localStorage.setItem(KEY, JSON.stringify({ name: 260, subject: 10, value: 'x' }))
    const { api, w } = setup()
    // stored widths win, below-minimum ones are lifted, junk is ignored
    expect(api.widths.value).toEqual({ name: 260, subject: 96, value: 128 })
    api.reset('name')
    expect(api.widths.value.name).toBeUndefined()
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ subject: 96, value: 128 })
    w.unmount()
  })

  it('survives unusable stored data', () => {
    localStorage.setItem(KEY, '{not json')
    const { api, w } = setup()
    expect(api.widths.value.subject).toBe(200)
    w.unmount()
  })
})
