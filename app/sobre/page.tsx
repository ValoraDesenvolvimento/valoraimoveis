import type { Metadata } from "next";
import Image from "next/image";
import { SiteShell } from "@/components/SiteShell";

export const metadata: Metadata = {
  title: "Sobre Nós",
};

const values = [
  {
    icon: "fa-eye",
    title: "Transparência",
    text: "Negociações claras e relações construídas com confiança.",
  },
  {
    icon: "fa-magnifying-glass-chart",
    title: "Oportunidade",
    text: "Seleção criteriosa de imóveis com verdadeiro potencial.",
  },
  {
    icon: "fa-arrow-up-right-dots",
    title: "Valorização",
    text: "Um olhar estratégico para imóveis que representam boas escolhas.",
  },
  {
    icon: "fa-handshake-angle",
    title: "Proximidade",
    text: "Atendimento humano e acompanhamento durante todo o processo.",
  },
];

export default function SobrePage() {
  return (
    <SiteShell>
      <header className="relative h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            className="object-cover"
            src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_d8d2c050c7_f70fd936a6c8d943.png"
            alt="Detalhe arquitetônico contemporâneo"
            fill
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-ink/40" />
        </div>
        <div className="relative z-10 text-center px-6">
          <h1 className="h-display text-5xl md:text-7xl text-white">Sobre a Valora Imóveis</h1>
        </div>
      </header>

      <section className="py-24 px-6 max-w-4xl mx-auto">
        <div className="space-y-12 text-center md:text-left">
          <div className="space-y-6">
            <h2 className="h-display text-3xl md:text-4xl text-ink">Quem Somos</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A Valora Imóveis nasceu da união de profissionais com ampla experiência de mercado e
              um propósito em comum: identificar oportunidades imobiliárias com potencial de
              valorização e transformá-las em excelentes negócios.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Nossa atuação combina estratégia, conhecimento e um olhar criterioso para selecionar
              imóveis que ofereçam qualidade, segurança e bom investimento. Em alguns casos,
              realizamos reformas para potencializar o valor e a apresentação do imóvel. Em outros,
              disponibilizamos imóveis prontos, cuidadosamente escolhidos para atender às
              necessidades de quem busca comprar com confiança.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Mais do que vender imóveis, buscamos conectar pessoas às melhores oportunidades,
              sempre com transparência, credibilidade e um atendimento próximo.
            </p>
          </div>
          <div className="pt-8 border-t border-line">
            <p className="h-display text-2xl text-brand italic">
              Valora Imóveis. Boas oportunidades começam com as escolhas certas.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-surface px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.2em] text-brand font-bold mb-4 block">
              Nossos Pilares
            </span>
            <h2 className="h-display text-4xl md:text-5xl text-ink">Valores que nos guiam</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white p-10 rounded-3xl border border-line hover:shadow-xl transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand/5 flex items-center justify-center text-brand mb-8 group-hover:bg-brand group-hover:text-white transition-all">
                  <i className={`fa-solid ${value.icon} text-2xl`} />
                </div>
                <h3 className="text-xl font-bold text-ink mb-4">{value.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{value.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
