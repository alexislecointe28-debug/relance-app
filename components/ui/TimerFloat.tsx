'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const PRESETS = [5, 15, 25, 45]

export default function TimerFloat() {
  const [open, setOpen] = useState(false)
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const total = minutes * 60 + seconds
  const [initial, setInitial] = useState(25 * 60)
  const progress = initial > 0 ? (total / initial) * 100 : 0

  function playAlarm() {
    try {
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const freqs = [880, 660, 880, 660]
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = freq
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.3)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.25)
        osc.start(ctx.currentTime + i * 0.3)
        osc.stop(ctx.currentTime + i * 0.3 + 0.25)
      })
    } catch {}
  }

  const tick = useCallback(() => {
    setSeconds(s => {
      if (s > 0) return s - 1
      setMinutes(m => {
        if (m > 0) return m - 1
        setRunning(false)
        setFinished(true)
        setOpen(true)
        playAlarm()
        return 0
      })
      return s > 0 ? s - 1 : 59
    })
  }, [])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, tick])

  function selectPreset(min: number) {
    setMinutes(min)
    setSeconds(0)
    setInitial(min * 60)
    setRunning(false)
    setFinished(false)
  }

  function handleStart() {
    setFinished(false)
    setRunning(true)
  }

  function handleReset() {
    setRunning(false)
    setFinished(false)
    setSeconds(0)
    setMinutes(initial / 60)
  }

  const pad = (n: number) => String(n).padStart(2, '0')
  const circumference = 2 * Math.PI * 20
  const dashOffset = circumference * (1 - progress / 100)

  return (
    <div className="fixed bottom-24 sm:bottom-6 left-4 sm:left-6 z-50 flex flex-col items-end gap-2">

      {/* Panel */}
      {open && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl w-56 p-4 animate-slide-up">

          {finished && (
            <div className="text-center mb-3 text-sm font-semibold text-emerald-600 animate-pulse">
              ✅ Temps écoulé !
            </div>
          )}

          {/* Circular timer */}
          <div className="flex justify-center mb-3">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                <circle cx="24" cy="24" r="20" fill="none" stroke="#F1F5F9" strokeWidth="3"/>
                <circle
                  cx="24" cy="24" r="20" fill="none"
                  stroke={finished ? '#10B981' : running ? '#6366F1' : '#CBD5E1'}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-900 font-mono">{pad(minutes)}:{pad(seconds)}</span>
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="flex gap-1 mb-3">
            {PRESETS.map(p => (
              <button key={p} onClick={() => selectPreset(p)}
                className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
                  initial === p * 60 && !running
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {p}m
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {!running ? (
              <button onClick={handleStart}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold">
                {finished || (minutes === 0 && seconds === 0) ? 'Relancer' : '▶ Démarrer'}
              </button>
            ) : (
              <button onClick={() => setRunning(false)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold">
                ⏸ Pause
              </button>
            )}
            <button onClick={handleReset}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl text-xs">
              ↺
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`rounded-2xl shadow-lg flex items-center gap-2 px-3 py-2 transition-all ${
          running ? 'bg-indigo-600 hover:bg-indigo-700' : finished ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-white hover:bg-gray-50 border border-gray-200'
        }`}
      >
        {running ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span className="text-white text-xs font-bold font-mono">{pad(minutes)}:{pad(seconds)}</span>
          </>
        ) : finished ? (
          <>
            <span className="text-white text-sm">✅</span>
            <span className="text-white text-xs font-semibold">Terminé !</span>
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span className="text-indigo-600 text-xs font-semibold">Focus</span>
          </>
        )}
      </button>
    </div>
  )
}
