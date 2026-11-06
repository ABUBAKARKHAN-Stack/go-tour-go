import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CalendarPlus,
  Check,
  Clock,
  MapPin,
  MessageSquarePlus,
  Navigation,
  QrCode,
  Share2,
  Sparkles,
  Square,
  Star,
  Ticket,
  Volume2,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Pressable, ScrollView, Share, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { Text } from '@/components/text';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton } from '@/components/app-button';
import { Avatar } from '@/components/avatar';
import { DestinationCard } from '@/components/destination-card';
import { DestinationImage } from '@/components/destination-image';
import { Card, Chip, SectionHeader, Segmented } from '@/components/form';
import { RatingStars } from '@/components/rating-stars';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { WeatherCard } from '@/components/weather-card';
import { useAuth } from '@/features/auth/auth-provider';
import { useDestinationDetail, useDestinations, useRatings } from '@/features/destinations/api';
import { DESTINATION_CATEGORIES } from '@/features/destinations/categories';
import { destinationQrValue } from '@/features/destinations/qr';
import { useLastLocation } from '@/features/location/location-store';
import { PlacePostsSection } from '@/features/community/place-posts';
import { useReviews } from '@/features/reviews/api';
import { navigateTo } from '@/features/routing/navigate';
import { useSavedIds, useToggleSaved } from '@/features/saved/api';
import { displayName } from '@/features/social/api';
import { timeAgo } from '@/features/safety/friend-locations';
import { useTripActions, useTrips } from '@/features/trips/api';
import { errorMessage } from '@/lib/errors';
import { distanceMeters, formatDistance } from '@/lib/geo';
import { EASE_OUT, usePressScale } from '@/lib/motion';
import { usePreferences } from '@/lib/preferences';
import { colors } from '@/lib/theme';
import { flipX, tx } from '@/lib/i18n';

const SPEECH_LANG: Record<string, string> = { en: 'en-US', ur: 'ur-PK', ar: 'ar-SA', zh: 'zh-CN' };

type Tab = 'overview' | 'history' | 'tips';

const TAB_FADE = FadeIn.duration(180).easing(EASE_OUT).reduceMotion(ReduceMotion.Never);

/** White round button on the hero photo (Figma 05). */
function HeroButton({ icon: Icon, label, onPress, active, flip }: { icon: LucideIcon; label: string; onPress: () => void; active?: boolean; flip?: boolean }) {
  const press = usePressScale(0.94);
  return (
    <Animated.View style={press.style}>
      <Pressable
        {...press.handlers}
        pressRetentionOffset={16}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={active != null ? { selected: active } : undefined}
        hitSlop={6}
        onPress={onPress}
        className="h-11 w-11 items-center justify-center rounded-full bg-card"
        style={{ boxShadow: '0 2px 8px rgba(28,26,23,0.15)' }}
      >
        <Icon color={active ? colors.accent : colors.foreground} size={20} style={flip ? flipX : undefined} />
      </Pressable>
    </Animated.View>
  );
}

/** 56 pt square action next to Navigate (listen, add to trip). */
function SquareButton({ icon: Icon, label, onPress, active, busy }: { icon: LucideIcon; label: string; onPress: () => void; active?: boolean; busy?: boolean }) {
  const press = usePressScale(0.94);
  return (
    <Animated.View style={press.style}>
      <Pressable
        {...press.handlers}
        pressRetentionOffset={16}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: Boolean(active), busy: Boolean(busy) }}
        onPress={onPress}
        disabled={busy}
        className={`h-14 w-14 items-center justify-center rounded-2xl border ${active ? 'border-primary bg-primary-soft' : 'border-border bg-card'}`}
      >
        {busy ? <ActivityIndicator color={colors.primary} /> : <Icon color={colors.primary} size={22} />}
      </Pressable>
    </Animated.View>
  );
}

