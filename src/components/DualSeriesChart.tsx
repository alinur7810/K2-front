import React from 'react';
import { YearlyPointDto } from '../types/api';

interface DualSeriesChartProps {
  localSeries: YearlyPointDto[];
  globalSeries: YearlyPointDto[];
  fromYear: number;
  toYear: number;
  localUnit: string;
  globalUnit: string;
  localLabel: string;
  globalLabel: string;
  height?: number;
}

export const DualSeriesChart: React.FC<DualSeriesChartProps> = ({
  localSeries,
  globalSeries,
  fromYear,
  toYear,
  localUnit,
  globalUnit,
  localLabel,
  globalLabel,
  height = 190,
}) => {
  const local = localSeries.filter((p) => p.value !== null) as { year: number; value: number }[];
  const global = globalSeries.filter((p) => p.value !== null) as { year: number; value: number }[];

  if (local.length < 2 && global.length < 2) {
    return (
      <div className="flex h-[190px] items-center justify-center rounded border border-earth-line bg-earth-soft text-xs text-earth-muted">
        No paired series available
      </div>
    );
  }

  const width = 560;
  const padLeft = 44;
  const padRight = 48;
  const padTop = 18;
  const padBottom = 24;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const years = [...local.map((p) => p.year), ...global.map((p) => p.year)];
  const minYear = Math.min(fromYear, ...years);
  const maxYear = Math.max(toYear, ...years);
  const yearSpan = Math.max(1, maxYear - minYear);

  const scalePairs = (values: number[]) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min || 1) * 0.14;
    return { min: min - pad, max: max + pad };
  };

  const localScale = scalePairs(local.length ? local.map((p) => p.value) : global.map((p) => p.value));
  const globalScale = scalePairs(global.length ? global.map((p) => p.value) : local.map((p) => p.value));

  const xForYear = (year: number) => padLeft + ((year - minYear) / yearSpan) * plotW;
  const yForLocal = (value: number) =>
    padTop + plotH - ((value - localScale.min) / (localScale.max - localScale.min || 1)) * plotH;
  const yForGlobal = (value: number) =>
    padTop + plotH - ((value - globalScale.min) / (globalScale.max - globalScale.min || 1)) * plotH;

  const buildPath = (
    points: { year: number; value: number }[],
    yScale: (value: number) => number
  ) => {
    let path = '';
    let started = false;
    points.forEach((pt) => {
      if (pt.value === null) {
        started = false;
        return;
      }
      path += `${started ? 'L' : 'M'} ${xForYear(pt.year).toFixed(1)} ${yScale(pt.value).toFixed(1)} `;
      started = true;
    });
    return path.trim();
  };

  const localPath = buildPath(local, yForLocal);
  const globalPath = buildPath(global, yForGlobal);

  const localTicks = Array.from({ length: 4 }, (_, i) => localScale.min + ((localScale.max - localScale.min) * i) / 3);
  const globalTicks = Array.from({ length: 4 }, (_, i) => globalScale.min + ((globalScale.max - globalScale.min) * i) / 3);
  const xStep = Math.max(1, Math.round(yearSpan / 5));
  const xTicks: number[] = [];
  for (let y = minYear; y <= maxYear; y += xStep) xTicks.push(y);
  if (xTicks[xTicks.length - 1] !== maxYear) xTicks.push(maxYear);

  return (
    <div className="well overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-earth-hairline bg-earth-raised px-3 py-2">
        <span className="text-xs font-medium text-earth-slate">Local and global trajectories</span>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-earth-slate">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-[2px] w-4 bg-earth-ink" /> Local
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-4 border-t-2 border-dashed border-earth-hydro" /> Global NOAA
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full min-w-[440px]">
        {localTicks.map((tv, idx) => {
          const y = yForLocal(tv);
          return (
            <g key={`lt-${idx}`}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#E8EDF2" />
              <text x={padLeft - 6} y={y + 3} textAnchor="end" className="font-mono" fontSize={10} fill="#64748B">
                {tv.toFixed(2)}
              </text>
              <text
                x={width - padRight + 6}
                y={yForGlobal(globalTicks[idx]) + 3}
                textAnchor="start"
                className="font-mono"
                fontSize={10}
                fill="#0B5FA5"
              >
                {globalTicks[idx].toFixed(2)}
              </text>
            </g>
          );
        })}

        {xTicks.map((yr) => (
          <g key={yr}>
            <line x1={xForYear(yr)} y1={padTop} x2={xForYear(yr)} y2={padTop + plotH} stroke="#F1F4F7" />
            <text x={xForYear(yr)} y={height - 8} textAnchor="middle" className="font-mono" fontSize={10} fill="#475569">
              {yr}
            </text>
          </g>
        ))}

        {globalPath && (
          <path d={globalPath} fill="none" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="5 3" />
        )}
        {localPath && <path d={localPath} fill="none" stroke="#0B1F3A" strokeWidth="1.8" />}

        {local.map((pt) => (
          <circle key={`l-${pt.year}`} cx={xForYear(pt.year)} cy={yForLocal(pt.value)} r={2.2} fill="#0B1F3A">
            <title>{`${localLabel} ${pt.year}: ${pt.value} ${localUnit}`}</title>
          </circle>
        ))}
        {global.map((pt) => (
          <circle
            key={`g-${pt.year}`}
            cx={xForYear(pt.year)}
            cy={yForGlobal(pt.value)}
            r={1.8}
            fill="#0284C7"
          >
            <title>{`${globalLabel} ${pt.year}: ${pt.value} ${globalUnit}`}</title>
          </circle>
        ))}

        <text x={padLeft} y={11} className="font-mono" fontSize={9} fill="#64748B">
          {localUnit}
        </text>
        <text x={width - padRight} y={11} textAnchor="end" className="font-mono" fontSize={9} fill="#0B5FA5">
          {globalUnit}
        </text>
      </svg>
      </div>
    </div>
  );
};
