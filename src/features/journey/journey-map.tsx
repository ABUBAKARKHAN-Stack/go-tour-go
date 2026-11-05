import { Camera, GeoJSONSource, Layer, Map, ViewAnnotation } from '@maplibre/maplibre-react-native';
import { Landmark, MapPin, Navigation2, TriangleAlert } from 'lucide-react-native';
import { memo, useMemo } from 'react';
import { View } from 'react-native';

import type { Fix } from '@/features/location/location-store';
import type { Route } from '@/features/routing/osrm';
import { env } from '@/lib/env';
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
  const bearing = progress?.bearing ?? fix?.heading ?? 0;

  const cameraStop =
    follow && here
      ? { center: here, zoom: 16.5, pitch: 50, bearing, padding: { top: padding.top, bottom: padding.bottom, left: 0, right: 0 }, duration: 900, easing: 'ease' as const }
      : bounds
        ? { bounds, padding: { top: padding.top + 24, bottom: padding.bottom + 24, left: 48, right: 48 }, duration: 800, easing: 'ease' as const }
        : null;

  return (
    <Map
      style={{ flex: 1 }}
      mapStyle={env.mapStyleUrl}
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
          {follow ? (
            <View
              className="h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-primary"
              style={{ boxShadow: '0 4px 12px rgba(15, 76, 74, 0.35)' }}
            >
              {/* The map rotates with the direction of travel, so the arrow points up. */}
              <Navigation2 color="#FFFFFF" fill="#FFFFFF" size={20} />
            </View>
          ) : (
            <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/20">
              <View className="h-[18px] w-[18px] rounded-full border-[3px] border-white bg-primary" />
            </View>
          )}
        </ViewAnnotation>
      ) : null}
    </Map>
  );
}

export const JourneyMap = memo(JourneyMapBase);
