import { Camera, GeoJSONSource, Images, Layer, Map, ViewAnnotation, type ViewAnnotationRef } from '@maplibre/maplibre-react-native';
import { Image } from 'expo-image';
import { Landmark, MapPin, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/text';

import type { Fix } from '@/features/location/location-store';
import type { Route } from '@/features/routing/osrm';
import { validHeading } from '@/features/map/nav-arrow';
import { useMapStyle } from '@/features/offline/use-map-style';
import { ROUTE_LAYOUT, routeCasingPaint, routeLinePaint } from '@/features/map/route-style';
import { bearingTo } from '@/features/proximity/heading';
import { boundsOf, distanceMeters } from '@/lib/geo';
import { tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

import type { AltRoute } from './alternatives';
import { clusterPins, type PinCluster } from './journey-clusters';
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
  /** Tapping a single landmark pin (a group zooms in instead). */
  onSelectLandmark?: (id: string) => void;
  onLoadError?: () => void;
};

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

/**
 * Layers bottom to top. Each is placed just below the next (`beforeId`), and
 * every source stays mounted (empty when unused), so the order never depends
 * on what loaded first: alternatives under the route, the route under the
 * place dots, and the traveller's arrow always on top.
 */
const STACK = [
  'journey-alternative-casing',
  'journey-alternative-line',
  'journey-travelled-line',
  'journey-route-casing',
  'journey-route-line',
  'journey-dot',
  'journey-focus-halo',
  'journey-focus-dot',
  'journey-user-arrow',
] as const;
const below = (id: (typeof STACK)[number]) => STACK[STACK.indexOf(id) + 1];

/** Camera glide between navigation fixes (about one a second). */
const FOLLOW_MS = 1000;
/** Turns smaller than this keep the map still (GPS wobble). */
const STEADY_DEG = 8;

/**
 * Map for journey preview and navigation: the route (what is left drawn
 * strong, what was travelled faded), landmark and hazard markers along it,
 * the destination and the traveller.
 */
function JourneyMapBase({ route, index, items, progress, fix, follow, padding, focus, alternatives = [], onSelectRoute, onSelectLandmark, onLoadError }: Props) {
  const mapStyle = useMapStyle();
  // Walking routes are drawn as dots.
  const mode = route?.mode;
  const remaining = useMemo<GeoJSON.Feature | null>(() => {
    if (!route) return null;
    const coordinates = index && progress ? remainingLine(index, progress.along) : route.coordinates;
    return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } };
  }, [route, index, progress]);

  const full = useMemo<GeoJSON.Feature | null>(
    () => (route ? { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: route.coordinates } } : null),
    [route],
  );

  // Only the stretch where each alternative differs is drawn (and tappable):
  // shared roads stay the chosen route's, so a tap can't pick the wrong one.
  const alternativeLines = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: alternatives.map((a) => ({
        type: 'Feature' as const,
        properties: { id: a.id },
        geometry: { type: 'LineString' as const, coordinates: a.segment },
      })),
    }),
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
  const sideOf = (item: JourneyItem): number | null => {
    if (!index) return null;
    const at = pointAlong(index, item.along);
    const side = distanceMeters(at, item) < 25 ? 1 : Math.sin(((bearingTo(at, item) - at.bearing) * Math.PI) / 180) >= 0 ? 1 : -1;
    return (at.bearing + 90 * side + 360) % 360;
  };
  // Hazards keep their own red pins (never grouped: warnings must stay visible).
  const hazardPins = useMemo(() => items.filter((i) => i.kind === 'hazard').map((item) => ({ item, perp: sideOf(item) })), [items, index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Landmarks: photo pins with their names, grouped where they would overlap at this zoom.
  const [zoom, setZoom] = useState<number | null>(null);
  const viewZoom = zoom ?? (focus ? 17 : follow ? 16.5 : 11);
  const landmarkGroups = useMemo(
    () => clusterPins(items.filter((i) => i.kind === 'landmark'), viewZoom).map((g) => ({ group: g, perp: sideOf(g.lead) })),
    [items, index, viewZoom], // eslint-disable-line react-hooks/exhaustive-deps
  );
  // Tapping a group zooms the map to its landmarks (while not following the traveller).
  const [groupView, setGroupView] = useState<{ route: Route | null; bounds: [number, number, number, number] } | null>(null);
  const openGroup = (members: JourneyItem[]) => {
    const b = boundsOf(members.map((m) => [m.longitude, m.latitude] as [number, number]));
    if (b) setGroupView({ route, bounds: b });
  };
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

  const groupBounds = groupView && groupView.route === route && !follow && !focus ? groupView.bounds : null;
  const cameraStop = groupBounds
    ? { bounds: groupBounds, padding: { top: padding.top + 60, bottom: padding.bottom + 60, left: 80, right: 80 }, duration: 700, easing: 'ease' as const }
    : focus
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
      onRegionDidChange={(e) => {
        // Quarter-zoom steps: enough to regroup pins, not on every tiny move.
        const z = Math.round(e.nativeEvent.zoom * 4) / 4;
        setZoom((prev) => (prev === z ? prev : z));
      }}
    >
      {cameraStop ? <Camera {...cameraStop} /> : <Camera initialViewState={{ center: COUNTRY.center, zoom: 5 }} />}

      <Images images={{ 'gtg-nav-arrow': require('../../../assets/map/nav-arrow.png') }} />

      <GeoJSONSource
        id="journey-alternatives"
        data={alternativeLines}
        hitbox={{ top: 14, bottom: 14, left: 14, right: 14 }}
        onPress={(e) => {
          const id = e.nativeEvent.features?.[0]?.properties?.id;
          const alt = alternatives.find((x) => x.id === id);
          if (alt && onSelectRoute) onSelectRoute(alt);
        }}
      >
        <Layer
          type="line"
          id="journey-alternative-casing"
          beforeId={below('journey-alternative-casing')}
          layout={ROUTE_LAYOUT}
          paint={routeCasingPaint(mode, colors.routeCasing)}
        />
        <Layer
          type="line"
          id="journey-alternative-line"
          beforeId={below('journey-alternative-line')}
          layout={ROUTE_LAYOUT}
          paint={routeLinePaint(mode, ALT_ROUTE)}
        />
      </GeoJSONSource>

      <GeoJSONSource id="journey-travelled" data={full && progress ? full : EMPTY}>
        <Layer
          type="line"
          id="journey-travelled-line"
          beforeId={below('journey-travelled-line')}
          layout={ROUTE_LAYOUT}
          paint={routeLinePaint(mode, colors.borderStrong)}
        />
      </GeoJSONSource>

      <GeoJSONSource id="journey-route" data={remaining ?? EMPTY}>
        <Layer
          type="line"
          id="journey-route-casing"
          beforeId={below('journey-route-casing')}
          layout={ROUTE_LAYOUT}
          paint={routeCasingPaint(mode, colors.routeCasing)}
        />
        <Layer
          type="line"
          id="journey-route-line"
          beforeId={below('journey-route-line')}
          layout={ROUTE_LAYOUT}
          paint={routeLinePaint(mode, colors.route)}
        />
      </GeoJSONSource>

      <GeoJSONSource id="journey-dots" data={dots}>
        <Layer
          type="circle"
          id="journey-dot"
          beforeId={below('journey-dot')}
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

      <GeoJSONSource
        id="journey-focus"
        data={focus ? { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [focus.longitude, focus.latitude] } } : EMPTY}
      >
        <Layer
          type="circle"
          id="journey-focus-halo"
          beforeId={below('journey-focus-halo')}
          paint={{ 'circle-radius': 16, 'circle-color': colors.primary, 'circle-opacity': 0.18 }}
        />
        <Layer
          type="circle"
          id="journey-focus-dot"
          beforeId={below('journey-focus-dot')}
          paint={{ 'circle-radius': 7, 'circle-color': colors.primary, 'circle-stroke-color': '#FFFFFF', 'circle-stroke-width': 3 }}
        />
      </GeoJSONSource>

      <UserArrow to={here} heading={rawBearing} size={follow ? 0.8 : 0.62} glide={Boolean(progress)} />

      {landmarkGroups.map(({ group, perp }) => {
        const key = `journey-lm-${group.lead.id}-${group.members.length}`;
        return (
          <LandmarkPin
            key={key}
            id={key}
            group={group}
            offset={perp == null ? [0, -PIN_GAP] : offsetToward(perp, PIN_GAP + 4)}
            faded={Boolean(progress && group.members.every((m) => m.along < progress.along))}
            onPress={() => (group.members.length > 1 ? openGroup(group.members) : onSelectLandmark?.(group.lead.id))}
          />
        );
      })}

      {hazardPins.map(({ item, perp }) => (
        <ViewAnnotation
          key={item.id}
          id={`journey-${item.id}`}
          lngLat={[item.longitude, item.latitude]}
          offset={perp == null ? [0, -PIN_GAP] : offsetToward(perp, PIN_GAP)}
        >
          <PinHead color={colors.destructive} icon={TriangleAlert} faded={Boolean(progress && item.along < progress.along)} />
        </ViewAnnotation>
      ))}

      {route ? (
        <ViewAnnotation id="journey-destination" lngLat={[route.to.longitude, route.to.latitude]} offset={offsetToward(arrival, PIN_GAP + 3)}>
          <PinHead color={colors.accent} icon={MapPin} size={36} />
        </ViewAnnotation>
      ) : null}

      {alternatives.map((alt) => (
        <ViewAnnotation
          key={`alt-${alt.id}`}
          id={`journey-alt-${alt.id}`}
          lngLat={alt.label}
          onPress={() => onSelectRoute?.(alt)}
        >
          <AltPill delta={alt.delta} />
        </ViewAnnotation>
      ))}

    </Map>
  );
}

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

