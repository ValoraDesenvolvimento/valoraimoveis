import { EmpresaClient } from "@/app/team/valora/empresa/EmpresaClient";
import { getCompanySettings } from "@/lib/company-store";

export const dynamic = "force-dynamic";

export default async function TeamEmpresaPage() {
  const settings = await getCompanySettings();
  return <EmpresaClient initialSettings={settings} />;
}
