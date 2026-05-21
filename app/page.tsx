"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Spinner } from "@/components/ui/spinner"

export default function HomePage() {
  const router = useRouter()
  const { usuario, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!usuario) {
      router.replace("/login")
    } else if (usuario.rol === "superadmin") {
      router.replace("/superadmin")
    } else if (usuario.rol === "admin") {
      router.replace("/admin")
    } else {
      router.replace("/mis-reservas")
    }
  }, [loading, usuario, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Spinner size="lg" />
    </div>
  )
}
