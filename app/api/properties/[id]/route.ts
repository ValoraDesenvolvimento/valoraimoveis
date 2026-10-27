import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { toPublicProperty } from "@/lib/public-property";
import { revalidatePropertyPages } from "@/lib/revalidate";
import { deleteProperty, getPropertyById, updateProperty } from "@/lib/store";
import type { PropertyInput } from "@/lib/types";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const property = await getPropertyById(id);
  if (!property) {
    return NextResponse.json({ error: "Imóvel não encontrado." }, { status: 404 });
  }

  const session = await getServerSession();
  if (!session) {
    if (property.status !== "Publicado") {
      return NextResponse.json({ error: "Imóvel não encontrado." }, { status: 404 });
    }
    return NextResponse.json(toPublicProperty(property));
  }

  return NextResponse.json(property);
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const body = (await request.json()) as PropertyInput;
    const property = await updateProperty(id, body);
    if (!property) {
      return NextResponse.json({ error: "Imóvel não encontrado." }, { status: 404 });
    }
    revalidatePropertyPages(property.slug);
    return NextResponse.json(property);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Não foi possível atualizar o imóvel." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const existing = await getPropertyById(id);
  const removed = await deleteProperty(id);
  if (!removed) {
    return NextResponse.json({ error: "Imóvel não encontrado." }, { status: 404 });
  }
  revalidatePropertyPages(existing?.slug);
  return NextResponse.json({ ok: true });
}
