import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Touch feedback for the few moments that deserve it: one per user action,
 * fired with the visual change, never the only feedback.
 *
 * Android uses the system haptic effects (performAndroidHapticsAsync: no
 * VIBRATE permission, follows the user's "touch feedback" setting); iOS the
 * Taptic Engine. Failures are ignored: haptics are optional.
 */
const android = Platform.OS === 'android';
const quiet = (p: Promise<void>) => void p.catch(() => undefined);

export const haptics = {
  /** A toggle switched on (like, bookmark). */
  on: () => quiet(android ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Toggle_On) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** A toggle switched off. */
  off: () => quiet(android ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Toggle_Off) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** A choice changed (segmented control, picker row). */
  select: () => quiet(android ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick) : Haptics.selectionAsync()),
  /** Something finished well (posted, sharing started). */
  success: () => quiet(android ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm) : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Something failed. */
  error: () => quiet(android ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject) : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  /** A long press committed (SOS). */
  longPress: () => quiet(android ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Long_Press) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
};
