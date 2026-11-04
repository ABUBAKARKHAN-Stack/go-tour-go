import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { colors } from '@/lib/theme';

/**
 * Local notifications only (no remote push/FCM needed). Channels let users
 * mute categories individually in Android settings.
 */
export const CHANNELS = {
  proximity: 'proximity',
  alerts: 'alerts',
  social: 'social',
  safety: 'safety',
  sharing: 'sharing',
} as const;

export const PROXIMITY_CATEGORY = 'landmark';
export const ACTION_LEARN_MORE = 'learn-more';
export const ACTION_NAVIGATE = 'navigate';

let configured = false;

/** Safe to call multiple times (root layout and background task both call it). */
export async function configureNotifications() {
  if (configured) return;
  configured = true;

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      // While the app is open the proximity card is shown in-app, but we still
      // show the banner so behaviour is consistent and visible in demos.
      const type = notification.request.content.data?.type;
      return {
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: type === 'sos' || type === 'proximity',
        shouldSetBadge: false,
      };
    },
  });

  if (Platform.OS === 'android') {
    await Promise.all([
      Notifications.setNotificationChannelAsync(CHANNELS.proximity, {
        name: 'Nearby landmarks',
        description: 'When you arrive near a landmark or destination',
        importance: AndroidImportance.HIGH,
        lightColor: colors.accent,
        vibrationPattern: [0, 200, 120, 200],
      }),
      Notifications.setNotificationChannelAsync(CHANNELS.alerts, {
        name: 'Travel & road alerts',
        importance: AndroidImportance.HIGH,
        lightColor: colors.warning,
      }),
      Notifications.setNotificationChannelAsync(CHANNELS.social, {
        name: 'Friends & messages',
        importance: AndroidImportance.DEFAULT,
      }),
      Notifications.setNotificationChannelAsync(CHANNELS.safety, {
        name: 'Safety & SOS',
        importance: AndroidImportance.MAX,
        lightColor: colors.destructive,
      }),
      Notifications.setNotificationChannelAsync(CHANNELS.sharing, {
        name: 'Location sharing status',
        importance: AndroidImportance.LOW,
      }),
    ]).catch((e) => console.warn('channel setup failed', e));
  }

  await Notifications.setNotificationCategoryAsync(PROXIMITY_CATEGORY, [
    { identifier: ACTION_LEARN_MORE, buttonTitle: 'Learn more', options: { opensAppToForeground: true } },
    { identifier: ACTION_NAVIGATE, buttonTitle: 'Navigate', options: { opensAppToForeground: true } },
  ]).catch(() => undefined);
}

export async function getNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

/** Ask at a meaningful moment (e.g. enabling landmark alerts). Channels must exist first on Android 13+. */
export async function requestNotificationPermission(): Promise<boolean> {
  await configureNotifications();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const res = await Notifications.requestPermissionsAsync();
  return res.granted;
}

export async function notifyNow(params: {
  title: string;
  body: string;
  channel: (typeof CHANNELS)[keyof typeof CHANNELS];
  data: Record<string, unknown>;
  category?: string;
}) {
  try {
    const granted = await getNotificationPermission();
    if (!granted) return null;
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        data: params.data,
        categoryIdentifier: params.category,
        color: colors.primary,
      },
      trigger: Platform.OS === 'android' ? { channelId: params.channel } : null,
    });
  } catch (error) {
    console.warn('notification failed', error);
    return null;
  }
}

export function landmarkNotificationText(name: string, shortDescription: string, distanceText?: string, others = 0) {
  const extra = others > 0 ? ` +${others} more landmark${others > 1 ? 's' : ''} nearby.` : '';
  return {
    title: `You're near ${name}`,
    body: `${distanceText ? `${distanceText} away. ` : ''}${shortDescription} Tap to discover its history, culture and tips.${extra}`,
  };
}
