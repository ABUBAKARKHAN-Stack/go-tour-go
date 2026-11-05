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
  Sparkles,
  Square,
  Ticket,
  Volume2,
  X,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/text';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton } from '@/components/app-button';
import { Avatar } from '@/components/avatar';
import { DestinationCard } from '@/components/destination-card';
import { DestinationImage } from '@/components/destination-image';
import { Card, Chip, SectionHeader } from '@/components/form';
import { RatingStars } from '@/components/rating-stars';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { WeatherCard } from '@/components/weather-card';
import { useAuth } from '@/features/auth/auth-provider';
import { useDestination, useDestinations, useRatings } from '@/features/destinations/api';
import { DESTINATION_CATEGORIES } from '@/features/destinations/categories';
import { destinationQrValue } from '@/features/destinations/qr';
import { useLastLocation } from '@/features/location/location-store';
import { useReviews } from '@/features/reviews/api';
import { navigateTo } from '@/features/routing/navigate';
import { useSavedIds, useToggleSaved } from '@/features/saved/api';
import { displayName } from '@/features/social/api';
import { timeAgo } from '@/features/safety/friend-locations';
import { useTripActions, useTrips } from '@/features/trips/api';
import { errorMessage } from '@/lib/errors';
import { distanceMeters, formatDistance } from '@/lib/geo';
import { LOCALES, usePreferences } from '@/lib/preferences';
import { colors } from '@/lib/theme';

const SPEECH_LANG: Record<string, string> = { en: 'en-US', ur: 'ur-PK', ar: 'ar-SA', zh: 'zh-CN' };

