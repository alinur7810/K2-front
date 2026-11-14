import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePhenomenaPage } from './pages/HomePhenomenaPage';
import { ExploreResultPage } from './pages/ExploreResultPage';
import { ComparePage } from './pages/ComparePage';
import { getUseMocksMode, setUseMocksMode } from './api/client';

export const App: React.FC = () => {
  const [useMocks, setUseMocks] = useState<boolean>(getUseMocksMode());
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

  const handleToggleMocks = () => {
    const next = !useMocks;
    setUseMocksMode(next);
    setUseMocks(next);
  };

  return (
    <BrowserRouter basename={basename}>
      <div className="app-shell flex min-h-screen flex-col">
        <Navbar useMocks={useMocks} onToggleMocks={handleToggleMocks} />
        {useMocks && (
          <div className="border-b border-earth-amber/40 bg-[#FDF6EC]">
            <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-xs text-[#7A3E0A] sm:px-6">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-earth-amber" />
              <strong className="font-semibold">Sample dataset (M1 stub).</strong>
              <span>Charts use bundled demo responses, not live satellite telemetry.</span>
              <span className="text-[#8A5A2B]">
                Switch to Live data in the header when the backend is available.
              </span>
            </div>
          </div>
        )}
        <main key={useMocks ? 'sample-data' : 'live-data'} className="flex-1">
          <Routes>
            <Route path="/" element={<HomePhenomenaPage />} />
            <Route path="/explore" element={<ExploreResultPage />} />
            <Route path="/compare" element={<ComparePage />} />
          </Routes>
        </main>
        <footer className="border-t border-earth-line bg-earth-raised">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-earth-muted sm:px-6">
            <span>NASA Space Apps Challenge 2026 — Kyrgyzstan Earth System Trend Detective</span>
            <span className="text-earth-slate">
              Sources: NASA GLDAS, GPM IMERG, MODIS AppEEARS, GRACE, CNES Hydroweb, NOAA
            </span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
