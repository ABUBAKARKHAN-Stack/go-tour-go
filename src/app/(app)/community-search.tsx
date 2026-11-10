import { router } from 'expo-router';
import { Bookmark, ChevronRight, MapPin, PenSquare, Search, UserPlus, Users } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { DestinationCard } from '@/components/destination-card';
import { Segmented, TextField } from '@/components/form';
import { PersonRow } from '@/components/person-row';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Text } from '@/components/text';
import { useAuth } from '@/features/auth/auth-provider';
import { usePostSearch } from '@/features/community/api';
import { PostCard } from '@/features/community/post-card';
import { searchDestinations, useDestinationsByDistance, useRatings } from '@/features/destinations/api';
import { useFriendships, useUserSearch } from '@/features/social/api';
import { flipX, tx } from '@/lib/i18n';
import { cardShadow, colors } from '@/lib/theme';
import type { LucideIcon } from 'lucide-react-native';

type Tab = 'people' | 'posts' | 'places';

/** Waits until typing pauses before searching the server. */
function useDebounced(value: string, ms = 300) {
  const [out, setOut] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setOut(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return out;
}

/** Community search: travellers, posts (text or place) and landmarks. */
export default function CommunitySearchScreen() {
  const { userId } = useAuth();
  const [tab, setTab] = useState<Tab>('people');
  const [term, setTerm] = useState('');
  const q = useDebounced(term);
  const people = useUserSearch(q);
  const posts = usePostSearch(q);
  const friendships = useFriendships();
  const { sorted } = useDestinationsByDistance();
  const ratings = useRatings();
  const places = useMemo(() => (q.trim().length >= 2 ? searchDestinations(sorted, q).slice(0, 20) : []), [sorted, q]);
  const typed = q.trim().length >= 2;

  return (
    <Screen back title={tx('Search')} subtitle={tx('Travellers, posts and places')}>
      <TextField
        label={tx('Search')}
        value={term}
        onChangeText={setTerm}
        autoFocus
        autoCapitalize="none"
        returnKeyType="search"
        placeholder={tx('Name, username, place or words')}
        left={<Search color={colors.mutedForeground} size={18} />}
      />
      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'people', label: tx('Travellers') },
          { value: 'posts', label: tx('Posts') },
          { value: 'places', label: tx('Places') },
        ]}
      />

      {!typed ? (
        <View className="gap-2">
          <ShortcutRow
            icon={Users}
            label={tx('Friends and requests')}
            detail={friendships.incoming.length ? tx('{0} new requests', { 0: friendships.incoming.length }) : tx('{0} friends', { 0: friendships.friends.length })}
            onPress={() => router.push('/friends')}
          />
          <ShortcutRow icon={Bookmark} label={tx('Saved posts')} onPress={() => router.push({ pathname: '/saved', params: { tab: 'posts' } })} />
          <Text className="px-1 pt-2 text-sm text-muted-foreground">{tx('Type at least 2 letters to search.')}</Text>
        </View>
      ) : tab === 'people' ? (
        people.isLoading ? (
          <LoadingState />
        ) : people.isError ? (
          <ErrorState error={people.error} onRetry={people.refetch} />
        ) : (people.data ?? []).length === 0 ? (
          <EmptyState icon={UserPlus} title={tx('No travellers found')} message={tx('Try another name or username.')} />
        ) : (
          <View className="gap-2">
            {people.data!.map((p) => (
              <PersonRow key={p.id} profile={p} subtitle={p.home_city ? `@${p.username} · ${p.home_city}` : undefined} />
            ))}
          </View>
        )
      ) : tab === 'posts' ? (
        posts.isLoading ? (
          <LoadingState variant="feed" />
        ) : posts.isError ? (
          <ErrorState error={posts.error} onRetry={posts.refetch} />
        ) : (posts.data ?? []).length === 0 ? (
          <EmptyState icon={PenSquare} title={tx('No posts found')} message={tx('No post mentions "{0}" yet.', { 0: q.trim() })} />
        ) : (
          <View className="gap-4">
            {posts.data!.map((p) => (
              <PostCard key={p.id} post={p} userId={userId} />
            ))}
          </View>
        )
      ) : places.length === 0 ? (
        <EmptyState icon={MapPin} title={tx('No places found')} message={tx('Try a city or landmark name.')} />
      ) : (
        <View className="gap-3">
          {places.map((d) => (
            <DestinationCard key={d.id} destination={d} distance={d.distance} rating={ratings.data?.[d.id]?.average_rating} variant="row" />
          ))}
        </View>
      )}
    </Screen>
  );
}

function ShortcutRow({ icon: Icon, label, detail, onPress }: { icon: LucideIcon; label: string; detail?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="min-h-14 flex-row items-center gap-3 rounded-[20px] bg-card px-4 active:bg-muted" style={cardShadow}>
      <Icon color={colors.primary} size={20} />
      <Text className="flex-1 text-base font-semibold text-heading">{label}</Text>
      {detail ? <Text className="text-xs text-muted-foreground">{detail}</Text> : null}
      <ChevronRight color={colors.faint} size={18} style={flipX} />
    </Pressable>
  );
}
