import { router } from 'expo-router';
import { Bell, Database, FlaskConical, Map as MapIcon, Navigation, Play, RefreshCw, RotateCcw, Square, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, Linking, Modal, Pressable, Share, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton } from '@/components/app-button';
import { Card, Chip, Segmented, ToggleRow } from '@/components/form';
import { Screen } from '@/components/screen';
import { HERO_PHOTOS } from '@/features/brand/hero-photos';
import { syncLocalData, useDataSync } from '@/features/data/sync';
import { useJourney } from '@/features/journey/journey-store';
import { useDestinations } from '@/features/destinations/api';
import { requestBackgroundPermission } from '@/features/location/location-provider';
import { locationStore, useLocationState } from '@/features/location/location-store';
import { CHANNELS, notifyNow, requestNotificationPermission } from '@/features/notifications/local-notifications';
import { registerGeofences, stopGeofences } from '@/features/proximity/geofence-task';
import { simulator, useSimulator } from '@/features/proximity/simulator';
import { crashReport, useLastError } from '@/lib/crash-log';
import { formatDistance } from '@/lib/geo';
import { AI_LANGUAGES, LOCALES, usePreferences } from '@/lib/preferences';
import { colors } from '@/lib/theme';
import { changeLanguage, tx } from '@/lib/i18n';

