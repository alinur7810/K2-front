import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Satellite } from 'lucide-react';
import { EN } from '../i18n/ru';

interface NavbarProps {
  useMocks: boolean;
  onToggleMocks: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ useMocks, onToggleMocks }) => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap border-b-2 px-2 py-2 text-[13px] font-medium transition-colors ${
      isActive
        ? 'border-earth-blue text-earth-ink'
        : 'border-transparent text-earth-slate hover:text-earth-ink'
    }`;

  return (
    <header className="sticky top-0 z-[1000] border-b border-earth-line bg-earth-raised">
      <div className="mx-auto flex min-h-14 max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:px-6">
        <Link to="/" className="order-1 flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-earth-ink text-white">
            <Satellite className="h-4 w-4" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-earth-ink">
              Earth System Trend Detective
            </span>
            <span className="block text-xs text-earth-muted">
              Kyrgyzstan, NASA Space Apps 2026
            </span>
          </span>
        </Link>

        <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto border-t border-earth-hairline pt-1 md:order-2 md:ml-auto md:w-auto md:border-t-0 md:pt-0">
          <NavLink to="/" end className={linkClass}>
            {EN.nav.homeMap}
          </NavLink>
          <NavLink to="/explore" className={linkClass}>
            {EN.nav.explore}
          </NavLink>
          <NavLink to="/compare" className={linkClass}>
            {EN.nav.compare}
          </NavLink>
        </nav>

        <button
          onClick={onToggleMocks}
          title="Toggle data source: sample dataset or live backend"
          className="order-2 ml-auto inline-flex items-center gap-2 rounded border border-earth-line bg-earth-raised px-2.5 py-1.5 text-xs font-medium text-earth-slate transition-colors hover:border-earth-muted/40 hover:text-earth-ink md:order-3 md:ml-0"
        >
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              useMocks ? 'bg-earth-amber' : 'bg-earth-green'
            }`}
          />
          {useMocks ? 'Sample data' : 'Live data'}
        </button>
      </div>
    </header>
  );
};
