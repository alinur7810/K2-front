/**
 * WARNING: THIS IS AN M1 MODULE DEMONSTRATION STUB FOR INTERFACE DEVELOPMENT BEFORE THE DATABASE IS READY.
 * Per the specification it is explicitly marked and disabled when working with the live backend.
 */
import {
  ChainResponseDto,
  ComparePairResponseDto,
  GeoObjectDto,
  ObjectTrendTableRowDto,
  ObservationPointDto,
  PhenomenonDto,
  PhenomenonMapResponseDto,
  PhenomenonObjectDetailDto,
  SectionDto,
  SeriesResponseDto,
  TrendResponseDto,
  VariableDto,
  YearlyPointDto,
} from '../types/api';

export const MOCK_SECTIONS: SectionDto[] = [
  { code: 'water', name: 'WATER & HYDROLOGY', order: 1, description: 'Lake and reservoir levels, river runoff' },
  { code: 'glaciers', name: 'GLACIERS & SNOW', order: 2, description: 'MODIS snow cover, snow water equivalent and glacier temperature' },
  { code: 'climate', name: 'CLIMATE & ATMOSPHERE', order: 3, description: 'Air temperature, precipitation and soil moisture' },
  { code: 'vegetation', name: 'VEGETATION', order: 4, description: 'NDVI growing-season index, April–September' },
];

export const MOCK_OBJECTS: GeoObjectDto[] = [
  { code: 'issyk_kul', type: 'lake', name: 'Lake Issyk-Kul', marker: [42.45, 77.25] },
  { code: 'son_kul', type: 'lake', name: 'Lake Son-Kul', marker: [41.83, 75.13] },
  { code: 'chatyr_kul', type: 'lake', name: 'Lake Chatyr-Kul', marker: [40.61, 75.31] },
  { code: 'toktogul', type: 'reservoir', name: 'Toktogul Reservoir', marker: [41.78, 72.82] },
  { code: 'naryn_basin', type: 'river_basin', name: 'Naryn River Basin', marker: [41.45, 75.95] },
  { code: 'chu_basin', type: 'river_basin', name: 'Chu River Basin', marker: [42.82, 74.58] },
  { code: 'enilchek', type: 'glacier', name: 'Enilchek Glacier', marker: [42.16, 79.92] },
  { code: 'petrova', type: 'glacier', name: 'Petrova Glacier', marker: [41.89, 78.23] },
  { code: 'ak_shiyrak', type: 'glacier', name: 'Ak-Shiyrak Massif', marker: [41.81, 78.18] },
  { code: 'golubina', type: 'glacier', name: 'Golubina Glacier (Ala-Archa)', marker: [42.46, 74.49] },
  { code: 'issyk_kul_reg', type: 'region', name: 'Issyk-Kul Region', marker: [42.18, 77.55] },
  { code: 'naryn_reg', type: 'region', name: 'Naryn Region', marker: [41.42, 75.99] },
  { code: 'chuy_reg', type: 'region', name: 'Chuy Region', marker: [42.75, 74.45] },
  { code: 'osh_reg', type: 'region', name: 'Osh Region', marker: [40.32, 72.95] },
  { code: 'jalal_abad_reg', type: 'region', name: 'Jalal-Abad Region', marker: [41.35, 72.45] },
  { code: 'batken_reg', type: 'region', name: 'Batken Region', marker: [39.92, 70.82] },
  { code: 'talas_reg', type: 'region', name: 'Talas Region', marker: [42.48, 72.22] },
];

