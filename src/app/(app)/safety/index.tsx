import { router } from 'expo-router';
import { Info, MapPin, MessageCircle, Phone, Radio, Share2, ShieldAlert, Square, UserPlus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, Pressable, Share, View } from 'react-native';
import { Text } from '@/components/text';

import { AppButton } from '@/components/app-button';
import { Card, SectionHeader } from '@/components/form';
import { Screen } from '@/components/screen';
import { LoadingState } from '@/components/states';
import { useAuth } from '@/features/auth/auth-provider';
import { getCurrentFix, requestBackgroundPermission, requestLocationPermission } from '@/features/location/location-provider';
import { useLocationState } from '@/features/location/location-store';
import { LocationStatusCard } from '@/features/location/location-status-card';
import { logSosEvent, mapsLink, openWhatsApp, sosMessage, useTrustedContacts } from '@/features/safety/api';
import { timeAgo, useFriendLocations } from '@/features/safety/friend-locations';
import { isSessionLive, SHARING_DURATIONS, startSharing, stopSharing, useSharingSession } from '@/features/safety/sharing';
import { displayName } from '@/features/social/api';
import { errorMessage } from '@/lib/errors';
import { colors } from '@/lib/theme';

const EMERGENCY_NUMBERS = [
  { label: 'Rescue', number: '1122' },
  { label: 'Police', number: '15' },
  { label: 'Edhi ambulance', number: '115' },
  { label: 'Motorway police', number: '130' },
];

type SosState = { message: string; lat: number | null; lng: number | null } | null;

