import React from 'react';
import { TrendDirection } from '../types/api';
import { EN } from '../i18n/ru';

interface TrendBadgeProps {
  trend: TrendDirection;
  pValue?: number | null;
  showSignificance?: boolean;
}

export const TrendBadge: React.FC<TrendBadgeProps> = ({ trend, pValue, showSignificance = true }) => {
  const getStyle = () => {
    switch (trend) {
      case 'increasing':
        return {
          className: 'border-earth-hydro/30 bg-[#EDF5FC] text-[#075985]',
          symbol: '↑',
          label: EN.trendLabels.increasing,
        };
      case 'decreasing':
        return {
          className: 'border-earth-rust/30 bg-[#FDF3F1] text-[#8F3520]',
          symbol: '↓',
          label: EN.trendLabels.decreasing,
        };
      case 'weak_increasing':
        return {
          className: 'border-earth-amber/30 bg-[#FDF6EC] text-[#7A3E0A]',
          symbol: '↑',
          label: EN.trendLabels.weak_increasing,
        };
      case 'weak_decreasing':
        return {
          className: 'border-earth-amber/30 bg-[#FDF6EC] text-[#7A3E0A]',
          symbol: '↓',
          label: EN.trendLabels.weak_decreasing,
        };
      case 'insufficient_data':
        return {
          className: 'border-earth-line bg-earth-soft text-earth-muted',
          symbol: '!',
          label: EN.trendLabels.insufficient_data,
        };
      default:
        return {
          className: 'border-earth-line bg-earth-soft text-earth-muted',
          symbol: '–',
          label: EN.trendLabels.no_trend,
        };
    }
  };

  const getSigText = () => {
    if (pValue === null || pValue === undefined || trend === 'insufficient_data') return null;
    if (pValue < 0.05) return EN.significanceLabels.confident;
    if (pValue < 0.1) return EN.significanceLabels.weak;
    return EN.significanceLabels.none;
  };

  const style = getStyle();
  const sigText = getSigText();

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 rounded-[3px] border px-2 py-0.5 text-[11px] font-medium ${style.className}`}
      >
        <span className="leading-none">{style.symbol}</span>
        <span>{style.label}</span>
      </span>
      {showSignificance && sigText && (
        <span className="rounded-[3px] border border-earth-line bg-earth-soft px-2 py-0.5 text-[11px] text-earth-muted">
          {sigText}
        </span>
      )}
    </div>
  );
};