export const MOCK_VARIABLES: VariableDto[] = [
  {
    code: 'water_level',
    section: 'water',
    name: 'Surface Water Elevation (Altimetry)',
    unit: 'm',
    yearly_agg: 'mean',
    is_proxy: false,
    available_from: 2000,
    available_to: 2025,
  },
  {
    code: 'runoff_mod',
    section: 'water',
    name: 'Surface Runoff (GLDAS Model)',
    unit: 'mm/yr',
    yearly_agg: 'sum',
    is_proxy: true,
    proxy_explanation:
      'No direct satellite discharge record is available; NASA GLDAS Noah modelled runoff is used within the basin outline.',
    available_from: 2000,
    available_to: 2025,
  },
  {
    code: 'tws_grace',
    section: 'water',
    name: 'Terrestrial Water Storage Anomaly (GRACE TWS)',
    unit: 'cm',
    yearly_agg: 'mean',
    is_proxy: false,
    available_from: 2002,
    available_to: 2025,
  },
  {
    code: 'evaporation',
    section: 'water',
    name: 'Total Evapotranspiration',
    unit: 'mm/yr',
    yearly_agg: 'sum',
    is_proxy: false,
    available_from: 2000,
    available_to: 2025,
  },
  {
    code: 'snow_cover_frac',
    section: 'glaciers',
    name: 'Glacier Snow Cover Fraction (MODIS)',
    unit: '%',
    yearly_agg: 'mean',
    is_proxy: true,
    proxy_explanation:
      'A proxy for glacier state (MODIS MOD10A1) instead of a direct measurement of ice mass balance.',
    available_from: 2000,
    available_to: 2025,
  },
  {
    code: 'swe_max',
    section: 'glaciers',
    name: 'Maximum Snow Water Equivalent (SWE)',
    unit: 'mm',
    yearly_agg: 'max',
    is_proxy: false,
    available_from: 2000,
    available_to: 2025,
  },
  {
    code: 'air_temp',
    section: 'climate',
    name: 'Near-Surface Air Temperature',
    unit: '°C',
    yearly_agg: 'mean',
    is_proxy: false,
    available_from: 2000,
    available_to: 2025,
  },
  {
    code: 'precipitation',
    section: 'climate',
    name: 'Annual Precipitation',
    unit: 'mm/yr',
    yearly_agg: 'sum',
    is_proxy: false,
    available_from: 2000,
    available_to: 2025,
  },
  {
    code: 'ndvi_veg',
    section: 'vegetation',
    name: 'Growing Season NDVI (Apr–Sep)',
    unit: 'index',
    yearly_agg: 'mean',
    is_proxy: false,
    available_from: 2000,
    available_to: 2025,
  },
];

