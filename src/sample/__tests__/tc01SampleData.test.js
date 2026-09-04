import { describe, it, expect } from 'vitest';
import { PROPERTY, FLOORS, EQUIPMENT_CATEGORIES, TC01_ROOMS, TC01_ASSETS, MIGRATED_RENOVATIONS, IS_SAMPLE_DATA } from '../tc01SampleData';

describe('tc01Assets data', () => {
  it('defines the 東涌護老院 property as TC-01', () => {
    expect(PROPERTY.unitCode).toBe('TC-01');
    expect(PROPERTY.name).toBe('保良局東涌護老院');
    expect(PROPERTY.unit).toBe('Elderly Home');
  });

  it('marks this module explicitly as sample/demo seed data', () => {
    expect(IS_SAMPLE_DATA).toBe(true);
  });

  it('provides the 3F/4F/5F floors, with images for 4F and 5F', () => {
    const keys = FLOORS.map((f) => f.key);
    expect(keys).toEqual(['3F', '4F', '5F']);
    const byKey = Object.fromEntries(FLOORS.map((f) => [f.key, f]));
    expect(byKey['3F'].image).toBeUndefined();
    expect(byKey['4F'].image).toBeTruthy();
    expect(byKey['5F'].image).toBeTruthy();
  });

  it('exposes the three equipment categories', () => {
    expect(EQUIPMENT_CATEGORIES).toEqual(['櫃', '冷氣/風扇/抽氣扇', '煮食設備']);
  });

  it('catalogs rooms for every floor', () => {
    for (const floor of FLOORS) {
      expect(TC01_ROOMS.filter((r) => r.floor === floor.key).length).toBeGreaterThan(0);
    }
  });

  it('expands each unit into its own row, all belonging to TC-01', () => {
    expect(TC01_ASSETS.length).toBeGreaterThan(0);
    for (const a of TC01_ASSETS) {
      expect(a.propertyCode).toBe('TC-01');
      expect(['3F', '4F', '5F']).toContain(a.floor);
      expect(EQUIPMENT_CATEGORIES).toContain(a.category);
      expect(typeof a.installYear).toBe('number');
    }
  });

  it('assigns unique asset ids to every unit', () => {
    const ids = TC01_ASSETS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('splits quantities into one row per item (洗衣房: 3 櫃 + 6 冷氣, all 2011)', () => {
    const laundryCupboards = TC01_ASSETS.filter((a) => a.room === '洗衣房' && a.category === '櫃');
    const laundryAc = TC01_ASSETS.filter((a) => a.room === '洗衣房' && a.category === '冷氣/風扇/抽氣扇');
    expect(laundryCupboards).toHaveLength(3);
    expect(laundryAc).toHaveLength(6);
    for (const a of [...laundryCupboards, ...laundryAc]) {
      expect(a.installYear).toBe(2011);
    }
  });

  it('廚房 has 1 冷氣 (2018) and 1 煮食 equipment (2011)', () => {
    const kitchenAc = TC01_ASSETS.filter((a) => a.room === '廚房' && a.category === '冷氣/風扇/抽氣扇');
    const kitchenCook = TC01_ASSETS.filter((a) => a.room === '廚房' && a.category === '煮食設備');
    expect(kitchenAc).toHaveLength(1);
    expect(kitchenCook).toHaveLength(1);
    expect(kitchenAc[0].installYear).toBe(2018);
    expect(kitchenCook[0].installYear).toBe(2011);
  });

  it('assets do not carry room renovation data (renovation is room-level, not asset-level)', () => {
    for (const a of TC01_ASSETS) {
      expect(a.renovation).toBeUndefined();
    }
  });

  it('builds migrated renovation work orders (reference only) from room data', () => {
    expect(MIGRATED_RENOVATIONS.length).toBeGreaterThan(0);
    const kitchen = MIGRATED_RENOVATIONS.find((m) => m.room === '廚房');
    expect(kitchen).toBeTruthy();
    expect(kitchen.title).toBe('更換廚房爐具設備');
    expect(kitchen.year).toBe(2022);
    expect(kitchen.source).toBe('data-migration');
    expect(kitchen.propertyCode).toBe('TC-01');
  });

  it('does not create migrated records for rooms without a renovation project', () => {
    expect(MIGRATED_RENOVATIONS.some((m) => m.room === '女廁/303')).toBe(false);
    expect(MIGRATED_RENOVATIONS.some((m) => m.room === '洗衣房')).toBe(false);
  });

  it('honours per-group install years (面談室/322 櫃 installed 2024, 冷氣 2011)', () => {
    const rm322Cupboards = TC01_ASSETS.filter((a) => a.room === '面談室/322' && a.category === '櫃');
    const rm322Ac = TC01_ASSETS.filter((a) => a.room === '面談室/322' && a.category === '冷氣/風扇/抽氣扇');
    expect(rm322Cupboards.length).toBeGreaterThan(0);
    expect(rm322Ac.length).toBeGreaterThan(0);
    for (const a of rm322Cupboards) expect(a.installYear).toBe(2024);
    for (const a of rm322Ac) expect(a.installYear).toBe(2011);
  });
});
