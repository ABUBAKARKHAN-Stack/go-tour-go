import { router } from 'expo-router';

import { journeyParams, type JourneyEnd } from './journey-params';

export { journeyParams, parseJourneyParams, placeOnly, readPlace } from './journey-params';
export type { JourneyEnd, JourneyParams, Target } from './journey-params';

/**
 * One-tap navigation from anywhere (details, Home, the "You're near" card,
 * notification actions, search): opens the journey preview, which plans the
 * route with the landmarks and hazards on the way. By default it goes from
 * the traveller's location; `from` starts it at another place, and `reverse`
 * plans from the place to the traveller.
 * Landmark ids are passed on so "Learn more" works on arrival; places from
 * search use ids like "place:n123", spots picked on the map "pin:<lat>, <lng>".
 * `replace` swaps the current screen (a map picker) for the journey preview.
 */
export function navigateTo(target: JourneyEnd, opts: { replace?: boolean; reverse?: boolean; from?: JourneyEnd } = {}) {
  const ends = opts.reverse ? { from: target, to: 'me' as const } : { from: opts.from ?? 'me', to: target };
  (opts.replace ? router.replace : router.push)({ pathname: '/journey', params: journeyParams(ends.from, ends.to) });
}
