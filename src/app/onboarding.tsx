import { useRef, useState, type ComponentType } from 'react';
import { FlatList, Pressable, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { ArrivalScene, SafetyScene, TravellerScene } from '@/components/illustrations';
import { Text } from '@/components/text';
import { changeLanguage, language, tx } from '@/lib/i18n';
import { LOCALES } from '@/lib/preferences';
import { storage, StorageKeys } from '@/lib/storage';

type Slide = { key: string; overline: string; title: string; body: string; Art: ComponentType<{ size?: number }> };

const SLIDES: Slide[] = [
  {
    key: 'discover',
    overline: tx('Discover'),
    title: tx('Stories wait around every corner'),
    body: tx('GoTourGo notices the landmarks you pass and tells you why they matter: history, food and local tips, right when you arrive.'),
    Art: TravellerScene,
  },
  {
    key: 'journey',
    overline: tx('On the way'),
    title: tx('Landmarks speak up as you travel'),
    body: tx('Plan a journey anywhere in Pakistan. Famous places and road alerts along your route reach you as you get close, even offline.'),
    Art: ArrivalScene,
  },
  {
    key: 'safe',
    overline: tx('Travel safe'),
    title: tx('Your people, one tap away'),
    body: tx('Share your live location for as long as you choose, and send an SOS with your position to the people you trust.'),
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
      <View className="flex-row items-center justify-between px-5">
        <View className="flex-row rounded-full bg-secondary p-1" accessibilityRole="radiogroup" accessibilityLabel="Language / زبان">
          {LOCALES.map((l) => (
            <Pressable
              key={l.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: language === l.value }}
              onPress={() => changeLanguage(l.value)}
              className={`min-h-9 justify-center rounded-full px-3 ${language === l.value ? 'bg-card' : ''}`}
            >
              <Text className={`text-sm ${language === l.value ? 'font-semibold text-foreground' : 'text-faint'}`}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable accessibilityRole="button" onPress={finish} hitSlop={12} className="min-h-11 justify-center px-2">
          <Text className="text-sm font-semibold text-faint">{tx('Skip')}</Text>
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
        <View className="flex-row gap-1.5" accessibilityLabel={tx('Page {0} of {1}', { 0: index + 1, 1: SLIDES.length })}>
          {SLIDES.map((s, i) => (
            <View key={s.key} className={`h-2 rounded-full ${i === index ? 'w-6 bg-primary' : 'w-2 bg-border-strong'}`} />
          ))}
        </View>
        <AppButton label={index === SLIDES.length - 1 ? tx('Get started') : tx('Next')} onPress={next} />
        <AppButton label={tx('I already have an account')} variant="ghost" onPress={finish} />
      </View>
    </View>
  );
}
