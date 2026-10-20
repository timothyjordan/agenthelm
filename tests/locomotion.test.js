import { describe, it, expect } from 'vitest';
import { moveVector, yawTowards, stationPose } from '../src/locomotion.js';
import { STATIONS } from '../src/layout.js';

describe('locomotion math', () => {
  it('moves forward toward -Z at yaw 0', () => {
    const d = moveVector({ x: 0, y: -1 }, 0, 2, 0.5);
    expect(d.x).toBeCloseTo(0); expect(d.z).toBeCloseTo(-1);
  });
  it('strafes right toward +X at yaw 0', () => {
    const d = moveVector({ x: 1, y: 0 }, 0, 2, 0.5);
    expect(d.x).toBeCloseTo(1); expect(d.z).toBeCloseTo(0);
  });
  it('computes a station pose on the floor facing its look target', () => {
    const pose = stationPose({ position: { x: 1, z: 2 }, floorY: 0.35, eyeHeight: 1.5, lookAt: { x: 1, z: -4 } });
    expect(pose.position).toEqual({ x: 1, y: 0.35, z: 2 });
    expect(pose.eyeHeight).toBe(1.5);
    expect(yawTowards(pose.position, pose.lookAt)).toBeCloseTo(0);
  });
  it('lands the forward pit lower than the aft deck', () => {
    const pit = stationPose(STATIONS.find((s) => s.id === 'ops'));
    const aft = stationPose(STATIONS.find((s) => s.id === 'tactical'));
    expect(pit.position.y).toBeLessThan(aft.position.y);
    expect(stationPose(STATIONS.find((s) => s.id === 'captain')).eyeHeight).toBeLessThan(pit.eyeHeight);
  });
});
