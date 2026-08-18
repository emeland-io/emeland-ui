/**
 * localStorage when actually usable, some environments (test runners, privacy
 * modes) expose a global without working methods. Returns undefined instead of
 * throwing so callers can fall back to defaults
 */
export function safeStorage(): Storage | undefined {
  return typeof localStorage !== 'undefined' &&
    typeof localStorage.getItem === 'function' &&
    typeof localStorage.setItem === 'function'
    ? localStorage
    : undefined
}
