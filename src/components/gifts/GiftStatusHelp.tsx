"use client";

import { useState } from "react";

export function GiftStatusHelp() {
  const [open, setOpen] = useState(false);

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="Explicação dos estados das prendas"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-5 w-5 items-center justify-center rounded-full border border-fpn-snow/35 text-xs font-semibold text-fpn-snow/65 hover:border-fpn-gold/70 hover:text-fpn-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-fpn-gold"
      >
        ?
      </button>
      <span
        role="tooltip"
        className={`absolute left-1/2 top-full z-40 mt-2 w-72 -translate-x-1/2 rounded-lg border border-white/15 bg-[#102d21] p-3 text-left text-xs font-normal leading-5 text-fpn-snow shadow-xl ${
          open ? "block" : "hidden group-hover:block group-focus-within:block"
        }`}
      >
        <span className="block"><strong>Invisível:</strong> rascunho privado, só tu podes ver.</span>
        <span className="mt-1 block"><strong>Disponível:</strong> queres receber esta prenda e toda a gente pode vê-la.</span>
        <span className="mt-1 block"><strong>Já Recebi:</strong> já recebeste a prenda e toda a gente pode vê-la.</span>
      </span>
    </span>
  );
}
