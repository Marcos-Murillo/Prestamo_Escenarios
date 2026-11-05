import jsPDF from "jspdf"

export type TipoUsuarioCrd = "estudiante" | "funcionario" | "contratista" | "externo"
export type EscenarioCrd =
  | "futbol"
  | "tenis_campo"
  | "rugby"
  | "tenis_mesa"
  | "voleibol"
  | "coliseo"
  | "exteriores"
  | "otro"
export type RequerimientoCrd = "ninguno" | "sonido" | "iluminacion" | "mobiliario" | "otro"
export type EstadoCrd = "aprobada" | "rechazada" | "pendiente"

export interface DatosFormatoCrd {
  numeroSolicitud?: string
  fechaSolicitud?: Date
  nombreCompleto: string
  documento: string
  telefono?: string
  correo?: string
  programa?: string
  asistentes?: number
  tipoUsuario?: TipoUsuarioCrd
  nombreEvento: string
  fechaPrestamo: Date
  horaInicio: string
  horaFin: string
  escenarioMarcado: EscenarioCrd
  otroEscenario?: string
  requerimiento?: RequerimientoCrd
  otroRequerimiento?: string
  estado?: EstadoCrd
  fechaDecision?: Date
  responsable?: string
  observaciones?: string
}

export function escenarioCrdDesdeTipo(tipo: string, nombre: string): { marcado: EscenarioCrd; otro?: string } {
  const texto = `${tipo} ${nombre}`.toLowerCase()
  if (texto.includes("rugby")) return { marcado: "rugby" }
  if (texto.includes("mesa")) return { marcado: "tenis_mesa" }
  if (texto.includes("tenis")) return { marcado: "tenis_campo" }
  if (texto.includes("vole")) return { marcado: "voleibol" }
  if (texto.includes("coliseo")) return { marcado: "coliseo" }
  if (/futbol sala|fútbol sala|futbol_sala|micro|baloncesto|básquet|basquet/.test(texto)) {
    return { marcado: "exteriores" }
  }
  if (texto.includes("futbol") || texto.includes("fútbol")) return { marcado: "futbol" }
  return { marcado: "otro", otro: nombre }
}

export function tipoUsuarioDesdeEstamento(estamento?: string): TipoUsuarioCrd {
  const valor = (estamento ?? "").toLowerCase()
  if (valor.includes("estudi")) return "estudiante"
  if (valor.includes("contrat")) return "contratista"
  if (valor.includes("funcion") || valor.includes("docente") || valor.includes("emple") || valor.includes("admin")) {
    return "funcionario"
  }
  if (!valor) return "estudiante"
  return "externo"
}

function fechaCorta(fecha?: Date) {
  if (!fecha || Number.isNaN(fecha.getTime())) return ""
  const dia = String(fecha.getDate()).padStart(2, "0")
  const mes = String(fecha.getMonth() + 1).padStart(2, "0")
  return `${dia}/${mes}/${fecha.getFullYear()}`
}

function horaAmPm(hora: string) {
  const [horas, minutos] = hora.split(":").map(Number)
  if (Number.isNaN(horas)) return hora
  const sufijo = horas >= 12 ? "p. m." : "a. m."
  const enDoce = horas % 12 || 12
  return `${String(enDoce).padStart(2, "0")}:${String(minutos || 0).padStart(2, "0")} ${sufijo}`
}

function casilla(doc: jsPDF, x: number, y: number, marcada: boolean) {
  doc.setDrawColor(40)
  doc.setLineWidth(0.3)
  doc.setFillColor(255, 255, 255)
  doc.rect(x, y - 3.2, 3.6, 3.6, "S")
  if (marcada) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setFillColor(0, 0, 0)
    doc.setTextColor(0, 0, 0)
    doc.text("X", x + 0.7, y)
  }
}

function tituloSeccion(doc: jsPDF, texto: string, y: number) {
  doc.setFillColor(226, 232, 240)
  doc.rect(12, y, 186, 8, "F")
  doc.setFillColor(15, 40, 70)
  doc.setTextColor(15, 40, 70)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text(texto, 14, y + 5.4)
  return y + 13
}

function campo(doc: jsPDF, etiqueta: string, valor: string, x: number, y: number, ancho: number) {
  doc.setFillColor(70, 80, 90)
  doc.setTextColor(70, 80, 90)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.text(etiqueta, x, y)
  doc.setFillColor(0, 0, 0)
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  const texto = doc.splitTextToSize(valor.trim() || "—", ancho)[0] || "—"
  doc.text(texto, x, y + 5.4)
  doc.setDrawColor(170)
  doc.setLineWidth(0.25)
  doc.line(x, y + 7.2, x + ancho, y + 7.2)
}

function opcion(doc: jsPDF, texto: string, x: number, y: number, marcada: boolean) {
  casilla(doc, x, y, marcada)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setFillColor(0, 0, 0)
  doc.setTextColor(0, 0, 0)
  doc.text(texto, x + 5, y)
}

