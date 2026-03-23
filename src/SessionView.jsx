import { useState } from 'react'
import ExerciseCard from './ExerciseCard.jsx'
import { SESSION_A, SESSION_B, ALL_WEIGHTS, getSets } from './lifting.js'

export default function SessionView({ state, onSave }) {
  const [diffs, setDiffs]       = useState({})
  const [overrides, setOverrides] = useState({})
  const [repsLog, setRepsLog]   = useState({}) // { exercise: [r1, r2, r3, r4, r5] }
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)

  const exercises = state.sessionType === 'A' ? SESSION_A : SESSION_B

  function handleDiffChange(exercise, diff) {
    setDiffs(prev => ({ ...prev, [exercise]: diff }))
  }

  function handleRepsChange(exercise, setIndex, value) {
    setRepsLog(prev => {
      const current = prev[exercise] ?? Array(getSets(exercise)).fill(5)
      const updated = [...current]
      updated[setIndex] = value
      return { ...prev, [exercise]: updated }
    })
  }

  function adjustWeight(exercise, dir) {
    const current = overrides[exercise] !== undefined ? overrides[exercise] : state.workingWeights[exercise]
    const idx = ALL_WEIGHTS.indexOf(current)
    const newIdx = Math.max(0, Math.min(ALL_WEIGHTS.length - 1, idx + dir))
    setOverrides(prev => ({ ...prev, [exercise]: ALL_WEIGHTS[newIdx] }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const result = await onSave(exercises, diffs, overrides, repsLog)
    if (result?.error) setError(result.error)
    else { setDiffs({}); setOverrides({}); setRepsLog({}) }
    setSaving(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="font-mono text-xs t-muted uppercase tracking-wider">Session {state.sessionType}</p>
        <span className="font-mono text-xs t-muted">
          {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {exercises.map(ex => (
        <ExerciseCard key={ex} exercise={ex} history={state.history}
          workingWeight={state.workingWeights[ex]}
          diff={diffs[ex]}
          onDiffChange={handleDiffChange}
          reps={repsLog[ex] ?? Array(getSets(ex)).fill(5)}
          onRepsChange={handleRepsChange}
          weightOverride={overrides[ex]}
          onWeightChange={adjustWeight}
          onStartingWeightChange={adjustWeight} />
      ))}

      {error && <p className="note-danger mb-3">{error}</p>}

      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? 'Saving...' : 'Save session'}
      </button>
    </div>
  )
}
