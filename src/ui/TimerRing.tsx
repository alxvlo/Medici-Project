import { useEffect, useRef, useState, type CSSProperties } from 'react'

/**
 * Counts down from `seconds` while `running` and calls `onExpire` once at zero. It polls a fixed deadline
 * rather than chaining one timeout per render, so the whole countdown lives in a single interval: that keeps
 * it accurate when the tab is throttled, and lets Playwright's fake clock run it out with one `runFor`.
 */
export function useCountdown(seconds: number, running: boolean, onExpire: () => void) {
  const [left, setLeft] = useState(seconds)
  const expire = useRef(onExpire)
  useEffect(() => { expire.current = onExpire })
  useEffect(() => {
    if (!running) return
    const deadline = Date.now() + seconds * 1000
    const t = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setLeft(remaining)
      if (remaining === 0) { window.clearInterval(t); expire.current() }
    }, 250)
    return () => window.clearInterval(t)
  }, [running, seconds])
  return left
}

export function TimerRing({ left, total }: { left: number; total: number }) {
  return (
    <div className="timer" role="timer" aria-label={`${left} seconds left`} style={{ '--p': left / total } as CSSProperties}>
      <span>{left}</span>
    </div>
  )
}
