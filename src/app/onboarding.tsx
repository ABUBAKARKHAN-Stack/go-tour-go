import { useRef, useState, type ComponentType } from 'react';
import { FlatList, Pressable, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { ArrivalScene, LandmarkScene, SafetyScene } from '@/components/illustrations';
import { Text } from '@/components/text';
import { storage, StorageKeys } from '@/lib/storage';

type Slide = { key: string; overline: string; title: string; body: string; Art: ComponentType<{ size?: number }> };

const SLIDES: Slide[] = [
  {
    key: 'discover',
    overline: 'Discover',
    title: 'Stories wait around every corner',
    body: 'GoTourGo notices the landmarks you pass and tells you why they matter: history, food and local tips, right when you arrive.',
    Art: LandmarkScene,
  },
  {
    key: 'journey',
    overline: 'On the way',
    title: 'Landmarks speak up as you travel',
    body: 'Plan a journey anywhere in Pakistan. Famous places and road alerts along your route reach you as you get close, even offline.',
    Art: ArrivalScene,
  },
  {
    key: 'safe',
    overline: 'Travel safe',
    title: 'Your people, one tap away',
    body: 'Share your live location for as long as you choose, and send an SOS with your position to the people you trust.',
    Art: SafetyScene,
  },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const list = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const art = Math.min(width - 32, 420);

  const finish = () => storage.set(StorageKeys.onboardingDone, true);
  const next = () => {
    if (index < SLIDES.length - 1) list.current?.scrollToIndex({ index: index + 1, animated: true });
    else finish();
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}>
      <View className="flex-row items-center justify-end px-5">
        <Pressable accessibilityRole="button" onPress={finish} hitSlop={12} className="min-h-11 justify-center px-2">
          <Text className="text-sm font-semibold text-faint">Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={list}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.key}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1 gap-6 px-4">
            <View className="self-center overflow-hidden rounded-[32px]" style={{ width: art, height: art * 0.94 }}>
              <item.Art size={art} />
            </View>
            <View className="gap-2 px-4">
              <Text className="text-xs font-bold uppercase tracking-[2px] text-accent">{item.overline}</Text>
              <Text className="font-display text-[34px] leading-[40px] text-foreground">{item.title}</Text>
              <Text className="text-base leading-6 text-muted-foreground">{item.body}</Text>
            </View>
          </View>
        )}
      />

      <View className="gap-4 px-6">
        <View className="flex-row gap-1.5" accessibilityLabel={`Page ${index + 1} of ${SLIDES.length}`}>
          {SLIDES.map((s, i) => (
            <View key={s.key} className={`h-2 rounded-full ${i === index ? 'w-6 bg-primary' : 'w-2 bg-border-strong'}`} />
          ))}
        </View>
        <AppButton label={index === SLIDES.length - 1 ? 'Get started' : 'Next'} onPress={next} />
        <AppButton label="I already have an account" variant="ghost" onPress={finish} />
      </View>
    </View>
  );
}
