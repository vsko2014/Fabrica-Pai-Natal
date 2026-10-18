import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { gifts, user } from "@/db/schema";
import { getSignedUrl } from "@/lib/storage";
import { AppShell } from "@/components/layout/AppShell";
import { GiftCard } from "@/components/gifts/GiftCard";
import { GiftIcon } from "@/components/ui/GiftIcon";
import { PageSkeleton } from "@/components/ui/PageSkeleton";

export const instant = false;

export default function OfertasPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="gifts" />}>
      <AuthenticatedOfertasPage />
    </Suspense>
  );
}

async function AuthenticatedOfertasPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login?returnTo=%2Fofertas");
  }

  const offerRows = await db
    .select({ gift: gifts, recipientName: user.name })
    .from(gifts)
    .leftJoin(user, eq(gifts.recipientUserId, user.id))
    .where(and(eq(gifts.userId, session.user.id), eq(gifts.listType, "offer")))
    .orderBy(desc(gifts.createdAt));

  const offers = await Promise.all(
    offerRows.map(async ({ gift, recipientName }) => ({
      id: gift.id,
      title: gift.title,
      description: gift.description,
      imageUrl: gift.imagePath
        ? await getSignedUrl(gift.imagePath)
        : "/gift-placeholder.svg",
      createdAt: gift.createdAt,
      ownerName: session.user.name,
      ownerId: gift.userId,
      recipientName,
      productUrl: gift.productUrl,
      priceCents: gift.priceCents,
      status: gift.status as "available" | "received" | "hidden",
    }))
  );

  return (
    <AppShell userName={session.user.name} userId={session.user.id}>
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-fpn-cream">
              Prendas para oferecer
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-fpn-snow/70">
              A tua lista privada de prendas que planeias oferecer. Só tu a podes ver.
            </p>
          </div>
          <Link
            href="/prendas/nova?kind=offer"
            className="holiday-neon inline-flex min-h-11 items-center gap-2 rounded-lg bg-fpn-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-fpn-red-dark"
          >
            <GiftIcon className="h-5 w-5" />
            Adicionar prenda
          </Link>
        </div>

        {offers.length === 0 ? (
          <div className="rounded-2xl border border-fpn-gold/15 bg-white/[0.03] px-5 py-12 text-center">
            <GiftIcon className="mx-auto h-10 w-10 text-fpn-gold/70" />
            <p className="mt-3 text-fpn-cream">Ainda não tens prendas para oferecer.</p>
            <p className="mt-1 text-sm text-fpn-snow/60">
              Adiciona uma ideia e escolhe a pessoa a quem a queres dar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((gift) => (
              <GiftCard key={gift.id} gift={gift} currentUserId={session.user.id} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
