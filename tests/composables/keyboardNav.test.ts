/* eslint-disable vue/one-component-per-file -- test fixtures need several small components */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApp, defineComponent, h, ref, nextTick, KeepAlive } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'
import { useListKeyboardNav } from '@/composables/useListKeyboardNav'
import { useInstanceCursorNav } from '@/composables/useInstanceCursorNav'
import { useGraphKeyToggles } from '@/composables/useGraphKeyToggles'
import { useWindowKeydown } from '@/composables/useWindowKeydown'
import { useFocusSearch } from '@/composables/useFocusSearch'
import { useSidebarNav } from '@/composables/useSidebarNav'
import { useTabGuard } from '@/composables/useTabGuard'
import SlideOverDrawer from '@/components/SlideOverDrawer.vue'
import CommandPalette from '@/components/CommandPalette.vue'
import { useCommandPalette } from '@/composables/useCommandPalette'
import { useSystemStore } from '@/stores/systems'
import { systems as mockSystems } from '@/mocks/systems'
import { useModalSurfaces } from '@/composables/useModalSurfaces'
import { useShortcutsHelp } from '@/composables/useShortcutsHelp'

function mountWith(setup: () => void) {
  const App = defineComponent({
    setup() {
      setup()
      return () => h('div')
    },
  })
  const el = document.createElement('div')
  document.body.appendChild(el)
  const app = createApp(App)
  app.mount(el)
  return () => {
    app.unmount()
    el.remove()
  }
}

function press(key: string, options: { shift?: boolean; target?: EventTarget } = {}) {
  const e = new KeyboardEvent('keydown', {
    key,
    shiftKey: options.shift ?? false,
    bubbles: true,
    cancelable: true,
  })
  ;(options.target ?? window).dispatchEvent(e)
  return e
}

function editableInput(): HTMLInputElement {
  const input = document.createElement('input')
  document.body.appendChild(input)
  return input
}

function searchInput(): HTMLInputElement {
  const input = document.createElement('input')
  input.dataset.searchInput = ''
  document.body.appendChild(input)
  return input
}

function mountPalette() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/systems', name: 'Systems', component: { template: '<div/>' } },
      { path: '/:pathMatch(.*)*', component: { template: '<div/>' } },
    ],
  })
  const App = defineComponent({
    setup: () => () => h(CommandPalette),
  })
  const el = document.createElement('div')
  document.body.appendChild(el)
  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.mount(el)
  unmounts.push(() => {
    app.unmount()
    el.remove()
  })
  const palette = useCommandPalette()
  palette.close()
  return { router, palette }
}

function pressK() {
  const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true, cancelable: true })
  window.dispatchEvent(e)
  return e
}

