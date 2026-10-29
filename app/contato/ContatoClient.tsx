"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { WhatsAppIcon, InstagramIcon, FacebookIcon } from "@/components/icons/brands";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  formatCompanyAddress,
  hasCompanyAddress,
  publicEmails,
  publicPhones,
  type CompanySettings,
  whatsappLink,
} from "@/lib/contact";
import { formatPhoneMask } from "@/lib/masks";

type ContatoClientProps = {
  company: CompanySettings;
};

export function ContatoClient({ company }: ContatoClientProps) {
  const [sent, setSent] = useState(false);
  const [assunto, setAssunto] = useState("interesse");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const address = formatCompanyAddress(company);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const lines = [
      `Olá, meu nome é ${name || "—"}.`,
      email ? `E-mail: ${email}` : null,
      phone ? `Telefone: ${phone}` : null,
      `Assunto: ${
        assunto === "interesse"
          ? "interesse em um imóvel"
          : assunto === "informacoes"
            ? "mais informações"
            : "outro assunto"
      }.`,
      message ? `Mensagem: ${message}` : null,
    ].filter(Boolean);

    window.open(whatsappLink(lines.join("\n"), company), "_blank", "noopener,noreferrer");
    setSent(true);
  }

  return (
    <>
      <header className="relative h-[380px] md:h-[440px] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            className="object-cover"
            src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_d8d2c050c7_f70fd936a6c8d943.png"
            alt="Ambiente contemporâneo Valora Imóveis"
            fill
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/25" />
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-14 md:pb-16">
          <p className="text-xs uppercase tracking-[0.22em] text-white/70 font-bold mb-4">
            Contato
          </p>
          <h1 className="h-display text-4xl md:text-6xl lg:text-7xl text-white max-w-3xl leading-tight">
            Fale com a Valora
          </h1>
          <p className="mt-4 max-w-xl text-base md:text-lg text-white/80 leading-relaxed">
            Tire dúvidas, conheça imóveis ou agende uma conversa com nossa equipe.
          </p>
        </div>
      </header>

      <main className="pb-24">
        <section className="border-b border-line bg-surface">
          <div className="max-w-7xl mx-auto px-6 py-10 md:py-12">
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
              {company.whatsappDisplay ? (
                <a
                  href={whatsappLink(undefined, company)}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-4 transition-colors"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-white">
                    <WhatsAppIcon className="size-6" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted font-bold">WhatsApp</p>
                    <p className="mt-1 text-lg font-medium text-ink group-hover:text-brand transition-colors">
                      {company.whatsappDisplay}
                    </p>
                    <p className="mt-1 text-sm text-muted">Resposta mais rápida</p>
                  </div>
                </a>
              ) : null}

              {publicPhones(company).map((phone, index) => (
                <a
                  key={`phone-${phone}-${index}`}
                  href={`tel:${phone.replace(/\D/g, "")}`}
                  className="group flex items-start gap-4 transition-colors"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white border border-line text-brand">
                    <i className="fa-solid fa-phone text-lg" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted font-bold">
                      {index === 0 ? "Telefone" : `Telefone ${index + 1}`}
                    </p>
                    <p className="mt-1 text-lg font-medium text-ink group-hover:text-brand transition-colors">
                      {phone}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {index === 0 ? "Contato principal" : "Outro contato"}
                    </p>
                  </div>
                </a>
              ))}

              {publicEmails(company).map((email, index) => (
                <a
                  key={`email-${email}-${index}`}
                  href={`mailto:${email}`}
                  className="group flex items-start gap-4 transition-colors"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white border border-line text-brand">
                    <i className="fa-regular fa-envelope text-lg" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted font-bold">
                      {index === 0 ? "E-mail" : `E-mail ${index + 1}`}
                    </p>
                    <p className="mt-1 text-lg font-medium text-ink break-all group-hover:text-brand transition-colors">
                      {email}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {index === 0 ? "Para propostas e documentos" : "Contato adicional"}
                    </p>
                  </div>
                </a>
              ))}

              {company.instagramUrl ? (
                <a
                  href={company.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-4 transition-colors"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white border border-line text-brand">
                    <InstagramIcon className="size-6" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted font-bold">Instagram</p>
                    <p className="mt-1 text-lg font-medium text-ink group-hover:text-brand transition-colors">
                      {company.instagramHandle}
                    </p>
                    <p className="mt-1 text-sm text-muted">Novidades e lançamentos</p>
                  </div>
                </a>
              ) : null}

              {company.facebookUrl ? (
                <a
                  href={company.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-4 transition-colors"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white border border-line text-brand">
                    <FacebookIcon className="size-6" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted font-bold">Facebook</p>
                    <p className="mt-1 text-lg font-medium text-ink group-hover:text-brand transition-colors">
                      Página oficial
                    </p>
                    <p className="mt-1 text-sm text-muted">Acompanhe conteúdos</p>
                  </div>
                </a>
              ) : null}

              {hasCompanyAddress(company) ? (
                <div className="group flex items-start gap-4 md:col-span-2 xl:col-span-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white border border-line text-brand">
                    <i className="fa-solid fa-location-dot text-lg" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted font-bold">Endereço</p>
                    <p className="mt-1 text-lg font-medium text-ink">{address}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-4 space-y-6">
              <h2 className="h-display text-3xl md:text-4xl text-ink">Envie uma mensagem</h2>
              <p className="text-muted leading-relaxed">
                Preencha o formulário e continue a conversa no WhatsApp. Assim conseguimos
                responder com mais agilidade.
              </p>
              <a
                href={whatsappLink(`Olá! Gostaria de falar com a ${company.companyName}.`, company)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white hover:bg-brandhover transition-colors"
              >
                <WhatsAppIcon className="size-5" />
                Abrir WhatsApp agora
              </a>
            </div>

            <form
              onSubmit={handleSubmit}
              className="lg:col-span-8 space-y-6 border-t border-line pt-8 lg:border-t-0 lg:border-l lg:pl-16 lg:pt-0"
            >
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="contato-nome">Nome</Label>
                  <Input
                    id="contato-nome"
                    placeholder="Seu nome"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="contato-email">E-mail</Label>
                  <Input
                    id="contato-email"
                    type="email"
                    placeholder="voce@email.com"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="contato-telefone">Telefone</Label>
                  <Input
                    id="contato-telefone"
                    inputMode="tel"
                    placeholder="(21) 99999-9999"
                    value={phone}
                    onChange={(event) => setPhone(formatPhoneMask(event.target.value))}
                  />
                </div>
                <div>
                  <Label>Assunto</Label>
                  <Select value={assunto} onValueChange={setAssunto}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o assunto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interesse">Tenho interesse em um imóvel</SelectItem>
                      <SelectItem value="informacoes">Quero mais informações</SelectItem>
                      <SelectItem value="outro">Outro assunto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="contato-mensagem">Mensagem</Label>
                <Textarea
                  id="contato-mensagem"
                  placeholder="Como podemos ajudar?"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="min-h-[140px]"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                <Button type="submit" size="lg">
                  {sent ? "Abrir novamente no WhatsApp" : "Continuar no WhatsApp"}
                  <i className="fa-brands fa-whatsapp" />
                </Button>
                <p className="text-xs text-muted max-w-sm">
                  Ao enviar, abrimos o WhatsApp com sua mensagem pronta para a equipe{" "}
                  {company.companyName}.
                </p>
              </div>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
