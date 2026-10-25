"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateGiftAction,
  type GiftMutationState,
} from "@/app/actions/gift-actions";
import { GiftStatusHelp } from "./GiftStatusHelp";
import { AlertModal } from "@/components/ui/AlertModal";
import { ProductImageFinder } from "./ProductImageFinder";
import {
  MAX_GIFT_IMAGE_SIZE,
  MAX_GIFT_IMAGE_SIZE_LABEL,
} from "@/lib/gift-constants";

type Gift = {
  id: string;
  title: string;
  description: string;
  productUrl: string | null;
  priceCents: number | null;
  status: "available" | "received" | "hidden";
  imageUrl: string;
  listType: "wish" | "offer";
  recipientUserId: string | null;
};

type Props = {
  gift: Gift;
  users: { id: string; name: string }[];
};

export function GiftEditForm({ gift, users }: Props) {
  const router = useRouter();
  const [state, setState] = useState<GiftMutationState>({});
  const [isPending, startTransition] = useTransition();
  const [alert, setAlert] = useState<{ message: string; kind: "info" | "error" } | null>(null);
  const [listType, setListType] = useState(gift.listType);
  const [productUrl, setProductUrl] = useState(gift.productUrl ?? "");
  const [selectedProductImage, setSelectedProductImage] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (selectedProductImage) {
      formData.set("image", selectedProductImage);
    }
    startTransition(async () => {
      const nextState = await updateGiftAction(gift.id, state, formData);
      setState(nextState);
      if (nextState.success) {
        setAlert({ message: "Alterações guardadas com sucesso.", kind: "info" });
      } else if (nextState.error) {
        setAlert({ message: nextState.error, kind: "error" });
      }
    });
  }

  function closeAlert() {
    const destination = state.destination;
    setAlert(null);
    if (destination) {
      router.replace(destination);
      router.refresh();
    }
  }

  function validateImage(event: React.ChangeEvent<HTMLInputElement>) {
    setSelectedProductImage(null);
    const image = event.target.files?.[0];
    if (!image) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(image.type) || image.size > MAX_GIFT_IMAGE_SIZE) {
      event.target.value = "";
      setAlert({
        message: `Escolha uma imagem JPEG, PNG ou WebP até ${MAX_GIFT_IMAGE_SIZE_LABEL}.`,
        kind: "error",
      });
    }
  }

  function chooseProductImage(file: File | null) {
    if (file && imageInputRef.current) imageInputRef.current.value = "";
    setSelectedProductImage(file);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {alert && (
        <AlertModal
          message={alert.message}
          kind={alert.kind}
          onClose={closeAlert}
        />
      )}

      <div>
        <label htmlFor="edit-listType" className="mb-1 block text-sm text-fpn-cream">
          Esta prenda é
        </label>
        <select
          id="edit-listType"
          name="listType"
          value={listType}
          onChange={(event) =>
            setListType(event.target.value === "offer" ? "offer" : "wish")
          }
          className="min-h-11 w-full rounded-lg border border-fpn-gold/30 bg-fpn-green px-3 py-2 text-white focus:border-fpn-gold focus:outline-none"
        >
          <option value="wish">Para mim — quero receber</option>
          <option value="offer">Para oferecer a outra pessoa</option>
        </select>
        {listType === "offer" && (
          <div className="mt-3">
            <label htmlFor="edit-recipientUserId" className="mb-1 block text-sm text-fpn-cream">
              Quero oferecer a
            </label>
            <select
              id="edit-recipientUserId"
              name="recipientUserId"
              required
              defaultValue={gift.recipientUserId ?? ""}
              className="min-h-11 w-full rounded-lg border border-fpn-gold/30 bg-fpn-green px-3 py-2 text-white focus:border-fpn-gold focus:outline-none"
            >
              <option value="" disabled>Seleciona uma pessoa</option>
              {users.map((person) => (
                <option key={person.id} value={person.id}>{person.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-fpn-snow/55">
              Esta lista é privada e só tu a podes ver.
            </p>
          </div>
        )}
      </div>

      <Image
        src={gift.imageUrl}
        alt={gift.title}
        width={640}
        height={360}
        unoptimized
        className="h-48 w-full rounded-lg object-cover"
      />

      <div>
        <label htmlFor="edit-title" className="mb-1 block text-sm text-fpn-cream">
          Título
        </label>
        <input
          id="edit-title"
          name="title"
          type="text"
          defaultValue={gift.title}
          maxLength={120}
          required
          className="min-h-11 w-full rounded-lg border border-fpn-gold/30 bg-white/10 px-3 py-2 text-white focus:border-fpn-gold focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="edit-description" className="mb-1 block text-sm text-fpn-cream">
          Pequena descrição
        </label>
        <textarea
          id="edit-description"
          name="description"
          defaultValue={gift.description}
          maxLength={500}
          rows={4}
          required
          className="w-full rounded-lg border border-fpn-gold/30 bg-white/10 px-3 py-2 text-white focus:border-fpn-gold focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="edit-productUrl" className="mb-1 block text-sm text-fpn-cream">
          Ligação para a página <span className="text-fpn-snow/60">(opcional)</span>
        </label>
        <input
          id="edit-productUrl"
          name="productUrl"
          type="url"
          maxLength={2048}
          value={productUrl}
          onChange={(event) => {
            setProductUrl(event.target.value);
            setSelectedProductImage(null);
          }}
          className="min-h-11 w-full rounded-lg border border-fpn-gold/30 bg-white/10 px-3 py-2 text-white focus:border-fpn-gold focus:outline-none"
        />
        <ProductImageFinder
          key={productUrl}
          productUrl={productUrl}
          selectedImage={selectedProductImage}
          onImageSelected={chooseProductImage}
        />
      </div>

      <div>
        <label htmlFor="edit-price" className="mb-1 block text-sm text-fpn-cream">
          Preço <span className="text-fpn-snow/60">(opcional, EUR)</span>
        </label>
        <input
          id="edit-price"
          name="price"
          type="number"
          min="0"
          max="9999999.99"
          step="0.01"
          defaultValue={
            gift.priceCents === null ? "" : (gift.priceCents / 100).toFixed(2)
          }
          className="min-h-11 w-full rounded-lg border border-fpn-gold/30 bg-white/10 px-3 py-2 text-white focus:border-fpn-gold focus:outline-none"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center gap-2">
          <label htmlFor="edit-status" className="text-sm text-fpn-cream">
            Estado da prenda
          </label>
          <GiftStatusHelp />
        </div>
        <select
          id="edit-status"
          name="status"
          defaultValue={gift.status}
          className="min-h-11 w-full rounded-lg border border-fpn-gold/30 bg-fpn-green px-3 py-2 text-white focus:border-fpn-gold focus:outline-none"
        >
          <option value="available">Disponível — quero receber</option>
          <option value="received">Já Recebi — já recebi</option>
          <option value="hidden">Invisível — rascunho privado</option>
        </select>
      </div>

      <div>
        <label htmlFor="edit-image" className="mb-1 block text-sm text-fpn-cream">
          Substituir imagem <span className="text-fpn-snow/60">(opcional)</span>
        </label>
        <input
          id="edit-image"
          name="image"
          type="file"
          ref={imageInputRef}
          accept="image/jpeg,image/png,image/webp"
          onChange={validateImage}
          className="w-full text-sm text-fpn-snow/70 file:mr-3 file:rounded-lg file:border-0 file:bg-fpn-gold file:px-4 file:py-2 file:text-sm file:font-medium file:text-fpn-green"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-fpn-red px-4 py-2 font-semibold text-white hover:bg-fpn-red-dark disabled:opacity-60"
        >
          {isPending ? "A guardar..." : "Guardar alterações"}
        </button>
        <Link
          href={gift.listType === "offer" ? "/ofertas" : "/prendas"}
          className="rounded-lg border border-fpn-gold/30 px-4 py-2 text-fpn-gold hover:bg-fpn-gold/10"
        >
          Voltar
        </Link>
      </div>
    </form>
  );
}
