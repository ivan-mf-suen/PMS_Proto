import { describe, it, expect } from 'vitest';
import { PROPERTY, FLOORS, EQUIPMENT_CATEGORIES, TC01_ROOMS, TC01_ASSETS } from '../tc01Assets';

describe('tc01Assets data', () => {
  it('defines the 東涌護老院 property as TC-01', () => {
    expect(PROPERTY.unitCode).toBe('TC-01');
    expect(PROPERTY.name).toBe('保良局東涌護老院');
    expect(PROPERTY.unit).toBe('Elderly Home');
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

  it('seeds a non-empty asset registry, all belonging to TC-01', () => {
    expect(TC01_ASSETS.length).toBeGreaterThan(0);
    for (const a of TC01_ASSETS) {
      expect(a.propertyCode).toBe('TC-01');
      expect(['3F', '4F', '5F']).toContain(a.floor);
      expect(EQUIPMENT_CATEGORIES).toContain(a.category);
    }
  });

  it('assigns unique asset ids', () => {
    const ids = TC01_ASSETS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('kitchen rooms carry cooking equipment and a recent renovation', () => {
    const kitchen = TC01_ASSETS.filter((a) => ['廚房', '4樓飯廳', '5樓飯廳'].includes(a.room));
    expect(kitchen.length).toBeGreaterThan(0);
    expect(kitchen.some((a) => a.category === '煮食設備')).toBe(true);
    for (const a of kitchen) {
      expect(a.renovation).toBe('更換廚房爐具設備 2022');
    }
  });
});
