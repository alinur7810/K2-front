# Frontend–Backend Integration Contract

**Project:** Kyrgyzstan Earth System Trend Detective  
**Frontend stack:** React 18, TypeScript, Vite 5, Tailwind CSS 3, Leaflet  
**Backend target:** JSON API under `/api/v1` (FastAPI is assumed by the project brief)  
**Last updated:** 2026-11-14

This document is the handoff contract between the frontend and backend. It describes what the frontend already calls, what it expects in each response, and how to verify the connection.

The frontend currently runs in **sample mode** by default so the UI can be demonstrated without a backend. Live API support is already implemented in `src/api/client.ts`.

---

## 1. Source of truth

The canonical request/response shapes are defined in:

- `src/types/api.ts` — TypeScript DTOs and enums.
- `src/api/client.ts` — every HTTP request, query parameter, and mock/live switch.
- `src/api/mockStubs.ts` — working sample responses for every endpoint.

If a proposed backend field differs from `src/types/api.ts`, treat the TypeScript file as the current frontend contract. Do not silently rename fields. Agree on a change first.

---

## 2. Running the frontend

### Requirements

- Node.js 18 or newer
- npm

### Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### Build

```bash
npm run build
```

Output is written to `dist/`.

### Preview a production build

```bash
npm run preview
```

The preview server runs on `http://localhost:4173`.

---

## 3. Sample mode and live mode

### Default behavior

`VITE_USE_MOCKS` defaults to `true`. In this mode the UI uses `src/api/mockStubs.ts` and does not call the network.

The header button displays:

- **Sample data** — mock mode
- **Live data** — real API mode

The selected mode is stored in browser `localStorage` under:

```text
est:data-source
```

Values are `sample` or `live`.

### Switching modes

Clicking the header button:

1. Updates the client mode.
2. Saves it to `localStorage`.
3. Remounts the current route so the page refetches with the new source.

To reset the stored choice and return to the environment default:

```js
localStorage.removeItem('est:data-source');
location.reload();
```

### Environment variables

Create `.env.local` for local live-backend work:

```env
VITE_USE_MOCKS=false
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY_TARGET=http://localhost:8000
```

| Variable | Used by | Meaning |
|---|---|---|
| `VITE_USE_MOCKS` | `src/api/client.ts` | `true` uses sample data; `false` calls the API. Defaults to `true`. |
| `VITE_API_BASE_URL` | `src/api/client.ts` | API prefix. Defaults to `/api/v1`. Use a full URL if the frontend is not proxied. |
| `VITE_API_PROXY_TARGET` | `vite.config.ts` | Development proxy target for `/api`. Defaults to `http://localhost:8000`. |

`VITE_API_BASE_URL` and `VITE_USE_MOCKS` are compiled into the client bundle. Restart `npm run dev` after changing them.

`localStorage` overrides the environment default. If the header says “Sample data” after you set `VITE_USE_MOCKS=false`, remove `est:data-source` and reload.

### Development proxy

During `npm run dev`, requests to `/api/*` are proxied to `VITE_API_PROXY_TARGET` (default `http://localhost:8000`). The frontend calls `/api/v1/...`; the backend should expose the same `/api/v1` prefix.

### Production hosting

For a static build:

```bash
VITE_USE_MOCKS=false VITE_API_BASE_URL=https://api.example.com/api/v1 npm run build
```

If the frontend and API share an origin and a reverse proxy forwards `/api`, `VITE_API_BASE_URL=/api/v1` is enough.

When using a separate origin, the backend must allow CORS from the frontend origin for `GET` requests and expose CSV downloads.

---

## 4. Frontend routes and data flow

| Route | Page | What it does | API calls |
|---|---|---|---|
| `/` | `HomePhenomenaPage` | Shows global phenomena, a Kyrgyzstan station map, and station detail | `/phenomena`, `/variables`, `/phenomena/{code}/map`, `/phenomena/{code}/objects/{object}` |
| `/explore` | `ExploreResultPage` | Station/point trend analysis, chart, proof, chain, CSV | `/sections`, `/objects`, `/variables`, `/series`, `/trend`, `/chain`, `/export.csv` |
| `/compare` | `ComparePage` | Auto or manual regional contrast and screening table | `/variables`, `/objects`, `/compare/auto`, `/compare`, `/trends` |

### Home flow

1. Load phenomena.
2. Load phenomena map for the selected phenomenon and year range.
3. Select the first map object unless the current selection still exists.
4. Load station detail for the selected object.
5. “Open full trend analysis” navigates to `/explore` with the station, variable, and resolved section.

The frontend resolves the section from `/variables` (without filters). `/variables` must therefore return all variables when no `section`/`object` filter is supplied.

### Explore flow

1. Load sections and objects.
2. Load variables for the selected section and object.
3. Load series, trend, and chain in parallel.
4. In point mode, send `lat` and `lon` instead of `object` to `/series`, `/trend`, and `/chain`.

