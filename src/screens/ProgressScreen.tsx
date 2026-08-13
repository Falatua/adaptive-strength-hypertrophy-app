import { useMemo, useState } from 'react'
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, BrainCircuit, CalendarClock, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Dumbbell, HeartPulse, Layers3, Link2, ListOrdered, Sparkles, Target, Trophy } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  analyticsReconciliation,
  areaVolumeFor,
  buildAnalytics,
  exerciseMixFor,
  exerciseVolumeFor,
  plannedVsCompletedDoseFor,
  priorityAttentionFor,
  progressRanges,
  rangeWindow,
  regionVolumeFor,
  type BodyLens,
  type ProgressRange
} from '../domain/analytics'
import { useAppStore } from '../store/useAppStore'
import { athleteLevel } from '../domain/athlete-level-engine'
import { PixelAvatar } from '../components/PixelAvatar'
import { CollapsiblePanel } from '../components/CollapsiblePanel'
import { LevelProgress } from '../components/LevelProgress'
import { StatCard } from '../components/StatCard'
import { deriveAchievementEvents, deriveRecordOpportunities } from '../domain/history-engine'
import { filterMuscleDose, filterPlannedMuscleDose, muscleDoseFor, plannedMuscleDoseFor, type MuscleDoseLens } from '../domain/muscle-dose'
import { decideMuscleVolume, forecastDeload, summarizeMuscleFeedback, volumeZone } from '../domain/volume-progression-engine'
import type { MuscleId, RecordCategory } from '../domain/types'
import { buildCalendarMonth, buildExerciseExposureSequence, buildFixedEventCountdown, calendarDayKey } from '../domain/timeline-engine'

type TimelineAxis = 'calendar' | 'exposure'

