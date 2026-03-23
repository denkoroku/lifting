import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import { useTracker } from './useTracker.js'
import LoginScreen from './LoginScreen.jsx'
import SessionView from './SessionView.jsx'
import HistoryView from './HistoryView.jsx'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-mono text-xs t-muted tracking-widest uppercase">Loading...</p>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [view, setView] = useState('session')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const tracker = useTracker(session?.user?.id)

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  async function handleSave(exercises, diffs, overrides) {
    const result = await tracker.saveSession(exercises, diffs, overrides)
    if (!result?.error) setView('history')
    return result
  }

  async function handleClear() {
    await tracker.clearAll()
  }

  if (session === undefined) return <LoadingScreen />
  if (!session) return <LoginScreen />
  if (tracker.loading) return <LoadingScreen />

  const email = session.user.email
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-8 pb-16">
        <header className="flex justify-between items-center mb-8 pb-4"
          style={{ borderBottom: '1px solid color-mix(in srgb, var(--border) 25%, transparent)' }}>
          <div>
            <h1 className="font-mono text-sm tracking-widest t-strong">Lifting Tracker</h1>
            <p className="font-mono text-xs t-muted mt-0.5">Session {tracker.sessionType} &mdash; {email}</p>
          </div>
          <button onClick={handleSignOut}
            className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs t-body transition-colors"
            style={{ backgroundColor: 'var(--surface)' }} title="Sign out">
            {initials}
          </button>
        </header>

        {tracker.error && (
          <div className="note-danger flex justify-between mb-4">
            <span>{tracker.error}</span>
            <button onClick={tracker.reload} className="underline">Retry</button>
          </div>
        )}

        <div className="flex gap-1.5 mb-6">
          {['session', 'history'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className="px-4 py-1.5 rounded-lg font-mono text-xs uppercase tracking-wider transition-colors"
              style={view === v
                ? { backgroundColor: 'var(--text-strong)', color: 'var(--bg)' }
                : { color: 'var(--text-muted)' }}>
              {v}
            </button>
          ))}
        </div>

        {view === 'session' && <SessionView state={tracker} onSave={handleSave} />}
        {view === 'history' && <HistoryView history={tracker.history} onClear={handleClear} />}
      </div>
    </div>
  )
}