export function generarFormatoCrd(datos: DatosFormatoCrd) {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const estado = datos.estado ?? "pendiente"

  doc.setFillColor(15, 61, 110)
  doc.rect(0, 0, 210, 28, "F")
  doc.setFillColor(255, 255, 255)
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.text("UNIVERSIDAD DEL VALLE", 14, 10)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text("Sección de Cultura, Recreación y Deporte", 14, 16)
  doc.setFontSize(8)
  doc.text("FORMATO UNIFICADO DE SOLICITUD Y CONTROL", 14, 22)
  doc.text("DE ESCENARIOS DEPORTIVOS", 14, 26)

  doc.setFillColor(255, 255, 255)
  doc.rect(148, 4, 54, 20, "F")
  doc.setFillColor(15, 61, 110)
  doc.setTextColor(15, 61, 110)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.text("GESTIÓN DOCUMENTAL", 175, 8, { align: "center" })
  doc.setFont("helvetica", "normal")
  doc.text("Código: CRD-IC-01", 151, 13)
  doc.text("Versión: 02", 151, 17)
  doc.text("Fecha: 02/10/2026", 151, 21)

  doc.setTextColor(0)
  let y = tituloSeccion(doc, "1. DATOS DEL SOLICITANTE Y DEL EVENTO", 34)
  campo(doc, "No. Solicitud (Uso interno):", datos.numeroSolicitud || "", 14, y, 88)
  campo(doc, "Fecha de solicitud:", fechaCorta(datos.fechaSolicitud ?? new Date()), 110, y, 84)
  y += 16
  campo(doc, "Nombre completo:", datos.nombreCompleto, 14, y, 110)
  campo(doc, "Cédula / Código UV:", datos.documento, 130, y, 64)
  y += 16
  campo(doc, "Teléfono de contacto:", datos.telefono || "", 14, y, 58)
  campo(doc, "Correo institucional:", datos.correo || "", 78, y, 116)
  y += 16
  campo(doc, "Dependencia / Programa:", datos.programa || "", 14, y, 116)
  campo(doc, "No. estimado de asistentes:", datos.asistentes ? String(datos.asistentes) : "", 136, y, 58)
  y += 16
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("Tipo de usuario:", 14, y)
  y += 6
  opcion(doc, "Estudiante", 14, y, datos.tipoUsuario === "estudiante")
  opcion(doc, "Funcionario", 58, y, datos.tipoUsuario === "funcionario")
  opcion(doc, "Contratista", 108, y, datos.tipoUsuario === "contratista")
  opcion(doc, "Externo", 156, y, datos.tipoUsuario === "externo")
  y += 8
  campo(doc, "Nombre del evento / actividad:", datos.nombreEvento, 14, y, 180)

  y = tituloSeccion(doc, "2. ESPECIFICACIONES DEL PRÉSTAMO", y + 16)
  campo(doc, "Fecha del préstamo:", fechaCorta(datos.fechaPrestamo), 14, y, 70)
  campo(
    doc,
    "Horario requerido:",
    `De ${horaAmPm(datos.horaInicio)} a ${horaAmPm(datos.horaFin)}`,
    92,
    y,
    102,
  )
  y += 16
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("Escenario deportivo solicitado (marque con una X):", 14, y)
  y += 7
  const escenarios: { id: EscenarioCrd; label: string }[] = [
    { id: "futbol", label: "Cancha de Fútbol" },
    { id: "tenis_campo", label: "Canchas de Tenis de Campo" },
    { id: "rugby", label: "Cancha de Rugby" },
    { id: "tenis_mesa", label: "Salón de Tenis de Mesa" },
    { id: "voleibol", label: "Cancha de Voleibol Arena" },
    { id: "coliseo", label: "Coliseo Cubierto" },
    { id: "exteriores", label: "Canchas Exteriores (Baloncesto/Micro)" },
    { id: "otro", label: datos.otroEscenario ? `Otro: ${datos.otroEscenario}` : "Otro:" },
  ]
  escenarios.forEach((item, indice) => {
    const columna = indice % 2
    const fila = Math.floor(indice / 2)
    opcion(doc, item.label, 14 + columna * 94, y + fila * 7, datos.escenarioMarcado === item.id)
  })
  y += 32
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("Requerimientos técnicos adicionales:", 14, y)
  y += 6
  const requerimientos: { id: RequerimientoCrd; label: string }[] = [
    { id: "ninguno", label: "Ninguno" },
    { id: "sonido", label: "Sonido / Amplificación" },
    { id: "iluminacion", label: "Iluminación" },
    { id: "mobiliario", label: "Mobiliario (Sillas/Mesas)" },
    { id: "otro", label: datos.otroRequerimiento ? `Otro: ${datos.otroRequerimiento}` : "Otro:" },
  ]
  requerimientos.forEach((item, indice) => {
    opcion(doc, item.label, 14 + (indice % 3) * 62, y + Math.floor(indice / 3) * 7, (datos.requerimiento ?? "ninguno") === item.id)
  })

  doc.addPage()
  y = tituloSeccion(doc, "3. CONTROL DE APROBACIÓN (Uso exclusivo de la Coordinación CRD)", 16)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("Estado de la solicitud:", 14, y)
  y += 6
  opcion(doc, "APROBADO", 14, y, estado === "aprobada")
  opcion(doc, "NO APROBADO", 58, y, estado === "rechazada")
  opcion(doc, "PENDIENTE", 112, y, estado === "pendiente")
  y += 8
  campo(doc, "Fecha de decisión:", estado === "pendiente" ? "" : fechaCorta(datos.fechaDecision), 14, y, 70)
  campo(doc, "Responsable que autoriza:", datos.responsable || "", 92, y, 102)
  y += 16
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("Observaciones / restricciones:", 14, y)
  doc.setFillColor(0, 0, 0)
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  const obs = doc.splitTextToSize(datos.observaciones?.trim() || "—", 180)
  doc.text(obs.slice(0, 4), 14, y + 5)
  doc.line(14, y + 22, 194, y + 22)

  const archivo = `CRD-IC-01_${datos.nombreCompleto.replace(/\s+/g, "_").slice(0, 40)}_${fechaCorta(datos.fechaPrestamo).replace(/\//g, "-")}.pdf`
  doc.save(archivo)
}
