"use client"

import { useEffect, useState } from "react"
import { ASISTENCIA_URL, isLocalHost } from "@/lib/asistencia-url"
import { LocalPrestamosHome } from "@/components/local-prestamos-home"
import { Spinner } from "@/components/ui/spinner"

export function IrAAsistencia() {
  const [local, setLocal] = useState(false)

  useEffect(() => {
    if (isLocalHost()) {
      setLocal(true)
      return
    }
    window.location.replace(ASISTENCIA_URL)
  }, [])

  if (!local) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return <LocalPrestamosHome />
}
