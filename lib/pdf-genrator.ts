import jsPDF from "jspdf"
import { Reserva } from "./types"
import { formatHora } from "./reservas-service"

export function generarComprobantePDF(reserva: Reserva): void {
  const doc = new jsPDF()
  
  const primaryColor: [number, number, number] = [59, 130, 246] // Blue
  const textColor: [number, number, number] = [30, 41, 59]
  const mutedColor: [number, number, number] = [100, 116, 139]
  
  // Header
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 45, "F")
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("ReservasCanchas", 20, 25)
  
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text("Comprobante de Reserva", 20, 35)
  
  // Fecha de emision
  doc.setFontSize(10)
  doc.text(`Emitido: ${new Date().toLocaleDateString("es-ES")}`, 150, 25)
  
  // Cuerpo del documento
  let y = 60
  
  // Titulo
  doc.setTextColor(...textColor)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("Comprobante de Reserva", 20, y)
  
  y += 15
  
  // Estado de la reserva
  const estadoColors: Record<string, [number, number, number]> = {
    pendiente: [245, 158, 11],
    aprobada: [34, 197, 94],
    rechazada: [239, 68, 68],
    cancelada: [156, 163, 175],
    completada: [59, 130, 246],
  }
  
  const estadoColor = estadoColors[reserva.estado] || mutedColor
  doc.setFillColor(...estadoColor)
  doc.roundedRect(20, y - 5, 50, 12, 3, 3, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text(reserva.estado.toUpperCase(), 25, y + 3)
  
  y += 20
  
  // Linea separadora
  doc.setDrawColor(226, 232, 240)
  doc.line(20, y, 190, y)
  
  y += 15
  
  // Informacion del estudiante
  doc.setTextColor(...primaryColor)
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Informacion del Estudiante", 20, y)
  
  y += 10
  doc.setTextColor(...textColor)
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  
  doc.text(`Nombre: ${reserva.usuarioNombre}`, 20, y)
  y += 7
  doc.text(`Codigo: ${reserva.codigoEstudiante}`, 20, y)
  y += 7
  doc.text(`Email: ${reserva.usuarioEmail}`, 20, y)
  
  y += 20
  
  // Linea separadora
  doc.setDrawColor(226, 232, 240)
  doc.line(20, y, 190, y)
  
  y += 15
  
  // Detalles de la reserva
  doc.setTextColor(...primaryColor)
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Detalles de la Reserva", 20, y)
  
  y += 10
  doc.setTextColor(...textColor)
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  
  doc.text(`Cancha: ${reserva.canchaNombre}`, 20, y)
  y += 7
  
  const fechaFormateada = new Date(reserva.fecha).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  doc.text(`Fecha: ${fechaFormateada}`, 20, y)
  y += 7
  
  doc.text(`Horario: ${formatHora(reserva.horaInicio)} - ${formatHora(reserva.horaFin)}`, 20, y)
  y += 7
  
  doc.text(`ID de Reserva: ${reserva.id}`, 20, y)
  
  y += 20
  
  // Caja de informacion importante
  doc.setFillColor(239, 246, 255)
  doc.roundedRect(20, y, 170, 35, 3, 3, "F")
  
  y += 10
  doc.setTextColor(...primaryColor)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("Importante:", 25, y)
  
  y += 7
  doc.setTextColor(...mutedColor)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text("- Presentar este comprobante al llegar a la cancha", 25, y)
  y += 5
  doc.text("- La reserva es personal e intransferible", 25, y)
  y += 5
  doc.text("- Llegar 10 minutos antes del horario reservado", 25, y)
  
  // Footer
  doc.setFillColor(248, 250, 252)
  doc.rect(0, 270, 210, 27, "F")
  
  doc.setTextColor(...mutedColor)
  doc.setFontSize(8)
  doc.text("ReservasCanchas - Sistema de Reservas Universitarias", 105, 280, { align: "center" })
  doc.text("Este documento es un comprobante oficial de reserva.", 105, 286, { align: "center" })
  
  // Guardar PDF
  doc.save(`reserva-${reserva.id}.pdf`)
}
