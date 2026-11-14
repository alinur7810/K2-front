import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ChainLinkDto, ChainResponseDto } from '../types/api';
import { EN } from '../i18n/ru';
import { TermTooltip } from './TermTooltip';

interface ChainFlowProps {
  chain: ChainResponseDto;
  activeVariable: string;
  onSelectVariable: (variableCode: string) => void;
}

const fmtP = (value: number | null) =>
  value === null ? '—' : value < 0.001 ? '<0.001' : value.toFixed(4);

const getStory = (link: ChainLinkDto): string => {
  const down = link.trend === 'decreasing' || link.trend === 'weak_decreasing';

  switch (link.variable_code) {
    case 'air_temp':
      return down ? 'Air cools down' : 'Air warms up';
    case 'swe_max':
      return down ? 'Mountain snowpack shrinks' : 'Mountain snowpack grows';
    case 'runoff_mod':
      return down ? 'River inflow weakens' : 'River inflow strengthens';
    case 'evaporation':
      return down ? 'Less water evaporates' : 'More water evaporates';
    case 'water_level':
      return down ? 'Lake level drops' : 'Lake level rises';
    case 'snow_cover_frac':
      return down ? 'Snow cover shrinks' : 'Snow cover expands';
    case 'tws_grace':
      return down ? 'Land water storage falls' : 'Land water storage rises';
    case 'precipitation':
      return down ? 'Rain and snow decrease' : 'Rain and snow increase';
    case 'ndvi_veg':
      return down ? 'Vegetation thins' : 'Vegetation greens up';
    default:
      return down ? `${link.variable_name} falls` : `${link.variable_name} rises`;
  }
};

const getPlainExplanation = (link: ChainLinkDto): string => {
  const down = link.trend === 'decreasing' || link.trend === 'weak_decreasing';

  switch (link.variable_code) {
    case 'air_temp':
      return down
        ? 'Cooler air slows snowmelt and reduces how much water can evaporate.'
        : 'Warmer air melts snow earlier and helps more water evaporate.';
    case 'swe_max':
      return down
        ? 'Less water is stored in the winter snowpack, so less melts into rivers in spring.'
        : 'More water is stored in the winter snowpack, so more melts into rivers in spring.';
    case 'runoff_mod':
      return down
        ? 'River inflow is weakening, so less water reaches downstream areas.'
        : 'River inflow is strengthening, so more water reaches downstream areas.';
    case 'evaporation':
      return down
        ? 'Cooler conditions pull less moisture out of the landscape.'
        : 'Warmer air and water pull more moisture out of the landscape.';
    case 'water_level':
      return down
        ? 'With more water leaving than entering, the lake surface slowly drops.'
        : 'With more water entering than leaving, the lake surface slowly rises.';
    case 'snow_cover_frac':
      return down
        ? 'Less snow stays on the glacier through the year.'
        : 'More snow stays on the glacier through the year.';
    case 'tws_grace':
      return down
        ? 'The landscape is holding less water in its soil, snow and groundwater.'
        : 'The landscape is holding more water in its soil, snow and groundwater.';
    case 'precipitation':
      return down
        ? 'Less rain and snow are arriving, so there is less water to refill rivers and soils.'
        : 'More rain and snow are arriving, so there is more water to refill rivers and soils.';
    case 'ndvi_veg':
      return down
        ? 'Less warmth or moisture is available, so vegetation is losing greenness.'
        : 'More warmth or moisture is available, so vegetation is greening up.';
    default:
      return `The ${link.variable_name.toLowerCase()} is moving ${down ? 'down' : 'up'} over time.`;
  }
};

const getSync = (r: number | null): { label: string; tone: string } => {
  if (r === null) return { label: 'No link data', tone: 'border-earth-line bg-earth-soft text-earth-muted' };
  const strength = Math.abs(r);
  if (strength >= 0.7) return { label: 'Strong link', tone: 'border-earth-ink bg-earth-ink text-white' };
  if (strength >= 0.4) return { label: 'Moderate link', tone: 'border-earth-hydro/30 bg-[#EDF5FC] text-[#075985]' };
  if (strength >= 0.2) return { label: 'Weak link', tone: 'border-earth-amber/30 bg-[#FDF6EC] text-[#7A3E0A]' };
  return { label: 'Little sync', tone: 'border-earth-line bg-earth-soft text-earth-muted' };
};

const expectedLabel = (relation: '+' | '-') => (relation === '+' ? 'expects increase' : 'expects decrease');

