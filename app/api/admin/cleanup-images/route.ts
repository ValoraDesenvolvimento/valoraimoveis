import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { cleanupOrphanedImages, discardUnreferencedImages } from "@/lib/image-cleanup";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { urls?: unknown };
      const urls = Array.isArray(body.urls)
        ? body.urls.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
        : [];
      if (urls.length) {
        const result = await discardUnreferencedImages(urls);
        return NextResponse.json(result);
      }
    }

    if (searchParams.get("sweep") === "1") {
      const result = await cleanupOrphanedImages({ dryRun: false });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Nada para limpar." }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Não foi possível limpar as imagens." },
      { status: 500 },
    );
  }
}
