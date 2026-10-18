"use client";

import { useEffect, useId, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

type Props = {
  message: string;
  kind: "info" | "error";
  onClose: () => void;
};

const subscribeToMount = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function AlertModal({ message, kind, onClose }: Props) {
  const titleId = useId();
  const mounted = useSyncExternalStore(
    subscribeToMount,
    getClientSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    if (!mounted || !message) return;
    const timeout = window.setTimeout(onClose, 2500);
    return () => window.clearTimeout(timeout);
  }, [message, mounted, onClose]);

  useEffect(() => {
    if (!mounted || !message) return;
    const backgrounds = Array.from(
      document.querySelectorAll<HTMLElement>("[data-tutorial-background]")
    );
    const previousInertValues = backgrounds.map((element) => element.inert);
    for (const element of backgrounds) element.inert = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      backgrounds.forEach((element, index) => {
        element.inert = previousInertValues[index];
      });
      document.body.style.overflow = previousOverflow;
    };
  }, [message, mounted]);

  if (!mounted || !message) return null;

  const isError = kind === "error";
  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/65 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role={isError ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-2xl border border-fpn-gold/25 bg-[#102d21] p-6 text-center shadow-[0_0_50px_rgba(0,0,0,0.45)]"
      >
        <button
          type="button"
          aria-label="Fechar mensagem"
          autoFocus
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-xl text-fpn-snow/60 hover:bg-white/5 hover:text-fpn-cream"
        >
          ×
        </button>
        <div
          aria-hidden="true"
          className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full text-xl ${
            isError
              ? "bg-fpn-red/20 text-red-200"
              : "bg-fpn-gold/15 text-fpn-gold"
          }`}
        >
          {isError ? "!" : "✓"}
        </div>
        <h2 id={titleId} className="mb-2 text-lg font-semibold text-fpn-cream">
          {isError ? "Não foi possível concluir" : "Concluído"}
        </h2>
        <p className="text-sm leading-6 text-fpn-snow/80">{message}</p>
      </section>
    </div>,
    document.body
  );
}
