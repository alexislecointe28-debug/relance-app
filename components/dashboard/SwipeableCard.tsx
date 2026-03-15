'use client'
import { useRef, useEffect, useState, ReactNode } from 'react'

interface SwipeableCardProps {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onSwipeX: (x: number) => void
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  hintKey?: string // clé unique pour mémoriser que le hint a été montré
}

export default function SwipeableCard({
  onSwipeLeft, onSwipeRight, onSwipeX, children, className, style, hintKey
}: SwipeableCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const isHorizontal = useRef<boolean | null>(null)
  const [hintOffset, setHintOffset] = useState(0)
  const [showHintLabel, setShowHintLabel] = useState(false)

  // Animation hint au premier affichage
  useEffect(() => {
    if (!hintKey) return
    const key = `swipe_hint_${hintKey}`
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1')

    // Délai avant le hint pour laisser la carte s'afficher
    const t1 = setTimeout(() => {
      setShowHintLabel(true)
      // Aller à droite
      let x = 0
      const step = 2
      const interval = setInterval(() => {
        x += step
        setHintOffset(x)
        if (x >= 40) {
          clearInterval(interval)
          // Revenir
          const back = setInterval(() => {
            x -= step
            setHintOffset(x)
            if (x <= 0) {
              clearInterval(back)
              setHintOffset(0)
              setShowHintLabel(false)
            }
          }, 8)
        }
      }, 8)
    }, 800)

    return () => clearTimeout(t1)
  }, [hintKey])

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
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        transform: hintOffset !== 0
          ? `translateX(${hintOffset}px) rotate(${hintOffset * 0.04}deg)`
          : style?.transform,
        transition: hintOffset !== 0 ? 'none' : style?.transition,
      }}
    >
      {children}
      {/* Hint label */}
      {showHintLabel && (
        <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none">
          <div className="bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-fade-in">
            <span>←</span> Glisse pour passer <span>→</span>
          </div>
        </div>
      )}
    </div>
  )
}
