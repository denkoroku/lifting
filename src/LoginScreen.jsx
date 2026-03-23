import { useState } from 'react'
import { supabase } from './supabase.js'

export default function LoginScreen() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [mode, setMode]         = useState('login')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-mono text-base uppercase tracking-widest t-strong mb-1">Lifting tracker</h1>
          <p className="text-sm t-muted font-mono">5×5 programme</p>
        </div>

        <div className="card">
          <div className="flex gap-1 mb-6">
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null) }}
                className="flex-1 py-2 rounded-lg font-mono text-xs uppercase tracking-wider transition-colors"
                style={mode === m
                  ? { backgroundColor: 'var(--text-strong)', color: 'var(--bg)' }
                  : { color: 'var(--text-muted)' }}>
                {m === 'login' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label block mb-1">Email</label>
              <input className="input" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email" />
            </div>
            <div>
              <label className="label block mb-1">Password</label>
              <input className="input" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </div>

            {error && <p className="note-danger">{error}</p>}

            {mode === 'signup' && (
              <p className="text-xs t-muted font-mono">
                After signing up, check your email to confirm your account before signing in.
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary mt-2">
              {loading ? '...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
