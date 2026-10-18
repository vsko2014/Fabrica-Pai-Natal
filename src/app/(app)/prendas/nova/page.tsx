import { Suspense } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NewGiftForm } from "@/components/gifts/NewGiftForm";
import { GiftIcon } from "@/components/ui/GiftIcon";
import { AppShell } from "@/components/layout/AppShell";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { asc, ne } from "drizzle-orm";

export const instant = false;

type Props = {
  searchParams: Promise<{ kind?: string | string[] }>;
};

export default function NovaPrendaPage({ searchParams }: Props) {
  return (
    <Suspense
      fallback={<PageSkeleton variant="form" />}
    >
      <AuthenticatedNovaPrendaPage searchParams={searchParams} />
    </Suspense>
  );
}

async function AuthenticatedNovaPrendaPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(
      params.kind === "offer"
        ? "/login?returnTo=%2Fprendas%2Fnova%3Fkind%3Doffer"
        : "/login?returnTo=%2Fprendas%2Fnova"
    );
  }

  const users = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(ne(user.id, session.user.id))
    .orderBy(asc(user.name));
  const initialListType =
    params.kind === "offer" ? "offer" : "wish";

  return (
    <AppShell userName={session.user.name} userId={session.user.id}>
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <GiftIcon className="h-8 w-8 shrink-0 text-fpn-gold" />
          <h2 className="text-2xl font-bold text-fpn-cream">Adicionar prenda</h2>
        </div>
        <NewGiftForm
          key={`${session.user.id}-${initialListType}`}
          users={users}
          initialListType={initialListType}
        />
      </div>
    </AppShell>
  );
}