export function buildMockSeriesAndTrend(
  objectCode: string,
  variableCode: string,
  fromYear: number,
  toYear: number
): { series: SeriesResponseDto; trend: TrendResponseDto } {
  const obj = MOCK_OBJECTS.find((o) => o.code === objectCode) || {
    code: objectCode,
    name: objectCode.startsWith('pt_') ? `Point (${objectCode.replace('pt_', '')})` : objectCode,
    type: 'point' as const,
    marker: [41.5, 75.0] as [number, number],
  };
  const variable = MOCK_VARIABLES.find((v) => v.code === variableCode) || MOCK_VARIABLES[0];

  const yearly: YearlyPointDto[] = [];
  const monthly: ObservationPointDto[] = [];

  // Reference scenario settings for Issyk-Kul and other objects in M1 stub mode
  const isDecreasing =
    variableCode === 'water_level' || variableCode === 'snow_cover_frac' || objectCode === 'batken_reg';
  const baseVal =
    variableCode === 'water_level'
      ? 1606.85
      : variableCode === 'air_temp'
      ? 6.4
      : variableCode === 'precipitation'
      ? 360
      : variableCode === 'snow_cover_frac'
      ? 74.0
      : 120.0;
  const slopePerYear =
    variableCode === 'water_level'
      ? -0.022
      : variableCode === 'air_temp'
      ? 0.048
      : variableCode === 'precipitation'
      ? objectCode === 'chuy_reg'
        ? 2.4
        : -2.8
      : isDecreasing
      ? -0.45
      : 0.35;

  for (let y = fromYear; y <= toYear; y++) {
    const idx = y - fromYear;
    const deterministicWave = Math.sin(idx * 1.3) * (Math.abs(slopePerYear) * 1.4);
    const yVal = Number((baseVal + slopePerYear * idx + deterministicWave).toFixed(3));
    yearly.push({
      year: y,
      value: y === 2017 && variableCode === 'tws_grace' ? null : yVal,
      valid_months: y === 2017 && variableCode === 'tws_grace' ? 4 : 12,
    });

    for (let m = 1; m <= 12; m++) {
      const mStr = String(m).padStart(2, '0');
      const seasonal = Math.sin(((m - 3) / 12) * Math.PI * 2) * (Math.abs(slopePerYear) * 3.5);
      const isFilled = y === 2012 && m === 7;
      const isOutlier = y === 2019 && m === 11;
      monthly.push({
        date: `${y}-${mStr}-01`,
        value: Number((yVal + seasonal).toFixed(3)),
        quality: isOutlier ? ('outlier' as const) : isFilled ? ('filled' as const) : ('ok' as const),
      });
    }
  }

  const validYears = yearly.filter((p) => p.value !== null).length;
  const isInsufficient = validYears < 10;

  const source =
    variableCode === 'water_level'
      ? {
          code: 'hydroweb',
          name: 'Hydroweb.next (Theia / CNES)',
          dataset_id: 'HYDROWEB_LAKES_OPE_V2',
          url: 'https://hydroweb.next.theia-land.fr/',
          license: 'Etalab Open Licence 2.0',
          citation: 'Crétaux et al., LEGOS/CNES Hydroweb Satellite Altimetry Database',
          spatial_resolution: 'Satellite altimetry track',
        }
      : {
          code: 'gldas',
          name: 'NASA GLDAS Noah v2.1 (GES DISC)',
          dataset_id: 'GLDAS_NOAH025_M_2.1',
          url: 'https://disc.gsfc.nasa.gov/',
          license: 'NASA Open Data Policy',
          citation: 'Rodell et al. (2004), The Global Land Data Assimilation System, BAMS',
          spatial_resolution: '0.25° × 0.25° (EPSG:4326)',
        };

  const series: SeriesResponseDto = {
    object_code: obj.code,
    object_name: obj.name,
    variable_code: variable.code,
    variable_name: variable.name,
    unit: variable.unit,
    yearly_agg: variable.yearly_agg,
    date_from: `${fromYear}-01-01`,
    date_to: `${toYear}-12-01`,
    is_proxy: Boolean(variable.is_proxy),
    proxy_note: variable.proxy_explanation || null,
    missing_share: 0.015,
    filled_share: 0.012,
    outlier_share: 0.004,
    source,
    monthly,
    yearly,
  };

  if (isInsufficient) {
    return {
      series,
      trend: {
        status: 'insufficient_data',
        object_code: obj.code,
        object_name: obj.name,
        variable_code: variable.code,
        variable_name: variable.name,
        from_year: fromYear,
        to_year: toYear,
        trend: 'insufficient_data',
        p_value: null,
        tau: null,
        sen_slope: null,
        slope_ci: null,
        intercept: null,
        base_year: fromYear,
        unit: variable.unit,
        n_years: validYears,
        method: 'NOT COMPUTED (10 VALID YEARS REQUIRED)',
        missing_share: 0.015,
        is_proxy: Boolean(variable.is_proxy),
        proxy_note: variable.proxy_explanation || null,
        summary_text: `Only ${validYears} observation years are available for ${fromYear}–${toYear}. A statistically valid Mann–Kendall test requires at least 10 valid years.`,
        source,
      },
    };
  }

  const totalChange = Number((slopePerYear * (validYears - 1)).toFixed(2));
  const directionWord = slopePerYear < 0 ? 'decreases' : 'increases';

  const trend: TrendResponseDto = {
    status: 'ok',
    object_code: obj.code,
    object_name: obj.name,
    variable_code: variable.code,
    variable_name: variable.name,
    from_year: fromYear,
    to_year: toYear,
    trend: slopePerYear < 0 ? 'decreasing' : 'increasing',
    p_value: 0.0034,
    tau: slopePerYear < 0 ? -0.58 : 0.61,
    sen_slope: slopePerYear,
    slope_ci: [Number((slopePerYear * 1.25).toFixed(4)), Number((slopePerYear * 0.75).toFixed(4))].sort(
      (a, b) => a - b
    ) as [number, number],
    intercept: baseVal,
    base_year: fromYear,
    unit: variable.unit,
    n_years: validYears,
    method: 'HAMED-RAO MODIFIED MANN-KENDALL (PYMANNKENDALL)',
    missing_share: 0.015,
    is_proxy: Boolean(variable.is_proxy),
    proxy_note: variable.proxy_explanation || null,
    summary_text: `[M1 STUB] ${variable.name} at ${obj.name} ${directionWord} by an average of ${Math.abs(
      slopePerYear
    )} ${variable.unit} per year over ${fromYear}–${toYear}. The trend is statistically significant (p = 0.0034): the probability of randomness is below 5%. Cumulative change over the full period is approximately ${Math.abs(
      totalChange
    )} ${variable.unit}.`,
    source,
  };

  return { series, trend };
}

