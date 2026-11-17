import { Camera, GeoJSONSource, Layer, Map, ViewAnnotation } from '@maplibre/maplibre-react-native';
import { Landmark, MapPin, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/text';

import type { Fix } from '@/features/location/location-store';
import type { Route } from '@/features/routing/osrm';
import { NavArrow, validHeading } from '@/features/map/nav-arrow';
import { useMapStyle } from '@/features/offline/use-map-style';
import { bearingTo } from '@/features/proximity/heading';
import { boundsOf, distanceMeters } from '@/lib/geo';
import { tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

import type { AltRoute } from './alternatives';
import type { JourneyItem } from './journey-items';
import { formatEta } from './navigation';
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
  /** Other ways to go, drawn grey with their time difference; tapping one picks it. */
  alternatives?: AltRoute[];
  onSelectRoute?: (alt: AltRoute) => void;
  onLoadError?: () => void;
};

/** Camera glide between navigation fixes (about one a second). */
const FOLLOW_MS = 1000;
/** Turns smaller than this keep the map still (GPS wobble). */
const STEADY_DEG = 8;

/**
 * Map for journey preview and navigation: the route (what is left drawn
 * strong, what was travelled faded), landmark and hazard markers along it,
 * the destination and the traveller.
 */
function JourneyMapBase({ route, index, items, progress, fix, follow, padding, focus, alternatives = [], onSelectRoute, onLoadError }: Props) {
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

  const alternativeLines = useMemo<GeoJSON.FeatureCollection | null>(
    () =>
      alternatives.length
        ? {
            type: 'FeatureCollection',
            features: alternatives.map((a, i) => ({
              type: 'Feature' as const,
              properties: { i },
              geometry: { type: 'LineString' as const, coordinates: a.route.coordinates },
            })),
          }
        : null,
    [alternatives],
  );

  // The whole route in view, and any alternatives beside it.
  const bounds = useMemo(
    () => (route ? boundsOf(alternatives.length ? [...route.coordinates, ...alternatives.flatMap((a) => a.route.coordinates)] : route.coordinates) : null),
    [route, alternatives],
  );
  // On the route while going its way; the real spot when off it or going the wrong way.
  const here = progress?.position ?? progress?.snapped ?? (fix ? ([fix.longitude, fix.latitude] as [number, number]) : null);
  // Which way the traveller is really going (GPS course / movement), else the
  // route's direction where they are, else the route's first stretch.
  const rawBearing = useMemo(() => {
    if (progress) return progress.heading ?? progress.bearing;
    const h = validHeading(fix?.heading);
    if (h != null) return h;
    const c = route?.coordinates;
    return c && c.length > 1 ? bearingTo({ longitude: c[0][0], latitude: c[0][1] }, { longitude: c[1][0], latitude: c[1][1] }) : 0;
  }, [progress, fix?.heading, route]);
  const bearing = useSteadyBearing(rawBearing);

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
      ? // Linear glide over the time to the next fix, so the map moves continuously like a car's.
        { center: here, zoom: 16.5, pitch: 50, bearing, padding: { top: padding.top, bottom: padding.bottom, left: 0, right: 0 }, duration: FOLLOW_MS, easing: 'linear' as const }
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

      {alternativeLines ? (
        <GeoJSONSource
          id="journey-alternatives"
          data={alternativeLines}
          onPress={(e) => {
            const i = Number(e.nativeEvent.features?.[0]?.properties?.i);
            const alt = alternatives[i];
            if (alt && onSelectRoute) onSelectRoute(alt);
          }}
        >
          <Layer
            type="line"
            id="journey-alternative-casing"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': colors.routeCasing, 'line-width': ROUTE_CASING_WIDTH as never }}
          />
          <Layer
            type="line"
            id="journey-alternative-line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': ALT_ROUTE, 'line-width': ROUTE_WIDTH as never }}
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

      {alternatives.map((alt, i) => (
        <ViewAnnotation
          key={`alt-${i}-${alt.route.createdAt}`}
          id={`journey-alt-${i}-${alt.route.createdAt}`}
          lngLat={alt.label}
          onPress={() => onSelectRoute?.(alt)}
        >
          <AltPill delta={alt.delta} />
        </ViewAnnotation>
      ))}

      {here ? (
        <UserArrow
          to={here}
          heading={rawBearing}
          // Navigating, the map turns with the traveller (the arrow is drawn relative to it); in the preview the map faces north.
          mapBearing={camBearing}
          size={follow ? 38 : 30}
          glide={Boolean(progress)}
        />
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

/** Alternative routes: a muted grey-blue under the main route. */
const ALT_ROUTE = '#9DB3C2';

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

/** "+4 min", "3 min faster" or "Same time" on an alternative route. */
function AltPill({ delta }: { delta: number }) {
  const mins = Math.round(Math.abs(delta) / 60);
  const label = mins < 1 ? tx('Same time') : delta > 0 ? tx('+{0}', { 0: formatEta(Math.abs(delta)) }) : tx('{0} faster', { 0: formatEta(Math.abs(delta)) });
  return (
    <View
      accessibilityRole="button"
      accessibilityLabel={tx('Alternative route, {0}', { 0: label })}
      className="rounded-full border-[1.5px] border-white bg-card px-2.5 py-1"
      style={{ boxShadow: '0 2px 8px rgba(21, 56, 79, 0.25)' }}
    >
      <Text className={`text-xs font-bold ${delta < -30 ? 'text-success' : 'text-muted-foreground'}`}>{label}</Text>
    </View>
  );
}

/** Keeps the last bearing until it changes by a few degrees, so the map doesn't wobble. */
function useSteadyBearing(bearing: number) {
  const [steady, setSteady] = useState(bearing);
  const diff = Math.abs(((bearing - steady + 540) % 360) - 180);
  if (diff >= STEADY_DEG && steady !== bearing) setSteady(bearing);
  return diff >= STEADY_DEG ? bearing : steady;
}

/**
 * The traveller's arrow. While navigating it glides from one fix to the next
 * (and turns the short way round) instead of jumping, like in map apps.
 * Only this marker re-renders during the glide, not the map.
 */
function UserArrow({
  to,
  heading,
  mapBearing,
  size,
  glide,
}: {
  to: [number, number];
  heading: number;
  mapBearing: number;
  size: number;
  glide: boolean;
}) {
  const [shown, setShown] = useState({ at: to, heading });
  const current = useRef(shown);
  const [lng, lat] = to;

  useEffect(() => {
    const start = current.current;
    const jump = distanceMeters({ longitude: start.at[0], latitude: start.at[1] }, { longitude: lng, latitude: lat });
    const turn = ((heading - start.heading + 540) % 360) - 180;
    // Far jumps (a new route, a GPS gap) and the preview move at once.
    const duration = !glide || jump > 300 ? 0 : GLIDE_MS;
    const t0 = Date.now();
    let frame = 0;
    const tick = () => {
      const k = duration ? Math.min(1, (Date.now() - t0) / duration) : 1;
      current.current = {
        at: [start.at[0] + (lng - start.at[0]) * k, start.at[1] + (lat - start.at[1]) * k],
        heading: (start.heading + turn * k + 360) % 360,
      };
      setShown(current.current);
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [lng, lat, heading, glide]);

  return (
    <ViewAnnotation id="journey-user" lngLat={shown.at}>
      <NavArrow rotation={shown.heading - mapBearing} size={size} />
    </ViewAnnotation>
  );
}

/** A little shorter than the time between fixes, so the arrow never lags behind. */
const GLIDE_MS = 900;

export const JourneyMap = memo(JourneyMapBase);
