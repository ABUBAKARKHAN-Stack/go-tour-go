import {
  ArrowRight,
  BellRing,
  Camera,
  Landmark,
  Languages,
  Map as MapIcon,
  MapPinned,
  Navigation,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FlatList, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { IconTile, type TileTone } from '@/components/brand';
import { Text } from '@/components/text';
import { HERO_PHOTOS, prefetchHeroPhotos, type HeroPhoto } from '@/features/brand/hero-photos';
import { FloatingCard, HandNote, heroHeight, PhotoHeader, StepPill, TwoToneTitle } from '@/features/brand/mood';
import { haptics } from '@/lib/haptics';
import { changeLanguage, language, tx } from '@/lib/i18n';
import { LOCALES } from '@/lib/preferences';
import { storage, StorageKeys } from '@/lib/storage';
import { colors } from '@/lib/theme';

type Feature = { icon: LucideIcon; label: string; tone: TileTone };
type Slide = {
  key: string;
  photo: HeroPhoto;
  first: string;
  second: string;
  body: string;
  features: Feature[];
  /** What floats over the photo (notes and feature cards, as in the design guide). */
  overlay: (w: number, h: number) => ReactNode;
};

const SLIDES: Slide[] = [
  {
    key: 'discover',
    photo: HERO_PHOTOS.discover,
    first: tx('Discover'),
    second: tx('Amazing places'),
    body: tx('GoTourGo notices the landmarks you pass and tells you why they matter: history, food and local tips, right when you arrive.'),
    features: [
      { icon: BellRing, label: tx('Landmark alerts'), tone: 'ice' },
      { icon: Landmark, label: tx('History & culture'), tone: 'peach' },
      { icon: Camera, label: tx('Photos & guides'), tone: 'mint' },
      { icon: MapIcon, label: tx('Offline maps'), tone: 'lemon' },
    ],
    overlay: (w, h) => <HandNote lines={[tx('New views,'), tx('new stories')]} style={{ end: 18, top: h * 0.26 }} />,
  },
  {
    key: 'companion',
    photo: HERO_PHOTOS.companion,
    first: tx('Your AI travel'),
    second: tx('companion'),
    body: tx('Ask about any place in English or Urdu, get food, shopping and culture tips, and point your camera at a landmark to know what it is.'),
    features: [
      { icon: Sparkles, label: tx('AI travel guide'), tone: 'ice' },
      { icon: Languages, label: tx('Urdu & English'), tone: 'peach' },
      { icon: ScanSearch, label: tx('Visual Lens'), tone: 'mint' },
      { icon: Navigation, label: tx('Journey mode'), tone: 'lemon' },
    ],
    overlay: (w, h) => (
      <FloatingCard icon={Sparkles} title={tx('AI travel guide')} text={tx('"What should I eat near Hunza?"')} style={{ end: 16, top: h * 0.42 }} rotate={2} />
    ),
  },
  {
    key: 'connect',
    photo: HERO_PHOTOS.connect,
    first: tx('Explore, connect &'),
    second: tx('stay safe'),
    body: tx('Share travel moments with the community, show your live location to the friends you choose, and send an SOS with your position.'),
    features: [
      { icon: Users, label: tx('Travel community'), tone: 'ice' },
      { icon: MapPinned, label: tx('Live location'), tone: 'peach' },
      { icon: ShieldAlert, label: tx('SOS alert'), tone: 'mint' },
      { icon: Navigation, label: tx('Safe journeys'), tone: 'lemon' },
    ],
    overlay: (w, h) => (
      <FloatingCard
        icon={ShieldAlert}
        title={tx('SOS')}
        text={tx('Hold to send your location to trusted contacts.')}
        tone="peach"
        iconColor={colors.destructive}
        style={{ end: 16, top: h * 0.42 }}
        rotate={2}
      />
    ),
  },
];

/** Three-step welcome in the design guide's mood. Same content and controls as before. */
export default function Onboarding() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const list = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  // Same photo height on every step (and on the sign-in screens).
  const photoHeight = heroHeight(height);

  useEffect(prefetchHeroPhotos, []);

  const finish = () => storage.set(StorageKeys.onboardingDone, true);
  const next = () => {
    haptics.select();
    if (index < SLIDES.length - 1) list.current?.scrollToIndex({ index: index + 1, animated: true });
    else finish();
  };

  return (
    <View className="flex-1 bg-background">
      <FlatList
        ref={list}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.key}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item, index: i }) => (
          <ScrollView style={{ width }} contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false} bounces={false}>
            <View style={{ paddingTop: insets.top }} className="bg-background">
              <PhotoHeader photo={item.photo} width={width} height={photoHeight}>
                {item.overlay(width, photoHeight)}
              </PhotoHeader>
            </View>
            <View className="-mt-2 gap-2.5 px-6">
              <StepPill label={tx('Step {0} of {1}', { 0: i + 1, 1: SLIDES.length })} />
              <TwoToneTitle first={item.first} second={item.second} />
              <Text className="text-[14px] leading-[21px] text-muted-foreground">{item.body}</Text>
              <View className="flex-row justify-between pt-2">
                {item.features.map((f) => (
                  <IconTile key={f.label} icon={f.icon} label={f.label} tone={f.tone} size={46} />
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      />

      {/* Language and Skip stay on top of every slide. */}
      <View className="absolute end-4 flex-row items-center gap-2" style={{ top: insets.top + 10 }}>
        <View className="flex-row rounded-full bg-white/85 p-0.5" accessibilityRole="radiogroup" accessibilityLabel="Language / زبان">
          {LOCALES.map((l) => (
            <Pressable
              key={l.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: language === l.value }}
              onPress={() => changeLanguage(l.value)}
              className={`min-h-8 justify-center rounded-full px-2.5 ${language === l.value ? 'bg-primary' : ''}`}
            >
              <Text className={`text-xs font-semibold ${language === l.value ? 'text-white' : 'text-heading'}`}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable accessibilityRole="button" onPress={finish} hitSlop={12} className="min-h-10 justify-center rounded-full bg-white/85 px-3">
          <Text className="text-sm font-semibold text-accent">{tx('Skip')}</Text>
        </Pressable>
      </View>

      <View className="gap-3 px-6" style={{ paddingBottom: insets.bottom + 12 }}>
        <View className="flex-row justify-center gap-1.5" accessibilityLabel={tx('Page {0} of {1}', { 0: index + 1, 1: SLIDES.length })}>
          {SLIDES.map((s, i) => (
            <View key={s.key} className={`h-2 rounded-full ${i === index ? 'w-6 bg-primary' : 'w-2 bg-border-strong'}`} />
          ))}
        </View>
        <AppButton label={index === SLIDES.length - 1 ? tx('Get started') : tx('Next')} trailingIcon={ArrowRight} onPress={next} />
        <Pressable accessibilityRole="button" onPress={finish} hitSlop={6} className="min-h-10 items-center justify-center">
          <Text className="text-sm font-semibold text-heading">{tx('I already have an account')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
