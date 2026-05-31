"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Spinner } from "@/components/ui/spinner"

function SSOHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loginSSO } = useAuth()
  const [error, setError] = useState("")

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) {
      setError("Token no proporcionado.")
      return
    }

    fetch("/api/auth/verify-sso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
          return
        }
        loginSSO({
          uid: data.uid,
          nombre: data.nombre,
          cedula: data.cedula,
          rol: data.rol,
          sede: data.sede,
        })

        const redirectParam = searchParams.get("redirect")
        const defaultRedirect = data.rol === "superadmin" || data.rol === "admin" ? "/admin" : "/mis-reservas"

        const allowed = ["/admin", "/admin/peticiones", "/admin/escenarios", "/admin/calendario", "/admin/estadisticas", "/reservas"]
        const target =
          redirectParam && allowed.some((p) => redirectParam.startsWith(p))
            ? redirectParam === "/superadmin"
              ? "/admin"
              : redirectParam
            : defaultRedirect

        router.replace(target)
      })
      .catch(() => setError("Error al verificar el acceso."))
  }, [searchParams, loginSSO, router])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4">
        <p className="text-center text-sm text-destructive">{error}</p>
        <a href="/login" className="text-sm text-muted-foreground underline">
          Volver al inicio
        </a>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

export default function SSOPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <SSOHandler />
    </Suspense>
  )
}
