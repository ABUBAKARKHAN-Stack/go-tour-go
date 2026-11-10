import { Bike, Building2, Car, CheckCircle2, CircleAlert, Download, Footprints, Globe2, Map as MapIcon, Mountain, Pause, Play, RefreshCw, Route as RouteIcon, Trash2, Wifi, X, type LucideIcon } from 'lucide-react-native';
import { Alert, Pressable, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Text } from '@/components/text';
import { requestNotificationPermission } from '@/features/notifications/local-notifications';
import { formatDistance } from '@/lib/geo';
import { tx } from '@/lib/i18n';
import { cardShadow, colors } from '@/lib/theme';

import { offlineMap, type OfflineMapId } from './catalog';
import { checkBeforeDownload, formatBytes, hasUpdate, offlineDownloads, WIFI_ONLY_ABOVE_BYTES, type DownloadItem } from './downloads';
import { deleteSavedRoute, openSavedRoute, type SavedRoute } from './saved-routes';

const ICONS: Record<OfflineMapId, LucideIcon> = {
  pakistan: Globe2,
  overview: MapIcon,
  karachi: Building2,
  lahore: Building2,
  islamabad: Building2,
  northern: Mountain,
};

/** Checks space and network, asks where needed, then queues the download. */
export async function requestDownload(id: OfflineMapId) {
  const map = offlineMap(id);
  const check = await checkBeforeDownload(id);
  if (!check.online) {
    Alert.alert(tx('No internet'), tx('Connect to the internet to download offline maps.'));
    return;
  }
  if (!check.size) {
    Alert.alert(tx('Map not available yet'), tx('This map has not been published yet. Please try again later.'));
    return;
  }
  if (!check.enoughSpace) {
    Alert.alert(
      tx('Not enough space'),
      tx('{0} needs {1}, and your phone has {2} free. Free up some space and try again.', { 0: map.name, 1: formatBytes(check.size), 2: formatBytes(check.free) }),
    );
    return;
  }
  await requestNotificationPermission();
  const big = check.size > WIFI_ONLY_ABOVE_BYTES;
  if (big && !check.onWifi) {
    Alert.alert(
      tx('Download on mobile data?'),
      tx('{0} is {1}. On mobile data this can use a lot of your package. GoTourGo can wait and download it as soon as you are on Wi-Fi.', { 0: map.name, 1: formatBytes(check.size) }),
      [
        { text: tx('Cancel'), style: 'cancel' },
        { text: tx('Wait for Wi-Fi'), onPress: () => offlineDownloads.start(id, { allowMobile: false }) },
        { text: tx('Use mobile data'), onPress: () => offlineDownloads.start(id, { allowMobile: true }) },
      ],
    );
    return;
  }
  if (id === 'pakistan') {
    Alert.alert(
      tx('Download all of Pakistan?'),
      tx('{0} on Wi-Fi. You can pause at any time. If Android stops GoTourGo, the download continues from where it stopped next time you open the app.', { 0: formatBytes(check.size) }),
      [
        { text: tx('Cancel'), style: 'cancel' },
        { text: tx('Download'), onPress: () => offlineDownloads.start(id, { allowMobile: false }) },
      ],
    );
    return;
  }
  void offlineDownloads.start(id, { allowMobile: false });
}

function confirmRemove(id: OfflineMapId) {
  const map = offlineMap(id);
  Alert.alert(tx('Delete {0}?', { 0: map.name }), tx('You can download it again at any time.'), [
    { text: tx('Cancel'), style: 'cancel' },
    { text: tx('Delete'), style: 'destructive', onPress: () => offlineDownloads.remove(id) },
  ]);
}

function ProgressBar({ value, muted }: { value: number; muted?: boolean }) {
  return (
    <View className="h-2 overflow-hidden rounded-full bg-muted" accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value) }}>
      <View className={`h-2 rounded-full ${muted ? 'bg-border-strong' : 'bg-accent'}`} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </View>
  );
}

