import { router } from 'expo-router';
import { CheckCircle2, Info, Link2, MapPin, MessageCircle, Phone, Radio, Share2, ShieldAlert, Square, UserPlus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, Pressable, Share, View } from 'react-native';
import { Text } from '@/components/text';

import { AppButton } from '@/components/app-button';
import { Card, SectionHeader, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { LoadingState } from '@/components/states';
import { useAuth } from '@/features/auth/auth-provider';
import { getCurrentFix, requestBackgroundPermission, requestLocationPermission } from '@/features/location/location-provider';
import { useLocationState } from '@/features/location/location-store';
import { LocationStatusCard } from '@/features/location/location-status-card';
import { openWhatsApp, sosMessage, useTrustedContacts } from '@/features/safety/api';
import { createShareLink, endLiveLinks, endShareLink, shareUrl, useOwnPhone } from '@/features/safety/share-links';
import { timeAgo, useFriendLocations } from '@/features/safety/friend-locations';
import { isSessionLive, SHARING_DURATIONS, setSharingAudience, startSharing, stopSharing, useSharingSession, type ShareAudience } from '@/features/safety/sharing';
import { ViewerPicker } from '@/features/safety/viewer-picker';
import { useShareViewers } from '@/features/safety/viewers';
import { displayName, useFriendships } from '@/features/social/api';
import { haptics } from '@/lib/haptics';
import { errorMessage } from '@/lib/errors';
import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

const EMERGENCY_NUMBERS = [
  { label: tx('Rescue'), number: '1122' },
  { label: tx('Police'), number: '15' },
  { label: tx('Edhi ambulance'), number: '115' },
  { label: tx('Motorway police'), number: '130' },
];

type SosState = { message: string; lat: number | null; lng: number | null; token: string | null } | null;

export default function SafetyScreen() {
  const { profile } = useAuth();
  const contacts = useTrustedContacts();
  const session = useSharingSession();
  const friends = useFriendLocations();
  const location = useLocationState();
  const [sos, setSos] = useState<SosState>(null);
  const [triggering, setTriggering] = useState(false);
  const [sharingBusy, setSharingBusy] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [ownPhone, setOwnPhone] = useOwnPhone();
  const live = isSessionLive(session);
  const { friends: friendRows } = useFriendships();
  const friendProfiles = friendRows.map((f) => f.profile);
  const viewers = useShareViewers();
  // Who sees the share. Until the user touches the picker, follow the running
  // session (or "all friends") and the friends saved last time.
  const [audienceChoice, setAudienceChoice] = useState<ShareAudience | null>(null);
  const [chosenChoice, setChosenChoice] = useState<Set<string> | null>(null);
  const [editingAudience, setEditingAudience] = useState(false);
  const audience: ShareAudience = audienceChoice ?? (live ? (session.audience ?? 'friends') : 'friends');
  const chosen = chosenChoice ?? new Set(viewers.viewers);
  const chosenFriendIds = friendProfiles.map((p) => p.id).filter((id) => chosen.has(id));
  const toggleChosen = (id: string) => {
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChosenChoice(next);
  };

  /** Saves the picked friends; false when "Chosen friends" has nobody picked. */
  const saveAudience = async () => {
    if (audience === 'selected') {
      if (chosenFriendIds.length === 0) {
        Alert.alert(tx('Choose friends'), tx('Pick at least one friend, or share with all friends.'));
        return false;
      }
      await viewers.save(chosenFriendIds);
    }
    return true;
  };

  const applyAudience = async () => {
    setSharingBusy(true);
    try {
      if (!(await saveAudience())) return;
      await setSharingAudience(audience);
      setEditingAudience(false);
    } catch (e) {
      Alert.alert(tx('Location sharing'), errorMessage(e));
    } finally {
      setSharingBusy(false);
    }
  };

  const triggerSos = async () => {
    haptics.longPress(); // the hold committed: same moment the button changes to "Locating..."
    setTriggering(true);
    try {
      if (location.permission !== 'granted') await requestLocationPermission();
      const fix = await getCurrentFix();
      const name = displayName(profile);
      // Share live location for 1 hour, so the SOS link follows the traveller.
      // An SOS always goes to all friends, whatever was chosen for normal sharing.
      if (fix && !live) await startSharing(60 * 60_000, fix).catch(() => undefined);
      // The SOS link (friends also get an in-app alert via a DB trigger). Without
      // internet the message falls back to coordinates.
      const token = await createShareLink({
        kind: 'sos',
        latitude: fix?.latitude ?? null,
        longitude: fix?.longitude ?? null,
        accuracy: fix?.accuracy ?? null,
        message: 'SOS',
        contacts: contacts.data?.length ?? 0,
      }).catch(() => null);
      const message = sosMessage(name, token ? shareUrl('sos', token) : null, fix?.latitude ?? null, fix?.longitude ?? null);
      setSos({ message, lat: fix?.latitude ?? null, lng: fix?.longitude ?? null, token });
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
        haptics.off();
        await endLiveLinks().catch(() => undefined);
        return;
      }
      if (!(await saveAudience())) return;
      if (location.permission !== 'granted' && !(await requestLocationPermission())) return;
      const fix = await getCurrentFix();
      if (!fix) {
        Alert.alert(tx('Location unavailable'), tx('We could not get your location. Try again outdoors.'));
        return;
      }
      // Ask for "Allow all the time" so sharing continues in the background.
      const bg = await requestBackgroundPermission();
      const { background } = await startSharing(durationMs, fix, audience);
      haptics.success();
      if (!bg || !background) {
        Alert.alert(tx('Sharing while the app is open'), tx('Allow location "all the time" in Settings to keep sharing when GoTourGo is in the background.'));
      }
    } catch (e) {
      Alert.alert(tx('Location sharing'), errorMessage(e));
    } finally {
      setSharingBusy(false);
    }
  };

  const shareLiveLink = async () => {
    setLinkBusy(true);
    try {
      const fix = await getCurrentFix();
      const token = await createShareLink({
        kind: 'live',
        latitude: fix?.latitude ?? null,
        longitude: fix?.longitude ?? null,
        accuracy: fix?.accuracy ?? null,
        expiresAt: session.expiresAt,
      });
      if (!token) return;
      await Share.share({ message: tx('Follow my live location on GoTourGo: {0}', { 0: shareUrl('live', token) }) });
    } catch (e) {
      Alert.alert(tx('Could not create the link'), errorMessage(e));
    } finally {
      setLinkBusy(false);
    }
  };

  const imSafe = async () => {
    if (sos?.token) await endShareLink(sos.token).catch(() => undefined);
    setSos(null);
  };

  return (
    <Screen back title={tx('Safety')} subtitle={tx('Travel with peace of mind')}>
      <View className="flex-row gap-2 rounded-2xl border border-warning/40 bg-warning/10 p-3">
        <Info color={colors.warning} size={16} />
        <Text className="flex-1 text-xs text-foreground">
          {tx('SOS is a demonstration feature. It does not contact police or rescue services automatically. In an emergency, call the numbers below directly.')}
        </Text>
      </View>

      <Card className="items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tx('Hold for SOS')}
          accessibilityHint={tx('Press and hold for one second to send your location to trusted contacts')}
          onLongPress={triggerSos}
          delayLongPress={1000}
          disabled={triggering}
          className="h-40 w-40 items-center justify-center rounded-full border-8 border-destructive/30 bg-destructive active:scale-95"
        >
          <ShieldAlert color="#fff" size={44} />
          <Text className="mt-1 text-2xl font-extrabold text-white">{tx('SOS')}</Text>
          <Text className="text-xs text-white/80">{triggering ? tx('Locating...') : tx('Hold 1 second')}</Text>
        </Pressable>
        <Text className="text-center text-xs text-muted-foreground">
          {tx('Sends your location to your trusted contacts via WhatsApp, alerts your GoTourGo friends and shares your live location for 1 hour.')}
        </Text>
      </Card>

      {sos ? (
        <Card className="gap-3 border-destructive/50">
          <Text className="text-base font-bold text-foreground">{tx('Send your SOS')}</Text>
          {sos.lat != null ? (
            <Pressable
              disabled={!sos.token}
              onPress={() => sos.token && router.push({ pathname: '/sos', params: { t: sos.token } })}
              className="flex-row items-center gap-1"
            >
              <MapPin color={colors.primary} size={14} />
              <Text className="text-xs text-accent">
                {sos.lat.toFixed(5)}, {sos.lng!.toFixed(5)}
              </Text>
            </Pressable>
          ) : (
            <Text className="text-xs text-destructive">{tx('Location unavailable. Your message says so.')}</Text>
          )}
          {contacts.isLoading ? <LoadingState /> : null}
          {(contacts.data ?? []).map((c) => (
            <AppButton key={c.id} label={tx('WhatsApp {0}', { 0: c.name })} icon={MessageCircle} variant="destructive" onPress={() => openWhatsApp(c.phone, sos.message)} />
          ))}
          {contacts.data?.length === 0 ? (
            <AppButton label={tx('Add a trusted contact')} icon={UserPlus} variant="secondary" onPress={() => router.push('/safety/contacts')} />
          ) : null}
          <AppButton label={tx('Share another way')} icon={Share2} variant="outline" onPress={() => Share.share({ message: sos.message })} />
          {sos.token ? (
            <Text className="text-xs text-muted-foreground">{tx('Your SOS link shows your live location for 24 hours, or until you say you are safe.')}</Text>
          ) : (
            <Text className="text-xs text-accent">{tx('No internet: the message has your coordinates instead of a live link.')}</Text>
          )}
          <AppButton label={sos.token ? tx("I'm safe · end SOS link") : tx('Done')} icon={sos.token ? CheckCircle2 : undefined} variant="ghost" onPress={imSafe} />
        </Card>
      ) : null}

      <View className="gap-2">
        <SectionHeader title={tx('Emergency numbers (Pakistan)')} />
        <View className="flex-row flex-wrap gap-2">
          {EMERGENCY_NUMBERS.map((n) => (
            <Pressable
              key={n.number}
              accessibilityRole="button"
              accessibilityLabel={tx('Call {0} {1}', { 0: n.label, 1: n.number })}
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
          <Text className="flex-1 text-base font-semibold text-foreground">{tx('Live location sharing')}</Text>
          {live ? <Text className="text-xs font-bold text-success">{tx('ACTIVE')}</Text> : null}
        </View>
        {live ? (
          <>
            <Text className="text-sm text-muted-foreground">{tx(audience === 'selected' ? '{2} chosen friends can see your location {0}. {1}' : 'Your accepted friends can see your location {0}. {1}', { 2: chosenFriendIds.length, 0: session.expiresAt ? tx('until {0}', { 0: new Date(session.expiresAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) }) : tx('until you stop'), 1: session.lastSentAt ? tx(' Last update {0}.', { 0: timeAgo(session.lastSentAt) }) : '' })}</Text>
            {editingAudience ? (
              <>
                <ViewerPicker audience={audience} onAudience={setAudienceChoice} friends={friendProfiles} chosen={chosen} onToggle={toggleChosen} />
                <AppButton label={tx('Save')} variant="primary" size="sm" loading={sharingBusy} onPress={applyAudience} />
              </>
            ) : (
              <AppButton label={tx('Change who can see')} icon={Users} variant="ghost" size="sm" onPress={() => setEditingAudience(true)} />
            )}
            <AppButton label={tx('Share live link')} icon={Link2} variant="secondary" loading={linkBusy} onPress={shareLiveLink} />
            <AppButton label={tx('Stop sharing')} icon={Square} variant="destructive" loading={sharingBusy} onPress={() => toggleSharing(null)} />
          </>
        ) : (
          <>
            <Text className="text-sm text-muted-foreground">{tx('Only accepted friends can see it. You can stop at any time.')}</Text>
            <ViewerPicker audience={audience} onAudience={setAudienceChoice} friends={friendProfiles} chosen={chosen} onToggle={toggleChosen} />
            <View className="gap-2">
              {SHARING_DURATIONS.map((d) => (
                <AppButton key={d.label} label={tx('Share for {0}', { 0: d.label.toLowerCase() })} variant="secondary" size="sm" disabled={sharingBusy} onPress={() => toggleSharing(d.ms)} />
              ))}
            </View>
          </>
        )}
        <LocationStatusCard compact />
      </Card>

      <Card className="gap-3">
        <SectionHeader title={tx('Friends sharing with you')} actionLabel={tx('Map')} onAction={() => router.navigate('/explore')} />
        {!friends.hasFriends ? (
          <Text className="text-sm text-muted-foreground">{tx('Add friends to see their shared locations.')}</Text>
        ) : friends.locations.length === 0 ? (
          <Text className="text-sm text-muted-foreground">{tx('No friends are sharing their location right now.')}</Text>
        ) : (
          friends.locations.map((f) => (
            <View key={f.user_id} className="flex-row items-center gap-2">
              <View className={`h-2.5 w-2.5 rounded-full ${f.stale ? 'bg-muted-foreground' : 'bg-success'}`} />
              <Text className="flex-1 text-sm text-foreground">{displayName(f.profile)}</Text>
              <Text className="text-xs text-muted-foreground">{f.stale ? tx('stale · {0}', { 0: timeAgo(f.updated_at) }) : timeAgo(f.updated_at)}</Text>
            </View>
          ))
        )}
      </Card>

      <Card className="gap-3">
        <SectionHeader title={tx('Trusted contacts')} actionLabel={tx('Manage')} onAction={() => router.push('/safety/contacts')} />
        <TextField
          label={tx('Your phone number (optional)')}
          value={ownPhone}
          onChangeText={setOwnPhone}
          keyboardType="phone-pad"
          autoComplete="tel"
          placeholder="+92 300 1234567"
          hint={tx('Shown on your SOS link so people can call you. Saved on this phone only.')}
        />
        {(contacts.data ?? []).length === 0 ? (
          <Text className="text-sm text-muted-foreground">{tx('Add family or friends who should receive your SOS on WhatsApp.')}</Text>
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
