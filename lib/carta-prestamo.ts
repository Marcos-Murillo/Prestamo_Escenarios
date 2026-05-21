import jsPDF from "jspdf"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface DatosCarta {
  nombreCompleto: string
  documento: string
  programaAcademico: string
  escenario: string
  ubicacion: string
  fecha: Date
  horaInicio: string
  horaFin: string
  numPersonas?: number
}

const MESES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre"
]

function wrapText(doc: jsPDF, text: string, x: number, maxWidth: number, lineHeight: number, startY: number): number {
  const lines = doc.splitTextToSize(text, maxWidth)
  doc.text(lines, x, startY)
  return startY + lines.length * lineHeight
}

export function generarCartaPrestamo(datos: DatosCarta): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" })

  const margen = 25
  const ancho = 210 - margen * 2
  const lh = 7   // line height normal
  const lhp = 6  // line height párrafo

  doc.setFont("times", "normal")

  // ── Encabezado ──────────────────────────────────────────────────────────────
  doc.setFontSize(12)
  doc.setFont("times", "bold")
  doc.text("UNIVERSIDAD DEL VALLE", 105, 20, { align: "center" })
  doc.text("Sección Cultura, Recreación y Deporte", 105, 27, { align: "center" })
  doc.setFont("times", "normal")
  doc.setFontSize(11)

  // ── Fecha ────────────────────────────────────────────────────────────────────
  const dia   = datos.fecha.getDate()
  const mes   = MESES[datos.fecha.getMonth()]
  const anio  = datos.fecha.getFullYear()

  let y = 42
  doc.text(`Santiago de Cali, ${dia} de ${mes} de ${anio}`, margen, y)

  // ── Destinatario ─────────────────────────────────────────────────────────────
  y += lh * 2
  doc.setFont("times", "bold")
  doc.text("Señores", margen, y)
  y += lh
  doc.text("Sección Cultura Recreación y Deporte", margen, y)
  y += lh
  doc.text("Universidad del Valle", margen, y)
  y += lh
  doc.text("Ciudad", margen, y)

  // ── Asunto ───────────────────────────────────────────────────────────────────
  y += lh * 2
  doc.setFont("times", "normal")
  doc.text("Asunto: ", margen, y)
  doc.setFont("times", "bold")
  doc.text("Solicitud de uso de escenario deportivo", margen + 18, y)
  doc.setFont("times", "normal")

  // ── Párrafo 1 ────────────────────────────────────────────────────────────────
  y += lh * 2
  const p1 = `Yo, ${datos.nombreCompleto}, identificado(a) con documento de identidad No. ${datos.documento}, estudiante del programa académico ${datos.programaAcademico}, de la Universidad del Valle, me permito solicitar de manera respetuosa el préstamo de un escenario deportivo institucional.`
  y = wrapText(doc, p1, margen, ancho, lhp, y)

  // ── Párrafo 2 ────────────────────────────────────────────────────────────────
  y += lhp
  const p2 = "La presente solicitud tiene como finalidad el desarrollo de actividades de carácter académico, recreativo y/o deportivo, contribuyendo al bienestar integral y la adecuada utilización de los espacios institucionales."
  y = wrapText(doc, p2, margen, ancho, lhp, y)

  // ── Párrafo 3 (datos del escenario) ─────────────────────────────────────────
  y += lhp
  const numPersonas = datos.numPersonas ?? 20
  const p3 = `El escenario requerido es: ${datos.escenario} (${datos.ubicacion}), para ser utilizado en la fecha ${dia} de ${mes} de ${anio}, en el horario comprendido entre ${datos.horaInicio} y ${datos.horaFin}, con una participación aproximada de ${numPersonas} personas.`
  y = wrapText(doc, p3, margen, ancho, lhp, y)

  // ── Párrafo 4 ────────────────────────────────────────────────────────────────
  y += lhp
  const p4 = "Me comprometo a hacer uso responsable de las instalaciones, cumplir con las normas establecidas por la Universidad del Valle y responder por cualquier daño ocasionado durante el desarrollo de la actividad, así como garantizar el adecuado comportamiento de los asistentes."
  y = wrapText(doc, p4, margen, ancho, lhp, y)

  // ── Párrafo 5 ────────────────────────────────────────────────────────────────
  y += lhp
  const p5 = "Agradezco de antemano la atención prestada a la presente solicitud y quedo atento(a) a cualquier información adicional que se requiera para su aprobación."
  y = wrapText(doc, p5, margen, ancho, lhp, y)

  // ── Cierre ───────────────────────────────────────────────────────────────────
  y += lh * 2
  doc.text("Cordialmente,", margen, y)

  // ── Datos del solicitante ────────────────────────────────────────────────────
  y += lh * 2
  doc.text(`Nombre del solicitante: ${datos.nombreCompleto}`, margen, y)
  y += lh
  doc.text(`Documento de identidad: ${datos.documento}`, margen, y)
  y += lh
  doc.text(`Programa académico: ${datos.programaAcademico}`, margen, y)

  // ── Línea de firma ───────────────────────────────────────────────────────────
  y += lh * 2
  doc.line(margen, y, margen + 70, y)
  y += lh * 0.8
  doc.setFontSize(9)
  doc.text("Firma del solicitante", margen, y)
  doc.setFontSize(11)

  // ── Sección Vo. Bo. Director ─────────────────────────────────────────────────
  y += lh * 3
  doc.setFont("times", "bold")
  doc.text("Vo. Bo. Director(a) de Programa", margen, y)
  doc.setFont("times", "normal")

  y += lhp * 1.5
  const voBo = "Certifico que el(la) estudiante anteriormente mencionado(a) pertenece al programa académico indicado y cuenta con el aval para realizar la presente solicitud."
  y = wrapText(doc, voBo, margen, ancho, lhp, y)

  y += lh * 2
  doc.text("Nombre del Director(a): ____________________________________", margen, y)
  y += lh * 2
  doc.text("Firma: ____________________________________", margen, y)
  y += lh * 2
  doc.text("Cargo: Director(a) de Programa", margen, y)

  // ── Guardar ──────────────────────────────────────────────────────────────────
  const nombreArchivo = `Carta_Prestamo_${datos.nombreCompleto.replace(/\s+/g, "_")}_${format(datos.fecha, "yyyy-MM-dd")}.pdf`
  doc.save(nombreArchivo)
}
