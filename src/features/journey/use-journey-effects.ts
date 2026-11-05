import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useRoadAlerts } from '@/features/alerts/api';
import { toLandmark, useDestinations } from '@/features/destinations/api';
import { setNavigationMode } from '@/features/location/location-provider';
import { locationStore } from '@/features/location/location-store';

import { journeyStore, useJourney } from './journey-store';
import { stopJourneyUpdates } from './journey-task';

/**
 * Connects the journey to the rest of the app: the landmark and hazard data
 * it searches along routes, the location feed, navigation-grade GPS while a
 * journey is active, and restoring a journey after the app was closed.
 */
export function useJourneyEffects() {
  const destinations = useDestinations();
  const alerts = useRoadAlerts();
  const { phase } = useJourney();

  useEffect(() => {
    journeyStore.setContext((destinations.data ?? []).map(toLandmark), alerts.data ?? []);
  }, [destinations.data, alerts.data]);

  // Resume a journey that was active when the app was closed.
  useEffect(() => {
    journeyStore.restore();
  }, []);

  useEffect(() => locationStore.onFix((fix) => journeyStore.onFix(fix)), []);

  useEffect(() => {
    const active = phase === 'active';
    setNavigationMode(active);
    if (!active) stopJourneyUpdates().catch(() => undefined);
  }, [phase]);

  // Coming back to the app: pick up progress the background task saved.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      const s = journeyStore.get();
      if (s.phase === 'active') journeyStore.syncFromStorage();
    });
    return () => sub.remove();
  }, []);
}
