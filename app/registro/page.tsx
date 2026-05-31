"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Registro eliminado — redirige al identificador gym. */
export default function RegistroRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/login")
  }, [router])
  return null
}
