"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GiftIcon } from "@/components/ui/GiftIcon";

const tutorialSteps = [
  {
    title: "Adiciona uma prenda",
    description:
      "Dá-lhe um título e uma pequena descrição. Podes acrescentar uma imagem, preço ou ligação, e escolher um estado.",
    points: [
      "Título e descrição ajudam a identificar a sugestão.",
      "Imagem, preço e ligação são opcionais.",
    ],
    icon: "gift",
  },
  {
    title: "Encontra as secções",
    description:
      "A lista divide as prendas do grupo das tuas. As tuas prendas invisíveis são rascunhos privados e só aparecem na tua secção.",
    points: [
      "«Prendas de Outros» mostra sugestões do grupo.",
      "«Minhas Prendas» reúne as tuas sugestões e rascunhos.",
    ],
    icon: "sections",
  },
  {
    title: "Consulta os cartões",
    description:
      "Cada cartão apresenta a imagem, título, descrição, estado, preço e autor. Seleciona um dos teus cartões para o editar.",
    points: [
      "O contorno indica o estado da prenda.",
      "O link abre a página do produto, quando existe.",
    ],
    icon: "card",
  },
  {
    title: "Filtra a lista",
    description:
      "Escolhe uma pessoa no seletor ou abre os filtros para refinar por estado, intervalo de preço e ordenação.",
    points: [
      "Os filtros ajudam a encontrar sugestões específicas.",
      "Usa «Remover filtros» para repor a lista completa.",
    ],
    icon: "filters",
  },
] as const;

const subscribeToMount = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function TutorialIllustration({ icon }: { icon: (typeof tutorialSteps)[number]["icon"] }) {
  return (
    <div className="flex h-36 w-36 items-center justify-center rounded-3xl border border-fpn-gold/20 bg-fpn-gold/[0.06] text-fpn-gold sm:h-40 sm:w-40">
      {icon === "gift" ? (
        <GiftIcon className="h-20 w-20" />
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-20 w-20"
        >
          {icon === "sections" && (
            <>
              <rect x="9" y="12" width="46" height="17" rx="4" />
              <rect x="9" y="35" width="46" height="17" rx="4" />
              <path d="M17 20h22M17 43h17" />
            </>
          )}
          {icon === "card" && (
            <>
              <rect x="12" y="8" width="40" height="48" rx="5" />
              <path d="M20 34h24M20 42h16" />
              <path d="M20 16h24v12H20z" />
            </>
          )}
          {icon === "filters" && (
            <>
              <path d="M10 16h44M16 32h32M23 48h18" />
              <circle cx="22" cy="16" r="4" fill="#1a472a" />
              <circle cx="42" cy="32" r="4" fill="#1a472a" />
              <circle cx="31" cy="48" r="4" fill="#1a472a" />
            </>
          )}
        </svg>
      )}
    </div>
  );
}

export function AppHelpTutorial() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tutorialRequested = searchParams.get("tutorial") === "1";
  const mounted = useSyncExternalStore(
    subscribeToMount,
    getClientSnapshot,
    getServerSnapshot
  );
  const [open, setOpen] = useState(false);
  const [dismissedQuery, setDismissedQuery] = useState(false);
  const isOpen = open || (tutorialRequested && !dismissedQuery);
  const [step, setStep] = useState(0);
  const currentStep = tutorialSteps[step];

  useEffect(() => {
    if (!tutorialRequested || pathname !== "/prendas") return;
    router.replace("/prendas", { scroll: false });
  }, [pathname, router, tutorialRequested]);

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight") {
        setStep((value) => Math.min(value + 1, tutorialSteps.length - 1));
      }
      if (event.key === "ArrowLeft") {
        setStep((value) => Math.max(value - 1, 0));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function startTutorial() {
    setStep(0);
    setDismissedQuery(false);
    if (pathname !== "/prendas") {
      setOpen(true);
      router.push("/prendas?tutorial=1");
      return;
    }
    setOpen(true);
  }

  function closeTutorial() {
    setOpen(false);
    if (tutorialRequested) setDismissedQuery(true);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Abrir tutorial de utilização"
        title="Como usar a aplicação"
        onClick={startTutorial}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-fpn-gold/35 text-sm font-semibold text-fpn-gold/90 transition-colors hover:bg-fpn-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-fpn-gold"
      >
        ?
      </button>
      {mounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/65 p-4 backdrop-blur-[2px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeTutorial();
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="tutorial-title"
              aria-describedby="tutorial-description"
              className="relative my-auto w-full max-w-xl rounded-3xl border border-fpn-gold/25 bg-[#102d21] p-5 shadow-[0_0_50px_rgba(212,175,55,0.12)] sm:p-8"
            >
              <button
                type="button"
                aria-label="Fechar tutorial"
                onClick={closeTutorial}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-xl text-fpn-snow/60 hover:bg-white/5 hover:text-fpn-cream"
              >
                ×
              </button>

              <header className="mb-5 pr-10 text-center">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-fpn-gold/70">
                  Guia de utilização
                </p>
                <h2 id="tutorial-title" className="mt-2 text-xl font-bold text-fpn-cream sm:text-2xl">
                  A tua história de Natal
                </h2>
              </header>

              <div className="flex flex-col items-center text-center">
                <TutorialIllustration icon={currentStep.icon} />
                <p className="mt-4 text-xs font-medium text-fpn-snow/45">
                  Passo {step + 1} de {tutorialSteps.length}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-fpn-cream sm:text-xl">
                  {currentStep.title}
                </h3>
                <p
                  id="tutorial-description"
                  className="mt-2 max-w-md text-sm leading-6 text-fpn-snow/75"
                >
                  {currentStep.description}
                </p>
                <ul className="mt-4 w-full max-w-md space-y-2 text-left text-sm text-fpn-snow/65">
                  {currentStep.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span aria-hidden="true" className="text-fpn-gold">✦</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
                <button
                  type="button"
                  aria-label="Passo anterior"
                  onClick={() => setStep((value) => Math.max(value - 1, 0))}
                  disabled={step === 0}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 text-fpn-snow/80 transition-colors hover:bg-white/5 disabled:opacity-30"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <div className="flex items-center gap-2" aria-label={`Passo ${step + 1} de ${tutorialSteps.length}`}>
                  {tutorialSteps.map((item, index) => (
                    <button
                      key={item.title}
                      type="button"
                      aria-label={`Ir para o passo ${index + 1}`}
                      aria-current={index === step ? "step" : undefined}
                      onClick={() => setStep(index)}
                      className={`h-2.5 rounded-full transition-all ${
                        index === step ? "w-7 bg-fpn-gold" : "w-2.5 bg-white/25 hover:bg-white/45"
                      }`}
                    />
                  ))}
                </div>
                {step < tutorialSteps.length - 1 ? (
                  <button
                    type="button"
                    aria-label="Próximo passo"
                    onClick={() =>
                      setStep((value) => Math.min(value + 1, tutorialSteps.length - 1))
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fpn-red text-white transition-colors hover:bg-fpn-red-dark"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={closeTutorial}
                    className="min-h-11 rounded-full bg-fpn-red px-4 text-sm font-medium text-white transition-colors hover:bg-fpn-red-dark"
                  >
                    Concluir
                  </button>
                )}
              </div>
            </section>
          </div>,
          document.body
        )}
    </>
  );
}
