"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db, isFirebaseConfigured } from "./firebase"
import { Usuario } from "./types"

// Usuario demo para cuando Firebase no esta configurado
const DEMO_USER: Usuario = {
  uid: "demo-user-123",
  email: "estudiante@universidad.edu",
  nombre: "Juan",
  apellido: "Perez Demo",
  carnet: "2024001",
  carrera: "Ingenieria en Sistemas",
  telefono: "5555-1234",
  rol: "estudiante",
  createdAt: new Date(),
}

const DEMO_ADMIN: Usuario = {
  uid: "demo-admin-123",
  email: "admin@universidad.edu",
  nombre: "Admin",
  apellido: "Sistema",
  carnet: "ADMIN001",
  carrera: "Administracion",
  telefono: "5555-0000",
  rol: "admin",
  createdAt: new Date(),
}

const SSO_STORAGE_KEY = "prestamos_sso_session"

export type SsoLoginPayload = {
  uid: string
  nombre: string
  cedula: string
  rol: "estudiante" | "admin" | "superadmin"
}

interface AuthContextType {
  user: User | null
  usuario: Usuario | null
  loading: boolean
  isDemo: boolean
  isSso: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, datos: Omit<Usuario, "uid" | "email" | "rol" | "createdAt">) => Promise<void>
  signOut: () => Promise<void>
  loginSSO: (data: SsoLoginPayload) => void
  demoLogin: (tipo: "estudiante" | "admin") => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(!isFirebaseConfigured)
  const [isSso, setIsSso] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const raw = sessionStorage.getItem(SSO_STORAGE_KEY)
      if (raw) {
        try {
          setUsuario(JSON.parse(raw) as Usuario)
          setIsSso(true)
        } catch {
          sessionStorage.removeItem(SSO_STORAGE_KEY)
        }
      }
    }

    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser && db) {
        const userDoc = await getDoc(doc(db, "usuarios", firebaseUser.uid))
        if (userDoc.exists()) {
          setUsuario(userDoc.data() as Usuario)
          setIsSso(false)
          sessionStorage.removeItem(SSO_STORAGE_KEY)
        }
      } else if (!sessionStorage.getItem(SSO_STORAGE_KEY)) {
        setUsuario(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (emailOrCarnet: string, password: string) => {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error("Firebase no esta configurado. Usa el modo demo.")
    }
    // Si no tiene @ asumimos que es un carnet — convertimos al formato de email interno
    const email = emailOrCarnet.includes("@")
      ? emailOrCarnet
      : `${emailOrCarnet}@admin.prestamos.local`
    const result = await signInWithEmailAndPassword(auth, email, password)
    const userDoc = await getDoc(doc(db, "usuarios", result.user.uid))
    if (userDoc.exists()) {
      setUsuario(userDoc.data() as Usuario)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    datos: Omit<Usuario, "uid" | "email" | "rol" | "createdAt">
  ) => {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error("Firebase no esta configurado. Usa el modo demo.")
    }
    const result = await createUserWithEmailAndPassword(auth, email, password)
    const nuevoUsuario: Usuario = {
      uid: result.user.uid,
      email,
      ...datos,
      rol: "estudiante",
      createdAt: new Date(),
    }
    await setDoc(doc(db, "usuarios", result.user.uid), nuevoUsuario)
    setUsuario(nuevoUsuario)
  }

  const signOut = async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth)
    }
    sessionStorage.removeItem(SSO_STORAGE_KEY)
    setUser(null)
    setUsuario(null)
    setIsSso(false)
    setIsDemo(!isFirebaseConfigured)
  }

  const loginSSO = (data: SsoLoginPayload) => {
    const parts = data.nombre.trim().split(/\s+/)
    const ssoUsuario: Usuario = {
      uid: data.uid,
      email: `${data.cedula}@sso.prestamos.local`,
      nombre: parts[0] ?? data.nombre,
      apellido: parts.slice(1).join(" ") || "CDR",
      carnet: data.cedula,
      carrera: "CDU",
      rol: data.rol,
      createdAt: new Date(),
    }
    setUsuario(ssoUsuario)
    setIsSso(true)
    setIsDemo(false)
    sessionStorage.setItem(SSO_STORAGE_KEY, JSON.stringify(ssoUsuario))
  }

  const demoLogin = (tipo: "estudiante" | "admin") => {
    const demoUsuario = tipo === "admin" ? DEMO_ADMIN : DEMO_USER
    setUsuario(demoUsuario)
    setIsDemo(true)
  }

  return (
    <AuthContext.Provider value={{ user, usuario, loading, isDemo, isSso, signIn, signUp, signOut, loginSSO, demoLogin }}>
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