export default function DestinationDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const [prefs, setPrefs] = usePreferences();
  const { destination: d, isLoading, isError, error, refetch } = useDestination(id);
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
      <View className="flex-1 justify-center bg-background">
        <LoadingState label="Loading destination..." />
      </View>
    );
  }
  if (!d) {
    return (
      <View className="flex-1 justify-center bg-background" style={{ paddingTop: insets.top }}>
        {isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <EmptyState title="Destination not found" actionLabel="Go back" onAction={() => router.back()} />
        )}
      </View>
    );
  }

  const meta = DESTINATION_CATEGORIES[d.category];
  const rating = ratings.data?.get(d.id);
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
        Alert.alert('Audio guide unavailable', 'Your device does not have a voice for this language. Try English.');
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
        onSuccess: () => Alert.alert('Added to your trip', `${d.name} is on your checklist.`),
        onError: (e) => Alert.alert('Could not add', errorMessage(e)),
      },
    );
  };

  const sections: { title: string; body: string | null }[] = [
    { title: 'About', body: d.description },
    { title: 'History', body: d.history },
    { title: 'Culture', body: d.culture },
    { title: 'Why it matters', body: d.significance },
    { title: 'Local customs', body: d.local_customs },
    { title: 'Food & cuisine', body: d.food },
    { title: 'Shopping & souvenirs', body: d.shopping },
    { title: 'Travel tips', body: d.tips },
  ];

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View>
          <DestinationImage uri={d.image_url} category={d.category} className="h-72 w-full" iconSize={72} recyclingKey={d.id} />
          <View className="absolute left-0 right-0 flex-row justify-between px-4" style={{ top: insets.top + 8 }}>
            <IconButton icon={ArrowLeft} label="Go back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
            <IconButton
              icon={isSaved ? BookmarkCheck : Bookmark}
              label={isSaved ? 'Remove from saved' : 'Save place'}
              active={isSaved}
              onPress={() => toggleSaved.mutate({ destinationId: d.id, save: !isSaved })}
            />
          </View>
        </View>

        <View className="-mt-6 gap-4 rounded-t-3xl bg-background px-4 pt-5">
          <View className="gap-1">
            <Text className="text-xs font-bold uppercase tracking-widest" style={{ color: meta.color }}>
              {meta.label}
            </Text>
            <Text className="text-3xl font-extrabold text-foreground">{d.name}</Text>
            <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
              <View className="flex-row items-center gap-1">
                <MapPin color={colors.primary} size={14} />
                <Text className="text-sm text-muted-foreground">
                  {d.city}, {d.region}
                </Text>
              </View>
              {distance != null ? <Text className="text-sm font-semibold text-primary">{formatDistance(distance)} away</Text> : null}
              {rating ? (
                <View className="flex-row items-center gap-1">
                  <RatingStars value={rating.average_rating} size={12} />
                  <Text className="text-sm text-muted-foreground">
                    {rating.average_rating.toFixed(1)} ({rating.review_count})
                  </Text>
                </View>
              ) : null}
            </View>
            <Text className="pt-1 text-base text-foreground">{d.short_description}</Text>
          </View>

          <View className="flex-row gap-2">
            <AppButton label="Navigate" icon={Navigation} variant="accent" onPress={() => navigateTo(d)} className="flex-1" />
            <AppButton
              label={tripItem ? 'In your trip' : 'Add to trip'}
              icon={tripItem ? Check : CalendarPlus}
              variant="secondary"
              loading={tripActions.add.isPending}
              onPress={addToTrip}
              className="flex-1"
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            <Chip label={speaking ? 'Stop audio' : 'Audio guide'} icon={speaking ? <Square size={14} color={colors.accentForeground} /> : <Volume2 size={14} color={colors.foreground} />} selected={speaking} onPress={toggleSpeech} />
            <Chip
              label="Ask AI"
              icon={<Sparkles size={14} color={colors.foreground} />}
              onPress={() => router.push({ pathname: '/assistant', params: { destination: d.slug, q: `What should I know before visiting ${d.name}?` } })}
            />
            <Chip label="View on map" icon={<MapPin size={14} color={colors.foreground} />} onPress={() => router.navigate({ pathname: '/explore', params: { focus: d.id } })} />
            <Chip label="QR code" icon={<QrCode size={14} color={colors.foreground} />} onPress={() => setQrOpen(true)} />
          </ScrollView>

          <View className="gap-2">
            <Text className="text-xs text-muted-foreground">Guide language</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {LOCALES.map((l) => (
                <Chip key={l.value} label={l.label} selected={prefs.locale === l.value} onPress={() => setPrefs({ locale: l.value })} />
              ))}
            </ScrollView>
          </View>

          {(d.opening_hours || d.entry_fee || d.best_time) && (
            <Card className="gap-2">
              {d.opening_hours ? (
                <View className="flex-row gap-2">
                  <Clock color={colors.primary} size={16} />
                  <Text className="flex-1 text-sm text-foreground">{d.opening_hours}</Text>
                </View>
              ) : null}
              {d.entry_fee ? (
                <View className="flex-row gap-2">
                  <Ticket color={colors.primary} size={16} />
                  <Text className="flex-1 text-sm text-foreground">{d.entry_fee}</Text>
                </View>
              ) : null}
              {d.best_time ? <Text className="text-sm text-muted-foreground">Best time to visit: {d.best_time}</Text> : null}
              <Text className="text-xs text-muted-foreground">Hours and fees can change; check locally before visiting.</Text>
            </Card>
          )}

          {sections
            .filter((s) => s.body)
            .map((s) => (
              <View key={s.title} className="gap-1.5">
                <Text className="text-lg font-bold text-foreground">{s.title}</Text>
                <Text className="text-base leading-6 text-muted-foreground">{s.body}</Text>
              </View>
            ))}

          <WeatherCard point={d} title={`Weather at ${d.name}`} />

          <Card className="gap-2">
            <Text className="text-base font-semibold text-foreground">Location</Text>
            <Text className="text-sm text-muted-foreground">
              {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)} · Alert radius {formatDistance(d.radius_m)}
            </Text>
            <AppButton
              label="Nearby services"
              variant="outline"
              size="sm"
              onPress={() => router.push({ pathname: '/nearby', params: { lat: String(d.latitude), lng: String(d.longitude), name: d.name } })}
            />
          </Card>

          {nearby.length ? (
            <View className="gap-3">
              <SectionHeader title="Nearby attractions" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
                {nearby.map((n) => (
                  <DestinationCard key={n.x.id} destination={n.x} distance={n.dist} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View className="gap-3">
            <SectionHeader
              title="Reviews"
              actionLabel={myReview ? 'Edit your review' : 'Write a review'}
              onAction={() => router.push({ pathname: '/review/new', params: { destinationId: d.id } })}
            />
            {reviews.isLoading ? (
              <LoadingState label="Loading reviews..." />
            ) : reviews.isError ? (
              <ErrorState error={reviews.error} onRetry={reviews.refetch} />
            ) : (reviews.data ?? []).length === 0 ? (
              <EmptyState
                icon={MessageSquarePlus}
                title="No reviews yet"
                message="Be the first to share your experience."
                actionLabel="Write a review"
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
              <IconButton icon={X} label="Close" onPress={() => setQrOpen(false)} />
            </View>
            <View className="rounded-2xl bg-white p-4">
              <QRCode value={destinationQrValue(d.slug)} size={200} />
            </View>
            <Text className="text-center text-xs text-muted-foreground">Scan with GoTourGo Smart Scan to open this place.</Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
