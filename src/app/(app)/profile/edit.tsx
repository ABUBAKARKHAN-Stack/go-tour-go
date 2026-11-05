import { router } from 'expo-router';
import { Camera, Save } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Avatar } from '@/components/avatar';
import { Card, Segmented, TextField, ToggleRow } from '@/components/form';
import { Screen } from '@/components/screen';
import { InlineError, LoadingState } from '@/components/states';
import { validateUsername } from '@/features/auth/api';
import { useAuth } from '@/features/auth/auth-provider';
import { useUpdateProfile } from '@/features/social/api';
import { errorMessage } from '@/lib/errors';
import { chooseImageSource } from '@/lib/pick-image';
import { colors } from '@/lib/theme';
import type { Profile } from '@/lib/types';

export default function EditProfile() {
  const { profile } = useAuth();
  if (!profile) return <LoadingState />;
  return <EditForm profile={profile} />;
}

function EditForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile();
  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [homeCity, setHomeCity] = useState(profile.home_city ?? '');
  const [visibility, setVisibility] = useState(profile.visibility);
  const [allowRequests, setAllowRequests] = useState(profile.allow_friend_requests);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const usernameError = validateUsername(username);

  const save = () => {
    if (usernameError) {
      setError(usernameError);
      return;
    }
    setError(null);
    update.mutate(
      {
        full_name: fullName.trim() || null,
        username: username.trim().toLowerCase(),
        bio: bio.trim() || null,
        home_city: homeCity.trim() || null,
        visibility,
        allow_friend_requests: allowRequests,
        avatarLocalUri: avatar,
      },
      { onSuccess: () => router.back(), onError: (e) => setError(errorMessage(e)) },
    );
  };

  return (
    <Screen back title="Edit profile" keyboard>
      <Pressable accessibilityRole="button" accessibilityLabel="Change photo" onPress={() => chooseImageSource(setAvatar, [1, 1])} className="items-center gap-2">
        <View>
          <Avatar profile={{ ...profile, avatar_url: avatar ?? profile.avatar_url }} size={96} />
          <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-accent">
            <Camera color={colors.accentForeground} size={16} />
          </View>
        </View>
        <Text className="text-sm text-accent">Change photo</Text>
      </Pressable>
      {error ? <InlineError message={error} /> : null}
      <TextField label="Name" value={fullName} onChangeText={setFullName} maxLength={80} />
      <TextField label="Username" value={username} onChangeText={(t) => setUsername(t.toLowerCase())} autoCapitalize="none" error={username !== profile.username ? usernameError : null} />
      <TextField label="Bio" value={bio} onChangeText={setBio} multiline maxLength={280} placeholder="Where have you been? Where next?" />
      <TextField label="Home city" value={homeCity} onChangeText={setHomeCity} maxLength={80} placeholder="Lahore" />
      <Card className="gap-3">
        <Text className="text-base font-semibold text-foreground">Privacy</Text>
        <Text className="text-xs text-muted-foreground">Who can see your profile and posts list</Text>
        <Segmented
          value={visibility}
          onChange={setVisibility}
          options={[
            { value: 'public', label: 'Everyone' },
            { value: 'friends', label: 'Friends only' },
          ]}
        />
        <ToggleRow title="Allow friend requests" description="Others can send you requests" value={allowRequests} onChange={setAllowRequests} />
        <Text className="text-xs text-muted-foreground">Your email and trusted contacts are never shown to others. Your location is only visible to friends while you share it.</Text>
      </Card>
      <AppButton label="Save changes" icon={Save} variant="accent" loading={update.isPending} onPress={save} />
    </Screen>
  );
}
