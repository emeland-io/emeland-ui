import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DetailErrorBanner from '@/components/detail/DetailErrorBanner.vue'
import ErrorState from '@/components/view/ErrorState.vue'
import ToastHost from '@/components/ToastHost.vue'
import { useToasts } from '@/composables/useToasts'

describe('DetailErrorBanner', () => {
  it('renders the static hint without a message', () => {
    const wrapper = mount(DetailErrorBanner)
    expect(wrapper.text()).toContain('Could not load full details')
  })

  it('renders the actual error message when provided', () => {
    const wrapper = mount(DetailErrorBanner, {
      props: { message: 'Invalid response for System s1: displayName: expected string' },
    })
    expect(wrapper.text()).toContain('Invalid response for System s1')
  })
})

describe('ErrorState', () => {
  it('renders the message without a retry button by default', () => {
    const wrapper = mount(ErrorState, { props: { message: 'Failed to load' } })
    expect(wrapper.text()).toContain('Failed to load')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('renders a retry button with the label and emits retry', async () => {
    const wrapper = mount(ErrorState, { props: { message: 'Failed', retryLabel: 'Retry' } })
    const button = wrapper.find('button')
    expect(button.text()).toBe('Retry')
    await button.trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})

describe('ToastHost', () => {
  it('renders pushed toasts with tone styling and dismisses them', async () => {
    const { toasts, pushError } = useToasts()
    toasts.value = []
    const wrapper = mount(ToastHost)

    pushError('Could not load detail: 404')
    await wrapper.vm.$nextTick()

    const toast = wrapper.find('[role="alert"]')
    expect(toast.exists()).toBe(true)
    expect(toast.text()).toContain('Could not load detail: 404')

    await toast.find('button').trigger('click')
    expect(useToasts().toasts.value).toHaveLength(0)
  })

  it('renders info toasts as status', async () => {
    const { toasts, push } = useToasts()
    toasts.value = []
    const wrapper = mount(ToastHost)

    push('Copied to clipboard', 'info')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[role="status"]').text()).toContain('Copied to clipboard')
  })
})