Explore URL query parameters:

```text
section, object, variable, from, to, lat, lon
```

Example:

```text
/explore?section=water&object=issyk_kul&variable=water_level&from=2000&to=2025
/explore?section=water&variable=water_level&from=2000&to=2025&lat=41.5&lon=75.0
```

### Compare flow

1. Load all variables and all objects.
2. Load an automatic pair or a manually selected pair.
3. Load the screening table for the selected variable.
4. Backend errors are displayed in a visible error panel.

---

## 5. Transport rules

### Base path

All endpoints are under `/api/v1`.

### Method

All endpoints are `GET`.

### Authentication

None in the current frontend. Do not add API keys to the browser bundle.

### Content type

JSON responses must use:

```http
Content-Type: application/json
```

CSV responses must use:

```http
Content-Type: text/csv
Content-Disposition: attachment; filename="trend-export.csv"
```

### Success status

Use `200 OK` for successful responses.

### Error shape

The frontend reads this shape:

```json
{
  "code": "OBJECT_NOT_FOUND",
  "message": "No object with code issyk_kul"
}
```

`code` is a stable machine-readable string. `message` is shown to the user.

For errors, use an appropriate `4xx` or `5xx` status. The frontend falls back to:

```json
{
  "code": "HTTP_422",
  "message": "Server response error (422)"
}
```

FastAPI’s default validation response is `{"detail": [...]}`. If you want useful validation messages in the UI, add an exception handler that converts errors to `{code, message}`.

### Dates

- Monthly observation dates use `YYYY-MM-01`.
- `date_from` and `date_to` use `YYYY-MM-DD`.
- `from` and `to` query parameters are integer years.
- `from` must be less than `to`.

### Coordinates

All coordinates are WGS84 / EPSG:4326.

`marker` is always:

```json
[latitude, longitude]
```

Do not send `[longitude, latitude]`.

### Numbers and nulls

- Missing observations use `null`, not `0`, `-9999`, or an empty string.
- `p_value`, `tau`, `sen_slope`, `slope_ci`, and `intercept` may be `null` when a test cannot run.
- Shares (`missing_share`, `filled_share`, `outlier_share`) are fractions from `0` to `1`, not percentages.

### Units

The UI formats certain units specially:

- `m`
- `°C`
- `%`
- units ending in `/yr`

Use these canonical strings when they apply. `mm/yr`, `cm`, `ppm`, and `index` are also used. Avoid `C`, `degC`, `pct`, or `percent` if you want the intended formatting.

### Display names

Return display-ready names. Sentence case is preferred for UI copy. The frontend only normalizes phenomenon names that arrive entirely uppercase.

---

## 6. Endpoint reference

### 6.1 `GET /api/v1/sections`

Returns all sections.

Response: `SectionDto[]`

```json
[
  {
    "code": "water",
    "name": "Water and hydrology",
    "order": 1,
    "description": "Lake and reservoir levels, river runoff"
  }
]
```

Section codes used by the UI:

```text
water
glaciers
climate
vegetation
```

### 6.2 `GET /api/v1/objects`

Optional query parameters:

| Parameter | Type | Meaning |
|---|---|---|
| `section` | string | Filter by section |
| `type` | string | Filter by object type |

The current UI calls this without filters.

Response: `GeoObjectDto[]`

### 6.3 `GET /api/v1/variables`

Optional query parameters:

| Parameter | Type | Meaning |
|---|---|---|
| `section` | string | Filter by section |
| `object` | string | Filter by available object |

The Home page calls this **without filters** and expects the complete variable catalogue.

Response: `VariableDto[]`

### 6.4 `GET /api/v1/series`

Query parameters:

| Parameter | Required | Meaning |
|---|---|---|
| `object` | one of `object` or `lat`+`lon` | Object code |
| `lat` | one of `object` or `lat`+`lon` | WGS84 latitude |
| `lon` | one of `object` or `lat`+`lon` | WGS84 longitude |
| `variable` | yes | Variable code |
| `from` | yes | Start year |
| `to` | yes | End year |

Response: `SeriesResponseDto`

`monthly` and `yearly` are both required by the chart.

### 6.5 `GET /api/v1/trend`

Same query parameters as `/series`.

Response: `TrendResponseDto`

The UI uses the Mann–Kendall result to render the verdict, confidence, Sen slope, and proof panel.

### 6.6 `GET /api/v1/chain`

Query parameters:

| Parameter | Required | Meaning |
|---|---|---|
| `object` | one of `object` or `lat`+`lon` | Object code |
| `lat` | one of `object` or `lat`+`lon` | WGS84 latitude |
| `lon` | one of `object` or `lat`+`lon` | WGS84 longitude |
| `variable` | yes | Target variable |
| `from` | yes | Start year |
| `to` | yes | End year |

Response: `ChainResponseDto`

The frontend sends `lat`/`lon` in point mode. The backend must support this, not only `object`.

For a point request, return a synthetic stable code/name, for example:

