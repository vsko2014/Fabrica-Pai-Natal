"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_GIFT_IMAGE_SIZE } from "@/lib/gift-constants";

type LookupStatus = {
  kind: "loading" | "success" | "not-found" | "error";
  message: string;
};

type Candidate = {
  previewUrl: string;
  file: File;
};

type Props = {
  productUrl: string;
  selectedImage: File | null;
  onImageSelected: (file: File | null) => void;
};

export function ProductImageFinder({
  productUrl,
  selectedImage,
  onImageSelected,
}: Props) {
  const [status, setStatus] = useState<LookupStatus | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const statusTimeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      if (statusTimeoutRef.current !== null) {
        window.clearTimeout(statusTimeoutRef.current);
      }
    },
    []
  );

  function showTemporaryStatus(nextStatus: LookupStatus) {
    if (statusTimeoutRef.current !== null) {
      window.clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }
    setStatus(nextStatus);
    if (nextStatus.kind !== "loading") {
      statusTimeoutRef.current = window.setTimeout(() => setStatus(null), 5000);
    }
  }

  async function searchForImage() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setCandidate(null);
    onImageSelected(null);
    if (!productUrl.trim()) {
      showTemporaryStatus({
        kind: "error",
        message: "Introduza primeiro a ligação para a página da prenda.",
      });
      return;
    }

    showTemporaryStatus({ kind: "loading", message: "A procurar imagem..." });
    try {
      const response = await fetch("/api/product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: productUrl }),
        signal: controller.signal,
      });
      const data = (await response.json()) as {
        error?: string;
        base64?: string;
        contentType?: string;
        fileName?: string;
      };
      if (!response.ok) {
        showTemporaryStatus({
          kind: response.status === 404 ? "not-found" : "error",
          message: data.error ?? "Não foi possível obter a imagem.",
        });
        return;
      }
      if (
        !data.base64 ||
        !data.contentType ||
        !data.fileName ||
        !["image/jpeg", "image/png", "image/webp"].includes(data.contentType)
      ) {
        throw new Error("Resposta inválida ao procurar a imagem.");
      }

      const binary = atob(data.base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      if (bytes.length > MAX_GIFT_IMAGE_SIZE) {
        throw new Error("A imagem excede o limite permitido.");
      }
      const file = new File([bytes], data.fileName, { type: data.contentType });
      const previewUrl = `data:${data.contentType};base64,${data.base64}`;
      setCandidate({ previewUrl, file });
      showTemporaryStatus({
        kind: "success",
        message: "Imagem encontrada com sucesso.",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      showTemporaryStatus({
        kind: "error",
        message: "Não foi possível consultar este site. Tente novamente.",
      });
    }
  }

  function rejectCandidate() {
    setCandidate(null);
    onImageSelected(null);
  }

  return (
    <div className="mt-3 space-y-2">
      <button
        type="button"
        onClick={searchForImage}
        disabled={status?.kind === "loading"}
        className="rounded-lg border border-fpn-gold/50 px-3 py-2 text-sm text-fpn-gold transition-colors hover:bg-fpn-gold/10 disabled:opacity-60"
      >
        {status?.kind === "loading" ? "A procurar imagem..." : "Procurar imagem"}
      </button>
      {status && (
        <p
          role="status"
          aria-live="polite"
          className={
            status.kind === "error" || status.kind === "not-found"
              ? "text-sm text-red-300"
              : "text-sm text-fpn-cream"
          }
        >
          {status.message}
        </p>
      )}
      {candidate && (
        <div className="space-y-2 rounded-lg border border-fpn-gold/30 p-3">
          {/* The source image is remote content returned by the authenticated lookup API. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={candidate.previewUrl}
            alt="Pré-visualização da imagem encontrada"
            className="h-48 w-full rounded-lg object-contain"
          />
          {selectedImage === candidate.file ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-fpn-cream">Imagem selecionada.</p>
              <button
                type="button"
                onClick={rejectCandidate}
                className="text-sm text-fpn-gold underline"
              >
                Não utilizar
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onImageSelected(candidate.file)}
                className="rounded-lg bg-fpn-gold px-3 py-2 text-sm font-medium text-fpn-green"
              >
                Utilizar esta imagem
              </button>
              <button
                type="button"
                onClick={rejectCandidate}
                className="rounded-lg border border-fpn-gold/30 px-3 py-2 text-sm text-fpn-cream"
              >
                Não, escolher outra
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
