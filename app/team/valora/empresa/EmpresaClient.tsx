"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { useLoading } from "@/components/LoadingProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Spinner } from "@/components/ui/spinner";
import { fetchCitiesByState, matchCityInState } from "@/lib/brazil-cities";
import { BRAZIL_STATES } from "@/lib/brazil-states";
import { fetchAddressByCep, formatCep, normalizeCep } from "@/lib/cep";
import type { CompanyListingVisibility, CompanySettings } from "@/lib/contact";
import { formatPhoneMask } from "@/lib/masks";

type EmpresaClientProps = {
  initialSettings: CompanySettings;
};

export function EmpresaClient({ initialSettings }: EmpresaClientProps) {
  const router = useRouter();
  const { withLoading } = useLoading();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<CompanySettings>(() => withEditableRows(initialSettings));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const cityRef = useRef(form.city);

  useEffect(() => {
    setForm(withEditableRows(initialSettings));
  }, [initialSettings]);

  useEffect(() => {
    cityRef.current = form.city;
  });

  useEffect(() => {
    const uf = form.state.trim().toUpperCase();
    if (!uf) {
      setCities([]);
      return;
    }

    let cancelled = false;
    setLoadingCities(true);
    fetchCitiesByState(uf)
      .then((list) => {
        if (cancelled) return;
        setCities(list);
        const currentCity = cityRef.current;
        if (!currentCity) return;
        const matched = matchCityInState(currentCity, list);
        if (matched && matched !== currentCity) {
          setForm((current) => ({ ...current, city: matched }));
        }
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCities(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.state]);

  function patch(fields: Partial<CompanySettings>) {
    setForm((current) => ({ ...current, ...fields }));
  }

  function updateEmail(index: number, value: string) {
    setForm((current) => {
      const emails = current.emails.map((item, itemIndex) =>
        itemIndex === index ? { ...item, value } : item,
      );
      return { ...current, emails, email: emails[0]?.value || "" };
    });
  }

  function addEmail() {
    setForm((current) => ({
      ...current,
      emails: [...current.emails, { value: "" }],
    }));
  }

  function removeEmail(index: number) {
    setForm((current) => {
      const emails = current.emails.filter((_, itemIndex) => itemIndex !== index);
      const next = emails.length ? emails : [{ value: "" }];
      return { ...current, emails: next, email: next[0]?.value || "" };
    });
  }

  function updatePhone(index: number, value: string) {
    setForm((current) => {
      const phones = current.phones.map((item, itemIndex) =>
        itemIndex === index ? { ...item, value: formatPhoneMask(value) } : item,
      );
      return { ...current, phones, phoneDisplay: phones[0]?.value || "" };
    });
  }

  function setPhoneListingFlag(index: number, showOnListing: boolean) {
    setForm((current) => ({
      ...current,
      phones: current.phones.map((item, itemIndex) =>
        itemIndex === index ? { ...item, showOnListing } : item,
      ),
    }));
  }

  function addPhone() {
    setForm((current) => ({
      ...current,
      phones: [...current.phones, { value: "", showOnListing: false }],
    }));
  }

  function removePhone(index: number) {
    setForm((current) => {
      const phones = current.phones.filter((_, itemIndex) => itemIndex !== index);
      const next = phones.length ? phones : [{ value: "", showOnListing: false }];
      return { ...current, phones: next, phoneDisplay: next[0]?.value || "" };
    });
  }

  function setListingVisibility(key: keyof CompanyListingVisibility, value: boolean) {
    setForm((current) => ({
      ...current,
      listingVisibility: {
        ...current.listingVisibility,
        [key]: value,
      },
    }));
  }

  function afterSave(settings: CompanySettings) {
    setForm(withEditableRows(settings));
  }

  async function lookupCep(rawCep: string) {
    const digits = normalizeCep(rawCep);
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      const result = await fetchAddressByCep(digits);
      if (!result) {
        setError("CEP não encontrado.");
        return;
      }
      setError(null);
      patch({
        cep: formatCep(digits),
        address: result.logradouro || form.address,
        neighborhood: result.bairro || form.neighborhood,
        city: result.localidade || form.city,
        state: result.uf || form.state,
        complement: result.complemento || form.complement,
      });
    } catch {
      setError("Não foi possível consultar o CEP.");
    } finally {
      setLoadingCep(false);
    }
  }

  function save() {
    setMessage(null);
    setError(null);
    startTransition(() => {
      void withLoading(async () => {
        const response = await fetch("/api/company", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(form),
        });
        const data = (await response.json().catch(() => ({}))) as
          | CompanySettings
          | { error?: string };
        if (!response.ok) {
          setError(
            "error" in data && data.error
              ? data.error
              : "Não foi possível salvar os dados da empresa.",
          );
          return;
        }
        afterSave(data as CompanySettings);
        setMessage("Dados da empresa atualizados.");
        router.refresh();
      });
    });
  }

  const cityOptions =
    form.city && !cities.includes(form.city) ? [form.city, ...cities] : cities;

  return (
    <AdminShell title="Dados da empresa">
      <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto space-y-6">
        <div>
          <p className="text-muted">
            Atualize telefone, e-mail, redes sociais e endereço exibidos no site.
          </p>
        </div>

        {(message || error) && (
          <Alert
            variant={error ? "destructive" : "default"}
            className={`rounded-2xl ${!error ? "border-green-200 bg-green-50 text-green-700" : ""}`}
          >
            <AlertDescription>{error || message}</AlertDescription>
          </Alert>
        )}

        <Card className="p-0">
          <CardHeader className="p-7 pb-0">
            <CardTitle className="h-display text-2xl font-normal">Identidade</CardTitle>
          </CardHeader>
          <CardContent className="p-7 space-y-5">
            <div>
              <Label htmlFor="company-name">Nome da empresa</Label>
              <Input
                id="company-name"
                value={form.companyName}
                onChange={(event) => patch({ companyName: event.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="p-7 pb-0">
            <CardTitle className="h-display text-2xl font-normal">E-mails</CardTitle>
            <p className="text-sm text-muted mt-1">
              O primeiro da lista é o e-mail principal.
            </p>
          </CardHeader>
          <CardContent className="p-7 space-y-3">
            {form.emails.map((email, index) => (
              <div key={`email-${index}`} className="flex gap-2">
                <Input
                  id={index === 0 ? "company-email" : undefined}
                  type="email"
                  placeholder="E-mail"
                  value={email.value}
                  onChange={(event) => updateEmail(index, event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  disabled={form.emails.length <= 1}
                  onClick={() => removeEmail(index)}
                  aria-label={`Remover e-mail ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addEmail}>
              <Plus className="h-4 w-4" />
              Adicionar e-mail
            </Button>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="p-7 pb-0">
            <CardTitle className="h-display text-2xl font-normal">Telefones</CardTitle>
            <p className="text-sm text-muted mt-1">
              Marque a flag ao lado do campo para exibir na página de venda do imóvel.
            </p>
          </CardHeader>
          <CardContent className="p-7 space-y-3">
            {form.phones.map((phone, index) => (
              <div
                key={`phone-${index}`}
                className="flex flex-col gap-2 rounded-2xl border border-line p-3 sm:flex-row sm:items-center"
              >
                <Input
                  id={index === 0 ? "company-phone" : undefined}
                  inputMode="tel"
                  placeholder="Telefone"
                  value={phone.value}
                  onChange={(event) => updatePhone(index, event.target.value)}
                  className="sm:flex-1"
                />
                <label className="flex items-center gap-2 text-sm text-ink shrink-0 cursor-pointer">
                  <Checkbox
                    checked={phone.showOnListing}
                    onCheckedChange={(checked) =>
                      setPhoneListingFlag(index, checked === true)
                    }
                  />
                  Exibir na venda
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 self-end sm:self-auto"
                  disabled={form.phones.length <= 1}
                  onClick={() => removePhone(index)}
                  aria-label={`Remover telefone ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addPhone}>
              <Plus className="h-4 w-4" />
              Adicionar telefone
            </Button>

            <div className="space-y-3 border-t border-line pt-4">
              <div className="flex flex-col gap-2 rounded-2xl border border-line p-3 sm:flex-row sm:items-center">
                <div className="sm:flex-1 min-w-0">
                  <Label htmlFor="company-whatsapp">WhatsApp principal</Label>
                  <Input
                    id="company-whatsapp"
                    inputMode="tel"
                    placeholder="WhatsApp"
                    value={form.whatsappDisplay}
                    onChange={(event) =>
                      patch({ whatsappDisplay: formatPhoneMask(event.target.value) })
                    }
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-ink shrink-0 cursor-pointer sm:mt-6">
                  <Checkbox
                    checked={form.listingVisibility.whatsapp}
                    onCheckedChange={(checked) =>
                      setListingVisibility("whatsapp", checked === true)
                    }
                  />
                  Exibir na venda
                </label>
              </div>

              <label className="flex items-center gap-2 rounded-2xl border border-line p-3 text-sm text-ink cursor-pointer">
                <Checkbox
                  checked={form.listingVisibility.scheduleVisit}
                  onCheckedChange={(checked) =>
                    setListingVisibility("scheduleVisit", checked === true)
                  }
                />
                Exibir botão “Agendar visita” na página de venda
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="p-7 pb-0">
            <CardTitle className="h-display text-2xl font-normal">Redes sociais</CardTitle>
          </CardHeader>
          <CardContent className="p-7 grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="company-instagram">Instagram</Label>
              <Input
                id="company-instagram"
                placeholder="@usuario"
                value={form.instagramHandle}
                onChange={(event) => patch({ instagramHandle: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="company-facebook">Facebook</Label>
              <Input
                id="company-facebook"
                placeholder="URL ou usuário"
                value={form.facebookUrl}
                onChange={(event) => patch({ facebookUrl: event.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="p-7 pb-0">
            <CardTitle className="h-display text-2xl font-normal">Endereço</CardTitle>
            <p className="text-sm text-muted mt-1">
              Exibido na página de contato e no rodapé quando preenchido.
            </p>
          </CardHeader>
          <CardContent className="p-7 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="min-w-0">
                <Label htmlFor="company-cep">CEP</Label>
                <div className="relative">
                  <Input
                    id="company-cep"
                    inputMode="numeric"
                    placeholder="00000-000"
                    maxLength={9}
                    value={form.cep}
                    onChange={(event) => patch({ cep: formatCep(event.target.value) })}
                    onBlur={() => void lookupCep(form.cep)}
                  />
                  {loadingCep ? (
                    <Spinner
                      size="sm"
                      className="absolute right-3 top-1/2 -translate-y-1/2 border-brand"
                    />
                  ) : null}
                </div>
              </div>
              <div className="min-w-0">
                <Label>Estado</Label>
                <SearchableSelect
                  value={form.state || undefined}
                  onValueChange={(uf) => patch({ state: uf, city: "" })}
                  placeholder="UF"
                  searchPlaceholder="Pesquisar estado..."
                  options={BRAZIL_STATES.map((state) => ({
                    value: state.uf,
                    label: `${state.name} (${state.uf})`,
                  }))}
                />
              </div>
              <div className="min-w-0">
                <Label>Cidade</Label>
                <SearchableSelect
                  value={form.city || undefined}
                  onValueChange={(city) => patch({ city })}
                  disabled={!form.state || loadingCities}
                  placeholder={
                    !form.state
                      ? "Selecione o estado"
                      : loadingCities
                        ? "Carregando..."
                        : "Cidade"
                  }
                  searchPlaceholder="Pesquisar cidade..."
                  emptyMessage="Nenhuma cidade encontrada."
                  options={cityOptions.map((city) => ({
                    value: city,
                    label: city,
                  }))}
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="company-neighborhood">Bairro</Label>
                <Input
                  id="company-neighborhood"
                  value={form.neighborhood}
                  onChange={(event) => patch({ neighborhood: event.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
              <div>
                <Label htmlFor="company-address">Endereço / Rua</Label>
                <Input
                  id="company-address"
                  value={form.address}
                  onChange={(event) => patch({ address: event.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="company-number">Número</Label>
                <Input
                  id="company-number"
                  value={form.number}
                  onChange={(event) => patch({ number: event.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company-complement">Complemento</Label>
              <Input
                id="company-complement"
                value={form.complement}
                onChange={(event) => patch({ complement: event.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="button" disabled={pending} onClick={save}>
            {pending ? <Spinner size="sm" className="border-white border-t-transparent" /> : null}
            Salvar alterações
          </Button>
        </div>
      </div>
    </AdminShell>
  );
}

function withEditableRows(settings: CompanySettings): CompanySettings {
  return {
    ...settings,
    emails: settings.emails.length ? settings.emails : [{ value: "" }],
    phones: settings.phones.length
      ? settings.phones
      : [{ value: "", showOnListing: false }],
  };
}
