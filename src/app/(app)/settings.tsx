import { router } from 'expo-router';
import { Bell, Database, FlaskConical, Navigation, Play, RefreshCw, RotateCcw, Square, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, Linking, Modal, Pressable, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton } from '@/components/app-button';
import { Card, Chip, Segmented, ToggleRow } from '@/components/form';
import { Screen } from '@/components/screen';
import { syncLocalData, useDataSync } from '@/features/data/sync';
import { useJourney } from '@/features/journey/journey-store';
import { useDestinations } from '@/features/destinations/api';
import { requestBackgroundPermission } from '@/features/location/location-provider';
import { locationStore, useLocationState } from '@/features/location/location-store';
import { CHANNELS, notifyNow, requestNotificationPermission } from '@/features/notifications/local-notifications';
import { registerGeofences, stopGeofences } from '@/features/proximity/geofence-task';
import { simulator, useSimulator } from '@/features/proximity/simulator';
import { formatDistance } from '@/lib/geo';
import { LOCALES, usePreferences } from '@/lib/preferences';
import { colors } from '@/lib/theme';

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
      Alert.alert('Notifications are off', 'Allow notifications for GoTourGo to get landmark alerts.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open settings', onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    Alert.alert(
      'Allow location all the time',
      'To alert you about nearby landmarks while GoTourGo is closed, Android needs location access "All the time". GoTourGo uses battery-friendly geofences, not continuous GPS.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            const granted = await requestBackgroundPermission();
            if (!granted) {
              Alert.alert('Background location not allowed', 'Landmark alerts will still work while the app is open. You can enable "Allow all the time" in Settings.', [
                { text: 'OK' },
                { text: 'Open settings', onPress: () => Linking.openSettings() },
              ]);
              return;
            }
            setPrefs({ backgroundAlerts: true });
            await registerGeofences(locationStore.get().fix, true).catch((e) => Alert.alert('Geofencing unavailable', String(e?.message ?? e)));
          },
        },
      ],
    );
  };

  const testNotification = async () => {
    const ok = await requestNotificationPermission();
    if (!ok) {
      Alert.alert('Notifications are off', 'Enable notifications for GoTourGo in Settings.');
      return;
    }
    notifyNow({ title: 'GoTourGo notifications work', body: 'You will be alerted near landmarks like this.', channel: CHANNELS.proximity, data: { type: 'test' } });
  };

  return (
    <Screen back title="Settings">
      <Card className="gap-1">
        <Text className="text-base font-semibold text-foreground">Landmark alerts</Text>
        <ToggleRow
          title="Alerts when the app is closed"
          description={
            location.background === 'granted'
              ? 'Uses Android geofencing (battery-friendly)'
              : 'Needs notifications and location "All the time"'
          }
          value={prefs.backgroundAlerts}
          onChange={setBackgroundAlerts}
        />
        <ToggleRow title="Show landmark card in the app" description="Contextual info when you arrive" value={prefs.inAppProximityCard} onChange={(v) => setPrefs({ inAppProximityCard: v })} />
        <ToggleRow title="Road alert notifications" description="High and critical alerts near you" value={prefs.roadAlertNotifications} onChange={(v) => setPrefs({ roadAlertNotifications: v })} />
        <Text className="pt-2 text-sm text-foreground">Notify me again about the same place after</Text>
        <Segmented
          value={String(prefs.proximityCooldownHours)}
          onChange={(v) => setPrefs({ proximityCooldownHours: Number(v) })}
          options={[
            { value: '1', label: '1 hour' },
            { value: '6', label: '6 hours' },
            { value: '24', label: '1 day' },
          ]}
        />
        <AppButton label="Send a test notification" icon={Bell} variant="ghost" size="sm" onPress={testNotification} />
      </Card>

      <Card className="gap-3">
        <Text className="text-base font-semibold text-foreground">Guide language</Text>
        <View className="flex-row flex-wrap gap-2">
          {LOCALES.map((l) => (
            <Chip key={l.value} label={l.label} selected={prefs.locale === l.value} onPress={() => setPrefs({ locale: l.value })} />
          ))}
        </View>
        <Text className="text-xs text-muted-foreground">Destination names and descriptions use this language where translations exist; the AI guide answers in it too.</Text>
      </Card>

      <Card className="gap-3">
        <Text className="text-base font-semibold text-foreground">Default travel mode</Text>
        <Segmented
          value={prefs.travelMode}
          onChange={(v) => setPrefs({ travelMode: v })}
          options={[
            { value: 'driving', label: 'Drive' },
            { value: 'cycling', label: 'Bike' },
            { value: 'walking', label: 'Walk' },
          ]}
        />
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-center gap-2">
          <Database color={colors.primary} size={18} />
          <Text className="flex-1 text-base font-semibold text-foreground">Offline data</Text>
        </View>
        <Text className="text-xs text-muted-foreground">
          {dataSync.counts.destinations.toLocaleString()} landmarks and {dataSync.counts.places.toLocaleString()} places are saved on this
          phone for offline search, the map and landmark alerts.
          {dataSync.lastSyncAt ? ` Checked ${new Date(dataSync.lastSyncAt).toLocaleString()}.` : ''}
        </Text>
        {dataSync.status === 'syncing' ? (
          <Text className="text-sm text-foreground">
            Updating {dataSync.dataset === 'places' ? 'places' : 'landmarks'}: {dataSync.loaded.toLocaleString()}
            {dataSync.total ? ` of ${dataSync.total.toLocaleString()}` : ''}
          </Text>
        ) : dataSync.status === 'error' ? (
          <Text className="text-sm text-destructive">Last update failed: {dataSync.error}</Text>
        ) : null}
        <AppButton
          label="Update now"
          icon={RefreshCw}
          variant="secondary"
          loading={dataSync.status === 'syncing'}
          onPress={() => syncLocalData({ force: true })}
        />
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-center gap-2">
          <FlaskConical color={colors.primary} size={18} />
          <Text className="flex-1 text-base font-semibold text-foreground">Demo tools</Text>
        </View>
        <Text className="text-xs text-muted-foreground">
          Simulate travelling towards a landmark to test geofencing, notifications, the contextual card and navigation without moving.
          Real GPS is paused while it runs.
        </Text>
        {sim.running ? (
          <>
            <Text className="text-sm text-foreground">
              Travelling to {sim.targetName} · step {sim.step}/{sim.total}
            </Text>
            <AppButton label="Stop simulation" icon={Square} variant="secondary" onPress={() => simulator.stop()} />
          </>
        ) : (
          <>
            <AppButton label="Simulate journey" icon={Play} variant="secondary" onPress={() => setPicking(true)} />
            <AppButton
              label={journey.phase === 'active' ? `Drive the journey to ${journey.target?.name}` : 'Drive the active journey'}
              icon={Navigation}
              variant="secondary"
              disabled={journey.phase !== 'active' || !journey.route}
              onPress={() => {
                if (!journey.route || !journey.target) return;
                simulator.startAlongRoute(journey.route.coordinates, journey.target.name);
                router.push('/journey/navigate');
              }}
            />
            <Text className="text-xs text-faint">Start a journey first (search a place, then Start journey), then come back here to drive it at 50 km/h.</Text>
          </>
        )}
        <AppButton
          label="Reset landmark cooldowns"
          icon={RotateCcw}
          variant="ghost"
          size="sm"
          onPress={() => {
            simulator.resetCooldowns();
            Alert.alert('Cooldowns reset', 'Landmarks can notify you again.');
          }}
        />
        <AppButton label="Offline map engine test" variant="ghost" size="sm" onPress={() => router.push('/map-engine-test')} />
      </Card>

      <Text className="text-center text-xs text-muted-foreground">GoTourGo FYP MVP · Map data © OpenStreetMap contributors</Text>

      <Modal visible={picking} animationType="slide" onRequestClose={() => setPicking(false)}>
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center gap-2 px-4 py-3">
            <Text className="flex-1 text-xl font-bold text-foreground">Choose a landmark</Text>
            <IconButton icon={X} label="Close" onPress={() => setPicking(false)} />
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
                  <Text className="text-xs text-muted-foreground">
                    {item.city} · radius {formatDistance(item.radius_m)}
                  </Text>
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
