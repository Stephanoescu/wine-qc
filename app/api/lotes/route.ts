import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ─────────────────────────────────────────
// File path — data/lotes.json at project root
// ─────────────────────────────────────────
const DATA_FILE = path.join(process.cwd(), "data", "lotes.json");

function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf-8");
  }
}

function readLotes() {
  ensureFile();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

function writeLotes(data: unknown[]) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ─────────────────────────────────────────
// GET /api/lotes — return all lots
// ─────────────────────────────────────────
export async function GET() {
  try {
    const lotes = readLotes();
    return NextResponse.json(lotes);
  } catch (err) {
    console.error("Error reading lotes:", err);
    return NextResponse.json({ error: "Error reading data" }, { status: 500 });
  }
}

// ─────────────────────────────────────────
// POST /api/lotes — save a new lot
// ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const lote = await req.json();

    if (!lote || !lote.codigoLote) {
      return NextResponse.json({ error: "Invalid lot data" }, { status: 400 });
    }

    const lotes = readLotes();

    // Prevent duplicate lot codes
    const exists = lotes.some((l: { codigoLote: string }) => l.codigoLote === lote.codigoLote);
    if (exists) {
      return NextResponse.json(
        { error: `El código de lote '${lote.codigoLote}' ya existe` },
        { status: 409 }
      );
    }

    // Add timestamp and prepend (newest first)
    const newLote = {
      ...lote,
      id: lote.id ?? `${Date.now()}`,
      savedAt: new Date().toISOString(),
    };
    lotes.unshift(newLote);
    writeLotes(lotes);

    return NextResponse.json({ ok: true, lote: newLote }, { status: 201 });
  } catch (err) {
    console.error("Error saving lote:", err);
    return NextResponse.json({ error: "Error saving data" }, { status: 500 });
  }
}

// ─────────────────────────────────────────
// DELETE /api/lotes?id=xxx — remove a lot
// ─────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id param required" }, { status: 400 });
    }

    const lotes = readLotes();
    const filtered = lotes.filter((l: { id: string }) => l.id !== id);

    if (filtered.length === lotes.length) {
      return NextResponse.json({ error: "Lot not found" }, { status: 404 });
    }

    writeLotes(filtered);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error deleting lote:", err);
    return NextResponse.json({ error: "Error deleting data" }, { status: 500 });
  }
}
