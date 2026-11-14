import React, { useState } from 'react';
import { EN } from '../i18n/ru';

type TermKey = keyof typeof EN.terms;

export const TermTooltip: React.FC<{ term: TermKey; label?: string }> = ({ term, label }) => {
  const [open, setOpen] = useState(false);
  const info = EN.terms[term];

  return (
    <span className="relative inline-flex items-center gap-1 align-middle">
      {label && <span>{label}</span>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-earth-line bg-earth-raised text-[10px] leading-none text-earth-muted transition-colors hover:border-earth-blue hover:text-earth-blue focus:outline-none"
        aria-label={`Term definition: ${info.title}`}
      >
        ?
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded border border-earth-line bg-earth-raised p-3 text-xs text-earth-slate shadow-overlay">
          <div className="mb-1 font-semibold text-earth-ink">{info.title}</div>
          <div className="font-normal leading-relaxed">{info.text}</div>
        </div>
      )}
    </span>
  );
};