const unmounts: (() => void)[] = []
beforeEach(() => {
  // jsdom has no scrollIntoView
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => {
  unmounts.forEach((u) => u())
  unmounts.length = 0
  document.body.innerHTML = ''
  // reset the app-wide singletons between tests
  useModalSurfaces().drawerOpenCount.value = 0
  useCommandPalette().close()
  useShortcutsHelp().close()
})

describe('useListKeyboardNav', () => {
  function setup(ids: string[], blocked = ref(false)) {
    const selectedId = ref(ids[0] ?? '')
    const select = vi.fn((id: string) => (selectedId.value = id))
    const overflow = vi.fn()
    unmounts.push(mountWith(() => useListKeyboardNav(ids, selectedId, select, blocked, overflow)))
    return { selectedId, select, overflow, blocked }
  }

  it('steps the selection down/up through the rows', () => {
    const { select } = setup(['a', 'b', 'c'])
    press('ArrowDown')
    expect(select).toHaveBeenCalledWith('b')
    press('ArrowDown')
    expect(select).toHaveBeenCalledWith('c')
  })

  it('clamps at the top end instead of scrolling or wrapping', () => {
    const { select } = setup(['a', 'b'])
    press('ArrowUp')
    expect(select).not.toHaveBeenCalled()
  })

  it('fires the overflow past the last row instead of stepping further', () => {
    const { select, overflow } = setup(['a'])
    press('ArrowDown')
    expect(overflow).toHaveBeenCalledOnce()
    expect(select).not.toHaveBeenCalled()
  })

  it('ignores arrows while blocked (drawer open) or typing in an input', () => {
    const { select, blocked } = setup(['a', 'b'])
    blocked.value = true
    press('ArrowDown')
    expect(select).not.toHaveBeenCalled()
    blocked.value = false
    press('ArrowDown', { target: editableInput() })
    expect(select).not.toHaveBeenCalled()
  })

  it('stops the event so a later listener never sees a consumed arrow', () => {
    setup(['a', 'b'])
    const spy = vi.fn()
    window.addEventListener('keydown', spy)
    press('ArrowDown')
    expect(spy).not.toHaveBeenCalled()
    window.removeEventListener('keydown', spy)
  })
})

describe('useInstanceCursorNav', () => {
  function setup(ids: string[], blocked = ref(false)) {
    const cursor = ref('')
    const open = vi.fn()
    unmounts.push(mountWith(() => useInstanceCursorNav(ids, cursor, open, blocked)))
    return { cursor, open, blocked }
  }

  it('enters at the first instance on → and steps forward', () => {
    const { cursor } = setup(['i1', 'i2', 'i3'])
    press('ArrowRight')
    expect(cursor.value).toBe('i1')
    press('ArrowRight')
    expect(cursor.value).toBe('i2')
  })

  it('enters at the last instance on ← and clamps at both ends', () => {
    const { cursor } = setup(['i1', 'i2'])
    press('ArrowLeft')
    expect(cursor.value).toBe('i2')
    press('ArrowLeft')
    expect(cursor.value).toBe('i1')
    press('ArrowLeft')
    expect(cursor.value).toBe('i1')
  })

  it('opens the cursor instance on Enter, but not on Shift+Enter', () => {
    const { open } = setup(['i1'])
    press('ArrowRight')
    press('Enter')
    expect(open).toHaveBeenCalledWith('i1')
    open.mockClear()
    press('Enter', { shift: true })
    expect(open).not.toHaveBeenCalled()
  })

  it('clears the cursor on Escape', () => {
    const { cursor } = setup(['i1'])
    press('ArrowRight')
    expect(cursor.value).toBe('i1')
    press('Escape')
    expect(cursor.value).toBe('')
  })

  it('ignores arrows while blocked (drawer open)', () => {
    const { cursor, blocked } = setup(['i1'])
    blocked.value = true
    press('ArrowRight')
    expect(cursor.value).toBe('')
  })
})

describe('useGraphKeyToggles', () => {
  it('fires the bound action for plain letters only', () => {
    const toggle = vi.fn()
    unmounts.push(mountWith(() => useGraphKeyToggles({ i: toggle })))
    press('i')
    expect(toggle).toHaveBeenCalledOnce()
    toggle.mockClear()
    press('i', { shift: true })
    expect(toggle).not.toHaveBeenCalled()
    press('x')
    expect(toggle).not.toHaveBeenCalled()
    press('i', { target: editableInput() })
    expect(toggle).not.toHaveBeenCalled()
  })
})

describe('useFocusSearch', () => {
  it('focuses and selects the search input on /', () => {
    unmounts.push(mountWith(() => useFocusSearch()))
    const input = searchInput()
    input.value = 'abc'
    press('/')
    expect(document.activeElement).toBe(input)
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(3)
  })

  it('does not steal / while typing in another field', () => {
    unmounts.push(mountWith(() => useFocusSearch()))
    const search = searchInput()
    const other = editableInput()
    press('/', { target: other })
    expect(document.activeElement).not.toBe(search)
  })

  it('blurs the search on Escape inside it', () => {
    unmounts.push(mountWith(() => useFocusSearch()))
    const input = searchInput()
    input.focus()
    press('Escape', { target: input })
    expect(document.activeElement).not.toBe(input)
  })
})

describe('useSidebarNav', () => {
  function setup(atPath = '/systems') {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
    })
    let nav!: ReturnType<typeof useSidebarNav>
    const App = defineComponent({
      setup() {
        nav = useSidebarNav()
        return () => h('div')
      },
    })
    const el = document.createElement('div')
    document.body.appendChild(el)
    const app = createApp(App)
    app.use(createPinia())
    app.use(router)
    app.mount(el)
    unmounts.push(() => {
      app.unmount()
      el.remove()
    })
    return router.push(atPath).then(() => nav)
  }

  it('activates on the current route item, walks, and leaves', async () => {
    const nav = await setup('/systems')
    expect(nav.active.value).toBe(false)
    press('b')
    expect(nav.active.value).toBe(true)
    expect(nav.cursorRoute.value).toBe('/systems')
    press('ArrowDown')
    expect(nav.cursorRoute.value).toBe('/components')
    press('ArrowUp')
    expect(nav.cursorRoute.value).toBe('/systems')
    press('Escape')
    expect(nav.active.value).toBe(false)
  })

  it('clamps at the first item', async () => {
    const nav = await setup('/findings')
    press('b')
    expect(nav.cursorRoute.value).toBe('/findings')
    press('ArrowUp')
    expect(nav.cursorRoute.value).toBe('/findings')
  })

  it('deactivates after Enter (jump and work)', async () => {
    const nav = await setup('/systems')
    press('b')
    press('ArrowDown')
    press('Enter')
    expect(nav.active.value).toBe(false)
  })

  it('does not activate while typing in a field', async () => {
    const nav = await setup('/systems')
    press('b', { target: editableInput() })
    expect(nav.active.value).toBe(false)
  })
})

