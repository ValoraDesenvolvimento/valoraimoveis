import { NextResponse } from "next/server";
import { getCompanySettings, updateCompanySettings } from "@/lib/company-store";
import type { CompanySettings } from "@/lib/contact";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await getCompanySettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Não foi possível carregar os dados da empresa." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<CompanySettings>;
    const settings = await updateCompanySettings(body);
    return NextResponse.json(settings);
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error ? error.message : "Não foi possível salvar os dados da empresa.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
