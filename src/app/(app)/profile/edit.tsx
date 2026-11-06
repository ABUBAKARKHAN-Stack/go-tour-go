import { router } from 'expo-router';
import { Camera, Save } from 'lucide-react-native';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/text';

import { AppButton } from '@/components/app-button';
import { Avatar } from '@/components/avatar';
import { Card, Segmented, ToggleRow } from '@/components/form';
import { FormTextField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { InlineError, LoadingState } from '@/components/states';
import { useAuth } from '@/features/auth/auth-provider';
import { useUpdateProfile } from '@/features/social/api';
import { profileSchema } from '@/features/social/schemas';
import { serverError, useZodForm } from '@/lib/forms';
import { chooseImageSource } from '@/lib/pick-image';
import { colors } from '@/lib/theme';
import type { Profile } from '@/lib/types';
import { tx } from '@/lib/i18n';

export default function EditProfile() {
  const { profile } = useAuth();
  if (!profile) return <LoadingState variant="profile" />;
  return <EditForm profile={profile} />;
}

function EditForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [schema] = useState(() => profileSchema(profile.username));
  const { control, handleSubmit, setError, formState } = useZodForm(schema, {
    defaultValues: {
      fullName: profile.full_name ?? '',
      username: profile.username,
      bio: profile.bio ?? '',
      homeCity: profile.home_city ?? '',
      visibility: profile.visibility,
      allowFriendRequests: profile.allow_friend_requests,
    },
  });

  const save = handleSubmit((v) =>
    update.mutate(
      {
        full_name: v.fullName,
        username: v.username,
        bio: v.bio,
        home_city: v.homeCity,
        visibility: v.visibility,
        allow_friend_requests: v.allowFriendRequests,
        avatarLocalUri: avatar,
      },
      { onSuccess: () => router.back(), onError: (e) => setError('root', serverError(e)) },
    ),
  );

  return (
    <Screen back title={tx('Edit profile')} keyboard>
      <Pressable accessibilityRole="button" accessibilityLabel={tx('Change photo')} onPress={() => chooseImageSource(setAvatar, [1, 1])} className="items-center gap-2">
        <View>
          <Avatar profile={{ ...profile, avatar_url: avatar ?? profile.avatar_url }} size={96} />
          <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-accent">
            <Camera color={colors.accentForeground} size={16} />
          </View>
        </View>
        <Text className="text-sm text-accent">{tx('Change photo')}</Text>
      </Pressable>
      {formState.errors.root?.message ? <InlineError message={formState.errors.root.message} /> : null}
      <FormTextField control={control} name="fullName" label={tx('Name')} autoComplete="name" maxLength={80} />
      <FormTextField control={control} name="username" label={tx('Username')} transform={(t) => t.toLowerCase()} autoCapitalize="none" />
      <FormTextField control={control} name="bio" label={tx('Bio')} multiline maxLength={280} placeholder={tx('Where have you been? Where next?')} />
      <FormTextField control={control} name="homeCity" label={tx('Home city')} maxLength={80} placeholder={tx('Lahore')} />
      <Card className="gap-3">
        <Text className="text-base font-semibold text-foreground">{tx('Privacy')}</Text>
        <Text className="text-xs text-muted-foreground">{tx('Who can see your profile and posts list')}</Text>
        <Controller
          control={control}
          name="visibility"
          render={({ field }) => (
            <Segmented
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'public', label: tx('Everyone') },
                { value: 'friends', label: tx('Private (friends only)') },
              ]}
            />
          )}
        />
        <Controller
          control={control}
          name="allowFriendRequests"
          render={({ field }) => (
            <ToggleRow title={tx('Allow friend requests')} description={tx('Others can send you requests')} value={field.value} onChange={field.onChange} />
          )}
        />
        <Text className="text-xs text-muted-foreground">{tx('Your email and trusted contacts are never shown to others. Your location is only visible to friends while you share it.')}</Text>
      </Card>
      <AppButton label={tx('Save changes')} icon={Save} variant="accent" loading={update.isPending} onPress={save} />
    </Screen>
  );
}
