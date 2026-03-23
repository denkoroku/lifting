import { useState } from 'react'
import { ALL_WEIGHTS, getSets, warmupSets, getStallCount, computeNextWeight, nearestWeight, DIFFICULTY } from './lifting.js'

function ProgNote({ stalls, lastEntry, weight }) {
  if (stalls >= 3) {
    const deload = nearestWeight(weight * 0.9)
    return <div className="note-danger mb-4">Deload triggered — suggested weight: {deload}kg</div>
  }
  if (stalls === 2) {
    return <div className="note-warn mb-4">Stalled 2 sessions — one more triggers a deload</div>
  }
  if (lastEntry) {
    const next = computeNextWeight(lastEntry.weight, lastEntry.difficulty)
    if (next > lastEntry.weight) {
      return (
        <div className="note-info mb-4">
          Last session {DIFFICULTY[lastEntry.difficulty]?.emoji} {lastEntry.difficulty} — suggested: {next}kg
        </div>
      )
    }
  }
  return null
}

function DiffButton({ difficulty, selected, onClick }) {
  const { label, emoji } = DIFFICULTY[difficulty]
  const selectedClass = { easy: 'diff-easy-on', neutral: 'diff-neutral-on', hard: 'diff-hard-on' }[difficulty]
  return (
    <button className={`diff-base ${selected ? selectedClass : ''}`} onClick={onClick}>
      <span>{emoji}</span>
      <span>{label}</span>
    </button>
  )
}

export default function ExerciseCard({ exercise, history, workingWeight, diff, onDiffChange, onRepsChange, reps, weightOverride, onWeightChange, onStartingWeightChange }) {
  const hasHistory = history.some(h => h.exercise === exercise)
  const w = weightOverride !== undefined ? weightOverride : workingWeight
  const sets = getSets(exercise)
  const warm = warmupSets(w)
  const stalls = getStallCount(history, exercise)
  const lastEntry = history.filter(h => h.exercise === exercise).slice(-1)[0]
  const wIdx = ALL_WEIGHTS.indexOf(w)

  const [doneWarmup, setDoneWarmup] = useState(new Set())
  const [doneWorking, setDoneWorking] = useState(new Set())

  const borderFaint = { border: '1px solid color-mix(in srgb, var(--border) 30%, transparent)' }
  const dividerTop  = { borderTop: '1px solid color-mix(in srgb, var(--border) 20%, transparent)' }

  function toggleWarmup(i) {
    setDoneWarmup(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function toggleWorking(i) {
    setDoneWorking(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="card mb-4">
      <div className="flex justify-between items-baseline mb-4">
        <h3 className="font-medium t-strong">{exercise}</h3>
        <span className="font-mono text-xs t-muted">{sets}×5 @ {w}kg</span>
      </div>

      {!hasHistory && (
        <div className="note-info mb-4 flex items-center justify-between gap-4">
          <span>Set starting weight</span>
          <div className="flex items-center gap-2">
            <button disabled={wIdx <= 0} onClick={() => onStartingWeightChange(exercise, -1)}
              className="w-7 h-7 flex items-center justify-center rounded t-body font-mono disabled:opacity-30"
              style={borderFaint}>−</button>
            <span className="font-mono text-sm t-strong w-16 text-center">{w}kg</span>
            <button disabled={wIdx >= ALL_WEIGHTS.length - 1} onClick={() => onStartingWeightChange(exercise, 1)}
              className="w-7 h-7 flex items-center justify-center rounded t-body font-mono disabled:opacity-30"
              style={borderFaint}>+</button>
          </div>
        </div>
      )}

      <ProgNote stalls={stalls} lastEntry={lastEntry} weight={w} />

      {/* ── Warm-up ── */}
      <p className="label mb-2">Warm-up — tap when done</p>
      <div className="flex gap-2 flex-wrap mb-5">
        {warm.map((ww, i) => {
          const done = doneWarmup.has(i)
          return (
            <button key={i} onClick={() => toggleWarmup(i)}
              className="font-mono text-xs px-3 py-1 rounded-full transition-all"
              style={done
                ? { backgroundColor: 'var(--bg)', color: 'var(--accent-green)', border: '1px solid color-mix(in srgb, var(--accent-green) 40%, transparent)', textDecoration: 'line-through', opacity: 0.5 }
                : { backgroundColor: 'var(--bg)', color: 'var(--text-muted)', ...borderFaint }
              }>
              {ww}kg
            </button>
          )
        })}
      </div>

      {/* ── Working sets ── */}
      <p className="label mb-2">Working sets @ {w}kg — tap when done</p>
      <div className="divide-theme mb-4">
        {Array.from({ length: sets }, (_, i) => {
          const done = doneWorking.has(i)
          return (
            <div key={i} className="flex items-center gap-3 py-2.5" style={done ? { opacity: 0.5 } : {}}>
              <button onClick={() => toggleWorking(i)}
                className="font-mono text-xs t-muted w-10 text-left transition-all"
                style={done ? { textDecoration: 'line-through', color: 'var(--accent-green)' } : {}}>
                Set {i + 1}
              </button>
              <span className="font-mono text-xs t-muted flex-1">target: 5 reps</span>
              <div className="flex items-center gap-2">
                <button onClick={() => onRepsChange(exercise, i, Math.max(0, (reps[i] ?? 5) - 1))}
                  className="w-7 h-7 flex items-center justify-center rounded t-body font-mono disabled:opacity-30"
                  style={borderFaint}>−</button>
                <span className="font-mono text-sm t-strong w-6 text-center">{reps[i] ?? 5}</span>
                <button onClick={() => onRepsChange(exercise, i, Math.min(10, (reps[i] ?? 5) + 1))}
                  className="w-7 h-7 flex items-center justify-center rounded t-body font-mono"
                  style={borderFaint}>+</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Difficulty ── */}
      <div className="flex items-center justify-between pt-3" style={dividerTop}>
        <p className="label">How did it feel?</p>
        <div className="flex gap-1.5">
          {Object.keys(DIFFICULTY).map(d => (
            <DiffButton key={d} difficulty={d} selected={diff === d} onClick={() => onDiffChange(exercise, d)} />
          ))}
        </div>
      </div>

      {/* ── Weight adjuster ── */}
      {hasHistory && (
        <div className="flex items-center gap-3 mt-3 pt-3" style={dividerTop}>
          <button disabled={wIdx <= 0} onClick={() => onWeightChange(exercise, -1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg t-body font-mono transition-colors disabled:opacity-30"
            style={borderFaint}>−</button>
          <span className="font-mono text-xs t-muted flex-1">{w}kg working weight</span>
          <button disabled={wIdx >= ALL_WEIGHTS.length - 1} onClick={() => onWeightChange(exercise, 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg t-body font-mono transition-colors disabled:opacity-30"
            style={borderFaint}>+</button>
        </div>
      )}
    </div>
  )
}
