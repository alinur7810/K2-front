import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient, getUseMocksMode } from '../api/client';
import {
  ChainResponseDto,
  GeoObjectDto,
  SectionDto,
  SeriesResponseDto,
  TrendResponseDto,
  VariableDto,
} from '../types/api';
import { EN } from '../i18n/ru';
import { TrendBadge } from '../components/TrendBadge';
import { ProxyBadge } from '../components/ProxyBadge';
import { TrendChart } from '../components/TrendChart';
import { ChainFlow } from '../components/ChainFlow';
import { TermTooltip } from '../components/TermTooltip';
import { KyrgyzstanMap } from '../components/KyrgyzstanMap';
import { HumanAnswersStrip } from '../components/HumanAnswersStrip';

export const ExploreResultPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const sectionParam = searchParams.get('section') || 'water';
  const objectParam = searchParams.get('object') || 'issyk_kul';
  const variableParam = searchParams.get('variable') || 'water_level';
  const rawFrom = Number(searchParams.get('from') || 2000);
  const rawTo = Number(searchParams.get('to') || 2025);
  const fromParam = Number.isFinite(rawFrom) ? rawFrom : 2000;
  const toParam = Number.isFinite(rawTo) ? rawTo : 2025;
  const rawLat = searchParams.get('lat');
  const rawLon = searchParams.get('lon');
  const latValue = rawLat !== null ? Number(rawLat) : null;
  const lonValue = rawLon !== null ? Number(rawLon) : null;
  const latParam = latValue !== null && Number.isFinite(latValue) ? latValue : null;
  const lonParam = lonValue !== null && Number.isFinite(lonValue) ? lonValue : null;
  const hasPoint = latParam !== null && lonParam !== null;
  const modeParam = searchParams.get('mode');
  const initialPlaceMode: 'object' | 'region' | 'point' =
    hasPoint || modeParam === 'point' ? 'point' : modeParam === 'region' ? 'region' : 'object';

  const [placeMode, setPlaceMode] = useState<'object' | 'region' | 'point'>(
    initialPlaceMode
  );
  const [showMapPicker, setShowMapPicker] = useState<boolean>(
    modeParam === 'point' && !hasPoint
  );
  const [showScientificProof, setShowScientificProof] = useState<boolean>(false);

  useEffect(() => {
    setPlaceMode(initialPlaceMode);
  }, [initialPlaceMode]);

  const [sections, setSections] = useState<SectionDto[]>([]);
  const [objects, setObjects] = useState<GeoObjectDto[]>([]);
  const [variables, setVariables] = useState<VariableDto[]>([]);

  const [series, setSeries] = useState<SeriesResponseDto | null>(null);
  const [trend, setTrend] = useState<TrendResponseDto | null>(null);
  const [chain, setChain] = useState<ChainResponseDto | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const updateQuery = (patch: Record<string, string | number | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next);
  };

  useEffect(() => {
    Promise.all([apiClient.getSections(), apiClient.getObjects()])
      .then(([secList, objList]) => {
        setSections(secList);
        setObjects(objList);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getVariables(sectionParam, placeMode === 'point' ? undefined : objectParam)
      .then((vars) => {
        if (cancelled) return;
        setVariables(vars);
        if (vars.length > 0 && !vars.some((v) => v.code === variableParam)) {
          updateQuery({ variable: vars[0].code });
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [sectionParam, objectParam, placeMode]);

  const queryArgs =
    placeMode === 'point' && hasPoint
      ? { lat: latParam!, lon: lonParam!, variable: variableParam, from: fromParam, to: toParam }
      : { object: objectParam, variable: variableParam, from: fromParam, to: toParam };

  const shouldFetch = placeMode !== 'point' || hasPoint;

  useEffect(() => {
    if (!shouldFetch) {
      setSeries(null);
      setTrend(null);
      setChain(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSeries(null);
    setTrend(null);
    setChain(null);

    Promise.all([
      apiClient.getSeries(queryArgs),
      apiClient.getTrend(queryArgs),
      apiClient.getChain(queryArgs),
    ])
      .then(([sRes, tRes, cRes]) => {
        if (cancelled) return;
        setSeries(sRes);
        setTrend(tRes);
        setChain(cRes);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [objectParam, variableParam, fromParam, toParam, latParam, lonParam, placeMode, shouldFetch]);

  const objectsForMode = (mode: 'object' | 'region') =>
    objects.filter((o) => (mode === 'region' ? o.type === 'region' : o.type !== 'region'));

  const filteredObjects = objectsForMode(placeMode === 'region' ? 'region' : 'object');

  useEffect(() => {
    if (placeMode === 'point' || objects.length === 0) return;
    const options = objectsForMode(placeMode);
    if (options.length > 0 && !options.some((o) => o.code === objectParam)) {
      updateQuery({ object: options[0].code });
    }
  }, [objects, placeMode]);

  const selectPlaceMode = (mode: 'object' | 'region' | 'point') => {
    setPlaceMode(mode);
    if (mode === 'point') {
      updateQuery({ mode: 'point' });
      setShowMapPicker(true);
      return;
    }

    const options = objectsForMode(mode);
    const nextObject = options.some((o) => o.code === objectParam)
      ? objectParam
      : options[0]?.code;
    updateQuery({
      mode: mode === 'region' ? 'region' : null,
      object: nextObject ?? objectParam,
      lat: null,
      lon: null,
    });
  };

  const catalogObject = objects.find((o) => o.code === objectParam);
  const spatialCoordinates =
    placeMode === 'point' && hasPoint
      ? `${latParam}° N, ${lonParam}° E (selected WGS84 point)`
      : catalogObject
      ? `${catalogObject.marker[0].toFixed(2)}° N, ${catalogObject.marker[1].toFixed(2)}° E / ${catalogObject.type.toUpperCase()}`
      : 'Object centroid / bounding polygon (WGS84)';

  const qaTotal = series?.monthly.length ?? 0;
  const qaOk = series?.monthly.filter((p) => p.quality === 'ok').length ?? 0;
  const qaFilled = series?.monthly.filter((p) => p.quality === 'filled').length ?? 0;
  const qaOutliers = series?.monthly.filter((p) => p.quality === 'outlier').length ?? 0;
  const qaShare = (count: number) =>
    qaTotal > 0 ? `${((count / qaTotal) * 100).toFixed(1)}%` : '0.0%';

  const reproQuery =
    placeMode === 'point' && hasPoint
      ? `GET /api/v1/trend?lat=${latParam}&lon=${lonParam}&variable=${variableParam}&from=${fromParam}&to=${toParam}`
      : `GET /api/v1/trend?object=${objectParam}&variable=${variableParam}&from=${fromParam}&to=${toParam}`;

  const ProofRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
      <div className="border-b border-earth-hairline bg-earth-soft px-4 py-3 text-xs font-medium text-earth-muted md:border-b-0 md:border-r">
        {label}
      </div>
      <div className="space-y-2 px-4 py-3 text-sm text-earth-slate">{children}</div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1280px] space-y-4 px-4 py-6 sm:px-6">
      <section className="panel">
        <div className="panel-head">
          <h1 className="display-title">Explore a station and run a trend test</h1>
          <p className="mt-1 max-w-2xl body-text">
            Choose a section, place and parameter, then set the period. Every selection is saved
            in the URL so the result can be reproduced.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label mb-1.5 block">{EN.steps.section}</label>
            <select
              value={sectionParam}
              onChange={(e) => updateQuery({ section: e.target.value })}
              className="nasa-field"
            >
              {sections.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label">{EN.steps.place}</label>
              <div className="flex gap-1">
                {(['object', 'region', 'point'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => selectPlaceMode(m)}
                    aria-pressed={placeMode === m}
                    className={`rounded border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                      placeMode === m
                        ? 'border-earth-ink bg-earth-ink text-white'
                        : 'border-earth-line bg-earth-raised text-earth-slate hover:border-earth-muted/50 hover:text-earth-ink'
                    }`}
                  >
                    {EN.placeModes[m]}
                  </button>
                ))}
              </div>
            </div>

            {placeMode !== 'point' ? (
              <select
                value={objectParam}
                onChange={(e) => updateQuery({ object: e.target.value, lat: null, lon: null })}
                className="nasa-field"
              >
                {filteredObjects.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.name}
                  </option>
                ))}
              </select>
            ) : (
              <button
                type="button"
                onClick={() => setShowMapPicker((v) => !v)}
                className="nasa-button-light flex w-full items-center justify-between"
              >
                <span>
                  {hasPoint
                    ? `${latParam}°N / ${lonParam}°E`
                    : 'Pick a point on the map'}
                </span>
                <span className="text-earth-muted">Map</span>
              </button>
            )}
          </div>

          <div>
            <label className="label mb-1.5 block">{EN.steps.variable}</label>
            <select
              value={variableParam}
              onChange={(e) => updateQuery({ variable: e.target.value })}
              className="nasa-field"
            >
              {variables.map((v) => (
                <option key={v.code} value={v.code}>
                  {v.name} [{v.unit}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label mb-1.5 block">{EN.steps.period}</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={1990}
                max={toParam - 1}
                value={fromParam}
                onChange={(e) => updateQuery({ from: Number(e.target.value) })}
                className="nasa-field font-mono"
                aria-label="Start year"
              />
              <input
                type="number"
                min={fromParam + 1}
                max={2025}
                value={toParam}
                onChange={(e) => updateQuery({ to: Number(e.target.value) })}
                className="nasa-field font-mono"
                aria-label="End year"
              />
            </div>
          </div>
        </div>

        {showMapPicker && (
          <div className="space-y-2 border-t border-earth-hairline p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-earth-slate">
              <span>Click anywhere in Kyrgyzstan to sample the nearest WGS84 grid cell.</span>
              <button
                type="button"
                onClick={() => setShowMapPicker(false)}
                className="nasa-button-ghost"
              >
                Hide map
              </button>
            </div>
            <KyrgyzstanMap
              mode="picker"
              catalogObjects={objects}
              selectedObjectCode={objectParam}
              pickedPoint={hasPoint ? { lat: latParam, lon: lonParam } : null}
              onSelectObject={(code) => {
                const nextMode = objects.find((o) => o.code === code)?.type === 'region'
                  ? 'region'
                  : 'object';
                setPlaceMode(nextMode);
                updateQuery({
                  mode: nextMode === 'region' ? 'region' : null,
                  object: code,
                  lat: null,
                  lon: null,
                });
              }}
              onPickPoint={(lat, lon) => {
                setPlaceMode('point');
                updateQuery({ mode: 'point', lat, lon, object: null });
              }}
            />
          </div>
        )}
      </section>

      {error && (
        <div className="panel panel-error px-4 py-3 text-sm">Data link error: {error}</div>
      )}

      {!loading && placeMode === 'point' && !hasPoint && (
        <div className="panel px-4 py-10 text-center text-sm text-earth-muted">
          Pick a point on the map to load the satellite series, trend test and process chain.
        </div>
      )}

      {loading && shouldFetch && (
        <div className="panel px-4 py-10 text-center text-sm text-earth-muted">
          Loading the series and running the Hamed–Rao Mann–Kendall test…
        </div>
      )}

      {!loading && series && trend && (
        <div className="space-y-4">
          <HumanAnswersStrip trend={trend} />

          <section className="panel">
            <div className="panel-head">
              <h2 className="display-title">{series.object_name}</h2>
              <p className="mt-0.5 text-sm text-earth-slate">{series.variable_name}</p>
              <p className="mt-2 max-w-3xl text-xs leading-relaxed text-earth-muted">
                The plain-language answers above come from the full test. Expand the scientific
                proof below the chart for Kendall&apos;s tau, the 95% confidence interval, the
                Hamed–Rao correction and the dataset provenance record.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 p-5">
              <button
                type="button"
                onClick={() =>
                  navigate(`/compare?variable=${series.variable_code}&from=${fromParam}&to=${toParam}`)
                }
                className="nasa-button"
              >
                Compare regions
              </button>

              {getUseMocksMode() ? (
                <button
                  type="button"
                  disabled
                  title="CSV export requires the live backend"
                  className="nasa-button-light cursor-not-allowed opacity-50"
                >
                  Export CSV
                </button>
              ) : (
                <a
                  href={apiClient.getExportCsvUrl(queryArgs)}
                  download
                  className="nasa-button-light"
                >
                  Export CSV
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowScientificProof(true);
                  window.setTimeout(
                    () =>
                      document
                        .getElementById('scientific-proof')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
                    0
                  );
                }}
                className="nasa-button-ghost"
              >
                Scientific proof
              </button>
            </div>
          </section>

          <TrendChart series={series} trend={trend} />

          <section id="scientific-proof" className="panel">
            <div className="panel-head flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="section-title">Scientific proof and dataset record</h3>
                <p className="mt-0.5 text-xs text-earth-muted">
                  Kendall&apos;s tau, 95% confidence interval, Hamed–Rao correction and the
                  quality-control log.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowScientificProof((v) => !v)}
                className="nasa-button-light"
              >
                {showScientificProof ? 'Collapse' : 'Expand'}
              </button>
            </div>

            {showScientificProof && (
              <div className="divide-y divide-earth-hairline">
                <ProofRow label="Mann–Kendall test output">
                  <div className="flex flex-wrap items-center gap-2">
                    <TrendBadge trend={trend.trend} pValue={trend.p_value} />
                    {series.is_proxy && <ProxyBadge explanation={series.proxy_note} />}
                  </div>

                  <div
                    className={`rounded border-l-2 px-3 py-2 text-xs leading-relaxed ${
                      trend.status === 'insufficient_data'
                        ? 'border-earth-amber/60 bg-[#FDF6EC] text-[#7A3E0A]'
                        : 'border-earth-blue/50 bg-earth-soft text-earth-slate'
                    }`}
                  >
                    {trend.summary_text}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    <div className="data-tile">
                      <div className="text-earth-muted">
                        <TermTooltip term="sen_slope" label="Sen slope" />
                      </div>
                      <div className="mt-1 font-mono text-sm font-medium text-earth-ink">
                        {trend.sen_slope !== null
                          ? `${trend.sen_slope > 0 ? '+' : ''}${trend.sen_slope} ${trend.unit}/yr`
                          : '—'}
                      </div>
                      {trend.slope_ci && (
                        <div className="mt-0.5 font-mono text-[11px] text-earth-muted">
                          95% CI [{trend.slope_ci[0]}; {trend.slope_ci[1]}]
                        </div>
                      )}
                    </div>

                    <div className="data-tile">
                      <div className="text-earth-muted">
                        <TermTooltip term="p_value" label="p-value" />
                      </div>
                      <div className="mt-1 font-mono text-sm font-medium text-earth-ink">
                        {trend.p_value !== null ? trend.p_value.toFixed(4) : '—'}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-earth-muted">α = 0.05</div>
                    </div>

                    <div className="data-tile">
                      <div className="text-earth-muted">
                        <TermTooltip term="tau" label="Kendall tau (τ)" />
                      </div>
                      <div className="mt-1 font-mono text-sm font-medium text-earth-ink">
                        {trend.tau !== null ? trend.tau.toFixed(3) : '—'}
                      </div>
                    </div>

                    <div className="data-tile">
                      <div className="text-earth-muted">Valid years (n)</div>
                      <div className="mt-1 font-mono text-sm font-medium text-earth-ink">
                        {trend.n_years} yr
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-earth-muted">Minimum 10 yr</div>
                    </div>

                    <div className="data-tile">
                      <div className="text-earth-muted">Missing / interpolated</div>
                      <div className="mt-1 font-mono text-sm font-medium text-earth-ink">
                        {(trend.missing_share * 100).toFixed(1)}%
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-earth-muted">
                        IQR outliers: {(series.outlier_share * 100).toFixed(1)}%
                      </div>
                    </div>

                    <div className="data-tile">
                      <div className="text-earth-muted">
                        <TermTooltip term="hamed_rao" label="Estimator" />
                      </div>
                      <div className="mt-1 text-[11px] font-medium leading-tight text-earth-ink">
                        {trend.method}
                      </div>
                    </div>
                  </div>
                </ProofRow>

                <ProofRow label="Dataset and provenance">
                  <div className="font-mono text-xs font-medium text-earth-ink">
                    {series.source.dataset_id}
                  </div>
                  <div className="text-xs">{series.source.name}</div>
                  <div className="text-xs">
                    <span className="text-earth-muted">Verification link: </span>
                    <a
                      href={series.source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-earth-blue underline decoration-earth-blue/30 underline-offset-2 hover:decoration-earth-blue"
                    >
                      {series.source.url}
                    </a>
                  </div>
                  <div className="text-xs text-earth-muted">License: {series.source.license}</div>
                  <div className="text-xs text-earth-muted">Citation: {series.source.citation}</div>
                </ProofRow>

                <ProofRow label="Spatial reference">
                  <div className="text-xs">
                    <span className="text-earth-muted">Projection: </span>WGS84 (EPSG:4326)
                  </div>
                  <div className="text-xs">
                    <span className="text-earth-muted">Coordinates: </span>
                    {spatialCoordinates}
                  </div>
                  <div className="text-xs">
                    <span className="text-earth-muted">Resolution: </span>
                    {series.source.spatial_resolution ?? 'Product-native grid / altimetry track'}
                  </div>
                  <div className="text-xs text-earth-muted">
                    Geometry note: station centroid marker or nearest WGS84 grid cell for arbitrary
                    points; basin and region analyses use the published product footprint.
                  </div>
                </ProofRow>

                <ProofRow label="Quality-control log">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-earth-hairline py-1.5 text-xs">
                    <span className="text-earth-muted">Total observations</span>
                    <span className="font-mono text-earth-ink">{qaTotal} months</span>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-earth-hairline py-1.5 text-xs">
                    <span className="text-earth-muted">Valid (quality ok)</span>
                    <span className="font-mono text-earth-ink">
                      {qaOk} <span className="text-earth-muted">({qaShare(qaOk)})</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-earth-hairline py-1.5 text-xs">
                    <span className="text-earth-muted">Interpolated (quality filled)</span>
                    <span className="text-right font-mono text-earth-ink">
                      {qaFilled} <span className="text-earth-muted">({qaShare(qaFilled)})</span>
                      <span className="ml-2 text-[11px] text-earth-muted">
                        max 2 consecutive months
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-earth-hairline py-1.5 text-xs">
                    <span className="text-earth-muted">IQR outliers excluded</span>
                    <span className="text-right font-mono text-earth-ink">
                      {qaOutliers} <span className="text-earth-muted">({qaShare(qaOutliers)})</span>
                      <span className="ml-2 text-[11px] text-earth-muted">
                        more than 4 IQR from calendar-month median
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-earth-hairline py-1.5 text-xs">
                    <span className="text-earth-muted">Valid years for Mann–Kendall</span>
                    <span className="text-right font-mono text-earth-ink">
                      {trend.n_years} years
                      <span className="ml-2 text-[11px] text-earth-muted">
                        threshold 10 years / minimum 9 valid months per year
                      </span>
                    </span>
                  </div>
                  <div className="pt-1 text-[11px] text-earth-muted">
                    Reported shares: missing {(series.missing_share * 100).toFixed(1)}%, filled{' '}
                    {(series.filled_share * 100).toFixed(1)}%, outlier{' '}
                    {(series.outlier_share * 100).toFixed(1)}%
                  </div>
                </ProofRow>

                <ProofRow label="Statistical reproducibility">
                  <div className="text-xs">
                    <span className="text-earth-muted">Reference implementation: </span>
                    Python pymannkendall (α = 0.05, Sen&apos;s slope median pairwise estimator,
                    Hamed–Rao autocorrelation correction)
                  </div>
                  <div className="text-xs">
                    <span className="text-earth-muted">Executed method: </span>
                    {trend.method}
                  </div>
                  <div className="text-xs">
                    <span className="text-earth-muted">Trend equation: </span>
                    y = {trend.sen_slope ?? '—'} × (year − {trend.base_year}) +{' '}
                    {trend.intercept ?? '—'} {trend.unit}
                  </div>
                  <div className="text-xs">
                    <span className="text-earth-muted">Test statistics: </span>
                    p = {trend.p_value ?? '—'}, τ = {trend.tau ?? '—'}, n = {trend.n_years}
                  </div>
                  <div className="well break-all px-2.5 py-2 font-mono text-[11px] text-earth-slate">
                    Reproduce: {reproQuery}
                  </div>
                </ProofRow>
              </div>
            )}
          </section>

          {chain && (
            <ChainFlow
              chain={chain}
              activeVariable={variableParam}
              onSelectVariable={(vCode) => updateQuery({ variable: vCode })}
            />
          )}
        </div>
      )}
    </div>
  );
};
