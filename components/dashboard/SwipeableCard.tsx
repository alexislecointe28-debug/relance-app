'use client'
import { useRef, useEffect, ReactNode } from 'react'

interface SwipeableCardProps {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onSwipeX: (x: number) => void
  disabled?: boolean
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function SwipeableCard({
  onSwipeLeft, onSwipeRight, onSwipeX, disabled, children, className, style
}: SwipeableCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const currentX = useRef(0)
  const active = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function onTouchStart(e: TouchEvent) {
      if (disabled) return
      startX.current = e.touches[0].clientX
      currentX.current = 0
      active.current = true
    }

    function onTouchMove(e: TouchEvent) {
      if (!active.current || disabled) return
      const dx = e.touches[0].clientX - startX.current
      // Seulement bloquer si le mouvement est clairement horizontal
      if (Math.abs(dx) > Math.abs(e.touches[0].clientY - (e as any)._startY || 0) && Math.abs(dx) > 5) {
        e.preventDefault()
      }
      currentX.current = dx
      onSwipeX(dx)
    }

    function onTouchEnd() {
      if (!active.current) return
      active.current = false
      const dx = currentX.current
      if (Math.abs(dx) > 80) {
        if (dx < 0) onSwipeLeft()
        else onSwipeRight()
      } else {
        onSwipeX(0)
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }) // Pas de deps — re-bind à chaque render pour avoir les derniers callbacks

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}
