// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { Session, User } from '@supabase/supabase-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  requestPasswordRecovery: vi.fn(),
  requestPrivateSignIn: vi.fn(),
  signInWithPassword: vi.fn(),
  updateCloudPassword: vi.fn()
}))

vi.mock('../services/cloud-sync', async (importOriginal) => ({
  ...await importOriginal<typeof import('../services/cloud-sync')>(),
  ...authMocks
}))

import { passwordModeFor } from '../services/cloud-auth-policy'
import { CloudAuth } from './CloudAppRoot'

const user = (passwordReady: boolean) => ({
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  user_metadata: { forgepath_password_ready: passwordReady }
}) as unknown as User

const session = (passwordReady: boolean) => ({ user: user(passwordReady) }) as unknown as Session

describe('cloud account gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMocks.updateCloudPassword.mockResolvedValue(user(true))
  })

  afterEach(cleanup)

  it('keeps first-time invite sessions in setup and recovery sessions in recovery', () => {
    expect(passwordModeFor(null, false)).toBeNull()
    expect(passwordModeFor(session(false), false)).toBe('setup')
    expect(passwordModeFor(session(true), false)).toBeNull()
    expect(passwordModeFor(session(true), true)).toBe('recovery')
  })

  it('explains verified invitation setup and completes it only after a strong matching password', async () => {
    const onPasswordComplete = vi.fn()
    render(<CloudAuth passwordMode="setup" onPasswordComplete={onPasswordComplete} />)

    expect(screen.getByRole('heading', { name: 'Create your ForgePath password' })).toBeInTheDocument()
    expect(screen.getByText(/Your email is verified/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'PrivatePath12!' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'PrivatePath12!' } })
    fireEvent.click(screen.getByRole('button', { name: /Save new password/i }))

    await waitFor(() => expect(authMocks.updateCloudPassword).toHaveBeenCalledWith('PrivatePath12!'))
    expect(onPasswordComplete).toHaveBeenCalledWith(expect.objectContaining({ id: user(true).id }))
  })

  it('does not submit weak or mismatched passwords', async () => {
    render(<CloudAuth passwordMode="setup" onPasswordComplete={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'too-short' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'different' } })
    fireEvent.click(screen.getByRole('button', { name: /Save new password/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/12 characters/i)
    expect(authMocks.updateCloudPassword).not.toHaveBeenCalled()
  })

  it('keeps invitation email links non-signup and recovery messages account-neutral', async () => {
    render(<CloudAuth passwordMode={null} onPasswordComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'I have an invitation' }))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: ' Athlete@Example.com ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send secure link' }))

    await waitFor(() => expect(authMocks.requestPrivateSignIn).toHaveBeenCalledWith('Athlete@Example.com'))
    expect(screen.getByRole('status')).toHaveTextContent(/If that email was invited/i)
  })

  it('uses the dedicated password-recovery explanation after a verified recovery link', () => {
    render(<CloudAuth passwordMode="recovery" onPasswordComplete={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Choose a new password' })).toBeInTheDocument()
    expect(screen.getByText(/recovery link is verified/i)).toBeInTheDocument()
  })
})
