import Image from "next/image";
import Link from "next/link";
import { GiftIcon } from "@/components/ui/GiftIcon";

type Gift = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: Date;
  ownerName: string;
  ownerId: string;
  recipientName?: string | null;
  productUrl: string | null;
  priceCents: number | null;
  status: "available" | "received" | "hidden";
};

type Props = {
  gift: Gift;
  currentUserId: string;
  tourTarget?: boolean;
};

const statusLabels = {
  available: "Disponível",
  received: "Já Recebi",
  hidden: "Invisível",
} as const;

const statusStyles = {
  available: {
    tag: "border-emerald-200/15 bg-emerald-950/40 text-emerald-100/80",
    border:
      "repeating-linear-gradient(135deg, #315c43 0 9px, #f3efe5 9px 15px, #a94444 15px 24px, #315c43 24px 33px)",
  },
  received: {
    tag: "border-slate-300/15 bg-slate-800/45 text-slate-200/80",
    border: "#7b8187",
  },
  hidden: {
    tag: "border-white/10 bg-white/10 text-fpn-snow/70",
    border: "#737981",
  },
} as const;

export function GiftCard({ gift, currentUserId, tourTarget }: Props) {
  const isOwner = gift.ownerId === currentUserId;
  const formattedDate = new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(gift.createdAt);
  const formattedPrice =
    gift.priceCents === null
      ? null
      : new Intl.NumberFormat("pt-PT", {
          style: "currency",
          currency: "EUR",
        }).format(gift.priceCents / 100);
  const initial = gift.ownerName.charAt(0).toUpperCase();

  return (
    <article
      data-tour-target={tourTarget ? "gift-card" : undefined}
      className={`relative h-full rounded-2xl p-[2px] transition-transform hover:-translate-y-1 ${gift.status === "hidden" ? "grayscale opacity-70" : ""}`}
      style={{ background: statusStyles[gift.status].border }}
    >
      {isOwner && (
        <Link
          href={`/prendas/${gift.id}/editar`}
          aria-label={`Editar prenda: ${gift.title}`}
          className="absolute inset-[2px] z-10 rounded-[calc(1rem-2px)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-fpn-gold"
        >
          <span className="sr-only">Editar prenda</span>
        </Link>
      )}
      <div className="relative flex h-full min-h-[25rem] flex-col overflow-hidden rounded-[calc(1rem-2px)] bg-fpn-green/95">
        <div className="relative h-48 w-full shrink-0 bg-white/5">
          <Image
            src={gift.imageUrl}
            alt={gift.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
        <div className="pointer-events-none flex flex-1 flex-col items-center p-4 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <GiftIcon className="h-5 w-5 shrink-0 text-fpn-gold" />
            <h3 className="line-clamp-2 text-base font-semibold leading-6 text-fpn-cream">
              {gift.title}
            </h3>
          </div>
          <p className="mb-4 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-fpn-snow/75">
            {gift.description}
          </p>
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[gift.status].tag}`}
            >
              {statusLabels[gift.status]}
            </span>
            {formattedPrice && (
              <span className="text-sm font-semibold text-fpn-gold/90">
                {formattedPrice}
              </span>
            )}
          </div>
          {gift.recipientName && (
            <p className="mb-3 text-xs text-fpn-snow/60">
              Para: <span className="text-fpn-cream/80">{gift.recipientName}</span>
            </p>
          )}
          {gift.productUrl && (
            <Link
              href={gift.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="pointer-events-auto relative z-30 mb-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-fpn-snow/80 transition-colors hover:bg-white/10 hover:text-fpn-cream"
            >
              Ver página
              <span aria-hidden="true">↗</span>
            </Link>
          )}
          <div className="relative z-20 mt-auto flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-white/10 pt-3 text-xs text-fpn-snow/65 sm:text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fpn-red/80 text-xs font-bold text-white"
                aria-hidden="true"
              >
                {initial}
              </span>
              <span className="max-w-full truncate">{gift.ownerName}</span>
            </span>
            <span aria-hidden="true" className="hidden text-fpn-snow/30 sm:inline">·</span>
            <time dateTime={gift.createdAt.toISOString()}>{formattedDate}</time>
          </div>
        </div>
      </div>
    </article>
  );
}
