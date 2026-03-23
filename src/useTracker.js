import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase.js'
import {
  DEFAULT_WEIGHTS, getSets,
  computeNextWeight, getStallCount, nearestWeight,
} from './lifting.js'

export function useTracker(userId) {
  const [workingWeights, setWorkingWeights] = useState(DEFAULT_WEIGHTS)
  const [history, setHistory]               = useState([])
  const [sessionType, setSessionTypeState]  = useState('A')
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState(null)

  useEffect(() => {
    if (!userId) return
    loadAll()
  }, [userId])

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const [
        { data: ww,   error: wwErr },
        { data: hist, error: histErr },
        { data: pref, error: prefErr },
      ] = await Promise.all([
        supabase.from('working_weights').select('*').eq('user_id', userId),
        supabase.from('sessions').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('user_prefs').select('*').eq('user_id', userId).maybeSingle(),
      ])
      if (wwErr)   throw wwErr
      if (histErr) throw histErr
      if (prefErr) throw prefErr

      if (ww?.length > 0) {
        const merged = { ...DEFAULT_WEIGHTS }
        ww.forEach(row => { merged[row.exercise] = row.weight })
        setWorkingWeights(merged)
      }

      if (hist) {
        setHistory(hist.map(row => ({
          exercise:   row.exercise,
          date:       new Date(row.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          weight:     row.weight,
          sets:       row.sets,
          reps:       row.reps,       // total reps achieved
          reps_log:   row.reps_log,   // array e.g. [5,5,4,5,5]
          volume:     row.volume,
          difficulty: row.difficulty,
        })))
      }

      if (pref?.session_type) setSessionTypeState(pref.session_type)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function setSessionType(type) {
    setSessionTypeState(type)
    await supabase.from('user_prefs')
      .upsert({ user_id: userId, session_type: type }, { onConflict: 'user_id' })
  }

  // repsLog: { exercise: [r1, r2, ...] }
  const saveSession = useCallback(async (exercises, diffs, overrides, repsLog) => {
    const rows = []
    const nextWeights    = { ...workingWeights }
    const updatedHistory = [...history]

    exercises.forEach(ex => {
      const diff = diffs[ex]
      if (!diff) return
      const w        = overrides[ex] !== undefined ? overrides[ex] : workingWeights[ex]
      const sets     = getSets(ex)
      const repsArr  = repsLog[ex] ?? Array(sets).fill(5)
      const totalReps = repsArr.reduce((a, b) => a + b, 0)
      const volume   = w * totalReps

      rows.push({
        user_id:    userId,
        exercise:   ex,
        weight:     w,
        sets,
        reps:       totalReps,
        reps_log:   repsArr,
        volume,
        difficulty: diff,
      })

      updatedHistory.push({ exercise: ex, weight: w, sets, reps: totalReps, reps_log: repsArr, volume, difficulty: diff })

      let next = computeNextWeight(w, diff)
      if (getStallCount(updatedHistory, ex) >= 3) next = nearestWeight(w * 0.9)
      nextWeights[ex] = next
    })

    if (rows.length === 0) return { error: 'Mark at least one exercise before saving.' }

    const nextSessionType = sessionType === 'A' ? 'B' : 'A'

    const { error: sessErr } = await supabase.from('sessions').insert(rows)
    if (sessErr) return { error: sessErr.message }

    const wwRows = Object.entries(nextWeights).map(([exercise, weight]) => ({
      user_id: userId, exercise, weight,
    }))
    const { error: wwErr } = await supabase
      .from('working_weights')
      .upsert(wwRows, { onConflict: 'user_id,exercise' })
    if (wwErr) return { error: wwErr.message }

    await supabase.from('user_prefs')
      .upsert({ user_id: userId, session_type: nextSessionType }, { onConflict: 'user_id' })

    setWorkingWeights(nextWeights)
    setHistory(updatedHistory)
    setSessionTypeState(nextSessionType)
    return { error: null }
  }, [userId, workingWeights, history, sessionType])

  const clearAll = useCallback(async () => {
    const { error: s } = await supabase.from('sessions').delete().eq('user_id', userId)
    const { error: w } = await supabase.from('working_weights').delete().eq('user_id', userId)
    if (s || w) return { error: (s || w).message }
    setHistory([])
    setWorkingWeights(DEFAULT_WEIGHTS)
    setSessionTypeState('A')
    await supabase.from('user_prefs')
      .upsert({ user_id: userId, session_type: 'A' }, { onConflict: 'user_id' })
    return { error: null }
  }, [userId])

  return {
    workingWeights, history, sessionType, setSessionType,
    loading, error, saveSession, clearAll, reload: loadAll,
  }
}
