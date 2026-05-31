"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Superadmin interno eliminado — gestión en cdr-landing. */
export default function SuperadminRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin")
  }, [router])
  return null
}
