'use client'
import dynamic from 'next/dynamic'
const TimerFloat = dynamic(() => import('./TimerFloat'), { ssr: false })
export default function TimerWrapper() {
  return <TimerFloat />
}
