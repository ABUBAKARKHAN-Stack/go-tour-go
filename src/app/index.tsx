import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

export default function Index() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-background items-center justify-center px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="items-center max-w-sm">
        <View className="bg-secondary border border-border px-3.5 py-1.5 rounded-full mb-4">
          <Text className="text-accent text-xs font-bold tracking-wider uppercase">
            GoTourGo
          </Text>
        </View>

        <Heading size="3xl" className="text-foreground text-center font-extrabold mb-2">
          Smart Travel Companion
        </Heading>

        <Text className="text-muted-foreground text-center text-sm leading-6">
          Clean base canvas ready for upcoming features.
        </Text>
      </View>
    </View>
  );
}