export default function SettingsScreen() {
  const [prefs, setPrefs] = usePreferences();
  const location = useLocationState();
  const sim = useSimulator();
  const destinations = useDestinations();
  const dataSync = useDataSync();
  const journey = useJourney();
  const insets = useSafeAreaInsets();
  const [picking, setPicking] = useState(false);

  /** Opt in to background landmark alerts: notifications + "Allow all the time" location. */
  const setBackgroundAlerts = async (enabled: boolean) => {
    if (!enabled) {
      setPrefs({ backgroundAlerts: false });
      await stopGeofences();
      return;
    }
    const notif = await requestNotificationPermission();
    if (!notif) {
      Alert.alert(tx('Notifications are off'), tx('Allow notifications for GoTourGo to get landmark alerts.'), [
        { text: tx('Cancel'), style: 'cancel' },
        { text: tx('Open settings'), onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    Alert.alert(
      tx('Allow location all the time'),
      tx('To alert you about nearby landmarks while GoTourGo is closed, Android needs location access "All the time". GoTourGo uses battery-friendly geofences, not continuous GPS.'),
      [
        { text: tx('Not now'), style: 'cancel' },
        {
          text: tx('Continue'),
          onPress: async () => {
            const granted = await requestBackgroundPermission();
            if (!granted) {
              Alert.alert(tx('Background location not allowed'), tx('Landmark alerts will still work while the app is open. You can enable "Allow all the time" in Settings.'), [
                { text: 'OK' },
                { text: tx('Open settings'), onPress: () => Linking.openSettings() },
              ]);
              return;
            }
            setPrefs({ backgroundAlerts: true });
            await registerGeofences(locationStore.get().fix, true).catch((e) => Alert.alert(tx('Geofencing unavailable'), String(e?.message ?? e)));
          },
        },
      ],
    );
  };

  const testNotification = async () => {
    const ok = await requestNotificationPermission();
    if (!ok) {
      Alert.alert(tx('Notifications are off'), tx('Enable notifications for GoTourGo in Settings.'));
      return;
    }
    notifyNow({ title: tx('GoTourGo notifications work'), body: tx('You will be alerted near landmarks like this.'), channel: CHANNELS.proximity, data: { type: 'test' } });
  };

  return (
    <Screen back title={tx('Settings')}>
      <Card className="gap-1">
        <Text className="text-base font-semibold text-foreground">{tx('Landmark alerts')}</Text>
        <ToggleRow
          title={tx('Alerts when the app is closed')}
          description={
            location.background === 'granted'
              ? tx('Uses Android geofencing (battery-friendly)')
              : tx('Needs notifications and location "All the time"')
          }
          value={prefs.backgroundAlerts}
          onChange={setBackgroundAlerts}
        />
        <ToggleRow title={tx('Show landmark card in the app')} description={tx('Contextual info when you arrive')} value={prefs.inAppProximityCard} onChange={(v) => setPrefs({ inAppProximityCard: v })} />
        <ToggleRow title={tx('Road alert notifications')} description={tx('High and critical alerts near you')} value={prefs.roadAlertNotifications} onChange={(v) => setPrefs({ roadAlertNotifications: v })} />
        <Text className="pt-2 text-sm text-foreground">{tx('Notify me again about the same place after')}</Text>
        <Segmented
          value={String(prefs.proximityCooldownHours)}
          onChange={(v) => setPrefs({ proximityCooldownHours: Number(v) })}
          options={[
            { value: '1', label: tx('1 hour') },
            { value: '6', label: tx('6 hours') },
            { value: '24', label: tx('1 day') },
          ]}
        />
        <AppButton label={tx('Send a test notification')} icon={Bell} variant="ghost" size="sm" onPress={testNotification} />
      </Card>

      <Card className="gap-3">
        <Text className="text-base font-semibold text-foreground">{tx('App language')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {LOCALES.map((l) => (
            <Chip
              key={l.value}
              label={l.label}
              selected={prefs.locale === l.value}
              onPress={() => {
                if (l.value === prefs.locale) return;
                Alert.alert(tx('Change language?'), tx('GoTourGo will restart to switch the language and layout.'), [
                  { text: tx('Cancel'), style: 'cancel' },
                  { text: tx('Restart'), onPress: () => changeLanguage(l.value) },
                ]);
              }}
            />
          ))}
        </View>
        <Text className="text-xs text-muted-foreground">{tx('Menus, buttons and landmark guides appear in this language. Urdu uses right-to-left layout.')}</Text>
      </Card>

      <Card className="gap-3">
        <Text className="text-base font-semibold text-foreground">{tx('AI guide reply language')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {AI_LANGUAGES.map((l) => (
            <Chip key={l.value} label={l.label} selected={prefs.aiLanguage === l.value} onPress={() => setPrefs({ aiLanguage: l.value })} />
          ))}
        </View>
        <Text className="text-xs text-muted-foreground">{tx('The AI guide and Visual Lens can also answer in Chinese or Arabic for visitors.')}</Text>
      </Card>

      <Card className="gap-3">
        <Text className="text-base font-semibold text-foreground">{tx('Default travel mode')}</Text>
        <Segmented
          value={prefs.travelMode}
          onChange={(v) => setPrefs({ travelMode: v })}
          options={[
            { value: 'driving', label: tx('Drive') },
            { value: 'cycling', label: tx('Bike') },
            { value: 'walking', label: tx('Walk') },
          ]}
        />
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-center gap-2">
          <Database color={colors.primary} size={18} />
          <Text className="flex-1 text-base font-semibold text-foreground">{tx('Offline data')}</Text>
        </View>
        <Text className="text-xs text-muted-foreground">{tx('{0} landmarks and {1} places are saved on this phone for offline search, the map and landmark alerts. {2}', { 0: dataSync.counts.destinations.toLocaleString(), 1: dataSync.counts.places.toLocaleString(), 2: dataSync.lastSyncAt ? tx(' Checked {0}.', { 0: new Date(dataSync.lastSyncAt).toLocaleString() }) : '' })}</Text>
        {dataSync.status === 'syncing' ? (
          <Text className="text-sm text-foreground">{tx('Updating {0}: {1} {2}', { 0: dataSync.dataset === 'places' ? 'places' : 'landmarks', 1: dataSync.loaded.toLocaleString(), 2: dataSync.total ? tx(' of {0}', { 0: dataSync.total.toLocaleString() }) : '' })}</Text>
        ) : dataSync.status === 'error' ? (
          <Text className="text-sm text-destructive">{tx('Last update failed: {0}', { 0: dataSync.error })}</Text>
        ) : null}
        <AppButton
          label={tx('Update now')}
          icon={RefreshCw}
          variant="secondary"
          loading={dataSync.status === 'syncing'}
          onPress={() => syncLocalData({ force: true })}
        />
        <AppButton label={tx('Offline maps')} icon={MapIcon} variant="ghost" size="sm" onPress={() => router.push('/offline-maps')} />
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-center gap-2">
          <FlaskConical color={colors.primary} size={18} />
          <Text className="flex-1 text-base font-semibold text-foreground">{tx('Demo tools')}</Text>
        </View>
        <Text className="text-xs text-muted-foreground">
          {tx('Simulate travelling towards a landmark to test geofencing, notifications, the contextual card and navigation without moving. Real GPS is paused while it runs.')}
        </Text>
        {sim.running ? (
          <>
            <Text className="text-sm text-foreground">{tx('Travelling to {0} · step {1}/{2}', { 0: sim.targetName, 1: sim.step, 2: sim.total })}</Text>
            <AppButton label={tx('Stop simulation')} icon={Square} variant="secondary" onPress={() => simulator.stop()} />
          </>
        ) : (
          <>
            <AppButton label={tx('Simulate journey')} icon={Play} variant="secondary" onPress={() => setPicking(true)} />
            <AppButton
              label={journey.phase === 'active' ? tx('Drive the journey to {0}', { 0: journey.target?.name }) : tx('Drive the active journey')}
              icon={Navigation}
              variant="secondary"
              disabled={journey.phase !== 'active' || !journey.route}
              onPress={() => {
                if (!journey.route || !journey.target) return;
                simulator.startAlongRoute(journey.route.coordinates, journey.target.name);
                router.push('/journey/navigate');
              }}
            />
            <Text className="text-xs text-faint">{tx('Start a journey first (search a place, then Start journey), then come back here to drive it at 50 km/h.')}</Text>
          </>
        )}
        <AppButton
          label={tx('Reset landmark cooldowns')}
          icon={RotateCcw}
          variant="ghost"
          size="sm"
          onPress={() => {
            simulator.resetCooldowns();
            Alert.alert(tx('Cooldowns reset'), tx('Landmarks can notify you again.'));
          }}
        />
        <AppButton label={tx('Offline map engine test')} variant="ghost" size="sm" onPress={() => router.push('/map-engine-test')} />
        <LastErrorRow />
      </Card>

      <Card className="gap-2">
        <Text className="text-base font-semibold text-foreground">{tx('Photo credits')}</Text>
        <Text className="text-xs text-muted-foreground">{tx('Welcome and sign-in photos from Wikimedia Commons, used under their free licences.')}</Text>
        {Object.values(HERO_PHOTOS).map((p) => (
          <Text key={p.uri} className="text-xs text-foreground">
            {tx('{0} · {1}', { 0: p.place, 1: p.credit })}
          </Text>
        ))}
      </Card>

      <Text className="text-center text-xs text-muted-foreground">{tx('GoTourGo FYP MVP · Map data © OpenStreetMap contributors')}</Text>

      <Modal visible={picking} animationType="slide" onRequestClose={() => setPicking(false)}>
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center gap-2 px-4 py-3">
            <Text className="flex-1 text-xl font-bold text-foreground">{tx('Choose a landmark')}</Text>
            <IconButton icon={X} label={tx('Close')} onPress={() => setPicking(false)} />
          </View>
          <FlatList
            data={destinations.data ?? []}
            keyExtractor={(d) => d.id}
            contentContainerClassName="gap-2 px-4"
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={async () => {
                  setPicking(false);
                  await requestNotificationPermission();
                  simulator.start({ latitude: item.latitude, longitude: item.longitude, name: item.name, radius: item.radius_m });
                }}
                className="min-h-14 flex-row items-center gap-3 rounded-2xl bg-card px-4 py-3"
              >
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">{item.name}</Text>
                  <Text className="text-xs text-muted-foreground">{tx('{0} · radius {1}', { 0: item.city, 1: formatDistance(item.radius_m) })}</Text>
                </View>
                <Play color={colors.primary} size={18} />
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </Screen>
  );
}

/** The last JavaScript error saved on this phone, to share with the developer after a crash. */
function LastErrorRow() {
  const [last, setLast] = useLastError();
  if (!last) return <Text className="text-xs text-faint">{tx('No errors recorded on this phone.')}</Text>;
  return (
    <View className="gap-2 rounded-2xl bg-destructive-soft p-3">
      <Text className="text-xs font-semibold text-destructive">{tx('Last error · {0}', { 0: new Date(last.at).toLocaleString() })}</Text>
      <Text numberOfLines={3} className="text-xs text-foreground">
        {last.message}
      </Text>
      <View className="flex-row gap-2">
        <AppButton label={tx('Share details')} size="sm" variant="secondary" onPress={() => Share.share({ message: crashReport(last) })} className="flex-1" />
        <AppButton label={tx('Clear')} size="sm" variant="ghost" onPress={() => setLast(null)} />
      </View>
    </View>
  );
}
