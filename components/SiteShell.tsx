import { Footer } from "@/components/Footer";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import { Navbar } from "@/components/Navbar";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getCompanySettings } from "@/lib/company-store";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const company = await getCompanySettings();

  return (
    <FavoritesProvider>
      <Navbar />
      {children}
      <WhatsAppButton company={company} />
      <Footer company={company} />
    </FavoritesProvider>
  );
}
