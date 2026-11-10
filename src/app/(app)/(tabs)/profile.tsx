import { router } from 'expo-router';
import {
  Bell,
  Bookmark,
  ChevronRight,
  ClipboardList,
  LogOut,
  MapPin,
  MessagesSquare,
  Pencil,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton } from '@/components/app-button';
import { Avatar } from '@/components/avatar';
import { BrandLogo, type TileTone } from '@/components/brand';
import { LoadingState } from '@/components/states';
import { useTabBarSpace } from '@/components/tab-bar';
import { Text } from '@/components/text';
import { signOut } from '@/features/auth/api';
import { useAuth } from '@/features/auth/auth-provider';
import { FALLBACK_PHOTO, HERO_PHOTOS } from '@/features/brand/hero-photos';
import { formatCount } from '@/features/community/format';
import { useSavedIds } from '@/features/saved/api';
import { displayName, useFollowCounts, useFriendships } from '@/features/social/api';
import { stopSharing } from '@/features/safety/sharing';
import { useTrips } from '@/features/trips/api';
import { colors, shadow } from '@/lib/theme';
import { flipX, tx } from '@/lib/i18n';

const ROW_TONE: Record<TileTone, string> = { ice: 'bg-primary-soft', mint: 'bg-mint', peach: 'bg-peach', lemon: 'bg-lemon', sand: 'bg-sand' };

function Row({ icon: Icon, label, onPress, value, tone = 'ice', last }: { icon: LucideIcon; label: string; onPress: () => void; value?: string; tone?: TileTone; last?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className={`min-h-14 flex-row items-center gap-3 py-2.5 active:opacity-70 ${last ? '' : 'border-b border-border'}`}>
      <View className={`h-10 w-10 items-center justify-center rounded-2xl ${ROW_TONE[tone]}`}>
        <Icon color={colors.primary} size={19} />
      </View>
      <Text className="flex-1 text-[15px] font-medium text-heading">{label}</Text>
      {value ? <Text className="text-sm text-muted-foreground">{value}</Text> : null}
      <ChevronRight color={colors.faint} size={18} style={flipX} />
    </Pressable>
  );
}

const CARD = { boxShadow: shadow(0.08, 6, 20) };

