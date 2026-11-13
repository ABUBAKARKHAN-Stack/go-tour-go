import { router } from 'expo-router';
import {
  Bell,
  Bookmark,
  ChevronRight,
  ClipboardList,
  Compass,
  LogOut,
  MapPin,
  MessagesSquare,
  Pencil,
  Plus,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton } from '@/components/app-button';
import { Avatar } from '@/components/avatar';
import { Skeleton } from '@/components/skeleton';
import { useTabBarSpace } from '@/components/tab-bar';
import { Text } from '@/components/text';
import { signOut } from '@/features/auth/api';
import { useAuth } from '@/features/auth/auth-provider';
import { formatCount, useAuthorPostCount, useFeed } from '@/features/community/api';
import { PostTile } from '@/features/community/post-tile';
import { useSavedIds } from '@/features/saved/api';
import { displayName, useFollowCounts, useFriendships } from '@/features/social/api';
import { stopSharing } from '@/features/safety/sharing';
import { useTrips } from '@/features/trips/api';
import { cardShadow, colors } from '@/lib/theme';
import { flipX, tx } from '@/lib/i18n';

/**
 * Profile tab: who you are (the card opens your community profile, with its
 * Posts · Followers · Following), your travels at a glance, then the app's
 * places grouped under small headings. Plain and calm: one icon colour,
 * no photo band.
 */
