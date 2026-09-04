import { createContext, useContext, useState, useCallback } from 'react';
import { TC01_ASSETS, FLOORS, PROPERTY } from '../sample/tc01SampleData';

const PLOTS_LS_PREFIX = 'pms_tc01_floor_plots_';
const ASSETS_LS_KEY = 'pms_tc01_assets';
const FLOORS_LS_KEY = 'pms_tc01_floors';

// The sample seed is only a starting scaffold for the demo. Real assets and
// floors are entered by users and persisted to localStorage; anything stored
// takes precedence over the sample seed. 冷氣/風扇/抽氣扇 is never stored in
// PMS, so any such entries are stripped on read.
function readAssets() {
  try {
    const raw = localStorage.getItem(ASSETS_LS_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      if (Array.isArray(stored) && stored.length > 0) {
        return stored.filter((a) => a.category !== '冷氣/風扇/抽氣扇');
      }
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function writeAssets(assets) {
  try {
    localStorage.setItem(ASSETS_LS_KEY, JSON.stringify(assets));
  } catch {
    // storage full/blocked — ignore
  }
}

function readFloors() {
  try {
    const raw = localStorage.getItem(FLOORS_LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore storage errors
  }
  return null;
}

function writeFloors(floors) {
  try {
    localStorage.setItem(FLOORS_LS_KEY, JSON.stringify(floors));
  } catch {
    // storage full/blocked — ignore
  }
}

function nextFloorId() {
  return `FL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Convert the seed floor constants into persisted, user-equivalent records with
// a stable id, name, and propertyCode. Bundled 4F/5F images stay as build-time
// URLs; user-uploaded images are base64 data-URLs. Both are handled the same.
function seedFloors() {
  let seq = 0;
  return FLOORS.map((f) => {
    seq += 1;
    return {
      id: `FL-SEED-${f.key}`,
      propertyCode: PROPERTY.unitCode,
      name: f.label || f.key,
      type: f.image ? 'image' : 'none',
      image: f.image || null,
      validDate: '',
      createdAt: `2020-01-0${seq}`,
    };
  });
}

const AssetsContext = createContext({
  assets: [],
  property: PROPERTY,
  floors: [],
  getFloorsForProperty: () => [],
  addAsset: () => {},
  updateAsset: () => {},
  removeAsset: () => {},
  getAsset: () => null,
  addFloor: () => {},
  updateFloor: () => {},
  removeFloor: () => {},
  getFloor: () => null,
  getPlots: () => [],
  addPlot: () => {},
  updatePlot: () => {},
  removePlot: () => {},
  getPlotForAsset: () => null,
});

function readPlots(floorId) {
  try {
    const raw = localStorage.getItem(PLOTS_LS_PREFIX + floorId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writePlots(floorId, plots) {
  try {
    localStorage.setItem(PLOTS_LS_PREFIX + floorId, JSON.stringify(plots));
  } catch {
    // storage full/blocked — ignore
  }
}

export function AssetsProvider({ children }) {
  const [assets, setAssets] = useState(() => readAssets() || TC01_ASSETS.filter((a) => a.category !== '冷氣/風扇/抽氣扇'));
  const [floors, setFloors] = useState(() => {
    const stored = readFloors();
    if (stored) {
      // strip any AC ever stored and keep floor records well-formed
      return stored.filter((f) => f && f.id);
    }
    const seeded = seedFloors();
    writeFloors(seeded);
    return seeded;
  });
  const [plots, setPlots] = useState(() => {
    const init = {};
    (readFloors() || seedFloors()).forEach((f) => {
      init[f.id] = readPlots(f.id);
    });
    return init;
  });

  const getFloorsForProperty = useCallback(
    (propertyCode) => {
      if (!propertyCode || propertyCode === 'All') return floors;
      return floors.filter((f) => f.propertyCode === propertyCode);
    },
    [floors]
  );

  const getFloor = useCallback((id) => floors.find((f) => f.id === id) || null, [floors]);

  const addAsset = useCallback(
    (record) => {
      const id = record.id || `TC01-${Date.now()}`;
      const created = { ...record, id };
      setAssets((prev) => {
        const next = [created, ...prev];
        writeAssets(next);
        return next;
      });
      return created;
    },
    []
  );

  const updateAsset = useCallback((id, updates) => {
    setAssets((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      writeAssets(next);
      return next;
    });
  }, []);

  const removeAsset = useCallback((id) => {
    setAssets((prev) => {
      const next = prev.filter((a) => a.id !== id);
      writeAssets(next);
      return next;
    });
    setPlots((prev) => {
      const next = {};
      Object.keys(prev).forEach((floorId) => {
        next[floorId] = prev[floorId].filter((p) => p.assetId !== id);
        writePlots(floorId, next[floorId]);
      });
      return next;
    });
  }, []);

  const getAsset = useCallback((id) => assets.find((a) => a.id === id) || null, [assets]);

  const addFloor = useCallback(
    ({ propertyCode, name, type, image, validDate }) => {
      const created = {
        id: nextFloorId(),
        propertyCode: propertyCode || PROPERTY.unitCode,
        name: (name || '').trim(),
        type: type || (image ? 'image' : 'none'),
        image: image || null,
        validDate: validDate || '',
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setFloors((prev) => {
        const next = [...prev, created];
        writeFloors(next);
        return next;
      });
      return created;
    },
    []
  );

  const updateFloor = useCallback((id, updates) => {
    setFloors((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, ...updates } : f));
      writeFloors(next);
      return next;
    });
  }, []);

  const removeFloor = useCallback(
    (id) => {
      setFloors((prev) => {
        const next = prev.filter((f) => f.id !== id);
        writeFloors(next);
        return next;
      });
      setPlots((prev) => {
        const next = { ...prev };
        delete next[id];
        localStorage.removeItem(PLOTS_LS_PREFIX + id);
        return next;
      });
    },
    []
  );

  const getPlots = useCallback((floorId) => plots[floorId] || [], [plots]);

  const addPlot = useCallback((floorId, plot) => {
    setPlots((prev) => {
      const cur = prev[floorId] || [];
      const next = { ...prev, [floorId]: [...cur, plot] };
      writePlots(floorId, next[floorId]);
      return next;
    });
  }, []);

  const updatePlot = useCallback((floorId, plotId, updates) => {
    setPlots((prev) => {
      const cur = prev[floorId] || [];
      const next = { ...prev, [floorId]: cur.map((p) => (p.id === plotId ? { ...p, ...updates } : p)) };
      writePlots(floorId, next[floorId]);
      return next;
    });
  }, []);

  const removePlot = useCallback((floorId, plotId) => {
    setPlots((prev) => {
      const cur = prev[floorId] || [];
      const next = { ...prev, [floorId]: cur.filter((p) => p.id !== plotId) };
      writePlots(floorId, next[floorId]);
      return next;
    });
  }, []);

  const getPlotForAsset = useCallback(
    (assetId) => {
      for (const floorId of Object.keys(plots)) {
        const found = plots[floorId].find((p) => p.assetId === assetId);
        if (found) return { floorId, ...found };
      }
      return null;
    },
    [plots]
  );

  const tc01Floors = getFloorsForProperty(PROPERTY.unitCode);

  return (
    <AssetsContext.Provider
      value={{
        assets,
        property: PROPERTY,
        floors: tc01Floors,
        getFloorsForProperty,
        addAsset,
        updateAsset,
        removeAsset,
        getAsset,
        addFloor,
        updateFloor,
        removeFloor,
        getFloor,
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
