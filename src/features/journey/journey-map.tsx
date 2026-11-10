import { Camera, GeoJSONSource, Layer, Map, ViewAnnotation } from '@maplibre/maplibre-react-native';
import { Landmark, MapPin, TriangleAlert } from 'lucide-react-native';
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
            paint={{ 'line-color': colors.borderStrong, 'line-width': 6 }}
          />
        </GeoJSONSource>
      ) : null}

      {remaining ? (
        <GeoJSONSource id="journey-route" data={remaining}>
          <Layer
            type="line"
            id="journey-route-casing"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': colors.routeCasing, 'line-width': 11 }}
          />
          <Layer
            type="line"
            id="journey-route-line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': colors.route, 'line-width': 6 }}
          />
        </GeoJSONSource>
      ) : null}

      {items.map((item) => (
        <ViewAnnotation key={item.id} id={`journey-${item.id}`} lngLat={[item.longitude, item.latitude]}>
          <View
            className={`h-8 w-8 items-center justify-center rounded-full border-2 border-white ${
              item.kind === 'hazard' ? 'bg-destructive' : 'bg-primary'
            } ${progress && item.along < progress.along ? 'opacity-50' : ''}`}
          >
            {item.kind === 'hazard' ? <TriangleAlert color="#FFFFFF" size={15} /> : <Landmark color="#FFFFFF" size={15} />}
          </View>
        </ViewAnnotation>
      ))}

      {route ? (
        <ViewAnnotation id="journey-destination" lngLat={[route.to.longitude, route.to.latitude]}>
          <View className="h-11 w-11 items-center justify-center rounded-full border-[3px] border-white bg-accent">
            <MapPin color="#FFFFFF" size={20} />
          </View>
        </ViewAnnotation>
      ) : null}

      {here ? (
        <ViewAnnotation id="journey-user" lngLat={here}>
          {/* Navigating, the map turns with the traveller so the arrow points up; in the preview the map faces north. */}
          <NavArrow rotation={follow ? 0 : bearing} size={follow ? 52 : 44} />
        </ViewAnnotation>
      ) : null}
    </Map>
  );
}

export const JourneyMap = memo(JourneyMapBase);