```json
{
  "object_code": "pt_41.50_75.00",
  "object_name": "Point 41.50 N, 75.00 E"
}
```

### 6.7 `GET /api/v1/phenomena`

Response: `PhenomenonDto[]`

At least one phenomenon is required for the Home page.

### 6.8 `GET /api/v1/phenomena/{code}/map`

Query parameters:

| Parameter | Required | Meaning |
|---|---|---|
| `from` | yes | Start year |
| `to` | yes | End year |

Response: `PhenomenonMapResponseDto`

Each object must include `marker`, `local_variable_code`, `trend`, `sen_slope`, `p_value`, `is_significant`, and `short_note`.

`normalized_slope` is part of the current contract. The UI currently uses marker color for direction and does not use `normalized_slope` for radius; send it anyway for compatibility and future use.

### 6.9 `GET /api/v1/phenomena/{code}/objects/{object}`

Query parameters:

| Parameter | Required | Meaning |
|---|---|---|
| `from` | yes | Start year |
| `to` | yes | End year |

Response: `PhenomenonObjectDetailDto`

This response drives the Home station panel and the local/global comparison chart. `local_series` and `global_series` are yearly arrays.

### 6.10 `GET /api/v1/compare/auto`

Query parameters:

| Parameter | Required | Meaning |
|---|---|---|
| `variable` | yes | Variable code |
| `from` | yes | Start year |
| `to` | yes | End year |
| `type` | no | Optional object-type filter |

Response: `ComparePairResponseDto`

The current UI does not send `type`.

### 6.11 `GET /api/v1/compare`

Query parameters:

| Parameter | Required | Meaning |
|---|---|---|
| `variable` | yes | Variable code |
| `a` | yes | Object A code |
| `b` | yes | Object B code |
| `from` | yes | Start year |
| `to` | yes | End year |

Response: `ComparePairResponseDto`

### 6.12 `GET /api/v1/trends`

Query parameters:

| Parameter | Required | Meaning |
|---|---|---|
| `variable` | yes | Variable code |
| `from` | yes | Start year |
| `to` | yes | End year |
| `type` | no | Optional object-type filter |

Response: `ObjectTrendTableRowDto[]`

The UI sorts the returning rows client-side by `sen_slope`.

### 6.13 `GET /api/v1/export.csv`

Query parameters are the same as `/series`: `object` or `lat` + `lon`, plus `variable`, `from`, and `to`.

Response: CSV attachment.

The current UI disables the export button in sample mode. In live mode it links directly to this URL.

---

## 7. DTO definitions

These match `src/types/api.ts` and are the exact field names expected by the frontend.

