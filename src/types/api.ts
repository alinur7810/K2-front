export type SectionCode = 'water' | 'glaciers' | 'climate' | 'vegetation';
export type ObjectType = 'lake' | 'reservoir' | 'river_basin' | 'glacier' | 'region' | 'point' | 'global';
export type ObservationQuality = 'ok' | 'filled' | 'outlier';
export type TrendDirection = 'increasing' | 'decreasing' | 'no_trend' | 'weak_increasing' | 'weak_decreasing' | 'insufficient_data';
export type ChainLinkStatus = 'confirmed' | 'unconfirmed' | 'no_data';

export interface ApiErrorShape {
  code: string;
  message: string;
}

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
  marker: [number, number]; // [lat, lon] WGS84
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
  date: string; // YYYY-MM-01
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
  missing_share: number; // 0..1
  filled_share: number;  // 0..1
  outlier_share: number; // 0..1
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
  sen_slope: number | null; // units per year
  slope_ci: [number, number] | null; // 95% CI
  intercept: number | null;
  base_year: number;
  unit: string;
  n_years: number;
  method: string; // 'Mann-Kendall' | 'Hamed-Rao Modified Mann-Kendall'
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
  spearman_r_prev: number | null; // Spearman correlation with the previous link
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
  normalized_slope: number; // -1..1 for marker size / brightness
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
