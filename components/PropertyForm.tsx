"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Info,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { ManagedImage } from "@/components/ManagedImage";
import { PropertyAddressFields } from "@/components/PropertyAddressFields";
import { RichTextEditor } from "@/components/RichTextEditor";
import { useLoading } from "@/components/LoadingProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import type { AddressDisplay } from "@/lib/address-display";
import {
  isDescriptionEmpty,
  normalizeDescriptionHtml,
} from "@/lib/description-html";
import {
  formatAreaMask,
  formatCurrencyMask,
  formatIntegerMask,
  parseAreaMask,
  parseCurrencyMask,
} from "@/lib/masks";
import { getFieldVisibility, PROPERTY_TYPES } from "@/lib/property-type-fields";
import { TEAM_IMOVEL_FORM, TEAM_IMOVIES } from "@/lib/routes";
import { uploadPropertyImages, type UploadProgressUpdate } from "@/lib/upload-files";
import type { CustomField, IptuPeriod, Property, PropertyStatus } from "@/lib/types";

const ROOM_OPTIONS = ["Sala", "Cozinha", "Escritório", "Lavanderia", "Lavabo", "Dependência"];
const LEISURE_OPTIONS = ["Piscina", "Área gourmet", "Churrasqueira", "Jardim", "Terraço", "Sauna"];
const EXTRA_OPTIONS = ["Mobiliado", "Ar-condicionado", "Segurança", "Aquecimento"];
const CHARACTERISTIC_OPTIONS = [...LEISURE_OPTIONS, ...EXTRA_OPTIONS];
const PROXIMITY_OPTIONS = ["Supermercado", "Escola", "Hospital", "Restaurantes", "Marina"];

type FormState = {
  title: string;
  ref: string;
  type: string;
  status: PropertyStatus;
  price: string;
  description: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  floors: string;
  units: string;
  towers: string;
  addressDisplay: AddressDisplay;
  neighborhood: string;
  city: string;
  state: string;
  bedrooms: string;
  suites: string;
  bathrooms: string;
  socialBathrooms: string;
  parking: string;
  area: string;
  landArea: string;
  condo: string;
  condoExempt: boolean;
  iptu: string;
  iptuPeriod: IptuPeriod;
  iptuExempt: boolean;
  rooms: string[];
  leisure: string[];
  extras: string[];
  proximities: string[];
  customFields: CustomField[];
  roomsCustomFields: CustomField[];
  locationCustomFields: CustomField[];
  images: string[];
  coverIndex: number;
  featured: boolean;
  highlight: boolean;
};

function emptyForm(): FormState {
  return {
    title: "",
    ref: "",
    type: "Casa",
    status: "Rascunho",
    price: "",
    description: "",
    cep: "",
    address: "",
    number: "",
    complement: "",
    floors: "",
    units: "",
    towers: "",
    addressDisplay: "street",
    neighborhood: "",
    city: "",
    state: "",
    bedrooms: "0",
    suites: "0",
    bathrooms: "0",
    socialBathrooms: "0",
    parking: "0",
    area: "",
    landArea: "",
    condo: "",
    condoExempt: false,
    iptu: "",
    iptuPeriod: "anual",
    iptuExempt: false,
    rooms: [],
    leisure: [],
    extras: [],
    proximities: [],
    customFields: [],
    roomsCustomFields: [],
    locationCustomFields: [],
    images: [],
    coverIndex: 0,
    featured: false,
    highlight: false,
  };
}

function fromProperty(property: Property): FormState {
  return {
    title: property.title,
    ref: property.ref,
    type: property.type,
    status: property.status,
    price: property.price ? formatCurrencyMask(String(property.price)) : "",
    description: normalizeDescriptionHtml(property.description),
    cep: property.cep,
    address: property.address,
    number: property.number,
    complement: property.complement ?? "",
    floors: property.floors ? formatIntegerMask(String(property.floors)) : "",
    units: property.units ? formatIntegerMask(String(property.units)) : "",
    towers: property.towers ? formatIntegerMask(String(property.towers)) : "",
    addressDisplay: property.addressDisplay ?? "street",
    neighborhood: property.neighborhood,
    city: property.city,
    state: property.state,
    bedrooms: formatIntegerMask(String(property.bedrooms)),
    suites: formatIntegerMask(String(property.suites)),
    bathrooms: formatIntegerMask(String(property.bathrooms)),
    socialBathrooms: formatIntegerMask(String(property.socialBathrooms ?? 0)),
    parking: formatIntegerMask(String(property.parking)),
    area: property.area ? formatAreaMask(String(property.area).replace(".", ",")) : "",
    landArea: property.landArea
      ? formatAreaMask(String(property.landArea).replace(".", ","))
      : "",
    condo: property.condoExempt
      ? ""
      : property.condo
        ? formatCurrencyMask(property.condo)
        : "",
    condoExempt: property.condoExempt ?? false,
    iptu: property.iptuExempt ? "" : property.iptu ? formatCurrencyMask(property.iptu) : "",
    iptuPeriod: property.iptuPeriod ?? "anual",
    iptuExempt: property.iptuExempt ?? false,
    rooms: property.rooms,
    leisure: property.leisure,
    extras: property.extras,
    proximities: property.proximities,
    customFields: property.customFields ?? [],
    roomsCustomFields: property.roomsCustomFields ?? [],
    locationCustomFields: property.locationCustomFields ?? [],
    images: property.images.length ? property.images : property.image ? [property.image] : [],
    coverIndex: 0,
    featured: property.featured,
    highlight: property.highlight,
  };
}

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