function statusLine(item: DownloadItem): { text: string; tone: 'muted' | 'success' | 'danger' | 'accent' } | null {
  const percent = item.total ? Math.floor((item.bytes / item.total) * 100) : 0;
  switch (item.status) {
    case 'queued':
      return { text: tx('Waiting to start…'), tone: 'muted' };
    case 'waiting-wifi':
      return { text: tx('Waiting for Wi-Fi · {0}% done', { 0: percent }), tone: 'accent' };
    case 'waiting-network':
      return { text: tx('Waiting for internet · {0}% done', { 0: percent }), tone: 'accent' };
    case 'downloading':
      return { text: tx('{0}% · {1} of {2}', { 0: percent, 1: formatBytes(item.bytes), 2: formatBytes(item.total) }), tone: 'muted' };
    case 'paused':
      return { text: tx('Paused at {0}%', { 0: percent }), tone: 'muted' };
    case 'error':
      return { text: item.error ?? tx('Download failed.'), tone: 'danger' };
    case 'complete':
      return { text: tx('On this phone · {0}', { 0: formatBytes(item.bytes) }), tone: 'success' };
    default:
      return null;
  }
}

/** One downloadable map: status, progress and actions. */
export function MapPackCard({ id, item, featured, includedInCountry }: { id: OfflineMapId; item: DownloadItem; featured?: boolean; includedInCountry?: boolean }) {
  const map = offlineMap(id);
  const Icon = ICONS[id];
  const line = statusLine(item);
  const inProgress = ['queued', 'waiting-wifi', 'waiting-network', 'downloading'].includes(item.status);
  const stopped = item.status === 'paused' || item.status === 'error';
  const percent = item.total ? (item.bytes / item.total) * 100 : 0;
  const update = hasUpdate(id);
  const toneClass = { muted: 'text-muted-foreground', success: 'text-success', danger: 'text-destructive', accent: 'text-accent' } as const;

  return (
    <View className={`gap-3 rounded-[20px] p-4 ${featured ? 'border-[1.5px] border-primary bg-primary-soft' : 'bg-card'}`} style={featured ? undefined : cardShadow}>
      <View className="flex-row items-start gap-3">
        <View className={`h-11 w-11 items-center justify-center rounded-2xl ${featured ? 'bg-primary' : 'bg-primary-soft'}`}>
          <Icon color={featured ? colors.primaryForeground : colors.primary} size={20} />
        </View>
        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center gap-2">
            <Text className={`flex-1 ${featured ? 'font-display text-[22px] leading-7' : 'text-base font-semibold'} text-foreground`}>{map.name}</Text>
            {item.total ? <Text className="text-xs font-semibold text-faint">{formatBytes(item.total)}</Text> : null}
          </View>
          <Text className="text-xs leading-5 text-muted-foreground">{map.description}</Text>
        </View>
      </View>

      {inProgress || stopped ? <ProgressBar value={percent} muted={!inProgress} /> : null}
      {line ? (
        <View className="flex-row items-center gap-1.5">
          {item.status === 'complete' ? <CheckCircle2 color={colors.success} size={14} /> : null}
          {item.status === 'error' ? <CircleAlert color={colors.destructive} size={14} /> : null}
          {item.status === 'waiting-wifi' ? <Wifi color={colors.accent} size={14} /> : null}
          <Text className={`flex-1 text-xs ${toneClass[line.tone]}`}>{line.text}</Text>
        </View>
      ) : null}
      {includedInCountry && !item.installed ? <Text className="text-xs text-success">{tx('Included in All of Pakistan on this phone.')}</Text> : null}
      {update ? <Text className="text-xs font-semibold text-accent">{tx('A newer version of this map is available.')}</Text> : null}

      <View className="flex-row flex-wrap gap-2">
        {item.status === 'idle' && !includedInCountry ? (
          <AppButton label={tx('Download')} icon={Download} size="sm" variant={featured ? 'primary' : 'secondary'} onPress={() => requestDownload(id)} className="flex-1" />
        ) : null}
        {inProgress ? (
          <>
            {item.status === 'waiting-wifi' ? (
              <AppButton label={tx('Use mobile data')} size="sm" variant="secondary" onPress={() => offlineDownloads.resume(id, { allowMobile: true })} className="flex-1" />
            ) : (
              <AppButton label={tx('Pause')} icon={Pause} size="sm" variant="secondary" onPress={() => offlineDownloads.pause(id)} className="flex-1" />
            )}
            <IconAction icon={X} label={tx('Cancel download')} onPress={() => offlineDownloads.cancel(id)} />
          </>
        ) : null}
        {stopped ? (
          <>
            <AppButton label={item.status === 'error' ? tx('Try again') : tx('Resume')} icon={item.status === 'error' ? RefreshCw : Play} size="sm" variant="secondary" onPress={() => offlineDownloads.resume(id)} className="flex-1" />
            <IconAction icon={X} label={tx('Cancel download')} onPress={() => offlineDownloads.cancel(id)} />
          </>
        ) : null}
        {item.status === 'complete' ? (
          <>
            {update ? <AppButton label={tx('Update')} icon={RefreshCw} size="sm" variant="secondary" onPress={() => requestDownload(id)} className="flex-1" /> : null}
            <AppButton label={tx('Delete')} icon={Trash2} size="sm" variant="outline" onPress={() => confirmRemove(id)} className={update ? '' : 'flex-1'} />
          </>
        ) : null}
      </View>
    </View>
  );
}

