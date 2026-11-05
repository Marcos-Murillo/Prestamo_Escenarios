"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ASISTENCIA_URL, isLocalHost } from "@/lib/asistencia-url"
import { LocalPrestamosHome } from "@/components/local-prestamos-home"
import { Spinner } from "@/components/ui/spinner"

export default function HomePage() {
  const router = useRouter()
  const { usuario, loading, isStaff } = useAuth()
  const [local, setLocal] = useState(false)

  useEffect(() => {
    setLocal(isLocalHost())
  }, [])

  useEffect(() => {
    if (loading) return
    if (usuario && isStaff) {
      router.replace("/admin")
      return
    }
    if (!isLocalHost()) window.location.replace(ASISTENCIA_URL)
  }, [loading, usuario, isStaff, router])

  if (loading || (usuario && isStaff) || !local) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    )
  }

  return <LocalPrestamosHome />
}
