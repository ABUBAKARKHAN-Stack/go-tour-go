import { forwardRef } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/text';
import { tx } from '@/lib/i18n';

export type TravelMapHandle = {
  flyTo: (lng: number, lat: number, zoom?: number) => void;
  fitRoute: (route: unknown) => void;
};

/** MapLibre React Native is native-only; the web build shows a placeholder. */
export const TravelMap = forwardRef<TravelMapHandle, Record<string, unknown>>(function TravelMap() {
  return (
    <View className="flex-1 items-center justify-center bg-secondary">
      <Text className="text-muted-foreground">{tx('The interactive map is available in the Android app.')}</Text>
    </View>
  );
});
