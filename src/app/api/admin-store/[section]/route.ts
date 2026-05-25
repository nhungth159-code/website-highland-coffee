import { NextRequest, NextResponse } from "next/server";
import { getSection, setSection, addToSection } from "@/lib/admin-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ section: string }> }
) {
  const { section } = await params;
  return NextResponse.json(getSection(section));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ section: string }> }
) {
  const { section } = await params;
  let body: { action?: string; data?: unknown[]; item?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.action === "replace" && Array.isArray(body.data)) {
    setSection(section, body.data);
  } else if (body.action === "add" && body.item !== undefined) {
    addToSection(section, body.item);
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
