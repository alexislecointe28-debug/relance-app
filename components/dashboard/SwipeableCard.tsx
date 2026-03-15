'use client'
import { useRef, useEffect, ReactNode } from 'react'

interface SwipeableCardProps {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onSwipeX: (x: number) => void
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function SwipeableCard({
  onSwipeLeft, onSwipeRight, onSwipeX, children, className, style
}: SwipeableCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const isHorizontal = useRef<boolean | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function onTouchStart(e: TouchEvent) {
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
      isHorizontal.current = null
    }

    function onTouchMove(e: TouchEvent) {
      const dx = e.touches[0].clientX - startX.current
      const dy = e.touches[0].clientY - startY.current

      // Déterminer la direction au premier mouvement significatif
      if (isHorizontal.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy)
      }

      if (isHorizontal.current) {
        e.preventDefault()
        onSwipeX(dx)
      }
    }

    function onTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - startX.current
      onSwipeX(0)
      if (isHorizontal.current && Math.abs(dx) > 60) {
        if (dx < 0) onSwipeLeft()
        else onSwipeRight()
      }
      isHorizontal.current = null
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  })

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}
