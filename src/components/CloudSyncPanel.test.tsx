// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CloudRuntimeContext, type CloudRuntimeValue } from './cloud-runtime-context'

const passwordMocks = vi.hoisted(() => ({ updateCloudPassword: vi.fn() }))

vi.mock('../services/cloud-sync', async (importOriginal) => ({
  ...await importOriginal<typeof import('../services/cloud-sync')>(),
  ...passwordMocks
}))
vi.mock('./Modal', () => ({
  Modal: ({ open, title, children }: { open: boolean; title: string; children: ReactNode }) => open
    ? <section role="dialog" aria-label={title}>{children}</section>
    : null
}))

import { CloudSyncPanel } from './CloudSyncPanel'

function runtime(passwordReady: boolean): CloudRuntimeValue {
  return {
    session: {
      user: {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        email: 'athlete@example.com',
        user_metadata: { forgepath_password_ready: passwordReady }
      }
    } as unknown as Session,
    saveState: 'saved',
    lastSavedAt: '2026-08-24T12:00:00.000Z',
    error: null,
    signOut: vi.fn(),
    resetData: vi.fn(),
    deleteAccount: vi.fn(),
    retrySave: vi.fn()
  }
}

function renderPanel(value: CloudRuntimeValue) {
  render(<CloudRuntimeContext.Provider value={value}><CloudSyncPanel /></CloudRuntimeContext.Provider>)
}

describe('passwordless cloud account controls', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('sets a first password without asking for a password that does not exist', async () => {
    renderPanel(runtime(false))
    fireEvent.click(screen.getByRole('button', { name: 'Set a password' }))

    expect(screen.queryByLabelText('Current password')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'PrivatePath12!' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'PrivatePath12!' } })
    fireEvent.click(screen.getByRole('button', { name: 'Set password' }))

    await waitFor(() => expect(passwordMocks.updateCloudPassword).toHaveBeenCalledWith('PrivatePath12!', undefined))
  })

  it('lets the server enforce recent-link recency for reset and deletion', async () => {
    const value = runtime(false)
    renderPanel(value)

    fireEvent.click(screen.getByRole('button', { name: 'Reset training data' }))
    expect(screen.queryByLabelText('Current password')).not.toBeInTheDocument()
    expect(screen.getByText(/opened within the last five minutes/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Type RESET to confirm'), { target: { value: 'RESET' } })
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Reset all training data' })).getByRole('button', { name: 'Reset training data' }))
    await waitFor(() => expect(value.resetData).toHaveBeenCalledWith(undefined))

    fireEvent.click(screen.getByRole('button', { name: 'Delete account and data' }))
    fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), { target: { value: 'DELETE' } })
    fireEvent.click(screen.getByRole('button', { name: 'Permanently delete account' }))
    await waitFor(() => expect(value.deleteAccount).toHaveBeenCalledWith(undefined))
  })
})
