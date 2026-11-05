import { Camera, Map, ViewAnnotation } from '@maplibre/maplibre-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, Clock, Navigation, Phone, Radio, Share2, ShieldAlert, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { AppButton } from '@/components/app-button';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Text } from '@/components/text';
import { useLastLocation } from '@/features/location/location-store';
import { useMapStyle } from '@/features/offline/use-map-style';
import { navigateTo } from '@/features/routing/navigate';
import { timeAgo } from '@/features/safety/friend-locations';
import { endShareLink, isShareToken, shareUrl, useSharedLocation, type SharedLocation } from '@/features/safety/share-links';
import { distanceMeters, formatDistance } from '@/lib/geo';
import { flipX, tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

const EMERGENCY = [
  { number: '15', label: tx('Police') },
  { number: '1122', label: tx('Rescue') },
  { number: '115', label: tx('Edhi ambulance') },
];

/**
 * Opened from an SOS or live-location link (go-tour-go-development.expo.app/sos?t=… or
 * /live?t=…), an in-app SOS alert or a WhatsApp message. Shows where the
 * person is (live while they share), and how to reach them: navigate there
 * in GoTourGo, call them, or call emergency services. Works signed out.
 */
export default function SharedLocationScreen() {
  const { t } = useLocalSearchParams<{ t?: string }>();
  const insets = useSafeAreaInsets();
  const query = useSharedLocation(t);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const header = (title: string) => (
    <View className="flex-row items-center gap-3 px-4 pb-2" style={{ paddingTop: insets.top + 8 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={tx('Go back')} onPress={back} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
        <ArrowLeft color={colors.foreground} size={20} style={flipX} />
      </Pressable>
      <Text numberOfLines={1} className="flex-1 font-display text-2xl text-foreground">
        {title}
      </Text>
    </View>
  );

  if (!isShareToken(t)) {
    return (
      <View className="flex-1 bg-background">
        {header(tx('Shared location'))}
        <EmptyState icon={ShieldAlert} title={tx('Link not recognised')} message={tx('This link is incomplete. Ask the sender to share it again.')} />
      </View>
    );
  }
  if (query.isPending) {
    return (
      <View className="flex-1 bg-background">
        {header(tx('Shared location'))}
        <LoadingState variant="spinner" label={tx('Finding them…')} />
      </View>
    );
  }
  if (query.isError) {
    return (
      <View className="flex-1 bg-background">
        {header(tx('Shared location'))}
        <ErrorState error={query.error} onRetry={query.refetch} />
      </View>
    );
  }
  const data = query.data;
  if (!data) {
    return (
      <View className="flex-1 bg-background">
        {header(tx('Shared location'))}
        <EmptyState icon={ShieldAlert} title={tx('Link not found')} message={tx('This link does not exist. Check that you opened the whole link.')} />
      </View>
    );
  }
  if (data.status !== 'active' || data.latitude == null || data.longitude == null) {
    return (
      <View className="flex-1 bg-background">
        {header(data.kind === 'sos' ? tx('SOS from {0}', { 0: data.name }) : tx("{0}'s location", { 0: data.name }))}
        <EmptyState
          icon={data.status === 'ended' ? CheckCircle2 : Clock}
          title={data.status === 'ended' ? (data.kind === 'sos' ? tx('Marked safe') : tx('Sharing ended')) : data.status === 'expired' ? tx('This link has expired') : tx('Location unavailable')}
          message={
            data.status === 'ended'
              ? tx('{0} ended this link {1}.', { 0: data.name, 1: timeAgo(data.ended_at ?? data.created_at) })
              : data.status === 'expired'
                ? tx('Links show a location for 24 hours. Contact {0} directly if you are still worried.', { 0: data.name })
                : tx('{0} could not get an exact location when sending this.', { 0: data.name })
          }
        />
        <EmergencyRow />
      </View>
    );
  }
  return <ActiveLocation token={t} data={data} header={header} />;
}

function ActiveLocation({ token, data, header }: { token: string; data: SharedLocation; header: (title: string) => React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const mapStyle = useMapStyle();
  const me = useLastLocation();
  const qc = useQueryClient();
  const [ending, setEnding] = useState(false);
  const sos = data.kind === 'sos';
  const position = { latitude: data.latitude!, longitude: data.longitude! };
  const away = me ? distanceMeters(me, position) : null;

  const end = () =>
    Alert.alert(sos ? tx('Are you safe?') : tx('Stop sharing this link?'), sos ? tx('Your SOS link will show that you are safe.') : tx('People with the link will no longer see your location.'), [
      { text: tx('Cancel'), style: 'cancel' },
      {
        text: sos ? tx("I'm safe") : tx('Stop'),
        onPress: async () => {
          setEnding(true);
          try {
            await endShareLink(token);
            await qc.invalidateQueries({ queryKey: ['shared-location', token] });
          } finally {
            setEnding(false);
          }
        },
      },
    ]);

  return (
    <View className="flex-1 bg-background">
      {header(sos ? tx('SOS from {0}', { 0: data.name }) : tx("{0}'s location", { 0: data.name }))}
      <View className="mx-4 h-72 overflow-hidden rounded-3xl border border-border bg-muted">
        <Map style={{ flex: 1 }} mapStyle={mapStyle as never} logo={false} attributionPosition={{ bottom: 8, left: 8 }}>
          <Camera center={[position.longitude, position.latitude]} zoom={15} />
          <ViewAnnotation id="shared-person" lngLat={[position.longitude, position.latitude]}>
            <View className={`h-11 w-11 items-center justify-center rounded-full border-[3px] border-white ${sos ? 'bg-destructive' : 'bg-primary'}`}>
              <UserRound color="#FFFFFF" size={20} />
            </View>
          </ViewAnnotation>
          {me ? (
            <ViewAnnotation id="shared-me" lngLat={[me.longitude, me.latitude]}>
              <View className="h-4 w-4 rounded-full border-2 border-white bg-info" />
            </ViewAnnotation>
          ) : null}
        </Map>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-4 pt-4" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View className={`gap-1 rounded-3xl p-4 ${sos ? 'bg-destructive-soft' : 'bg-primary-soft'}`}>
          <View className="flex-row items-center gap-2">
            {data.live ? <Radio color={sos ? colors.destructive : colors.primary} size={16} /> : <Clock color={colors.mutedForeground} size={16} />}
            <Text className={`flex-1 text-sm font-semibold ${sos ? 'text-destructive' : 'text-primary'}`}>
              {data.live ? tx('Live location · updated {0}', { 0: timeAgo(data.located_at ?? data.created_at) }) : tx('Location when sent · {0}', { 0: timeAgo(data.located_at ?? data.created_at) })}
            </Text>
          </View>
          <Text className="text-sm text-foreground">
            {[
              away != null ? tx('{0} from you', { 0: formatDistance(away) }) : null,
              data.accuracy ? tx('accurate to about {0}', { 0: formatDistance(data.accuracy) }) : null,
              tx('link works until {0}', { 0: new Date(data.expires_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) }),
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          {sos ? <Text className="text-xs text-muted-foreground">{tx('{0} pressed SOS in GoTourGo {1}.', { 0: data.name, 1: timeAgo(data.created_at) })}</Text> : null}
        </View>

        {data.is_owner ? (
          <AppButton label={sos ? tx("I'm safe · end SOS link") : tx('Stop sharing this link')} icon={CheckCircle2} variant="secondary" loading={ending} onPress={end} />
        ) : (
          <>
            <AppButton
              label={tx('Navigate to {0}', { 0: data.name })}
              icon={Navigation}
              variant={sos ? 'destructive' : 'primary'}
              onPress={() => navigateTo({ id: `share:${token}`, name: data.name, latitude: position.latitude, longitude: position.longitude, subtitle: sos ? tx('SOS location') : tx('Shared location') })}
            />
            {data.phone ? <AppButton label={tx('Call {0}', { 0: data.name })} icon={Phone} variant="secondary" onPress={() => Linking.openURL(`tel:${data.phone}`)} /> : null}
          </>
        )}
        <AppButton
          label={tx('Share this link')}
          icon={Share2}
          variant="outline"
          onPress={() => Share.share({ message: `${sos ? tx('SOS from {0}', { 0: data.name }) : tx("{0}'s location", { 0: data.name })}: ${shareUrl(data.kind, token)}` })}
        />
        {sos ? <EmergencyRow /> : null}
        <Text className="text-xs leading-5 text-faint">
          {tx('GoTourGo does not contact emergency services by itself. If someone is in danger, call the numbers above.')}
        </Text>
      </ScrollView>
    </View>
  );
}

function EmergencyRow() {
  return (
    <View className="flex-row gap-2 px-4">
      {EMERGENCY.map((n) => (
        <Pressable
          key={n.number}
          accessibilityRole="button"
          accessibilityLabel={tx('Call {0} {1}', { 0: n.label, 1: n.number })}
          onPress={() => Linking.openURL(`tel:${n.number}`)}
          className="min-h-16 flex-1 items-center justify-center rounded-2xl border border-border bg-card"
        >
          <Text className="text-lg font-bold text-destructive">{n.number}</Text>
          <Text className="text-[11px] text-muted-foreground">{n.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
