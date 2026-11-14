import React from 'react';
import { TrendResponseDto } from '../types/api';

interface HumanAnswersStripProps {
  trend: TrendResponseDto;
}

type Tone = 'down' | 'up' | 'stable' | 'unknown';

const isInsufficient = (t: TrendResponseDto) =>
  t.status === 'insufficient_data' || t.trend === 'insufficient_data' || t.n_years < 10;

const isNoTrend = (t: TrendResponseDto) =>
  t.trend === 'no_trend' || (!isInsufficient(t) && t.p_value !== null && t.p_value >= 0.1);

const isWeak = (t: TrendResponseDto) =>
  t.p_value !== null && t.p_value >= 0.05 && t.p_value < 0.1;

const getTone = (t: TrendResponseDto): Tone => {
  if (isInsufficient(t)) return 'unknown';
  if (isNoTrend(t)) return 'stable';
  return t.trend === 'decreasing' || t.trend === 'weak_decreasing' ? 'down' : 'up';
};

const getVerdict = (t: TrendResponseDto): { headline: string; explanation: string } => {
  const code = t.variable_code;
  const down = t.trend === 'decreasing' || t.trend === 'weak_decreasing';
  const weak = isWeak(t);

  if (isInsufficient(t)) {
    return {
      headline: 'NOT ENOUGH DATA YET',
      explanation: `Only ${t.n_years} reliable years are available. At least 10 are needed to decide whether this is a real long-term change.`,
    };
  }

  if (isNoTrend(t)) {
    return {
      headline: 'STABLE (NO CLEAR CHANGE)',
      explanation:
        'The record rises and falls with wet, dry, warm and cold years, but there is no proven long-term direction.',
    };
  }

  switch (code) {
    case 'air_temp':
      return down
        ? {
            headline: weak ? 'COOLING SLOWLY' : 'COOLING DOWN',
            explanation: 'Air temperatures at this location are drifting lower over the long term, changing the local growing season and snowmelt timing.',
          }
        : {
            headline: weak ? 'WARMING SLOWLY' : 'WARMING FAST',
            explanation: 'Air temperatures at this location are climbing year after year, pushing snowmelt, growing seasons and water demand toward a warmer state.',
          };
    case 'water_level':
      return down
        ? {
            headline: weak ? 'DIPPING SLIGHTLY' : 'DROPPING STEADILY',
            explanation: 'The water surface is lower than at the start of the record, and the decline is steady rather than a one-year wobble.',
          }
        : {
            headline: weak ? 'CREEPING UP' : 'RISING STEADILY',
            explanation: 'The water surface is higher than at the start of the record, and the rise is steady rather than a one-year spike.',
          };
    case 'tws_grace':
      return down
        ? {
            headline: 'WATER STORAGE FALLING',
            explanation: 'The total water stored in soil, snow and groundwater across this landscape is declining.',
          }
        : {
            headline: 'WATER STORAGE RISING',
            explanation: 'The total water stored in soil, snow and groundwater across this landscape is increasing.',
          };
    case 'snow_cover_frac':
      return down
        ? {
            headline: weak ? 'SNOW COVER SLIPPING' : 'SNOW AND ICE SHRINKING',
            explanation: 'The glacier is holding less snow through the year, a sign that its seasonal snow cover is shrinking.',
          }
        : {
            headline: 'SNOW COVER GROWING',
            explanation: 'The glacier is holding more snow through the year, expanding its seasonal snow cover.',
          };
    case 'swe_max':
      return down
        ? {
            headline: 'MOUNTAIN SNOWPACK THINNING',
            explanation: 'The mountain snowpack is storing less water, which can weaken the spring and summer river recharge.',
          }
        : {
            headline: 'MOUNTAIN SNOWPACK GROWING',
            explanation: 'The mountain snowpack is storing more water, strengthening the spring and summer river recharge.',
          };
    case 'precipitation':
      return down
        ? {
            headline: weak ? 'GETTING DRIER SLOWLY' : 'GETTING DRIER',
            explanation: 'This area is receiving less precipitation over time, which can leave soils and rivers drier.',
          }
        : {
            headline: weak ? 'GETTING WETTER SLOWLY' : 'GETTING WETTER',
            explanation: 'This area is receiving more precipitation over time, adding water to soils and rivers.',
          };
    case 'evaporation':
      return down
        ? {
            headline: 'EVAPORATION FALLING',
            explanation: 'Less water is leaving the landscape through evaporation and plant transpiration.',
          }
        : {
            headline: 'EVAPORATION RISING',
            explanation: 'More water is leaving the landscape through evaporation and plant transpiration.',
          };
    case 'runoff_mod':
      return down
        ? {
            headline: 'RIVER INFLOW SHRINKING',
            explanation: 'The modelled river inflow is weakening, reducing the water available downstream.',
          }
        : {
            headline: 'RIVER INFLOW GROWING',
            explanation: 'The modelled river inflow is strengthening, increasing the water available downstream.',
          };
    case 'ndvi_veg':
      return down
        ? {
            headline: 'GREENERY DECLINING',
            explanation: 'The landscape is losing greenness and productivity during the growing season.',
          }
        : {
            headline: 'GREENERY INCREASING',
            explanation: 'The landscape is becoming greener and more productive during the growing season.',
          };
    default:
      return down
        ? {
            headline: 'DECREASING STEADILY',
            explanation: 'The record shows a consistent downward drift rather than a one-off weather event.',
          }
        : {
            headline: 'INCREASING STEADILY',
            explanation: 'The record shows a consistent upward drift rather than a one-off weather event.',
          };
  }
};

