import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import type { Landmark } from '@/features/destinations/api';
import { ACTION_NAVIGATE } from '@/features/notifications/local-notifications';
import { navigateTo } from '@/features/routing/navigate';
import { isShareToken } from '@/features/safety/share-links';
import { storage, StorageKeys } from '@/lib/storage';

/** Routes notification taps (and action buttons) to the right screen. */
function handleResponse(response: Notifications.NotificationResponse) {
  const data = (response.notification.request.content.data ?? {}) as Record<string, unknown>;
  const type = String(data.type ?? '');

  switch (type) {
    case 'proximity': {
      const id = String(data.destinationId ?? '');
      if (!id) return;
      if (response.actionIdentifier === ACTION_NAVIGATE) {
        const lm = storage.get<Landmark[]>(StorageKeys.landmarkCache, []).find((l) => l.id === id);
        if (lm) navigateTo(lm);
        return;
      }
      router.push({ pathname: '/destination/[id]', params: { id } });
      return;
    }
    case 'alert':
      router.push('/alerts');
      return;
    case 'message':
      if (data.conversation_id) {
        router.push({ pathname: '/messages/[id]', params: { id: String(data.conversation_id) } });
      }
      return;
    case 'friend_request':
    case 'friend_accepted':
      router.push('/friends');
      return;
    case 'sos':
      if (isShareToken(data.token)) router.push({ pathname: '/sos', params: { t: data.token } });
      else router.push('/notifications');
      return;
    case 'sharing':
      router.push('/safety');
      return;
    case 'offline-maps':
      router.push('/offline-maps');
      return;
    default:
      return;
  }
}

let handledColdStart = false;

export function useNotificationRouting() {
  useEffect(() => {
    // Cold start: app opened from a notification.
    if (!handledColdStart) {
      handledColdStart = true;
      const last = Notifications.getLastNotificationResponse();
      if (last) setTimeout(() => handleResponse(last), 300);
    }
    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, []);
}
