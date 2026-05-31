"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"
import type { SessionUser, UserRol } from "./types"
import type { GymUserPublic } from "./gym-user-types"
import type { Sede, SedeFiltro } from "./sede"
import { DEFAULT_SEDE, resolveSede } from "./sede"

const GYM_SESSION_KEY = "prestamos_gym_session"
const SSO_STORAGE_KEY = "prestamos_sso_session"

export type SsoLoginPayload = {
  uid: string
  nombre: string
  cedula: string
  rol: UserRol
  sede?: string
}

const DEMO_SOLICITANTE: SessionUser = {
  uid: "demo-gym-user",
  rol: "solicitante",
  gymUserId: "demo-gym-user",
  nombres: "Juan Pérez Demo",
  correo: "estudiante@universidad.edu",
  numeroDocumento: "1007260358",
  codigoEstudiantil: "202625413",
  estamento: "ESTUDIANTE",
  facultad: "Ingeniería",
  programaAcademico: "Ingeniería en Sistemas",
}

const DEMO_ADMIN: SessionUser = {
  uid: "demo-admin",
  rol: "admin",
  nombre: "Admin Demo",
  cedula: "1234567890",
  sede: "melendez",
  adminSedeActiva: "melendez",
}

interface AuthContextType {
  usuario: SessionUser | null
  loading: boolean
  isDemo: boolean
  isSso: boolean
  isSolicitante: boolean
  isStaff: boolean
  adminSede: SedeFiltro
  signOut: () => Promise<void>
  loginGym: (user: GymUserPublic) => void
  loginSSO: (data: SsoLoginPayload) => void
  setAdminSedeActiva: (sede: SedeFiltro) => void
  demoLogin: (tipo: "solicitante" | "admin") => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function gymUserToSession(user: GymUserPublic): SessionUser {
  return {
    uid: user.id,
    rol: "solicitante",
    gymUserId: user.id,
    nombres: user.nombres,
    correo: user.correo,
    numeroDocumento: user.numeroDocumento,
    codigoEstudiantil: user.codigoEstudiantil,
    estamento: user.estamento,
    facultad: user.facultad,
    programaAcademico: user.programaAcademico,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)
  const [isSso, setIsSso] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const ssoRaw = sessionStorage.getItem(SSO_STORAGE_KEY)
    if (ssoRaw) {
      try {
        setUsuario(JSON.parse(ssoRaw) as SessionUser)
        setIsSso(true)
        setLoading(false)
        return
      } catch {
        sessionStorage.removeItem(SSO_STORAGE_KEY)
      }
    }

    const gymRaw = sessionStorage.getItem(GYM_SESSION_KEY)
    if (gymRaw) {
      try {
        setUsuario(JSON.parse(gymRaw) as SessionUser)
        setIsSso(false)
      } catch {
        sessionStorage.removeItem(GYM_SESSION_KEY)
      }
    }

    setLoading(false)
  }, [])

  const loginGym = useCallback((user: GymUserPublic) => {
    const session = gymUserToSession(user)
    setUsuario(session)
    setIsSso(false)
    setIsDemo(false)
    sessionStorage.setItem(GYM_SESSION_KEY, JSON.stringify(session))
    sessionStorage.removeItem(SSO_STORAGE_KEY)
  }, [])

  const loginSSO = useCallback((data: SsoLoginPayload) => {
    const sede = data.sede ? resolveSede(data.sede) : undefined
    const ssoUsuario: SessionUser = {
      uid: data.uid,
      rol: data.rol,
      nombre: data.nombre,
      cedula: data.cedula,
      sede,
      adminSedeActiva: data.rol === "superadmin" ? "todas" : sede ?? DEFAULT_SEDE,
    }
    setUsuario(ssoUsuario)
    setIsSso(true)
    setIsDemo(false)
    sessionStorage.setItem(SSO_STORAGE_KEY, JSON.stringify(ssoUsuario))
    sessionStorage.removeItem(GYM_SESSION_KEY)
  }, [])

  const setAdminSedeActiva = useCallback((sede: SedeFiltro) => {
    setUsuario((prev) => {
      if (!prev || prev.rol === "solicitante") return prev
      const updated = { ...prev, adminSedeActiva: sede }
      sessionStorage.setItem(SSO_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const signOut = async () => {
    sessionStorage.removeItem(SSO_STORAGE_KEY)
    sessionStorage.removeItem(GYM_SESSION_KEY)
    setUsuario(null)
    setIsSso(false)
    setIsDemo(false)
  }

  const demoLogin = (tipo: "solicitante" | "admin") => {
    const demoUsuario = tipo === "admin" ? DEMO_ADMIN : DEMO_SOLICITANTE
    setUsuario(demoUsuario)
    setIsDemo(true)
    setIsSso(false)
    if (tipo === "solicitante") {
      sessionStorage.setItem(GYM_SESSION_KEY, JSON.stringify(demoUsuario))
    }
  }

  const isSolicitante = usuario?.rol === "solicitante"
  const isStaff = usuario?.rol === "admin" || usuario?.rol === "superadmin"

  const adminSede: SedeFiltro =
    usuario?.rol === "superadmin"
      ? (usuario.adminSedeActiva ?? "todas")
      : usuario?.rol === "admin"
        ? (usuario.sede ?? DEFAULT_SEDE)
        : DEFAULT_SEDE

  return (
    <AuthContext.Provider
      value={{
        usuario,
        loading,
        isDemo,
        isSso,
        isSolicitante,
        isStaff,
        adminSede,
        signOut,
        loginGym,
        loginSSO,
        setAdminSedeActiva,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return context
}

/** Sede efectiva para filtrar datos admin. */
export function getEffectiveAdminSede(usuario: SessionUser | null): SedeFiltro {
  if (!usuario || usuario.rol === "solicitante") return DEFAULT_SEDE
  if (usuario.rol === "superadmin") return usuario.adminSedeActiva ?? "todas"
  return usuario.sede ?? DEFAULT_SEDE
}

export function matchesAdminSede<T extends { sede?: string }>(
  item: T,
  sedeFiltro: SedeFiltro,
): boolean {
  if (sedeFiltro === "todas") return true
  return resolveSede(item.sede) === resolveSede(sedeFiltro)
}

export function getSolicitanteId(usuario: SessionUser): string {
  return usuario.gymUserId ?? usuario.uid
}

export function getSolicitanteDisplayName(usuario: SessionUser): string {
  return usuario.nombres ?? usuario.nombre ?? "Usuario"
}