```ts
export type SectionCode = 'water' | 'glaciers' | 'climate' | 'vegetation';

export type ObjectType =
  | 'lake'
  | 'reservoir'
  | 'river_basin'
  | 'glacier'
  | 'region'
  | 'point'
  | 'global';

export type ObservationQuality = 'ok' | 'filled' | 'outlier';

export type TrendDirection =
  | 'increasing'
  | 'decreasing'
  | 'no_trend'
  | 'weak_increasing'
  | 'weak_decreasing'
  | 'insufficient_data';

export type ChainLinkStatus = 'confirmed' | 'unconfirmed' | 'no_data';

export interface SectionDto {
  code: SectionCode;
  name: string;
  order: number;
  description?: string;
}

export interface GeoObjectDto {
  code: string;
  type: ObjectType;
  name: string;
  parent?: string | null;
  marker: [number, number];
  geom?: GeoJSON.Geometry | null;
}

export interface VariableDto {
  code: string;
  section: SectionCode;
  name: string;
  unit: string;
  yearly_agg: 'mean' | 'sum' | 'max';
  season_months?: number[] | null;
  direction_note?: string | null;
  is_proxy?: boolean;
  proxy_explanation?: string | null;
  available_from?: number;
  available_to?: number;
}

export interface SourceMetaDto {
  code: string;
  name: string;
  dataset_id: string;
  url: string;
  license: string;
  citation: string;
  spatial_resolution?: string;
}

export interface ObservationPointDto {
  date: string;
  value: number | null;
  quality: ObservationQuality;
}

export interface YearlyPointDto {
  year: number;
  value: number | null;
  valid_months?: number;
}

export interface SeriesResponseDto {
  object_code: string;
  object_name: string;
  variable_code: string;
  variable_name: string;
  unit: string;
  yearly_agg: 'mean' | 'sum' | 'max';
  date_from: string;
  date_to: string;
  is_proxy: boolean;
  proxy_note?: string | null;
  missing_share: number;
  filled_share: number;
  outlier_share: number;
  source: SourceMetaDto;
  monthly: ObservationPointDto[];
  yearly: YearlyPointDto[];
}

export interface TrendResponseDto {
  status: 'ok' | 'insufficient_data';
  object_code: string;
  object_name: string;
  variable_code: string;
  variable_name: string;
  from_year: number;
  to_year: number;
  trend: TrendDirection;
  p_value: number | null;
  tau: number | null;
  sen_slope: number | null;
  slope_ci: [number, number] | null;
  intercept: number | null;
  base_year: number;
  unit: string;
  n_years: number;
  method: string;
  missing_share: number;
  is_proxy: boolean;
  proxy_note?: string | null;
  summary_text: string;
  source: SourceMetaDto;
  computed_at?: string;
}

export interface ChainLinkDto {
  order: number;
  variable_code: string;
  variable_name: string;
  unit: string;
  is_proxy: boolean;
  expected_relation: '+' | '-';
  explanation_text: string;
  status: ChainLinkStatus;
  trend: TrendDirection;
  sen_slope: number | null;
  p_value: number | null;
  spearman_r_prev: number | null;
  spearman_p_prev: number | null;
  yearly_sparkline: YearlyPointDto[];
}

export interface ChainResponseDto {
  section: SectionCode;
  object_code: string;
  object_name: string;
  target_variable: string;
  from_year: number;
  to_year: number;
  chain_name: string;
  summary_caution_text: string;
  links: ChainLinkDto[];
}

export interface PhenomenonDto {
  code: string;
  name: string;
  description: string;
  global_variable_name: string;
  global_unit: string;
}

export interface PhenomenonMapObjectDto {
  object_code: string;
  object_name: string;
  object_type: ObjectType;
  marker: [number, number];
  local_variable_code: string;
  local_variable_name: string;
  unit: string;
  trend: TrendDirection;
  sen_slope: number | null;
  normalized_slope: number;
  p_value: number | null;
  is_significant: boolean;
  short_note: string;
}

export interface PhenomenonMapResponseDto {
  phenomenon: PhenomenonDto;
  from_year: number;
  to_year: number;
  objects: PhenomenonMapObjectDto[];
}

export interface PhenomenonObjectDetailDto {
  phenomenon: PhenomenonDto;
  object_code: string;
  object_name: string;
  from_year: number;
  to_year: number;
  explanation_note: string;
  local_series: YearlyPointDto[];
  local_trend: TrendResponseDto;
  global_series: YearlyPointDto[];
  global_trend: TrendResponseDto;
}

export interface ComparePairResponseDto {
  variable_code: string;
  variable_name: string;
  unit: string;
  from_year: number;
  to_year: number;
  selection_mode: 'opposite_significant' | 'fastest_vs_most_stable' | 'manual';
  comparison_summary: string;
  object_a: {
    series: SeriesResponseDto;
    trend: TrendResponseDto;
  };
  object_b: {
    series: SeriesResponseDto;
    trend: TrendResponseDto;
  };
}

export interface ObjectTrendTableRowDto {
  object_code: string;
  object_name: string;
  object_type: ObjectType;
  trend: TrendDirection;
  sen_slope: number | null;
  p_value: number | null;
  tau: number | null;
  n_years: number;
  unit: string;
}
```

---

## 8. Abbreviated response examples

The arrays below are shortened for readability. Real responses should cover the complete requested year range.

### 8.1 Series

```json
{
  "object_code": "issyk_kul",
  "object_name": "Lake Issyk-Kul",
  "variable_code": "water_level",
  "variable_name": "Surface water elevation",
  "unit": "m",
  "yearly_agg": "mean",
  "date_from": "2023-01-01",
  "date_to": "2025-12-01",
  "is_proxy": false,
  "proxy_note": null,
  "missing_share": 0.02,
  "filled_share": 0.01,
  "outlier_share": 0.0,
  "source": {
    "code": "hydroweb",
    "name": "Hydroweb.next (Theia / CNES)",
    "dataset_id": "HYDROWEB_LAKES_OPE_V2",
    "url": "https://hydroweb.next.theia-land.fr/",
    "license": "Etalab Open Licence 2.0",
    "citation": "Cretaux et al., LEGOS/CNES Hydroweb Satellite Altimetry Database",
    "spatial_resolution": "Satellite altimetry track"
  },
  "monthly": [
    { "date": "2023-01-01", "value": 1606.85, "quality": "ok" },
    { "date": "2023-02-01", "value": 1606.84, "quality": "ok" },
    { "date": "2023-03-01", "value": 1606.82, "quality": "filled" }
  ],
  "yearly": [
    { "year": 2023, "value": 1606.80, "valid_months": 12 },
    { "year": 2024, "value": 1606.75, "valid_months": 12 },
    { "year": 2025, "value": 1606.70, "valid_months": 12 }
  ]
}
```

### 8.2 Trend

