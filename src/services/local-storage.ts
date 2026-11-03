// Storage failures must never look like a successful save.
let error: string | null = null
const listeners = new Set<() => void>()
export const localStorageError = () => error
export const subscribeLocalStorage = (listener: () => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
export function reportLocalStorageError(cause: unknown) {
  error = cause ? 'This device could not save your latest changes. Keep the app open and download a backup before closing it. Free device space, then try saving again.' : null
  listeners.forEach((listener) => listener())
}
