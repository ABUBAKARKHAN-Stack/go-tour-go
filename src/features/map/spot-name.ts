import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { nameSpot } from '@/features/data/local-queries';
import { tx } from '@/lib/i18n';

type Point = { latitude: number; longitude: number };

/** A spot on the map as a journey target: its name, a subtitle, and a landmark id when it is one. */
export type NamedSpot = { name: string; subtitle: string; id: string };

/**
 * Names a spot picked on the map from the phone's own data (works offline):
 * the landmark there, "Near <place>", or a dropped pin with its coordinates.
 * Keeps the last name while the next one is looked up, so the label doesn't flicker.
 */
export function useSpotName(point: Point | null) {
  const key = point ? [Math.round(point.latitude * 5000) / 5000, Math.round(point.longitude * 5000) / 5000] : null;
  return useQuery({
    queryKey: ['spot-name', key],
    enabled: Boolean(point),
    staleTime: Infinity,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<NamedSpot> => {
      const p = point!;
      const coords = `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`;
      const spot = await nameSpot(p).catch(() => ({ kind: 'none' as const }));
      if (spot.kind === 'landmark') return { name: spot.name, subtitle: spot.subtitle, id: spot.id };
      if (spot.kind === 'place') return { name: tx('Near {0}', { 0: spot.name }), subtitle: spot.subtitle || coords, id: `pin:${coords}` };
      return { name: tx('Dropped pin'), subtitle: coords, id: `pin:${coords}` };
    },
  });
}