function IconAction({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} className="h-11 w-11 items-center justify-center rounded-full bg-primary-soft active:opacity-70">
      <Icon color={colors.primary} size={18} />
    </Pressable>
  );
}

const MODE_ICONS = { driving: Car, cycling: Bike, walking: Footprints } as const;

export function SavedRouteRow({ saved }: { saved: SavedRoute }) {
  const ModeIcon = MODE_ICONS[saved.route.mode] ?? RouteIcon;
  const mapText =
    saved.map === 'covered'
      ? tx('Map covered by your downloads')
      : saved.map === 'packs'
        ? saved.percent >= 100
          ? tx('Map saved along the route')
          : tx('Saving the map along the route · {0}%', { 0: saved.percent })
        : tx('Route only. Download this area to see the map offline.');
  return (
    <View className="gap-3 rounded-[20px] bg-card p-4" style={cardShadow}>
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft">
          <ModeIcon color={colors.primary} size={20} />
        </View>
        <View className="flex-1">
          <Text numberOfLines={1} className="text-base font-semibold text-heading">
            {saved.target.name}
          </Text>
          <Text className="text-xs text-faint">
            {tx('{0} · saved {1}', { 0: formatDistance(saved.route.distance), 1: new Date(saved.savedAt).toLocaleDateString() })}
          </Text>
        </View>
      </View>
      {saved.map === 'packs' && saved.percent < 100 ? <ProgressBar value={saved.percent} /> : null}
      <Text className={`text-xs ${saved.error ? 'text-destructive' : saved.map === 'none' ? 'text-accent' : 'text-muted-foreground'}`}>{saved.error ?? mapText}</Text>
      <View className="flex-row gap-2">
        <AppButton label={tx('Open route')} icon={RouteIcon} size="sm" variant="secondary" onPress={() => openSavedRoute(saved)} className="flex-1" />
        <IconAction
          icon={Trash2}
          label={tx('Delete saved route')}
          onPress={() =>
            Alert.alert(tx('Delete this saved route?'), saved.target.name, [
              { text: tx('Cancel'), style: 'cancel' },
              { text: tx('Delete'), style: 'destructive', onPress: () => void deleteSavedRoute(saved.id) },
            ])
          }
        />
      </View>
    </View>
  );
}
