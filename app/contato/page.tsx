import { ContatoClient } from "@/app/contato/ContatoClient";
import { SiteShell } from "@/components/SiteShell";
import { getCompanySettings } from "@/lib/company-store";

export const dynamic = "force-dynamic";

export default async function ContatoPage() {
  const company = await getCompanySettings();
  return (
    <SiteShell>
      <ContatoClient company={company} />
    </SiteShell>
  );
}