export function buildMockChain(objectCode: string, variableCode: string, fromYear: number, toYear: number): ChainResponseDto {
  const mkSpark = (base: number, slope: number) =>
    Array.from({ length: Math.max(5, toYear - fromYear + 1) }, (_, i) => ({
      year: fromYear + i,
      value: Number((base + slope * i + Math.sin(i * 1.2) * Math.abs(slope)).toFixed(2)),
    }));

  return {
    section: 'water',
    object_code: objectCode,
    object_name: MOCK_OBJECTS.find((o) => o.code === objectCode)?.name || objectCode,
    target_variable: variableCode,
    from_year: fromYear,
    to_year: toYear,
    chain_name: 'Hydrological balance of an endorheic mountain lake',
    summary_caution_text:
      '[M1 STUB] The observed lake-level decline is consistent with rising air temperature and increased evaporation losses within the basin under a shrinking seasonal snowpack.',
    links: [
      {
        order: 1,
        variable_code: 'air_temp',
        variable_name: 'Near-Surface Air Temperature',
        unit: '°C',
        is_proxy: false,
        expected_relation: '+',
        explanation_text:
          'Rising near-surface temperature in the basin accelerates melt and increases the evaporative potential.',
        status: 'confirmed',
        trend: 'increasing',
        sen_slope: 0.048,
        p_value: 0.0021,
        spearman_r_prev: null,
        spearman_p_prev: null,
        yearly_sparkline: mkSpark(6.2, 0.048),
      },
      {
        order: 2,
        variable_code: 'swe_max',
        variable_name: 'Maximum Snow Water Equivalent (SWE)',
        unit: 'mm',
        is_proxy: false,
        expected_relation: '-',
        explanation_text:
          'A decline in maximum winter snow water equivalent reduces spring–summer river recharge.',
        status: 'confirmed',
        trend: 'decreasing',
        sen_slope: -1.35,
        p_value: 0.018,
        spearman_r_prev: -0.62,
        spearman_p_prev: 0.004,
        yearly_sparkline: mkSpark(145, -1.35),
      },
      {
        order: 3,
        variable_code: 'runoff_mod',
        variable_name: 'Surface Runoff (GLDAS Model)',
        unit: 'mm/yr',
        is_proxy: true,
        expected_relation: '-',
        explanation_text:
          'GLDAS modelled surface runoff shows no significant increase capable of offsetting evaporation.',
        status: 'unconfirmed',
        trend: 'no_trend',
        sen_slope: -0.42,
        p_value: 0.24,
        spearman_r_prev: 0.54,
        spearman_p_prev: 0.012,
        yearly_sparkline: mkSpark(210, -0.42),
      },
      {
        order: 4,
        variable_code: 'evaporation',
        variable_name: 'Total Evapotranspiration',
        unit: 'mm/yr',
        is_proxy: false,
        expected_relation: '+',
        explanation_text:
          'Increasing total evapotranspiration is consistent with higher air and water temperatures.',
        status: 'confirmed',
        trend: 'increasing',
        sen_slope: 2.15,
        p_value: 0.009,
        spearman_r_prev: -0.48,
        spearman_p_prev: 0.029,
        yearly_sparkline: mkSpark(680, 2.15),
      },
      {
        order: 5,
        variable_code: 'water_level',
        variable_name: 'Surface Water Elevation (Altimetry)',
        unit: 'm',
        is_proxy: false,
        expected_relation: '-',
        explanation_text:
          'The resulting water balance is expressed as a sustained decline in level in the altimetry record.',
        status: 'confirmed',
        trend: 'decreasing',
        sen_slope: -0.022,
        p_value: 0.0034,
        spearman_r_prev: -0.71,
        spearman_p_prev: 0.0008,
        yearly_sparkline: mkSpark(1606.85, -0.022),
      },
    ],
  };
}

