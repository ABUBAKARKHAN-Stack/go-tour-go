import type { BottomTabBarProps } from 'expo-router/tabs';
import { Compass, House, ListChecks, UserRound, Users, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { colors } from '@/lib/theme';

const ICONS: Record<string, LucideIcon> = {
  index: House,
  explore: Compass,
  trips: ListChecks,
  community: Users,
  profile: UserRound,
};

/** Height of the floating bar itself, without the bottom inset. */
export const TAB_BAR_HEIGHT = 68;

/** Bottom padding a scrolling tab screen needs so its last item clears the floating bar. */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 20;
}

/**
 * Floating pill tab bar from the redesign. JavaScript tabs (rather than native
 * tabs) so icons render reliably on Android and the bar matches the design.
 */
export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 px-4"
      style={{ bottom: Math.max(insets.bottom, 12) }}
    >
      <View
        className="flex-row rounded-full border border-border bg-card px-2"
        style={{ height: TAB_BAR_HEIGHT, boxShadow: '0 8px 24px rgba(28, 26, 23, 0.10)' }}
        accessibilityRole="tablist"
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const Icon = ICONS[route.name] ?? House;
          const badge = options.tabBarBadge;
          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
              className="flex-1 items-center justify-center gap-1"
            >
              <View className={`h-8 w-14 items-center justify-center rounded-full ${focused ? 'bg-primary-soft' : ''}`}>
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
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
