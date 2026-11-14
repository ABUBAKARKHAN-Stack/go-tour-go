import { Camera, GeoJSONSource, Layer, Map, ViewAnnotation } from '@maplibre/maplibre-react-native';
import { Landmark, MapPin, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { memo, useMemo } from 'react';
import { View } from 'react-native';

import type { Fix } from '@/features/location/location-store';
import type { Route } from '@/features/routing/osrm';
import { NavArrow, validHeading } from '@/features/map/nav-arrow';
import { useMapStyle } from '@/features/offline/use-map-style';
import { bearingTo } from '@/features/proximity/heading';
import { boundsOf, distanceMeters } from '@/lib/geo';
import { colors } from '@/lib/theme';

import type { JourneyItem } from './journey-items';
import type { NavProgress } from './navigation';
import { pointAlong, remainingLine, type RouteIndex } from './route-geometry';
import { COUNTRY } from '@/constants/app.constants';

type Props = {
  route: Route | null;
  index: RouteIndex | null;
  items: JourneyItem[];
  progress: NavProgress | null;
  fix: Fix | null;
  /** Follow the traveller (navigation) or show the whole route (preview). */
  follow: boolean;
  /** Extra space for overlays: top banner and bottom sheet. */
  padding: { top: number; bottom: number };
  /**
   * Route preview: the turn being looked at. The camera flies there, tilted
   * and turned to face along the road, and a dot marks it.
   */
  focus?: { latitude: number; longitude: number; bearing: number } | null;
  onLoadError?: () => void;
};

/**
 * Map for journey preview and navigation: the route (what is left drawn
 * strong, what was travelled faded), landmark and hazard markers along it,
 * the destination and the traveller.
 */
function JourneyMapBase({ route, index, items, progress, fix, follow, padding, focus, onLoadError }: Props) {
  const mapStyle = useMapStyle();
  const remaining = useMemo<GeoJSON.Feature | null>(() => {
    if (!route) return null;
    const coordinates = index && progress ? remainingLine(index, progress.along) : route.coordinates;
    return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } };
  }, [route, index, progress]);

  const full = useMemo<GeoJSON.Feature | null>(
    () => (route ? { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: route.coordinates } } : null),
    [route],
  );

  const bounds = useMemo(() => (route ? boundsOf(route.coordinates) : null), [route]);
  const here = progress?.snapped ?? (fix ? ([fix.longitude, fix.latitude] as [number, number]) : null);
  // Which way the traveller is going: along the route where they are, else
  // their GPS course, else the route's first stretch (before moving).
  const bearing = useMemo(() => {
    if (progress) return progress.bearing;
    const h = validHeading(fix?.heading);
    if (h != null) return h;
    const c = route?.coordinates;
    return c && c.length > 1 ? bearingTo({ longitude: c[0][0], latitude: c[0][1] }, { longitude: c[1][0], latitude: c[1][1] }) : 0;
  }, [progress, fix?.heading, route]);

  // Each pin sits beside the route, on the side where the place is (right of
  // the road when it is on the road), so the route line stays visible; a small
  // dot marks the exact spot on the map.
  const placed = useMemo(
    () =>
      items.map((item) => {
        if (!index) return { item, perp: null as number | null };
        const at = pointAlong(index, item.along);
        const side =
          distanceMeters(at, item) < 25 ? 1 : Math.sin(((bearingTo(at, item) - at.bearing) * Math.PI) / 180) >= 0 ? 1 : -1;
        return { item, perp: (at.bearing + 90 * side + 360) % 360 };
      }),
    [items, index],
  );
  // The destination pin sits just past the end of the route, in the direction of arrival.
  const arrival = useMemo(() => {
    const c = route?.coordinates;
    if (!c || c.length < 2) return 0;
    const [a, b] = [c[c.length - 2], c[c.length - 1]];
    return bearingTo({ longitude: a[0], latitude: a[1] }, { longitude: b[0], latitude: b[1] });
  }, [route]);
  const dots = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: [
        ...items.map((item) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [item.longitude, item.latitude] },
          properties: { color: item.kind === 'hazard' ? colors.destructive : colors.primary, passed: Boolean(progress && item.along < progress.along) },
        })),
        ...(route
          ? [{ type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [route.to.longitude, route.to.latitude] }, properties: { color: colors.accent, passed: false } }]
          : []),
      ],
    }),
    [items, route, progress],
  );
  // Screen offset for a direction on the map: the map turns with the traveller while navigating.
  const camBearing = focus ? focus.bearing : follow ? bearing : 0;
  const offsetToward = (mapBearing: number, r: number): [number, number] => {
    const t = ((mapBearing - camBearing) * Math.PI) / 180;
    return [Math.round(Math.sin(t) * r), Math.round(-Math.cos(t) * r)];
  };

  const cameraStop = focus
    ? { center: [focus.longitude, focus.latitude] as [number, number], zoom: 17, pitch: 45, bearing: focus.bearing, padding: { top: padding.top, bottom: padding.bottom, left: 0, right: 0 }, duration: 900, easing: 'ease' as const }
    : follow && here
      ? { center: here, zoom: 16.5, pitch: 50, bearing, padding: { top: padding.top, bottom: padding.bottom, left: 0, right: 0 }, duration: 900, easing: 'ease' as const }
      : bounds
        ? { bounds, padding: { top: padding.top + 24, bottom: padding.bottom + 24, left: 48, right: 48 }, duration: 800, easing: 'ease' as const }
        : null;

  return (
    <Map
      style={{ flex: 1 }}
      mapStyle={mapStyle as never}
      logo={false}
      compass={!follow}
      compassPosition={{ top: padding.top + 8, right: 12 }}
      attributionPosition={{ bottom: padding.bottom + 4, left: 8 }}
      onDidFailLoadingMap={onLoadError}
    >
      {cameraStop ? <Camera {...cameraStop} /> : <Camera initialViewState={{ center: COUNTRY.center, zoom: 5 }} />}

      {focus ? (
        <GeoJSONSource
          id="journey-focus"
          data={{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [focus.longitude, focus.latitude] } }}
        >
          <Layer type="circle" id="journey-focus-halo" paint={{ 'circle-radius': 16, 'circle-color': colors.primary, 'circle-opacity': 0.18 }} />
          <Layer
            type="circle"
            id="journey-focus-dot"
            paint={{ 'circle-radius': 7, 'circle-color': colors.primary, 'circle-stroke-color': '#FFFFFF', 'circle-stroke-width': 3 }}
          />
        </GeoJSONSource>
      ) : null}

      {full && progress ? (
        <GeoJSONSource id="journey-travelled" data={full}>
          <Layer
            type="line"
            id="journey-travelled-line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': colors.borderStrong, 'line-width': ROUTE_WIDTH as never }}
          />
        </GeoJSONSource>
      ) : null}

      {remaining ? (
        <GeoJSONSource id="journey-route" data={remaining}>
          <Layer
            type="line"
            id="journey-route-casing"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': colors.routeCasing, 'line-width': ROUTE_CASING_WIDTH as never }}
          />
          <Layer
            type="line"
            id="journey-route-line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': colors.route, 'line-width': ROUTE_WIDTH as never }}
          />
        </GeoJSONSource>
      ) : null}

      <GeoJSONSource id="journey-dots" data={dots}>
        <Layer
          type="circle"
          id="journey-dot"
          paint={{
            'circle-radius': 4.5,
            'circle-color': ['get', 'color'] as never,
            'circle-stroke-color': '#FFFFFF',
            'circle-stroke-width': 2,
            'circle-opacity': ['case', ['get', 'passed'], 0.5, 1] as never,
            'circle-stroke-opacity': ['case', ['get', 'passed'], 0.5, 1] as never,
          }}
        />
      </GeoJSONSource>

      {placed.map(({ item, perp }) => (
        <ViewAnnotation
          key={item.id}
          id={`journey-${item.id}`}
          lngLat={[item.longitude, item.latitude]}
          offset={perp == null ? [0, -PIN_GAP] : offsetToward(perp, PIN_GAP)}
        >
          <PinHead
            color={item.kind === 'hazard' ? colors.destructive : colors.primary}
            icon={item.kind === 'hazard' ? TriangleAlert : Landmark}
            faded={Boolean(progress && item.along < progress.along)}
          />
        </ViewAnnotation>
      ))}

      {route ? (
        <ViewAnnotation id="journey-destination" lngLat={[route.to.longitude, route.to.latitude]} offset={offsetToward(arrival, PIN_GAP + 3)}>
          <PinHead color={colors.accent} icon={MapPin} size={36} />
        </ViewAnnotation>
      ) : null}

      {here ? (
        <ViewAnnotation id="journey-user" lngLat={here}>
          {/* Navigating, the map turns with the traveller so the arrow points up; in the preview the map faces north. */}
          <NavArrow rotation={follow ? 0 : bearing} size={follow ? 38 : 30} />
        </ViewAnnotation>
      ) : null}
    </Map>
  );
}

/**
 * Route width by zoom: thin when the whole route is in view, wider at street
 * level where you follow it. The white casing is a thin outline around it.
 */
const ROUTE_WIDTH = ['interpolate', ['linear'], ['zoom'], 8, 2.5, 12, 3.5, 15, 5, 18, 7.5];
const ROUTE_CASING_WIDTH = ['interpolate', ['linear'], ['zoom'], 8, 4, 12, 5.5, 15, 7.5, 18, 10.5];

/** Distance in px from the spot on the map to the centre of its pin. */
const PIN_GAP = 26;

/** Round marker with an icon, drawn beside the route (its spot is the small dot on the line). */
function PinHead({ color, icon: Icon, size = 32, faded }: { color: string; icon: LucideIcon; size?: number; faded?: boolean }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="items-center justify-center rounded-full border-[2.5px] border-white"
      style={{ width: size, height: size, backgroundColor: color, opacity: faded ? 0.5 : 1, boxShadow: '0 2px 8px rgba(21, 56, 79, 0.3)' }}
    >
      <Icon color="#FFFFFF" size={Math.round(size * 0.5)} />
    </View>
  );
}

export const JourneyMap = memo(JourneyMapBase);
