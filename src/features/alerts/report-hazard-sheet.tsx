import { Ban, CarFront, CloudFog, Construction, Droplets, Mountain, OctagonX, Snowflake, TriangleAlert, X, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { Segmented } from '@/components/form';
import { FormTextField } from '@/components/form-field';
import { Text } from '@/components/text';
import { ALERT_LABELS, HAZARD_TYPES, useReportHazard } from '@/features/alerts/api';
import { hazardReportSchema } from '@/features/alerts/schemas';
import { getCurrentFix } from '@/features/location/location-provider';
import { errorMessage } from '@/lib/errors';
import { useZodForm } from '@/lib/forms';
import { tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';
import type { HazardType } from '@/lib/types';

const ICONS: Record<HazardType, LucideIcon> = {
  flood: Droplets,
  accident: CarFront,
  road_works: Construction,
  closure: Ban,
  blockade: OctagonX,
  landslide: Mountain,
  fog: CloudFog,
  snow: Snowflake,
  other: TriangleAlert,
};

/**
 * "Report a hazard" at the traveller's current position. Reports reach other
 * travellers on the map, in journeys and as alerts, and expire on their own.
 */
export function ReportHazardSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const report = useReportHazard();
  const [locating, setLocating] = useState(false);
  const { control, handleSubmit, reset } = useZodForm(hazardReportSchema, { defaultValues: { hazardType: null, severity: 'medium', note: '' } });

  const close = () => {
    reset();
    onClose();
  };

  const submit = handleSubmit(async ({ hazardType, severity, note }) => {
    setLocating(true);
    const fix = await getCurrentFix();
    setLocating(false);
    if (!fix) {
      Alert.alert(tx('Location unavailable'), tx('We could not get your location. Try again outdoors.'));
      return;
    }
    report.mutate(
      { hazard_type: hazardType, severity, description: note, latitude: fix.latitude, longitude: fix.longitude },
      {
        onSuccess: () => {
          close();
          Alert.alert(tx('Thank you'), tx('Travellers nearby and on routes through here will be warned.'));
        },
        onError: (e) => Alert.alert(tx('Could not report'), errorMessage(e)),
      },
    );
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable className="flex-1 bg-black/40" onPress={close} accessibilityLabel={tx('Close')} />
      <View className="rounded-t-[28px] bg-background px-6 pt-4" style={{ paddingBottom: insets.bottom + 16 }}>
        <View className="mb-3 items-center">
          <View className="h-1 w-10 rounded-full bg-border-strong" />
        </View>
        <View className="flex-row items-start gap-3">
          <View className="flex-1 gap-1">
            <Text className="font-display text-2xl text-foreground">{tx('Report a hazard')}</Text>
            <Text className="text-sm text-muted-foreground">{tx('At your current location. Reports expire on their own.')}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={tx('Close')} hitSlop={10} onPress={close} className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
            <X color={colors.foreground} size={18} />
          </Pressable>
        </View>

        <ScrollView className="mt-4 max-h-[440px]" contentContainerClassName="gap-4" keyboardShouldPersistTaps="handled">
          <Controller
            control={control}
            name="hazardType"
            render={({ field, fieldState }) => (
              <View className="gap-2">
                <View className="flex-row flex-wrap justify-between gap-y-2.5" accessibilityRole="radiogroup">
                  {HAZARD_TYPES.map(({ type: t }) => (
                    <HazardChoice key={t} type={t} selected={field.value === t} onPress={() => field.onChange(t)} />
                  ))}
                </View>
                {fieldState.error?.message ? (
                  <Text className="text-xs text-destructive" accessibilityLiveRegion="polite">
                    {fieldState.error.message}
                  </Text>
                ) : null}
              </View>
            )}
          />

          <View className="gap-2">
            <Text className="text-sm font-medium text-muted-foreground">{tx('How serious is it?')}</Text>
            <Controller
              control={control}
              name="severity"
              render={({ field }) => (
                <Segmented
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'low', label: tx('Minor') },
                    { value: 'medium', label: tx('Slow down') },
                    { value: 'high', label: tx('Dangerous') },
                  ]}
                />
              )}
            />
          </View>

          <FormTextField
            control={control}
            name="note"
            label={tx('What did you see? (optional)')}
            maxLength={280}
            placeholder={tx('e.g. Water up to the knees near the bridge')}
            multiline
          />
        </ScrollView>

        <View className="pt-4">
          <AppButton label={tx('Report hazard')} loading={locating || report.isPending} onPress={submit} />
        </View>
      </View>
    </Modal>
  );
}

function HazardChoice({ type, selected, onPress }: { type: HazardType; selected: boolean; onPress: () => void }) {
  const Icon = ICONS[type];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={ALERT_LABELS[type]}
      onPress={onPress}
      className={`w-[31.5%] items-center gap-1.5 rounded-2xl border py-3 ${selected ? 'border-destructive bg-destructive-soft' : 'border-border bg-card'}`}
    >
      <Icon color={selected ? colors.destructive : colors.mutedForeground} size={22} />
      <Text numberOfLines={1} className={`text-xs ${selected ? 'font-semibold text-destructive' : 'text-foreground'}`}>
        {ALERT_LABELS[type]}
      </Text>
    </Pressable>
  );
}
