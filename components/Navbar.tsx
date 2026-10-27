"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Heart, Menu, Trash2, X } from "lucide-react";
import { useFavorites } from "@/components/FavoritesProvider";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Início" },
  { href: "/imoveis", label: "Imóveis" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function Navbar() {
  const pathname = usePathname();
  const { favorites, count, removeFavorite, clearFavorites, ready } = useFavorites();
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setFavoritesOpen(false);
      }
    }
    if (!favoritesOpen) return;
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [favoritesOpen]);

  useEffect(() => {
    setFavoritesOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <>
      <nav className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 w-[min(95%,72rem)] z-50 bg-surface/80 backdrop-blur-md border border-line rounded-full px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-sm gap-2">
        <div className="flex items-center gap-3 sm:gap-8 min-w-0">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/Logovalora.png"
              alt="Valora Imóveis"
              width={160}
              height={36}
              className="h-7 sm:h-9 w-auto object-contain"
              priority
            />
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-ink">
            {links.map((link) => {
              const active =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? "relative nav-link border-b border-brand pb-1"
                      : "relative nav-link opacity-60 hover:opacity-100 transition-opacity"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <div className="relative" ref={panelRef}>
            <button
              type="button"
              className="p-2 hover:text-brand transition-colors relative"
              aria-label="Favoritos"
              aria-expanded={favoritesOpen}
              onClick={() => {
                setFavoritesOpen((current) => !current);
                setMenuOpen(false);
              }}
            >
              <Heart className={`h-5 w-5 ${count > 0 ? "fill-orange text-orange" : ""}`} />
              <span className="absolute -top-1 -right-1 bg-orange text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {ready ? Math.min(count, 99) : 0}
              </span>
            </button>

            {favoritesOpen && (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] w-[min(22rem,calc(100vw-1.5rem))] rounded-3xl border border-line bg-white shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-line">
                  <div>
                    <p className="font-bold text-ink">Favoritos</p>
                    <p className="text-xs text-muted">
                      {count === 0
                        ? "Nenhum imóvel salvo"
                        : `${count} ${count === 1 ? "imóvel salvo" : "imóveis salvos"}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full border border-line flex items-center justify-center text-muted hover:text-ink"
                    aria-label="Fechar"
                    onClick={() => setFavoritesOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {favorites.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <Heart className="h-8 w-8 mx-auto text-muted mb-3" />
                      <p className="text-sm text-muted">
                        Clique no coração nos imóveis para salvá-los aqui.
                      </p>
                      <Button asChild variant="outline" size="sm" className="mt-4">
                        <Link href="/imoveis" onClick={() => setFavoritesOpen(false)}>
                          Ver imóveis
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <ul className="divide-y divide-line">
                      {favorites.map((item) => (
                        <li
                          key={item.slug}
                          className="flex gap-3 p-4 hover:bg-surface/80 transition-colors"
                        >
                          <Link
                            href={`/imoveis/${item.slug}`}
                            className="flex gap-3 flex-1 min-w-0"
                            onClick={() => setFavoritesOpen(false)}
                          >
                            <Image
                              src={item.image}
                              alt=""
                              width={64}
                              height={56}
                              className="w-16 h-14 rounded-xl object-cover bg-surface shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-ink truncate">{item.title}</p>
                              <p className="text-xs text-muted truncate">{item.location}</p>
                              <p className="text-sm font-medium text-brand mt-1">{item.priceLabel}</p>
                            </div>
                          </Link>
                          <button
                            type="button"
                            className="self-start w-8 h-8 rounded-full border border-line flex items-center justify-center text-muted hover:text-red-600 hover:border-red-200"
                            aria-label={`Remover ${item.title}`}
                            onClick={() => removeFavorite(item.slug)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {favorites.length > 0 && (
                  <div className="flex gap-2 px-4 py-3 border-t border-line bg-surface/50">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href="/imoveis" onClick={() => setFavoritesOpen(false)}>
                        Ver catálogo
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={clearFavorites}
                    >
                      Limpar
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-full hover:bg-surface text-ink"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuOpen((current) => !current);
              setFavoritesOpen(false);
            }}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute top-20 left-1/2 w-[min(95%,24rem)] -translate-x-1/2 rounded-3xl border border-line bg-white p-5 shadow-2xl">
            <p className="text-xs uppercase tracking-widest text-muted font-bold mb-4">Menu</p>
            <div className="flex flex-col gap-1">
              {links.map((link) => {
                const active =
                  link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
                      active
                        ? "bg-brand text-white"
                        : "text-ink hover:bg-surface"
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
