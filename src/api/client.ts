import {
  ApiErrorShape,
  ChainResponseDto,
  ComparePairResponseDto,
  GeoObjectDto,
  ObjectTrendTableRowDto,
  PhenomenonDto,
  PhenomenonMapResponseDto,
  PhenomenonObjectDetailDto,
  SectionDto,
  SeriesResponseDto,
  TrendResponseDto,
  VariableDto,
} from '../types/api';
import {
  buildMockChain,
  buildMockCompare,
  buildMockPhenomenonMap,
  buildMockPhenomenonObjectDetail,
  buildMockSeriesAndTrend,
  buildMockTrendsTable,
  MOCK_OBJECTS,
  MOCK_PHENOMENA,
  MOCK_SECTIONS,
  MOCK_VARIABLES,
} from './mockStubs';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const SOURCE_STORAGE_KEY = 'est:data-source';
let storedSource: string | null = null;
try {
  storedSource = window.localStorage.getItem(SOURCE_STORAGE_KEY);
} catch {
  storedSource = null;
}

// M1 stub-mode control (enabled by default while the backend is not running; toggled from the header)
let useMocksMode = storedSource
  ? storedSource === 'sample'
  : (import.meta.env.VITE_USE_MOCKS ?? 'true') === 'true';

export function getUseMocksMode(): boolean {
  return useMocksMode;
}

export function setUseMocksMode(val: boolean): void {
  useMocksMode = val;
  try {
    window.localStorage.setItem(SOURCE_STORAGE_KEY, val ? 'sample' : 'live');
  } catch {}
}

export class ApiClientError extends Error {
  code: string;
  constructor(shape: ApiErrorShape) {
    super(shape.message);
    this.code = shape.code;
  }
}

async function requestJson<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new ApiClientError({
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to the API server (/api/v1). Verify that the backend container is running.',
    });
  }

  if (!response.ok) {
    let errBody: ApiErrorShape = {
      code: `HTTP_${response.status}`,
      message: `Server response error (${response.status})`,
    };
    try {
      const parsed = await response.json();
      if (parsed && parsed.code && parsed.message) {
        errBody = parsed;
      }
    } catch {
      // ignore json parse error
    }
    throw new ApiClientError(errBody);
  }

  return (await response.json()) as T;
}

export const apiClient = {
  async getSections(): Promise<SectionDto[]> {
    if (useMocksMode) return MOCK_SECTIONS;
    return requestJson<SectionDto[]>('/sections');
  },

  async getObjects(section?: string, type?: string): Promise<GeoObjectDto[]> {
    if (useMocksMode) {
      return MOCK_OBJECTS.filter((o) => !type || o.type === type);
    }
    return requestJson<GeoObjectDto[]>('/objects', { section, type });
  },

  async getVariables(section?: string, object?: string): Promise<VariableDto[]> {
    if (useMocksMode) {
      return MOCK_VARIABLES.filter((v) => !section || v.section === section);
    }
    return requestJson<VariableDto[]>('/variables', { section, object });
  },

  async getSeries(params: {
    object?: string;
    lat?: number;
    lon?: number;
    variable: string;
    from: number;
    to: number;
  }): Promise<SeriesResponseDto> {
    if (useMocksMode) {
      const code = params.object || `pt_${params.lat?.toFixed(2)}_${params.lon?.toFixed(2)}`;
      return buildMockSeriesAndTrend(code, params.variable, params.from, params.to).series;
    }
    return requestJson<SeriesResponseDto>('/series', params);
  },

  async getTrend(params: {
    object?: string;
    lat?: number;
    lon?: number;
    variable: string;
    from: number;
    to: number;
  }): Promise<TrendResponseDto> {
    if (useMocksMode) {
      const code = params.object || `pt_${params.lat?.toFixed(2)}_${params.lon?.toFixed(2)}`;
      return buildMockSeriesAndTrend(code, params.variable, params.from, params.to).trend;
    }
    return requestJson<TrendResponseDto>('/trend', params);
  },

  async getChain(params: {
    object?: string;
    lat?: number;
    lon?: number;
    variable: string;
    from: number;
    to: number;
  }): Promise<ChainResponseDto> {
    if (useMocksMode) {
      const code = params.object || `pt_${params.lat?.toFixed(2)}_${params.lon?.toFixed(2)}`;
      return buildMockChain(code, params.variable, params.from, params.to);
    }
    return requestJson<ChainResponseDto>('/chain', params);
  },

  async getPhenomena(): Promise<PhenomenonDto[]> {
    if (useMocksMode) return MOCK_PHENOMENA;
    return requestJson<PhenomenonDto[]>('/phenomena');
  },

  async getPhenomenonMap(code: string, from: number, to: number): Promise<PhenomenonMapResponseDto> {
    if (useMocksMode) return buildMockPhenomenonMap(code, from, to);
    return requestJson<PhenomenonMapResponseDto>(`/phenomena/${code}/map`, { from, to });
  },

  async getPhenomenonObjectDetail(
    code: string,
    object: string,
    from: number,
    to: number
  ): Promise<PhenomenonObjectDetailDto> {
    if (useMocksMode) return buildMockPhenomenonObjectDetail(code, object, from, to);
    return requestJson<PhenomenonObjectDetailDto>(`/phenomena/${code}/objects/${object}`, { from, to });
  },

  async getCompareAuto(params: {
    variable: string;
    type?: string;
    from: number;
    to: number;
  }): Promise<ComparePairResponseDto> {
    if (useMocksMode) {
      return buildMockCompare(params.variable, 'chuy_reg', 'batken_reg', params.from, params.to, true);
    }
    return requestJson<ComparePairResponseDto>('/compare/auto', params);
  },

  async getCompareManual(params: {
    variable: string;
    a: string;
    b: string;
    from: number;
    to: number;
  }): Promise<ComparePairResponseDto> {
    if (useMocksMode) {
      return buildMockCompare(params.variable, params.a, params.b, params.from, params.to, false);
    }
    return requestJson<ComparePairResponseDto>('/compare', params);
  },

  async getTrendsTable(params: {
    variable: string;
    type?: string;
    from: number;
    to: number;
  }): Promise<ObjectTrendTableRowDto[]> {
    if (useMocksMode) return buildMockTrendsTable(params.variable);
    return requestJson<ObjectTrendTableRowDto[]>('/trends', params);
  },

  getExportCsvUrl(params: {
    object?: string;
    lat?: number;
    lon?: number;
    variable: string;
    from: number;
    to: number;
  }): string {
    const url = new URL(`${API_BASE}/export.csv`, window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
    return url.toString();
  },
};
