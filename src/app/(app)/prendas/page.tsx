import { Suspense } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { gifts, user } from "@/db/schema";
import { and, asc, desc, eq, gte, lte, ne, or, sql } from "drizzle-orm";
import { getSignedUrl } from "@/lib/storage";
import { GiftsList } from "@/components/gifts/GiftsList";
import { AppShell } from "@/components/layout/AppShell";
import { giftPriceSchema, giftStatusSchema } from "@/lib/validation";
import { PageSkeleton } from "@/components/ui/PageSkeleton";

export const instant = false;

type SearchParams = Promise<{
  owner?: string | string[];
  status?: string | string[];
  minPrice?: string | string[];
  maxPrice?: string | string[];
  sort?: string | string[];
}>;

function getParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default function PrendasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={<PageSkeleton variant="gifts" />}
    >
      <AuthenticatedPrendasPage searchParams={searchParams} />
    </Suspense>
  );
}

async function AuthenticatedPrendasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login?returnTo=%2Fprendas");
  }

  const [params, users] = await Promise.all([
    searchParams,
    db
      .select({ id: user.id, name: user.name })
      .from(user)
      .orderBy(asc(user.name)),
  ]);

  const requestedOwner = getParam(params.owner);
  const validPerson = users.some((person) => person.id === requestedOwner);
  const activeFilter =
    requestedOwner === "mine"
      ? "mine"
      : validPerson
        ? requestedOwner
        : "all";
  const ownerId =
    activeFilter === "mine"
      ? session.user.id
      : activeFilter === "all"
        ? undefined
        : activeFilter;

  const rawStatus = getParam(params.status) || "all";
  const parsedStatus =
    rawStatus === "all" ? "all" : giftStatusSchema.safeParse(rawStatus);
  const activeStatus =
    parsedStatus === "all" || parsedStatus.success
      ? parsedStatus === "all"
        ? "all"
        : parsedStatus.data
      : "all";

  const rawMinimum = getParam(params.minPrice);
  const rawMaximum = getParam(params.maxPrice);
  const minimumResult = rawMinimum
    ? giftPriceSchema.safeParse(rawMinimum)
    : undefined;
  const maximumResult = rawMaximum
    ? giftPriceSchema.safeParse(rawMaximum)
    : undefined;
  const minimumPrice =
    minimumResult?.success && minimumResult.data !== null
      ? minimumResult.data
      : undefined;
  const maximumPrice =
    maximumResult?.success && maximumResult.data !== null
      ? maximumResult.data
      : undefined;
  const minimumText = rawMinimum;
  const maximumText = rawMaximum;
  const activeSort = ["price-asc", "price-desc"].includes(getParam(params.sort))
    ? getParam(params.sort)
    : "newest";
  let filterError: string | undefined;
  if (rawMinimum && !minimumResult?.success) {
    filterError = "O preço mínimo introduzido não é válido.";
  } else if (rawMaximum && !maximumResult?.success) {
    filterError = "O preço máximo introduzido não é válido.";
  } else if (
    minimumPrice !== undefined &&
    maximumPrice !== undefined &&
    minimumPrice > maximumPrice
  ) {
    filterError = "O preço mínimo não pode ser superior ao preço máximo.";
  }

  const filters = [];
  filters.push(eq(gifts.listType, "wish"));
  if (ownerId) filters.push(eq(gifts.userId, ownerId));
  if (activeStatus === "hidden") {
    filters.push(eq(gifts.status, "hidden"), eq(gifts.userId, session.user.id));
  } else if (activeStatus !== "all") {
    filters.push(eq(gifts.status, activeStatus));
  } else {
    filters.push(
      or(ne(gifts.status, "hidden"), eq(gifts.userId, session.user.id))!
    );
  }
  if (minimumPrice !== undefined) {
    filters.push(gte(gifts.priceCents, minimumPrice));
  }
  if (maximumPrice !== undefined) {
    filters.push(lte(gifts.priceCents, maximumPrice));
  }
  if (filterError) {
    filters.push(sql`false`);
  }

  const priceOrder =
    activeSort === "price-asc"
      ? [
          asc(sql`CASE WHEN ${gifts.priceCents} IS NULL THEN 1 ELSE 0 END`),
          asc(gifts.priceCents),
        ]
      : [
          asc(sql`CASE WHEN ${gifts.priceCents} IS NULL THEN 1 ELSE 0 END`),
          desc(gifts.priceCents),
        ];
  const giftRows = await db
    .select()
    .from(gifts)
    .leftJoin(user, eq(gifts.userId, user.id))
    .where(and(...filters))
    .orderBy(
      sql`CASE WHEN ${gifts.status} = 'hidden' THEN 1 ELSE 0 END`,
      ...(activeSort === "newest" ? [desc(gifts.createdAt)] : priceOrder)
    );

  const giftsWithImages = await Promise.all(
    giftRows.map(async ({ gifts: gift, user: owner }) => {
      const imageUrl = gift.imagePath
        ? await getSignedUrl(gift.imagePath)
        : "/gift-placeholder.svg";
      return {
        id: gift.id,
        title: gift.title,
        description: gift.description,
        imageUrl,
        createdAt: gift.createdAt,
        ownerName: owner?.name ?? "Desconhecido",
        ownerId: gift.userId,
        productUrl: gift.productUrl,
        priceCents: gift.priceCents,
        status: gift.status as "available" | "received" | "hidden",
      };
    })
  );

  return (
    <AppShell userName={session.user.name} userId={session.user.id}>
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-fpn-cream">Lista de prendas</h2>
          <p className="mt-1 text-sm text-fpn-snow/70">
            Sugestões de prendas para o grupo.
          </p>
        </div>
        <GiftsList
          gifts={giftsWithImages}
          users={users}
          currentUserId={session.user.id}
          activeFilter={activeFilter}
          activeStatus={activeStatus}
          minimumPrice={minimumText}
          maximumPrice={maximumText}
          sort={activeSort}
          filterError={filterError}
        />
      </section>
    </AppShell>
  );
}