export const MOCK_PHENOMENA: PhenomenonDto[] = [
  {
    code: 'global_warming',
    name: 'GLOBAL WARMING',
    description:
      'Link between the global temperature anomaly (NOAA GlobalTemp) and the water balance of lakes and reservoirs, together with the degradation of the snow–glacier cover of Kyrgyzstan.',
    global_variable_name: 'Global Temperature Anomaly (NOAA GlobalTemp)',
    global_unit: '°C',
  },
  {
    code: 'precip_regime_shift',
    name: 'PRECIPITATION REGIME SHIFT & ARIDITY',
    description:
      'Spatial heterogeneity of moisture trends between northern and south-western Kyrgyzstan from GPM IMERG and GLDAS.',
    global_variable_name: 'Mauna Loa CO₂ Concentration (NOAA GML)',
    global_unit: 'ppm',
  },
];

export function buildMockPhenomenonMap(code: string, fromYear: number, toYear: number): PhenomenonMapResponseDto {
  const phenomenon = MOCK_PHENOMENA.find((p) => p.code === code) || MOCK_PHENOMENA[0];
  return {
    phenomenon,
    from_year: fromYear,
    to_year: toYear,
    objects: [
      {
        object_code: 'issyk_kul',
        object_name: 'Lake Issyk-Kul',
        object_type: 'lake',
        marker: [42.45, 77.25],
        local_variable_code: 'water_level',
        local_variable_name: 'Surface Water Elevation',
        unit: 'm',
        trend: 'decreasing',
        sen_slope: -0.022,
        normalized_slope: -0.82,
        p_value: 0.0034,
        is_significant: true,
        short_note: 'Level decline driven by rising evaporation',
      },
      {
        object_code: 'toktogul',
        object_name: 'Toktogul Reservoir',
        object_type: 'reservoir',
        marker: [41.78, 72.82],
        local_variable_code: 'water_level',
        local_variable_name: 'Reservoir Surface Elevation',
        unit: 'm',
        trend: 'decreasing',
        sen_slope: -0.38,
        normalized_slope: -0.74,
        p_value: 0.014,
        is_significant: true,
        short_note: 'High interannual variability and drawdown',
      },
      {
        object_code: 'enilchek',
        object_name: 'Enilchek Glacier',
        object_type: 'glacier',
        marker: [42.16, 79.92],
        local_variable_code: 'snow_cover_frac',
        local_variable_name: 'Snow Cover Fraction (proxy)',
        unit: '%',
        trend: 'decreasing',
        sen_slope: -0.45,
        normalized_slope: -0.88,
        p_value: 0.0019,
        is_significant: true,
        short_note: 'Summer snow-cover contraction within the RGI outline',
      },
      {
        object_code: 'golubina',
        object_name: 'Golubina Glacier',
        object_type: 'glacier',
        marker: [42.46, 74.49],
        local_variable_code: 'snow_cover_frac',
        local_variable_name: 'Snow Cover Fraction (proxy)',
        unit: '%',
        trend: 'decreasing',
        sen_slope: -0.52,
        normalized_slope: -0.91,
        p_value: 0.0011,
        is_significant: true,
        short_note: 'Sustained decline in seasonal snow area',
      },
      {
        object_code: 'naryn_basin',
        object_name: 'Naryn River Basin',
        object_type: 'river_basin',
        marker: [41.45, 75.95],
        local_variable_code: 'air_temp',
        local_variable_name: 'Near-Surface Air Temperature',
        unit: '°C',
        trend: 'increasing',
        sen_slope: 0.051,
        normalized_slope: 0.85,
        p_value: 0.0015,
        is_significant: true,
        short_note: 'Confident increase in annual mean temperature',
      },
      {
        object_code: 'son_kul',
        object_name: 'Lake Son-Kul',
        object_type: 'lake',
        marker: [41.83, 75.13],
        local_variable_code: 'water_level',
        local_variable_name: 'Surface Water Elevation',
        unit: 'm',
        trend: 'no_trend',
        sen_slope: -0.004,
        normalized_slope: -0.18,
        p_value: 0.31,
        is_significant: false,
        short_note: 'No statistically significant trend detected',
      },
    ],
  };
}

