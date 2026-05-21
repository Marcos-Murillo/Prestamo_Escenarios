import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { Readable } from "stream"

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!
const MAX_SIZE  = 5 * 1024 * 1024 // 5 MB

function getDriveClient() {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    "http://localhost"
  )
  oauth2.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  })
  return google.drive({ version: "v3", auth: oauth2 })
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 })
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Solo se aceptan archivos PDF" }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo supera el límite de 5 MB" }, { status: 400 })
    }

    const buffer   = Buffer.from(await file.arrayBuffer())
    const stream   = Readable.from(buffer)
    const drive    = getDriveClient()
    const fileName = `${Date.now()}_${file.name}`

    const uploaded = await drive.files.create({
      requestBody: {
        name:    fileName,
        parents: [FOLDER_ID],
        mimeType: "application/pdf",
      },
      media: {
        mimeType: "application/pdf",
        body:     stream,
      },
      fields: "id",
    })

    const fileId = uploaded.data.id!

    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    })

    const url = `https://drive.google.com/file/d/${fileId}/view`
    return NextResponse.json({ fileId, url })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[upload] Error:", message)
    return NextResponse.json({ error: "Error al subir el archivo", detail: message }, { status: 500 })
  }
}
