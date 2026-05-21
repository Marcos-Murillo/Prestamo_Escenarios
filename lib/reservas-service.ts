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
  Timestamp 
} from "firebase/firestore"
import { db, isFirebaseConfigured } from "./firebase"
import { Reserva } from "./types"

const RESERVAS_COLLECTION = "reservas"

// Almacenamiento en memoria para modo demo
let demoReservas: Reserva[] = [
  {
    id: "demo-1",
    usuarioId: "demo-user-123",
    usuarioNombre: "Juan Perez Demo",
    usuarioEmail: "estudiante@universidad.edu",
    usuarioCarnet: "2024001",
    canchaId: "futbol-1",
    canchaNombre: "Cancha de Futbol Principal",
    fecha: new Date().toISOString().split("T")[0],
    horaInicio: "10:00",
    horaFin: "11:00",
    estado: "aprobada",
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: "demo-2",
    usuarioId: "demo-user-123",
    usuarioNombre: "Juan Perez Demo",
    usuarioEmail: "estudiante@universidad.edu",
    usuarioCarnet: "2024001",
    canchaId: "basket-1",
    canchaNombre: "Cancha de Basquetbol A",
    fecha: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    horaInicio: "14:00",
    horaFin: "15:00",
    estado: "pendiente",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export async function crearReserva(reservaData: Omit<Reserva, "id" | "createdAt" | "updatedAt">): Promise<string> {
  if (!isFirebaseConfigured || !db) {
    // Modo demo
    const newId = `demo-${Date.now()}`
    const nuevaReserva: Reserva = {
      ...reservaData,
      id: newId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    demoReservas.unshift(nuevaReserva)
    return newId
  }

  const docRef = await addDoc(collection(db, RESERVAS_COLLECTION), {
    ...reservaData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return docRef.id
}

export async function obtenerReservasUsuario(usuarioId: string): Promise<Reserva[]> {
  if (!isFirebaseConfigured || !db) {
    return demoReservas.filter(r => r.usuarioId === usuarioId)
  }

  // Sin orderBy para evitar requerir índice compuesto — ordenamos en memoria
  const q = query(
    collection(db, RESERVAS_COLLECTION),
    where("usuarioId", "==", usuarioId)
  )
  const querySnapshot = await getDocs(q)
  const reservas = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
    updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
  })) as Reserva[]

  return reservas.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function obtenerTodasReservas(): Promise<Reserva[]> {
  if (!isFirebaseConfigured || !db) {
    return [...demoReservas]
  }

  const q = query(
    collection(db, RESERVAS_COLLECTION),
    orderBy("createdAt", "desc")
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Reserva[]
}

export async function obtenerReservasPorFechaYCancha(fecha: string, canchaId: string): Promise<Reserva[]> {
  if (!isFirebaseConfigured || !db) {
    return demoReservas.filter(
      r => r.fecha === fecha && r.canchaId === canchaId && (r.estado === "pendiente" || r.estado === "aprobada")
    )
  }

  const q = query(
    collection(db, RESERVAS_COLLECTION),
    where("fecha", "==", fecha),
    where("canchaId", "==", canchaId),
    where("estado", "in", ["pendiente", "aprobada"])
  )
  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Reserva[]
}

export async function actualizarEstadoReserva(
  reservaId: string, 
  estado: Reserva["estado"],
  motivoRechazo?: string
) {
  if (!isFirebaseConfigured || !db) {
    const index = demoReservas.findIndex(r => r.id === reservaId)
    if (index !== -1) {
      demoReservas[index] = {
        ...demoReservas[index],
        estado,
        motivoRechazo: motivoRechazo || undefined,
        updatedAt: new Date(),
      }
    }
    return
  }

  const reservaRef = doc(db, RESERVAS_COLLECTION, reservaId)
  await updateDoc(reservaRef, {
    estado,
    motivoRechazo: motivoRechazo || null,
    updatedAt: Timestamp.now(),
  })
}

export async function obtenerReserva(reservaId: string): Promise<Reserva | null> {
  if (!isFirebaseConfigured || !db) {
    return demoReservas.find(r => r.id === reservaId) || null
  }

  const docRef = doc(db, RESERVAS_COLLECTION, reservaId)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate(),
      updatedAt: docSnap.data().updatedAt?.toDate(),
    } as Reserva
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
