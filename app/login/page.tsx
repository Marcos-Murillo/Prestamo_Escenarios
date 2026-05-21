"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { Eye, EyeOff, Trophy } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { signIn, usuario, loading: authLoading } = useAuth()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword]     = useState("")
  const [showPass, setShowPass]     = useState(false)
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    if (!authLoading && usuario) {
      if (usuario.rol === "superadmin") router.replace("/superadmin")
      else if (usuario.rol === "admin") router.replace("/admin")
      else router.replace("/mis-reservas")
    }
  }, [authLoading, usuario, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier || !password) {
      toast.error("Completa todos los campos")
      return
    }
    setLoading(true)
    try {
      await signIn(identifier, password)
      toast.success("Sesión iniciada")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ""
      if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found")) {
        toast.error("Usuario o contraseña incorrectos")
      } else {
        toast.error("Error al iniciar sesión")
      }
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
      {/* Banda superior de color */}
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />

      <Card className="w-full max-w-md border-border shadow-xl">
        {/* Header con fondo primary */}
        <CardHeader className="rounded-t-lg bg-primary px-8 py-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
            <Trophy className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reservas Escenarios</h1>
          <p className="mt-1 text-sm text-white/70">Sistema universitario de canchas deportivas</p>
        </CardHeader>

        <CardContent className="px-8 py-8">
          <h2 className="mb-6 text-center text-lg font-semibold text-foreground">
            Iniciar Sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium">
                Carnet de estudiante
              </Label>
              <Input
                id="identifier"
                type="text"
                placeholder="Ej: 1007260358"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                autoComplete="username"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
              disabled={loading}
            >
              {loading ? <Spinner size="sm" className="mr-2" /> : null}
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-medium text-secondary hover:underline">
              Regístrate aquí
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
