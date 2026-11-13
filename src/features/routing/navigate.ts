import { router } from 'expo-router';

type Target = { id: string; name: string; latitude: number; longitude: number; subtitle?: string };

/**
 * One-tap navigation from anywhere (details, Home, the "You're near" card,
 * notification actions, search): opens the journey preview, which plans the
 * route from the current location with the landmarks and hazards on the way.
 * Landmark ids are passed on so "Learn more" works on arrival; places from
 * search use ids like "place:n123", spots picked on the map "pin:<lat>, <lng>".
 * `replace` swaps the current screen (a map picker) for the journey preview;
 * `reverse` plans from the place to the traveller instead.
 */
export function navigateTo(target: Target, opts: { replace?: boolean; reverse?: boolean } = {}) {
  (opts.replace ? router.replace : router.push)({
    pathname: '/journey',
    params: {
      name: target.name,
      lat: String(target.latitude),
      lng: String(target.longitude),
      id: target.id,
      ...(target.subtitle ? { subtitle: target.subtitle } : {}),
      // From the place to your location (From/To swapped in the planner).
      ...(opts.reverse ? { reverse: '1' } : {}),
    },
  });
}
