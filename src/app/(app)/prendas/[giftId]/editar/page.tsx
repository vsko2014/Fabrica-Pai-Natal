import { Suspense } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { gifts, user } from "@/db/schema";
import { getSignedUrl } from "@/lib/storage";
import { AppShell } from "@/components/layout/AppShell";
import { GiftEditForm } from "@/components/gifts/GiftEditForm";
import { PageSkeleton } from "@/components/ui/PageSkeleton";

export const instant = false;

type Props = {
  params: Promise<{ giftId: string }>;
};

export default function EditGiftPage({ params }: Props) {
  return (
    <Suspense
      fallback={<PageSkeleton variant="form" />}
    >
      <AuthenticatedEditGiftPage params={params} />
    </Suspense>
  );
}

async function AuthenticatedEditGiftPage({ params }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login?returnTo=%2Fprendas");
  }

  const { giftId } = await params;
  const [[gift], users] = await Promise.all([
    db
      .select()
      .from(gifts)
      .where(and(eq(gifts.id, giftId), eq(gifts.userId, session.user.id)))
      .limit(1),
    db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(ne(user.id, session.user.id))
      .orderBy(asc(user.name)),
  ]);

  if (!gift) notFound();
  const imageUrl = gift.imagePath
    ? await getSignedUrl(gift.imagePath)
    : "/gift-placeholder.svg";

  return (
    <AppShell userName={session.user.name} userId={session.user.id}>
      <section className="mx-auto max-w-lg">
        <h2 className="mb-6 text-2xl font-bold text-fpn-cream">Editar prenda</h2>
        <GiftEditForm
          key={gift.id}
          gift={{
            id: gift.id,
            title: gift.title,
            description: gift.description,
            productUrl: gift.productUrl,
            priceCents: gift.priceCents,
            status: gift.status as "available" | "received" | "hidden",
            imageUrl,
            listType: gift.listType,
            recipientUserId: gift.recipientUserId,
          }}
          users={users}
        />
      </section>
    </AppShell>
  );
}
