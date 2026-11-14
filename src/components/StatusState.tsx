import React from 'react';

export type StatusStateKind = 'loading' | 'no_data' | 'insufficient_data' | 'network_error';

interface StatusStateProps {
  kind: StatusStateKind;
  message?: string;
}

export const StatusState: React.FC<StatusStateProps> = ({ kind, message }) => {
  const config = {
    loading: {
      code: 'Loading',
      className: 'border-earth-line bg-earth-raised text-earth-slate',
      defaultText: 'Loading telemetry and computing statistics…',
    },
    no_data: {
      code: 'No record',
      className: 'border-earth-line bg-earth-soft text-earth-muted',
      defaultText: 'No observations are available for the selected period.',
    },
    insufficient_data: {
      code: 'Insufficient',
      className: 'border-earth-amber/25 bg-[#FDF6EC] text-[#7A3E0A]',
      defaultText: 'Insufficient data: the Mann–Kendall test requires at least 10 valid years.',
    },
    network_error: {
      code: 'Offline',
      className: 'border-earth-rust/25 bg-[#FDF3F1] text-[#8F3520]',
      defaultText: 'Unable to connect to the API server (/api/v1).',
    },
  }[kind];

  return (
    <div className={`flex items-center gap-3 rounded border px-4 py-3 text-sm ${config.className}`}>
      <span className="rounded-[3px] border border-current px-1.5 py-0.5 text-[11px] font-medium">
        {config.code}
      </span>
      <span>{message || config.defaultText}</span>
    </div>
  );
};
