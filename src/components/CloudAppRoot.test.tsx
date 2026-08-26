// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  requestPrivateSignIn: vi.fn()
}))

vi.mock('../services/cloud-sync', async (importOriginal) => ({
  ...await importOriginal<typeof import('../services/cloud-sync')>(),
  ...authMocks
}))

import { CloudAuth, CloudLoading } from './CloudAppRoot'

describe('cloud account gate', () => {
  beforeEach(() => vi.clearAllMocks())

  afterEach(cleanup)

  it('offers only the invited-email link flow and keeps the response account-neutral', async () => {
    render(<CloudAuth />)
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /password|forgot/i })).not.toBeInTheDocument()
    expect(screen.getByText(/invited by the creator/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: ' Athlete@Example.com ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Log in with email' }))

    await waitFor(() => expect(authMocks.requestPrivateSignIn).toHaveBeenCalledWith('Athlete@Example.com'))
    expect(screen.getByRole('status')).toHaveTextContent(/If that email was invited, open the private confirmation link/i)
  })
})

describe('cloud load failure recovery', () => {
  afterEach(cleanup)

  it('offers a stale-build repair and a way out instead of retry alone', () => {
    const retry = vi.fn()
    const refresh = vi.fn()
    const signOut = vi.fn()
    const recover = vi.fn()
    render(<CloudLoading error="Athlete placement is invalid." retry={retry} refresh={refresh} signOut={signOut} recover={recover} />)

    expect(screen.getByRole('heading', { name: 'Cloud data did not load' })).toBeInTheDocument()
    expect(screen.getByText(/older copy of ForgePath/i)).toBeInTheDocument()
    expect(screen.getByText(/saved training is not touched/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    fireEvent.click(screen.getByRole('button', { name: 'Download pending recovery' }))
    fireEvent.click(screen.getByRole('button', { name: 'Update ForgePath' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(retry).toHaveBeenCalledTimes(1)
    expect(recover).toHaveBeenCalledTimes(1)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('keeps the plain loading state free of recovery controls', () => {
    render(<CloudLoading />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByRole('heading', { name: /Opening your private training journal/i })).toBeInTheDocument()
  })
})