/**
 * A landmark on the map: its photo in a round frame with the name under it
 * (map apps' style). A group shows its first landmark's photo, a "+N" badge
 * and "Name +N". On Android the pin is a picture of this view, so it is
 * redrawn once the photo has loaded.
 */
function LandmarkPin({
  id,
  group,
  offset,
  faded,
  onPress,
}: {
  id: string;
  group: PinCluster<JourneyItem>;
  offset: [number, number];
  faded: boolean;
  onPress: () => void;
}) {
  const ref = useRef<ViewAnnotationRef>(null);
  const { lead, members } = group;
  const more = members.length - 1;
  const redraw = () => requestAnimationFrame(() => ref.current?.refresh());
  return (
    <ViewAnnotation ref={ref} id={id} lngLat={[group.longitude, group.latitude]} offset={offset} onPress={onPress}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ alignItems: 'center', opacity: faded ? 0.55 : 1, paddingTop: 6, paddingHorizontal: 8 }}
      >
        <View>
          <View
            className="items-center justify-center overflow-hidden rounded-full border-[2.5px] border-white bg-primary"
            style={{ width: PHOTO_PIN, height: PHOTO_PIN }}
          >
            {lead.image ? (
              <Image source={{ uri: lead.image }} style={{ width: PHOTO_PIN, height: PHOTO_PIN }} contentFit="cover" cachePolicy="memory-disk" onLoad={redraw} onError={redraw} />
            ) : (
              <Landmark color="#FFFFFF" size={18} />
            )}
          </View>
          {more > 0 ? (
            <View className="absolute items-center justify-center rounded-full border-2 border-white bg-accent px-1" style={{ top: -6, right: -8, minWidth: 22, height: 22 }}>
              <Text className="text-[11px] font-bold text-white">+{more}</Text>
            </View>
          ) : null}
        </View>
        <View className="mt-1 rounded-md bg-card px-1.5 py-0.5" style={{ maxWidth: 130 }}>
          <Text className="text-center text-[11px] font-semibold leading-[14px] text-heading">{more > 0 ? tx('{0} +{1}', { 0: lead.name, 1: more }) : lead.name}</Text>
        </View>
      </View>
    </ViewAnnotation>
  );
}