```json
{
  "status": "ok",
  "object_code": "issyk_kul",
  "object_name": "Lake Issyk-Kul",
  "variable_code": "water_level",
  "variable_name": "Surface water elevation",
  "from_year": 2000,
  "to_year": 2025,
  "trend": "decreasing",
  "p_value": 0.0034,
  "tau": -0.48,
  "sen_slope": -0.022,
  "slope_ci": [-0.031, -0.014],
  "intercept": 1607.26,
  "base_year": 2000,
  "unit": "m",
  "n_years": 26,
  "method": "Hamed-Rao Modified Mann-Kendall",
  "missing_share": 0.02,
  "is_proxy": false,
  "proxy_note": null,
  "summary_text": "A statistically significant decreasing trend of -0.022 m per year was found over 2000-2025.",
  "source": {
    "code": "hydroweb",
    "name": "Hydroweb.next (Theia / CNES)",
    "dataset_id": "HYDROWEB_LAKES_OPE_V2",
    "url": "https://hydroweb.next.theia-land.fr/",
    "license": "Etalab Open Licence 2.0",
    "citation": "Cretaux et al., LEGOS/CNES Hydroweb Satellite Altimetry Database",
    "spatial_resolution": "Satellite altimetry track"
  },
  "computed_at": "2026-01-15T10:00:00Z"
}
```

The Sen line is drawn as:

```text
value = intercept + sen_slope * (year - base_year)
```

### 8.3 Chain

```json
{
  "section": "water",
  "object_code": "issyk_kul",
  "object_name": "Lake Issyk-Kul",
  "target_variable": "water_level",
  "from_year": 2000,
  "to_year": 2025,
  "chain_name": "Hydrological balance of an endorheic mountain lake",
  "summary_caution_text": "The observed lake-level decline is consistent with rising air temperature and increased evaporation losses.",
  "links": [
    {
      "order": 1,
      "variable_code": "air_temp",
      "variable_name": "Near-surface air temperature",
      "unit": "°C",
      "is_proxy": false,
      "expected_relation": "+",
      "explanation_text": "Rising temperature accelerates melt and increases evaporative potential.",
      "status": "confirmed",
      "trend": "increasing",
      "sen_slope": 0.048,
      "p_value": 0.0021,
      "spearman_r_prev": null,
      "spearman_p_prev": null,
      "yearly_sparkline": [
        { "year": 2023, "value": 6.20 },
        { "year": 2024, "value": 6.25 },
        { "year": 2025, "value": 6.30 }
      ]
    },
    {
      "order": 2,
      "variable_code": "water_level",
      "variable_name": "Surface water elevation",
      "unit": "m",
      "is_proxy": false,
      "expected_relation": "-",
      "explanation_text": "The water balance is expressed as a sustained decline in level.",
      "status": "confirmed",
      "trend": "decreasing",
      "sen_slope": -0.022,
      "p_value": 0.0034,
      "spearman_r_prev": -0.71,
      "spearman_p_prev": 0.0008,
      "yearly_sparkline": [
        { "year": 2023, "value": 1606.80 },
        { "year": 2024, "value": 1606.75 },
        { "year": 2025, "value": 1606.70 }
      ]
    }
  ]
}
```

### 8.4 Phenomenon map

```json
{
  "phenomenon": {
    "code": "global_warming",
    "name": "Global warming",
    "description": "Link between the global temperature anomaly and the water balance of lakes and reservoirs.",
    "global_variable_name": "Global Temperature Anomaly (NOAA GlobalTemp)",
    "global_unit": "°C"
  },
  "from_year": 2000,
  "to_year": 2025,
  "objects": [
    {
      "object_code": "issyk_kul",
      "object_name": "Lake Issyk-Kul",
      "object_type": "lake",
      "marker": [42.45, 77.25],
      "local_variable_code": "water_level",
      "local_variable_name": "Surface water elevation",
      "unit": "m",
      "trend": "decreasing",
      "sen_slope": -0.022,
      "normalized_slope": -0.82,
      "p_value": 0.0034,
      "is_significant": true,
      "short_note": "Level decline driven by rising evaporation"
    }
  ]
}
```

### 8.5 Phenomenon object detail

