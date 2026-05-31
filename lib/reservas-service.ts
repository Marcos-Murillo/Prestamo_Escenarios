import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { db, isFirebaseConfigured } from "./firebase"
import { Reserva } from "./types"
import { filterBySede, type SedeFiltro } from "./sede"

const RESERVAS_COLLECTION = "reservas"

let demoReservas: Reserva[] = [
  {
    id: "demo-1",
    sede: "melendez",
    solicitanteGymUserId: "demo-gym-user",
    solicitanteNumeroDocumento: "1007260358",
    usuarioNombre: "Juan Pérez Demo",
    usuarioEmail: "estudiante@universidad.edu",
    codigoEstudiantil: "202625413",
    canchaId: "futbol-1",
    canchaNombre: "Cancha de Futbol Principal",
    fecha: new Date().toISOString().split("T")[0],
    horaInicio: "10:00",
    horaFin: "11:00",
    estado: "aprobada",
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
  },
]

function mapReservaDoc(id: string, data: Record<string, unknown>): Reserva {
  const gymId = (data.solicitanteGymUserId ?? data.usuarioId) as string
  return {
    id,
    ...data,
    solicitanteGymUserId: gymId,
    solicitanteNumeroDocumento: (data.solicitanteNumeroDocumento ?? data.usuarioCarnet ?? "") as string,
    sede: (data.sede as Reserva["sede"]) ?? "melendez",
    createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.() ?? new Date(),
    updatedAt: (data.updatedAt as { toDate?: () => Date })?.toDate?.() ?? new Date(),
  } as Reserva
}

export async function crearReserva(
  reservaData: Omit<Reserva, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  if (!isFirebaseConfigured || !db) {
    const newId = `demo-${Date.now()}`
    demoReservas.unshift({
      ...reservaData,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return newId
  }

  const docRef = await addDoc(collection(db, RESERVAS_COLLECTION), {
    ...reservaData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return docRef.id
}

export async function obtenerReservasSolicitante(gymUserId: string): Promise<Reserva[]> {
  if (!isFirebaseConfigured || !db) {
    return demoReservas
      .filter((r) => r.solicitanteGymUserId === gymUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const q = query(
    collection(db, RESERVAS_COLLECTION),
    where("solicitanteGymUserId", "==", gymUserId),
  )
  const snap = await getDocs(q)
  let reservas = snap.docs.map((d) => mapReservaDoc(d.id, d.data() as Record<string, unknown>))

  if (reservas.length === 0) {
    const legacyQ = query(collection(db, RESERVAS_COLLECTION), where("usuarioId", "==", gymUserId))
    const legacySnap = await getDocs(legacyQ)
    reservas = legacySnap.docs.map((d) => mapReservaDoc(d.id, d.data() as Record<string, unknown>))
  }

  return reservas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/** @deprecated Use obtenerReservasSolicitante */
export async function obtenerReservasUsuario(usuarioId: string): Promise<Reserva[]> {
  return obtenerReservasSolicitante(usuarioId)
}

export async function obtenerTodasReservas(sedeFiltro?: SedeFiltro): Promise<Reserva[]> {
  if (!isFirebaseConfigured || !db) {
    return filterBySede([...demoReservas], sedeFiltro)
  }

  const q = query(collection(db, RESERVAS_COLLECTION), orderBy("createdAt", "desc"))
  const snap = await getDocs(q)
  const reservas = snap.docs.map((d) => mapReservaDoc(d.id, d.data() as Record<string, unknown>))
  return filterBySede(reservas, sedeFiltro)
}

export async function obtenerReservasPorFechaYCancha(fecha: string, canchaId: string): Promise<Reserva[]> {
  if (!isFirebaseConfigured || !db) {
    return demoReservas.filter(
      (r) =>
        r.fecha === fecha &&
        r.canchaId === canchaId &&
        (r.estado === "pendiente" || r.estado === "aprobada"),
    )
  }

  const q = query(
    collection(db, RESERVAS_COLLECTION),
    where("fecha", "==", fecha),
    where("canchaId", "==", canchaId),
    where("estado", "in", ["pendiente", "aprobada"]),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapReservaDoc(d.id, d.data() as Record<string, unknown>))
}

export async function actualizarEstadoReserva(
  reservaId: string,
  estado: Reserva["estado"],
  motivoRechazo?: string,
  unidadAsignada?: number,
) {
  if (!isFirebaseConfigured || !db) {
    const index = demoReservas.findIndex((r) => r.id === reservaId)
    if (index !== -1) {
      demoReservas[index] = {
        ...demoReservas[index],
        estado,
        motivoRechazo: motivoRechazo || undefined,
        unidadAsignada: unidadAsignada ?? demoReservas[index].unidadAsignada,
        updatedAt: new Date(),
      }
    }
    return
  }

  const payload: Record<string, unknown> = {
    estado,
    motivoRechazo: motivoRechazo || null,
    updatedAt: Timestamp.now(),
  }
  if (unidadAsignada != null) payload.unidadAsignada = unidadAsignada

  await updateDoc(doc(db, RESERVAS_COLLECTION, reservaId), payload)
}

export async function obtenerReserva(reservaId: string): Promise<Reserva | null> {
  if (!isFirebaseConfigured || !db) {
    return demoReservas.find((r) => r.id === reservaId) || null
  }

  const docRef = doc(db, RESERVAS_COLLECTION, reservaId)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    return mapReservaDoc(docSnap.id, docSnap.data() as Record<string, unknown>)
  }
  return null
}

export function formatFecha(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function formatHora(hora: string): string {
  const [h, m] = hora.split(":")
  const hour = parseInt(h)
  const ampm = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12
  return `${hour12}:${m} ${ampm}`
}

export function calcularHoraFin(horaInicio: string): string {
  const [h, m] = horaInicio.split(":")
  const hour = parseInt(h) + 1
  return `${hour.toString().padStart(2, "0")}:${m}`
}
