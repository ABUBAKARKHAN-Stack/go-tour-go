import { Tabs } from 'expo-router/tabs';

import { TabBar } from '@/components/tab-bar';
import { useUnreadCount } from '@/features/inbox/api';
import { colors } from '@/lib/theme';

/** Five main sections with the floating tab bar from the redesign. */
export default function TabsLayout() {
  const unread = useUnreadCount();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarBadge: unread > 0 ? (unread > 9 ? '9+' : unread) : undefined }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="trips" options={{ title: 'Trips' }} />
      <Tabs.Screen name="community" options={{ title: 'Community' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
