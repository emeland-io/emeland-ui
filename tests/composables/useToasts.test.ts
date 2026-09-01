import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToasts } from '@/composables/useToasts'

beforeEach(() => {
  vi.useFakeTimers()
  // reset the module singleton between tests
  useToasts().toasts.value = []
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useToasts', () => {
  it('pushes and dismisses toasts', () => {
    const { toasts, push, dismiss } = useToasts()
    push('hello')
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('hello')
    expect(toasts.value[0].tone).toBe('info')
    dismiss(toasts.value[0].id)
    expect(toasts.value).toHaveLength(0)
  })

  it('pushError uses the error tone', () => {
    const { toasts, pushError } = useToasts()
    pushError('boom')
    expect(toasts.value[0].tone).toBe('error')
  })

  it('dedupes identical messages while visible', () => {
    const { toasts, push } = useToasts()
    push('same')
    push('same', 'warning')
    push('same')
    expect(toasts.value).toHaveLength(1)
  })

  it('allows the same message again after dismissal', () => {
    const { toasts, push, dismiss } = useToasts()
    push('again')
    dismiss(toasts.value[0].id)
    push('again')
    expect(toasts.value).toHaveLength(1)
  })

  it('auto-dismisses after 6s', () => {
    const { toasts, push } = useToasts()
    push('temporary')
    vi.advanceTimersByTime(5999)
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(toasts.value).toHaveLength(0)
  })

  it('caps the stack at three, dropping the oldest', () => {
    const { toasts, push } = useToasts()
    push('one')
    push('two')
    push('three')
    push('four')
    expect(toasts.value.map((t) => t.message)).toEqual(['two', 'three', 'four'])
  })

  it('re-allows a capped-out message', () => {
    const { toasts, push } = useToasts()
    push('one')
    push('two')
    push('three')
    push('four') // evicts "one"
    push('one')
    expect(toasts.value.map((t) => t.message)).toEqual(['three', 'four', 'one'])
  })

  it('ignores empty messages', () => {
    const { toasts, push } = useToasts()
    push('')
    expect(toasts.value).toHaveLength(0)
  })
})
