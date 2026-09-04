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
  const { assets, addAsset, updateAsset, removeAsset, getAsset, getPlots, addPlot, getPlotForAsset } = useAssets();

  const handleAdd = () => {
    const created = addAsset({
      propertyCode: 'TC-01',
      floor: '4F',
      room: '測試室/999',
      category: '櫃',
      installYear: 2020,
      status: 'Operational',
      condition: 'Good',
    });
    window.__lastId = created ? created.id : null;
  };

  return (
    <div>
      <span data-testid="total">{assets.length}</span>
      <span data-testid="first-id">{assets[0]?.id ?? 'none'}</span>
      <span data-testid="first-year">{assets[0]?.installYear ?? 'none'}</span>
      <span data-testid="found">{getAsset(assets[0]?.id) ? 'yes' : 'no'}</span>
      <span data-testid="plots-4f">{getPlots('4F').length}</span>
      <span data-testid="plot-for-asset">{getPlotForAsset(window.__plotAssetId) ? 'yes' : 'no'}</span>
      <button onClick={handleAdd}>Add</button>
      <button onClick={() => removeAsset(assets[0]?.id)}>Remove</button>
      <button onClick={() => updateAsset(assets[0]?.id, { installYear: 2025 })}>Update</button>
      <button onClick={() => {
        const id = assets[0]?.id;
        window.__plotAssetId = id;
        addPlot('4F', { id: 'p1', assetId: id, x: 50, y: 50 });
      }}>Plot</button>
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
    await user.click(screen.getByRole('button', { name: /Remove/i }));
    const after = parseInt(screen.getByTestId('total').textContent);
    expect(after).toBe(before - 1);
  });

  it('persists a floor plot and links it to an asset', async () => {
    const user = userEvent.setup();
    renderAssets();
    await user.click(screen.getByRole('button', { name: /Plot/i }));
    expect(screen.getByTestId('plots-4f').textContent).toBe('1');
    expect(screen.getByTestId('plot-for-asset').textContent).toBe('yes');
  });
});