export const ChainFlow: React.FC<ChainFlowProps> = ({ chain, activeVariable, onSelectVariable }) => {
  const renderSparkline = (link: ChainLinkDto) => {
    const pts = link.yearly_sparkline.filter((p) => p.value !== null) as { year: number; value: number }[];
    if (pts.length < 2) return null;
    const vals = pts.map((p) => p.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const w = 130;
    const h = 28;
    const path = pts
      .map((p, i) => {
        const x = (i / (pts.length - 1)) * w;
        const y = h - ((p.value - min) / (max - min || 1)) * (h - 6) - 3;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-7 w-full rounded border border-earth-hairline bg-earth-raised">
        <path d={path} fill="none" stroke="#0B1F3A" strokeWidth="1.5" />
      </svg>
    );
  };

  const statusBadge = (status: ChainLinkDto['status']) => {
    if (status === 'confirmed') {
      return (
        <span className="rounded-[3px] border border-earth-green/30 bg-[#F3F7EC] px-1.5 py-0.5 text-[10px] font-medium text-[#3F6212]">
          {EN.chainStatuses.confirmed}
        </span>
      );
    }
    if (status === 'unconfirmed') {
      return (
        <span className="rounded-[3px] border border-earth-line bg-earth-soft px-1.5 py-0.5 text-[10px] font-medium text-earth-muted">
          {EN.chainStatuses.unconfirmed}
        </span>
      );
    }
    return (
      <span className="rounded-[3px] border border-earth-amber/30 bg-[#FDF6EC] px-1.5 py-0.5 text-[10px] font-medium text-[#7A3E0A]">
        {EN.chainStatuses.no_data}
      </span>
    );
  };

  return (
    <section className="panel">
      <div className="panel-head flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="section-title">How the chain connects</h3>
          <p className="mt-1 max-w-3xl body-text">
            Each step is one variable. The connector shows how strongly it moves with the previous step.
          </p>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-earth-muted">
            {chain.summary_caution_text}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-earth-slate">
          <span>Link strength</span>
          <TermTooltip term="spearman" label="Spearman rₛ" />
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-2 overflow-x-auto p-5 lg:flex-row">
        {chain.links.map((link, idx) => {
          const isCurrent = link.variable_code === activeVariable;
          return (
            <React.Fragment key={link.variable_code}>
              {idx > 0 && (
                <div className="flex shrink-0 flex-row items-center justify-center gap-2 px-0.5 py-1 text-earth-muted lg:flex-col lg:gap-1">
                  <ArrowRight className="h-4 w-4 lg:rotate-90" aria-hidden />
                  {link.spearman_r_prev !== null && (
                    <span
                      className={`rounded border px-2 py-1 text-center text-[10px] leading-tight ${
                        getSync(link.spearman_r_prev).tone
                      }`}
                      title={`Spearman rank correlation with the previous link (p = ${link.spearman_p_prev ?? '—'})`}
                    >
                      <span className="block font-medium">{getSync(link.spearman_r_prev).label}</span>
                      <span className="block opacity-80">
                        rₛ {link.spearman_r_prev > 0 ? '+' : ''}
                        {link.spearman_r_prev.toFixed(2)}
                      </span>
                    </span>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => onSelectVariable(link.variable_code)}
                className={`flex min-w-[188px] flex-1 flex-col justify-between rounded border p-3.5 text-left transition-colors ${
                  isCurrent
                    ? 'border-earth-blue bg-[#F3F8FD] ring-1 ring-earth-blue/20'
                    : 'border-earth-line bg-earth-raised hover:border-earth-muted/40 hover:bg-earth-soft'
                }`}
              >
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-earth-muted">
                      Step {link.order}, {expectedLabel(link.expected_relation)}
                    </span>
                    {statusBadge(link.status)}
                  </div>
                  <div className="text-sm font-semibold leading-snug text-earth-ink">{getStory(link)}</div>
                  <div className="mt-0.5 text-[11px] text-earth-muted">
                    {link.variable_name}
                    {link.is_proxy && (
                      <span className="ml-1.5 rounded-[3px] border border-earth-amber/30 bg-[#FDF6EC] px-1.5 py-0.5 text-[10px] text-[#7A3E0A]">
                        Proxy
                      </span>
                    )}
                  </div>
                  <p
                    className="mt-1.5 text-xs leading-relaxed text-earth-slate"
                    title={link.explanation_text}
                  >
                    {getPlainExplanation(link)}
                  </p>
                  {renderSparkline(link)}
                </div>

                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 border-t border-earth-hairline pt-1.5 font-mono text-[11px] text-earth-muted">
                  <span>
                    {link.sen_slope !== null ? (
                      <>
                        {link.sen_slope > 0 ? '↑ +' : '↓ '}
                        {link.sen_slope} {link.unit}/yr
                      </>
                    ) : (
                      'No estimate'
                    )}
                  </span>
                  <span>p = {fmtP(link.p_value)}</span>
                </div>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      <div className="border-t border-earth-hairline bg-earth-soft px-5 py-3 text-xs leading-relaxed text-earth-muted">
        {EN.cautionChainBanner} Select any step to open the full analysis for that variable.
      </div>
    </section>
  );
};
