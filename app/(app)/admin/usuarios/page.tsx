"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Los usuarios vienen de Gym Control; esta página ya no aplica. */
export default function AdminUsuariosRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin/peticiones")
  }, [router])
  return null
}
