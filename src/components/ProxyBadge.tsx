import React from 'react';
import { TermTooltip } from './TermTooltip';

export const ProxyBadge: React.FC<{ explanation?: string | null }> = ({ explanation }) => {
  return (
    <div className="flex items-start gap-3 rounded border border-earth-amber/25 bg-[#FDF6EC] px-3 py-2 text-[#7A3E0A]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-[3px] bg-earth-amber px-1.5 py-0.5 text-[11px] font-medium text-white">
            Proxy
          </span>
          <span className="inline-flex items-center gap-1 font-medium">
            Indirect satellite indicator
            <TermTooltip term="proxy" />
          </span>
        </div>
        {explanation && <p className="mt-1 text-xs leading-relaxed text-[#7A3E0A]">{explanation}</p>}
      </div>
    </div>
  );
};
