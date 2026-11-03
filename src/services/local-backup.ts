import { backupStateFrom, createBackup } from '../domain/backup'
import { useAppStore } from '../store/useAppStore'

export function downloadLocalBackup() {
  const backup = createBackup(backupStateFrom(useAppStore.getState()))
  const href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = href
  link.download = `forgepath-device-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(href), 1000)
}

