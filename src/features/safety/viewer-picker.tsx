import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Segmented } from '@/components/form';
import { Text } from '@/components/text';
import type { ShareAudience } from '@/features/safety/sharing';
import { displayName } from '@/features/social/api';
import { tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';
import type { ProfileSummary } from '@/lib/types';

type Props = {
  audience: ShareAudience;
  onAudience: (a: ShareAudience) => void;
  friends: ProfileSummary[];
  chosen: Set<string>;
  onToggle: (id: string) => void;
};

/** "Who can see": all friends, or a checklist of chosen friends. */
export function ViewerPicker({ audience, onAudience, friends, chosen, onToggle }: Props) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-muted-foreground">{tx('Who can see it')}</Text>
      <Segmented
        options={[
          { value: 'friends', label: tx('All friends') },
          { value: 'selected', label: tx('Chosen friends') },
        ]}
        value={audience}
        onChange={onAudience}
      />
      {audience === 'selected' ? (
        friends.length === 0 ? (
          <Text className="text-sm text-muted-foreground">{tx('Add friends first to choose who sees your location.')}</Text>
        ) : (
          <View className="gap-1.5">
            {friends.map((p) => {
              const on = chosen.has(p.id);
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={displayName(p)}
                  onPress={() => onToggle(p.id)}
                  className={`min-h-14 flex-row items-center gap-3 rounded-2xl border px-3 ${on ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                >
                  <Avatar profile={p} size={36} />
                  <Text numberOfLines={2} className="flex-1 text-sm font-semibold text-heading">
                    {displayName(p)}
                  </Text>
                  <View className={`h-6 w-6 items-center justify-center rounded-md border-2 ${on ? 'border-primary bg-primary' : 'border-border'}`}>
                    {on ? <Check color={colors.primaryForeground} size={14} strokeWidth={3} /> : null}
                  </View>
                </Pressable>
              );
            })}
            <Text className="text-xs text-muted-foreground">{tx('{0} of {1} friends chosen', { 0: chosen.size, 1: friends.length })}</Text>
          </View>
        )
      ) : null}
    </View>
  );
}