export function buildMockPhenomenonObjectDetail(
  code: string,
  objectCode: string,
  fromYear: number,
  toYear: number
): PhenomenonObjectDetailDto {
  const mapData = buildMockPhenomenonMap(code, fromYear, toYear);
  const target = mapData.objects.find((o) => o.object_code === objectCode) || mapData.objects[0];
  const local = buildMockSeriesAndTrend(target.object_code, target.local_variable_code, fromYear, toYear);

  const globalSeries = Array.from({ length: Math.max(1, toYear - fromYear + 1) }, (_, i) => ({
    year: fromYear + i,
    value: Number((0.52 + 0.024 * i + Math.sin(i * 1.5) * 0.05).toFixed(3)),
  }));

  return {
    phenomenon: mapData.phenomenon,
    object_code: target.object_code,
    object_name: target.object_name,
    from_year: fromYear,
    to_year: toYear,
    explanation_note: `[M1 STUB] The change in ${target.local_variable_name} at ${target.object_name} over ${fromYear}–${toYear} is consistent with the rise in the NOAA GlobalTemp anomaly (+0.024 °C/yr).`,
    local_series: local.series.yearly,
    local_trend: local.trend,
    global_series: globalSeries,
    global_trend: {
      ...local.trend,
      object_code: 'global',
      object_name: 'Earth (NOAA GlobalTemp)',
      variable_code: 'noaa_global_temp',
      variable_name: mapData.phenomenon.global_variable_name,
      unit: mapData.phenomenon.global_unit,
      trend: 'increasing',
      sen_slope: 0.024,
      p_value: 0.0001,
    },
  };
}

export function buildMockCompare(
  variableCode: string,
  objectA: string,
  objectB: string,
  fromYear: number,
  toYear: number,
  isAuto: boolean
): ComparePairResponseDto {
  const aData = buildMockSeriesAndTrend(objectA, variableCode, fromYear, toYear);
  const bData = buildMockSeriesAndTrend(objectB, variableCode, fromYear, toYear);

  // Opposite slopes to demonstrate F6
  aData.trend.trend = 'increasing';
  aData.trend.sen_slope = 2.45;
  bData.trend.trend = 'decreasing';
  bData.trend.sen_slope = -2.85;

  return {
    variable_code: variableCode,
    variable_name: aData.series.variable_name,
    unit: aData.series.unit,
    from_year: fromYear,
    to_year: toYear,
    selection_mode: isAuto ? 'opposite_significant' : 'manual',
    comparison_summary: `[M1 STUB] Opposite significant trends over ${fromYear}–${toYear}: ${aData.series.object_name} increases (+2.45 ${aData.series.unit}/yr), while ${bData.series.object_name} decreases (−2.85 ${bData.series.unit}/yr).`,
    object_a: aData,
    object_b: bData,
  };
}

export function buildMockTrendsTable(variableCode: string): ObjectTrendTableRowDto[] {
  const variable = MOCK_VARIABLES.find((v) => v.code === variableCode) || MOCK_VARIABLES[0];
  return [
    { object_code: 'chuy_reg', object_name: 'Chuy Region', object_type: 'region', trend: 'increasing', sen_slope: 2.45, p_value: 0.012, tau: 0.44, n_years: 26, unit: variable.unit },
    { object_code: 'issyk_kul_reg', object_name: 'Issyk-Kul Region', object_type: 'region', trend: 'increasing', sen_slope: 1.82, p_value: 0.028, tau: 0.39, n_years: 26, unit: variable.unit },
    { object_code: 'naryn_reg', object_name: 'Naryn Region', object_type: 'region', trend: 'no_trend', sen_slope: 0.35, p_value: 0.48, tau: 0.11, n_years: 26, unit: variable.unit },
    { object_code: 'talas_reg', object_name: 'Talas Region', object_type: 'region', trend: 'weak_decreasing', sen_slope: -1.15, p_value: 0.074, tau: -0.28, n_years: 26, unit: variable.unit },
    { object_code: 'osh_reg', object_name: 'Osh Region', object_type: 'region', trend: 'decreasing', sen_slope: -2.10, p_value: 0.019, tau: -0.41, n_years: 26, unit: variable.unit },
    { object_code: 'batken_reg', object_name: 'Batken Region', object_type: 'region', trend: 'decreasing', sen_slope: -2.85, p_value: 0.004, tau: -0.53, n_years: 26, unit: variable.unit },
  ];
}
