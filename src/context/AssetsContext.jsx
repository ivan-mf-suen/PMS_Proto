import { createContext, useContext, useState, useCallback } from 'react';
import { TC01_ASSETS, FLOORS, PROPERTY } from '../data/tc01Assets';

const PLOTS_LS_PREFIX = 'pms_tc01_floor_plots_';

const AssetsContext = createContext({
  assets: [],
  property: PROPERTY,
  floors: FLOORS,
  addAsset: () => {},
  updateAsset: () => {},
  removeAsset: () => {},
  getAsset: () => null,
  getPlots: () => [],
  addPlot: () => {},
  updatePlot: () => {},
  removePlot: () => {},
  getPlotForAsset: () => null,
});

function readPlots(floor) {
  try {
    const raw = localStorage.getItem(PLOTS_LS_PREFIX + floor);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writePlots(floor, plots) {
  try {
    localStorage.setItem(PLOTS_LS_PREFIX + floor, JSON.stringify(plots));
  } catch {
    // storage full/blocked — ignore
  }
}

export function AssetsProvider({ children }) {
  const [assets, setAssets] = useState(() => [...TC01_ASSETS]);
  const [plots, setPlots] = useState(() => {
    const init = {};
    FLOORS.forEach((f) => {
      init[f.key] = readPlots(f.key);
    });
    return init;
  });

  const addAsset = useCallback(
    (record) => {
      const id = record.id || `TC01-${Date.now()}`;
      const created = { ...record, id };
      setAssets((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const updateAsset = useCallback((id, updates) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }, []);

  const removeAsset = useCallback((id) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setPlots((prev) => {
      const next = {};
      Object.keys(prev).forEach((floor) => {
        next[floor] = prev[floor].filter((p) => p.assetId !== id);
        writePlots(floor, next[floor]);
      });
      return next;
    });
  }, []);

  const getAsset = useCallback((id) => assets.find((a) => a.id === id) || null, [assets]);

  const getPlots = useCallback((floor) => plots[floor] || [], [plots]);

  const addPlot = useCallback((floor, plot) => {
    setPlots((prev) => {
      const cur = prev[floor] || [];
      const next = { ...prev, [floor]: [...cur, plot] };
      writePlots(floor, next[floor]);
      return next;
    });
  }, []);

  const updatePlot = useCallback((floor, plotId, updates) => {
    setPlots((prev) => {
      const cur = prev[floor] || [];
      const next = { ...prev, [floor]: cur.map((p) => (p.id === plotId ? { ...p, ...updates } : p)) };
      writePlots(floor, next[floor]);
      return next;
    });
  }, []);

  const removePlot = useCallback((floor, plotId) => {
    setPlots((prev) => {
      const cur = prev[floor] || [];
      const next = { ...prev, [floor]: cur.filter((p) => p.id !== plotId) };
      writePlots(floor, next[floor]);
      return next;
    });
  }, []);

  const getPlotForAsset = useCallback(
    (assetId) => {
      for (const floor of Object.keys(plots)) {
        const found = plots[floor].find((p) => p.assetId === assetId);
        if (found) return { floor, ...found };
      }
      return null;
    },
    [plots]
  );

  return (
    <AssetsContext.Provider
      value={{
        assets,
        property: PROPERTY,
        floors: FLOORS,
        addAsset,
        updateAsset,
        removeAsset,
        getAsset,
        getPlots,
        addPlot,
        updatePlot,
        removePlot,
        getPlotForAsset,
      }}
    >
      {children}
    </AssetsContext.Provider>
  );
}

export function useAssets() {
  return useContext(AssetsContext);
}