type PropertyFormProps = {
  initialProperty?: Property | null;
};

export function PropertyForm({ initialProperty = null }: PropertyFormProps) {
  const router = useRouter();
  const { withLoading } = useLoading();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(
    initialProperty ? fromProperty(initialProperty) : emptyForm(),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draggingPhotos, setDraggingPhotos] = useState(false);
  const [dragPhotoIndex, setDragPhotoIndex] = useState<number | null>(null);
  const [dropPhotoIndex, setDropPhotoIndex] = useState<number | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [customFieldLabel, setCustomFieldLabel] = useState("");
  const [customFieldValue, setCustomFieldValue] = useState("");
  const [roomsFieldLabel, setRoomsFieldLabel] = useState("");
  const [roomsFieldValue, setRoomsFieldValue] = useState("");
  const [locationFieldLabel, setLocationFieldLabel] = useState("");
  const [locationFieldValue, setLocationFieldValue] = useState("");
  const [photoUpload, setPhotoUpload] = useState<UploadProgressUpdate | null>(null);
  const [storageReady, setStorageReady] = useState(Boolean(initialProperty));
  const sessionUploadsRef = useRef<string[]>([]);
  const uploadingPhotos =
    photoUpload !== null && photoUpload.phase !== "completed" && photoUpload.phase !== "error";
  useEffect(() => {
    if (initialProperty) return;

    let cancelled = false;
    void (async () => {
      try {
        await fetch("/api/admin/cleanup-images?sweep=1", {
          method: "POST",
          credentials: "same-origin",
        });
      } catch {
        // A criação segue mesmo se a limpeza anterior falhar.
      } finally {
        if (!cancelled) setStorageReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialProperty]);

  useEffect(() => {
    function discardSessionUploads() {
      const urls = sessionUploadsRef.current.splice(0);
      if (!urls.length) return;

      const body = JSON.stringify({ urls });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/admin/cleanup-images",
          new Blob([body], { type: "application/json" }),
        );
        return;
      }

      void fetch("/api/admin/cleanup-images", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }

    window.addEventListener("pagehide", discardSessionUploads);
    return () => {
      window.removeEventListener("pagehide", discardSessionUploads);
      discardSessionUploads();
    };
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const fieldVisibility = getFieldVisibility(form.type);

  function buildPayload(status: PropertyStatus) {
    const images = [...form.images];

    return {
      title: form.title,
      ref: form.ref,
      type: form.type,
      typeLabel: form.type,
      status,
      price: parseCurrencyMask(form.price),
      description: isDescriptionEmpty(form.description)
        ? ""
        : normalizeDescriptionHtml(form.description),
      cep: form.cep,
      address: form.address,
      number: form.number,
      complement: form.complement,
      floors: Number(form.floors) || 0,
      units: Number(form.units) || 0,
      towers: Number(form.towers) || 0,
      addressDisplay: form.addressDisplay,
      neighborhood: form.neighborhood,
      city: form.city,
      state: form.state,
      latitude: initialProperty?.latitude ?? "",
      longitude: initialProperty?.longitude ?? "",
      bedrooms: Number(form.bedrooms) || 0,
      suites: Number(form.suites) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      socialBathrooms: Number(form.socialBathrooms) || 0,
      parking: Number(form.parking) || 0,
      builtArea: initialProperty?.builtArea ?? 0,
      area: parseAreaMask(form.area),
      landArea: parseAreaMask(form.landArea),
      condo: form.condoExempt ? "" : form.condo,
      condoExempt: form.condoExempt,
      iptu: form.iptuExempt ? "" : form.iptu,
      iptuPeriod: form.iptuPeriod,
      iptuExempt: form.iptuExempt,
      rooms: form.rooms,
      leisure: form.leisure,
      extras: form.extras,
      proximities: form.proximities,
      customFields: form.customFields,
      roomsCustomFields: form.roomsCustomFields,
      locationCustomFields: form.locationCustomFields,
      images,
      image: images[0] || "",
      featured: form.featured,
      highlight: form.highlight,
    };
  }

  async function save(status: PropertyStatus) {
    setError(null);
    setMessage(null);

    if (!form.title.trim()) {
      setError("Informe o título do imóvel.");
      return;
    }

    startTransition(async () => {
      await withLoading(async () => {
        try {
          const payload = buildPayload(status);
          const response = await fetch(
            initialProperty ? `/api/properties/${initialProperty.id}` : "/api/properties",
            {
              method: initialProperty ? "PUT" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            },
          );
          const data = await response.json();
          if (!response.ok) {
            setError(data.error || "Falha ao salvar.");
            return;
          }
          const kept = new Set(payload.images);
          const abandoned = sessionUploadsRef.current.filter((url) => !kept.has(url));
          sessionUploadsRef.current = [];
          if (abandoned.length) {
            void fetch("/api/admin/cleanup-images", {
              method: "POST",
              credentials: "same-origin",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ urls: abandoned }),
            });
          }
          setMessage(status === "Publicado" ? "Imóvel publicado." : "Rascunho salvo.");
          setForm((current) => ({ ...current, status }));
          if (!initialProperty) {
            router.replace(`${TEAM_IMOVEL_FORM}?id=${data.id}`);
            router.refresh();
          } else {
            router.refresh();
          }
        } catch {
          setError("Erro de conexão ao salvar.");
        }
      }, status === "Publicado" ? "Publicando imóvel..." : "Salvando rascunho...");
    });
  }

  async function removeProperty() {
    if (!initialProperty) return;

    startTransition(async () => {
      await withLoading(async () => {
        const response = await fetch(`/api/properties/${initialProperty.id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          setError("Não foi possível excluir.");
          setDeleteOpen(false);
          return;
        }
        setDeleteOpen(false);
        router.push(TEAM_IMOVIES);
        router.refresh();
      }, "Excluindo imóvel...");
    });
  }

  async function onUpload(files: FileList | File[] | null) {
    if (!files?.length || uploadingPhotos || !storageReady) return;
    setError(null);
    setMessage(null);

    const list = Array.from(files);

    try {
      const urls = await uploadPropertyImages(list, (progress) => {
        setPhotoUpload(progress);
      });
      sessionUploadsRef.current.push(...urls);
      setForm((current) => ({
        ...current,
        images: [...current.images, ...urls],
      }));
      setMessage(`${urls.length} foto(s) adicionada(s).`);
      window.setTimeout(() => {
        setPhotoUpload((current) => (current?.phase === "completed" ? null : current));
      }, 2500);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Falha no upload.";
      setError(message);
      window.setTimeout(() => {
        setPhotoUpload((current) => (current?.phase === "error" ? null : current));
      }, 5000);
    }
  }

  function reorderImages(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return;
    setForm((current) => {
      if (from >= current.images.length || to >= current.images.length) return current;
      const images = [...current.images];
      const [item] = images.splice(from, 1);
      images.splice(to, 0, item);
      let coverIndex = current.coverIndex;
      if (coverIndex === from) coverIndex = to;
      else if (from < coverIndex && to >= coverIndex) coverIndex -= 1;
      else if (from > coverIndex && to <= coverIndex) coverIndex += 1;
      return { ...current, images, coverIndex };
    });
    setSelectedPhotos([]);
  }

  function onPhotoDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (dragPhotoIndex !== null) {
      event.dataTransfer.dropEffect = "move";
      return;
    }
    setDraggingPhotos(true);
  }

  function onPhotoDragLeave(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget === event.target) {
      setDraggingPhotos(false);
    }
  }

  function onPhotoDrop(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setDraggingPhotos(false);

    // Reordenação interna: não tratar como novo upload.
    if (dragPhotoIndex !== null) {
      setDragPhotoIndex(null);
      setDropPhotoIndex(null);
      return;
    }

    if (uploadingPhotos || !storageReady) return;

    const files = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );
    // Arrastar foto já na galeria (sem arquivo novo) não deve reenviar/reinserir.
    if (!files.length) return;
    void onUpload(files);
  }

  function removeImage(index: number) {
    setForm((current) => {
      const images = current.images.filter((_, i) => i !== index);
      const coverIndex =
        current.coverIndex === index
          ? 0
          : current.coverIndex > index
            ? current.coverIndex - 1
            : current.coverIndex;
      return { ...current, images, coverIndex };
    });
    setSelectedPhotos((current) =>
      current
        .filter((item) => item !== index)
        .map((item) => (item > index ? item - 1 : item)),
    );
  }

  function removeSelectedPhotos() {
    if (!selectedPhotos.length) return;
    const removeSet = new Set(selectedPhotos);
    setForm((current) => {
      const images = current.images.filter((_, index) => !removeSet.has(index));
      const coverSrc =
        current.images[current.coverIndex] && !removeSet.has(current.coverIndex)
          ? current.images[current.coverIndex]
          : images[0];
      const coverIndex = coverSrc ? Math.max(0, images.indexOf(coverSrc)) : 0;
      return { ...current, images, coverIndex };
    });
    setSelectedPhotos([]);
  }

  function removeAllPhotos() {
    setForm((current) => ({ ...current, images: [], coverIndex: 0 }));
    setSelectedPhotos([]);
  }

  function togglePhotoSelection(index: number) {
    setSelectedPhotos((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    );
  }

  function moveImage(index: number, direction: -1 | 1) {
    reorderImages(index, index + direction);
  }

  const openPhotoPreview = useCallback((index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  }, []);

  const showPreviousPreview = useCallback(() => {
    setPreviewIndex((current) =>
      form.images.length === 0
        ? 0
        : current === 0
          ? form.images.length - 1
          : current - 1,
    );
  }, [form.images.length]);

  const showNextPreview = useCallback(() => {
    setPreviewIndex((current) =>
      form.images.length === 0
        ? 0
        : current === form.images.length - 1
          ? 0
          : current + 1,
    );
  }, [form.images.length]);

  useEffect(() => {
    if (!previewOpen) return;
    if (form.images.length === 0) {
      setPreviewOpen(false);
      return;
    }
    if (previewIndex >= form.images.length) {
      setPreviewIndex(form.images.length - 1);
    }
  }, [form.images.length, previewIndex, previewOpen]);

  useEffect(() => {
    if (!previewOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") showPreviousPreview();
      if (event.key === "ArrowRight") showNextPreview();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen, showNextPreview, showPreviousPreview]);

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-[1500px] mx-auto">
      <div className="mb-8">
        <Button asChild variant="ghost" className="h-auto px-0 text-muted hover:bg-transparent">
          <Link href={TEAM_IMOVIES}>
            <ArrowLeft className="h-4 w-4" />
            Voltar para imóveis
          </Link>
        </Button>
        <p className="text-muted mt-2">Cadastre ou edite as informações exibidas no site.</p>
      </div>

      {(message || error) && (
        <Alert
          variant={error ? "destructive" : "default"}
          className={`mb-6 rounded-2xl ${!error ? "border-green-200 bg-green-50 text-green-700" : ""}`}
        >
          <AlertDescription>{error || message}</AlertDescription>
        </Alert>
      )}

      <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
        <div className="min-w-0 space-y-6">
          <Card className="p-0">
            <CardHeader className="p-7 pb-0">
              <CardTitle className="h-display text-2xl font-normal">Informações básicas</CardTitle>
              <p className="text-sm text-muted mt-1">
                Título, preço e texto principal que aparecem no anúncio.
              </p>
            </CardHeader>
            <CardContent className="p-7 space-y-6">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Label>Título</Label>
                  <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Descrição</Label>
                  <p className="text-xs text-muted">
                    Use títulos, negrito e listas para organizar o texto como ele aparece no anúncio.
                  </p>
                  <RichTextEditor
                    value={form.description}
                    onChange={(html) => update("description", html)}
                  />
                </div>
              </div>

              <div className="space-y-5 border-t border-line pt-6">
                <p className="label">Classificação e preço</p>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <Label>Tipo do imóvel</Label>
                    <Select value={form.type} onValueChange={(value) => update("type", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Referência</Label>
                    <Input value={form.ref} onChange={(e) => update("ref", e.target.value)} />
                  </div>
                  <div>
                    <Label>Preço</Label>
                    <Input
                      inputMode="numeric"
                      placeholder="R$ 0"
                      value={form.price}
                      onChange={(e) => update("price", formatCurrencyMask(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value) => update("status", value as PropertyStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Publicado">Publicado</SelectItem>
                        <SelectItem value="Rascunho">Rascunho</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t border-line pt-6">
                <div>
                  <p className="label">Visibilidade na home</p>
                  <p className="mt-1 text-xs text-muted">
                    Opcional. Define se o imóvel entra nas seções de destaque da página inicial.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-3 text-sm">
                      <Checkbox
                        checked={form.featured}
                        onCheckedChange={(checked) => update("featured", checked === true)}
                      />
                      Exibir nos imóveis em destaque
                    </label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-surface hover:text-ink transition-colors"
                          aria-label="Ver exemplo de imóveis em destaque"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-3xl p-0 overflow-hidden rounded-2xl">
                        <DialogHeader className="px-4 sm:px-6 pt-6 pb-3">
                          <DialogTitle>Exibir nos imóveis em destaque</DialogTitle>
                          <DialogDescription>
                            O imóvel aparece como card na grade da seção &ldquo;Imóveis em
                            destaque&rdquo; na página inicial.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="relative mx-4 sm:mx-6 mb-6 overflow-hidden rounded-xl border border-line bg-surface">
                          <Image
                            src="/help/destaque-listagem.png"
                            alt="Exemplo da grade de imóveis em destaque"
                            width={1200}
                            height={720}
                            className="h-auto w-full"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-3 text-sm">
                      <Checkbox
                        checked={form.highlight}
                        onCheckedChange={(checked) => update("highlight", checked === true)}
                      />
                      Exibir no carrousel principal
                    </label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-surface hover:text-ink transition-colors"
                          aria-label="Ver exemplo do carrousel principal"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-3xl p-0 overflow-hidden rounded-2xl">
                        <DialogHeader className="px-4 sm:px-6 pt-6 pb-3">
                          <DialogTitle>Exibir no carrousel principal</DialogTitle>
                          <DialogDescription>
                            O imóvel aparece no bloco grande no topo da home, com foto ampla e
                            detalhes ao lado. Vários imóveis marcados entram em carrousel.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="relative mx-4 sm:mx-6 mb-6 overflow-hidden rounded-xl border border-line bg-surface">
                          <Image
                            src="/help/vitrine-home.png"
                            alt="Exemplo do carrousel principal na página inicial"
                            width={1200}
                            height={720}
                            className="h-auto w-full"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader className="p-7 pb-0">
              <CardTitle className="h-display text-2xl font-normal">Localização</CardTitle>
              <p className="text-sm text-muted mt-1">
                Endereço completo e o que o visitante vê no anúncio público.
              </p>
            </CardHeader>
            <CardContent className="p-7 space-y-6">
              <PropertyAddressFields
                values={{
                  cep: form.cep,
                  address: form.address,
                  number: form.number,
                  complement: form.complement,
                  floors: form.floors,
                  units: form.units,
                  towers: form.towers,
                  addressDisplay: form.addressDisplay,
                  neighborhood: form.neighborhood,
                  city: form.city,
                  state: form.state,
                }}
                propertyType={form.type}
                onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
                onCepMessage={setMessage}
              />

              <div className="space-y-4 border-t border-line pt-6">
                <div>
                  <p className="label">Campos extras</p>
                  <p className="mt-1 text-xs text-muted">
                    Nome e valor livres. Ex.: Bloco, Quadra, Ponto de referência.
                  </p>
                </div>
                {form.locationCustomFields.length > 0 ? (
                  <ul className="space-y-2">
                    {form.locationCustomFields.map((field, index) => (
                      <li
                        key={`${field.label}-${index}`}
                        className="flex items-start sm:items-center justify-between gap-3 rounded-xl border border-line bg-white px-3 sm:px-4 py-3 text-sm min-w-0"
                      >
                        <span className="min-w-0 break-words">
                          <span className="font-medium text-ink">{field.label}:</span>{" "}
                          <span className="text-muted">{field.value}</span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600"
                          onClick={() =>
                            update(
                              "locationCustomFields",
                              form.locationCustomFields.filter((_, i) => i !== index),
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <Input
                    placeholder="Nome do campo"
                    value={locationFieldLabel}
                    onChange={(event) => setLocationFieldLabel(event.target.value)}
                  />
                  <Input
                    placeholder="Valor"
                    value={locationFieldValue}
                    onChange={(event) => setLocationFieldValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        const label = locationFieldLabel.trim();
                        const value = locationFieldValue.trim();
                        if (!label || !value) return;
                        update("locationCustomFields", [
                          ...form.locationCustomFields,
                          { label, value },
                        ]);
                        setLocationFieldLabel("");
                        setLocationFieldValue("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const label = locationFieldLabel.trim();
                      const value = locationFieldValue.trim();
                      if (!label || !value) return;
                      update("locationCustomFields", [
                        ...form.locationCustomFields,
                        { label, value },
                      ]);
                      setLocationFieldLabel("");
                      setLocationFieldValue("");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {fieldVisibility.roomQuantities ? (
            <Card className="p-0">
              <CardHeader className="p-7 pb-0">
                <CardTitle className="h-display text-2xl font-normal">Cômodos</CardTitle>
                <p className="text-sm text-muted mt-1">Quantidades principais do imóvel.</p>
              </CardHeader>
              <CardContent className="p-7 space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {(
                    [
                      ["bedrooms", "Quartos", fieldVisibility.bedrooms],
                      ["suites", "Suítes", fieldVisibility.suites],
                      ["bathrooms", "Banheiros", fieldVisibility.bathrooms],
                      ["socialBathrooms", "Banheiro social", fieldVisibility.socialBathrooms],
                    ] as const
                  )
                    .filter(([, , visible]) => visible)
                    .map(([key, label]) => (
                      <div key={key} className="min-w-0">
                        <Label>{label}</Label>
                        <Input
                          inputMode="numeric"
                          value={form[key]}
                          onChange={(e) => update(key, formatIntegerMask(e.target.value, 3))}
                        />
                      </div>
                    ))}
                </div>

                <div className="space-y-4 border-t border-line pt-6">
                  <div>
                    <p className="label">Campos extras</p>
                    <p className="mt-1 text-xs text-muted">
                      Nome e valor livres. Ex.: Closet, Despensa, Home office.
                    </p>
                  </div>
                  {form.roomsCustomFields.length > 0 ? (
                    <ul className="space-y-2">
                      {form.roomsCustomFields.map((field, index) => (
                        <li
                          key={`${field.label}-${index}`}
                          className="flex items-start sm:items-center justify-between gap-3 rounded-xl border border-line bg-white px-3 sm:px-4 py-3 text-sm min-w-0"
                        >
                          <span className="min-w-0 break-words">
                            <span className="font-medium text-ink">{field.label}:</span>{" "}
                            <span className="text-muted">{field.value}</span>
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={() =>
                              update(
                                "roomsCustomFields",
                                form.roomsCustomFields.filter((_, i) => i !== index),
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <Input
                      placeholder="Nome do campo"
                      value={roomsFieldLabel}
                      onChange={(event) => setRoomsFieldLabel(event.target.value)}
                    />
                    <Input
                      placeholder="Valor"
                      value={roomsFieldValue}
                      onChange={(event) => setRoomsFieldValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          const label = roomsFieldLabel.trim();
                          const value = roomsFieldValue.trim();
                          if (!label || !value) return;
                          update("roomsCustomFields", [
                            ...form.roomsCustomFields,
                            { label, value },
                          ]);
                          setRoomsFieldLabel("");
                          setRoomsFieldValue("");
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const label = roomsFieldLabel.trim();
                        const value = roomsFieldValue.trim();
                        if (!label || !value) return;
                        update("roomsCustomFields", [
                          ...form.roomsCustomFields,
                          { label, value },
                        ]);
                        setRoomsFieldLabel("");
                        setRoomsFieldValue("");
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="p-0">
            <CardHeader className="p-7 pb-0">
              <CardTitle className="h-display text-2xl font-normal">Características</CardTitle>
              <p className="text-sm text-muted mt-1">Áreas e custos do imóvel.</p>
            </CardHeader>
            <CardContent className="p-7 space-y-6">
              <div className="space-y-5">
                <p className="label">Áreas e vagas</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                  {(
                    [
                      ["parking", "Vagas", fieldVisibility.parking],
                      ["area", "Área total", fieldVisibility.area],
                      ["landArea", "Área terreno", fieldVisibility.landArea],
                    ] as const
                  )
                    .filter(([, , visible]) => visible)
                    .map(([key, label]) => {
                      const isArea = key === "area" || key === "landArea";
                      return (
                        <div key={key} className="min-w-0">
                          <Label>{label}</Label>
                          <Input
                            inputMode={isArea ? "decimal" : "numeric"}
                            value={form[key]}
                            onChange={(e) =>
                              update(
                                key,
                                isArea
                                  ? formatAreaMask(e.target.value)
                                  : formatIntegerMask(e.target.value, 3),
                              )
                            }
                          />
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="space-y-5 border-t border-line pt-6">
                <p className="label">
                  {fieldVisibility.condo ? "Condomínio e IPTU" : "IPTU"}
                </p>
                <div
                  className={`grid gap-5 ${
                    fieldVisibility.condo ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                  }`}
                >
                  {fieldVisibility.condo ? (
                    <div className="min-w-0 space-y-2">
                      <Label htmlFor="condo">Condomínio</Label>
                      <Input
                        id="condo"
                        inputMode="numeric"
                        value={form.condoExempt ? "Isento" : form.condo}
                        disabled={form.condoExempt}
                        onChange={(e) => update("condo", formatCurrencyMask(e.target.value))}
                        placeholder="Ex.: R$ 850"
                      />
                      <label className="flex items-center gap-2 text-xs font-medium text-muted">
                        <Checkbox
                          checked={form.condoExempt}
                          onCheckedChange={(checked) => update("condoExempt", checked === true)}
                        />
                        Isento
                      </label>
                    </div>
                  ) : null}

                  <div className="min-w-0 space-y-2">
                    <Label htmlFor="iptu">IPTU</Label>
                    <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-3">
                      <Input
                        id="iptu"
                        inputMode="numeric"
                        value={form.iptuExempt ? "Isento" : form.iptu}
                        disabled={form.iptuExempt}
                        onChange={(e) => update("iptu", formatCurrencyMask(e.target.value))}
                        placeholder="Ex.: R$ 2.400"
                      />
                      <Select
                        value={form.iptuPeriod}
                        onValueChange={(value) => update("iptuPeriod", value as IptuPeriod)}
                        disabled={form.iptuExempt}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mensal">Mensal</SelectItem>
                          <SelectItem value="anual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-medium text-muted">
                      <Checkbox
                        checked={form.iptuExempt}
                        onCheckedChange={(checked) => update("iptuExempt", checked === true)}
                      />
                      Isento
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-line pt-6">
                <div>
                  <p className="label">Campos extras</p>
                  <p className="mt-1 text-xs text-muted">
                    Nome e valor livres. Ex.: Ano de construção, Pé-direito, Posição.
                  </p>
                </div>
                {form.customFields.length > 0 ? (
                  <ul className="space-y-2">
                    {form.customFields.map((field, index) => (
                      <li
                        key={`${field.label}-${index}`}
                        className="flex items-start sm:items-center justify-between gap-3 rounded-xl border border-line bg-white px-3 sm:px-4 py-3 text-sm min-w-0"
                      >
                        <span className="min-w-0 break-words">
                          <span className="font-medium text-ink">{field.label}:</span>{" "}
                          <span className="text-muted">{field.value}</span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600"
                          onClick={() =>
                            update(
                              "customFields",
                              form.customFields.filter((_, i) => i !== index),
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <Input
                    placeholder="Nome do campo"
                    value={customFieldLabel}
                    onChange={(event) => setCustomFieldLabel(event.target.value)}
                  />
                  <Input
                    placeholder="Valor"
                    value={customFieldValue}
                    onChange={(event) => setCustomFieldValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        const label = customFieldLabel.trim();
                        const value = customFieldValue.trim();
                        if (!label || !value) return;
                        update("customFields", [...form.customFields, { label, value }]);
                        setCustomFieldLabel("");
                        setCustomFieldValue("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const label = customFieldLabel.trim();
                      const value = customFieldValue.trim();
                      if (!label || !value) return;
                      update("customFields", [...form.customFields, { label, value }]);
                      setCustomFieldLabel("");
                      setCustomFieldValue("");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader className="p-7 pb-0">
              <CardTitle className="h-display text-2xl font-normal">
                {fieldVisibility.roomFlags
                  ? "Cômodos, características e proximidades"
                  : "Características e proximidades"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-7">
              <div
                className={`grid gap-8 text-sm ${
                  fieldVisibility.roomFlags ? "md:grid-cols-3" : "md:grid-cols-2"
                }`}
              >
                {fieldVisibility.roomFlags ? (
                  <CheckboxGroup
                    title="Cômodos"
                    options={ROOM_OPTIONS}
                    values={form.rooms}
                    onChange={(values) => update("rooms", values)}
                    allowCustom
                    customPlaceholder="Ex.: Despensa"
                  />
                ) : null}
                <CheckboxGroup
                  title="Características"
                  options={CHARACTERISTIC_OPTIONS}
                  values={[...form.leisure, ...form.extras]}
                  onChange={(values) => {
                    update(
                      "leisure",
                      values.filter((item) => LEISURE_OPTIONS.includes(item)),
                    );
                    update(
                      "extras",
                      values.filter((item) => !LEISURE_OPTIONS.includes(item)),
                    );
                  }}
                  allowCustom
                  customPlaceholder="Ex.: Vista mar"
                />
                <CheckboxGroup
                  title="Proximidades"
                  options={PROXIMITY_OPTIONS}
                  values={form.proximities}
                  onChange={(values) => update("proximities", values)}
                  allowCustom
                  customPlaceholder="Ex.: Metrô"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader className="p-7 pb-0 space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="h-display text-2xl font-normal">Fotos</CardTitle>
                  <p className="text-sm text-muted mt-1">
                    Arraste as fotos para reordenar, ou use as setas. Arraste arquivos novos para
                    enviar.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending || uploadingPhotos || !storageReady}
                    onClick={() => fileRef.current?.click()}
                  >
                    Selecionar fotos
                  </Button>
                  {form.images.length > 0 ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pending || uploadingPhotos || selectedPhotos.length === 0}
                        onClick={removeSelectedPhotos}
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir selecionadas
                        {selectedPhotos.length > 0 ? ` (${selectedPhotos.length})` : ""}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-red-700 hover:text-red-800"
                        disabled={pending || uploadingPhotos}
                        onClick={removeAllPhotos}
                      >
                        Excluir todas
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(event) => {
                  void onUpload(event.target.files);
                  event.target.value = "";
                }}
              />
            </CardHeader>
            <CardContent
              className="p-7"
              onDragOver={onPhotoDragOver}
              onDragLeave={onPhotoDragLeave}
              onDrop={onPhotoDrop}
            >
              {photoUpload && (
                <div
                  className={`mb-5 space-y-3 rounded-2xl border p-4 ${
                    photoUpload.phase === "error"
                      ? "border-red-200 bg-red-50"
                      : photoUpload.phase === "completed"
                        ? "border-green-200 bg-green-50"
                        : "border-brand/20 bg-brand/5"
                  }`}
                  role="status"
                  aria-live="polite"
                  aria-label="Progresso do envio de fotos"
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span
                      className={`font-medium ${
                        photoUpload.phase === "error"
                          ? "text-red-700"
                          : photoUpload.phase === "completed"
                            ? "text-green-700"
                            : "text-ink"
                      }`}
                    >
                      {photoUpload.message ??
                        (photoUpload.phase === "preparing"
                          ? "Preparando envio..."
                          : photoUpload.phase === "completed"
                            ? "Upload concluído"
                            : "Enviando fotos...")}
                    </span>
                    {photoUpload.phase !== "error" && (
                      <span
                        className={`font-bold tabular-nums ${
                          photoUpload.phase === "completed" ? "text-green-700" : "text-brand"
                        }`}
                      >
                        {photoUpload.percent}%
                      </span>
                    )}
                  </div>
                  {photoUpload.phase !== "error" && (
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/80">
                      <div
                        className={`h-full rounded-full transition-[width] duration-150 ease-out ${
                          photoUpload.phase === "completed" ? "bg-green-600" : "bg-brand"
                        }`}
                        style={{ width: `${photoUpload.percent}%` }}
                      />
                    </div>
                  )}
                  {photoUpload.phase === "uploading" && (
                    <p className="text-xs text-muted">
                      {photoUpload.uploadedFiles} de {photoUpload.totalFiles} fotos enviadas
                      {photoUpload.batchCount > 1
                        ? ` · lote ${photoUpload.batchIndex} de ${photoUpload.batchCount}`
                        : ""}
                    </p>
                  )}
                  {photoUpload.phase === "completed" && (
                    <p className="text-xs text-green-700">
                      {photoUpload.uploadedFiles} de {photoUpload.totalFiles} fotos enviadas com
                      sucesso.
                    </p>
                  )}
                  {photoUpload.phase === "error" && (
                    <p className="text-xs text-red-700">
                      {photoUpload.uploadedFiles > 0
                        ? `${photoUpload.uploadedFiles} de ${photoUpload.totalFiles} fotos foram enviadas antes do erro.`
                        : "Nenhuma foto foi enviada."}
                    </p>
                  )}
                </div>
              )}
              {form.images.length > 0 ? (
                <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                  <label className="flex items-center gap-2 text-muted">
                    <Checkbox
                      checked={
                        form.images.length > 0 && selectedPhotos.length === form.images.length
                      }
                      onCheckedChange={(checked) => {
                        setSelectedPhotos(
                          checked === true ? form.images.map((_, index) => index) : [],
                        );
                      }}
                    />
                    Selecionar todas
                  </label>
                  {selectedPhotos.length > 0 ? (
                    <span className="text-xs text-muted">
                      {selectedPhotos.length} selecionada(s)
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl transition-colors ${
                  draggingPhotos && !uploadingPhotos && dragPhotoIndex === null
                    ? "outline-2 outline-dashed outline-brand bg-brand/5 p-3 -m-3"
                    : ""
                }`}
              >
                {form.images.map((src, index) => {
                  const selected = selectedPhotos.includes(index);
                  const isDropTarget = dropPhotoIndex === index && dragPhotoIndex !== null;
                  const isCover = index === form.coverIndex;
                  return (
                    <div
                      key={`${src}::${index}`}
                      draggable={!uploadingPhotos}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", `photo:${index}`);
                        setDragPhotoIndex(index);
                        setDraggingPhotos(false);
                      }}
                      onDragEnd={() => {
                        setDragPhotoIndex(null);
                        setDropPhotoIndex(null);
                      }}
                      onDragOver={(event) => {
                        if (dragPhotoIndex === null) return;
                        event.preventDefault();
                        event.stopPropagation();
                        event.dataTransfer.dropEffect = "move";
                        setDropPhotoIndex(index);
                      }}
                      onDrop={(event) => {
                        if (dragPhotoIndex === null) return;
                        event.preventDefault();
                        event.stopPropagation();
                        reorderImages(dragPhotoIndex, index);
                        setDragPhotoIndex(null);
                        setDropPhotoIndex(null);
                        setDraggingPhotos(false);
                      }}
                      className={`cursor-grab overflow-hidden rounded-2xl border-2 bg-white active:cursor-grabbing ${
                        isCover ? "border-brand" : "border-line"
                      } ${selected ? "ring-2 ring-brand/40" : ""} ${
                        isDropTarget ? "border-dashed border-brand" : ""
                      } ${dragPhotoIndex === index ? "opacity-60" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => openPhotoPreview(index)}
                        className="group relative block aspect-[4/3] w-full bg-surface text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
                        aria-label={`Ampliar foto ${index + 1}`}
                      >
                        <ManagedImage
                          className="pointer-events-none object-cover"
                          src={src}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, 50vw"
                          draggable={false}
                        />
                        <span className="pointer-events-none absolute inset-0 flex items-end justify-center bg-black/0 pb-3 opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100">
                          <span className="rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white">
                            Clique para ampliar
                          </span>
                        </span>
                      </button>

                      <div className="space-y-2 border-t border-line bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-sm text-ink">
                            <Checkbox
                              checked={selected}
                              onCheckedChange={() => togglePhotoSelection(index)}
                              aria-label={`Selecionar foto ${index + 1}`}
                            />
                            <span className="font-medium">Foto {index + 1}</span>
                          </label>
                          {isCover ? (
                            <span className="rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              Capa
                            </span>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            disabled={index === 0}
                            onClick={() => moveImage(index, -1)}
                            aria-label="Mover foto para a esquerda"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            disabled={index === form.images.length - 1}
                            onClick={() => moveImage(index, 1)}
                            aria-label="Mover foto para a direita"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8"
                            disabled={isCover}
                            onClick={() => {
                              if (index === 0) return;
                              setForm((current) => {
                                const images = [...current.images];
                                const [cover] = images.splice(index, 1);
                                images.unshift(cover);
                                return { ...current, images, coverIndex: 0 };
                              });
                              setSelectedPhotos([]);
                            }}
                          >
                            Definir capa
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => removeImage(index)}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={pending || uploadingPhotos || !storageReady}
                  className="flex min-h-[12rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line px-4 py-8 text-center text-muted transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
                >
                  <CloudUpload className="h-5 w-5" />
                  <span className="text-xs font-medium leading-snug">
                    Clique ou arraste
                    <br />
                    várias fotos aqui
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-28 xl:self-start">
          <Card className="p-0">
            <CardContent className="p-6">
              <p className="label">Publicação</p>
              <h3 className="font-bold text-lg mb-5">Resumo do imóvel</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted shrink-0">Status</span>
                  <span
                    className={`font-bold text-right ${
                      form.status === "Publicado" ? "text-green-700" : "text-amber-700"
                    }`}
                  >
                    {form.status}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted shrink-0">Tipo</span>
                  <span className="text-right">{form.type || "—"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted shrink-0">Referência</span>
                  <span className="text-right">{form.ref || "—"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted shrink-0">Preço</span>
                  <span className="text-right">{form.price || "—"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted shrink-0">Fotos</span>
                  <span className="text-right">{form.images.length}</span>
                </div>
                {(form.featured || form.highlight) && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted shrink-0">Home</span>
                    <span className="text-right text-xs font-medium leading-relaxed">
                      {[
                        form.highlight ? "Carrousel" : null,
                        form.featured ? "Destaques" : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                )}
              </div>
              <Separator className="my-6" />
              <div className="space-y-3">
                <Button
                  type="button"
                  className="w-full"
                  disabled={pending}
                  onClick={() => save("Publicado")}
                >
                  {pending ? <Spinner size="sm" className="border-white border-t-transparent" /> : null}
                  Publicar imóvel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={pending}
                  onClick={() => save("Rascunho")}
                >
                  {pending ? <Spinner size="sm" className="border-brand" /> : null}
                  Salvar rascunho
                </Button>
                {initialProperty && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={pending}
                    onClick={() => setDeleteOpen(true)}
                  >
                    Excluir imóvel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemLabel={initialProperty ? `${initialProperty.title} (Ref: ${initialProperty.ref})` : undefined}
        loading={pending}
        onConfirm={() => void removeProperty()}
      />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[min(96vw,1200px)] w-full border-none bg-ink p-0 overflow-hidden rounded-3xl [&>button.absolute]:hidden">
          <DialogTitle className="sr-only">
            Visualizar foto {previewIndex + 1} de {form.images.length}
          </DialogTitle>

          {form.images[previewIndex] ? (
            <div className="relative bg-black aspect-[4/3] md:aspect-[16/10]">
              <ManagedImage
                src={form.images[previewIndex]}
                alt={`Foto ${previewIndex + 1}`}
                fill
                className="object-contain"
                sizes="96vw"
              />

              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label="Fechar visualização"
              >
                <X className="h-5 w-5" />
              </button>

              {form.images.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={showPreviousPreview}
                    className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={showNextPreview}
                    className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    aria-label="Próxima foto"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              ) : null}

              <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm font-bold text-white">
                {previewIndex + 1} / {form.images.length}
              </div>
            </div>
          ) : null}

          {form.images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto bg-ink p-4">
              {form.images.map((src, index) => (
                <button
                  key={`${src}-preview-thumb-${index}`}
                  type="button"
                  onClick={() => setPreviewIndex(index)}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                    index === previewIndex
                      ? "border-brand"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  aria-label={`Ver foto ${index + 1}`}
                >
                  <ManagedImage
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CheckboxGroup({
  title,
  options,
  values,
  onChange,
  allowCustom = false,
  customPlaceholder = "Novo item",
}: {
  title?: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  allowCustom?: boolean;
  customPlaceholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const customValues = values.filter((value) => !options.includes(value));
  const visibleOptions = [...options, ...customValues];

  function addCustom() {
    const next = draft.trim();
    if (!next || values.includes(next)) return;
    onChange([...values, next]);
    setDraft("");
  }

  return (
    <div>
      {title ? <p className="label">{title}</p> : null}
      <div className="space-y-3">
        {visibleOptions.map((option) => (
          <label key={option} className="flex items-center gap-3">
            <Checkbox
              checked={values.includes(option)}
              onCheckedChange={() => onChange(toggleValue(values, option))}
            />
            {option}
          </label>
        ))}
      </div>
      {allowCustom ? (
        <div className="mt-4 flex gap-2">
          <Input
            placeholder={customPlaceholder}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustom();
              }
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={addCustom}>
            Adicionar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
