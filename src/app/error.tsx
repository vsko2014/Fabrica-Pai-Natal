"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <svg
          className="mx-auto mb-4 h-16 w-16 text-fpn-gold/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h2 className="mb-2 text-xl font-bold text-fpn-cream">
          Ocorreu um erro
        </h2>
        <p className="mb-6 text-fpn-snow/70">
          Algo correu inesperadamente. Tente novamente.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-fpn-red px-6 py-2 font-medium text-white transition-colors hover:bg-fpn-red-dark"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