const formatImpact = (t: TrendResponseDto) => {
  if (t.sen_slope === null || isInsufficient(t)) {
    return { main: '—', sub: 'No reliable accumulated change', rate: '—' };
  }

  const total = t.sen_slope * (t.to_year - t.from_year);
  const sign = (v: number) => (v > 0 ? '+' : '');

  if (t.unit === 'm') {
    return {
      main: `${sign(total)}${total.toFixed(2)} m`,
      sub: `(${sign(total)}${(total * 100).toFixed(0)} cm total since ${t.from_year})`,
      rate: `${sign(t.sen_slope)}${(t.sen_slope * 100).toFixed(1)} cm / year`,
    };
  }

  if (t.unit === '°C') {
    return {
      main: `${sign(total)}${total.toFixed(2)} °C`,
      sub: `accumulated since ${t.from_year}`,
      rate: `${sign(t.sen_slope)}${t.sen_slope.toFixed(3)} °C / year`,
    };
  }

  if (t.unit === '%') {
    return {
      main: `${sign(total)}${total.toFixed(1)} %`,
      sub: `percentage-point shift since ${t.from_year}`,
      rate: `${sign(t.sen_slope)}${t.sen_slope.toFixed(2)} pp / year`,
    };
  }

  if (t.unit.endsWith('/yr')) {
    return {
      main: `${sign(total)}${total.toFixed(1)} ${t.unit}`,
      sub: `shift in annual rate since ${t.from_year}`,
      rate: `${sign(t.sen_slope)}${t.sen_slope.toFixed(2)} ${t.unit}/year`,
    };
  }

  return {
    main: `${sign(total)}${total.toFixed(2)} ${t.unit}`,
    sub: `accumulated since ${t.from_year}`,
    rate: `${sign(t.sen_slope)}${t.sen_slope.toFixed(2)} ${t.unit}/year`,
  };
};

