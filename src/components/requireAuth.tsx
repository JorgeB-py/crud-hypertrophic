'use client'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { useRouter } from 'next/navigation'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.replace('/auth/login')
      else setReady(true)
    })
    return () => unsub()
  }, [router])

  if (!ready) return <div className="min-h-[50vh] grid place-items-center text-muted-foreground">Cargando…</div>
  return <>{children}</>
}
