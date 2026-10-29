import { WhatsAppIcon } from "@/components/icons/brands";
import { type CompanySettings, whatsappLink } from "@/lib/contact";

type WhatsAppButtonProps = {
  company: CompanySettings;
};

export function WhatsAppButton({ company }: WhatsAppButtonProps) {
  if (!company.whatsappE164) return null;

  return (
    <a
      href={whatsappLink(undefined, company)}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 z-[100] w-14 h-14 sm:w-16 sm:h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300 group"
      aria-label="Fale conosco no WhatsApp"
    >
      <WhatsAppIcon className="size-8" />
      <span className="absolute right-full mr-4 bg-white text-ink px-4 py-2 rounded-lg text-sm font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Fale conosco no WhatsApp
      </span>
    </a>
  );
}