describe('SlideOverDrawer focus flow', () => {
  function mountDrawer(props: Record<string, unknown> = {}) {
    const close = vi.fn()
    const prev = vi.fn()
    const next = vi.fn()
    const Root = defineComponent({
      setup() {
        return () =>
          h(
            SlideOverDrawer,
            {
              open: true,
              title: 'T',
              navCount: 3,
              navIndex: 0,
              onClose: close,
              onNavPrev: prev,
              onNavNext: next,
              ...props,
            },
            {
              default: () =>
                h('div', [
                  h('button', { id: 'rel-a', 'data-drawer-relation': '' }, 'A'),
                  h('button', { id: 'rel-b', 'data-drawer-relation': '' }, 'B'),
                ]),
            },
          )
      },
    })
    const el = document.createElement('div')
    document.body.appendChild(el)
    const app = createApp(Root)
    app.mount(el)
    unmounts.push(() => {
      app.unmount()
      el.remove()
    })
    return { close, prev, next }
  }

  const panel = () => document.querySelector<HTMLElement>('aside')!
  const byId = (id: string) => document.getElementById(id) as HTMLElement

  it('focuses the panel root on open, then Tab cycles only through relations with wrap', async () => {
    mountDrawer()
    await nextTick()
    expect(document.activeElement).toBe(panel())
    // only relation rows are stops: root -> rel-a -> rel-b -> root
    press('Tab')
    expect(document.activeElement).toBe(byId('rel-a'))
    press('Tab')
    expect(document.activeElement).toBe(byId('rel-b'))
    press('Tab') // wraps to the root (header buttons are not stops)
    expect(document.activeElement).toBe(panel())
    press('Tab', { shift: true }) // backwards from root wraps to the last relation
    expect(document.activeElement).toBe(byId('rel-b'))
  })

  it('the first Tab reaches a relation even when focus was left outside', async () => {
    mountDrawer()
    await nextTick()
    // a click in the list / the search field parked focus outside the drawer
    editableInput().focus()
    expect(document.activeElement).not.toBe(panel())
    press('Tab')
    expect(document.activeElement).toBe(byId('rel-a'))
  })

  it('Esc steps back: content focus -> root, root -> close', async () => {
    const { close } = mountDrawer()
    await nextTick()
    press('Tab') // rel-a
    expect(document.activeElement).toBe(byId('rel-a'))
    press('Escape')
    expect(document.activeElement).toBe(panel())
    expect(close).not.toHaveBeenCalled()
    press('Escape')
    expect(close).toHaveBeenCalledOnce()
  })

  it('arrows always step the collection, even with a relation focused', async () => {
    const { next } = mountDrawer()
    await nextTick()
    press('Tab')
    press('ArrowDown')
    expect(next).toHaveBeenCalledOnce()
  })
})

describe('CommandPalette', () => {
  it('toggles with ⌘K, focuses the input, closes on Escape', async () => {
    const { palette } = mountPalette()
    expect(palette.open.value).toBe(false)
    pressK()
    expect(palette.open.value).toBe(true)
    await nextTick()
    await nextTick() // the open watcher focuses after its own tick
    const input = document.querySelector<HTMLElement>('[role="dialog"] input')!
    expect(document.activeElement).toBe(input)
    press('Escape')
    expect(palette.open.value).toBe(false)
  })

  it('hydrates unvisited stores on open, walks results, Enter navigates with ?select=', async () => {
    const { router, palette } = mountPalette()
    pressK()
    const systemStore = useSystemStore()
    await vi.waitFor(() => expect(systemStore.systems.length).toBeGreaterThan(0))
    await nextTick()
    const input = document.querySelector<HTMLInputElement>('[role="dialog"] input')!
    const grafana = mockSystems.find((s) => s.displayName === 'Grafana')!
    input.value = 'grafana'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    press('Enter')
    expect(palette.open.value).toBe(false)
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('Systems'))
    expect(router.currentRoute.value.query.select).toBe(grafana.systemId)
  })
})

