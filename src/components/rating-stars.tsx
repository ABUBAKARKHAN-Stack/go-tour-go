import { Star } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { colors } from '@/lib/theme';

export function RatingStars({ value, size = 14, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) {
  return (
    <View className="flex-row items-center gap-1" accessibilityLabel={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value);
        const star = <Star size={size} color={colors.accent} fill={filled ? colors.accent : 'transparent'} />;
        return onChange ? (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={`${i} star${i > 1 ? 's' : ''}`}
            accessibilityState={{ selected: filled }}
            onPress={() => onChange(i)}
            hitSlop={6}
            className="p-1"
          >
            {star}
          </Pressable>
        ) : (
          <View key={i}>{star}</View>
        );
      })}
    </View>
  );
}
