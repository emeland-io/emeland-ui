import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { errorMessage, reportError } from '@/utils/errors'
import { loadOnce, loadDetailRef } from '@/stores/support'
import { useResourceErrors, loadDetailInto } from '@/composables/useResourceErrors'

let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('errorMessage', () => {
  it('unwraps Error instances', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom')
  })

  it('passes strings through', () => {
    expect(errorMessage('plain failure')).toBe('plain failure')
  })

  it('serializes thrown non-errors instead of yielding undefined', () => {
    expect(errorMessage({ status: 502 })).toBe('{"status":502}')
    expect(errorMessage(undefined)).toBe(String(undefined))
  })

  it('survives unserializable values', () => {
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    expect(errorMessage(cyclic)).toBe(String(cyclic))
  })

  it('never throws, even for objects whose toString() throws', () => {
    const hostile = {
      toJSON() {
        throw new Error('no json')
      },
      toString() {
        throw new Error('no string')
      },
    }
    expect(errorMessage(hostile)).toBe('unknown error')
  })
})

describe('reportError', () => {
  it('logs the original error and returns the message', () => {
    const err = new Error('kaput')
    expect(reportError('store.load', err)).toBe('kaput')
    expect(errorSpy).toHaveBeenCalledWith('[store.load]', err)
  })
})

describe('loadOnce', () => {
  function flags() {
    return { loading: ref(false), loaded: ref(false), error: ref<string | null>(null) }
  }

  it('happy path: loads once, no error, no log', async () => {
    const f = flags()
    await loadOnce(f, async () => {})
    expect(f.loaded.value).toBe(true)
    expect(f.error.value).toBeNull()
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('records the message of a thrown Error and logs it', async () => {
    const f = flags()
    await loadOnce(f, async () => {
      throw new Error('backend down')
    })
    expect(f.error.value).toBe('backend down')
    expect(f.loaded.value).toBe(false)
    expect(errorSpy).toHaveBeenCalled()
  })

  it('records a message for thrown non-errors (no raw cast)', async () => {
    const f = flags()
    await loadOnce(f, async () => {
      throw { code: 'ECONN' }
    })
    expect(f.error.value).toBe('{"code":"ECONN"}')
  })
})

describe('loadDetailRef', () => {
  it('clears the target and logs on failure', async () => {
    const target = ref<string | null>('stale')
    await loadDetailRef(target, async () => {
      throw new Error('detail failed')
    })
    expect(target.value).toBeNull()
    expect(errorSpy).toHaveBeenCalled()
  })
})

describe('useResourceErrors', () => {
  it('records a message per failed detail and clears on success', async () => {
    const errs = useResourceErrors()
    await loadDetailInto(
      'id-1',
      async () => {
        throw new Error('not reachable')
      },
      () => {},
      errs,
    )
    expect(errs.hasDetailError('id-1')).toBe(true)
    expect(errs.detailErrorMessage('id-1')).toBe('not reachable')

    await loadDetailInto('id-1', async () => 'full', () => {}, errs)
    expect(errs.hasDetailError('id-1')).toBe(false)
    expect(errs.detailErrorMessage('id-1')).toBeUndefined()
  })
})
