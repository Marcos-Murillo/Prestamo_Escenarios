"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { searchGymUser, getGymCduRegistrationUrl } from "@/lib/gym-user-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { ExternalLink, Search, Trophy } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { loginGym, usuario, loading: authLoading, isStaff } = useAuth()

  const [termino, setTermino] = useState("")
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const gymUrl = getGymCduRegistrationUrl()

  useEffect(() => {
    if (!authLoading && usuario) {
      if (isStaff) router.replace("/admin")
      else router.replace("/mis-reservas")
    }
  }, [authLoading, usuario, isStaff, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = termino.trim()
    if (t.length < 3) {
      toast.error("Ingresa tu cédula o código estudiantil (mínimo 3 caracteres)")
      return
    }

    setLoading(true)
    setNotFound(false)
    try {
      const { found, user, error } = await searchGymUser(t)
      if (error) {
        toast.error(error)
        return
      }
      if (!found || !user) {
        setNotFound(true)
        return
      }
      loginGym(user)
      toast.success(`Bienvenido, ${user.nombres}`)
      router.replace("/mis-reservas")
    } catch {
      toast.error("Error al verificar tu identidad")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />

      <Card className="w-full max-w-md border-border shadow-xl">
        <CardHeader className="rounded-t-lg bg-primary px-8 py-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
            <Trophy className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white leading-snug">
            Solicita el préstamo de un escenario deportivo de la Universidad del Valle
          </h1>
        </CardHeader>

        <CardContent className="px-8 py-8">
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Ingresa tu cédula o código estudiantil. Debes estar registrado en Gym Control CDU.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="termino">Cédula o código estudiantil</Label>
              <Input
                id="termino"
                type="text"
                inputMode="numeric"
                placeholder="Ej: 1007260358 o 202625413"
                value={termino}
                onChange={(e) => {
                  setTermino(e.target.value)
                  setNotFound(false)
                }}
                disabled={loading}
                autoComplete="off"
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-2"
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : <Search className="h-4 w-4" />}
              {loading ? "Verificando..." : "Continuar"}
            </Button>
          </form>

          {notFound && (
            <div className="mt-6 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm space-y-3">
              <p className="text-foreground">
                No encontramos tu registro en Gym Control. Debes inscribirte primero para solicitar un préstamo.
              </p>
              <Button variant="outline" className="w-full gap-2" asChild>
                <a href={gymUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Registrarme en Gym Control CDU
                </a>
              </Button>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            ¿Eres administrador?{" "}
            <Link href="/auth/sso" className="underline hover:text-foreground">
              Accede desde CampusFlow
            </Link>
          </p>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} CDU — Centro Deportivo Universitario
      </p>
    </div>
  )
}
