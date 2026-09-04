import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssetsProvider, useAssets } from '../AssetsContext';

function createStorageMock() {
  const store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    key: (i) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
  };
}

function AssetsTestUI() {
  const {
    assets, addAsset, updateAsset, removeAsset, getAsset,
    floors, addFloor, removeFloor, getFloor, getFloorsForProperty,
    getPlots, addPlot, getPlotForAsset,
  } = useAssets();

  const firstFloorId = floors[0]?.id;

  const handleAdd = () => {
    const created = addAsset({
      propertyCode: 'TC-01',
      floor: floors[0]?.name || '4F',
      room: '測試室/999',
      category: '櫃',
      installYear: 2020,
      status: 'Operational',
      condition: 'Good',
    });
    window.__lastId = created ? created.id : null;
  };

  const handleAddFloor = () => {
    const created = addFloor({ propertyCode: 'TC-01', name: '6F', type: 'image', image: 'data:image/png;base64,AAA', validDate: '2026-12-31' });
    window.__lastFloorId = created ? created.id : null;
  };

  return (
    <div>
      <span data-testid="total">{assets.length}</span>
      <span data-testid="first-id">{assets[0]?.id ?? 'none'}</span>
      <span data-testid="first-year">{assets[0]?.installYear ?? 'none'}</span>
      <span data-testid="found">{getAsset(assets[0]?.id) ? 'yes' : 'no'}</span>
      <span data-testid="no-ac">{assets.some((a) => a.category === '冷氣/風扇/抽氣扇') ? 'yes' : 'no'}</span>
      <span data-testid="floor-count">{floors.length}</span>
      <span data-testid="first-floor">{floors[0]?.name ?? 'none'}</span>
      <span data-testid="plots-first">{firstFloorId ? getPlots(firstFloorId).length : 0}</span>
      <span data-testid="plot-for-asset">{getPlotForAsset(window.__plotAssetId) ? 'yes' : 'no'}</span>
      <span data-testid="has-floor">{getFloor(window.__lastFloorId) ? 'yes' : 'no'}</span>
      <span data-testid="tc-floors">{getFloorsForProperty('TC-01').length}</span>
      <button onClick={handleAdd}>Add</button>
      <button onClick={handleAddFloor}>AddFloor</button>
      <button onClick={() => removeAsset(assets[0]?.id)}>Remove</button>
      <button onClick={() => updateAsset(assets[0]?.id, { installYear: 2025 })}>Update</button>
      <button onClick={() => {
        const id = assets[0]?.id;
        window.__plotAssetId = id;
        if (firstFloorId) addPlot(firstFloorId, { id: 'p1', assetId: id, x: 50, y: 50 });
      }}>Plot</button>
      <button onClick={() => { if (window.__lastFloorId) removeFloor(window.__lastFloorId); }}>RemoveFloor</button>
    </div>
  );
}

function renderAssets() {
  return render(
    <AssetsProvider>
      <AssetsTestUI />
    </AssetsProvider>
  );
}

describe('AssetsContext', () => {
  let storage;
  beforeAll(() => {
    storage = createStorageMock();
    Object.defineProperty(globalThis, 'localStorage', {
      value: storage,
      configurable: true,
      writable: true,
    });
  });

  beforeEach(() => {
    storage.clear();
  });

  it('loads initial assets from the TC-01 seed', () => {
    renderAssets();
    expect(parseInt(screen.getByTestId('total').textContent)).toBeGreaterThan(0);
    expect(screen.getByTestId('first-id').textContent).not.toBe('none');
  });

  it('loads the seeded TC-01 floors (3F/4F/5F are kept)', () => {
    renderAssets();
    expect(parseInt(screen.getByTestId('floor-count').textContent)).toBe(3);
    expect(screen.getByTestId('first-floor').textContent).toBe('3F');
    expect(parseInt(screen.getByTestId('tc-floors').textContent)).toBe(3);
  });

  it('never stores 冷氣/風扇/抽氣扇 assets in PMS', () => {
    renderAssets();
    expect(screen.getByTestId('no-ac').textContent).toBe('no');
  });

  it('adds an asset and returns the created record with an id', async () => {
    const user = userEvent.setup();
    renderAssets();
    const before = parseInt(screen.getByTestId('total').textContent);
    await user.click(screen.getByRole('button', { name: /^Add$/i }));
    const after = parseInt(screen.getByTestId('total').textContent);
    expect(after).toBe(before + 1);
    expect(window.__lastId).toBeTruthy();
    expect(screen.getByTestId('first-id').textContent).toBe(window.__lastId);
  });

  it('finds an asset by id', async () => {
    const user = userEvent.setup();
    renderAssets();
    await user.click(screen.getByRole('button', { name: /^Add$/i }));
    expect(screen.getByTestId('found').textContent).toBe('yes');
  });

  it('updates an asset', async () => {
    const user = userEvent.setup();
    renderAssets();
    const beforeYear = screen.getByTestId('first-year').textContent;
    await user.click(screen.getByRole('button', { name: /Update/i }));
    expect(screen.getByTestId('first-year').textContent).toBe('2025');
    expect(screen.getByTestId('first-year').textContent).not.toBe(beforeYear);
  });

  it('removes an asset', async () => {
    const user = userEvent.setup();
    renderAssets();
    const before = parseInt(screen.getByTestId('total').textContent);
    await user.click(screen.getByRole('button', { name: /^Remove$/i }));
    const after = parseInt(screen.getByTestId('total').textContent);
    expect(after).toBe(before - 1);
  });

  it('adds a floor and exposes it via getFloor / getFloorsForProperty', async () => {
    const user = userEvent.setup();
    renderAssets();
    const before = parseInt(screen.getByTestId('floor-count').textContent);
    await user.click(screen.getByRole('button', { name: /AddFloor/i }));
    expect(parseInt(screen.getByTestId('floor-count').textContent)).toBe(before + 1);
    expect(window.__lastFloorId).toBeTruthy();
    expect(screen.getByTestId('has-floor').textContent).toBe('yes');
  });

  it('removes a floor', async () => {
    const user = userEvent.setup();
    renderAssets();
    await user.click(screen.getByRole('button', { name: /AddFloor/i }));
    const afterAdd = parseInt(screen.getByTestId('floor-count').textContent);
    await user.click(screen.getByRole('button', { name: /RemoveFloor/i }));
    expect(parseInt(screen.getByTestId('floor-count').textContent)).toBe(afterAdd - 1);
  });

  it('persists a floor plot (keyed by floor id) and links it to an asset', async () => {
    const user = userEvent.setup();
    renderAssets();
    await user.click(screen.getByRole('button', { name: /Plot/i }));
    expect(screen.getByTestId('plots-first').textContent).toBe('1');
    expect(screen.getByTestId('plot-for-asset').textContent).toBe('yes');
  });
});
