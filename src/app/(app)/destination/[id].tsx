import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  CalendarPlus,
  Car,
  Check,
  Clock,
  FileText,
  Lightbulb,
  Map as MapIcon,
  MapPin,
  MessageSquarePlus,
  Navigation,
  QrCode,
  ScrollText,
  Share2,
  Sparkles,
  Square,
  Star,
  Ticket,
  Volume2,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, Share, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { Text } from '@/components/text';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton } from '@/components/app-button';
import { Avatar } from '@/components/avatar';
import { DestinationCard } from '@/components/destination-card';
import { DestinationImage } from '@/components/destination-image';
import { SweepEdge } from '@/components/brand';
import { Chip, SectionHeader } from '@/components/form';
import { RatingStars } from '@/components/rating-stars';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { WeatherCard } from '@/components/weather-card';
import { AiBadge } from '@/features/ai/chat-bubbles';
import { PlaceChatSheet, placePrompts } from '@/features/ai/place-chat-sheet';
import { useAuth } from '@/features/auth/auth-provider';
import { sweepHeight, sweepOverlap } from '@/features/brand/mood';
import { formatCount } from '@/features/community/format';
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
import { colors, shadow } from '@/lib/theme';
import { flipX, isUrdu, tx } from '@/lib/i18n';
import { useRequireAccount } from '@/features/auth/guest-gate';

const SPEECH_LANG: Record<string, string> = { en: 'en-US', ur: 'ur-PK' };

type Tab = 'overview' | 'history' | 'tips';

const TAB_FADE = FadeIn.duration(180).easing(EASE_OUT).reduceMotion(ReduceMotion.Never);

/** White round button on the hero photo. */
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
        className="h-11 w-11 items-center justify-center rounded-full bg-white/90"
        style={{ boxShadow: shadow(0.15, 2, 8) }}
      >
        <Icon color={active ? colors.accent : colors.heading} fill={active ? colors.accent : 'transparent'} size={20} style={flip ? flipX : undefined} />
      </Pressable>
    </Animated.View>
  );
}

/** A row of the facts card (best time, hours, entry, distance). */
function FactRow({ icon: Icon, label, value, last }: { icon: LucideIcon; label: string; value: string; last?: boolean }) {
  return (
    <View className={`flex-row items-center gap-3 py-3 ${last ? '' : 'border-b border-border'}`}>
      <Icon color={colors.primary} size={22} strokeWidth={1.8} />
      <View className="flex-1 gap-0.5">
        <Text className="text-xs text-muted-foreground">{label}</Text>
        <Text selectable className="text-sm font-semibold text-heading">
          {value}
        </Text>
      </View>
    </View>
  );
}

const CARD = { boxShadow: shadow(0.08, 6, 20) };

const TAB_ICONS: Record<Tab, LucideIcon> = { overview: FileText, history: ScrollText, tips: Lightbulb };

