"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth, getSolicitanteDisplayName } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Hash, GraduationCap, Calendar, ArrowRight, Shield } from "lucide-react"

export default function PerfilPage() {
  const router = useRouter()
  const { usuario, loading, signOut, isSolicitante, isStaff } = useAuth()

  useEffect(() => {
    if (!loading && !usuario) router.push("/login")
  }, [loading, usuario, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!usuario) return null

  const displayName = isSolicitante
    ? getSolicitanteDisplayName(usuario)
    : (usuario.nombre ?? "Administrador")

  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full px-4 py-6 md:py-8">
        <div className="mx-auto max-w-2xl space-y-4 md:space-y-6">
          <div className="mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Mi Perfil</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              {isSolicitante ? "Datos desde Gym Control CDU" : "Sesión administrativa"}
            </p>
          </div>
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-primary text-2xl md:text-3xl font-bold text-primary-foreground">
                {initials || <User className="h-8 w-8" />}
              </div>
              <CardTitle className="mt-3 text-xl md:text-2xl">{displayName}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-2">
                {isStaff ? (
                  <Badge className="gap-1">
                    <Shield className="h-3 w-3" />
                    {usuario.rol === "superadmin" ? "Superadmin" : "Administrador"}
                  </Badge>
                ) : (
                  <Badge variant="secondary">{usuario.estamento ?? "Miembro CDU"}</Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isSolicitante && usuario.correo && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 md:p-4">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Correo</p>
                    <p className="font-medium text-sm truncate">{usuario.correo}</p>
                  </div>
                </div>
              )}
              {(usuario.numeroDocumento || usuario.cedula) && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 md:p-4">
                  <Hash className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Documento / Código</p>
                    <p className="font-medium text-sm">
                      {usuario.numeroDocumento ?? usuario.cedula}
                      {usuario.codigoEstudiantil ? ` · ${usuario.codigoEstudiantil}` : ""}
                    </p>
                  </div>
                </div>
              )}
              {isSolicitante && (usuario.programaAcademico || usuario.facultad) && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 md:p-4">
                  <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Programa / Facultad</p>
                    <p className="font-medium text-sm truncate">
                      {[usuario.programaAcademico, usuario.facultad].filter(Boolean).join(" — ")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {isSolicitante && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link href="/reservas">
                    <span className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      Pedir préstamo
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link href="/mis-reservas">
                    <span className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      Mis préstamos
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Button variant="destructive" className="w-full" onClick={async () => { await signOut(); router.push("/login") }}>
            Cerrar sesión
          </Button>
        </div>
      </main>
    </div>
  )
}
