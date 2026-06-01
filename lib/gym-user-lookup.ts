import { collection, getDocs, limit, query, where } from "firebase/firestore"
import { gymDb } from "./gym-firebase"
import type { GymUserProfile } from "./gym-user-types"

const USERS_COLLECTION = "users"

export const GYM_REGISTRATION_HINT =
  "No estás registrado en Gym Control. Regístrate primero en la app de gimnasio (CDU Control) y vuelve a intentar."

function normalizeAcademicField(value: unknown): string {
  if (value == null) return ""
  const s = String(value).trim()
  if (s === "" || /^n\/a$/i.test(s)) return ""
  return s
}

function mapUserDoc(id: string, data: Record<string, unknown>): GymUserProfile {
  const edadRaw = data.edad
  const edad =
    typeof edadRaw === "number"
      ? edadRaw
      : parseInt(String(edadRaw ?? ""), 10) || 0

  return {
    id,
    nombres: String(data.nombres ?? ""),
    correo: String(data.correo ?? ""),
    genero: String(data.genero ?? ""),
    tipoDocumento: String(data.tipoDocumento ?? ""),
    numeroDocumento: String(data.numeroDocumento ?? ""),
    edad,
    telefono: String(data.telefono ?? ""),
    estamento: String(data.estamento ?? ""),
    facultad: normalizeAcademicField(data.facultad),
    programaAcademico: normalizeAcademicField(data.programaAcademico),
    codigoEstudiantil: data.codigoEstudiantil ? String(data.codigoEstudiantil) : undefined,
    fechaRegistro: String(data.fechaRegistro ?? ""),
    activo: data.activo !== false,
  }
}

/** Una consulta indexada por campo; no descarga toda la colección. */
async function queryByField(field: string, value: string): Promise<GymUserProfile | null> {
  const q = query(collection(gymDb, USERS_COLLECTION), where(field, "==", value), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const docSnap = snap.docs[0]
  return mapUserDoc(docSnap.id, docSnap.data() as Record<string, unknown>)
}

/**
 * Busca usuario en Gym Control por cédula o código estudiantil (coincidencia exacta, trim).
 * Mismo comportamiento que stock_cdu_Sanfer/lib/gym-user-lookup.ts
 */
export async function lookupGymUser(searchTerm: string): Promise<GymUserProfile | null> {
  const term = searchTerm.trim()
  if (!term) return null

  const byDocument = await queryByField("numeroDocumento", term)
  if (byDocument) return byDocument

  const byCode = await queryByField("codigoEstudiantil", term)
  if (byCode) return byCode

  return null
}
