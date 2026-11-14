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