/** HOURS / ENTRY cards (Figma 05). */
function InfoCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <View className="flex-1 flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-soft">
        <Icon color={colors.primary} size={18} />
      </View>
      <View className="flex-1">
        <Text className="text-[10px] font-bold tracking-[1.2px] text-faint">{label}</Text>
        <Text numberOfLines={2} className="text-xs font-semibold text-foreground">
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function DestinationDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const [prefs] = usePreferences();
  const { destination: d, isLoading, isError, error, refetch, isFallback } = useDestinationDetail(id);
  const all = useDestinations();
  const ratings = useRatings();
  const reviews = useReviews(d?.id);
  const saved = useSavedIds();
  const toggleSaved = useToggleSaved();
  const trips = useTrips();
  const tripActions = useTripActions();
  const location = useLastLocation();
  const [speaking, setSpeaking] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const { height: windowHeight } = useWindowDimensions();
  // Figma: a 420 pt photo on a 915 pt screen.
  const heroHeight = Math.round(Math.min(440, Math.max(260, windowHeight * 0.44)));

  useEffect(() => () => void Speech.stop(), []);

  const nearby = useMemo(() => {
    if (!d) return [];
    return (all.data ?? [])
      .filter((x) => x.id !== d.id)
      .map((x) => ({ x, dist: distanceMeters(d, x) }))
      .filter((n) => n.dist < 15_000)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 6);
  }, [all.data, d]);

  if (isLoading && !d) {
    return (
      <View className="flex-1 bg-background">
        <LoadingState variant="detail" label={tx('Loading destination...')} />
      </View>
    );
  }
  if (!d) {
    return (
      <View className="flex-1 justify-center bg-background" style={{ paddingTop: insets.top }}>
        {isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <EmptyState title={tx('Destination not found')} actionLabel={tx('Go back')} onAction={() => router.back()} />
        )}
      </View>
    );
  }

  const meta = DESTINATION_CATEGORIES[d.category];
  const rating = ratings.data?.[d.id];
  const isSaved = saved.data?.includes(d.id) ?? false;
  const tripItem = trips.data?.find((t) => t.destination_id === d.id);
  const distance = location ? distanceMeters(location, d) : null;
  const myReview = reviews.data?.find((r) => r.user_id === userId);

  const toggleSpeech = async () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    const text = [d.name, d.short_description, d.history, d.significance, d.tips].filter(Boolean).join('. ');
    setSpeaking(true);
    Speech.speak(text, {
      language: SPEECH_LANG[prefs.locale] ?? 'en-US',
      rate: 0.95,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => {
        setSpeaking(false);
        Alert.alert(tx('Audio guide unavailable'), tx('Your device does not have a voice for this language. Try English.'));
      },
    });
  };

  const addToTrip = () => {
    if (tripItem) {
      router.navigate('/trips');
      return;
    }
    tripActions.add.mutate(
      { destinationId: d.id },
      {
        onSuccess: () => Alert.alert(tx('Added to your trip'), tx('{0} is on your checklist.', { 0: d.name })),
        onError: (e) => Alert.alert(tx('Could not add'), errorMessage(e)),
      },
    );
  };

  // Figma 05: content split into Overview / History / Tips (tabs without content are hidden).
  const tabs = (
    [
      {
        key: 'overview',
        label: tx('Overview'),
        sections: [
          { title: null, body: d.description || d.short_description },
          { title: tx('Culture'), body: d.culture },
          { title: tx('Food & cuisine'), body: d.food },
          { title: tx('Shopping & souvenirs'), body: d.shopping },
        ],
      },
      {
        key: 'history',
        label: tx('History'),
        sections: [
          { title: null, body: d.history },
          { title: tx('Why it matters'), body: d.significance },
        ],
      },
      {
        key: 'tips',
        label: tx('Tips'),
        sections: [
          { title: null, body: d.tips },
          { title: tx('Local customs'), body: d.local_customs },
          { title: tx('Best time to visit'), body: d.best_time },
        ],
      },
    ] as { key: Tab; label: string; sections: { title: string | null; body: string | null | undefined }[] }[]
  ).filter((t) => t.sections.some((x) => x.body));
  const activeTab = tabs.find((t) => t.key === tab) ?? tabs[0];

  const share = () =>
    Share.share({ message: tx('{0} in {1}, on GoTourGo: {2}', { 0: d.name, 1: d.city, 2: d.short_description }) }).catch(() => undefined);

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View>
          <DestinationImage uri={d.image_url} category={d.category} className="w-full" iconSize={72} recyclingKey={d.id} style={{ height: heroHeight }} />
          <View className="absolute left-0 right-0 flex-row items-center justify-between px-5" style={{ top: insets.top + 8 }}>
            <HeroButton icon={ArrowLeft} flip label={tx('Go back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
            <View className="flex-row gap-2">
              <HeroButton icon={Share2} label={tx('Share')} onPress={share} />
              <HeroButton
                icon={isSaved ? BookmarkCheck : Bookmark}
                label={isSaved ? tx('Remove from saved') : tx('Save place')}
                active={isSaved}
                onPress={() => toggleSaved.mutate({ destinationId: d.id, save: !isSaved })}
              />
            </View>
          </View>
        </View>

        <View className="-mt-10 gap-4 rounded-t-[28px] bg-background px-6 pt-6">
          <View className="gap-1.5">
            <Text className="text-[11px] font-bold uppercase tracking-[1.6px] text-accent">
              {meta.label} · {d.city}
            </Text>
            <Text className="font-display text-[32px] leading-[38px] text-foreground">{d.name}</Text>
            <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
              {rating ? (
                <View className="flex-row items-center gap-1">
                  <Star color={colors.rating} fill={colors.rating} size={14} />
                  <Text className="text-xs font-semibold text-foreground">
                    {rating.average_rating.toFixed(1)} <Text className="text-xs font-normal text-muted-foreground">({rating.review_count})</Text>
                  </Text>
                </View>
              ) : null}
              <View className="flex-row items-center gap-1">
                <MapPin color={colors.mutedForeground} size={14} />
                <Text className="text-xs text-muted-foreground">{distance != null ? tx('{0} away', { 0: formatDistance(distance) }) : `${d.city}, ${d.region}`}</Text>
              </View>
              {d.opening_hours ? (
                <View className="flex-row items-center gap-1">
                  <Clock color={colors.success} size={14} />
                  <Text numberOfLines={1} className="max-w-48 text-xs text-success">
                    {d.opening_hours}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View className="flex-row gap-2">
            <AppButton label={tx('Navigate')} icon={Navigation} onPress={() => navigateTo(d)} className="flex-1" />
            <SquareButton icon={speaking ? Square : Volume2} label={speaking ? tx('Stop audio') : tx('Audio guide')} active={speaking} onPress={toggleSpeech} />
            <SquareButton
              icon={tripItem ? Check : CalendarPlus}
              label={tripItem ? tx('In your trip') : tx('Add to trip')}
              active={Boolean(tripItem)}
              busy={tripActions.add.isPending}
              onPress={addToTrip}
            />
          </View>

          {tabs.length > 1 ? <Segmented value={activeTab.key} onChange={setTab} options={tabs.map((t) => ({ value: t.key, label: t.label }))} /> : null}
          {activeTab ? (
            // Switching Overview / History / Tips crossfades the text so the change reads as a change.
            <Animated.View key={activeTab.key} entering={TAB_FADE} className="gap-4">
              {activeTab.sections
                .filter((x) => x.body)
                .map((x) => (
                  <View key={x.title ?? activeTab.key} className="gap-1.5">
                    {x.title ? <Text className="font-display text-xl text-foreground">{x.title}</Text> : null}
                    <Text className="text-[15px] leading-6 text-muted-foreground">{x.body}</Text>
                  </View>
                ))}
            </Animated.View>
          ) : null}

          {d.opening_hours || d.entry_fee ? (
            <View className="flex-row gap-3">
              {d.opening_hours ? <InfoCard icon={Clock} label={tx('HOURS')} value={d.opening_hours} /> : null}
              {d.entry_fee ? <InfoCard icon={Ticket} label={tx('ENTRY')} value={d.entry_fee} /> : null}
            </View>
          ) : null}
          {d.opening_hours || d.entry_fee ? (
            <Text className="-mt-2 text-xs text-faint">{tx('Hours and fees can change; check locally before visiting.')}</Text>
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            <Chip
              label={tx('Ask AI')}
              icon={<Sparkles size={14} color={colors.foreground} />}
              onPress={() => router.push({ pathname: '/assistant', params: { destination: d.slug, q: `What should I know before visiting ${d.name}?` } })}
            />
            <Chip label={tx('View on map')} icon={<MapPin size={14} color={colors.foreground} />} onPress={() => router.navigate({ pathname: '/explore', params: { focus: d.id } })} />
            <Chip label={tx('QR code')} icon={<QrCode size={14} color={colors.foreground} />} onPress={() => setQrOpen(true)} />
          </ScrollView>

          {d.machine_translated ? (
            <Text className="text-xs text-faint">{tx('Parts of this guide were translated into Urdu by AI and may contain mistakes.')}</Text>
          ) : null}

          {isFallback ? (
            <Text className="text-xs text-faint">{tx('Showing the offline summary. The full guide loads when you are connected.')}</Text>
          ) : null}

          {d.wikipedia_url || d.image_credit ? (
            <View className="gap-1">
              {d.wikipedia_url ? (
                <Pressable accessibilityRole="link" onPress={() => Linking.openURL(d.wikipedia_url!)} hitSlop={6}>
                  <Text className="text-xs text-faint">
                    {tx('Text from')}{' '}<Text className="text-xs font-semibold text-primary">{tx('Wikipedia')}</Text>{' '}{tx('(CC BY-SA 4.0)')}
                  </Text>
                </Pressable>
              ) : null}
              {d.image_credit ? (
                <Pressable
                  accessibilityRole="link"
                  disabled={!d.image_page_url}
                  onPress={() => d.image_page_url && Linking.openURL(d.image_page_url)}
                  hitSlop={6}
                >
                  <Text className="text-xs text-faint">{tx('Photo: {0} {1}, Wikimedia Commons', { 0: d.image_credit, 1: d.image_license ? ` (${d.image_license})` : '' })}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <WeatherCard point={d} title={tx('Weather at {0}', { 0: d.name })} />

          <Card className="gap-2">
            <Text className="text-base font-semibold text-foreground">{tx('Location')}</Text>
            <Text className="text-sm text-muted-foreground">{tx('{0}, {1} · Alert radius {2}', { 0: d.latitude.toFixed(4), 1: d.longitude.toFixed(4), 2: formatDistance(d.radius_m) })}</Text>
            <AppButton
              label={tx('Nearby services')}
              variant="outline"
              size="sm"
              onPress={() => router.push({ pathname: '/nearby', params: { lat: String(d.latitude), lng: String(d.longitude), name: d.name } })}
            />
          </Card>

          {nearby.length ? (
            <View className="gap-3">
              <SectionHeader title={tx('Nearby attractions')} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
                {nearby.map((n) => (
                  <DestinationCard key={n.x.id} destination={n.x} distance={n.dist} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <PlacePostsSection destinationId={d.id} name={d.name} />

          <View className="gap-3">
            <SectionHeader
              title={tx('Reviews')}
              actionLabel={myReview ? tx('Edit your review') : tx('Write a review')}
              onAction={() => router.push({ pathname: '/review/new', params: { destinationId: d.id } })}
            />
            {reviews.isLoading ? (
              <LoadingState label={tx('Loading reviews...')} />
            ) : reviews.isError ? (
              <ErrorState error={reviews.error} onRetry={reviews.refetch} />
            ) : (reviews.data ?? []).length === 0 ? (
              <EmptyState
                icon={MessageSquarePlus}
                title={tx('No reviews yet')}
                message={tx('Be the first to share your experience.')}
                actionLabel={tx('Write a review')}
                onAction={() => router.push({ pathname: '/review/new', params: { destinationId: d.id } })}
              />
            ) : (
              reviews.data!.map((r) => (
                <Card key={r.id} className="gap-2">
                  <View className="flex-row items-center gap-2">
                    <Avatar profile={r.author} size={32} />
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">{displayName(r.author)}</Text>
                      <Text className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</Text>
                    </View>
                    <RatingStars value={r.rating} size={12} />
                  </View>
                  {r.body ? <Text className="text-sm text-foreground">{r.body}</Text> : null}
                  {r.image_url ? (
                    <DestinationImage uri={r.image_url} category={d.category} className="h-40 w-full rounded-2xl" />
                  ) : null}
                </Card>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={qrOpen} transparent animationType="fade" onRequestClose={() => setQrOpen(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/70 px-6" onPress={() => setQrOpen(false)}>
          <View className="items-center gap-4 rounded-3xl bg-card p-6">
            <View className="w-full flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground">{d.name}</Text>
              <IconButton icon={X} label={tx('Close')} onPress={() => setQrOpen(false)} />
            </View>
            <View className="rounded-2xl bg-white p-4">
              <QRCode value={destinationQrValue(d.slug)} size={200} />
            </View>
            <Text className="text-center text-xs text-muted-foreground">{tx('Scan with GoTourGo Smart Scan to open this place.')}</Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
