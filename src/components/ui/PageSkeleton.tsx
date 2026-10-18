type Variant = "gifts" | "form" | "auth";

function Placeholder({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`motion-safe:animate-pulse rounded-lg bg-white/10 ${className}`}
    />
  );
}

export function PageSkeleton({ variant }: { variant: Variant }) {
  if (variant === "auth") {
    return (
      <div className="space-y-5" role="status" aria-label="A carregar página">
        <Placeholder className="mx-auto h-8 w-40" />
        <Placeholder className="h-11 w-full" />
        <Placeholder className="h-11 w-full" />
        <Placeholder className="h-11 w-full" />
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className="mx-auto max-w-lg space-y-6" role="status" aria-label="A carregar formulário">
        <Placeholder className="h-8 w-56" />
        <Placeholder className="h-5 w-4/5" />
        <Placeholder className="h-11 w-full" />
        <Placeholder className="h-28 w-full" />
        <Placeholder className="h-11 w-full" />
        <Placeholder className="h-11 w-full" />
        <Placeholder className="h-11 w-full" />
        <Placeholder className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl space-y-8 px-4 py-8" role="status" aria-label="A carregar prendas">
      <div className="flex items-center justify-between border-b border-fpn-gold/15 pb-4">
        <div className="flex items-center gap-3">
          <Placeholder className="h-9 w-9 rounded-full" />
          <div className="space-y-2">
            <Placeholder className="h-5 w-28" />
            <Placeholder className="h-3 w-40" />
          </div>
        </div>
        <Placeholder className="h-10 w-28" />
      </div>
      <Placeholder className="h-8 w-56" />
      <div className="flex flex-wrap gap-3">
        <Placeholder className="h-11 w-48" />
        <Placeholder className="h-11 w-28" />
        <Placeholder className="h-11 w-40" />
      </div>
      {[0, 1].map((section) => (
        <section key={section} className="space-y-4">
          <Placeholder className="h-7 w-52" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((card) => (
              <div key={card} className="space-y-3 rounded-xl border border-white/10 p-3">
                <Placeholder className="h-44 w-full" />
                <Placeholder className="h-5 w-3/4" />
                <Placeholder className="h-4 w-full" />
                <Placeholder className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