```json
{
  "phenomenon": {
    "code": "global_warming",
    "name": "Global warming",
    "description": "Link between the global temperature anomaly and the water balance of lakes and reservoirs.",
    "global_variable_name": "Global Temperature Anomaly (NOAA GlobalTemp)",
    "global_unit": "°C"
  },
  "object_code": "issyk_kul",
  "object_name": "Lake Issyk-Kul",
  "from_year": 2000,
  "to_year": 2025,
  "explanation_note": "The change in surface water elevation at Lake Issyk-Kul is consistent with the rise in the global temperature anomaly.",
  "local_series": [
    { "year": 2023, "value": 1606.80 },
    { "year": 2024, "value": 1606.75 },
    { "year": 2025, "value": 1606.70 }
  ],
  "local_trend": {
    "status": "ok",
    "object_code": "issyk_kul",
    "object_name": "Lake Issyk-Kul",
    "variable_code": "water_level",
    "variable_name": "Surface water elevation",
    "from_year": 2000,
    "to_year": 2025,
    "trend": "decreasing",
    "p_value": 0.0034,
    "tau": -0.48,
    "sen_slope": -0.022,
    "slope_ci": [-0.031, -0.014],
    "intercept": 1607.26,
    "base_year": 2000,
    "unit": "m",
    "n_years": 26,
    "method": "Hamed-Rao Modified Mann-Kendall",
    "missing_share": 0.02,
    "is_proxy": false,
    "summary_text": "A statistically significant decreasing trend was found.",
    "source": {
      "code": "hydroweb",
      "name": "Hydroweb.next (Theia / CNES)",
      "dataset_id": "HYDROWEB_LAKES_OPE_V2",
      "url": "https://hydroweb.next.theia-land.fr/",
      "license": "Etalab Open Licence 2.0",
      "citation": "Cretaux et al., LEGOS/CNES Hydroweb Satellite Altimetry Database"
    }
  },
  "global_series": [
    { "year": 2023, "value": 1.20 },
    { "year": 2024, "value": 1.25 },
    { "year": 2025, "value": 1.31 }
  ],
  "global_trend": {
    "status": "ok",
    "object_code": "global",
    "object_name": "Earth (NOAA GlobalTemp)",
    "variable_code": "noaa_global_temp",
    "variable_name": "Global Temperature Anomaly (NOAA GlobalTemp)",
    "from_year": 2000,
    "to_year": 2025,
    "trend": "increasing",
    "p_value": 0.0001,
    "tau": 0.82,
    "sen_slope": 0.024,
    "slope_ci": [0.019, 0.029],
    "intercept": 0.52,
    "base_year": 2000,
    "unit": "°C",
    "n_years": 26,
    "method": "Hamed-Rao Modified Mann-Kendall",
    "missing_share": 0.0,
    "is_proxy": false,
    "summary_text": "A statistically significant increasing trend was found.",
    "source": {
      "code": "noaa_globaltemp",
      "name": "NOAA Global Surface Temperature",
      "dataset_id": "NOAAGlobalTemp",
      "url": "https://www.ncei.noaa.gov/products/land-based-station/noaa-global-temp",
      "license": "Public domain",
      "citation": "NOAA National Centers for Environmental Information"
    }
  }
}
```

### 8.6 Compare pair

```json
{
  "variable_code": "precipitation",
  "variable_name": "Annual precipitation",
  "unit": "mm/yr",
  "from_year": 2000,
  "to_year": 2025,
  "selection_mode": "opposite_significant",
  "comparison_summary": "Chuy Region increases while Batken Region decreases.",
  "object_a": {
    "series": {},
    "trend": {}
  },
  "object_b": {
    "series": {},
    "trend": {}
  }
}
```

`object_a.series` and `object_a.trend` use the same shapes as `/series` and `/trend`. The same applies to `object_b`.

### 8.7 Trends table row

```json
[
  {
    "object_code": "chuy_reg",
    "object_name": "Chuy Region",
    "object_type": "region",
    "trend": "increasing",
    "sen_slope": 2.45,
    "p_value": 0.012,
    "tau": 0.44,
    "n_years": 26,
    "unit": "mm/yr"
  }
]
```

---

## 9. Field-level rules and UI dependencies

### Trend classification

The frontend treats a trend as insufficient when any of these is true:

- `status === 'insufficient_data'`
- `trend === 'insufficient_data'`
- `n_years < 10`

For a successful test:

- `status` is `"ok"`.
- `p_value < 0.05` is shown as a significant trend.
- `0.05 <= p_value < 0.1` is shown as a weak signal.
- `p_value >= 0.1` is shown as no clear trend.
- `sen_slope` is the rate per year in `unit`.
- `slope_ci` is the 95% confidence interval for the slope.
- `intercept` and `base_year` place the Sen line on the chart.
- `summary_text` is displayed directly in the proof panel and should be human-readable.

### Series arrays

The chart uses both arrays:

- `yearly` drives the annual line and points.
- `monthly` drives the thin seasonal line and quality markers.
- `yearly` should include every year in the selected window, using `value: null` for missing years.
- `monthly` should normally include 12 points per year.
- `quality` values:
  - `ok` — original valid observation
  - `filled` — interpolated value
  - `outlier` — excluded outlier

The quality-control panel counts `monthly` entries and calculates percentages from them.

### Source metadata

The proof panel displays:

- `source.dataset_id`
- `source.name`
- `source.url`
- `source.license`
- `source.citation`
- `source.spatial_resolution` (optional fallback is shown)

Provide all required fields for both `series.source` and `trend.source`.

### Proxy variables

When `is_proxy` is `true`:

- `proxy_note` / `proxy_explanation` should explain the proxy.
- The UI shows a “Proxy” badge.

### Phenomenon map

- `object_name` is shown on the callout. Short names are preferred for dense stations.
- `short_note` appears in the station panel.
- `is_significant` must agree with the trend/p-value.
- `normalized_slope` is currently stored but not used for marker radius. Send a value in `[-1, 1]`.
- `marker` order is `[lat, lon]`.

### Chain

