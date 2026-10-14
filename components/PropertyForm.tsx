"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, CloudUpload } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { ManagedImage } from "@/components/ManagedImage";
import { PropertyAddressFields } from "@/components/PropertyAddressFields";
import { useLoading } from "@/components/LoadingProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { TEAM_IMOVEL_FORM, TEAM_IMOVIES } from "@/lib/routes";
import { uploadPropertyImages, type UploadProgressUpdate } from "@/lib/upload-files";
import type { Property, PropertyStatus } from "@/lib/types";

const ROOM_OPTIONS = ["Sala", "Cozinha", "Escritório", "Lavanderia", "Lavabo", "Dependência"];
const LEISURE_OPTIONS = ["Piscina", "Área gourmet", "Churrasqueira", "Jardim", "Terraço", "Sauna"];
const EXTRA_OPTIONS = ["Mobiliado", "Ar-condicionado", "Segurança", "Aquecimento"];
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
  neighborhood: string;
  city: string;
  state: string;
  bedrooms: string;
  suites: string;
  bathrooms: string;
  parking: string;
  area: string;
  landArea: string;
  condo: string;
  iptu: string;
  rooms: string[];
  leisure: string[];
  extras: string[];
  proximities: string[];
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
    neighborhood: "",
    city: "",
    state: "",
    bedrooms: "0",
    suites: "0",
    bathrooms: "0",
    parking: "0",
    area: "",
    landArea: "",
    condo: "",
    iptu: "",
    rooms: [],
    leisure: [],
    extras: [],
    proximities: [],
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
    price: String(property.price || ""),
    description: property.description.join("\n\n"),
    cep: property.cep,
    address: property.address,
    number: property.number,
    neighborhood: property.neighborhood,
    city: property.city,
    state: property.state,
    bedrooms: String(property.bedrooms),
    suites: String(property.suites),
    bathrooms: String(property.bathrooms),
    parking: String(property.parking),
    area: property.area ? String(property.area) : "",
    landArea: property.landArea ? String(property.landArea) : "",
    condo: property.condo,
    iptu: property.iptu,
    rooms: property.rooms,
    leisure: property.leisure,
    extras: property.extras,
    proximities: property.proximities,
    images: property.images.length ? property.images : property.image ? [property.image] : [],
    coverIndex: 0,
    featured: property.featured,
    highlight: property.highlight,
  };
}