export default function SafetyScreen() {
  const { profile } = useAuth();
  const contacts = useTrustedContacts();
  const session = useSharingSession();
  const friends = useFriendLocations();
  const location = useLocationState();
  const [sos, setSos] = useState<SosState>(null);
  const [triggering, setTriggering] = useState(false);
  const [sharingBusy, setSharingBusy] = useState(false);
  const live = isSessionLive(session);

  const triggerSos = async () => {
    setTriggering(true);
    try {
      if (location.permission !== 'granted') await requestLocationPermission();
      const fix = await getCurrentFix();
      const name = displayName(profile);
      const message = sosMessage(name, fix?.latitude ?? null, fix?.longitude ?? null);
      setSos({ message, lat: fix?.latitude ?? null, lng: fix?.longitude ?? null });
      // Log (friends get an in-app alert via a DB trigger) and share live location for 1 hour.
      logSosEvent({
        latitude: fix?.latitude ?? null,
        longitude: fix?.longitude ?? null,
        accuracy: fix?.accuracy ?? null,
        message,
        contacts: contacts.data?.length ?? 0,
      }).catch(() => undefined);
      if (fix && !live) startSharing(60 * 60_000, fix).catch(() => undefined);
    } catch (e) {
      Alert.alert('SOS', errorMessage(e));
    } finally {
      setTriggering(false);
    }
  };

  const toggleSharing = async (durationMs: number | null) => {
    setSharingBusy(true);
    try {
      if (live) {
        await stopSharing();
        return;
      }
      if (location.permission !== 'granted' && !(await requestLocationPermission())) return;
      const fix = await getCurrentFix();
      if (!fix) {
        Alert.alert('Location unavailable', 'We could not get your location. Try again outdoors.');
        return;
      }
      // Ask for "Allow all the time" so sharing continues in the background.
      const bg = await requestBackgroundPermission();
      const { background } = await startSharing(durationMs, fix);
      if (!bg || !background) {
        Alert.alert('Sharing while the app is open', 'Allow location "all the time" in Settings to keep sharing when GoTourGo is in the background.');
      }
    } catch (e) {
      Alert.alert('Location sharing', errorMessage(e));
    } finally {
      setSharingBusy(false);
    }
  };

  return (
    <Screen back title="Safety" subtitle="Travel with peace of mind">
      <View className="flex-row gap-2 rounded-2xl border border-warning/40 bg-warning/10 p-3">
        <Info color={colors.warning} size={16} />
        <Text className="flex-1 text-xs text-foreground">
          SOS is a demonstration feature. It does not contact police or rescue services automatically. In an emergency, call
          the numbers below directly.
        </Text>
      </View>

      <Card className="items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hold for SOS"
          accessibilityHint="Press and hold for one second to send your location to trusted contacts"
          onLongPress={triggerSos}
          delayLongPress={1000}
          disabled={triggering}
          className="h-40 w-40 items-center justify-center rounded-full border-8 border-destructive/30 bg-destructive active:scale-95"
        >
          <ShieldAlert color="#fff" size={44} />
          <Text className="mt-1 text-2xl font-extrabold text-white">SOS</Text>
          <Text className="text-xs text-white/80">{triggering ? 'Locating...' : 'Hold 1 second'}</Text>
        </Pressable>
        <Text className="text-center text-xs text-muted-foreground">
          Sends your location to your trusted contacts via WhatsApp, alerts your GoTourGo friends and shares your live location
          for 1 hour.
        </Text>
      </Card>

      {sos ? (
        <Card className="gap-3 border-destructive/50">
          <Text className="text-base font-bold text-foreground">Send your SOS</Text>
          {sos.lat != null ? (
            <Pressable onPress={() => Linking.openURL(mapsLink(sos.lat!, sos.lng!))} className="flex-row items-center gap-1">
              <MapPin color={colors.primary} size={14} />
              <Text className="text-xs text-accent">
                {sos.lat.toFixed(5)}, {sos.lng!.toFixed(5)}
              </Text>
            </Pressable>
          ) : (
            <Text className="text-xs text-destructive">Location unavailable. Your message says so.</Text>
          )}
          {contacts.isLoading ? <LoadingState /> : null}
          {(contacts.data ?? []).map((c) => (
            <AppButton key={c.id} label={`WhatsApp ${c.name}`} icon={MessageCircle} variant="destructive" onPress={() => openWhatsApp(c.phone, sos.message)} />
          ))}
          {contacts.data?.length === 0 ? (
            <AppButton label="Add a trusted contact" icon={UserPlus} variant="secondary" onPress={() => router.push('/safety/contacts')} />
          ) : null}
          <AppButton label="Share another way" icon={Share2} variant="outline" onPress={() => Share.share({ message: sos.message })} />
          <AppButton label="Done" variant="ghost" onPress={() => setSos(null)} />
        </Card>
      ) : null}

      <View className="gap-2">
        <SectionHeader title="Emergency numbers (Pakistan)" />
        <View className="flex-row flex-wrap gap-2">
          {EMERGENCY_NUMBERS.map((n) => (
            <Pressable
              key={n.number}
              accessibilityRole="button"
              accessibilityLabel={`Call ${n.label} ${n.number}`}
              onPress={() => Linking.openURL(`tel:${n.number}`)}
              className="min-h-14 w-[48%] flex-row items-center gap-2 rounded-2xl bg-card px-3"
            >
              <Phone color={colors.destructive} size={18} />
              <View>
                <Text className="text-base font-bold text-foreground">{n.number}</Text>
                <Text className="text-xs text-muted-foreground">{n.label}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <Card className="gap-3">
        <View className="flex-row items-center gap-2">
          <Radio color={live ? colors.success : colors.accent} size={18} />
          <Text className="flex-1 text-base font-semibold text-foreground">Live location sharing</Text>
          {live ? <Text className="text-xs font-bold text-success">ACTIVE</Text> : null}
        </View>
        {live ? (
          <>
            <Text className="text-sm text-muted-foreground">
              Your accepted friends can see your location{' '}
              {session.expiresAt ? `until ${new Date(session.expiresAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` : 'until you stop'}.
              {session.lastSentAt ? ` Last update ${timeAgo(session.lastSentAt)}.` : ''}
            </Text>
            <AppButton label="Stop sharing" icon={Square} variant="destructive" loading={sharingBusy} onPress={() => toggleSharing(null)} />
          </>
        ) : (
          <>
            <Text className="text-sm text-muted-foreground">Only accepted friends can see it. You can stop at any time.</Text>
            <View className="gap-2">
              {SHARING_DURATIONS.map((d) => (
                <AppButton key={d.label} label={`Share for ${d.label.toLowerCase()}`} variant="secondary" size="sm" disabled={sharingBusy} onPress={() => toggleSharing(d.ms)} />
              ))}
            </View>
          </>
        )}
        <LocationStatusCard compact />
      </Card>

      <Card className="gap-3">
        <SectionHeader title="Friends sharing with you" actionLabel="Map" onAction={() => router.navigate('/explore')} />
        {!friends.hasFriends ? (
          <Text className="text-sm text-muted-foreground">Add friends to see their shared locations.</Text>
        ) : friends.locations.length === 0 ? (
          <Text className="text-sm text-muted-foreground">No friends are sharing their location right now.</Text>
        ) : (
          friends.locations.map((f) => (
            <View key={f.user_id} className="flex-row items-center gap-2">
              <View className={`h-2.5 w-2.5 rounded-full ${f.stale ? 'bg-muted-foreground' : 'bg-success'}`} />
              <Text className="flex-1 text-sm text-foreground">{displayName(f.profile)}</Text>
              <Text className="text-xs text-muted-foreground">{f.stale ? `stale · ${timeAgo(f.updated_at)}` : timeAgo(f.updated_at)}</Text>
            </View>
          ))
        )}
      </Card>

      <Card className="gap-3">
        <SectionHeader title="Trusted contacts" actionLabel="Manage" onAction={() => router.push('/safety/contacts')} />
        {(contacts.data ?? []).length === 0 ? (
          <Text className="text-sm text-muted-foreground">Add family or friends who should receive your SOS on WhatsApp.</Text>
        ) : (
          contacts.data!.map((c) => (
            <View key={c.id} className="flex-row items-center gap-2">
              <Users color={colors.primary} size={14} />
              <Text className="flex-1 text-sm text-foreground">
                {c.name}
                {c.relationship ? ` (${c.relationship})` : ''}
              </Text>
              <Text className="text-xs text-muted-foreground">{c.phone}</Text>
            </View>
          ))
        )}
      </Card>
    </Screen>
  );
}
