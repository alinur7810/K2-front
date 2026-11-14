export const EN = {
  appTitle: 'Kyrgyzstan Earth System Trend Detective',
  appSubtitle: 'Satellite hydro-climatic monitoring · NASA Space Apps 2026',
  nav: {
    homeMap: 'Map',
    explore: 'Explore',
    compare: 'Compare',
    homeMapShort: 'Map',
    exploreShort: 'Explore',
    compareShort: 'Compare',
  },
  steps: {
    section: 'Earth system section',
    place: 'Object, region or point',
    variable: 'Satellite parameter',
    period: 'Observation period',
  },
  placeModes: {
    object: 'Object',
    region: 'Region',
    point: 'Point',
  },
  trendLabels: {
    increasing: 'Increasing',
    decreasing: 'Decreasing',
    weak_increasing: 'Weak increase',
    weak_decreasing: 'Weak decrease',
    no_trend: 'No significant trend',
    insufficient_data: 'Insufficient data',
  },
  significanceLabels: {
    confident: 'Confident (p < 0.05)',
    weak: 'Weak (0.05 ≤ p < 0.10)',
    none: 'Noise (p ≥ 0.10)',
  },
  chainStatuses: {
    confirmed: 'Confirmed',
    unconfirmed: 'Unconfirmed',
    no_data: 'No data',
  },
  terms: {
    trend: {
      title: 'Climate trend',
      text: 'A sustained, unidirectional change in a variable over a long period (at least 10 years), after seasonal variability has been removed.',
    },
    p_value: {
      title: 'Statistical significance (p-value)',
      text: 'The probability that the observed increase or decrease arose by chance from natural noise. At p < 0.05 the probability of randomness is below 5%, so the trend is considered statistically significant.',
    },
    sen_slope: {
      title: "Sen's slope",
      text: 'An outlier-resistant estimate of the mean annual rate of change (the median of slopes between all pairs of annual observations).',
    },
    tau: {
      title: "Kendall's tau (τ)",
      text: 'A measure of trend monotonicity from −1 to +1. It shows how consistently values increase (+) or decrease (−) year after year.',
    },
    hamed_rao: {
      title: 'Hamed–Rao correction',
      text: 'A correction to the Mann–Kendall test applied automatically when consecutive years are serially correlated (autocorrelation), preventing false conclusions.',
    },
    proxy: {
      title: 'Proxy indicator',
      text: 'Satellites do not directly measure the ice mass of a small glacier or river discharge in a mountain catchment. A related satellite or model variable is used instead (for example MODIS snow-cover area or GLDAS modelled runoff).',
    },
    spearman: {
      title: "Spearman's rank correlation (rₛ)",
      text: 'Shows how synchronously two adjacent links of a chain vary from year to year (−1 to +1). Correlation indicates process coherence but does not by itself prove direct causality.',
    },
  },
  cautionChainBanner:
    'Note: the chain expresses statistical coherence of trends over the selected period in remote-sensing data and is not direct proof of a causal relationship.',
};
