import type { BottomTabBarProps } from 'expo-router/tabs';
import { Compass, House, ListChecks, UserRound, Users, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { I18nManager, Pressable, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { EASE_IN_OUT, usePressScale } from '@/lib/motion';
import { colors, shadow } from '@/lib/theme';

const ICONS: Record<string, LucideIcon> = {
  index: House,
  explore: Compass,
  trips: ListChecks,
  community: Users,
  profile: UserRound,
};

/** Height of the floating bar itself, without the bottom inset. */
export const TAB_BAR_HEIGHT = 68;
const BAR_PADDING = 8;
const PILL_W = 56;
const PILL_H = 32;

/** Bottom padding a scrolling tab screen needs so its last item clears the floating bar. */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 20;
}

/**
 * Floating pill tab bar from the redesign. JavaScript tabs (rather than native
 * tabs) so icons render reliably on Android and the bar matches the design.
 *
 * Motion: the screens themselves switch instantly (tabs are peers; sliding
 * them would imply depth and cost a moment on every switch). What moves is the
 * highlight pill, which glides to the new tab, and the pressed icon.
 */
export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const [iconTop, setIconTop] = useState(0);
  const tabWidth = barWidth ? (barWidth - BAR_PADDING * 2) / state.routes.length : 0;
  const x = useSharedValue(0);
  const placed = useRef(false);

  useEffect(() => {
    if (!tabWidth) return;
    const target = state.index * tabWidth * (I18nManager.isRTL ? -1 : 1);
    if (!placed.current) {
      placed.current = true;
      x.set(target);
      return;
    }
    x.set(withTiming(target, { duration: 250, easing: EASE_IN_OUT, reduceMotion: ReduceMotion.System }));
  }, [state.index, tabWidth, x]);

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <View pointerEvents="box-none" className="absolute left-0 right-0 px-4" style={{ bottom: Math.max(insets.bottom, 12) }}>
      <View
        className="flex-row rounded-full bg-card"
        style={{ height: TAB_BAR_HEIGHT, paddingHorizontal: BAR_PADDING, boxShadow: shadow(0.14, 8, 24) }}
        accessibilityRole="tablist"
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      >
        {tabWidth ? (
          <Animated.View
            pointerEvents="none"
            className="absolute rounded-full bg-primary-soft"
            style={[{ top: iconTop, start: BAR_PADDING + (tabWidth - PILL_W) / 2, width: PILL_W, height: PILL_H }, pillStyle]}
          />
        ) : null}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };
          return (
            <TabItem
              key={route.key}
              label={typeof options.title === 'string' ? options.title : route.name}
              icon={ICONS[route.name] ?? House}
              badge={options.tabBarBadge}
              focused={focused}
              onPress={onPress}
              onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
              onIconLayout={index === 0 ? setIconTop : undefined}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({
  label,
  icon: Icon,
  badge,
  focused,
  onPress,
  onLongPress,
  onIconLayout,
}: {
  label: string;
  icon: LucideIcon;
  badge: string | number | undefined;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onIconLayout?: (y: number) => void;
}) {
  const press = usePressScale(0.92);
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      {...press.handlers}
      pressRetentionOffset={16}
      className="flex-1 items-center justify-center"
    >
      {/* The icon sits at the top of this wrapper, so its y in the bar is the pill's top. */}
      <Animated.View
        className="items-center gap-1"
        style={press.style}
        onLayout={onIconLayout ? (e) => onIconLayout(e.nativeEvent.layout.y) : undefined}
      >
        <View className="h-8 w-14 items-center justify-center">
          <Icon color={focused ? colors.primary : colors.faint} size={22} strokeWidth={focused ? 2.2 : 1.9} />
          {badge != null ? (
            <View className="absolute right-2 top-0 min-w-4 items-center rounded-full border-2 border-card bg-accent px-1">
              <Text className="text-[9px] font-bold text-white">{String(badge)}</Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} className={`text-[11px] ${focused ? 'font-semibold text-primary' : 'font-medium text-faint'}`}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
