import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <svg
          className="mx-auto mb-4 h-20 w-20 text-fpn-gold/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h1 className="mb-2 text-4xl font-bold text-fpn-cream">404</h1>
        <p className="mb-6 text-fpn-snow/70">Página não encontrada</p>
        <Link
          href="/prendas"
          className="rounded-lg bg-fpn-red px-6 py-2 font-medium text-white transition-colors hover:bg-fpn-red-dark"
        >
          Voltar às prendas
        </Link>
      </div>
    </div>
  );
}
