import { describe, expect, test } from 'bun:test';

import { locationStore, type Fix } from './location-store';

const fix = (lat: number, simulated = false): Fix => ({ latitude: lat, longitude: 67, accuracy: 10, heading: null, speed: null, timestamp: Date.now(), simulated });

describe('location after a simulated drive', () => {
  test('ending the simulation puts you back where you really are', () => {
    locationStore.pushFix(fix(24.8));
    locationStore.set({ simulating: true });
    locationStore.pushFix(fix(25.5, true));
    // Real GPS during the simulation is hidden but remembered.
    locationStore.pushFix(fix(24.81));
    expect(locationStore.get().fix?.latitude).toBe(25.5);
    locationStore.set({ simulating: false });
    expect(locationStore.get().fix?.latitude).toBe(24.81);
    expect(locationStore.get().fix?.simulated).toBeFalsy();
  });
});
