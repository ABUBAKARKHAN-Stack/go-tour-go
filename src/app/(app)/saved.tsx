import { router, useLocalSearchParams } from 'expo-router';
import { Bookmark, Heart, LayoutGrid, MapPin, Newspaper } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';

import { BrandHeader } from '@/components/brand-header';
import { DestinationCard } from '@/components/destination-card';
import { Chip, SectionHeader } from '@/components/form';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Text } from '@/components/text';
import { useAuth } from '@/features/auth/auth-provider';
import { useFeed } from '@/features/community/api';
import { PostCard } from '@/features/community/post-card';
import { useDestinationsByDistance, useRatings } from '@/features/destinations/api';
import { useSavedIds } from '@/features/saved/api';
import { tx } from '@/lib/i18n';
import { colors, shadow } from '@/lib/theme';

type Tab = 'all' | 'places' | 'posts';

/** Saved places and posts (design guide "Saved"): everything at a glance, or one kind at a time. */
export default function SavedScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'posts' ? 'posts' : params.tab === 'places' ? 'places' : 'all');
  return (
    <Screen
      scroll={false}
      hero={
        <BrandHeader back title={tx('Saved')} icon={Bookmark} iconFilled subtitle={tx('Your saved places and posts, all in one place.')}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4" contentContainerClassName="gap-2 px-4">
            {(
              [
                { value: 'all', label: tx('All'), icon: LayoutGrid },
                { value: 'places', label: tx('Places'), icon: MapPin },
                { value: 'posts', label: tx('Posts'), icon: Newspaper },
              ] as const
            ).map((t) => (
              <Chip
                key={t.value}
                label={t.label}
                selected={tab === t.value}
                icon={<t.icon size={15} color={tab === t.value ? colors.primaryForeground : colors.primary} />}
                onPress={() => setTab(t.value)}
              />
            ))}
          </ScrollView>
        </BrandHeader>
      }
    >
      {tab === 'all' ? <SavedAll onSeeAll={setTab} /> : tab === 'places' ? <SavedPlaces /> : <SavedPosts />}
    </Screen>
  );
}

function useSavedPlaces() {
  const saved = useSavedIds();
  const { sorted } = useDestinationsByDistance();
  const places = useMemo(() => {
    const byId = new Map(sorted.map((d) => [d.id, d]));
    return (saved.data ?? []).map((id) => byId.get(id)).filter((d): d is NonNullable<typeof d> => Boolean(d));
  }, [saved.data, sorted]);
  return { saved, places };
}

/** Both kinds, a few of each, with a way into the full list. */
function SavedAll({ onSeeAll }: { onSeeAll: (t: Tab) => void }) {
  const { userId } = useAuth();
  const ratings = useRatings();
  const { saved, places } = useSavedPlaces();
  const feed = useFeed({ saved: true });
  const posts = useMemo(() => feed.data?.pages.flat() ?? [], [feed.data]);

  if (saved.isLoading && feed.isLoading) return <LoadingState label={tx('Loading saved places...')} />;
  if (!places.length && !posts.length && !saved.isLoading && !feed.isLoading) {
    return (
      <EmptyState
        icon={Bookmark}
        title={tx('Nothing saved yet')}
        message={tx('Bookmark places and posts to find them quickly, even offline.')}
        actionLabel={tx('Explore destinations')}
        onAction={() => router.push('/search')}
      />
    );
  }

  return (
    <ScrollView contentContainerClassName="gap-6 px-4 pb-10 pt-1" refreshControl={<RefreshControl refreshing={saved.isRefetching || feed.isRefetching} onRefresh={() => { void saved.refetch(); void feed.refetch(); }} tintColor={colors.primary} />}>
      {places.length ? (
        <View className="gap-3">
          <SectionHeader title={tx('Saved places ({0})', { 0: places.length })} actionLabel={tx('See all')} onAction={() => onSeeAll('places')} />
          {/* Vertical padding keeps the cards' shadows from being clipped. */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 -my-3" contentContainerClassName="gap-3 px-4 py-3">
            {places.slice(0, 10).map((d) => (
              <DestinationCard key={d.id} destination={d} distance={d.distance} rating={ratings.data?.[d.id]?.average_rating} width={170} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {posts.length ? (
        <View className="gap-3">
          <SectionHeader title={tx('Saved posts')} actionLabel={tx('See all')} onAction={() => onSeeAll('posts')} />
          {posts.slice(0, 2).map((p) => (
            <PostCard key={p.id} post={p} userId={userId} />
          ))}
        </View>
      ) : null}

      <View className="flex-row items-center gap-3 rounded-[20px] bg-primary-soft p-4" style={{ boxShadow: shadow(0.05, 4, 12) }}>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white">
          <Heart color={colors.primary} fill={colors.primary} size={20} />
        </View>
        <View className="flex-1">
          <Text className="font-script text-[24px] leading-[28px] text-heading">{tx('Good things take time...')}</Text>
          <Text className="text-[13px] text-muted-foreground">{tx('Keep saving your dream destinations.')}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

/** Bookmarked community posts, newest saved first. */
function SavedPosts() {
  const { userId } = useAuth();
  const feed = useFeed({ saved: true });
  const posts = useMemo(() => feed.data?.pages.flat() ?? [], [feed.data]);
  if (feed.isLoading) return <LoadingState variant="feed" label={tx('Loading saved posts...')} />;
  if (feed.isError && !feed.data) return <ErrorState error={feed.error} onRetry={feed.refetch} />;
  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => p.id}
      contentContainerClassName="gap-4 px-4 pb-8 pt-1"
      onEndReachedThreshold={0.4}
      onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
      refreshControl={<RefreshControl refreshing={feed.isRefetching && !feed.isFetchingNextPage} onRefresh={() => void feed.refetch()} tintColor={colors.primary} />}
      ListEmptyComponent={
        <EmptyState
          icon={Bookmark}
          title={tx('No saved posts yet')}
          message={tx('Tap the bookmark on a post to keep it here.')}
          actionLabel={tx('Open Community')}
          onAction={() => router.navigate('/community')}
        />
      }
      ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : undefined}
      renderItem={({ item }) => <PostCard post={item} userId={userId} />}
    />
  );
}

/** Saved places as a two-column grid; the bookmark on each card unsaves it. */
function SavedPlaces() {
  const { width } = useWindowDimensions();
  const ratings = useRatings();
  const { saved, places } = useSavedPlaces();
  const cardW = Math.floor((width - 32 - 12) / 2);

  if (saved.isLoading) return <LoadingState label={tx('Loading saved places...')} />;
  if (saved.isError && !saved.data) return <ErrorState error={saved.error} onRetry={saved.refetch} />;
  return (
    <FlatList
      data={places}
      keyExtractor={(d) => d.id}
      numColumns={2}
      columnWrapperClassName="gap-3"
      contentContainerClassName="gap-3 px-4 pb-8 pt-1"
      refreshControl={<RefreshControl refreshing={saved.isRefetching} onRefresh={() => void saved.refetch()} tintColor={colors.primary} />}
      ListEmptyComponent={
        <EmptyState
          icon={Bookmark}
          title={tx('No saved places yet')}
          message={tx('Bookmark destinations to find them quickly, even offline.')}
          actionLabel={tx('Explore destinations')}
          onAction={() => router.push('/search')}
        />
      }
      renderItem={({ item }) => <DestinationCard destination={item} distance={item.distance} rating={ratings.data?.[item.id]?.average_rating} width={cardW} />}
    />
  );
}
