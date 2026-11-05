import { OfflineManager } from '@maplibre/maplibre-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Paths } from 'expo-file-system';
import { HardDrive, Trash2, WifiOff } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Card, SectionHeader, ToggleRow } from '@/components/form';
import { useIsOnline } from '@/components/offline-banner';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { OFFLINE_MAPS } from '@/features/offline/catalog';
import { formatBytes, refreshManifest, useOfflineDownloads } from '@/features/offline/downloads';
import { MapPackCard, SavedRouteRow } from '@/features/offline/offline-cards';
import { useSavedRoutes } from '@/features/offline/saved-routes';
import { usePreferDownloadedMap } from '@/features/offline/use-map-style';
import { tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

function freeSpace() {
  try {
    return Paths.availableDiskSpace;
  } catch {
    return null;
  }
}

/**
 * Offline Pakistan: download all of Pakistan at street level, a light
 * overview, or city and region packs, and keep routes for the road. Maps
 * download in the background with pause and resume.
 */
export default function OfflineMapsScreen() {
  const downloads = useOfflineDownloads();
  const [savedRoutes] = useSavedRoutes();
  const [prefer, setPrefer] = usePreferDownloadedMap();
  const online = useIsOnline();
  const qc = useQueryClient();

  useEffect(() => {
    void refreshManifest();
  }, []);

  // City packs from the earlier version of this screen (MapLibre tile packs).
  const legacy = useQuery({
    queryKey: ['offline-legacy-packs'],
    queryFn: async () => (await OfflineManager.getPacks()).filter((p) => Boolean(p.metadata?.region)),
  });

  const items = downloads.items;
  const installed = OFFLINE_MAPS.filter((m) => items[m.id].installed);
  const used = installed.reduce((sum, m) => sum + items[m.id].bytes, 0);
  const free = freeSpace();
  const hasCountry = items.pakistan.installed;

  return (
    <Screen back title={tx('Offline Pakistan')} subtitle={tx('Maps that work without signal')}>
      {!online ? (
        <View className="flex-row items-center gap-2 rounded-2xl bg-muted px-3 py-2.5">
          <WifiOff color={colors.primary} size={16} />
          <Text className="flex-1 text-xs text-muted-foreground">{tx('You are offline. Downloaded maps and saved routes still work.')}</Text>
        </View>
      ) : null}

      <Card className="gap-3">
        <View className="flex-row items-center gap-3">
          <HardDrive color={colors.primary} size={18} />
          <Text className="flex-1 text-sm text-foreground">
            {installed.length
              ? tx('{0} map{1} on this phone · {2}', { 0: installed.length, 1: installed.length === 1 ? '' : 's', 2: formatBytes(used) })
              : tx('No maps downloaded yet')}
          </Text>
          {free != null ? <Text className="text-xs text-faint">{tx('{0} free', { 0: formatBytes(free) })}</Text> : null}
        </View>
        <ToggleRow
          title={tx('Use downloaded maps with internet too')}
          description={tx('Saves mobile data. Places outside your downloads use the online map.')}
          value={prefer}
          onChange={setPrefer}
        />
      </Card>

      <MapPackCard id="pakistan" item={items.pakistan} featured />
      <Text className="-mt-2 px-1 text-xs leading-5 text-faint">
        {tx('Best on Wi-Fi. Downloads continue in the background, and pick up where they stopped if the app is closed.')}
      </Text>

      <SectionHeader title={tx('Cities and regions')} />
      <MapPackCard id="overview" item={items.overview} includedInCountry={hasCountry} />
      {(['karachi', 'lahore', 'islamabad', 'northern'] as const).map((id) => (
        <MapPackCard key={id} id={id} item={items[id]} includedInCountry={hasCountry} />
      ))}

      <SectionHeader title={tx('Saved routes')} />
      {savedRoutes.length ? (
        savedRoutes.map((r) => <SavedRouteRow key={r.id} saved={r} />)
      ) : (
        <Text className="text-sm text-muted-foreground">
          {tx('Plan a journey and tap "Save offline" to keep the route, its turn-by-turn directions and the map along it on your phone.')}
        </Text>
      )}

      {legacy.data?.length ? (
        <Card className="gap-3">
          <Text className="text-base font-semibold text-foreground">{tx('Older city downloads')}</Text>
          <Text className="text-xs text-muted-foreground">{tx('Small city maps from an earlier version of GoTourGo. The packs above replace them.')}</Text>
          <AppButton
            label={tx('Remove older downloads')}
            icon={Trash2}
            size="sm"
            variant="outline"
            onPress={async () => {
              for (const p of legacy.data ?? []) await OfflineManager.deletePack(p.id).catch(() => undefined);
              await qc.invalidateQueries({ queryKey: ['offline-legacy-packs'] });
            }}
          />
        </Card>
      ) : null}

      <Text className="text-xs leading-5 text-faint">
        {tx('Map data © OpenStreetMap contributors (ODbL), built with Planetiler. Routes are calculated online; saved routes work offline.')}
      </Text>
    </Screen>
  );
}