describe('useTabGuard', () => {
  it('swallows Tab in the plain view, so focus cannot wander off', () => {
    unmounts.push(mountWith(() => useTabGuard()))
    expect(press('Tab').defaultPrevented).toBe(true)
    expect(press('Tab', { shift: true }).defaultPrevented).toBe(true)
  })

  it('yields Tab to an open surface, which contains it itself', () => {
    unmounts.push(mountWith(() => useTabGuard()))
    const { drawerOpenCount } = useModalSurfaces()
    drawerOpenCount.value = 1
    expect(press('Tab').defaultPrevented).toBe(false)
    drawerOpenCount.value = 0
    expect(press('Tab').defaultPrevented).toBe(true)
  })
})

describe('modal-surface awareness', () => {
  it('/ does not steal focus to the search while a surface is open', () => {
    unmounts.push(mountWith(() => useFocusSearch()))
    const input = searchInput()
    const { anyModalOpen, drawerOpenCount } = useModalSurfaces()
    drawerOpenCount.value = 1 // simulate an open drawer
    expect(anyModalOpen.value).toBe(true)
    press('/')
    expect(document.activeElement).not.toBe(input)
    drawerOpenCount.value = 0
    press('/')
    expect(document.activeElement).toBe(input)
  })

  it('an open drawer registers in the shared open count (and unregisters on close)', async () => {
    expect(useModalSurfaces().drawerOpenCount.value).toBe(0)
    const open = ref(true)
    const Root = defineComponent({
      setup: () => () => h(SlideOverDrawer, { open: open.value, title: 'T' }),
    })
    const el = document.createElement('div')
    document.body.appendChild(el)
    const app = createApp(Root)
    app.mount(el)
    unmounts.push(() => {
      app.unmount()
      el.remove()
    })
    await nextTick()
    expect(useModalSurfaces().drawerOpenCount.value).toBe(1)
    open.value = false
    await nextTick()
    expect(useModalSurfaces().drawerOpenCount.value).toBe(0)
  })

  it('the palette contains Tab (input <-> close), never the page behind', async () => {
    mountPalette()
    pressK()
    await nextTick()
    await nextTick()
    const dialog = document.querySelector('[role="dialog"]')!
    const input = dialog.querySelector('input')!
    const closeBtn = dialog.querySelector('button')!
    expect(document.activeElement).toBe(input)
    press('Tab')
    expect(document.activeElement).toBe(closeBtn)
    press('Tab')
    expect(document.activeElement).toBe(input)
    press('Tab', { shift: true })
    expect(document.activeElement).toBe(closeBtn)
  })
})

describe('useWindowKeydown (keep-alive awareness)', () => {
  function makeSpyView(name: string, spy: (e: KeyboardEvent) => void) {
    return defineComponent({
      name,
      setup() {
        useWindowKeydown(spy)
        return () => h('div')
      },
    })
  }

  it('only the active view receives keys when views are kept alive', async () => {
    const spyA = vi.fn()
    const spyB = vi.fn()
    const current = ref<'A' | 'B'>('A')
    const A = makeSpyView('A', spyA)
    const B = makeSpyView('B', spyB)
    const Root = defineComponent({
      setup() {
        return () => h(KeepAlive, () => (current.value === 'A' ? h(A) : h(B)))
      },
    })
    const el = document.createElement('div')
    document.body.appendChild(el)
    const app = createApp(Root)
    app.mount(el)

    press('ArrowDown')
    expect(spyA).toHaveBeenCalledTimes(1)
    expect(spyB).not.toHaveBeenCalled()

    current.value = 'B'
    await nextTick()
    press('ArrowDown')
    expect(spyA).toHaveBeenCalledTimes(1)
    expect(spyB).toHaveBeenCalledTimes(1)

    current.value = 'A'
    await nextTick()
    press('ArrowDown')
    expect(spyA).toHaveBeenCalledTimes(2)
    expect(spyB).toHaveBeenCalledTimes(1)

    app.unmount()
    el.remove()
  })
})
