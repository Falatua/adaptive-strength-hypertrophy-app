import type { AthleteLevel } from '../domain/athlete-level-engine'

/**
 * The athlete's level and how far the current level has been filled. The number beside the character
 * means nothing on its own, so the word Level always travels with it, and the bar shows how much work
 * is left rather than making the athlete open a second screen to find out.
 */
export function LevelProgress({ progress, compact }: { progress: AthleteLevel; compact?: boolean }) {
  const remaining = Math.max(0, progress.pointsForNextLevel - progress.pointsIntoLevel)
  const percent = Math.round(progress.progressToNextLevel * 100)
  return (
    <div className={`level-progress ${compact ? 'level-progress--compact' : ''}`}>
      <div className="level-progress__head">
        <strong>Level {progress.level}</strong>
        {!compact && <span>{progress.formName}</span>}
      </div>
      <div
        className="level-progress__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={`Level ${progress.level} experience, ${percent} percent toward level ${progress.level + 1}`}
      >
        <i style={{ width: `${percent}%` }} />
      </div>
      <small>{progress.pointsIntoLevel.toLocaleString()} / {progress.pointsForNextLevel.toLocaleString()} XP · {remaining.toLocaleString()} to level {progress.level + 1}</small>
    </div>
  )
}
