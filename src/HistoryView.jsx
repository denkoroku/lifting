import { ALL_EXERCISES, DIFFICULTY } from './lifting.js'

export default function HistoryView({ history, onClear }) {
  const exercisesWithHistory = ALL_EXERCISES.filter(ex => history.some(h => h.exercise === ex))

  async function handleClear() {
    if (!window.confirm('Delete all your history and reset weights? This cannot be undone.')) return
    await onClear()
  }

  if (exercisesWithHistory.length === 0) {
    return <p className="font-mono text-xs t-muted py-4">No sessions saved yet.</p>
  }

  const borderStyle = { borderBottom: '1px solid color-mix(in srgb, var(--border) 20%, transparent)' }

  return (
    <div>
      {exercisesWithHistory.map(ex => {
        const entries = history.filter(h => h.exercise === ex).slice().reverse()
        return (
          <div key={ex} className="mb-8">
            <p className="label mb-3">{ex}</p>
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr style={borderStyle}>
                    {['Date', 'Weight', 'Reps', 'Volume', 'Feel'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 label font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => {
                    const repsDisplay = e.reps_log
                      ? e.reps_log.join('-')
                      : `${e.sets}×${e.reps}`
                    return (
                      <tr key={i} style={i < entries.length - 1 ? borderStyle : {}}>
                        <td className="px-4 py-2.5 t-body">{e.date}</td>
                        <td className="px-4 py-2.5 t-strong font-medium">{e.weight}kg</td>
                        <td className="px-4 py-2.5 t-body">{repsDisplay}</td>
                        <td className="px-4 py-2.5 t-body">{e.volume}kg</td>
                        <td className="px-4 py-2.5">
                          <span className={`badge-${e.difficulty}`}>
                            {DIFFICULTY[e.difficulty]?.emoji} {DIFFICULTY[e.difficulty]?.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      <div style={{ borderTop: '1px solid color-mix(in srgb, var(--border) 20%, transparent)', paddingTop: '1rem', marginTop: '1rem' }}>
        <button onClick={handleClear} className="btn-danger">Clear all my data</button>
      </div>
    </div>
  )
}
