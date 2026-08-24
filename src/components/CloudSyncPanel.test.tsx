// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CloudRuntimeContext, type CloudRuntimeValue } from './cloud-runtime-context'

vi.mock('./Modal', () => ({
  Modal: ({ open, title, children }: { open: boolean; title: string; children: ReactNode }) => open
    ? <section role="dialog" aria-label={title}>{children}</section>
    : null
}))

import { CloudSyncPanel } from './CloudSyncPanel'

function runtime(): CloudRuntimeValue {
  return {
    session: {
      user: {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        email: 'athlete@example.com',
        user_metadata: {}
      }
    } as unknown as Session,
    saveState: 'saved',
    lastSavedAt: '2026-08-24T12:00:00.000Z',
    error: null,
    signOut: vi.fn(),
    sendVerificationLink: vi.fn(),
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

  it('does not expose password setup or password entry anywhere in account controls', () => {
    renderPanel(runtime())
    expect(screen.queryByRole('button', { name: /password/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  })

  it('requests fresh email verification and lets the server enforce recency for permanent actions', async () => {
    const value = runtime()
    renderPanel(value)

    fireEvent.click(screen.getByRole('button', { name: 'Reset training data' }))
    expect(screen.getByText(/sign-in link opened within the last five minutes/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Email me a fresh verification link' }))
    await waitFor(() => expect(value.sendVerificationLink).toHaveBeenCalledTimes(1))
    fireEvent.change(screen.getByLabelText('Type RESET to confirm'), { target: { value: 'RESET' } })
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Reset all training data' })).getByRole('button', { name: 'Reset training data' }))
    await waitFor(() => expect(value.resetData).toHaveBeenCalledWith())

    fireEvent.click(screen.getByRole('button', { name: 'Delete account and data' }))
    fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), { target: { value: 'DELETE' } })
    fireEvent.click(screen.getByRole('button', { name: 'Permanently delete account' }))
    await waitFor(() => expect(value.deleteAccount).toHaveBeenCalledWith())
  })
})