function parsePrice(value: string) {
  const digits = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : 0;
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

  function buildPayload(status: PropertyStatus) {
    const images = [...form.images];
    if (images.length && form.coverIndex > 0 && form.coverIndex < images.length) {
      const [cover] = images.splice(form.coverIndex, 1);
      images.unshift(cover);
    }

    return {
      title: form.title,
      ref: form.ref,
      type: form.type,
      typeLabel: form.type,
      status,
      price: parsePrice(form.price),
      description: form.description
        .split(/\n\s*\n/)
        .map((part) => part.trim())
        .filter(Boolean),
      cep: form.cep,
      address: form.address,
      number: form.number,
      neighborhood: form.neighborhood,
      city: form.city,
      state: form.state,
      latitude: initialProperty?.latitude ?? "",
      longitude: initialProperty?.longitude ?? "",
      bedrooms: Number(form.bedrooms) || 0,
      suites: Number(form.suites) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      parking: Number(form.parking) || 0,
      builtArea: initialProperty?.builtArea ?? 0,
      area: Number(form.area) || 0,
      landArea: Number(form.landArea) || 0,
      condo: form.condo,
      iptu: form.iptu,
      rooms: form.rooms,
      leisure: form.leisure,
      extras: form.extras,
      proximities: form.proximities,
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

  function onPhotoDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setDraggingPhotos(true);
  }

  function onPhotoDragLeave(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setDraggingPhotos(false);
  }

  function onPhotoDrop(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setDraggingPhotos(false);
    if (uploadingPhotos || !storageReady) return;
    const files = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (!files.length) {
      setError("Solte apenas arquivos de imagem (JPG, PNG, WebP ou GIF).");
      return;
    }
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
  }

  return (
    <div className="p-6 md:p-10 max-w-[1500px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Button asChild variant="ghost" className="h-auto px-0 text-muted hover:bg-transparent">
            <Link href={TEAM_IMOVIES}>
              <ArrowLeft className="h-4 w-4" />
              Voltar para imóveis
            </Link>
          </Button>
          <p className="text-muted mt-2">Cadastre ou edite as informações exibidas no site.</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" disabled={pending} onClick={() => save("Rascunho")}>
            {pending ? <Spinner size="sm" className="border-brand" /> : null}
            Salvar rascunho
          </Button>
          <Button type="button" disabled={pending} onClick={() => save("Publicado")}>
            {pending ? <Spinner size="sm" className="border-white border-t-transparent" /> : null}
            Publicar imóvel
          </Button>
        </div>
      </div>

      {(message || error) && (
        <Alert
          variant={error ? "destructive" : "default"}
          className={`mb-6 rounded-2xl ${!error ? "border-green-200 bg-green-50 text-green-700" : ""}`}
        >
          <AlertDescription>{error || message}</AlertDescription>
        </Alert>
      )}

      <div className="grid xl:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">
          <Card className="p-0">
            <CardHeader className="p-7 pb-0">
              <CardTitle className="h-display text-2xl font-normal">Informações básicas</CardTitle>
            </CardHeader>
            <CardContent className="p-7">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Label>Título</Label>
                  <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
                </div>
                <div>
                  <Label>Referência</Label>
                  <Input value={form.ref} onChange={(e) => update("ref", e.target.value)} />
                </div>
                <div>
                  <Label>Tipo do imóvel</Label>
                  <Select value={form.type} onValueChange={(value) => update("type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Casa", "Sobrado", "Apartamento", "Studio", "Cobertura", "Terreno"].map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <div>
                  <Label>Preço</Label>
                  <Input
                    placeholder="1850000"
                    value={form.price}
                    onChange={(e) => update("price", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-6 md:col-span-2">
                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={form.featured}
                      onCheckedChange={(checked) => update("featured", checked === true)}
                    />
                    Destaque na listagem
                  </label>
                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={form.highlight}
                      onCheckedChange={(checked) => update("highlight", checked === true)}
                    />
                    Destaque na home
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader className="p-7 pb-0">
              <CardTitle className="h-display text-2xl font-normal">Localização</CardTitle>
            </CardHeader>
            <CardContent className="p-7">
              <PropertyAddressFields
                values={{
                  cep: form.cep,
                  address: form.address,
                  number: form.number,
                  neighborhood: form.neighborhood,
                  city: form.city,
                  state: form.state,
                }}
                onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
                onCepMessage={setMessage}
              />
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader className="p-7 pb-0">
              <CardTitle className="h-display text-2xl font-normal">Características</CardTitle>
            </CardHeader>
            <CardContent className="p-7">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {(
                  [
                    ["bedrooms", "Quartos"],
                    ["suites", "Suítes"],
                    ["bathrooms", "Banheiros"],
                    ["parking", "Vagas"],
                    ["area", "Área total"],
                    ["landArea", "Área terreno"],
                    ["condo", "Condomínio"],
                    ["iptu", "IPTU"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input value={form[key]} onChange={(e) => update(key, e.target.value)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader className="p-7 pb-0">
              <CardTitle className="h-display text-2xl font-normal">
                Cômodos, áreas e proximidades
              </CardTitle>
            </CardHeader>
            <CardContent className="p-7">
              <div className="grid md:grid-cols-3 gap-8 text-sm">
                <CheckboxGroup
                  title="Cômodos"
                  options={ROOM_OPTIONS}
                  values={form.rooms}
                  onChange={(values) => update("rooms", values)}
                />
                <CheckboxGroup
                  title="Outras informações"
                  options={[...LEISURE_OPTIONS, ...EXTRA_OPTIONS]}
                  values={[...form.leisure, ...form.extras]}
                  onChange={(values) => {
                    update(
                      "leisure",
                      values.filter((item) => LEISURE_OPTIONS.includes(item)),
                    );
                    update(
                      "extras",
                      values.filter((item) => EXTRA_OPTIONS.includes(item)),
                    );
                  }}
                />
                <CheckboxGroup
                  title="Proximidades"
                  options={PROXIMITY_OPTIONS}
                  values={form.proximities}
                  onChange={(values) => update("proximities", values)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="p-0">
            <CardHeader className="p-7 pb-0 flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="h-display text-2xl font-normal">Fotos</CardTitle>
                <p className="text-sm text-muted mt-1">
                  Selecione ou arraste várias fotos de uma vez. Escolha qual será a capa.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending || uploadingPhotos || !storageReady}
                onClick={() => fileRef.current?.click()}
              >
                Selecionar fotos
              </Button>
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
              <div
                className={`grid md:grid-cols-3 gap-4 rounded-2xl transition-colors ${
                  draggingPhotos && !uploadingPhotos
                    ? "outline-2 outline-dashed outline-brand bg-brand/5 p-3 -m-3"
                    : ""
                }`}
              >
                {form.images.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className={`relative h-40 rounded-2xl overflow-hidden border-2 ${
                      index === form.coverIndex ? "border-brand" : "border-line"
                    }`}
                  >
                    <ManagedImage
                      className="object-cover"
                      src={src}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    {index === form.coverIndex && (
                      <span className="absolute left-3 top-3 bg-brand text-white text-[10px] px-3 py-1 rounded-full font-bold">
                        CAPA
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-ink/70 p-2 flex gap-2 justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto py-1 text-white hover:bg-white/10 hover:text-white"
                        onClick={() => update("coverIndex", index)}
                      >
                        Capa
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto py-1 text-red-300 hover:bg-white/10 hover:text-red-200"
                        onClick={() => removeImage(index)}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={pending || uploadingPhotos || !storageReady}
                  className="h-40 rounded-2xl border-2 border-dashed border-line flex flex-col items-center justify-center gap-2 px-4 text-center text-muted hover:border-brand hover:text-brand transition-colors disabled:opacity-50"
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

        <aside>
          <Card className="sticky top-32 p-0">
            <CardContent className="p-6">
              <p className="label">Publicação</p>
              <h3 className="font-bold text-lg mb-5">Resumo do imóvel</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Status</span>
                  <span
                    className={`font-bold ${
                      form.status === "Publicado" ? "text-green-700" : "text-amber-700"
                    }`}
                  >
                    {form.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Referência</span>
                  <span>{form.ref || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Fotos</span>
                  <span>{form.images.length}</span>
                </div>
              </div>
              <Separator className="my-6" />
              <div className="space-y-3">
                <Button
                  type="button"
                  className="w-full"
                  disabled={pending}
                  onClick={() => save("Publicado")}
                >
                  Publicar imóvel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={pending}
                  onClick={() => save("Rascunho")}
                >
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
    </div>
  );
}

function CheckboxGroup({
  title,
  options,
  values,
  onChange,
}: {
  title: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div>
      <p className="label">{title}</p>
      <div className="space-y-3">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-3">
            <Checkbox
              checked={values.includes(option)}
              onCheckedChange={() => onChange(toggleValue(values, option))}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}
