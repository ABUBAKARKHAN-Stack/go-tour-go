/**
 * How a route line is drawn, shared by the journey and explore maps. Walking
 * routes are a line of round dots (like map apps); other modes a solid line
 * with a thin white outline. Widths follow the zoom: thin with the whole
 * route in view, wider at street level.
 */
import type { TravelMode } from '@/features/routing/osrm';

const SOLID_WIDTH = ['interpolate', ['linear'], ['zoom'], 8, 2.5, 12, 3.5, 15, 5, 18, 7.5];
const CASING_WIDTH = ['interpolate', ['linear'], ['zoom'], 8, 4, 12, 5.5, 15, 7.5, 18, 10.5];
/** Dots read better a little bigger than the solid line. */
const DOT_WIDTH = ['interpolate', ['linear'], ['zoom'], 8, 3.5, 12, 4.5, 15, 6.5, 18, 9];
/** Zero-length dashes with round caps are dots; the gap is in line widths. */
const DOTS = [0, 1.9];
const SOLID = [1, 0];

export function routeLinePaint(mode: TravelMode | null | undefined, color: string) {
  const walking = mode === 'walking';
  return {
    'line-color': color,
    'line-width': (walking ? DOT_WIDTH : SOLID_WIDTH) as never,
    'line-dasharray': (walking ? DOTS : SOLID) as never,
  };
}

/** The white outline under a solid route; none under dots. */
export function routeCasingPaint(mode: TravelMode | null | undefined, color: string, opacity = 1) {
  return {
    'line-color': color,
    'line-width': CASING_WIDTH as never,
    'line-opacity': mode === 'walking' ? 0 : opacity,
  };
}

export const ROUTE_LAYOUT = { 'line-cap': 'round', 'line-join': 'round' } as const;
