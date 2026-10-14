"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TEAM_IMOVIES, TEAM_LOGIN, TEAM_USUARIOS } from "@/lib/routes";

const navItems = [
  { href: TEAM_IMOVIES, label: "Imóveis", icon: "fa-solid fa-building" },
  { href: TEAM_USUARIOS, label: "Usuários", icon: "fa-solid fa-users" },
];

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("Administrador");
  const [userEmail, setUserEmail] = useState("admin@valoraimoveis.com");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
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

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.user?.name) setUserName(data.user.name);
        if (data?.user?.email) setUserEmail(data.user.email);
      })
      .catch(() => undefined);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace(TEAM_LOGIN);
    router.refresh();
  }

  const sidebar = (
    <>
      <div className="h-24 px-6 lg:px-8 flex items-center justify-between border-b border-line">
        <Link href="/" className="flex items-center" onClick={() => setMenuOpen(false)}>
          <Image
            src="/Logovalora.png"
            alt="Valora Imóveis"
            width={160}
            height={36}
            className="h-9 w-auto object-contain"
          />
        </Link>
        <button
          type="button"
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-surface"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-5">
        <p className="text-[10px] uppercase tracking-[.18em] text-muted font-bold px-4 mb-3">
          Gestão
        </p>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`admin-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active ? "active" : ""
                }`}
              >
                <i className={`${item.icon} w-4`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto p-5 border-t border-line space-y-1">
        <Button asChild variant="ghost" className="w-full justify-start text-muted font-medium">
          <Link href="/" onClick={() => setMenuOpen(false)}>
            <ArrowUpRight className="h-4 w-4" />
            Ver site público
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start text-muted font-medium"
          onClick={() => void handleLogout()}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex w-72 bg-white border-r border-line flex-col fixed inset-y-0 left-0 z-40">
        {sidebar}
      </aside>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-white border-r border-line shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <main className="flex-1 lg:ml-72 bg-background min-h-screen">
        <header className="h-24 bg-page/90 backdrop-blur border-b border-line sticky top-0 z-30">
          <div className="h-full px-4 md:px-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="lg:hidden inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink"
                aria-label="Abrir menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[.16em] text-muted font-bold">
                  Área da equipe
                </p>
                <h1 className="h-display text-2xl truncate">{title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-bold">{userName}</p>
                <p className="text-xs text-muted">{userEmail}</p>
              </div>
              <span className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
