// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { athlete, equipmentProfiles, exercises, history, mesocycles, records, sessions } from '../domain/seed'
import { useAppStore } from '../store/useAppStore'
import { PlanScreen } from './PlanScreen'

describe('training-block blueprint', () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function showModal() { this.open = true }
    HTMLDialogElement.prototype.close = function close() { this.open = false }
    const values = new Map<string, string>()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        get length() { return values.size },
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        key: (index: number) => [...values.keys()][index] ?? null,
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, value)
      } satisfies Storage
    })
    useAppStore.getState().resetForTesting()
    useAppStore.setState((state) => ({
      ...state,
      athlete: structuredClone(athlete),
      equipmentProfiles: structuredClone(equipmentProfiles),
      exercises: structuredClone(exercises),
      history: structuredClone(history),
      records: structuredClone(records),
      sessions: structuredClone(sessions),
      mesocycles: structuredClone(mesocycles),
      activeMesocycleId: mesocycles[0].id,
      onboardingComplete: true,
      settings: { ...state.settings, activeEquipmentProfileId: equipmentProfiles[0].id, equipmentLocation: equipmentProfiles[0].name }
    }))
  })

  afterEach(cleanup)

  it('shows the weekly movement map and whole-block recovery route before editing', () => {
    render(<PlanScreen />)
    const blueprint = screen.getByRole('region', { name: 'See the whole route before you train it.' })
    expect(blueprint).toHaveTextContent('Round 1')
    expect(blueprint).toHaveTextContent('Round 4')
    expect(blueprint).toHaveTextContent('Block review')
    expect(blueprint).toHaveTextContent('Primary')
    expect(blueprint).toHaveTextContent('Secondary')
    expect(blueprint).toHaveTextContent('Accessory')
    expect(blueprint).toHaveTextContent('Tertiary')
    expect(blueprint).toHaveTextContent('Deload is proposed from evidence')
  })

  it('commits one secondary movement and incline setup across future training rounds', () => {
    render(<PlanScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'Review and edit blueprint' }))
    const dialog = screen.getByRole('dialog', { name: 'Preview training-block version 2' })
    fireEvent.change(within(dialog).getByLabelText('Primary exercise for day 1'), { target: { value: 'low-bar-squat' } })
    fireEvent.change(within(dialog).getByLabelText('Secondary exercise for day 2'), { target: { value: 'incline-db-press' } })
    fireEvent.change(within(dialog).getByLabelText('Incline Dumbbell Press back-pad angle'), { target: { value: '45' } })
    fireEvent.change(within(dialog).getByLabelText('Why are you changing the plan?'), { target: { value: 'Use one repeatable incline setup for this block.' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Apply version 2' }))

    const state = useAppStore.getState()
    const plan = state.mesocycles.find((candidate) => candidate.id === state.activeMesocycleId)!
    expect(plan.movementOverrides).toContainEqual({ sessionIndex: 0, slotIndex: 0, exerciseId: 'low-bar-squat', source: 'athlete' })
    expect(plan.movementOverrides).toContainEqual({ sessionIndex: 1, slotIndex: 1, exerciseId: 'incline-db-press', benchAngleDeg: 45, source: 'athlete' })
    const squatDay = state.sessions.find((session) => session.mesocycleId === plan.id && session.exercises[0]?.exerciseId === 'low-bar-squat')!
    expect(squatDay).toBeTruthy()
    const benchDay = state.sessions.find((session) => session.mesocycleId === plan.id && session.exercises[0]?.exerciseId === 'competition-bench')!
    expect(benchDay.exercises[1].exerciseId).toBe('incline-db-press')
    expect(benchDay.exercises[1].sets.every((workSet) => workSet.benchAngleDeg === 45)).toBe(true)
  })

  it('carries a completed blueprint forward and flags movement feedback for the next block', () => {
    useAppStore.setState((state) => ({
      ...state,
      activeMesocycleId: null,
      mesocycles: state.mesocycles.map((plan) => ({ ...plan, status: 'completed' as const })),
      exercises: state.exercises.map((exercise) => exercise.id === 'competition-bench' ? { ...exercise, disliked: true } : exercise)
    }))

    render(<PlanScreen />)

    const review = screen.getByRole('region', { name: 'Start from what worked. Change what needs attention.' })
    expect(review).toHaveTextContent('Competition Bench Press')
    expect(review).toHaveTextContent('Change suggested')
    expect(screen.getByRole('button', { name: 'Review and edit blueprint' })).toBeEnabled()
  })
})
