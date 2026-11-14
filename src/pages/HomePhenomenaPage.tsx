import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import {
  PhenomenonDto,
  PhenomenonMapResponseDto,
  PhenomenonObjectDetailDto,
  VariableDto,
} from '../types/api';
import { KyrgyzstanMap } from '../components/KyrgyzstanMap';
import { TrendBadge } from '../components/TrendBadge';
import { DualSeriesChart } from '../components/DualSeriesChart';
import { HumanAnswersStrip } from '../components/HumanAnswersStrip';

export const HomePhenomenaPage: React.FC = () => {
  const navigate = useNavigate();
  const [phenomena, setPhenomena] = useState<PhenomenonDto[]>([]);
  const [variables, setVariables] = useState<VariableDto[]>([]);
  const [selectedPhenomenon, setSelectedPhenomenon] = useState<string>('global_warming');
  const [fromYear, setFromYear] = useState<number>(2000);
  const [toYear, setToYear] = useState<number>(2025);

  const [mapData, setMapData] = useState<PhenomenonMapResponseDto | null>(null);
  const [selectedObjectCode, setSelectedObjectCode] = useState<string>('issyk_kul');
  const [detail, setDetail] = useState<PhenomenonObjectDetailDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getPhenomena()
      .then((list) => {
        setPhenomena(list);
        if (list.length > 0) setSelectedPhenomenon(list[0].code);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    apiClient
      .getVariables()
      .then(setVariables)
      .catch(() => setVariables([]));
  }, []);

  useEffect(() => {
    if (!selectedPhenomenon) return;
    setLoading(true);
    setError(null);
    apiClient
      .getPhenomenonMap(selectedPhenomenon, fromYear, toYear)
      .then((res) => {
        setMapData(res);
        const firstCode = res.objects[0]?.object_code || 'issyk_kul';
        setSelectedObjectCode((prev) =>
          res.objects.some((o) => o.object_code === prev) ? prev : firstCode
        );
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedPhenomenon, fromYear, toYear]);

  useEffect(() => {
    if (!selectedPhenomenon || !selectedObjectCode) return;
    apiClient
      .getPhenomenonObjectDetail(selectedPhenomenon, selectedObjectCode, fromYear, toYear)
      .then(setDetail)
      .catch((e) => setError(e.message));
  }, [selectedPhenomenon, selectedObjectCode, fromYear, toYear]);

  const selectedStation = mapData?.objects.find((o) => o.object_code === selectedObjectCode);
  const displayName = (value: string) =>
    value === value.toUpperCase()
      ? value.charAt(0) + value.slice(1).toLowerCase()
      : value;
  const fmtP = (v: number | null) =>
    v === null ? '—' : v < 0.001 ? '<0.001' : v.toFixed(4);
  const sectionForVariable = (code: string) =>
    variables.find((v) => v.code === code)?.section ?? 'water';

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
      <section className="panel">
        <div className="panel-head flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="display-title">Global phenomena and station map</h1>
            <p className="mt-1 max-w-2xl body-text">
              Link planetary-scale Earth system forcing to hydro-climatic station telemetry
              across Kyrgyzstan.
            </p>
          </div>

          <div className="flex items-end gap-2">
            <label className="block">
              <span className="label mb-1 block">From</span>
              <input
                type="number"
                min={1995}
                max={toYear - 5}
                value={fromYear}
                onChange={(e) => setFromYear(Number(e.target.value))}
                className="nasa-field w-24"
                aria-label="Start year"
              />
            </label>
            <span className="pb-2 text-xs text-earth-muted">to</span>
            <label className="block">
              <span className="label mb-1 block">To</span>
              <input
                type="number"
                min={fromYear + 5}
                max={2025}
                value={toYear}
                onChange={(e) => setToYear(Number(e.target.value))}
                className="nasa-field w-24"
                aria-label="End year"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 px-6 py-3">
          <span className="label mr-2">Phenomenon</span>
          {phenomena.map((p) => (
            <button
              key={p.code}
              onClick={() => setSelectedPhenomenon(p.code)}
              className={`rounded border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                selectedPhenomenon === p.code
                  ? 'border-earth-ink bg-earth-ink text-white'
                  : 'border-earth-line bg-earth-raised text-earth-slate hover:border-earth-muted/50 hover:text-earth-ink'
              }`}
            >
              {displayName(p.name)}
            </button>
          ))}
          {loading && (
            <span className="ml-auto text-xs text-earth-muted">Loading…</span>
          )}
        </div>

        {mapData && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-earth-hairline px-6 py-3">
            <p className="max-w-3xl text-xs leading-relaxed text-earth-slate">
              {mapData.phenomenon.description}
            </p>
            <span className="chip">
              Global driver:{' '}
              <strong className="font-medium text-earth-ink">
                {mapData.phenomenon.global_variable_name}
              </strong>{' '}
              [{mapData.phenomenon.global_unit}]
            </span>
          </div>
        )}
      </section>

      {error && (
        <div className="panel panel-error mt-4 px-4 py-3 text-sm">
          Data link error: {error}
        </div>
      )}

      {detail && (
        <div className="mt-4">
          <HumanAnswersStrip trend={detail.local_trend} />
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-7 xl:col-span-8">
          <KyrgyzstanMap
            mode="phenomena"
            phenomenaObjects={mapData?.objects || []}
            selectedObjectCode={selectedObjectCode}
            onSelectObject={setSelectedObjectCode}
          />

          <div className="grid grid-cols-2 divide-x divide-earth-hairline rounded border border-earth-line bg-earth-raised sm:grid-cols-4">
            <div className="px-4 py-3">
              <div className="label">Stations</div>
              <div className="mt-0.5 font-mono text-sm font-medium text-earth-ink">
                {mapData?.objects.length ?? 0}
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="label">Significant</div>
              <div className="mt-0.5 font-mono text-sm font-medium text-earth-ink">
                {mapData?.objects.filter((o) => o.is_significant).length ?? 0}
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="label">Period</div>
              <div className="mt-0.5 font-mono text-sm font-medium text-earth-ink">
                {fromYear}–{toYear}
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="label">Basemap</div>
              <div className="mt-0.5 text-sm font-medium text-earth-ink">Esri Imagery</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-earth-muted">
            <span>Marker color shows trend direction. Stations without a significant trend are muted.</span>
            <span>WGS84 / EPSG:4326</span>
          </div>
        </div>

        <aside className="panel lg:col-span-5 xl:col-span-4">
          {detail ? (
            <>
              <div className="flex items-start justify-between gap-3 border-b border-earth-hairline px-5 py-4">
                <div className="min-w-0">
                  <div className="label">Station detail</div>
                  <h2 className="mt-1 truncate text-lg font-semibold text-earth-ink">
                    {detail.object_name}
                  </h2>
                  <div className="mt-0.5 truncate text-xs text-earth-muted">
                    {detail.local_trend.variable_name}
                  </div>
                </div>
                <TrendBadge trend={detail.local_trend.trend} pValue={detail.local_trend.p_value} />
              </div>

              <div className="border-b border-earth-hairline bg-earth-soft px-5 py-3 text-xs leading-relaxed text-earth-slate">
                {detail.explanation_note}
              </div>

              <div className="grid grid-cols-1 divide-y divide-earth-hairline border-b border-earth-hairline sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="px-4 py-3">
                  <div className="label">Local parameter</div>
                  <div className="mt-1 truncate text-xs font-medium text-earth-ink">
                    {detail.local_trend.variable_name}
                  </div>
                  <div className="mt-2 font-mono text-lg font-medium text-earth-ink">
                    {detail.local_trend.sen_slope !== null
                      ? `${detail.local_trend.sen_slope > 0 ? '+' : ''}${detail.local_trend.sen_slope}`
                      : '—'}
                    <span className="ml-1 text-[11px] font-normal text-earth-muted">
                      {detail.local_trend.unit}/yr
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-earth-muted">
                    p = {fmtP(detail.local_trend.p_value)}
                  </div>
                </div>

                <div className="px-4 py-3">
                  <div className="label">Global NOAA indicator</div>
                  <div className="mt-1 truncate text-xs font-medium text-earth-ink">
                    {detail.global_trend.variable_name}
                  </div>
                  <div className="mt-2 font-mono text-lg font-medium text-earth-hydro">
                    {detail.global_trend.sen_slope !== null
                      ? `+${detail.global_trend.sen_slope}`
                      : '—'}
                    <span className="ml-1 text-[11px] font-normal text-earth-muted">
                      {detail.global_trend.unit}/yr
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-earth-muted">
                    p = {fmtP(detail.global_trend.p_value)}
                  </div>
                </div>
              </div>

              <div className="p-4">
                <DualSeriesChart
                  localSeries={detail.local_series}
                  globalSeries={detail.global_series}
                  fromYear={fromYear}
                  toYear={toYear}
                  localUnit={detail.local_trend.unit}
                  globalUnit={detail.global_trend.unit}
                  localLabel={detail.object_name}
                  globalLabel={detail.global_trend.variable_name}
                  height={190}
                />
              </div>

              {selectedStation && (
                <div className="border-t border-earth-hairline px-5 py-2.5 text-xs leading-relaxed text-earth-muted">
                  {selectedStation.short_note}
                </div>
              )}

              <div className="border-t border-earth-hairline p-4">
                <button
                  onClick={() =>
                    navigate(
                      `/explore?section=${sectionForVariable(detail.local_trend.variable_code)}&object=${detail.object_code}&variable=${detail.local_trend.variable_code}&from=${fromYear}&to=${toYear}`
                    )
                  }
                  className="nasa-button w-full"
                >
                  Open full trend analysis
                </button>
              </div>
            </>
          ) : (
            <div className="px-4 py-10 text-center text-sm text-earth-muted">
              Select a highlighted station on the map
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