export default function ProfileScreen() {
  const { profile, profileLoading, email, userId, isGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const follows = useFollowCounts(userId ?? undefined);
  const posts = useAuthorPostCount(isGuest ? undefined : (userId ?? undefined));
  const friends = useFriendships();
  const trips = useTrips();
  const saved = useSavedIds();
  const visited = (trips.data ?? []).filter((t) => t.status === 'visited').length;

  const confirmSignOut = () =>
    Alert.alert(
      isGuest ? tx('Leave guest mode?') : tx('Sign out?'),
      isGuest
        ? tx('Guests cannot sign back in: your saved places and trips will be lost. Create an account first to keep them.')
        : tx('Location sharing will stop.'),
      [
        { text: tx('Cancel'), style: 'cancel' },
        {
          text: isGuest ? tx('Leave guest mode') : tx('Sign out'),
          style: 'destructive',
          onPress: async () => {
            await stopSharing().catch(() => undefined);
            await signOut();
          },
        },
      ],
    );

  const openCommunityProfile = () => userId && router.push({ pathname: '/users/[id]', params: { id: userId } });

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerClassName="gap-6 px-4 pt-2" contentContainerStyle={{ paddingBottom: tabSpace }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center">
          <Text accessibilityRole="header" className="flex-1 font-display text-[30px] leading-9 text-heading">
            {tx('Profile')}
          </Text>
          <IconButton icon={Settings} label={tx('Settings')} onPress={() => router.push('/settings')} />
        </View>

        {isGuest ? (
          <GuestCard />
        ) : profileLoading && !profile ? (
          <Skeleton variant="list" label={tx('Loading...')} />
        ) : (
          <View className="overflow-hidden rounded-[20px] bg-card" style={cardShadow}>
            <Pressable
              accessibilityRole="button"
              accessibilityHint={tx('Opens your community profile')}
              onPress={openCommunityProfile}
              className="flex-row items-center gap-3.5 p-4 active:bg-muted"
            >
              <Avatar profile={profile} size={64} />
              <View className="flex-1 gap-0.5">
                <Text className="text-lg font-bold leading-6 text-heading">{displayName(profile)}</Text>
                <Text className="text-sm text-muted-foreground">@{profile?.username}</Text>
                {profile?.home_city ? (
                  <View className="flex-row items-center gap-1">
                    <MapPin color={colors.faint} size={12} />
                    <Text className="text-xs text-faint">{profile.home_city}</Text>
                  </View>
                ) : null}
              </View>
              <IconButton icon={Pencil} label={tx('Edit profile')} onPress={() => router.push('/profile/edit')} />
            </Pressable>
            {/* The community profile in brief; each number opens its list. */}
            <View className="flex-row border-t border-border">
              <CardStat value={posts.data ?? 0} label={tx('Posts')} onPress={openCommunityProfile} />
              <CardStat
                value={follows.data?.followers ?? 0}
                label={tx('Followers')}
                onPress={() => userId && router.push({ pathname: '/follows/[id]', params: { id: userId, tab: 'followers' } })}
                divider
              />
              <CardStat
                value={follows.data?.following ?? 0}
                label={tx('Following')}
                onPress={() => userId && router.push({ pathname: '/follows/[id]', params: { id: userId, tab: 'following' } })}
                divider
              />
            </View>
          </View>
        )}

        {isGuest ? null : <MyPosts userId={userId} total={posts.data ?? 0} onSeeAll={openCommunityProfile} />}

        <View className="flex-row gap-2.5">
          <TravelStat value={visited} label={tx('Visited')} onPress={() => router.navigate('/trips')} />
          <TravelStat value={saved.data?.length ?? 0} label={tx('Saved')} onPress={() => router.push({ pathname: '/saved', params: { tab: 'places' } })} />
          {isGuest ? null : <TravelStat value={friends.friends.length} label={tx('Friends')} onPress={() => router.push('/friends')} />}
        </View>

        <Group title={tx('Travel')}>
          <Row icon={ClipboardList} label={tx('My trip')} value={`${trips.data?.length ?? 0}`} onPress={() => router.navigate('/trips')} />
          <Row icon={Bookmark} label={tx('Saved places')} onPress={() => router.push({ pathname: '/saved', params: { tab: 'places' } })} />
          <Row icon={Bell} label={tx('Notifications')} onPress={() => router.push('/notifications')} last />
        </Group>

        {isGuest ? null : (
          <Group title={tx('People')}>
            <Row icon={Users} label={tx('Friends')} onPress={() => router.push('/friends')} />
            <Row icon={MessagesSquare} label={tx('Messages')} onPress={() => router.push('/messages')} last />
          </Group>
        )}

        <Group title={tx('Safety and app')}>
          <Row icon={ShieldCheck} label={tx('Safety & SOS')} onPress={() => router.push('/safety')} />
          <Row icon={Settings} label={tx('Settings')} onPress={() => router.push('/settings')} last />
        </Group>

        <View className="gap-2">
          <View className="overflow-hidden rounded-[20px] bg-card" style={cardShadow}>
            <Pressable accessibilityRole="button" onPress={confirmSignOut} className="min-h-14 flex-row items-center gap-3 px-4 active:bg-muted">
              <LogOut color={colors.destructive} size={20} />
              <Text className="flex-1 text-[15px] font-semibold text-destructive">{isGuest ? tx('Leave guest mode') : tx('Sign out')}</Text>
            </Pressable>
          </View>
          {isGuest ? null : (
            <Text className="text-center text-xs text-faint">
              {[email, tx('Profile visibility: {0}', { 0: profile?.visibility === 'friends' ? tx('Private (friends only)') : tx('Public') })]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/** Your latest posts in a small grid; "See all" opens your community profile. */
function MyPosts({ userId, total, onSeeAll }: { userId: string | null; total: number; onSeeAll: () => void }) {
  const { width } = useWindowDimensions();
  const feed = useFeed(userId ? { authorId: userId } : undefined);
  const latest = (feed.data?.pages[0] ?? []).slice(0, 6);
  // The grid spans the card's inner width: screen minus page and card padding, minus two gaps.
  const tile = (width - 32 - 24 - 4) / 3;
  return (
    <View className="gap-2">
      <View className="flex-row items-center px-1">
        <Text className="flex-1 text-xs font-semibold uppercase tracking-[1.2px] text-faint">{tx('My posts')}</Text>
        {total ? (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onSeeAll}>
            <Text className="text-[13px] font-semibold text-accent">{tx('See all ({0})', { 0: formatCount(total) })}</Text>
          </Pressable>
        ) : null}
      </View>
      <View className="overflow-hidden rounded-[20px] bg-card p-3" style={cardShadow}>
        {feed.isLoading ? (
          <View className="flex-row gap-0.5">
            {[0, 1, 2].map((i) => (
              <View key={i} className="rounded-md bg-muted" style={{ width: tile, height: tile }} />
            ))}
          </View>
        ) : latest.length ? (
          <View className="flex-row flex-wrap gap-0.5 overflow-hidden rounded-xl">
            {latest.map((p) => (
              <PostTile key={p.id} post={p} size={tile} />
            ))}
          </View>
        ) : (
          <View className="items-center gap-2 py-3">
            <Text className="text-center text-sm text-muted-foreground">{tx('Share your first travel moment')}</Text>
            <AppButton label={tx('New post')} icon={Plus} size="sm" variant="secondary" onPress={() => router.push('/post/new')} />
          </View>
        )}
      </View>
    </View>
  );
}

function CardStat({ value, label, onPress, divider }: { value: number; label: string; onPress: () => void; divider?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
      onPress={onPress}
      className={`flex-1 items-center py-3 active:bg-muted ${divider ? 'border-s border-border' : ''}`}
    >
      <Text className="text-lg font-bold text-heading" style={{ fontVariant: ['tabular-nums'] }}>
        {formatCount(value)}
      </Text>
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </Pressable>
  );
}

function TravelStat({ value, label, onPress }: { value: number; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
      onPress={onPress}
      className="flex-1 gap-0.5 rounded-2xl bg-primary-soft px-3.5 py-3 active:opacity-80"
    >
      <Text className="font-display text-[22px] leading-7 text-heading" style={{ fontVariant: ['tabular-nums'] }}>
        {formatCount(value)}
      </Text>
      <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
    </Pressable>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="px-1 text-xs font-semibold uppercase tracking-[1.2px] text-faint">{title}</Text>
      <View className="overflow-hidden rounded-[20px] bg-card" style={cardShadow}>
        {children}
      </View>
    </View>
  );
}

function Row({ icon: Icon, label, onPress, value, last }: { icon: LucideIcon; label: string; onPress: () => void; value?: string; last?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="min-h-14 flex-row items-center gap-3 active:bg-muted" style={{ paddingStart: 16 }}>
      <Icon color={colors.primary} size={20} />
      <View className={`min-h-14 flex-1 flex-row items-center gap-2 ${last ? '' : 'border-b border-border'}`} style={{ paddingEnd: 12 }}>
        <Text className="flex-1 text-[15px] text-heading">{label}</Text>
        {value ? (
          <Text className="text-sm text-muted-foreground" style={{ fontVariant: ['tabular-nums'] }}>
            {value}
          </Text>
        ) : null}
        <ChevronRight color={colors.faint} size={18} style={flipX} />
      </View>
    </Pressable>
  );
}

/** Profile for someone exploring as a guest: what they can do, and the way to a full account. */
function GuestCard() {
  const signInInstead = () =>
    Alert.alert(tx('Sign in to another account?'), tx('Your guest saved places and trips stay with the guest profile and will not move to that account.'), [
      { text: tx('Cancel'), style: 'cancel' },
      { text: tx('Sign in'), onPress: () => void signOut() },
    ]);
  return (
    <View className="gap-3 rounded-[20px] bg-card p-5" style={cardShadow}>
      <View className="flex-row items-center gap-3.5">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-soft">
          <Compass color={colors.primary} size={26} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text accessibilityRole="header" className="text-lg font-bold leading-6 text-heading">
            {tx("You're exploring as a guest")}
          </Text>
          <Text className="text-sm leading-5 text-muted-foreground">{tx('Create a free account to post, add friends and share your live location.')}</Text>
        </View>
      </View>
      <View className="flex-row gap-2">
        <AppButton label={tx('Create account')} icon={UserPlus} size="sm" onPress={() => router.push('/create-account')} className="flex-1" />
        <AppButton label={tx('Sign in')} size="sm" variant="secondary" onPress={signInInstead} className="flex-1" />
      </View>
    </View>
  );
}
