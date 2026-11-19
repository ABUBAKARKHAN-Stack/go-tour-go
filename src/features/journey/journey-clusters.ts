/**
 * Groups landmark pins that would overlap on screen at the current zoom
 * (pure, unit tested), like map apps do: one pin with a count for a busy
 * stretch, splitting into single pins as you zoom in.
 */
import { distanceMeters, type LatLng } from '@/lib/geo';

/** Metres per screen pixel at a zoom level and latitude (MapLibre's 512 px tiles). */
export function metersPerPixel(zoom: number, latitude: number) {
  return (78_271.517 * Math.cos((latitude * Math.PI) / 180)) / 2 ** zoom;
}

export type PinCluster<T> = {
  /** The first item (along the route): its photo and name lead the group. */
  lead: T;
  members: T[];
  latitude: number;
  longitude: number;
};

/**
 * Greedy grouping in route order: an item joins the group whose centre is
 * within `minPx` on screen, else starts its own. Groups move to the average
 * of their members.
 */
export function clusterPins<T extends LatLng>(items: T[], zoom: number, minPx = 72): PinCluster<T>[] {
  const clusters: PinCluster<T>[] = [];
  for (const item of items) {
    const reach = minPx * metersPerPixel(zoom, item.latitude);
    const near = clusters.find((c) => distanceMeters(c, item) <= reach);
    if (near) {
      const n = near.members.length;
      near.members.push(item);
      near.latitude = (near.latitude * n + item.latitude) / (n + 1);
      near.longitude = (near.longitude * n + item.longitude) / (n + 1);
    } else {
      clusters.push({ lead: item, members: [item], latitude: item.latitude, longitude: item.longitude });
    }
  }
  return clusters;
}