const getImpactContext = (t: TrendResponseDto): string => {
  const total = t.sen_slope !== null ? t.sen_slope * (t.to_year - t.from_year) : null;
  const down = t.trend === 'decreasing' || t.trend === 'weak_decreasing';

  if (isInsufficient(t)) {
    return 'A longer record is needed before a reliable total impact can be claimed.';
  }
  if (isNoTrend(t) || total === null) {
    return 'No single direction dominates; wet, dry, warm and cold years still drive most of the change.';
  }

  switch (t.variable_code) {
    case 'water_level':
      return down
        ? `Equivalent to about ${Math.abs(total * 100).toFixed(0)} cm of vertical water depth lost across the entire lake surface.`
        : `Equivalent to about ${Math.abs(total * 100).toFixed(0)} cm of vertical water depth gained across the entire lake surface.`;
    case 'air_temp':
      return `A sustained shift of ${Math.abs(total).toFixed(2)} °C is enough to move snowmelt timing and extend the local growing season.`;
    case 'precipitation':
      return down
        ? 'Less water arriving each year adds up to a different water supply for farms, rivers and cities.'
        : 'More water arriving each year adds up to a different water supply for farms, rivers and cities.';
    case 'snow_cover_frac':
      return down
        ? "A measurable share of the glacier's seasonal snow cover has disappeared over the period."
        : "A measurable share of the glacier's seasonal snow cover has expanded over the period.";
    case 'swe_max':
      return down
        ? 'The mountain snowpack that feeds rivers each spring is storing less water.'
        : 'The mountain snowpack that feeds rivers each spring is storing more water.';
    case 'tws_grace':
      return 'A landscape-scale signal of water stored in soil, snow and groundwater — not just in lakes and rivers.';
    case 'evaporation':
      return down
        ? 'Less water is leaving the landscape through evaporation and plant transpiration.'
        : 'More water is leaving the landscape through evaporation and plant transpiration.';
    case 'runoff_mod':
      return 'A shift in the modelled water supply feeding downstream rivers and reservoirs.';
    case 'ndvi_veg':
      return 'A change in how green and productive the landscape is during the growing season.';
    default:
      return 'A sustained shift of this size is large enough to matter for the local Earth system.';
  }
};

const getConfidence = (t: TrendResponseDto) => {
  if (isInsufficient(t) || t.p_value === null) {
    return {
      pct: 0,
      label: 'NOT ENOUGH DATA',
      note: 'At least 10 reliable years are needed before we can assign a confidence score.',
      barClass: 'bg-amber-500',
      scoreText: 'N/A',
    };
  }

  const p = t.p_value;
  if (p < 0.01) {
    return {
      pct: 99,
      label: '99%+ certainty: confirmed trend',
      note: 'Less than 1% chance this is random weather noise.',
      barClass: 'bg-earth-ink',
      scoreText: '99%',
    };
  }
  if (p < 0.05) {
    return {
      pct: 95,
      label: '95%+ certainty: significant trend',
      note: 'Less than 5% chance this is a coincidence.',
      barClass: 'bg-earth-hydro',
      scoreText: '95%',
    };
  }
  if (p < 0.1) {
    return {
      pct: 90,
      label: 'Weak signal (~90%)',
      note: 'Noticeable shift, but more years of observation needed.',
      barClass: 'bg-earth-amber',
      scoreText: '90%',
    };
  }
  return {
    pct: 12,
    label: 'Natural fluctuation',
    note: 'Up-and-down weather swings with no proven long-term direction.',
    barClass: 'bg-earth-muted',
    scoreText: 'Low',
  };
};

const sentenceCase = (value: string) => {
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

export const HumanAnswersStrip: React.FC<HumanAnswersStripProps> = ({ trend }) => {
  const verdict = getVerdict(trend);
  const impact = formatImpact(trend);
  const impactContext = getImpactContext(trend);
  const confidence = getConfidence(trend);

  return (
    <section className="panel grid grid-cols-1 overflow-hidden lg:grid-cols-3">
      <div className="border-b border-earth-hairline px-5 py-5 lg:border-b-0 lg:border-r">
        <div className="label">What changed</div>
        <div className="mt-2 text-lg font-semibold leading-snug text-earth-ink">
          {sentenceCase(verdict.headline)}
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-earth-slate">{verdict.explanation}</p>
      </div>

      <div className="border-b border-earth-hairline px-5 py-5 lg:border-b-0 lg:border-r">
        <div className="label">How much</div>
        <div className="mt-2 font-mono text-2xl font-medium leading-none text-earth-ink">{impact.main}</div>
        <div className="mt-1.5 font-mono text-xs text-earth-muted">{impact.sub}</div>
        <div className="mt-1 text-xs text-earth-muted">Rate: {impact.rate}</div>
        <p className="mt-2 text-xs leading-relaxed text-earth-slate">{impactContext}</p>
      </div>

      <div className="px-5 py-5">
        <div className="label">How sure</div>
        <div className="mt-2 text-sm font-semibold text-earth-ink">{confidence.label}</div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-earth-hairline">
          <div
            className={`h-full rounded-full ${confidence.barClass}`}
            style={{ width: `${confidence.pct}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-earth-muted">
          <span>Evidence</span>
          <span>{confidence.scoreText}</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-earth-slate">{confidence.note}</p>
      </div>
    </section>
  );
};
