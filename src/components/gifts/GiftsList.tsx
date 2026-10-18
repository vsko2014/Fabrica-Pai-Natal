"use client";

import { useState } from "react";
import Link from "next/link";
import { GiftCard } from "./GiftCard";
import { GiftIcon } from "@/components/ui/GiftIcon";
import { AlertModal } from "@/components/ui/AlertModal";

type Gift = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: Date;
  ownerName: string;
  ownerId: string;
  productUrl: string | null;
  priceCents: number | null;
  status: "available" | "received" | "hidden";
};

type User = {
  id: string;
  name: string;
};

type Props = {
  gifts: Gift[];
  users: User[];
  currentUserId: string;
  activeFilter: string;
  activeStatus: string;
  minimumPrice: string;
  maximumPrice: string;
  sort: string;
  filterError?: string;
};

function GiftSection({
  title,
  gifts,
  currentUserId,
  tourCardTarget,
}: {
  title: string;
  gifts: Gift[];
  currentUserId: string;
  tourCardTarget: boolean;
}) {
  return (
    <section className="space-y-4">
      <h3
        data-tour-target="gift-sections"
        className="border-b border-fpn-gold/15 pb-2 text-xl font-semibold text-fpn-cream"
      >
        {title}
      </h3>
      {gifts.length === 0 ? (
        <p className="py-5 text-sm text-fpn-snow/50">
          Nenhuma prenda nesta secção para os filtros selecionados.
        </p>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gifts.map((gift, index) => (
            <GiftCard
              key={gift.id}
              gift={gift}
              currentUserId={currentUserId}
              tourTarget={tourCardTarget && index === 0}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function GiftsList({
  gifts,
  users,
  currentUserId,
  activeFilter,
  activeStatus,
  minimumPrice,
  maximumPrice,
  sort,
  filterError,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(
    activeStatus !== "all" ||
      Boolean(minimumPrice) ||
      Boolean(maximumPrice) ||
      sort !== "newest"
  );
  const [dismissedFilterError, setDismissedFilterError] = useState("");
  const filtersApplied =
    activeFilter !== "all" ||
    activeStatus !== "all" ||
    Boolean(minimumPrice) ||
    Boolean(maximumPrice) ||
    sort !== "newest";
  const ownGifts = gifts.filter((gift) => gift.ownerId === currentUserId);
  const othersGifts = gifts.filter((gift) => gift.ownerId !== currentUserId);

  return (
    <div className="space-y-6">
      {filterError && filterError !== dismissedFilterError && (
        <AlertModal
          message={filterError}
          kind="error"
          onClose={() => setDismissedFilterError(filterError)}
        />
      )}
      <form method="get" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor="gift-owner-filter"
              className="mb-1 block text-sm text-fpn-cream"
            >
              Mostrar prendas
            </label>
            <select
              id="gift-owner-filter"
              name="owner"
              defaultValue={activeFilter}
              data-tour-target="person-filter"
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
              className="min-h-11 rounded-lg border border-fpn-gold/30 bg-fpn-green px-3 py-2 text-sm text-white focus:border-fpn-gold focus:outline-none"
            >
              <option value="all" className="bg-fpn-green">
                Todas as pessoas
              </option>
              <option value="mine" className="bg-fpn-green">
                Só as minhas prendas
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id} className="bg-fpn-green">
                  {user.name}
                </option>
              ))}
            </select>
          </div>

            {!filtersOpen && (
              <>
                <input type="hidden" name="status" value={activeStatus} />
                <input type="hidden" name="minPrice" value={minimumPrice} />
                <input type="hidden" name="maxPrice" value={maximumPrice} />
                <input type="hidden" name="sort" value={sort} />
              </>
            )}

            <button
              type="button"
              data-tour-target="gift-filters"
              aria-expanded={filtersOpen}
              aria-controls="gift-extra-filters"
              onClick={() => setFiltersOpen((open) => !open)}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-fpn-gold/25 px-4 py-2 text-sm text-fpn-cream/90 transition-colors hover:bg-white/5"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-5 w-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M7 12h10m-7 5h4" />
                <circle cx="8" cy="7" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="12" cy="17" r="1.5" fill="currentColor" stroke="none" />
              </svg>
              Filtros
            </button>
            {filtersApplied && (
              <Link
                href="/prendas"
                className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm text-fpn-snow/60 underline-offset-4 hover:text-fpn-cream hover:underline"
              >
                Remover filtros
              </Link>
            )}
          </div>

          <Link
            href="/prendas/nova"
            data-tour-target="add-gift"
            className="holiday-neon inline-flex min-h-11 items-center rounded-lg bg-fpn-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-fpn-red-dark"
          >
            <GiftIcon className="h-5 w-5" />
            Adicionar prenda
          </Link>
        </div>
        {filtersOpen && (
          <div
            id="gift-extra-filters"
            className="flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div>
              <label htmlFor="gift-status-filter" className="mb-1 block text-sm text-fpn-cream/80">
                Estado
              </label>
              <select
                id="gift-status-filter"
                name="status"
                defaultValue={activeStatus}
                className="min-h-11 rounded-lg border border-white/15 bg-fpn-green px-3 py-2 text-sm text-white focus:border-fpn-gold focus:outline-none"
              >
                <option value="all">Todos</option>
                <option value="available">Disponível</option>
                <option value="received">Já Recebi</option>
                <option value="hidden">Invisível (minhas)</option>
              </select>
            </div>

            <div>
              <label htmlFor="gift-min-price" className="mb-1 block text-sm text-fpn-cream/80">
                Preço mín. (€)
              </label>
              <input
                id="gift-min-price"
                name="minPrice"
                type="number"
                min="0"
                max="9999999.99"
                step="0.01"
                defaultValue={minimumPrice}
                className="min-h-11 w-32 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-fpn-gold focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="gift-max-price" className="mb-1 block text-sm text-fpn-cream/80">
                Preço máx. (€)
              </label>
              <input
                id="gift-max-price"
                name="maxPrice"
                type="number"
                min="0"
                max="9999999.99"
                step="0.01"
                defaultValue={maximumPrice}
                className="min-h-11 w-32 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-fpn-gold focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="gift-price-sort" className="mb-1 block text-sm text-fpn-cream/80">
                Ordenar preço
              </label>
              <select
                id="gift-price-sort"
                name="sort"
                defaultValue={sort}
                className="min-h-11 rounded-lg border border-white/15 bg-fpn-green px-3 py-2 text-sm text-white focus:border-fpn-gold focus:outline-none"
              >
                <option value="newest">Mais recentes</option>
                <option value="price-asc">Mais barato primeiro</option>
                <option value="price-desc">Mais caro primeiro</option>
              </select>
            </div>

            <button
              type="submit"
              className="min-h-11 rounded-lg bg-fpn-gold/15 px-4 py-2 text-sm text-fpn-cream transition-colors hover:bg-fpn-gold/25"
            >
              Aplicar filtros
            </button>
          </div>
        )}
      </form>
      <div className="space-y-8">
        <GiftSection
          title="Prendas de Outros"
          gifts={othersGifts}
          currentUserId={currentUserId}
          tourCardTarget={ownGifts.length === 0}
        />
        <GiftSection
          title="Minhas Prendas"
          gifts={ownGifts}
          currentUserId={currentUserId}
          tourCardTarget
        />
      </div>
    </div>
  );
}