- `links` are displayed in the order returned. Sort by `order`.
- `order` starts at `1`.
- `expected_relation` is `"+"` or `"-"`.
- `status` controls the badge: `confirmed`, `unconfirmed`, or `no_data`.
- `yearly_sparkline` should contain at least two non-null points to render.
- `spearman_r_prev` is `null` for the first link.
- `summary_caution_text` is displayed above the chain.

### Compare

- `object_a` and `object_b` must each contain a complete `series` and `trend`.
- `selection_mode` is displayed as a chip.
- `comparison_summary` is displayed above the two charts.

---

## 10. Backend implementation order

A practical order that makes the UI usable progressively:

1. `/sections`, `/objects`, `/variables`, `/phenomena`
2. `/series` and `/trend`
3. `/chain`
4. `/phenomena/{code}/map` and `/phenomena/{code}/objects/{object}`
5. `/compare/auto`, `/compare`, `/trends`
6. `/export.csv`

The Home page can render the map and station panel once steps 1, 3, and 4 are available. Explore becomes usable after step 2 and step 3. Compare is independent once steps 1 and 5 are available.

---

## 11. Verification checklist

### Start the backend

The backend should listen on `http://localhost:8000` and expose `/api/v1`.

Quick checks:

```bash
curl http://localhost:8000/api/v1/sections
curl http://localhost:8000/api/v1/objects
curl "http://localhost:8000/api/v1/variables"
curl http://localhost:8000/api/v1/phenomena
curl "http://localhost:8000/api/v1/phenomena/global_warming/map?from=2000&to=2025"
curl "http://localhost:8000/api/v1/series?object=issyk_kul&variable=water_level&from=2000&to=2025"
curl "http://localhost:8000/api/v1/trend?object=issyk_kul&variable=water_level&from=2000&to=2025"
curl "http://localhost:8000/api/v1/chain?object=issyk_kul&variable=water_level&from=2000&to=2025"
curl "http://localhost:8000/api/v1/trends?variable=precipitation&from=2000&to=2025"
curl "http://localhost:8000/api/v1/compare/auto?variable=precipitation&from=2000&to=2025"
```

Point-mode checks:

```bash
curl "http://localhost:8000/api/v1/series?lat=41.5&lon=75.0&variable=water_level&from=2000&to=2025"
curl "http://localhost:8000/api/v1/trend?lat=41.5&lon=75.0&variable=water_level&from=2000&to=2025"
curl "http://localhost:8000/api/v1/chain?lat=41.5&lon=75.0&variable=water_level&from=2000&to=2025"
```

Error-shape check:

```bash
curl -i "http://localhost:8000/api/v1/trend?object=does_not_exist&variable=water_level&from=2000&to=2025"
```

The response should include a JSON body with `code` and `message`.

### Start the frontend in live mode

Create `.env.local`:

```env
VITE_USE_MOCKS=false
VITE_API_PROXY_TARGET=http://localhost:8000
```

Clear the saved mode once:

```js
localStorage.removeItem('est:data-source');
location.reload();
```

Run `npm run dev` and open `http://localhost:5173`.

Confirm:

- The header says **Live data**.
- The Home map shows station markers and a station callout.
- The Home station panel shows a trend badge and a local/global chart.
- “Open full trend analysis” opens Explore with the correct section.
- Explore loads a series, trend verdict, proof panel, and chain.
- Point mode picks a location and loads series, trend, and chain without an error.
- Compare shows a pair of charts and the screening table.
- No “Data link error” panel appears.
- Browser console has no unexpected errors.
- Export CSV downloads a CSV attachment in live mode.

### Switching back to sample mode

Click the header button, or run:

```js
localStorage.setItem('est:data-source', 'sample');
location.reload();
```

Sample mode must render the same screens using `src/api/mockStubs.ts`.

---

## 12. Deploying the demo with GitHub Pages

This repository is a static Vite SPA. Sample mode requires no backend. The included workflow builds the app and publishes `dist/` to GitHub Pages.

### One-time setup

1. Push the app, `public/404.html`, and `.github/workflows/deploy-pages.yml` to the `main` branch.
2. Open the repository on GitHub: `https://github.com/alinur7810/K2-front`.
3. Go to **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **GitHub Actions**.
5. Open **Actions → Deploy GitHub Pages → Run workflow**, or push another commit to `main`.
6. Wait for the deploy job to finish. The site URL is:

```text
https://alinur7810.github.io/K2-front/
```

Do not choose “Deploy from a branch”; that serves source files instead of the built Vite app.

### Pointing the deployed site at a live backend

Add repository variables under **Settings → Secrets and variables → Actions → Variables**:

```text
VITE_USE_MOCKS=false
VITE_API_BASE_URL=https://your-backend.example.com/api/v1
```

Then rerun the **Deploy GitHub Pages** workflow. The workflow passes both values into `npm run build`. The backend must allow CORS from `https://alinur7810.github.io`.

### How routing works on Pages

