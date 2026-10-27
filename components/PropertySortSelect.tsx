"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS, buildImoveisHref, normalizeSortOption } from "@/lib/property-filters";

export function PropertySortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = normalizeSortOption(searchParams.get("ordenar") ?? undefined);

  function handleChange(next: string) {
    const params = Object.fromEntries(searchParams.entries()) as Record<string, string>;
    // Trocar ordenação volta para a página 1
    delete params.pagina;
    router.push(
      buildImoveisHref({
        ...params,
        ordenar: next === "recentes" ? undefined : next,
      }),
    );
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="h-9 w-[160px] border-none bg-transparent shadow-none px-2 font-medium focus:ring-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
