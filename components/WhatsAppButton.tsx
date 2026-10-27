import { WhatsAppIcon } from "@/components/icons/brands";
import { whatsappLink } from "@/lib/contact";

export function WhatsAppButton() {
  return (
    <a
      href={whatsappLink()}
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
