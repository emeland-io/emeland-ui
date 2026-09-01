import { ref } from 'vue'

export type ToastTone = 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  message: string
  tone: ToastTone
}

const AUTO_DISMISS_MS = 6000
const MAX_TOASTS = 3

let nextId = 1

// app-wide singleton: the host is mounted once (in BaseLayout), any layer
// can push — including the store boundary where no component exists
const toasts = ref<Toast[]>([])
const visibleMessages = new Set<string>()

export function useToasts() {
  function dismiss(id: number): void {
    const t = toasts.value.find((t) => t.id === id)
    if (t) visibleMessages.delete(t.message)
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function push(message: string, tone: ToastTone = 'info'): void {
    if (!message) return
    // dedupe: the same message never stacks twice while visible
    if (visibleMessages.has(message)) return
    visibleMessages.add(message)

    const toast: Toast = { id: nextId++, message, tone }
    toasts.value = [...toasts.value, toast].slice(-MAX_TOASTS)
    // dropped by the cap? keep its message visible-blocked only if still shown
    for (const t of visibleMessages) {
      if (!toasts.value.some((x) => x.message === t)) visibleMessages.delete(t)
    }
    setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS)
  }

  function pushError(message: string): void {
    push(message, 'error')
  }

  return { toasts, push, pushError, dismiss }
}