export function ProgressScreen() {
  const { history, records, athlete, settings, sessions, surveys, mesocycles, missedOpportunityEvents, exercises: exerciseCatalog } = useAppStore()
  const athleteProgress = athleteLevel({ history, records, sessions })
  const [range, setRange] = useState<ProgressRange>('28d')
  const [bodyLens, setBodyLens] = useState<BodyLens>('region')
  const [muscleLens, setMuscleLens] = useState<MuscleDoseLens>('all')
  // Captured once so render stays pure and every derived window agrees on the same instant.
  const [nowMs] = useState(() => Date.now())
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleId | null>(null)
  const [recordCategory, setRecordCategory] = useState<RecordCategory | 'all'>('all')
  const [timelineAxis, setTimelineAxis] = useState<TimelineAxis>('calendar')
  const [calendarCursor, setCalendarCursor] = useState(() => new Date())
  const [selectedCalendarDayKey, setSelectedCalendarDayKey] = useState(() => calendarDayKey(new Date())!)
  const [selectedExposureExerciseId, setSelectedExposureExerciseId] = useState(() => athlete.strengthAnchors[0] ?? history[0]?.exerciseId ?? '')
  const summary = useMemo(() => buildAnalytics(history, range), [history, range])
  const bodyData = useMemo(() => bodyLens === 'region' ? regionVolumeFor(summary.history) : areaVolumeFor(summary.history), [bodyLens, summary.history])
  const exerciseVolumes = useMemo(() => exerciseVolumeFor(summary.history), [summary.history])
  const exerciseMix = useMemo(() => exerciseMixFor(summary.history), [summary.history])
  const reconciliation = useMemo(() => analyticsReconciliation(summary), [summary])
  const topExercise = exerciseVolumes[0]
  const latestTimestamp = summary.history.reduce((latest, workSet) => Math.max(latest, new Date(workSet.completedAt).getTime()), 0)
  const latestDate = latestTimestamp ? new Date(latestTimestamp) : null
  const currentWindow = rangeWindow(range)
  const visibleRecords = records.filter((record) => {
    const timestamp = new Date(record.achievedAt).getTime()
    return timestamp <= currentWindow.end.getTime() && (currentWindow.start === null || timestamp >= currentWindow.start.getTime())
  })
  const achievements = useMemo(() => deriveAchievementEvents(history), [history])
  const visibleAchievements = achievements.filter((event) => {
    const timestamp = new Date(event.achievedAt).getTime()
    return timestamp <= currentWindow.end.getTime() && (currentWindow.start === null || timestamp >= currentWindow.start.getTime())
  })
  const validatedAchievements = visibleAchievements.filter((event) => event.validation === 'validated')
  const numericOnlyAchievements = visibleAchievements.filter((event) => event.validation === 'numeric-only')
  const filteredRecords = visibleRecords.filter((record) => recordCategory === 'all' || record.category === recordCategory)
  const nextSession = sessions.filter((session) => ['planned', 'deferred'].includes(session.status)).sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime())[0]
  const nextOpportunities = nextSession?.exercises.flatMap((planned) => {
    const exercise = exerciseCatalog.find((candidate) => candidate.id === planned.exerciseId)
    return exercise ? deriveRecordOpportunities({ history, planned, exercise, readiness: nextSession.readiness ?? 'confirm' }) : []
  }).filter((opportunity) => opportunity.eligible).slice(0, 3) ?? []
  const priorityCoverage = useMemo(() => priorityAttentionFor({ selectedHistory: summary.history, allHistory: history, priorityRegions: athlete.priorityRegions }), [athlete.priorityRegions, history, summary.history])
  const plannedDose = useMemo(() => plannedVsCompletedDoseFor({ sessions, history, exercises: exerciseCatalog, range, focusRegions: athlete.priorityRegions }), [athlete.priorityRegions, exerciseCatalog, history, range, sessions])
  const muscleDose = useMemo(() => muscleDoseFor(summary.history, exerciseCatalog), [exerciseCatalog, summary.history])
  const visibleMuscles = useMemo(() => filterMuscleDose(muscleDose.muscles, muscleLens), [muscleDose.muscles, muscleLens])
  const plannedMuscleDose = useMemo(() => plannedMuscleDoseFor({ sessions, history, exercises: exerciseCatalog, range }), [exerciseCatalog, history, range, sessions])
  const visiblePlannedMuscles = useMemo(() => filterPlannedMuscleDose(plannedMuscleDose.points, muscleLens).filter((point) => point.plannedTotal > 0 || point.completedTotal > 0), [muscleLens, plannedMuscleDose.points])
  const muscleDetail = selectedMuscle ? visibleMuscles.find((point) => point.muscle === selectedMuscle) ?? null : null
  const maxMuscleDose = Math.max(1, ...visibleMuscles.map((point) => point.totalDose))

  // Volume progression reads the feedback the athlete already gives and turns it into next week's set
  // count, which is the whole point of collecting it. Decisions are proposals: nothing is applied
  // without the athlete acting on it, and an unanswered round holds rather than guessing.
  const volumePlan = useMemo(() => {
    const activePlan = mesocycles.find((plan) => plan.status === 'active')
    const now = new Date(nowMs)
    const currentWindowStart = new Date(nowMs - 7 * 86_400_000)
    const priorWindowStart = new Date(nowMs - 14 * 86_400_000)
    const weeklySets = new Map(muscleDoseFor(history.filter((workSet) => new Date(workSet.completedAt) >= currentWindowStart), exerciseCatalog).muscles.map((point) => [point.muscle, point.directDose]))
    return filterMuscleDose(muscleDose.muscles, muscleLens)
      .filter((point) => point.sourceSetCount > 0)
      .map((point) => {
        const currentSets = Math.round(weeklySets.get(point.muscle) ?? 0)
        const feedback = summarizeMuscleFeedback({
          muscle: point.muscle, history, surveys, exercises: exerciseCatalog, currentWindowStart, priorWindowStart, now
        })
        const decision = decideMuscleVolume({
          muscle: point.muscle,
          currentSets,
          volumeTolerance: athlete.placement?.dimensions?.volumeTolerance ?? null,
          feedback,
          microcycleNumber: activePlan ? Math.max(1, sessions.filter((session) => session.mesocycleId === activePlan.id && session.status === 'completed').length) : 1,
          targetMicrocycles: activePlan?.targetMicrocycles ?? 4
        })
        return { point, decision, zone: volumeZone(currentSets, decision.landmarks), attribution: feedback.attribution ?? 'attributed' }
      })
      .sort((a, b) => Math.abs(b.decision.setChange) - Math.abs(a.decision.setChange) || a.point.label.localeCompare(b.point.label))
  }, [athlete.placement, exerciseCatalog, history, mesocycles, muscleDose.muscles, muscleLens, nowMs, sessions, surveys])

  // A deload is worth most when taken just before performance slides, so the forecast is offered
  // rather than imposed. Weeks with no training built no fatigue and push the timing back.
  const deload = useMemo(() => {
    const activePlan = mesocycles.find((plan) => plan.status === 'active')
    if (!activePlan) return null
    const planSessions = sessions.filter((session) => session.mesocycleId === activePlan.id)
    const weeksElapsed = Math.max(1, Math.ceil((nowMs - new Date(activePlan.effectiveAt).getTime()) / (7 * 86_400_000)))
    const trainedWeeks = new Set(planSessions.filter((session) => session.status === 'completed').map((session) => Math.floor((new Date(session.plannedDate).getTime() - new Date(activePlan.effectiveAt).getTime()) / (7 * 86_400_000))))
    const postAnswers = (id: string) => surveys.filter((survey) => survey.type === 'post').flatMap((survey) => {
      const answer = survey.answers.find((candidate) => candidate.id === id && candidate.status === 'answered')
      return typeof answer?.value === 'number' ? [answer.value] : []
    })
    const average = (values: number[]) => values.length ? values.reduce((total, value) => total + value, 0) / values.length : null
    return forecastDeload({
      weeksSinceLastDeload: weeksElapsed,
      missedWeeks: Math.max(0, weeksElapsed - trainedWeeks.size),
      blockLength: activePlan.targetMicrocycles,
      musclesAtCeiling: volumePlan.filter((entry) => entry.zone === 'over-ceiling' || entry.zone === 'near-ceiling').length,
      musclesLosingPerformance: volumePlan.filter((entry) => entry.decision.action === 'reduce-sets' || entry.decision.reasons[0]?.includes('performance dropped')).length,
      averageEndFatigue: average(postAnswers('endFatigue')),
      motivation: average(postAnswers('motivation'))
    })
  }, [mesocycles, nowMs, sessions, surveys, volumePlan])
  const calendarView = useMemo(() => buildCalendarMonth({ sessions, history, missedOpportunityEvents, month: calendarCursor }), [calendarCursor, history, missedOpportunityEvents, sessions])
  const selectedCalendarDay = calendarView.days.find((day) => day.key === selectedCalendarDayKey) ?? calendarView.days.find((day) => day.inSelectedMonth)!
  const exposureOptions = useMemo(() => {
    const ids = [...new Set([...athlete.strengthAnchors, ...history.map((workSet) => workSet.exerciseId)])]
    return ids.map((exerciseId) => ({
      exerciseId,
      name: exerciseCatalog.find((exercise) => exercise.id === exerciseId)?.name ?? history.find((workSet) => workSet.exerciseId === exerciseId)?.exerciseName ?? exerciseId
    }))
  }, [athlete.strengthAnchors, exerciseCatalog, history])
  const exposureSequence = useMemo(() => buildExerciseExposureSequence(history, selectedExposureExerciseId), [history, selectedExposureExerciseId])
  const fixedEvent = useMemo(() => buildFixedEventCountdown(athlete.placement.inputs.fixedEvent), [athlete.placement.inputs.fixedEvent])
  const trend = summary.comparisonPercent
  const trendLabel = trend === null ? 'No matched prior window' : `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}% vs prior matched window`
  const rangeDates = summary.start
    ? `${summary.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: summary.start.getFullYear() !== summary.end.getFullYear() ? 'numeric' : undefined })} to ${summary.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
    : `Through ${summary.end.toLocaleDateString()}`
  const bannerTitle = summary.setCount === 0
    ? 'No completed work in this window.'
    : trend !== null && trend > 0
      ? 'Your completed workload moved forward.'
      : 'Every workout you completed stays visible.'

  const showMonth = (offset: number) => {
    const next = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + offset, 1)
    const now = new Date()
    setCalendarCursor(next)
    setSelectedCalendarDayKey(calendarDayKey(now.getFullYear() === next.getFullYear() && now.getMonth() === next.getMonth() ? now : next)!)
  }

  const showCurrentMonth = () => {
    const now = new Date()
    setCalendarCursor(now)
    setSelectedCalendarDayKey(calendarDayKey(now)!)
  }

  return (
    <div className="screen">
      <header className="screen-header">
        <div><p className="eyebrow">Completed work only</p><h1>Your training, made legible.</h1><p>Pick any period. Every number is built from the sets you actually finished, never from what was planned.</p></div>
        <div className="segmented-control progress-range" aria-label="Progress range">{progressRanges.map((item) => <button key={item.id} title={item.label} aria-pressed={range === item.id} className={range === item.id ? 'selected' : ''} onClick={() => setRange(item.id)}>{item.shortLabel}</button>)}</div>
      </header>

      <section className="progress-banner">
        <div className="progress-banner__avatar"><PixelAvatar mood={summary.setCount ? 'celebrate' : 'ready'} size="medium" form={athleteProgress.form} level={athleteProgress.level} /></div>
        <div className="progress-banner__copy"><p className="eyebrow">Your wins · {summary.label}</p><h2>{bannerTitle}</h2><p>{summary.setCount ? `${summary.setCount} completed sets across ${summary.activeDays} active ${summary.activeDays === 1 ? 'day' : 'days'}, producing ${validatedAchievements.length} confirmed ${validatedAchievements.length === 1 ? 'win' : 'wins'}${numericOnlyAchievements.length ? ` and ${numericOnlyAchievements.length} numbers-only ${numericOnlyAchievements.length === 1 ? 'best' : 'bests'}` : ''}. Planned or missed work never counts.` : 'Choose another period or complete a workout. Zero is shown honestly rather than replaced by all-time history.'}</p></div>
        <div className="progress-banner__level"><LevelProgress progress={athleteProgress} compact /></div>
        <div className="progress-banner__badge"><Sparkles size={18} /><strong>{validatedAchievements.length} validated {validatedAchievements.length === 1 ? 'win' : 'wins'}</strong><span>{numericOnlyAchievements.length ? `${numericOnlyAchievements.length} numeric-only · ` : ''}{rangeDates}</span></div>
      </section>

      <section className="stats-grid">
        <StatCard label="Volume load" value={summary.totalVolume.toLocaleString()} detail={`${settings.units} · actual reps × actual load`} icon={<BarChart3 size={18} />} />
        <StatCard label="Completed sets" value={summary.setCount.toString()} detail={`Latest ${latestDate?.toLocaleDateString() ?? 'none in this period'}`} icon={<Dumbbell size={18} />} tone="orange" />
        <StatCard label="Most trained" value={topExercise?.name ?? 'No movement'} detail={topExercise ? `${topExercise.volume.toLocaleString()} exact volume load` : 'No completed sets yet'} icon={<Target size={18} />} tone="blue" />
        <StatCard label="Validated wins" value={validatedAchievements.length.toString()} detail={`${validatedAchievements.filter((event) => event.kind === 'personal-record').length} PRs · ${validatedAchievements.filter((event) => event.kind === 'micro-win').length} micro wins${numericOnlyAchievements.length ? ` · ${numericOnlyAchievements.length} numeric-only` : ''}`} icon={<Trophy size={18} />} tone="purple" />
      </section>

      <section className="period-facts" aria-label={`${summary.label} training summary`}>
        <div><CalendarDays size={17} /><span><small>Active days</small><strong>{summary.activeDays}</strong></span></div>
        <div><Layers3 size={17} /><span><small>Sessions</small><strong>{summary.sessionCount}</strong></span></div>
        <div><Activity size={17} /><span><small>Total reps</small><strong>{summary.totalReps.toLocaleString()}</strong></span></div>
        <div><Dumbbell size={17} /><span><small>Average set load</small><strong>{Math.round(summary.averageLoad).toLocaleString()} {settings.units}</strong></span></div>
      </section>

      <CollapsiblePanel className="panel training-timeline" ariaLabel="Calendar and completed exposure history" label="the calendar view" defaultOpen header={<>
        <div className="panel__header training-timeline__header">
          <div><p className="eyebrow">Two clocks</p><h3>When you trained versus what moved forward</h3></div>
          <div className="mini-toggle" aria-label="Timeline axis"><button aria-pressed={timelineAxis === 'calendar'} className={timelineAxis === 'calendar' ? 'selected' : ''} onClick={() => setTimelineAxis('calendar')}><CalendarDays size={15} /> By date</button><button aria-pressed={timelineAxis === 'exposure'} className={timelineAxis === 'exposure' ? 'selected' : ''} onClick={() => setTimelineAxis('exposure')}><ListOrdered size={15} /> By workout</button></div>
        </div>
      </>}>

        <div className={`fixed-event-strip fixed-event-strip--${fixedEvent.state}`} aria-label="Fixed event countdown">
          <CalendarClock size={19} />
          {fixedEvent.state === 'none' ? <span><strong>No fixed event declared</strong><small>You can look at this by date or by workout without the app inventing a deadline.</small></span>
            : fixedEvent.state === 'unparsed' ? <span><strong>{fixedEvent.label}</strong><small>Add an ISO date such as 2026-12-12 during placement review to enable an exact countdown.</small></span>
              : <span><strong>{fixedEvent.label}</strong><small>{fixedEvent.state === 'upcoming' ? `${fixedEvent.daysRemaining} calendar days remain` : fixedEvent.state === 'today' ? 'Event date is today' : `${Math.abs(fixedEvent.daysRemaining ?? 0)} calendar days past`} · the deadline never changes completed-exposure order</small></span>}
        </div>

        {timelineAxis === 'calendar' ? <div className="calendar-explorer">
          <div className="calendar-toolbar">
            <button aria-label="Previous month" onClick={() => showMonth(-1)}><ChevronLeft size={17} /></button>
            <div><strong>{calendarView.label}</strong><small>{calendarView.plannedOpportunityCount} planned · {calendarView.completedActivityCount} completed activities · {calendarView.missedOrMovedCount} moved or stopped</small></div>
            <button className="calendar-today" aria-label="Show current month" onClick={showCurrentMonth}>Today</button>
            <button aria-label="Next month" onClick={() => showMonth(1)}><ChevronRight size={17} /></button>
          </div>
          <div className="calendar-layout">
            <div className="training-calendar" aria-label={`${calendarView.label} training calendar`}>
              <div className="calendar-weekdays" aria-hidden="true">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}</div>
              <div className="calendar-grid">{calendarView.days.map((day) => <button key={day.key} className={`${day.inSelectedMonth ? '' : 'outside-month'} ${day.isToday ? 'today' : ''} ${selectedCalendarDay.key === day.key ? 'selected' : ''} ${day.completedSets ? 'has-completion' : ''} ${day.missedOrMovedCount ? 'has-moved' : ''}`} aria-pressed={selectedCalendarDay.key === day.key} aria-label={`${new Date(day.date).toLocaleDateString()}: ${day.plans.length} planned, ${day.completedSets} completed sets, ${day.volumeLoad} volume load`} onClick={() => setSelectedCalendarDayKey(day.key)}>
                <span>{day.dayOfMonth}</span>
                <i aria-hidden="true">{day.plans.length > 0 && <b className="calendar-dot calendar-dot--plan" />}{day.completedSets > 0 && <b className="calendar-dot calendar-dot--complete" />}{day.missedOrMovedCount > 0 && <b className="calendar-dot calendar-dot--moved" />}</i>
                {day.completedSets > 0 && <small>{day.completedSets} sets</small>}
              </button>)}</div>
            </div>
            <aside className="calendar-day-detail" aria-live="polite">
              <p className="eyebrow">Selected date</p><h4>{new Date(selectedCalendarDay.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h4>
              <div className="calendar-day-metrics"><span><strong>{selectedCalendarDay.completedSets}</strong><small>completed sets</small></span><span><strong>{selectedCalendarDay.volumeLoad.toLocaleString()}</strong><small>{settings.units} volume load</small></span></div>
              {selectedCalendarDay.plans.map((plan) => <div className={`calendar-entry calendar-entry--plan calendar-entry--${plan.status}`} key={plan.id}><CalendarDays size={16} /><span><strong>{plan.title}</strong><small>{plan.origin === 'missed-opportunity' ? 'Missed opportunity · moved' : 'Planned opportunity'} · {plan.status.replaceAll('-', ' ')}{plan.driftDays === null ? '' : plan.driftDays === 0 ? plan.origin === 'missed-opportunity' ? ' · rebuilt for the same date' : ' · completed as planned' : ` · ${plan.origin === 'missed-opportunity' ? 'moved' : 'actual'} ${Math.abs(plan.driftDays)} day${Math.abs(plan.driftDays) === 1 ? '' : 's'} ${plan.driftDays > 0 ? 'later' : 'earlier'}`}</small></span></div>)}
              {selectedCalendarDay.completions.map((completion) => <div className="calendar-entry calendar-entry--complete" key={completion.id}><CheckCircle2 size={16} /><span><strong>{completion.title}</strong><small>{completion.completedSets} sets · {completion.repetitions} reps · {completion.volumeLoad.toLocaleString()} {settings.units}</small><em>{completion.exerciseNames.join(', ')} · {completion.linkedToStoredSession ? completion.driftDays === 0 ? 'linked to same-day plan' : `linked to plan${completion.driftDays === null ? '' : ` · ${Math.abs(completion.driftDays)} day${Math.abs(completion.driftDays) === 1 ? '' : 's'} ${completion.driftDays > 0 ? 'later' : 'earlier'}`}` : completion.imported ? 'imported, no stored plan' : 'completed, no stored plan'}</em></span></div>)}
              {selectedCalendarDay.plans.length === 0 && selectedCalendarDay.completions.length === 0 && <div className="calendar-day-empty"><CalendarDays size={22} /><strong>No stored training event</strong><p>An empty date creates no missed-work debt and says nothing about readiness.</p></div>}
            </aside>
          </div>
          <div className="calendar-legend"><span><i className="calendar-dot calendar-dot--plan" /> Planned opportunity</span><span><i className="calendar-dot calendar-dot--complete" /> Completed sets</span><span><i className="calendar-dot calendar-dot--moved" /> Moved, expired, or stopped</span></div>
        </div> : <div className="exposure-explorer">
          <div className="exposure-picker" aria-label="Exact movement exposure history">{exposureOptions.map((option) => <button key={option.exerciseId} aria-pressed={selectedExposureExerciseId === option.exerciseId} className={selectedExposureExerciseId === option.exerciseId ? 'selected' : ''} onClick={() => setSelectedExposureExerciseId(option.exerciseId)}>{option.name}</button>)}</div>
          <div className="exposure-summary"><ListOrdered size={20} /><span><strong>{exposureSequence.length} exact completed {exposureSequence.length === 1 ? 'exposure' : 'exposures'}</strong><small>{exposureSequence.length ? `${new Date(exposureSequence[0].completedAt).toLocaleDateString()} through ${new Date(exposureSequence.at(-1)!.completedAt).toLocaleDateString()}` : 'No completed sets for this exact movement'}</small></span><b>{exposureSequence.length ? `#${exposureSequence.at(-1)!.sequence}` : 'EMPTY'}</b></div>
          {exposureSequence.length ? <ol className="exposure-sequence">{[...exposureSequence].reverse().map((point) => {
            const session = sessions.find((candidate) => candidate.id === point.sessionId)
            return <li key={`${point.sessionId}:${point.sequence}`} className={`exposure-point exposure-point--${point.changeKind}`}><span className="exposure-point__sequence">{String(point.sequence).padStart(2, '0')}</span><div><p className="eyebrow">{new Date(point.completedAt).toLocaleDateString()} · {point.daysSincePrior === null ? 'first exact exposure' : `${point.daysSincePrior} calendar-day gap`}</p><h4>{session?.title ?? (point.imported ? 'Imported training' : point.exerciseName)}</h4><p>{point.completedSets} sets · {point.repetitions} reps · {point.volumeLoad.toLocaleString()} {settings.units} volume · {point.heaviestLoad} {settings.units} heaviest</p><small>{point.qualityConfirmedSets}/{point.completedSets} sets with quality confirmed · {point.averageRir.toFixed(1)} average RIR</small></div><span className="exposure-change"><b>{point.changeKind.replaceAll('-', ' ')}</b><small>{point.changeLabel}</small></span></li>
          })}</ol> : <div className="compact-empty"><ListOrdered size={25} /><strong>No completed workouts for this lift yet</strong><p>Family movements and neighboring variations are not borrowed. Complete or import this exact movement to begin its sequence.</p></div>}
        </div>}
        <p className="chart-note"><Link2 size={14} /> By date shows when training actually happened. By workout lines up only the sessions where you completed that exact lift, in the order you did them. Gaps stay visible, and they never become fake completed weeks, automatic progression, or catch-up work.</p>
      </CollapsiblePanel>

      <div className="charts-grid">
        <CollapsiblePanel className="panel chart-panel chart-panel--wide" label="the volume explorer" defaultOpen header={<div className="panel__header"><div><p className="eyebrow">Volume explorer · {summary.label}</p><h3>{range === 'today' ? 'Daily' : ['quarter', 'year'].includes(range) ? 'Monthly' : range === 'all' ? 'Yearly' : 'Daily'} volume load</h3></div><span className={trend !== null && trend < 0 ? 'trend-down' : 'trend-up'}>{trend !== null && trend < 0 ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}{trendLabel}</span></div>}>
          <div className="chart-wrap" aria-label={`${summary.label} volume load chart`}>
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={summary.points} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e7ff58" stopOpacity={0.42} /><stop offset="100%" stopColor="#e7ff58" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#2c3129" vertical={false} /><XAxis dataKey="label" stroke="#788171" tickLine={false} axisLine={false} fontSize={11} minTickGap={24} /><YAxis stroke="#788171" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value) => Number(value) >= 1000 ? `${Math.round(Number(value) / 1000)}k` : String(value)} /><Tooltip contentStyle={{ background: '#191d17', border: '1px solid #353b31', borderRadius: 10 }} formatter={(value) => [`${Number(value).toLocaleString()} ${settings.units}`, 'Volume load']} /><Area isAnimationActive={false} type="monotone" dataKey="volume" stroke="#e7ff58" strokeWidth={3} fill="url(#volumeFill)" /></AreaChart></ResponsiveContainer>
          </div>
          <p className="chart-note">Exercise-specific volume load is best for like-for-like trends. It is not a universal stimulus score across different movements.</p>
        </CollapsiblePanel>
        <CollapsiblePanel className="panel chart-panel" label="the body volume lens" header={<div className="panel__header body-lens-header"><div><p className="eyebrow">Body-volume lens</p><h3>{bodyLens === 'region' ? 'Primary-region volume' : 'Upper, lower, arms, and trunk'}</h3></div><div className="mini-toggle" aria-label="Body volume grouping"><button aria-pressed={bodyLens === 'region'} className={bodyLens === 'region' ? 'selected' : ''} onClick={() => setBodyLens('region')}>Regions</button><button aria-pressed={bodyLens === 'area'} className={bodyLens === 'area' ? 'selected' : ''} onClick={() => setBodyLens('area')}>Areas</button></div></div>}>
          <div className="chart-wrap chart-wrap--small" aria-label={`Volume by ${bodyLens}`}>
            <ResponsiveContainer width="100%" height="100%"><BarChart data={bodyData.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}><XAxis type="number" hide /><YAxis dataKey="label" type="category" stroke="#aeb6a7" tickLine={false} axisLine={false} width={78} fontSize={11} /><Tooltip contentStyle={{ background: '#191d17', border: '1px solid #353b31', borderRadius: 10 }} formatter={(value) => [`${Number(value).toLocaleString()} ${settings.units}`, 'Volume load']} /><Bar isAnimationActive={false} dataKey="volume" fill="#ff7a45" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
          </div>
          <p className="chart-note">Exclusive primary-region assignment keeps totals conserved. The separately labeled muscle-dose view below answers a different question with fractional credit.</p>
        </CollapsiblePanel>
      </div>

      <CollapsiblePanel className="panel dose-panel" label="the plan comparison" header={<div className="panel__header"><div><p className="eyebrow">Plan versus completed</p><h3>What you planned, what you finished</h3></div><CheckCircle2 size={20} /></div>}>
        <div className="dose-summary">
          <div><small>Stored plans in window</small><strong>{plannedDose.plannedSessionIds.length}</strong><span>{plannedDose.plannedSets} intended sets</span></div>
          <div><small>Linked completion</small><strong>{plannedDose.linkedCompletedSets} / {plannedDose.plannedSets}</strong><span>{plannedDose.plannedSets ? `${Math.round(plannedDose.linkedCompletedSets / plannedDose.plannedSets * 100)}% of stored set dose` : 'No stored set dose'}</span></div>
          <div><small>Known planned volume</small><strong>{plannedDose.plannedVolumeKnown.toLocaleString()}</strong><span>{settings.units} · {plannedDose.unknownLoadSets} planned {plannedDose.unknownLoadSets === 1 ? 'set has' : 'sets have'} unknown load</span></div>
          <div><small>Completed without stored plan</small><strong>{plannedDose.unlinkedCompletedSets}</strong><span>{plannedDose.unlinkedCompletedVolume.toLocaleString()} {settings.units} volume kept separate</span></div>
        </div>
        {plannedDose.regions.length ? <div className="dose-regions">{plannedDose.regions.map((point) => <div key={point.region}>
          <span><strong>{point.region}</strong><small>{point.plannedSets} planned · {point.completedSets} linked completed{point.unknownLoadSets ? ` · ${point.unknownLoadSets} unknown-load` : ''}</small></span>
          <i aria-hidden="true"><b style={{ width: `${point.plannedSets ? Math.min(100, point.completedSets / point.plannedSets * 100) : point.completedSets ? 100 : 0}%` }} /></i>
          <span className={`dose-status dose-status--${point.status}`}><b>{point.completionRate === null ? point.status.replace('-', ' ') : `${Math.round(point.completionRate * 100)}%`}</b><small>{point.status.replace('-', ' ')}</small></span>
        </div>)}</div> : <div className="compact-empty"><Target size={24} /><strong>No stored dose in this window</strong><p>Completed history remains visible above, but no dated plan is available for an honest plan comparison.</p></div>}
        <p className="chart-note">Only sets you completed inside a saved session can count toward a plan. The {plannedDose.unlinkedCompletedSets} other completed {plannedDose.unlinkedCompletedSets === 1 ? 'set still counts' : 'sets still count'} in your totals, they just have no plan to match. Below plan means what happened, not a scolding or a cue to add catch-up work.</p>
      </CollapsiblePanel>

      <CollapsiblePanel className="panel muscle-dose-panel" label="muscle by muscle" header={<div className="panel__header muscle-dose-header"><div><p className="eyebrow">Muscle by muscle</p><h3>Direct work and assisting work</h3></div><div className="mini-toggle" aria-label="Muscle dose grouping">{(['all', 'upper', 'lower', 'arms', 'trunk'] as const).map((lens) => <button key={lens} aria-pressed={muscleLens === lens} className={muscleLens === lens ? 'selected' : ''} onClick={() => { setMuscleLens(lens); setSelectedMuscle(null) }}>{lens}</button>)}</div></div>}>
        <div className="muscle-dose-summary">
          <div><small>Completed sets</small><strong>{muscleDose.sourceSetCount}</strong><span>Selected {summary.label.toLowerCase()}</span></div>
          <div><small>Mapped sets</small><strong>{muscleDose.mappedSourceSetCount}</strong><span>{muscleDose.unmappedSourceSetCount} visibly unmapped</span></div>
          <div><small>Direct credit</small><strong>{muscleDose.directSetEquivalents.toFixed(1)}</strong><span>1.0 per direct muscle assignment</span></div>
          <div><small>Secondary credit</small><strong>{muscleDose.fractionalSetEquivalents.toFixed(1)}</strong><span>0.5 per secondary assignment</span></div>
        </div>
        <div className="muscle-area-strip" aria-label="Work by body area">{muscleDose.areas.map((area) => <div key={area.lens}><small>{area.label}</small><strong>{area.conservedDose.toFixed(1)}</strong><span>{area.sourceSetCount} completed {area.sourceSetCount === 1 ? 'set' : 'sets'}</span></div>)}</div>
        {visibleMuscles.length ? <div className="muscle-dose-layout">
          <div className="muscle-dose-list" aria-label={`${muscleLens} individual muscle dose`}>
            {visibleMuscles.map((point) => <button key={point.muscle} className={selectedMuscle === point.muscle ? 'selected' : ''} aria-pressed={selectedMuscle === point.muscle} onClick={() => setSelectedMuscle((current) => current === point.muscle ? null : point.muscle)}>
              <span><strong>{point.label}</strong><small>{point.sourceSetCount} completed {point.sourceSetCount === 1 ? 'set' : 'sets'} · last {point.lastCompletedAt ? new Date(point.lastCompletedAt).toLocaleDateString() : 'never'}</small></span>
              <i aria-hidden="true"><b className="muscle-dose-bar--direct" style={{ width: `${point.directDose / maxMuscleDose * 100}%` }} /><b className="muscle-dose-bar--fractional" style={{ width: `${point.fractionalDose / maxMuscleDose * 100}%` }} /></i>
              <span><b>{point.totalDose.toFixed(1)}</b><small>{point.directDose.toFixed(1)} direct + {point.fractionalDose.toFixed(1)} secondary</small></span>
            </button>)}
          </div>
          <aside className="muscle-dose-detail" aria-live="polite">
            {muscleDetail ? <><p className="eyebrow">Where this came from</p><h4>{muscleDetail.label}</h4><p>{muscleDetail.totalDose.toFixed(1)} set-equivalents from {muscleDetail.sourceSetCount} completed {muscleDetail.sourceSetCount === 1 ? 'set' : 'sets'}.</p>{muscleDetail.exercises.length ? <div className="muscle-dose-exercises">{muscleDetail.exercises.map((exercise) => <div key={exercise.exerciseId}><span><strong>{exercise.exerciseName}</strong><small>Last {new Date(exercise.lastCompletedAt).toLocaleDateString()} · {exercise.sourceSetCount} completed {exercise.sourceSetCount === 1 ? 'set' : 'sets'}</small><details><summary>View the exact {exercise.sourceSetCount === 1 ? 'set record' : 'set records'}</summary><code>{exercise.sourceSetIds.join(', ')}</code></details></span><b>{exercise.totalDose.toFixed(1)}<small>{exercise.directDose.toFixed(1)} + {exercise.fractionalDose.toFixed(1)}</small></b></div>)}</div> : <div className="muscle-dose-detail__empty">No completed set inside this period feeds this muscle yet.</div>}</> : <><Layers3 size={24} /><h4>Open a muscle</h4><p>Select a row to see the exact movements and sets behind the number.</p></>}
          </aside>
        </div> : <div className="compact-empty"><Layers3 size={24} /><strong>No mapped muscle dose in this lens</strong><p>Choose another area or complete a built-in movement. Unknown mappings remain unknown.</p></div>}
        {muscleDose.unmappedSourceSetCount > 0 && <div className="muscle-unmapped" role="note"><strong>{muscleDose.unmappedSourceSetCount} unmapped {muscleDose.unmappedSourceSetCount === 1 ? 'set' : 'sets'}</strong><span>{muscleDose.unmappedExerciseNames.join(', ')}. These sets remain in completed volume but receive no inferred muscle credit.</span></div>}
        {deload && (
          <div className={`deload-forecast deload-forecast--${deload.urgency}`} aria-label="Deload forecast">
            <div><p className="eyebrow">Recovery week suggestion</p><h4>{deload.urgency === 'not-yet' ? 'No deload suggestion yet' : deload.urgency === 'approaching' ? 'A deload review is close' : deload.urgency === 'due' ? 'Review a deload this week' : 'Strong deload review signal'}</h4></div>
            <ul>{deload.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
            <small>You approve whether and when to take it. ForgePath never changes the plan automatically. If approved, sets fall to the least that holds adaptation, repetitions fall substantially, and load stays deliberately submaximal.</small>
          </div>
        )}
        {volumePlan.length > 0 && (
          <div className="volume-plan" aria-label="Weekly volume progression">
            <div className="volume-plan__heading">
              <div><p className="eyebrow">Next week's volume</p><h4>What next week should look like</h4></div>
              <small>Weekly direct sets against a provisional recoverable range. Suggestions only. Review and approve them when building the next plan; this screen never changes future sessions.</small>
            </div>
            <div className="volume-plan__list">
              {volumePlan.map(({ point, decision, zone, attribution }) => (
                <article key={point.muscle} className={`volume-plan__row volume-plan__row--${decision.action}`}>
                  <span><strong>{point.label}</strong><small>{decision.currentSets} weekly direct {decision.currentSets === 1 ? 'set' : 'sets'} · {zone.replace('-', ' ')} · {attribution}</small></span>
                  <span className="volume-plan__scale" aria-hidden="true">
                    <i style={{ width: `${Math.min(100, decision.currentSets / Math.max(1, decision.landmarks.mrv) * 100)}%` }} />
                    <em style={{ left: `${Math.min(100, decision.landmarks.mev / Math.max(1, decision.landmarks.mrv) * 100)}%` }} />
                  </span>
                  <b>{decision.setChange > 0 ? `+${decision.setChange}` : decision.setChange === 0 ? 'hold' : decision.setChange}</b>
                  <p>{decision.reasons[0]}{decision.unknownInputs.length > 0 && <small>Unanswered: {decision.unknownInputs.join(', ')}</small>}</p>
                </article>
              ))}
            </div>
            <p className="chart-note">Landmarks start from published weekly set ranges and scale with your own volume tolerance. Pump and stimulus are asked per trained muscle, so rows marked exact were answered about that muscle directly. Rows marked attributed inherited a whole-session answer, either because the session predates per-muscle questions or the muscle fell outside the four asked about, and those are an approximation rather than a measurement.</p>
          </div>
        )}
        <p className="chart-note">These rows do not add up to a single total: one set can credit several muscles. Direct work counts 1.0, assisting work counts 0.5, stabilizers count nothing, and a body area keeps each set at its highest single credit. It is a planning guide, not measured activation or a promise of growth.</p>
      </CollapsiblePanel>

      <CollapsiblePanel className="panel muscle-plan-panel" label="planned muscle work" header={<div className="panel__header"><div><p className="eyebrow">Planned muscle work</p><h3>What the plan asked for versus what you finished</h3></div><Target size={20} /></div>}>
        <div className="muscle-dose-summary">
          <div><small>Stored plans in window</small><strong>{plannedMuscleDose.plannedSessionIds.length}</strong><span>{plannedMuscleDose.plannedSourceSetCount} planned sets</span></div>
          <div><small>Mapped planned sets</small><strong>{plannedMuscleDose.plannedMappedSetCount}</strong><span>{plannedMuscleDose.plannedUnmappedSetCount} planned sets unmapped</span></div>
          <div><small>Linked mapped completion</small><strong>{plannedMuscleDose.linkedCompletedMappedSetCount}</strong><span>{plannedMuscleDose.linkedCompletedSetCount} matched to a plan</span></div>
          <div><small>Completed without stored plan</small><strong>{plannedMuscleDose.unlinkedCompletedSetCount}</strong><span>Preserved outside compliance</span></div>
        </div>
        {visiblePlannedMuscles.length ? <div className="muscle-plan-list" aria-label={`${muscleLens} planned muscle dose`}>
          {visiblePlannedMuscles.map((point) => <div key={point.muscle}>
            <span><strong>{point.label}</strong><small>{point.plannedDirect.toFixed(1)} direct + {point.plannedSecondary.toFixed(1)} secondary planned</small></span>
            <span className="muscle-plan-meter"><span><b>{point.completedTotal.toFixed(1)}</b> linked completed / <b>{point.plannedTotal.toFixed(1)}</b> planned set-equivalents</span><i aria-hidden="true"><b className="muscle-dose-bar--direct" style={{ width: `${point.plannedTotal ? Math.min(100, point.completedDirect / point.plannedTotal * 100) : point.completedDirect ? 100 : 0}%` }} /><b className="muscle-dose-bar--fractional" style={{ width: `${point.plannedTotal ? Math.min(Math.max(0, 100 - point.completedDirect / point.plannedTotal * 100), point.completedSecondary / point.plannedTotal * 100) : 0}%` }} /></i><small>{point.completedDirect.toFixed(1)} direct + {point.completedSecondary.toFixed(1)} secondary completed · {point.plannedSetIds.length} planned credit links · {point.completedSetIds.length} completed credit links</small></span>
            <span className={`dose-status dose-status--${point.status}`}><b>{point.completionRate === null ? 'No plan' : `${Math.round(point.completionRate * 100)}%`}</b><small>{point.status.replaceAll('-', ' ')}</small></span>
          </div>)}
        </div> : <div className="compact-empty"><Target size={24} /><strong>No planned or linked muscle dose in this lens</strong><p>Choose another body-area lens or a range containing stored sessions.</p></div>}
        {(plannedMuscleDose.plannedUnmappedSetCount > 0 || plannedMuscleDose.linkedCompletedUnmappedSetCount > 0) && <div className="muscle-unmapped" role="note"><strong>Mapping gap</strong><span>{plannedMuscleDose.plannedUnmappedSetCount} planned and {plannedMuscleDose.linkedCompletedUnmappedSetCount} completed {plannedMuscleDose.plannedUnmappedSetCount + plannedMuscleDose.linkedCompletedUnmappedSetCount === 1 ? 'set has' : 'sets have'} no muscle mapping, so they earn no muscle credit.{plannedMuscleDose.plannedUnmappedExerciseNames.length ? ` Review: ${plannedMuscleDose.plannedUnmappedExerciseNames.join(', ')}.` : ''}</span></div>}
        <p className="chart-note">This compares saved planned sets against the completed sets from those same sessions. It counts set-equivalents per muscle, not volume load or measured stimulus. Sets outside a saved plan are still real progress, and coming in under plan never creates catch-up work.</p>
      </CollapsiblePanel>

      <div className="insight-grid">
        <CollapsiblePanel className="panel" label="priority attention" header={<div className="panel__header"><div><p className="eyebrow">Priority attention</p><h3>Goal-relative completed evidence</h3></div><BrainCircuit size={19} /></div>}>
          <div className="priority-coverage">{priorityCoverage.map((item) => <div key={item.region}><span><strong>{item.region}</strong><small>{item.status === 'represented' ? item.contributingExercises.join(', ') : item.status === 'outside-window' ? `Last completed ${item.daysSinceLastExposure} days ago` : 'No completed history yet'}</small></span><span><b>{item.selectedSets} sets</b><small>{item.selectedVolume.toLocaleString()} volume load · {item.status.replace('-', ' ')}</small></span></div>)}</div>
          <p className="chart-note">This card only reports work you completed. The plan comparison below is a separate view, and neither one treats a light period as debt to make up.</p>
        </CollapsiblePanel>
        <CollapsiblePanel className="panel" label="the movement mix" header={<div className="panel__header"><div><p className="eyebrow">Exact movement mix</p><h3>What filled this window</h3></div><Dumbbell size={19} /></div>}>
          {exerciseMix.length ? <div className="movement-mix">{exerciseMix.slice(0, 6).map((item, index) => <div key={item.exerciseId}><span className="movement-mix__rank">{String(index + 1).padStart(2, '0')}</span><span><strong>{item.name}</strong><small>{item.sets} sets · {item.repetitions} reps · {item.sessions} {item.sessions === 1 ? 'session' : 'sessions'}</small><i><b style={{ width: `${Math.max(3, item.volumeShare * 100)}%` }} /></i></span><span><b>{(item.volumeShare * 100).toFixed(1)}%</b><small>{item.volume.toLocaleString()} volume load</small></span></div>)}</div> : <div className="compact-empty"><Dumbbell size={24} /><strong>No movement mix yet</strong><p>Complete a set inside this period to create an exact-movement breakdown.</p></div>}
          <p className="chart-note">Percent is share of selected-period volume load, not share of hypertrophy stimulus or enjoyment. Different exercises are not mechanically interchangeable.</p>
        </CollapsiblePanel>
        <CollapsiblePanel className="panel" label="records for this period" header={<div className="panel__header"><div><p className="eyebrow">Current record ledger</p><h3>Bests inside this window</h3></div><Trophy size={19} /></div>}>
          <div className="record-filter" aria-label="Record category">{(['all', 'strength', 'repetition', 'scheme', 'workload'] as const).map((category) => <button key={category} aria-pressed={recordCategory === category} className={recordCategory === category ? 'selected' : ''} onClick={() => setRecordCategory(category)}>{category}</button>)}</div>
          {filteredRecords.length ? <div className="record-list">{filteredRecords.slice(0, 12).map((record) => <div key={record.id} className={record.validation === 'numeric-only' ? 'is-numeric-only' : ''}><span className="record-medal">◆</span><div><strong>{record.label}{['load', 'estimated-load'].includes(record.unit) ? ` ${settings.units}` : record.unit === 'volume-load' ? ` ${settings.units}` : ''}</strong><small>{record.exerciseName} · {new Date(record.achievedAt).toLocaleDateString()} · {record.sourceSetIds.length} completed {record.sourceSetIds.length === 1 ? 'set' : 'sets'} · {record.validation === 'numeric-only' ? 'numbers only' : 'quality confirmed'}</small></div><span>{record.category}</span></div>)}</div> : <div className="compact-empty"><Trophy size={24} /><strong>No record in this window</strong><p>Records outside the selected dates remain available in All time.</p></div>}
        </CollapsiblePanel>
      </div>

      <div className="achievement-grid">
        <CollapsiblePanel className="panel" label="the wins timeline" header={<div className="panel__header"><div><p className="eyebrow">Evidence-backed timeline</p><h3>PRs and micro wins</h3></div><Sparkles size={19} /></div>}>
          {visibleAchievements.length ? <div className="achievement-list">{visibleAchievements.slice(0, 12).map((event) => <div key={event.id} className={`achievement-row achievement-row--${event.kind} ${event.validation === 'numeric-only' ? 'is-numeric-only' : ''}`}><span className="achievement-glyph">{event.kind === 'personal-record' ? '★' : '✦'}</span><span><strong>{event.title}</strong><small>{event.exerciseName} · {event.explanation}</small><em>{new Date(event.achievedAt).toLocaleDateString()} · {event.sourceSetIds.length} completed {event.sourceSetIds.length === 1 ? 'set' : 'sets'} · {event.validation === 'numeric-only' ? 'numbers only' : 'quality confirmed'}</em></span><b>{event.delta !== null ? `+${Number.isInteger(event.delta) ? event.delta : event.delta.toFixed(1)}` : 'BASE'}</b></div>)}</div> : <div className="compact-empty"><Sparkles size={24} /><strong>No new win this period</strong><p>Nothing here beat a comparable past set. The work you did still shows in the charts above.</p></div>}
        </CollapsiblePanel>
        <CollapsiblePanel className="panel" label="the next planned session" header={<div className="panel__header"><div><p className="eyebrow">Next planned session</p><h3>Safe record opportunities</h3></div><Target size={19} /></div>}>
          {nextOpportunities.length ? <div className="opportunity-list">{nextOpportunities.map((opportunity) => <div key={opportunity.id}><Trophy size={17} /><span><strong>{opportunity.title}</strong><small>{opportunity.explanation}</small><em>{opportunity.gateReason}</em></span></div>)}</div> : <div className="compact-empty"><Target size={24} /><strong>No PR chase prescribed</strong><p>The next session can still build strength, skill, and recoverable volume. ForgePath does not add work to manufacture a badge.</p></div>}
        </CollapsiblePanel>
      </div>

      <CollapsiblePanel className="panel reconciliation-panel" label="the calculation audit" header={<div className="panel__header"><div><p className="eyebrow">Calculation audit</p><h3>Every view adds up from your completed sets</h3></div>{reconciliation.exact ? <CheckCircle2 size={20} /> : <HeartPulse size={20} />}</div>}>
        <div className="reconciliation-grid">
          <div><small>Completed sets</small><strong>{summary.setCount}</strong><span>{reconciliation.sourceVolume.toLocaleString()} {settings.units}</span></div>
          <div><small>Time-series total</small><strong>{reconciliation.seriesVolume.toLocaleString()}</strong><span>Derived from the visible chart</span></div>
          <div><small>Body-lens total</small><strong>{reconciliation.regionVolume.toLocaleString()}</strong><span>Each set counted exactly once</span></div>
          <div className={reconciliation.exact ? 'reconciliation-pass' : 'reconciliation-fail'}><small>Integrity result</small><strong>{reconciliation.exact ? 'Exact match' : 'Review required'}</strong><span>No hidden planned volume</span></div>
        </div>
      </CollapsiblePanel>

      <section className="panel long-horizon">
        <div><p className="eyebrow">Current direction</p><h3>{athlete.goal}</h3><p>Your main lifts stay tracked on their own while flexible accessory work follows current muscle priorities and completed evidence.</p></div>
        <div className="horizon-track"><span className="done">Baseline</span><i /><span className="active">Build</span><i /><span>Strength</span><i /><span>Review</span></div>
      </section>
    </div>
  )
}
