import { NextRequest, NextResponse } from "next/server"
import { driveAuthMessage, uploadPublicPdf } from "@/lib/google-drive"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_SIZE = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 })
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Solo se aceptan archivos PDF" }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo supera el límite de 5 MB" }, { status: 400 })
    }

    const uploaded = await uploadPublicPdf(
      `${Date.now()}_${file.name.replace(/[^\w.\- ()áéíóúÁÉÍÓÚñÑ]/g, "_").slice(0, 80) || "carta.pdf"}`,
      Buffer.from(await file.arrayBuffer()),
    )
    return NextResponse.json({ fileId: uploaded.fileId, url: uploaded.url })
  } catch (error) {
    const message = driveAuthMessage(error)
    console.error("[upload]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
