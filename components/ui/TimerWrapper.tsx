'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const TimerFloat = dynamic(() => import('./TimerFloat'), { ssr: false })

export default function TimerWrapper() {
  const [loggedIn, setLoggedIn] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (!loggedIn) return null
  return <TimerFloat />
}