- `vite.config.ts` derives the production base path from `GITHUB_REPOSITORY`, falling back to `/K2-front/`.
- `BrowserRouter` uses `import.meta.env.BASE_URL` as its basename.
- `public/404.html` saves the requested URL, redirects to the project root, and `index.html` restores the path before React renders.
- Direct links such as `/K2-front/explore` and `/K2-front/compare` survive a refresh.

### Local production preview

```bash
npm run build
npm run preview
```

Open the preview URL including the `/K2-front/` path. To build for a root domain or a differently named repository, override the base:

```bash
$env:VITE_BASE_PATH="/"; npm run build
```

### Important demo note

The deployed site uses sample data by default. The “Live data” button will show an error unless a backend is reachable at `/api/v1`. Tell the teammate to leave the header on **Sample data** unless the backend has been deployed.

### Updating the demo

Push any source change to `main`. The GitHub Actions workflow rebuilds and redeploys automatically.

---

## 13. Known limitations and current decisions

- **No authentication.** The API is assumed public or otherwise protected outside this frontend.
- **Sample export is disabled.** CSV generation is a backend responsibility. The button is enabled only in live mode.
- **Map tiles are external.** Esri World Imagery requires internet access.
- **No SSR.** The app is a client-rendered SPA.
- **`normalized_slope` is not used for radius.** Marker color currently communicates direction; the field remains in the contract for future use.
- **Point-mode chain is a required backend feature.** The frontend now sends `lat`/`lon`; a backend that only accepts `object` will return errors for arbitrary points.
- **`/variables` without filters must return all variables.** Home uses it to resolve the section for a station variable.
- **Mode persistence uses `localStorage`.** Stored mode overrides environment defaults; clear `est:data-source` when changing the default for testing.
- **Errors are expected to use `{code, message}`.** FastAPI’s default `{"detail": ...}` will appear as a generic HTTP error.
- **Home uses the first phenomenon and first map object when data loads.** Stable ordering is recommended.

---

## 14. Common integration mistakes

1. **Swapping latitude and longitude.** `marker` is `[lat, lon]`.
2. **Returning `points` instead of `monthly` / `yearly`.** The chart expects those exact names.
3. **Returning percentages as `15` instead of `0.15`.** Shares are fractions.
4. **Using `C` instead of `°C`.** Unit formatting depends on the canonical string.
5. **Returning only valid years.** Include missing years with `value: null`.
6. **Returning empty arrays instead of `null` values.** Use `null` for a missing observation.
7. **Returning `p_value` as a string.** Use a JSON number or `null`.
8. **Returning `n_years` below 10 without setting `insufficient_data`.** The UI will classify the result as insufficient anyway.
9. **Returning an error as plain text.** Return JSON `{code, message}`.
10. **Renaming object or variable codes per endpoint.** Codes must be stable across catalogs, series, trends, chains, and compare responses.
11. **Forgetting `source` metadata.** The scientific proof panel requires it.
12. **Returning chain links out of order.** Sort by `order` starting at 1.
13. **Forgetting the `/api/v1` prefix.** The Vite proxy forwards `/api/*`; the client expects `/api/v1`.
14. **Using a trailing slash in `VITE_API_BASE_URL`.** Use `https://api.example.com/api/v1` without a trailing slash.
15. **Not allowing CORS for a separate frontend origin.** The browser will block live requests.

---

## 15. File map

| Path | Purpose |
|---|---|
| `src/types/api.ts` | Canonical API DTOs and enums |
| `src/api/client.ts` | API base URL, query construction, errors, sample/live switch |
| `src/api/mockStubs.ts` | Sample responses for every endpoint |
| `src/pages/HomePhenomenaPage.tsx` | Phenomena map, station detail, deep link |
| `src/pages/ExploreResultPage.tsx` | Trend analysis, proof, point picker, chain, CSV |
| `src/pages/ComparePage.tsx` | Auto/manual pair and screening table |
| `src/components/KyrgyzstanMap.tsx` | Leaflet map, markers, callouts, point picker |
| `src/components/TrendChart.tsx` | Annual/monthly series and Sen line |
| `src/components/DualSeriesChart.tsx` | Local/global yearly comparison |
| `src/components/ChainFlow.tsx` | Sequential variable chain |
| `vite.config.ts` | Development proxy, environment loading, GitHub Pages base path |
| `public/404.html` | GitHub Pages SPA fallback |
| `public/.nojekyll` | Disables Jekyll processing on GitHub Pages |
| `.github/workflows/deploy-pages.yml` | Builds and deploys `dist/` to GitHub Pages |
| `.env.example` | Environment variable reference |

---

## 16. Contract-change request template

When the backend needs to change the contract, include:

```text
Endpoint:
Field or parameter:
Current frontend expectation:
Proposed change:
Reason:
Affected screens:
Backward-compatible: yes/no
Example response:
```

Do not modify the frontend DTOs and backend response names separately. Update both sides in the same change set.
