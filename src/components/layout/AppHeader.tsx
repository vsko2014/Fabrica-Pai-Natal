"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { GiftIcon } from "@/components/ui/GiftIcon";
import { AppHelpTutorial } from "./AppHelpTutorial";
import { AlertModal } from "@/components/ui/AlertModal";

type Props = {
  userName: string;
  userId: string;
};

export function AppHeader({ userName }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleLogout() {
    setError("");
    try {
      const { error: signOutError } = await authClient.signOut();
      if (signOutError) {
        setError("Não foi possível terminar a sessão. Tente novamente.");
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Não foi possível terminar a sessão. Tente novamente.");
    }
  }

  return (
    <header
      data-tutorial-background
      className="sticky top-0 z-50 border-b border-fpn-gold/20 bg-fpn-green/80 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link
          href="/prendas"
          aria-label="FPN — voltar à lista de prendas"
          onClick={(event) => {
            if (
              window.location.pathname === "/prendas" &&
              window.location.search === ""
            ) {
              event.preventDefault();
              router.refresh();
            }
          }}
          className="flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-fpn-gold"
        >
          <GiftIcon className="h-8 w-8 text-fpn-gold" />
          <div>
            <h1 className="text-lg font-bold leading-tight text-fpn-cream">FPN</h1>
            <p className="hidden text-xs text-fpn-snow/60 sm:block">
              Fábrica do Pai Natal
            </p>
          </div>
        </Link>

        <nav aria-label="Listas de prendas" className="order-3 flex w-full items-center justify-center gap-2 sm:order-none sm:w-auto">
          <Link
            href="/prendas"
            className="rounded-lg px-3 py-2 text-sm text-fpn-cream/80 transition-colors hover:bg-white/5 hover:text-fpn-cream"
          >
            Quero receber
          </Link>
          <Link
            href="/ofertas"
            className="rounded-lg px-3 py-2 text-sm text-fpn-cream/80 transition-colors hover:bg-white/5 hover:text-fpn-cream"
          >
            Quero oferecer
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <AppHelpTutorial />
          {error && (
            <AlertModal
              message={error}
              kind="error"
              onClose={() => setError("")}
            />
          )}
          <span className="max-w-[120px] truncate text-sm text-fpn-snow/80 sm:max-w-none">
            {userName}
          </span>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-fpn-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-fpn-red-dark"
          >
            Terminar sessão
          </button>
        </div>
      </div>
    </header>
  );
}
