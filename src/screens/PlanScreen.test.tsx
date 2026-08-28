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
    fireEvent.click(within(blueprint).getByRole('button', { name: 'Preview full block' }))
    const blockPreview = screen.getByRole('dialog', { name: 'Full training-block preview' })
    expect(blockPreview).toHaveTextContent('Round 1 of 4')
    expect(blockPreview).toHaveTextContent('About 4 training weeks')
    expect(blockPreview).toHaveTextContent('Load, then repetitions, then sets')
    expect(blockPreview).toHaveTextContent('No fixed deload date')
    expect(blockPreview).toHaveTextContent('A deload is a proposal, not a calendar command.')
    fireEvent.click(within(blockPreview).getByRole('button', { name: 'Close preview' }))
    expect(blockPreview).not.toBeVisible()
    expect(within(blueprint).getAllByRole('button', { name: /for the current training block/i }).length).toBeGreaterThan(0)
    const dayToggles = within(blueprint).getAllByRole('button', { name: /day \d+:/i })
    expect(dayToggles).toHaveLength(sessions.filter((session) => (session.microcycleNumber ?? 1) === 1).length)
    expect(dayToggles[0]).toHaveAttribute('aria-expanded', 'true')
    expect(dayToggles[1]).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(dayToggles[1])
    expect(dayToggles[1]).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Show the upcoming session queue' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Show how life-aware planning works' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('offers an athlete-approved route to the safer repetition policy without rewriting the active plan', () => {
    useAppStore.setState((state) => ({
      ...state,
      mesocycles: state.mesocycles.map((plan) => ({
        ...plan,
        entryRoute: state.athlete.placement.selectedRoute,
        generationRuleVersion: 'route-session-v3' as const,
        placementCreatedAt: state.athlete.placement.createdAt,
        movementPlacements: structuredClone(state.athlete.placement.movementPlacements)
      }))
    }))
    render(<PlanScreen />)
    expect(screen.getByRole('status')).toHaveTextContent('Safer return-to-training repetitions are ready to review')
    expect(useAppStore.getState().mesocycles[0].generationRuleVersion).toBe('route-session-v3')
    fireEvent.click(screen.getByRole('button', { name: 'Review repetition update' }))
    expect(screen.getByRole('dialog', { name: 'Preview training-block version 2' })).toBeVisible()
  })

  it('commits one secondary movement and incline setup across future training rounds', () => {
    render(<PlanScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'Review and edit blueprint' }))
    const dialog = screen.getByRole('dialog', { name: 'Preview training-block version 2' })
    fireEvent.change(within(dialog).getByLabelText('Primary exercise for day 1'), { target: { value: 'low-bar-squat' } })
    fireEvent.change(within(dialog).getByLabelText('Secondary exercise for day 2'), { target: { value: 'incline-db-press' } })
    fireEvent.change(within(dialog).getByLabelText('Incline Dumbbell Press back-pad angle'), { target: { value: '45' } })
    fireEvent.change(within(dialog).getByLabelText('Why are you changing the plan?'), { target: { value: 'Use one repeatable incline setup for this block.' } })
    expect(dialog).toHaveTextContent('Scope: future workouts in this block')
    expect(dialog).toHaveTextContent('Completed workouts do not change')
    const applyButton = within(dialog).getByRole('button', { name: 'Apply version 2' })
    expect(applyButton).toBeDisabled()
    fireEvent.click(within(dialog).getByRole('checkbox', { name: /Apply these changes to future planned workouts/i }))
    expect(applyButton).toBeEnabled()
    fireEvent.click(applyButton)

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

  it('keeps a seven-day blueprint scannable while every day remains independently available', () => {
    render(<PlanScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'Review and edit blueprint' }))
    const dialog = screen.getByRole('dialog', { name: 'Preview training-block version 2' })
    fireEvent.change(within(dialog).getByLabelText('Opportunities / week'), { target: { value: '7' } })
    fireEvent.change(within(dialog).getByLabelText('Why are you changing the plan?'), { target: { value: 'Use a seven-day route without showing every workout at once.' } })
    const movementConfirmation = within(dialog).queryByRole('checkbox', { name: /Apply these changes to future planned workouts/i })
    if (movementConfirmation) fireEvent.click(movementConfirmation)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Apply version 2' }))

    const blueprint = screen.getByRole('region', { name: 'See the whole route before you train it.' })
    const dayToggles = within(blueprint).getAllByRole('button', { name: /day \d+:/i })
    expect(dayToggles).toHaveLength(7)
    expect(dayToggles[0]).toHaveAttribute('aria-expanded', 'true')
    dayToggles.slice(1).forEach((toggle) => expect(toggle).toHaveAttribute('aria-expanded', 'false'))
    fireEvent.click(dayToggles[6])
    expect(dayToggles[6]).toHaveAttribute('aria-expanded', 'true')
    expect(dayToggles[0]).toHaveAttribute('aria-expanded', 'true')
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
