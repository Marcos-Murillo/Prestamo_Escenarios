"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Mail, 
  Hash, 
  GraduationCap, 
  Calendar,
  ArrowRight,
  Shield
} from "lucide-react"

export default function PerfilPage() {
  const router = useRouter()
  const { usuario, loading, signOut } = useAuth()

  useEffect(() => {
    if (!loading && !usuario) {
      router.push("/login")
    }
  }, [loading, usuario, router])

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!usuario) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full px-4 py-6 md:py-8">
        <div className="mx-auto max-w-2xl space-y-4 md:space-y-6">
          <div className="mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Mi Perfil</h1>
            <p className="mt-1 text-muted-foreground text-sm">Informacion de tu cuenta</p>
          </div>
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-primary text-2xl md:text-3xl font-bold text-primary-foreground">
                {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
              </div>
              <CardTitle className="mt-3 text-xl md:text-2xl">
                {usuario.nombre} {usuario.apellido}
              </CardTitle>
              <CardDescription className="flex items-center justify-center gap-2">
                {usuario.rol === "admin" || usuario.rol === "superadmin" ? (
                  <Badge className="gap-1">
                    <Shield className="h-3 w-3" />
                    Administrador
                  </Badge>
                ) : (
                  <Badge variant="secondary">Estudiante</Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 md:p-4">
                <Mail className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Correo Electrónico</p>
                  <p className="font-medium text-sm truncate">{usuario.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 md:p-4">
                <Hash className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Código / Documento</p>
                  <p className="font-medium text-sm">{usuario.carnet ?? usuario.codigoEstudiante ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 md:p-4">
                <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Carrera / Estamento</p>
                  <p className="font-medium text-sm truncate">{usuario.carrera}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/reservas">
                  <span className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    Nueva Reserva
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-between" asChild>
                <Link href="/mis-reservas">
                  <span className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    Ver Mis Reservas
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {(usuario.rol === "admin" || usuario.rol === "superadmin") && (
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link href="/admin">
                    <span className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4" />
                      Panel de Administración
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Button variant="destructive" className="w-full" onClick={handleSignOut}>
            Cerrar Sesión
          </Button>
        </div>
      </main>
    </div>
  )
}
