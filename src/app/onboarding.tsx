import { Compass, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { FlatList, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { storage, StorageKeys } from '@/lib/storage';
import { colors } from '@/lib/theme';

type Slide = { key: string; title: string; body: string; icon: LucideIcon; points: string[] };

const SLIDES: Slide[] = [
  {
    key: 'discover',
    title: 'Discover',
    body: 'Explore destinations and nearby places on a travel-aware map.',
    icon: Compass,
    points: ['Landmarks light up as you approach', 'Routes from where you are', 'Nearby food, hotels and services'],
  },
  {
    key: 'ai',
    title: 'AI Companion',
    body: 'Get travel information and assistance whenever you need it.',
    icon: Sparkles,
    points: ['Ask about history, culture and tips', 'Point your camera with Visual Lens', 'Guides in English and Urdu'],
  },
  {
    key: 'safe',
    title: 'Stay Safe',
    body: 'Use location sharing, friends and SOS while you travel.',
    icon: ShieldCheck,
    points: ['Share live location for a set time', 'See friends on the map', 'One-press SOS to trusted contacts'],
  },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const list = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const finish = () => storage.set(StorageKeys.onboardingDone, true);
  const next = () => {
    if (index < SLIDES.length - 1) list.current?.scrollToIndex({ index: index + 1, animated: true });
    else finish();
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}>
      <View className="flex-row items-center justify-between px-5 py-2">
        <Text className="text-sm font-bold uppercase tracking-widest text-accent">GoTourGo</Text>
        <Pressable accessibilityRole="button" onPress={finish} hitSlop={12} className="min-h-11 justify-center px-2">
          <Text className="text-sm font-semibold text-muted-foreground">Skip</Text>
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
        renderItem={({ item }) => {
          const Icon = item.icon;
          return (
            <View style={{ width }} className="flex-1 justify-center gap-6 px-8">
              <View className="h-28 w-28 items-center justify-center self-center rounded-full border border-accent/40 bg-secondary">
                <Icon color={colors.accent} size={52} strokeWidth={1.6} />
              </View>
              <View className="gap-2">
                <Text className="text-center text-3xl font-extrabold text-foreground">{item.title}</Text>
                <Text className="text-center text-base text-muted-foreground">{item.body}</Text>
              </View>
              <View className="gap-3 rounded-3xl bg-card p-5">
                {item.points.map((p) => (
                  <View key={p} className="flex-row items-center gap-3">
                    <View className="h-2 w-2 rounded-full bg-accent" />
                    <Text className="flex-1 text-sm text-foreground">{p}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        }}
      />

      <View className="gap-5 px-6">
        <View className="flex-row justify-center gap-2">
          {SLIDES.map((s, i) => (
            <View key={s.key} className={`h-2 rounded-full ${i === index ? 'w-6 bg-accent' : 'w-2 bg-muted'}`} />
          ))}
        </View>
        <AppButton label={index === SLIDES.length - 1 ? 'Get started' : 'Next'} onPress={next} variant="accent" />
      </View>
    </View>
  );
}
