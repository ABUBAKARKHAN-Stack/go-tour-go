import { Camera, GeoJSONSource, Layer, Map, ViewAnnotation } from '@maplibre/maplibre-react-native';
import { Landmark, MapPin, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { memo, useMemo } from 'react';
import { View } from 'react-native';

import type { Fix } from '@/features/location/location-store';
import type { Route } from '@/features/routing/osrm';
import { NavArrow, validHeading } from '@/features/map/nav-arrow';
import { useMapStyle } from '@/features/offline/use-map-style';
import { bearingTo } from '@/features/proximity/heading';
import { boundsOf } from '@/lib/geo';
import { colors } from '@/lib/theme';

import type { JourneyItem } from './journey-items';
import type { NavProgress } from './navigation';
import { remainingLine, type RouteIndex } from './route-geometry';

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
  onLoadError?: () => void;
};

/**
 * Map for journey preview and navigation: the route (what is left drawn
 * strong, what was travelled faded), landmark and hazard markers along it,
 * the destination and the traveller.
 */
function JourneyMapBase({ route, index, items, progress, fix, follow, padding, onLoadError }: Props) {
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

  const cameraStop =
    follow && here
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
      {cameraStop ? <Camera {...cameraStop} /> : <Camera initialViewState={{ center: [70.5, 30.5], zoom: 5 }} />}

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

      {/* Pins stand on their tip, so the head sits above the route instead of covering it. */}
      {items.map((item) => (
        <ViewAnnotation key={item.id} id={`journey-${item.id}`} lngLat={[item.longitude, item.latitude]} anchor="bottom">
          <Pin
            color={item.kind === 'hazard' ? colors.destructive : colors.primary}
            icon={item.kind === 'hazard' ? TriangleAlert : Landmark}
            faded={Boolean(progress && item.along < progress.along)}
          />
        </ViewAnnotation>
      ))}

      {route ? (
        <ViewAnnotation id="journey-destination" lngLat={[route.to.longitude, route.to.latitude]} anchor="bottom">
          <Pin color={colors.accent} icon={MapPin} size={32} />
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

/** Small map pin: a round head with an icon over a short stem whose tip marks the spot. */
function Pin({ color, icon: Icon, size = 24, faded }: { color: string; icon: LucideIcon; size?: number; faded?: boolean }) {
  return (
    <View className="items-center" style={{ opacity: faded ? 0.5 : 1 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View
        className="items-center justify-center rounded-full border-2 border-white"
        style={{ width: size, height: size, backgroundColor: color, boxShadow: '0 2px 6px rgba(21, 56, 79, 0.3)' }}
      >
        <Icon color="#FFFFFF" size={Math.round(size * 0.5)} />
      </View>
      <View style={{ width: 2, height: 7, backgroundColor: color, marginTop: -1 }} />
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color, marginTop: -2, borderWidth: 1, borderColor: '#FFFFFF' }} />
    </View>
  );
}

export const JourneyMap = memo(JourneyMapBase);
