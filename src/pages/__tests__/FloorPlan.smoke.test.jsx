import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '../../test/renderWithProviders';
import FloorPlan from '../FloorPlan';

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

describe('FloorPlan smoke', () => {
  let storage;
  beforeAll(() => {
    storage = createStorageMock();
    Object.defineProperty(globalThis, 'localStorage', {
      value: storage,
      configurable: true,
      writable: true,
    });
  });
  beforeEach(() => storage.clear());

  it('renders the floor plan without crashing after login', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MemoryRouter><FloorPlan /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: /Super Admin/i }));
    expect(screen.getByRole('heading', { name: /floor plan/i })).toBeTruthy();
  });
});