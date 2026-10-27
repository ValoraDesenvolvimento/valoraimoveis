"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type PropertyGalleryProps = {
  images: string[];
  title: string;
};

import { isManagedUploadUrl } from "@/lib/storage";

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openAt = useCallback((index: number) => {
    setActiveIndex(index);
    setOpen(true);
  }, []);

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  }, [images.length]);

  const showNext = useCallback(() => {
    setActiveIndex((current) => (current === images.length - 1 ? 0 : current + 1));
  }, [images.length]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, showNext, showPrevious]);

  if (!images.length) {
    return (
      <section className="max-w-[1440px] mx-auto px-4 md:px-6 mb-12">
        <div className="h-[400px] md:h-[600px] rounded-3xl bg-surface" />
      </section>
    );
  }

  const sideImages = images.slice(1, 4);
  const overlayImage = images[4] ?? images[images.length - 1];

  return (
    <>
      <section className="max-w-[1440px] mx-auto px-4 md:px-6 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-3 h-[400px] md:h-[600px] relative rounded-3xl overflow-hidden bg-surface">
          <button
            type="button"
            onClick={() => openAt(0)}
            className="md:col-span-2 md:row-span-2 relative group cursor-pointer overflow-hidden text-left"
            aria-label="Abrir foto principal"
          >
            <Image
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              src={images[0]}
              alt={title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized={isManagedUploadUrl(images[0])}
            />
            {images.length > 1 && (
              <div className="md:hidden absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <span className="inline-flex items-center bg-white text-ink px-4 py-2 rounded-full text-sm font-bold shadow-xl">
                  Ver todas as fotos ({images.length})
                </span>
              </div>
            )}
          </button>

          {sideImages.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => openAt(index + 1)}
              className="hidden md:block relative group cursor-pointer overflow-hidden"
              aria-label={`Abrir foto ${index + 2}`}
            >
              <Image
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                src={src}
                alt=""
                fill
                sizes="25vw"
                loading="lazy"
                unoptimized={isManagedUploadUrl(src)}
              />
            </button>
          ))}

          <button
            type="button"
            onClick={() => openAt(Math.min(4, images.length - 1))}
            className="hidden md:block relative group cursor-pointer overflow-hidden"
            aria-label="Ver todas as fotos"
          >
            <Image
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
              src={overlayImage}
              alt=""
              fill
              sizes="25vw"
              unoptimized={isManagedUploadUrl(overlayImage)}
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-ink px-6 py-3 rounded-full text-sm font-bold shadow-xl group-hover:bg-brand group-hover:text-white transition-all">
                Ver todas as fotos ({images.length})
              </span>
            </div>
          </button>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(96vw,1200px)] w-full border-none bg-ink p-0 overflow-hidden rounded-3xl [&>button.absolute]:hidden">
          <DialogTitle className="sr-only">Galeria de fotos — {title}</DialogTitle>

          <div className="relative bg-black aspect-[4/3] md:aspect-[16/10]">
            <Image
              src={images[activeIndex]}
              alt={`${title} — foto ${activeIndex + 1}`}
              fill
              className="object-contain"
              sizes="96vw"
              unoptimized={isManagedUploadUrl(images[activeIndex])}
            />

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Fechar galeria"
            >
              <X className="h-5 w-5" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPrevious}
                  className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm font-bold text-white">
              {activeIndex + 1} / {images.length}
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto bg-ink p-4">
              {images.map((src, index) => (
                <button
                  key={`${src}-thumb-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                    index === activeIndex ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  aria-label={`Ver foto ${index + 1}`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized={isManagedUploadUrl(src)}
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
