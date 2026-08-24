// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const appShellMocks = vi.hoisted(() => ({
  checkForAppUpdate: vi.fn(),
  readAppVersionStatus: vi.fn()
}))

vi.mock('../services/app-shell', () => appShellMocks)

import { AppUpdateNotice } from './AppUpdateNotice'

describe('app update notice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    appShellMocks.checkForAppUpdate.mockResolvedValue(true)
  })

  afterEach(cleanup)

  it('shows a persistent refresh action when the published build changes', async () => {
    const available = 'b'.repeat(40)
    appShellMocks.readAppVersionStatus.mockResolvedValue({ installed: 'a'.repeat(40), available, updateAvailable: true })
    const onRefresh = vi.fn(async () => undefined)

    render(<AppUpdateNotice onRefresh={onRefresh} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('A new ForgePath update is ready')
    expect(screen.queryByRole('button', { name: /dismiss|close/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Refresh now' }))
    await waitFor(() => expect(onRefresh).toHaveBeenCalledWith(available))
  })

  it('stays out of the way when this page already has the published build', async () => {
    appShellMocks.readAppVersionStatus.mockResolvedValue({ installed: 'a'.repeat(40), available: 'a'.repeat(40), updateAvailable: false })
    render(<AppUpdateNotice onRefresh={vi.fn()} />)
    await waitFor(() => expect(appShellMocks.readAppVersionStatus).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('keeps the notice visible when saving or refreshing fails', async () => {
    appShellMocks.readAppVersionStatus.mockResolvedValue({ installed: 'a'.repeat(40), available: 'b'.repeat(40), updateAvailable: true })
    render(<AppUpdateNotice onRefresh={vi.fn(async () => { throw new Error('Your latest change has not reached Supabase yet.') })} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Refresh now' }))
    expect(await screen.findByText('Your latest change has not reached Supabase yet.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Refresh now' })).toBeEnabled()
  })
})
