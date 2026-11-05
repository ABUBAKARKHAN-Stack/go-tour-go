import { Tabs } from 'expo-router/tabs';

import { TabBar } from '@/components/tab-bar';
import { useUnreadCount } from '@/features/inbox/api';
import { colors } from '@/lib/theme';
import { tx } from '@/lib/i18n';

/** Five main sections with the floating tab bar from the redesign. */
export default function TabsLayout() {
  const unread = useUnreadCount();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: tx('Home'), tabBarBadge: unread > 0 ? (unread > 9 ? '9+' : unread) : undefined }} />
      <Tabs.Screen name="explore" options={{ title: tx('Explore') }} />
      <Tabs.Screen name="trips" options={{ title: tx('Trips') }} />
      <Tabs.Screen name="community" options={{ title: tx('Community') }} />
      <Tabs.Screen name="profile" options={{ title: tx('Profile') }} />
    </Tabs>
  );
}
