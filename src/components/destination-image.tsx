import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

import { DESTINATION_CATEGORIES } from '@/features/destinations/categories';
import type { DestinationCategory } from '@/lib/types';

type Props = {
  uri: string | null | undefined;
  category: DestinationCategory;
  className?: string;
  iconSize?: number;
  recyclingKey?: string;
};

/**
 * Destination photo with a category-styled placeholder when no image exists
 * or it fails to load (seed data ships without image URLs).
 */
export function DestinationImage({ uri, category, className, iconSize = 36, recyclingKey }: Props) {
  const [failed, setFailed] = useState(false);
  const meta = DESTINATION_CATEGORIES[category] ?? DESTINATION_CATEGORIES.attraction;
  const Icon = meta.icon;
  const showImage = Boolean(uri) && !failed;

  return (
    <View
      className={`overflow-hidden ${className ?? ''}`}
      style={{ experimental_backgroundImage: `linear-gradient(135deg, ${meta.gradient[0]}, ${meta.gradient[1]})` }}
    >
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          recyclingKey={recyclingKey}
          cachePolicy="memory-disk"
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Icon color={meta.color} size={iconSize} strokeWidth={1.5} />
        </View>
      )}
    </View>
  );
}
