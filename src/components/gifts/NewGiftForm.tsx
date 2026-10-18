"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGiftAction } from "@/app/actions/gift-actions";
import { GiftStatusHelp } from "./GiftStatusHelp";
import { AlertModal } from "@/components/ui/AlertModal";
import {
  MAX_GIFT_IMAGE_SIZE,
  MAX_GIFT_IMAGE_SIZE_LABEL,
} from "@/lib/gift-constants";

type State = {
  error?: string;
  success?: boolean;
  destination?: string;
  description?: string;
  productUrl?: string;
  price?: string;
};

const initialState: State = {};

type Props = {
  users: { id: string; name: string }[];
  initialListType: "wish" | "offer";
};

export function NewGiftForm({ users, initialListType }: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>(initialState);
  const [isPending, startTransition] = useTransition();
  const [alert, setAlert] = useState<{ message: string; kind: "info" | "error" } | null>(null);
  const [listType, setListType] = useState(initialListType);
  const imageRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const image = imageRef.current?.files?.[0];

    if (image) {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(image.type)) {
        setAlert({ message: "A imagem deve ser JPEG, PNG ou WebP.", kind: "error" });
        return;
      }

      if (image.size > MAX_GIFT_IMAGE_SIZE) {
        setAlert({
          message: `A imagem não pode exceder ${MAX_GIFT_IMAGE_SIZE_LABEL}.`,
          kind: "error",
        });
        return;
      }
    }

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const nextState = await createGiftAction(state, formData);
      setState(nextState);
      if (nextState.success) {
        formRef.current?.reset();
        setAlert({ message: "Prenda guardada com sucesso.", kind: "info" });
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

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {alert && (
        <AlertModal
          message={alert.message}
          kind={alert.kind}
          onClose={closeAlert}
        />
      )}

      <div>
        <label htmlFor="listType" className="mb-1 block text-sm text-fpn-cream">
          Esta prenda é
        </label>
        <select
          id="listType"
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
            <label htmlFor="recipientUserId" className="mb-1 block text-sm text-fpn-cream">
              Quero oferecer a
            </label>
            <select
              id="recipientUserId"
              name="recipientUserId"
              required
              defaultValue=""
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

      <div>
        <label htmlFor="title" className="mb-1 block text-sm text-fpn-cream">
          Título
        </label>
        <input
          id="title"
          name="title"
          type="text"
          maxLength={120}
          required
          className="min-h-11 w-full rounded-lg border border-fpn-gold/30 bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:border-fpn-gold focus:outline-none"
          placeholder="Ex: Auscultadores sem fios"
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm text-fpn-cream">
          Pequena descrição
        </label>
        <textarea
          id="description"
          name="description"
          maxLength={500}
          rows={4}
          required
          className="w-full rounded-lg border border-fpn-gold/30 bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:border-fpn-gold focus:outline-none"
          placeholder="Ex: Modelo em vermelho, tamanho médio..."
        />
        <p className="mt-1 text-right text-xs text-fpn-snow/50">
          Máximo de 500 caracteres
        </p>
      </div>

      <div>
        <label htmlFor="productUrl" className="mb-1 block text-sm text-fpn-cream">
          Ligação para a página da prenda <span className="text-fpn-snow/60">(opcional)</span>
        </label>
        <input
          id="productUrl"
          name="productUrl"
          type="url"
          inputMode="url"
          autoComplete="url"
          maxLength={2048}
          className="min-h-11 w-full rounded-lg border border-fpn-gold/30 bg-white/10 px-3 py-2 text-white placeholder-white/40 focus:border-fpn-gold focus:outline-none"
          placeholder="https://loja.pt/pagina-da-prenda"
        />
      </div>

      <div>
        <label htmlFor="price" className="mb-1 block text-sm text-fpn-cream">
          Preço <span className="text-fpn-snow/60">(opcional)</span>
        </label>
        <div className="relative">
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            max="9999999.99"
            step="0.01"
            inputMode="decimal"
            className="min-h-11 w-full rounded-lg border border-fpn-gold/30 bg-white/10 px-3 py-2 pr-12 text-white placeholder-white/40 focus:border-fpn-gold focus:outline-none"
            placeholder="0,00"
          />
          <span className="absolute inset-y-0 right-3 flex items-center text-sm text-fpn-snow/60">
            EUR
          </span>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center gap-2">
          <label htmlFor="status" className="text-sm text-fpn-cream">
            Estado da prenda
          </label>
          <GiftStatusHelp />
        </div>
        <select
          id="status"
          name="status"
          defaultValue="available"
          className="min-h-11 w-full rounded-lg border border-fpn-gold/30 bg-fpn-green px-3 py-2 text-white focus:border-fpn-gold focus:outline-none"
        >
          <option value="available">Disponível — quero receber</option>
          <option value="received">Já Recebi — já recebi</option>
          <option value="hidden">Invisível — rascunho privado</option>
        </select>
      </div>

      <div>
        <label htmlFor="image" className="mb-1 block text-sm text-fpn-cream">
          Imagem
        </label>
        <input
          id="image"
          name="image"
          type="file"
          ref={imageRef}
          accept="image/jpeg,image/png,image/webp"
          className="w-full text-sm text-fpn-snow/70 file:mr-3 file:rounded-lg file:border-0 file:bg-fpn-gold file:px-4 file:py-2 file:text-sm file:font-medium file:text-fpn-green hover:file:bg-fpn-cream"
        />
        <p className="mt-1 text-xs text-fpn-snow/50">
          Opcional. JPEG, PNG ou WebP — máximo {MAX_GIFT_IMAGE_SIZE_LABEL}
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-fpn-red px-4 py-2 font-semibold text-white transition-colors hover:bg-fpn-red-dark disabled:opacity-60"
        >
          {isPending ? "A guardar..." : "Guardar prenda"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/prendas")}
          disabled={isPending}
          className="rounded-lg border border-fpn-gold/30 px-4 py-2 text-fpn-gold transition-colors hover:bg-fpn-gold/10 disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
