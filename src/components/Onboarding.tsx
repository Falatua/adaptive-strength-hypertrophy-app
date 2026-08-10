import { useState } from 'react'
import { ArrowRight, Check, ShieldCheck, Sparkles } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { PixelAvatar } from './PixelAvatar'

const goals = ['Powerbuilding', 'Strength', 'Hypertrophy', 'Return to training']
const times = [30, 45, 60, 75]

export function Onboarding() {
  const { completeOnboarding } = useAppStore()
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState('Powerbuilding')
  const [minutes, setMinutes] = useState(60)
  const [opportunities, setOpportunities] = useState(3)
  const [experience, setExperience] = useState(8)
  const [continuity, setContinuity] = useState<'stable' | 'interrupted' | 'returning'>('interrupted')

  const finish = () => completeOnboarding({
    trainingAge: experience,
    weeklyOpportunities: opportunities,
    defaultMinutes: minutes,
    goal: `${goal}: protect squat, bench, and sumo while building priority muscles`,
    continuity,
    entryRoute: continuity === 'returning' ? 'Reacclimation + Productive Strength Work' : experience >= 2 ? 'Direct Strength + Hypertrophy Development' : 'Introductory Skill Cycle'
  })

  return (
    <div className="onboarding">
      <div className="onboarding__art">
        <div className="pixel-sun" />
        <div className="pixel-mountain pixel-mountain--one" />
        <div className="pixel-mountain pixel-mountain--two" />
        <PixelAvatar size="large" mood={step === 2 ? 'celebrate' : 'strong'} />
        <div className="onboarding__art-copy">
          <span className="eyebrow">Private Alpha · Local first</span>
          <h1>Build the athlete.<br />Adapt the path.</h1>
          <p>ForgePath remembers what you actually completed, not what the calendar hoped you would do.</p>
        </div>
      </div>
      <div className="onboarding__panel">
        <div className="onboarding__brand"><span className="brand__mark">F</span><strong>ForgePath</strong></div>
        <div className="onboarding__steps" aria-label="Onboarding progress"><span className={step >= 0 ? 'active' : ''} /><span className={step >= 1 ? 'active' : ''} /><span className={step >= 2 ? 'active' : ''} /></div>
        {step === 0 && (
          <section>
            <p className="eyebrow">01 · Your current direction</p>
            <h2>What should training build first?</h2>
            <p className="muted">This can change later. Your history stays intact when the goal changes.</p>
            <div className="choice-grid">
              {goals.map((item) => <button key={item} className={goal === item ? 'selected' : ''} onClick={() => setGoal(item)}>{goal === item && <Check size={16} />}{item}</button>)}
            </div>
            <label className="range-field"><span><strong>Years of structured training</strong><b>{experience}</b></span><input type="range" min="0" max="20" value={experience} onChange={(event) => setExperience(Number(event.target.value))} /></label>
          </section>
        )}
        {step === 1 && (
          <section>
            <p className="eyebrow">02 · Real life capacity</p>
            <h2>What can your schedule support now?</h2>
            <p className="muted">We plan from realistic opportunities, not an ideal week.</p>
            <label className="field-label">Training opportunities each week</label>
            <div className="choice-row">{[2, 3, 4, 5].map((item) => <button key={item} className={opportunities === item ? 'selected' : ''} onClick={() => setOpportunities(item)}>{item}×</button>)}</div>
            <label className="field-label">Usual time per session</label>
            <div className="choice-row">{times.map((item) => <button key={item} className={minutes === item ? 'selected' : ''} onClick={() => setMinutes(item)}>{item}m</button>)}</div>
            <label className="field-label">Recent training continuity</label>
            <div className="stacked-choices">
              {([
                ['stable', 'Stable', 'Training has been consistent for the last month.'],
                ['interrupted', 'Interrupted', 'Some sessions were missed because life got busy.'],
                ['returning', 'Returning', 'A longer gap makes old capacity uncertain.']
              ] as const).map(([id, title, detail]) => <button key={id} className={continuity === id ? 'selected' : ''} onClick={() => setContinuity(id)}><span>{title}<small>{detail}</small></span>{continuity === id && <Check size={18} />}</button>)}
            </div>
          </section>
        )}
        {step === 2 && (
          <section>
            <p className="eyebrow">03 · Starting placement</p>
            <h2>{continuity === 'returning' ? 'Reacclimation with real work' : 'Direct development cycle'}</h2>
            <p className="muted">You are not starting at level one. The first productive sessions verify the app's estimate.</p>
            <div className="placement-card">
              <Sparkles size={22} />
              <div><strong>{goal} path · {minutes} minute sessions</strong><p>{opportunities} realistic opportunities each week with load-first progression and flexible scheduling.</p></div>
            </div>
            <ul className="check-list">
              <li><Check size={16} /> Squat, bench, and sumo remain protected anchors</li>
              <li><Check size={16} /> Surveys are always optional</li>
              <li><Check size={16} /> Missed sessions create no volume debt</li>
              <li><ShieldCheck size={16} /> Your data stays on this device for now</li>
            </ul>
          </section>
        )}
        <div className="onboarding__actions">
          {step > 0 && <button className="button button--ghost" onClick={() => setStep((current) => current - 1)}>Back</button>}
          {step < 2 ? <button className="button button--primary" onClick={() => setStep((current) => current + 1)}>Continue <ArrowRight size={17} /></button> : <button className="button button--primary" onClick={finish}>Enter ForgePath <ArrowRight size={17} /></button>}
        </div>
        <button className="onboarding__skip" onClick={finish}>Use the recommended profile and start now</button>
      </div>
    </div>
  )
}
