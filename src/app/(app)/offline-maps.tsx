import { OfflineManager, type OfflinePack } from '@maplibre/maplibre-react-native';
import { CheckCircle2, Download, Trash2 } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Card } from '@/components/form';
import { Screen } from '@/components/screen';
import { errorMessage } from '@/lib/errors';
import { env } from '@/lib/env';
import { colors } from '@/lib/theme';

/** Preset city regions [west, south, east, north] kept small for the demo. */
const REGIONS = [
  { key: 'lahore', name: 'Lahore (Walled City & centre)', bounds: [74.28, 31.5, 74.4, 31.63] as [number, number, number, number] },
  { key: 'islamabad', name: 'Islamabad & Rawalpindi', bounds: [72.98, 33.58, 73.15, 33.76] as [number, number, number, number] },
  { key: 'karachi', name: 'Karachi (Saddar & Clifton)', bounds: [66.97, 24.78, 67.08, 24.89] as [number, number, number, number] },
  { key: 'hunza', name: 'Hunza (Karimabad - Attabad)', bounds: [74.6, 36.28, 74.92, 36.38] as [number, number, number, number] },
];

const MIN_ZOOM = 10;
const MAX_ZOOM = 15;

type PackInfo = { pack: OfflinePack; percentage: number; state: string };

/**
 * Offline map regions with MapLibre's OfflineManager. Downloaded tiles are
 * shown automatically when there is no internet. Offline routing is not
 * supported (the last calculated route is cached instead).
 */
export default function OfflineMapsScreen() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const packsQuery = useQuery({
    queryKey: ['offline-packs'],
    queryFn: async () => {
      const list = await OfflineManager.getPacks();
      const next: Record<string, PackInfo> = {};
      for (const p of list) {
        const key = String(p.metadata?.region ?? '');
        if (!key) continue;
        const status = await p.status().catch(() => null);
        next[key] = { pack: p, percentage: status?.percentage ?? 0, state: status?.state ?? 'inactive' };
      }
      return next;
    },
  });
  const packs = packsQuery.data ?? {};
  const loading = packsQuery.isLoading;
  const setPacks = (fn: (prev: Record<string, PackInfo>) => Record<string, PackInfo>) =>
    qc.setQueryData<Record<string, PackInfo>>(['offline-packs'], (prev) => fn(prev ?? {}));

  const download = async (region: (typeof REGIONS)[number]) => {
    setBusy(region.key);
    try {
      await OfflineManager.createPack(
        { mapStyle: env.mapStyleUrl, bounds: region.bounds, minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM, metadata: { region: region.key, name: region.name } },
        (pack, status) => {
          setPacks((prev) => ({ ...prev, [region.key]: { pack, percentage: status.percentage, state: status.state } }));
        },
        (_pack, error) => {
          Alert.alert('Download failed', error.message);
        },
      );
    } catch (e) {
      Alert.alert('Download failed', errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (key: string) => {
    const info = packs[key];
    if (!info) return;
    await OfflineManager.deletePack(info.pack.id).catch(() => undefined);
    setPacks((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <Screen back title="Offline maps" subtitle="Use the map without internet">
      <Text className="text-sm text-muted-foreground">
        Download a city before you travel. GPS, saved places, your trip and the last calculated route also work offline.
        Turn-by-turn offline navigation is not included.
      </Text>
      {loading ? <ActivityIndicator color={colors.accent} /> : null}
      {REGIONS.map((r) => {
        const info = packs[r.key];
        const complete = info?.state === 'complete' || (info?.percentage ?? 0) >= 100;
        const active = info && !complete;
        return (
          <Card key={r.key} className="gap-3">
            <View className="flex-row items-center gap-2">
              {complete ? <CheckCircle2 color={colors.success} size={18} /> : <Download color={colors.accent} size={18} />}
              <Text className="flex-1 text-base font-semibold text-foreground">{r.name}</Text>
            </View>
            {active ? (
              <View className="gap-1">
                <View className="h-2 overflow-hidden rounded-full bg-muted">
                  <View className="h-2 rounded-full bg-accent" style={{ width: `${Math.min(100, info.percentage)}%` }} />
                </View>
                <Text className="text-xs text-muted-foreground">Downloading... {Math.round(info.percentage)}%</Text>
              </View>
            ) : null}
            {complete ? <Text className="text-xs text-success">Available offline</Text> : null}
            <View className="flex-row gap-2">
              {info ? (
                <AppButton label="Delete" icon={Trash2} variant="outline" size="sm" onPress={() => remove(r.key)} className="flex-1" />
              ) : (
                <AppButton label="Download" icon={Download} variant="secondary" size="sm" loading={busy === r.key} onPress={() => download(r)} className="flex-1" />
              )}
            </View>
          </Card>
        );
      })}
      <Text className="text-xs text-muted-foreground">Map data © OpenStreetMap contributors, tiles by OpenFreeMap. Keep downloads small and personal.</Text>
    </Screen>
  );
}
