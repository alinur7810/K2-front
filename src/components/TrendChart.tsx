import React, { useState } from 'react';
import { SeriesResponseDto, TrendResponseDto } from '../types/api';

interface TrendChartProps {
  series: SeriesResponseDto;
  trend: TrendResponseDto;
  height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({ series, trend, height = 320 }) => {
  const [showMonthly, setShowMonthly] = useState(true);

  const validYearly = series.yearly.filter((d) => d.value !== null) as { year: number; value: number }[];
  const validMonthly = series.monthly.filter((d) => d.value !== null) as {
    date: string;
    value: number;
    quality: 'ok' | 'filled' | 'outlier';
  }[];

  if (validYearly.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded border border-earth-line bg-earth-soft text-sm text-earth-muted">
        No valid annual values to plot
      </div>
    );
  }

  const minYear = series.yearly[0]?.year ?? trend.from_year;
  const maxYear = series.yearly[series.yearly.length - 1]?.year ?? trend.to_year;

  const allValues = [
    ...validYearly.map((d) => d.value),
    ...(showMonthly ? validMonthly.filter((m) => m.quality !== 'outlier').map((d) => d.value) : []),
  ];

  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const pad = (maxVal - minVal || 1) * 0.12;
  const yMin = minVal - pad;
  const yMax = maxVal + pad;

  const width = 760;
  const padLeft = 58;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 38;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const xForYear = (yearFloat: number) => {
    const span = Math.max(1, maxYear - minYear);
    return padLeft + ((yearFloat - minYear) / span) * plotW;
  };

  const yForVal = (val: number) => {
    return padTop + plotH - ((val - yMin) / (yMax - yMin || 1)) * plotH;
  };

  const yearlyPath = validYearly
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xForYear(pt.year).toFixed(1)} ${yForVal(pt.value).toFixed(1)}`)
    .join(' ');

  const monthlyOk = validMonthly.filter((m) => m.quality !== 'outlier');
  const monthlyPath = monthlyOk
    .map((pt, i) => {
      const [yStr, mStr] = pt.date.split('-');
      const yf = Number(yStr) + (Number(mStr) - 1) / 12;
      return `${i === 0 ? 'M' : 'L'} ${xForYear(yf).toFixed(1)} ${yForVal(pt.value).toFixed(1)}`;
    })
    .join(' ');

  const hasSenLine =
    trend.status === 'ok' &&
    trend.sen_slope !== null &&
    trend.intercept !== null &&
    trend.trend !== 'insufficient_data';

  const senY1 = hasSenLine ? trend.intercept! + trend.sen_slope! * (minYear - trend.base_year) : 0;
  const senY2 = hasSenLine ? trend.intercept! + trend.sen_slope! * (maxYear - trend.base_year) : 0;

  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + ((yMax - yMin) * i) / 4);
  const xStep = Math.max(1, Math.round((maxYear - minYear) / 6));
  const xTicks: number[] = [];
  for (let y = minYear; y <= maxYear; y += xStep) xTicks.push(y);

  return (
    <div className="panel">
      <div className="panel-head flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="section-title">Annual and monthly series</h3>
          <p className="mt-0.5 text-xs text-earth-muted">
            Annual values drive the trend test. The monthly line shows seasonal variation.
          </p>
        </div>
        <label className="inline-flex cursor-pointer select-none items-center gap-1.5 text-xs text-earth-slate">
          <input
            type="checkbox"
            checked={showMonthly}
            onChange={(e) => setShowMonthly(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-earth-line accent-earth-blue"
          />
          <span>Show monthly detail</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-6 pt-3 text-xs text-earth-slate">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-[2px] w-4 bg-earth-ink" /> Yearly average
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-[1px] w-4 bg-[#94A3B8]" /> Monthly
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2 border-dashed border-earth-hydro" /> Sen trend
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-earth-amber" /> Interpolated
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full border border-earth-rust" /> Outlier
        </span>
      </div>

      <div className="overflow-x-auto px-4 pb-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full min-w-[640px] overflow-visible"
        >
          {yTicks.map((tv, idx) => {
            const y = yForVal(tv);
            return (
              <g key={idx}>
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#E8EDF2" />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="font-mono"
                  fontSize={11}
                  fill="#64748B"
                >
                  {tv.toFixed(2)}
                </text>
              </g>
            );
          })}

          {xTicks.map((yr) => {
            const x = xForYear(yr);
            return (
              <g key={yr}>
                <line x1={x} y1={padTop} x2={x} y2={padTop + plotH} stroke="#F1F4F7" />
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize={11}
                  fill="#475569"
                >
                  {yr}
                </text>
              </g>
            );
          })}

          {showMonthly && monthlyPath && (
            <path d={monthlyPath} fill="none" stroke="#94A3B8" strokeWidth="1" opacity="0.7" />
          )}

          {showMonthly &&
            validMonthly
              .filter((m) => m.quality !== 'ok')
              .map((m) => {
                const [yStr, mStr] = m.date.split('-');
                const yf = Number(yStr) + (Number(mStr) - 1) / 12;
                return (
                  <circle
                    key={m.date}
                    cx={xForYear(yf)}
                    cy={yForVal(m.value)}
                    r={3.5}
                    fill={m.quality === 'filled' ? '#B45309' : '#FDF3F1'}
                    stroke={m.quality === 'filled' ? '#FFFFFF' : '#B4462B'}
                    strokeWidth={m.quality === 'filled' ? 1 : 1.5}
                  >
                    <title>{`${m.date}: ${m.value} ${series.unit} (${m.quality})`}</title>
                  </circle>
                );
              })}

          <path d={yearlyPath} fill="none" stroke="#0B1F3A" strokeWidth="2" />

          {series.yearly
            .filter((y) => y.value === null)
            .map((missingYr) => (
              <line
                key={missingYr.year}
                x1={xForYear(missingYr.year)}
                y1={padTop}
                x2={xForYear(missingYr.year)}
                y2={padTop + plotH}
                stroke="#B45309"
                strokeWidth="1.5"
                strokeDasharray="2 3"
              />
            ))}

          {validYearly.map((pt) => (
            <circle
              key={pt.year}
              cx={xForYear(pt.year)}
              cy={yForVal(pt.value)}
              r={3.4}
              fill="#0B1F3A"
              stroke="#FFFFFF"
              strokeWidth={1.5}
            >
              <title>{`${pt.year}: ${pt.value} ${series.unit}`}</title>
            </circle>
          ))}

          {hasSenLine && (
            <line
              x1={xForYear(minYear)}
              y1={yForVal(senY1)}
              x2={xForYear(maxYear)}
              y2={yForVal(senY2)}
              stroke="#0284C7"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          )}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-earth-hairline px-6 py-3 text-xs text-earth-muted">
        <div>
          Source: <span className="text-earth-slate">{series.source.name}</span> (
          <code className="font-mono">{series.source.dataset_id}</code>)
        </div>
        <div>
          Period <span className="text-earth-slate">{trend.from_year}–{trend.to_year}</span>, unit{' '}
          <span className="text-earth-slate">{series.unit}</span>
        </div>
      </div>
    </div>
  );
};
