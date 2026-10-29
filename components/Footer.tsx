import Image from "next/image";
import Link from "next/link";
import {
  formatCompanyAddress,
  hasCompanyAddress,
  publicEmails,
  publicPhones,
  type CompanySettings,
} from "@/lib/contact";

type FooterProps = {
  company: CompanySettings;
};

export function Footer({ company }: FooterProps) {
  const address = formatCompanyAddress(company);

  return (
    <footer className="bg-ink text-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 mb-24">
          <div className="space-y-8">
            <Image
              src="/Logovalorawhite.png"
              alt={company.companyName || "Valora Imóveis"}
              width={180}
              height={40}
              className="h-10 w-auto object-contain"
            />
            <p className="text-muted-foreground text-sm leading-relaxed">
              Redefinindo a experiência imobiliária com sofisticação, transparência e
              foco total na valorização do seu patrimônio.
            </p>
            <div className="flex gap-4">
              {company.instagramUrl ? (
                <a
                  href={company.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand hover:border-brand transition-all"
                  aria-label="Instagram"
                >
                  <i className="fa-brands fa-instagram text-sm" />
                </a>
              ) : null}
              {company.facebookUrl ? (
                <a
                  href={company.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand hover:border-brand transition-all"
                  aria-label="Facebook"
                >
                  <i className="fa-brands fa-facebook-f text-sm" />
                </a>
              ) : null}
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-8">
              Navegação
            </h4>
            <ul className="space-y-4 text-sm">
              <li>
                <Link href="/" className="hover:text-brand text-muted-foreground transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/imoveis" className="hover:text-brand text-muted-foreground transition-colors">
                  Imóveis à Venda
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="hover:text-brand text-muted-foreground transition-colors">
                  Sobre a Valora
                </Link>
              </li>
              <li>
                <Link href="/contato" className="hover:text-brand text-muted-foreground transition-colors">
                  Fale Conosco
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-8">
              Contato
            </h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              {company.whatsappDisplay ? (
                <li className="flex items-center gap-3">
                  <i className="fa-brands fa-whatsapp text-brand" />
                  <span>{company.whatsappDisplay}</span>
                </li>
              ) : null}
              {publicPhones(company).map((phone) => (
                <li key={`phone-${phone}`} className="flex items-center gap-3">
                  <i className="fa-solid fa-phone text-brand" />
                  <a href={`tel:${phone.replace(/\D/g, "")}`} className="hover:text-brand transition-colors">
                    {phone}
                  </a>
                </li>
              ))}
              {publicEmails(company).map((email) => (
                <li key={`email-${email}`} className="flex items-center gap-3">
                  <i className="fa-solid fa-envelope text-brand" />
                  <a href={`mailto:${email}`} className="hover:text-brand transition-colors">
                    {email}
                  </a>
                </li>
              ))}
              {company.instagramHandle ? (
                <li className="flex items-center gap-3">
                  <i className="fa-brands fa-instagram text-brand" />
                  <a
                    href={company.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-brand transition-colors"
                  >
                    {company.instagramHandle}
                  </a>
                </li>
              ) : null}
              {company.facebookUrl ? (
                <li className="flex items-center gap-3">
                  <i className="fa-brands fa-facebook-f text-brand" />
                  <a
                    href={company.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-brand transition-colors"
                  >
                    Facebook
                  </a>
                </li>
              ) : null}
              {hasCompanyAddress(company) ? (
                <li className="flex items-start gap-3">
                  <i className="fa-solid fa-location-dot text-brand mt-0.5" />
                  <span>{address}</span>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] uppercase tracking-widest text-muted-foreground">
          <p>
            © {new Date().getFullYear()}
            {company.companyName ? ` ${company.companyName}.` : ""} Todos os direitos
            reservados.
          </p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">
              Política de Privacidade
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Termos de Uso
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
