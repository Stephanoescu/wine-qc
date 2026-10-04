import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "lotes.json");

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const updatedData = await request.json();

    if (!fs.existsSync(dataFilePath)) {
      return NextResponse.json({ error: "Archivo de datos no encontrado" }, { status: 404 });
    }

    const fileData = fs.readFileSync(dataFilePath, "utf-8");
    let lotes = JSON.parse(fileData);

    const index = lotes.findIndex((l: any) => l.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Lote no encontrado" }, { status: 404 });
    }

    // Preserve the original creation date and ID, overwrite the rest
    lotes[index] = {
      ...lotes[index],
      ...updatedData,
      id: lotes[index].id,
      fechaCreacion: lotes[index].fechaCreacion,
    };

    fs.writeFileSync(dataFilePath, JSON.stringify(lotes, null, 2));

    return NextResponse.json({ success: true, lote: lotes[index] });
  } catch (error) {
    console.error("Error updating lote:", error);
    return NextResponse.json({ error: "Error interno al actualizar el lote" }, { status: 500 });
  }
}