export default function ProfileScreen() {
  const { profile, profileLoading, email, userId } = useAuth();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const follows = useFollowCounts(userId ?? undefined);
  const friends = useFriendships();
  const trips = useTrips();
  const saved = useSavedIds();
  const visited = (trips.data ?? []).filter((t) => t.status === 'visited').length;
  const bandH = insets.top + 132;

  const confirmSignOut = () =>
    Alert.alert(tx('Sign out?'), tx('Location sharing will stop.'), [
      { text: tx('Cancel'), style: 'cancel' },
      {
        text: tx('Sign out'),
        style: 'destructive',
        onPress: async () => {
          await stopSharing().catch(() => undefined);
          await signOut();
        },
      },
    ]);

  const stats = [
    { label: tx('Visited'), value: visited, onPress: () => router.navigate('/trips') },
    { label: tx('Saved'), value: saved.data?.length ?? 0, onPress: () => router.push({ pathname: '/saved', params: { tab: 'places' } }) },
    { label: tx('Friends'), value: friends.friends.length, onPress: () => router.push('/friends') },
    {
      label: tx('Followers'),
      value: follows.data?.followers ?? 0,
      onPress: () => userId && router.push({ pathname: '/follows/[id]', params: { id: userId, tab: 'followers' } }),
    },
    {
      label: tx('Following'),
      value: follows.data?.following ?? 0,
      onPress: () => userId && router.push({ pathname: '/follows/[id]', params: { id: userId, tab: 'following' } }),
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingBottom: tabSpace }} showsVerticalScrollIndicator={false}>
        {/* Photo band with the logo and settings; the avatar overlaps its lower edge. */}
        <View style={{ height: bandH }}>
          <Image
            source={{ uri: HERO_PHOTOS.connect.uri }}
            placeholder={FALLBACK_PHOTO}
            placeholderContentFit="cover"
            contentFit="cover"
            cachePolicy="disk"
            transition={250}
            accessible={false}
            style={StyleSheet.absoluteFill}
          />
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { experimental_backgroundImage: 'linear-gradient(180deg, rgba(246,250,252,0.9) 0%, rgba(246,250,252,0.35) 45%, rgba(246,250,252,0.15) 70%, rgb(246,250,252) 100%)' }]}
          />
          <View className="flex-row items-center gap-2 px-4" style={{ paddingTop: insets.top + 8 }}>
            <View className="flex-1">
              <BrandLogo height={36} />
            </View>
            <IconButton icon={Settings} label={tx('Settings')} onPress={() => router.push('/settings')} />
          </View>
        </View>

        <View className="gap-5 px-4" style={{ marginTop: -52 }}>
          {profileLoading && !profile ? (
            <LoadingState variant="profile" />
          ) : (
            <View className="items-center gap-1.5">
              <View className="rounded-full border-4 border-background" style={{ boxShadow: shadow(0.14, 6, 18) }}>
                <Avatar profile={profile} size={96} />
              </View>
              <Text accessibilityRole="header" className="pt-1 font-display text-[26px] leading-8 text-heading">
                {displayName(profile)}
              </Text>
              <Text className="text-sm text-muted-foreground">@{profile?.username}</Text>
              {profile?.home_city ? (
                <View className="flex-row items-center gap-1">
                  <MapPin color={colors.primary} size={14} />
                  <Text className="text-sm text-muted-foreground">{profile.home_city}</Text>
                </View>
              ) : null}
              {profile?.bio ? <Text className="px-4 text-center text-sm leading-5 text-foreground">{profile.bio}</Text> : null}
              {email ? <Text className="text-xs text-faint">{email}</Text> : null}
              <View className="pt-2">
                <AppButton label={tx('Edit profile')} icon={Pencil} size="sm" variant="outline" onPress={() => router.push('/profile/edit')} />
              </View>
            </View>
          )}

          <View className="flex-row justify-between rounded-[20px] bg-card px-2 py-3" style={CARD}>
            {stats.map((st) => (
              <Pressable
                key={st.label}
                accessibilityRole="button"
                accessibilityLabel={`${st.value} ${st.label}`}
                onPress={st.onPress}
                hitSlop={4}
                className="flex-1 items-center gap-0.5 rounded-2xl py-1 active:bg-muted"
              >
                <Text className="font-display text-xl text-heading" style={{ fontVariant: ['tabular-nums'] }}>
                  {formatCount(st.value)}
                </Text>
                <Text numberOfLines={1} className="text-[11px] text-muted-foreground">
                  {st.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="rounded-[20px] bg-card px-4 py-1" style={CARD}>
            <Row icon={ClipboardList} tone="ice" label={tx('My trip')} value={`${trips.data?.length ?? 0}`} onPress={() => router.navigate('/trips')} />
            <Row icon={Bookmark} tone="peach" label={tx('Saved places')} onPress={() => router.push({ pathname: '/saved', params: { tab: 'places' } })} />
            <Row icon={Users} tone="mint" label={tx('Friends')} onPress={() => router.push('/friends')} />
            <Row icon={MessagesSquare} tone="lemon" label={tx('Messages')} onPress={() => router.push('/messages')} />
            <Row icon={Bell} tone="ice" label={tx('Notifications')} onPress={() => router.push('/notifications')} />
            <Row icon={ShieldCheck} tone="peach" label={tx('Safety & SOS')} onPress={() => router.push('/safety')} />
            <Row icon={Settings} tone="sand" label={tx('Settings')} onPress={() => router.push('/settings')} last />
          </View>

          <Text className="text-center text-xs text-faint">
            {tx('Profile visibility: {0}', { 0: profile?.visibility === 'friends' ? tx('Private (friends only)') : tx('Public') })}
          </Text>
          <AppButton label={tx('Sign out')} icon={LogOut} variant="outline" onPress={confirmSignOut} />
        </View>
      </ScrollView>
    </View>
  );
}
