import { useState } from 'react'
import { CalendarDays, Check, ChevronRight, CircleDashed, Clock3, Flag, Layers3, MoveRight, Pin, RefreshCcw, Shield, Target } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { Modal } from '../components/Modal'

export function PlanScreen() {
  const { sessions, exercises, athlete, startSession, updateAthlete, setNotice } = useAppStore()
  const [goalOpen, setGoalOpen] = useState(false)
  const [goal, setGoal] = useState(athlete.goal)
  const completed = sessions.filter((session) => session.status === 'completed').length

  return (
    <div className="screen">
      <header className="screen-header">
        <div><p className="eyebrow">Exposure-based planning</p><h1>The plan bends. The goal stays visible.</h1><p>Required training roles complete the microcycle. Weekdays are planning tools, not progression authority.</p></div>
        <button className="button button--secondary" onClick={() => setGoalOpen(true)}><Target size={17} /> Change goal</button>
      </header>

      <section className="cycle-hero">
        <div className="cycle-hero__copy">
          <span className="status-chip status-chip--orange">Microcycle extended</span>
          <p className="eyebrow">Powerbuilding foundation · Cycle 01</p>
          <h2>Restore rhythm. Protect all three anchors.</h2>
          <p>Bench, squat, and sumo each need one qualified exposure. Accessory work is allocated from current muscle priorities and available time.</p>
          <div className="cycle-progress"><span><b style={{ width: `${Math.max(8, (completed / Math.max(1, sessions.length)) * 100)}%` }} /></span><small>{completed} of {sessions.length} required roles completed</small></div>
        </div>
        <div className="cycle-map" aria-label="Training cycle map">
          <div className="cycle-node cycle-node--done"><Check size={18} /><span>Entry<small>Profile built</small></span></div>
          <MoveRight />
          <div className="cycle-node cycle-node--active"><CircleDashed size={18} /><span>Build<small>Active now</small></span></div>
          <MoveRight />
          <div className="cycle-node"><Layers3 size={18} /><span>Strength<small>Next phase</small></span></div>
          <MoveRight />
          <div className="cycle-node"><Flag size={18} /><span>Review<small>Criteria based</small></span></div>
        </div>
      </section>

      <div className="plan-layout">
        <section className="panel panel--flush">
          <div className="panel__header panel__header--padded"><div><p className="eyebrow">Rolling priority queue</p><h3>Next sessions</h3></div><span>{athlete.weeklyOpportunities} opportunities / week</span></div>
          <div className="queue-list">
            {sessions.map((session, index) => {
              const primary = session.exercises.find((exercise) => exercise.role === 'primary')
              const exercise = exercises.find((candidate) => candidate.id === primary?.exerciseId)
              return (
                <article key={session.id} className={`queue-item queue-item--${session.status}`}>
                  <div className="queue-index">{String(index + 1).padStart(2, '0')}</div>
                  <div className="queue-content">
                    <div className="queue-content__top"><span className="eyebrow">{session.dayLabel}</span><span className={`status-chip status-chip--${session.status === 'completed' ? 'lime' : 'default'}`}>{session.status}</span></div>
                    <h3>{session.title}</h3>
                    <p>{session.objective}</p>
                    <div className="queue-meta"><span><Shield size={14} /> {exercise?.name}</span><span><Clock3 size={14} /> {session.durationMinutes} min</span><span><Layers3 size={14} /> {session.exercises.length} movements</span></div>
                  </div>
                  <div className="queue-actions">
                    {session.status !== 'completed' && <button className="button button--small button--secondary" onClick={() => startSession(session.id)}>Start</button>}
                    <button className="icon-button" onClick={() => setNotice(`${exercise?.name} pinned as a protected next priority.`)} aria-label={`Pin ${session.title}`}><Pin size={17} /></button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <aside className="plan-aside">
          <section className="panel">
            <div className="panel__header"><div><p className="eyebrow">Dual clocks</p><h3>Calendar vs. exposure</h3></div><CalendarDays size={19} /></div>
            <div className="clock-comparison">
              <div><span>Calendar clock</span><strong>Week 2</strong><small>Planning and reporting</small></div>
              <div><span>Exposure clock</span><strong>1 / 3</strong><small>Progression authority</small></div>
            </div>
            <p className="callout-copy">A passed Wednesday does not become a completed bench exposure. Only completed qualified work advances the second clock.</p>
          </section>
          <section className="panel">
            <div className="panel__header"><div><p className="eyebrow">Protected qualities</p><h3>Current contract</h3></div><Target size={19} /></div>
            <ul className="priority-list">
              <li><span>Develop</span><strong>Squat, bench, sumo strength</strong></li>
              <li><span>Develop</span><strong>Chest, back, triceps size</strong></li>
              <li><span>Maintain</span><strong>Hamstrings, shoulders, arms</strong></li>
              <li><span>Constraint</span><strong>Irregular weekly schedule</strong></li>
            </ul>
          </section>
          <button className="full-row-button full-row-button--accent" onClick={() => setNotice('The week was rebuilt from the current exposure queue.')}><RefreshCcw size={17} /> Rebuild my week <ChevronRight size={18} /></button>
        </aside>
      </div>

      <Modal open={goalOpen} onClose={() => setGoalOpen(false)} title="Version the training goal" description="Changing direction creates a new goal version. Prior cycles and records remain intact.">
        <label className="field-label" htmlFor="goal">Current priority</label>
        <textarea id="goal" value={goal} onChange={(event) => setGoal(event.target.value)} />
        <div className="modal__actions"><button className="button button--ghost" onClick={() => setGoalOpen(false)}>Cancel</button><button className="button button--primary" onClick={() => { updateAthlete({ goal }); setGoalOpen(false); setNotice('Goal version updated. Existing history was preserved.') }}>Save new goal version</button></div>
      </Modal>
    </div>
  )
}
