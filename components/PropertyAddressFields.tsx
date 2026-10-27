"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchCitiesByState, matchCityInState } from "@/lib/brazil-cities";
import { BRAZIL_STATES } from "@/lib/brazil-states";
import { fetchAddressByCep, formatCep, normalizeCep } from "@/lib/cep";
import {
  ADDRESS_DISPLAY_OPTIONS,
  type AddressDisplay,
} from "@/lib/address-display";
import { formatIntegerMask } from "@/lib/masks";
import { getFieldVisibility } from "@/lib/property-type-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

export type AddressFormSlice = {
  cep: string;
  address: string;
  number: string;
  complement: string;
  floors: string;
  towers: string;
  neighborhood: string;
  city: string;
  state: string;
  addressDisplay: AddressDisplay;
};

type PropertyAddressFieldsProps = {
  values: AddressFormSlice;
  onChange: (patch: Partial<AddressFormSlice>) => void;
  onCepMessage?: (message: string | null) => void;
  propertyType?: string;
};

export function PropertyAddressFields({
  values,
  onChange,
  onCepMessage,
  propertyType = "Casa",
}: PropertyAddressFieldsProps) {
  const fieldVisibility = getFieldVisibility(propertyType);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    const uf = values.state.trim().toUpperCase();
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
        if (values.city) {
          const matched = matchCityInState(values.city, list);
          if (matched && matched !== values.city) {
            onChange({ city: matched });
          }
        }
      })
      .catch(() => {
        if (cancelled) return;
        setCities([]);
        onCepMessage?.("Não foi possível carregar a lista de cidades.");
      })
      .finally(() => {
        if (!cancelled) setLoadingCities(false);
      });

    return () => {
      cancelled = true;
    };
  }, [values.state, onCepMessage]);

  const cityOptions = useMemo(() => {
    if (!values.city) return cities;
    const matched = cities.length ? matchCityInState(values.city, cities) : values.city;
    if (cities.includes(matched)) return cities;
    return [matched, ...cities];
  }, [cities, values.city]);

  async function lookupCep(rawCep: string) {
    const digits = normalizeCep(rawCep);
    if (digits.length !== 8) return;

    setLoadingCep(true);
    onCepMessage?.(null);

    try {
      const result = await fetchAddressByCep(digits);
      if (!result) {
        onCepMessage?.("CEP não encontrado.");
        return;
      }

      onChange({
        cep: formatCep(result.cep || digits),
        address: result.logradouro || values.address,
        neighborhood: result.bairro || values.neighborhood,
        city: result.localidade,
        state: result.uf,
      });
      onCepMessage?.("Endereço preenchido pelo CEP.");
    } catch {
      onCepMessage?.("Falha ao consultar o CEP.");
    } finally {
      setLoadingCep(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <p className="label">Endereço</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          <div className="min-w-0">
            <Label htmlFor="property-cep">CEP</Label>
            <div className="relative">
              <Input
                id="property-cep"
                inputMode="numeric"
                placeholder="00000-000"
                value={values.cep}
                maxLength={9}
                onChange={(event) => onChange({ cep: formatCep(event.target.value) })}
                onBlur={() => void lookupCep(values.cep)}
              />
              {loadingCep && (
                <Spinner
                  size="sm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 border-brand"
                />
              )}
            </div>
            <p className="mt-1.5 text-xs text-muted">Busca automática ao sair do campo.</p>
          </div>

          <div className="min-w-0">
            <Label>Estado</Label>
            <Select
              value={values.state || undefined}
              onValueChange={(uf) => onChange({ state: uf, city: "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {BRAZIL_STATES.map((state) => (
                  <SelectItem key={state.uf} value={state.uf}>
                    {state.name} ({state.uf})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0">
            <Label>Cidade</Label>
            <Select
              value={values.city || undefined}
              onValueChange={(city) => onChange({ city })}
              disabled={!values.state || loadingCities}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !values.state
                      ? "Selecione o estado primeiro"
                      : loadingCities
                        ? "Carregando cidades..."
                        : "Selecione a cidade"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {cityOptions.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0">
            <Label htmlFor="property-neighborhood">Bairro</Label>
            <Input
              id="property-neighborhood"
              value={values.neighborhood}
              onChange={(event) => onChange({ neighborhood: event.target.value })}
            />
          </div>

          <div className="sm:col-span-2 md:col-span-3 min-w-0">
            <Label htmlFor="property-address">Endereço / Rua</Label>
            <Input
              id="property-address"
              value={values.address}
              onChange={(event) => onChange({ address: event.target.value })}
            />
          </div>

          <div className="min-w-0">
            <Label htmlFor="property-number">Número</Label>
            <Input
              id="property-number"
              value={values.number}
              onChange={(event) => onChange({ number: event.target.value })}
            />
          </div>

          {fieldVisibility.complement ? (
            <div className="md:col-span-4">
              <Label htmlFor="property-complement">Apartamento / Complemento</Label>
              <Input
                id="property-complement"
                placeholder="Ex.: Apto 402, Bloco B"
                value={values.complement}
                onChange={(event) => onChange({ complement: event.target.value })}
              />
            </div>
          ) : null}
        </div>
      </div>

      {fieldVisibility.floors || fieldVisibility.towers ? (
        <div className="space-y-5 border-t border-line pt-6">
          <p className="label">Edifício / condomínio</p>
          <div className="grid md:grid-cols-2 gap-5">
            {fieldVisibility.floors ? (
              <div>
                <Label htmlFor="property-floors">Número de andares</Label>
                <Input
                  id="property-floors"
                  inputMode="numeric"
                  placeholder="Ex.: 12"
                  value={values.floors}
                  onChange={(event) =>
                    onChange({ floors: formatIntegerMask(event.target.value, 3) })
                  }
                />
              </div>
            ) : null}

            {fieldVisibility.towers ? (
              <div>
                <Label htmlFor="property-towers">Número de torres</Label>
                <Input
                  id="property-towers"
                  inputMode="numeric"
                  placeholder="Ex.: 2"
                  value={values.towers}
                  onChange={(event) =>
                    onChange({ towers: formatIntegerMask(event.target.value, 3) })
                  }
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="space-y-4 rounded-2xl border border-line bg-surface/40 p-4 sm:p-5">
        <div>
          <Label>Visibilidade da localização</Label>
          <p className="mt-1 text-xs text-muted">
            Escolha quais informações de localização serão exibidas publicamente no anúncio.
          </p>
        </div>

        <Select
          value={values.addressDisplay}
          onValueChange={(value) => onChange({ addressDisplay: value as AddressDisplay })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ADDRESS_DISPLAY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
