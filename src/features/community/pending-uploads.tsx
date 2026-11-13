import { Image } from 'expo-image';
import { Play, RotateCw, Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Text } from '@/components/text';
import { discardUpload, retryUpload, useUploadJobs, type UploadJob } from '@/features/community/upload-queue';
import { tx } from '@/lib/i18n';
import { CSS_EASE_OUT } from '@/lib/motion';
import { colors } from '@/lib/theme';

/** Posts and stories still uploading (or failed), shown above the feed. */
export function PendingUploads() {
  const jobs = useUploadJobs();
  if (jobs.length === 0) return null;
  return (
    <View className="gap-2">
      {jobs.map((job) => (
        <PendingCard key={job.id} job={job} />
      ))}
    </View>
  );
}

function PendingCard({ job }: { job: UploadJob }) {
  const first = job.media[0];
  const thumb = first ? (first.type === 'video' ? first.posterUri : first.uri) : null;
  const failed = job.status === 'failed';
  const percent = Math.round(job.progress * 100);
  const what = job.kind === 'story' ? (job.media.length > 1 ? tx('{0} stories', { 0: job.media.length }) : tx('Your story')) : tx('Your post');
  const title = failed ? tx('{0} was not shared', { 0: what }) : job.media.length === 0 ? tx('Posting…') : tx('Sharing {0}… {1}%', { 0: what.toLowerCase(), 1: percent });

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityLabel={title}
      className={`gap-2 rounded-2xl border bg-card p-3 ${failed ? 'border-destructive/50' : 'border-border'}`}
    >
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 overflow-hidden rounded-xl bg-primary-soft">
          {thumb ? <Image source={{ uri: thumb }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : null}
          {first?.type === 'video' ? (
            <View className="absolute inset-0 items-center justify-center">
              <Play color="#fff" fill="#fff" size={14} />
            </View>
          ) : null}
        </View>
        <View className="flex-1">
          <Text numberOfLines={1} className="text-sm font-semibold text-heading">
            {title}
          </Text>
          <Text numberOfLines={2} className={`text-xs ${failed ? 'text-destructive' : 'text-muted-foreground'}`}>
            {failed ? (job.error ?? tx('Check your connection.')) : job.caption || (job.place?.name ?? tx('Keep the app open until it finishes.'))}
          </Text>
        </View>
        {failed ? (
          <>
            <Pressable accessibilityRole="button" accessibilityLabel={tx('Try again')} hitSlop={6} onPress={() => retryUpload(job.id)} className="h-10 w-10 items-center justify-center">
              <RotateCw color={colors.primary} size={20} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={tx('Discard')} hitSlop={6} onPress={() => discardUpload(job.id)} className="h-10 w-10 items-center justify-center">
              <Trash2 color={colors.mutedForeground} size={19} />
            </Pressable>
          </>
        ) : null}
      </View>
      {failed ? null : (
        <View className="h-1.5 overflow-hidden rounded-full bg-primary-soft">
          {/* Childless, absolutely positioned fill: its width can change without re-laying-out anything else. */}
          <Animated.View
            className="absolute bottom-0 left-0 top-0 rounded-full bg-primary"
            style={{ width: `${Math.max(3, percent)}%`, transitionProperty: 'width', transitionDuration: 200, transitionTimingFunction: CSS_EASE_OUT }}
          />
        </View>
      )}
    </View>
  );
}
