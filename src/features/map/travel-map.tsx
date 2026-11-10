import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  UserLocation,
  ViewAnnotation,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import { forwardRef, memo, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/text';

import { DESTINATION_CATEGORIES } from '@/features/destinations/categories';
import type { Fix } from '@/features/location/location-store';
import type { Route } from '@/features/routing/osrm';
import type { FriendLocation } from '@/features/safety/friend-locations';
import { timeAgo } from '@/features/safety/friend-locations';
import { displayName } from '@/features/social/api';
import { useMapStyle } from '@/features/offline/use-map-style';
import { boundsOf, circleRing } from '@/lib/geo';
import { colors, severityColors } from '@/lib/theme';
import type { DestinationSummary, RoadAlert } from '@/lib/types';
import { tx } from '@/lib/i18n';

export type TravelMapHandle = {
  flyTo: (lng: number, lat: number, zoom?: number) => void;
  fitRoute: (route: Route) => void;
};

type Props = {
  destinations: DestinationSummary[];
  /** Places the traveller saved: drawn with a terracotta ring. */
  savedIds?: ReadonlySet<string>;
  alerts: RoadAlert[];
  friends: FriendLocation[];
  route: Route | null;
  selectedId: string | null;
  showRadius: boolean;
  navigating: boolean;
  /** Simulated fix to render (real GPS uses the native user puck). */
  simulatedFix: Fix | null;
  showUser: boolean;
  initialCenter: [number, number];
  initialZoom: number;
  onSelectDestination: (id: string) => void;
  onSelectAlert: (id: string) => void;
  onMapPress: () => void;
  onLoadError: () => void;
};

const categoryColorExpression = [
  'match',
  ['get', 'category'],
  ...Object.entries(DESTINATION_CATEGORIES).flatMap(([key, meta]) => [key, meta.color]),
  colors.accent,
];

/**
 * MapLibre map. All landmarks are drawn by a few native layers from one
 * GeoJSON source (no per-marker React components), so it stays smooth with
 * many destinations and does not re-render on every GPS fix.
 */
function TravelMapBase(props: Props, ref: React.Ref<TravelMapHandle>) {
  const mapStyle = useMapStyle();
  const camera = useRef<CameraRef>(null);
  const [loaded, setLoaded] = useState(false);

  useImperativeHandle(ref, () => ({
    flyTo: (lng, lat, zoom = 14) => camera.current?.flyTo({ center: [lng, lat], zoom, duration: 1200 }),
    fitRoute: (route) => {
      const b = boundsOf(route.coordinates);
      if (b) camera.current?.fitBounds(b, { padding: { top: 140, right: 40, bottom: 280, left: 40 }, duration: 900 });
    },
  }));

  const points = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: props.destinations.map((d) => ({
        type: 'Feature',
        id: d.id,
        geometry: { type: 'Point', coordinates: [d.longitude, d.latitude] },
        properties: { id: d.id, name: d.name, category: d.category, selected: d.id === props.selectedId, saved: props.savedIds?.has(d.id) ?? false },
      })),
    }),
    [props.destinations, props.selectedId, props.savedIds],
  );

  // Radius rings are computed once per destination list, not per render/fix.
  const rings = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: props.destinations.map((d) => ({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [circleRing(d, d.radius_m, 40)] },
        properties: { id: d.id, category: d.category },
      })),
    }),
    [props.destinations],
  );

  const alertPoints = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: props.alerts.map((a) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [a.longitude, a.latitude] },
        properties: { id: a.id, severity: a.severity, color: severityColors[a.severity] },
      })),
    }),
    [props.alerts],
  );

  const routeLine = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: props.route
        ? [{ type: 'Feature', geometry: { type: 'LineString', coordinates: props.route.coordinates }, properties: {} }]
        : [],
    }),
    [props.route],
  );

  return (
    <Map
      style={{ flex: 1 }}
      mapStyle={mapStyle as never}
      compass
      compassPosition={{ top: 140, right: 12 }}
      attributionPosition={{ bottom: 8, left: 8 }}
      logo={false}
      onPress={props.onMapPress}
      onDidFinishLoadingMap={() => setLoaded(true)}
      onDidFailLoadingMap={() => {
        if (!loaded) props.onLoadError();
      }}
    >
      <Camera
        ref={camera}
        initialViewState={{ center: props.initialCenter, zoom: props.initialZoom }}
        trackUserLocation={props.navigating && !props.simulatedFix ? 'course' : undefined}
      />

      {props.showUser && !props.simulatedFix ? <UserLocation animated accuracy heading /> : null}

      {props.showRadius ? (
        <GeoJSONSource id="landmark-rings" data={rings}>
          <Layer
            type="fill"
            id="landmark-ring-fill"
            minzoom={10}
            paint={{ 'fill-color': categoryColorExpression as never, 'fill-opacity': 0.08 }}
          />
          <Layer
            type="line"
            id="landmark-ring-line"
            minzoom={10}
            paint={{ 'line-color': categoryColorExpression as never, 'line-opacity': 0.5, 'line-width': 1, 'line-dasharray': [2, 2] }}
          />
        </GeoJSONSource>
      ) : null}

      <GeoJSONSource id="route" data={routeLine}>
        <Layer
          type="line"
          id="route-casing"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': colors.background, 'line-width': 9, 'line-opacity': 0.8 }}
        />
        <Layer
          type="line"
          id="route-line"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{ 'line-color': colors.route, 'line-width': 5 }}
        />
      </GeoJSONSource>

      <GeoJSONSource
        id="alerts"
        data={alertPoints}
        hitbox={{ top: 12, right: 12, bottom: 12, left: 12 }}
        onPress={(e) => {
          const id = e.nativeEvent.features?.[0]?.properties?.id;
          if (id) {
            e.stopPropagation();
            props.onSelectAlert(String(id));
          }
        }}
      >
        <Layer
          type="circle"
          id="alert-halo"
          paint={{ 'circle-radius': 14, 'circle-color': ['get', 'color'] as never, 'circle-opacity': 0.25 }}
        />
        <Layer
          type="circle"
          id="alert-dot"
          paint={{ 'circle-radius': 6, 'circle-color': ['get', 'color'] as never, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5 }}
        />
      </GeoJSONSource>

      <GeoJSONSource
        id="landmarks"
        data={points}
        hitbox={{ top: 14, right: 14, bottom: 14, left: 14 }}
        onPress={(e) => {
          const id = e.nativeEvent.features?.[0]?.properties?.id;
          if (id) {
            e.stopPropagation();
            props.onSelectDestination(String(id));
          }
        }}
      >
        <Layer
          type="circle"
          id="landmark-dot"
          paint={{
            'circle-radius': ['case', ['get', 'selected'], 11, 7] as never,
            'circle-color': categoryColorExpression as never,
            'circle-stroke-color': ['case', ['get', 'selected'], colors.foreground, ['get', 'saved'], colors.accent, colors.background] as never,
            'circle-stroke-width': ['case', ['get', 'selected'], 3, ['get', 'saved'], 3.5, 2] as never,
          }}
        />
        <Layer
          type="symbol"
          id="landmark-label"
          minzoom={11}
          layout={{
            'text-field': ['get', 'name'] as never,
            'text-font': ['Noto Sans Regular'],
            'text-size': 12,
            'text-offset': [0, 1.3],
            'text-anchor': 'top',
            'text-max-width': 10,
          }}
          paint={{ 'text-color': colors.foreground, 'text-halo-color': colors.background, 'text-halo-width': 1.5 }}
        />
      </GeoJSONSource>

      {props.simulatedFix ? (
        <ViewAnnotation id="simulated-user" lngLat={[props.simulatedFix.longitude, props.simulatedFix.latitude]}>
          <View className="h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-info">
            <View className="h-2 w-2 rounded-full bg-white" />
          </View>
        </ViewAnnotation>
      ) : null}

      {props.friends.map((f) => (
        <ViewAnnotation key={f.user_id} id={`friend-${f.user_id}`} lngLat={[f.longitude, f.latitude]}>
          <FriendMarker friend={f} />
        </ViewAnnotation>
      ))}
    </Map>
  );
}

const FriendMarker = memo(function FriendMarker({ friend }: { friend: FriendLocation }) {
  const name = displayName(friend.profile);
  return (
    <View className="items-center" accessibilityLabel={tx('{0}, updated {1}', { 0: name, 1: timeAgo(friend.updated_at) })}>
      <View
        className={`rounded-xl px-2 py-1 ${friend.stale ? 'bg-muted' : 'bg-card'}`}
        style={{ borderWidth: 1, borderColor: friend.stale ? colors.mutedForeground : colors.friend }}
      >
        <Text numberOfLines={1} className="max-w-28 text-[11px] font-semibold text-heading">
          {name}
        </Text>
        <Text className="text-[10px] text-muted-foreground">{friend.stale ? tx('Last seen {0}', { 0: timeAgo(friend.updated_at) }) : timeAgo(friend.updated_at)}</Text>
      </View>
      <View
        className="mt-0.5 h-4 w-4 rounded-full border-2 border-white"
        style={{ backgroundColor: friend.stale ? colors.mutedForeground : colors.friend }}
      />
    </View>
  );
});

export const TravelMap = memo(forwardRef(TravelMapBase));
