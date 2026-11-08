import { router } from 'expo-router';
import { Alert } from 'react-native';

import { Text } from '@/components/text';
import { splitMentions } from '@/features/community/mentions';
import { tx } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

/** Opens the profile of @username (looked up on tap; usernames are unique). */
async function openUsername(username: string) {
  const { data } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle();
  if (data?.id) router.push({ pathname: '/users/[id]', params: { id: data.id } });
  else Alert.alert(tx('Traveller not found'), tx('No one is called @{0}, or their profile is private.', { 0: username }));
}

/** Comment or post text where every @username is a link to that traveller's profile. */
export function MentionText({ text, className, numberOfLines }: { text: string; className?: string; numberOfLines?: number }) {
  const parts = splitMentions(text);
  return (
    <Text className={className} numberOfLines={numberOfLines}>
      {parts.map((p, i) =>
        p.username ? (
          <Text
            key={i}
            accessibilityRole="link"
            accessibilityLabel={tx('Open profile of {0}', { 0: p.text })}
            onPress={() => void openUsername(p.username!)}
            className="font-semibold text-primary"
          >
            {p.text}
          </Text>
        ) : (
          p.text
        ),
      )}
    </Text>
  );
}
