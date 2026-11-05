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
import { Alert, Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Avatar } from '@/components/avatar';
import { Card } from '@/components/form';
import { Screen } from '@/components/screen';
import { LoadingState } from '@/components/states';
import { signOut } from '@/features/auth/api';
import { useAuth } from '@/features/auth/auth-provider';
import { useSavedIds } from '@/features/saved/api';
import { displayName, useFollowCounts, useFriendships } from '@/features/social/api';
import { stopSharing } from '@/features/safety/sharing';
import { useTrips } from '@/features/trips/api';
import { colors } from '@/lib/theme';

function Row({ icon: Icon, label, onPress, value }: { icon: LucideIcon; label: string; onPress: () => void; value?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="min-h-14 flex-row items-center gap-3 py-2">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-secondary">
        <Icon color={colors.accent} size={18} />
      </View>
      <Text className="flex-1 text-base text-foreground">{label}</Text>
      {value ? <Text className="text-sm text-muted-foreground">{value}</Text> : null}
      <ChevronRight color={colors.mutedForeground} size={18} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { profile, profileLoading, email, userId } = useAuth();
  const follows = useFollowCounts(userId ?? undefined);
  const friends = useFriendships();
  const trips = useTrips();
  const saved = useSavedIds();
  const visited = (trips.data ?? []).filter((t) => t.status === 'visited').length;

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'Location sharing will stop.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await stopSharing().catch(() => undefined);
          await signOut();
        },
      },
    ]);

  return (
    <Screen inTabs title="Profile" right={<AppButton label="Edit" icon={Pencil} size="sm" variant="secondary" onPress={() => router.push('/profile/edit')} />}>
      {profileLoading && !profile ? (
        <LoadingState />
      ) : (
        <Card className="items-center gap-2">
          <Avatar profile={profile} size={88} />
          <Text className="text-2xl font-bold text-foreground">{displayName(profile)}</Text>
          <Text className="text-sm text-muted-foreground">@{profile?.username}</Text>
          {email ? <Text className="text-xs text-muted-foreground">{email}</Text> : null}
          {profile?.home_city ? (
            <View className="flex-row items-center gap-1">
              <MapPin color={colors.accent} size={14} />
              <Text className="text-sm text-muted-foreground">{profile.home_city}</Text>
            </View>
          ) : null}
          {profile?.bio ? <Text className="text-center text-sm text-foreground">{profile.bio}</Text> : null}
          <View className="w-full flex-row justify-around pt-3">
            {[
              { label: 'Visited', value: visited },
              { label: 'Saved', value: saved.data?.length ?? 0 },
              { label: 'Friends', value: friends.friends.length },
              { label: 'Followers', value: follows.data?.followers ?? 0 },
            ].map((s) => (
              <View key={s.label} className="items-center">
                <Text className="text-lg font-bold text-foreground">{s.value}</Text>
                <Text className="text-xs text-muted-foreground">{s.label}</Text>
              </View>
            ))}
          </View>
          <Text className="pt-1 text-xs text-muted-foreground">
            Profile visibility: {profile?.visibility === 'friends' ? 'Friends only' : 'Public'}
          </Text>
        </Card>
      )}

      <Card className="gap-0 py-2">
        <Row icon={ClipboardList} label="My trip" value={`${trips.data?.length ?? 0}`} onPress={() => router.navigate('/trips')} />
        <Row icon={Bookmark} label="Saved places" onPress={() => router.push('/saved')} />
        <Row icon={Users} label="Friends" onPress={() => router.push('/friends')} />
        <Row icon={MessagesSquare} label="Messages" onPress={() => router.push('/messages')} />
        <Row icon={Bell} label="Notifications" onPress={() => router.push('/notifications')} />
        <Row icon={ShieldCheck} label="Safety & SOS" onPress={() => router.push('/safety')} />
        <Row icon={Settings} label="Settings" onPress={() => router.push('/settings')} />
      </Card>

      <AppButton label="Sign out" icon={LogOut} variant="outline" onPress={confirmSignOut} />
    </Screen>
  );
}
