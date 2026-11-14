import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import {
  ComparePairResponseDto,
  GeoObjectDto,
  ObjectTrendTableRowDto,
  VariableDto,
} from '../types/api';
import { TrendChart } from '../components/TrendChart';
import { TrendBadge } from '../components/TrendBadge';

export const ComparePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const variableParam = searchParams.get('variable') || 'precipitation';
  const fromParam = Number(searchParams.get('from') || 2000);
  const toParam = Number(searchParams.get('to') || 2025);

  const [variables, setVariables] = useState<VariableDto[]>([]);
  const [objects, setObjects] = useState<GeoObjectDto[]>([]);
  const [objectA, setObjectA] = useState<string>(
    () => searchParams.get('objectA') || 'chuy_reg',
  );
  const [objectB, setObjectB] = useState<string>(
    () => searchParams.get('objectB') || 'batken_reg',
  );
  const [isAutoMode, setIsAutoMode] = useState<boolean>(
    () => !(searchParams.get('objectA') && searchParams.get('objectB')),
  );

  const [pairData, setPairData] = useState<ComparePairResponseDto | null>(null);
  const [tableRows, setTableRows] = useState<ObjectTrendTableRowDto[]>([]);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [pairLoading, setPairLoading] = useState<boolean>(true);
  const [tableLoading, setTableLoading] = useState<boolean>(true);
  const [pairError, setPairError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([apiClient.getVariables(), apiClient.getObjects()])
      .then(([vars, objs]) => {
        setVariables(vars);
        setObjects(objs);
      })
      .catch((e) => setPairError(e.message));
  }, []);

  useEffect(() => {
    const a = searchParams.get('objectA');
    const b = searchParams.get('objectB');
    if (a && b) {
      setObjectA(a);
      setObjectB(b);
      setIsAutoMode(false);
    } else {
      setIsAutoMode(true);
    }
  }, [searchParams]);

  const pairRequestKey = isAutoMode
    ? `auto:${variableParam}:${fromParam}:${toParam}`
    : `manual:${variableParam}:${objectA}:${objectB}:${fromParam}:${toParam}`;

  useEffect(() => {
    let cancelled = false;
    setPairLoading(true);
    setPairError(null);
    setPairData(null);

    const promise = isAutoMode
      ? apiClient.getCompareAuto({ variable: variableParam, from: fromParam, to: toParam })
      : apiClient.getCompareManual({
          variable: variableParam,
          a: objectA,
          b: objectB,
          from: fromParam,
          to: toParam,
        });

    promise
      .then((res) => {
        if (cancelled) return;
        setPairData(res);
        setObjectA(res.object_a.series.object_code);
        setObjectB(res.object_b.series.object_code);
      })
      .catch((e) => {
        if (!cancelled) setPairError(e.message);
      })
      .finally(() => {
        if (!cancelled) setPairLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pairRequestKey]);

  useEffect(() => {
    let cancelled = false;
    setTableLoading(true);
    setTableError(null);
    setTableRows([]);

    apiClient
      .getTrendsTable({ variable: variableParam, from: fromParam, to: toParam })
      .then((rows) => {
        if (!cancelled) setTableRows(rows);
      })
      .catch((e) => {
        if (!cancelled) setTableError(e.message);
      })
      .finally(() => {
        if (!cancelled) setTableLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [variableParam, fromParam, toParam]);

  const sectionForVariable = (code: string) =>
    variables.find((v) => v.code === code)?.section ?? 'water';

  const updateQuery = (overrides: {
    variable?: string;
    from?: number;
    to?: number;
    nextObjectA?: string | null;
    nextObjectB?: string | null;
  }) => {
    const next = new URLSearchParams();
    next.set('variable', overrides.variable ?? variableParam);
    next.set('from', String(overrides.from ?? fromParam));
    next.set('to', String(overrides.to ?? toParam));

    const nextA =
      overrides.nextObjectA === null
        ? null
        : overrides.nextObjectA ?? (isAutoMode ? null : objectA);
    const nextB =
      overrides.nextObjectB === null
        ? null
        : overrides.nextObjectB ?? (isAutoMode ? null : objectB);

    if (nextA && nextB) {
      next.set('objectA', nextA);
      next.set('objectB', nextB);
    }

    setSearchParams(next);
  };

  const updatePeriod = (nextFrom: number, nextTo: number) => {
    updateQuery({ from: nextFrom, to: nextTo });
  };

  const sortedRows = [...tableRows].sort((x, y) => {
    const aVal = x.sen_slope ?? 0;
    const bVal = y.sen_slope ?? 0;
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  return (
    <div className="mx-auto max-w-[1280px] space-y-4 px-4 py-6 sm:px-6">
      <section className="panel">
        <div className="panel-head flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="display-title">Regional contrast</h1>
            <p className="mt-1 max-w-2xl body-text">
              Find two regions with opposite significant trends, or pick a pair manually and
              compare them on a shared time axis.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAutoMode(true);
              updateQuery({ nextObjectA: null, nextObjectB: null });
            }}
            aria-pressed={isAutoMode}
            className="nasa-button"
          >
            Auto-pair opposite trends
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="label mb-1.5 block">Target parameter</label>
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
            <label className="label mb-1.5 block">Object A</label>
            <select
              value={objectA}
              onChange={(e) => {
                const next = e.target.value;
                setObjectA(next);
                setIsAutoMode(false);
                updateQuery({ nextObjectA: next, nextObjectB: objectB });
              }}
              className="nasa-field"
            >
              {objects.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label mb-1.5 block">Object B</label>
            <select
              value={objectB}
              onChange={(e) => {
                const next = e.target.value;
                setObjectB(next);
                setIsAutoMode(false);
                updateQuery({ nextObjectA: objectA, nextObjectB: next });
              }}
              className="nasa-field"
            >
              {objects.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label mb-1.5 block">Observation period</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={1990}
                max={toParam - 1}
                value={fromParam}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const next = Number(e.target.value);
                  if (Number.isFinite(next)) updatePeriod(next, toParam);
                }}
                className="nasa-field font-mono"
                aria-label="Comparison start year"
              />
              <input
                type="number"
                min={fromParam + 1}
                max={2025}
                value={toParam}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const next = Number(e.target.value);
                  if (Number.isFinite(next)) updatePeriod(fromParam, next);
                }}
                className="nasa-field font-mono"
                aria-label="Comparison end year"
              />
            </div>
          </div>
        </div>

        {!isAutoMode && objectA === objectB && (
          <div className="border-t border-earth-hairline bg-[#FDF6EC] px-6 py-2 text-xs text-[#7A3E0A]">
            Manual comparison needs two different objects. Choose another object for A or B.
          </div>
        )}

        {pairData && (
          <div className="flex flex-wrap items-center gap-2 border-t border-earth-hairline bg-earth-soft px-6 py-3 text-xs leading-relaxed text-earth-slate">
            <span className="chip">
              {pairData.selection_mode.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
            </span>
            <span>{pairData.comparison_summary}</span>
          </div>
        )}
      </section>

      {pairError && (
        <div className="panel panel-error px-4 py-3 text-sm">
          Data link error while loading the comparison pair: {pairError}
        </div>
      )}

      {tableError && (
        <div className="panel panel-error px-4 py-3 text-sm">
          Data link error while loading the screening table: {tableError}
        </div>
      )}

      {pairLoading && (
        <div className="panel px-4 py-10 text-center text-sm text-earth-muted">
          Loading the comparison pair and screening table…
        </div>
      )}

      {!pairLoading && !pairData && !pairError && (
        <div className="panel px-4 py-10 text-center text-sm text-earth-muted">
          No comparison pair is available for this parameter and period.
        </div>
      )}

      {pairData && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[pairData.object_a, pairData.object_b].map((item, idx) => (
            <div key={idx} className="panel space-y-3 p-5">
              <div className="flex items-start justify-between gap-2 border-b border-earth-hairline pb-3">
                <div>
                  <span className="label">Object {idx === 0 ? 'A' : 'B'}</span>
                  <h3 className="mt-1 text-lg font-semibold text-earth-ink">
                    {item.series.object_name}
                  </h3>
                </div>
                <TrendBadge trend={item.trend.trend} pValue={item.trend.p_value} />
              </div>

              <TrendChart series={item.series} trend={item.trend} height={260} />

              <p className="well px-3 py-2 text-xs leading-relaxed text-earth-slate">
                {item.trend.summary_text}
              </p>
            </div>
          ))}
        </div>
      )}

      <section className="panel">
        <div className="panel-head flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="section-title">All objects: risk-zone screening</h3>
            <p className="mt-0.5 text-xs text-earth-muted">
              Every station and region for the selected parameter, sorted by Sen slope.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSortAsc((v) => !v)}
            className="nasa-button-light"
          >
            Sort by Sen slope
          </button>
        </div>

        <div className="overflow-x-auto p-2">
          <table className="data-table">
            <thead>
              <tr>
                <th>Object or region</th>
                <th>Direction and significance</th>
                <th>Sen slope (rate)</th>
                <th>p-value</th>
                <th>Kendall tau</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tableLoading && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-earth-muted">
                    Loading the screening table…
                  </td>
                </tr>
              )}
              {!tableLoading && sortedRows.length === 0 && !tableError && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-earth-muted">
                    No objects are available for this parameter and period.
                  </td>
                </tr>
              )}
              {!tableLoading &&
                sortedRows.map((row) => (
                <tr key={row.object_code}>
                  <td className="font-medium text-earth-ink">{row.object_name}</td>
                  <td>
                    <TrendBadge trend={row.trend} pValue={row.p_value} />
                  </td>
                  <td className="font-mono text-earth-ink">
                    {row.sen_slope !== null
                      ? `${row.sen_slope > 0 ? '+' : ''}${row.sen_slope} ${row.unit}/yr`
                      : '—'}
                  </td>
                  <td className="font-mono text-earth-slate">{row.p_value ?? '—'}</td>
                  <td className="font-mono text-earth-slate">{row.tau ?? '—'}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/explore?section=${sectionForVariable(variableParam)}&mode=${
                            row.object_type === 'region' ? 'region' : 'object'
                          }&object=${row.object_code}&variable=${variableParam}&from=${fromParam}&to=${toParam}`
                        )
                      }
                      className="text-[13px] font-medium text-earth-blue hover:underline"
                    >
                      Open analysis
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