export default function DestinationDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const requireAccount = useRequireAccount();
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
  const [chat, setChat] = useState<{ open: boolean; request: { id: number; prompt: string | null } }>({ open: false, request: { id: 0, prompt: null } });
  const { width, height: windowHeight } = useWindowDimensions();
  // Photo about 42% of the screen, status bar included; the page sweeps up over it.
  const heroHeight = Math.round(Math.min(420, Math.max(280, windowHeight * 0.42)));
  const openChat = (prompt: string | null) => setChat((c) => ({ open: true, request: prompt ? { id: c.request.id + 1, prompt } : c.request }));

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
          { title: tx('About this place'), body: d.description || d.short_description },
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
        ],
      },
    ] as { key: Tab; label: string; sections: { title: string | null; body: string | null | undefined }[] }[]
  ).filter((t) => t.sections.some((x) => x.body));
  const activeTab = tabs.find((t) => t.key === tab) ?? tabs[0];

  const share = () =>
    Share.share({ message: tx('{0} in {1}, on GoTourGo: {2}', { 0: d.name, 1: d.city, 2: d.short_description }) }).catch(() => undefined);

  const facts = [
    d.best_time ? { icon: CalendarDays, label: tx('Best time to visit'), value: d.best_time } : null,
    d.opening_hours ? { icon: Clock, label: tx('Hours'), value: d.opening_hours } : null,
    d.entry_fee ? { icon: Ticket, label: tx('Entry'), value: d.entry_fee } : null,
    distance != null ? { icon: Car, label: tx('Distance from you'), value: formatDistance(distance) } : null,
  ].filter((f): f is { icon: LucideIcon; label: string; value: string } => Boolean(f));
  const CategoryIcon = meta.icon;

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 96 }} showsVerticalScrollIndicator={false}>
        <View style={{ height: heroHeight }}>
          <DestinationImage uri={d.image_url} category={d.category} className="w-full" iconSize={72} recyclingKey={d.id} style={{ height: heroHeight }} />
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, right: 0, top: 0, height: insets.top + 72, experimental_backgroundImage: 'linear-gradient(180deg, rgba(246,250,252,0.75), rgba(246,250,252,0))' }}
          />
          <View className="absolute bottom-0 left-0 right-0" pointerEvents="none">
            <SweepEdge width={width} height={sweepHeight('auth', width)} shape="slope" mirrored={isUrdu} />
          </View>
          <View className="absolute left-0 right-0 flex-row items-center justify-between px-5" style={{ top: insets.top + 8 }}>
            <HeroButton icon={ArrowLeft} flip label={tx('Go back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
            <View className="flex-row gap-2">
              <HeroButton icon={QrCode} label={tx('QR code')} onPress={() => setQrOpen(true)} />
              <HeroButton icon={Share2} label={tx('Share')} onPress={share} />
              <HeroButton
                icon={Bookmark}
                label={isSaved ? tx('Remove from saved') : tx('Save place')}
                active={isSaved}
                onPress={() => toggleSaved.mutate({ destinationId: d.id, save: !isSaved })}
              />
            </View>
          </View>
        </View>

        <View className="gap-5 px-5" style={{ marginTop: -sweepOverlap('auth', width) }}>
          <View className="flex-row items-start gap-3">
            <View className="flex-1 gap-1.5">
              <Text accessibilityRole="header" className="font-display text-[30px] leading-[36px] text-heading">
                {d.name}
              </Text>
              <View className="flex-row items-center gap-1.5">
                <MapPin color={colors.primary} size={15} />
                <Text numberOfLines={1} className="shrink text-sm text-muted-foreground">
                  {d.city}, {d.region}
                </Text>
              </View>
              <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
                {rating ? (
                  <>
                    <View className="flex-row items-center gap-1 rounded-full bg-lemon px-2.5 py-1">
                      <Star color={colors.rating} fill={colors.rating} size={14} />
                      <Text className="text-[13px] font-bold text-heading" style={{ fontVariant: ['tabular-nums'] }}>
                        {rating.average_rating.toFixed(1)}
                      </Text>
                    </View>
                    <Text className="text-[13px] text-muted-foreground">{tx('({0} reviews)', { 0: formatCount(rating.review_count) })}</Text>
                  </>
                ) : null}
                {distance != null ? <Text className="text-[13px] text-muted-foreground">{tx('{0} away', { 0: formatDistance(distance) })}</Text> : null}
              </View>
            </View>
            {/* Starts lower: the photo still reaches down on this side of the curve. */}
            <View className="mt-5 items-center gap-1 rounded-2xl bg-primary-soft px-3 py-2.5">
              <CategoryIcon color={colors.primary} size={22} strokeWidth={1.8} />
              <Text className="text-xs font-semibold text-heading">{meta.label}</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: speaking }}
            onPress={toggleSpeech}
            className={`min-h-10 flex-row items-center gap-2 self-start rounded-full px-4 active:opacity-70 ${speaking ? 'bg-inverse' : 'bg-primary-soft'}`}
          >
            {speaking ? <Square color="#fff" size={14} fill="#fff" /> : <Volume2 color={colors.primary} size={17} />}
            <Text className={`text-sm font-semibold ${speaking ? 'text-white' : 'text-heading'}`}>{speaking ? tx('Stop audio') : tx('Audio guide')}</Text>
          </Pressable>

          {tabs.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-2 px-5">
              {tabs.map((t) => {
                const Icon = TAB_ICONS[t.key];
                const on = t.key === activeTab.key;
                return <Chip key={t.key} label={t.label} selected={on} icon={<Icon size={15} color={on ? colors.primaryForeground : colors.primary} />} onPress={() => setTab(t.key)} />;
              })}
            </ScrollView>
          ) : null}
          {activeTab ? (
            // Switching Overview / History / Tips crossfades the text so the change reads as a change.
            <Animated.View key={activeTab.key} entering={TAB_FADE} className="gap-4">
              {activeTab.sections
                .filter((x) => x.body)
                .map((x) => (
                  <View key={x.title ?? activeTab.key} className="gap-1.5">
                    {x.title ? <Text className="font-display text-xl text-heading">{x.title}</Text> : null}
                    <Text selectable className="text-[15px] leading-6 text-muted-foreground">
                      {x.body}
                    </Text>
                  </View>
                ))}
            </Animated.View>
          ) : null}

          {facts.length ? (
            <View className="gap-1.5">
              <View className="rounded-[20px] bg-card px-4 py-1" style={CARD}>
                {facts.map((f, i) => (
                  <FactRow key={f.label} icon={f.icon} label={f.label} value={f.value} last={i === facts.length - 1} />
                ))}
              </View>
              {d.opening_hours || d.entry_fee ? <Text className="text-xs text-faint">{tx('Hours and fees can change; check locally before visiting.')}</Text> : null}
            </View>
          ) : null}

          <View className="gap-3 rounded-[20px] bg-card p-4" style={CARD}>
            <View className="flex-row items-center gap-3">
              <AiBadge size={44} />
              <View className="flex-1">
                <Text className="text-base font-semibold text-heading">{tx('Questions about {0}?', { 0: d.name })}</Text>
                <Text className="text-[13px] text-muted-foreground">{tx('Ask GoTourGo AI anything about this place.')}</Text>
              </View>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {placePrompts(d)
                .slice(0, 3)
                .map((p) => (
                  <Chip key={p.key} label={p.label} onPress={() => openChat(p.prompt)} />
                ))}
              <Chip label={tx('Ask your own')} selected icon={<Sparkles size={15} color={colors.primaryForeground} />} onPress={() => openChat(null)} />
            </View>
          </View>

          <WeatherCard point={d} title={tx('Weather at {0}', { 0: d.name })} />

          <View className="gap-3 rounded-[20px] bg-card p-4" style={CARD}>
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft">
                <MapPin color={colors.primary} size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-heading">{tx('Location')}</Text>
                <Text numberOfLines={1} className="text-[13px] text-muted-foreground">
                  {d.city}, {d.region}
                </Text>
              </View>
            </View>
            <Text selectable className="text-xs text-faint">
              {tx('{0}, {1} · Alert radius {2}', { 0: d.latitude.toFixed(4), 1: d.longitude.toFixed(4), 2: formatDistance(d.radius_m) })}
            </Text>
            <View className="flex-row gap-2">
              <AppButton label={tx('View on map')} icon={MapIcon} size="sm" className="flex-1" onPress={() => router.navigate({ pathname: '/explore', params: { focus: d.id } })} />
              <AppButton
                label={tx('Nearby services')}
                variant="outline"
                size="sm"
                className="flex-1"
                onPress={() => router.push({ pathname: '/nearby', params: { lat: String(d.latitude), lng: String(d.longitude), name: d.name } })}
              />
            </View>
          </View>

          {nearby.length ? (
            <View className="gap-3">
              <SectionHeader title={tx('Nearby attractions')} />
              {/* Vertical padding keeps the cards' shadows from being clipped. */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 -my-3" contentContainerClassName="gap-3 px-5 py-3">
                {nearby.map((n) => (
                  <DestinationCard key={n.x.id} destination={n.x} distance={n.dist} rating={ratings.data?.[n.x.id]?.average_rating} width={200} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <PlacePostsSection destinationId={d.id} name={d.name} />

          <View className="gap-3">
            <SectionHeader
              title={tx('Reviews')}
              actionLabel={myReview ? tx('Edit your review') : tx('Write a review')}
              onAction={() => requireAccount(tx('write reviews')) && router.push({ pathname: '/review/new', params: { destinationId: d.id } })}
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
                onAction={() => requireAccount(tx('write reviews')) && router.push({ pathname: '/review/new', params: { destinationId: d.id } })}
              />
            ) : (
              reviews.data!.map((r) => (
                <View key={r.id} className="flex-row gap-3 rounded-[20px] bg-card p-3.5" style={CARD}>
                  <Avatar profile={r.author} size={40} />
                  <View className="flex-1 gap-1">
                    <View className="flex-row flex-wrap items-center gap-x-2">
                      <Text numberOfLines={1} className="shrink text-sm font-semibold text-heading">
                        {displayName(r.author)}
                      </Text>
                      <RatingStars value={r.rating} size={12} />
                    </View>
                    <Text className="text-xs text-faint">{timeAgo(r.created_at)}</Text>
                    {r.body ? (
                      <Text selectable className="text-sm leading-5 text-foreground">
                        {r.body}
                      </Text>
                    ) : null}
                  </View>
                  {r.image_url ? <DestinationImage uri={r.image_url} category={d.category} className="h-20 w-20 rounded-2xl" iconSize={24} /> : null}
                </View>
              ))
            )}
          </View>

          {d.machine_translated || isFallback || d.wikipedia_url || d.image_credit ? (
            <View className="gap-1">
              {d.machine_translated ? <Text className="text-xs text-faint">{tx('Parts of this guide were translated into Urdu by AI and may contain mistakes.')}</Text> : null}
              {isFallback ? <Text className="text-xs text-faint">{tx('Showing the offline summary. The full guide loads when you are connected.')}</Text> : null}
              {d.wikipedia_url ? (
                <Pressable accessibilityRole="link" onPress={() => Linking.openURL(d.wikipedia_url!)} hitSlop={6}>
                  <Text className="text-xs text-faint">
                    {tx('Text from')} <Text className="text-xs font-semibold text-primary">{tx('Wikipedia')}</Text> {tx('(CC BY-SA 4.0)')}
                  </Text>
                </Pressable>
              ) : null}
              {d.image_credit ? (
                <Pressable accessibilityRole="link" disabled={!d.image_page_url} onPress={() => d.image_page_url && Linking.openURL(d.image_page_url)} hitSlop={6}>
                  <Text className="text-xs text-faint">{tx('Photo: {0} {1}, Wikimedia Commons', { 0: d.image_credit, 1: d.image_license ? ` (${d.image_license})` : '' })}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Pinned actions (design guide): add to trip and directions. */}
      <View className="absolute bottom-0 left-0 right-0 flex-row gap-3 bg-background px-5 pt-3" style={{ paddingBottom: insets.bottom + 12, boxShadow: shadow(0.08, -4, 16) }}>
        <AppButton
          label={tripItem ? tx('In your trip') : tx('Add to trip')}
          icon={tripItem ? Check : CalendarPlus}
          variant="outline"
          loading={tripActions.add.isPending}
          onPress={addToTrip}
          className="flex-1"
        />
        <AppButton label={tx('Get directions')} icon={Navigation} onPress={() => navigateTo(d)} className="flex-1" />
      </View>

      <PlaceChatSheet place={d} visible={chat.open} request={chat.request} onClose={() => setChat((c) => ({ ...c, open: false }))} />

      <Modal visible={qrOpen} transparent animationType="fade" onRequestClose={() => setQrOpen(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/70 px-6" onPress={() => setQrOpen(false)}>
          <View className="items-center gap-4 rounded-[28px] bg-card p-6">
            <View className="w-full flex-row items-center justify-between">
              <Text className="font-display text-xl text-heading">{d.name}</Text>
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