/** Photo pin size (px). */
const PHOTO_PIN = 42;

/** Keeps the last bearing until it changes by a few degrees, so the map doesn't wobble. */
function useSteadyBearing(bearing: number) {
  const [steady, setSteady] = useState(bearing);
  const diff = Math.abs(((bearing - steady + 540) % 360) - 180);
  if (diff >= STEADY_DEG && steady !== bearing) setSteady(bearing);
  return diff >= STEADY_DEG ? bearing : steady;
}

/**
 * The traveller's arrow, drawn by the map itself as its top layer (so no
 * route line can cover it) and turned with the map. While navigating it
 * glides from one fix to the next and turns the short way round, like in
 * map apps.
 */
function UserArrow({ to, heading, size, glide }: { to: [number, number] | null; heading: number; size: number; glide: boolean }) {
  const [shown, setShown] = useState<{ at: [number, number]; heading: number } | null>(to ? { at: to, heading } : null);
  const current = useRef(shown);
  const lng = to?.[0];
  const lat = to?.[1];

  useEffect(() => {
    if (lng == null || lat == null) return;
    const start = current.current ?? { at: [lng, lat] as [number, number], heading };
    const jump = distanceMeters({ longitude: start.at[0], latitude: start.at[1] }, { longitude: lng, latitude: lat });
    const turn = ((heading - start.heading + 540) % 360) - 180;
    // Far jumps (a new route, a GPS gap) and the preview move at once.
    const duration = !glide || jump > 300 ? 0 : GLIDE_MS;
    const t0 = Date.now();
    let frame = 0;
    let lastDrawn = 0;
    const tick = () => {
      const now = Date.now();
      const k = duration ? Math.min(1, (now - t0) / duration) : 1;
      current.current = {
        at: [start.at[0] + (lng - start.at[0]) * k, start.at[1] + (lat - start.at[1]) * k],
        heading: (start.heading + turn * k + 360) % 360,
      };
      // About 30 updates a second is smooth and light on the map.
      if (k === 1 || now - lastDrawn >= 33) {
        lastDrawn = now;
        setShown(current.current);
      }
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [lng, lat, heading, glide]);

  const data = useMemo<GeoJSON.Feature | GeoJSON.FeatureCollection>(
    () =>
      shown && to
        ? { type: 'Feature', properties: { heading: shown.heading }, geometry: { type: 'Point', coordinates: shown.at } }
        : EMPTY,
    [shown, to],
  );

  return (
    <GeoJSONSource id="journey-user" data={data}>
      <Layer
        type="symbol"
        id="journey-user-arrow"
        layout={{
          'icon-image': 'gtg-nav-arrow',
          'icon-size': size,
          'icon-rotate': ['get', 'heading'] as never,
          'icon-rotation-alignment': 'map',
          'icon-pitch-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
        }}
      />
    </GeoJSONSource>
  );
}

/** A little shorter than the time between fixes, so the arrow never lags behind. */
const GLIDE_MS = 900;

export const JourneyMap = memo(JourneyMapBase);
