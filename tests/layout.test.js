import { describe, it, expect } from 'vitest';
import { STATIONS, floorHeightAt, bridgeBounds } from '../src/layout.js';

const byId = (id) => STATIONS.find((s) => s.id === id);

describe('bridge layout', () => {
  it('has the six v0.1 stations', () => {
    expect(STATIONS.map((s) => s.id)).toEqual(['captain', 'helm', 'ops', 'tactical', 'science', 'engineering']);
  });
  it('seats the captain lower than standing stations', () => {
    expect(byId('captain').eyeHeight).toBeLessThan(byId('ops').eyeHeight);
    expect(byId('captain').position).toEqual({ x: 0, z: 4.3 });
  });
  it('returns pit, deck and ramp floor heights', () => {
    expect(floorHeightAt(0, -3)).toBe(0);
    expect(floorHeightAt(0, 5)).toBeCloseTo(0.35);
    const ramp = floorHeightAt(3.5, 0.8);
    expect(ramp).toBeGreaterThan(0); expect(ramp).toBeLessThan(0.35);
  });
  it('keeps every station floor on the floor surface and inside bounds', () => {
    for (const s of STATIONS) {
      expect(s.floorY).toBeCloseTo(floorHeightAt(s.position.x, s.position.z));
      expect(Math.abs(s.position.x)).toBeLessThanOrEqual(bridgeBounds.x);
      expect(s.position.z).toBeLessThanOrEqual(bridgeBounds.zBack);
      expect(s.position.z).toBeGreaterThanOrEqual(bridgeBounds.zForward);
    }
  });
  it('faces captain and tactical forward, science and engineering outward', () => {
    expect(byId('captain').lookAt.z).toBeLessThan(byId('captain').position.z);
    expect(byId('tactical').lookAt.z).toBeLessThan(byId('tactical').position.z);
    expect(byId('science').lookAt.x).toBeLessThan(byId('science').position.x);
    expect(byId('engineering').lookAt.x).toBeGreaterThan(byId('engineering').position.x);
  });
});
