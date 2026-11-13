import { Ban, CarFront, CloudFog, Construction, Crosshair, Droplets, MapPin, Mountain, OctagonX, Snowflake, TriangleAlert, X, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Sheet } from '@/components/sheet';
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

type Point = { latitude: number; longitude: number };

/**
 * "Report a hazard". Reports reach other travellers on the map, in journeys
 * and as alerts, and expire on their own. By default the report is at the
 * traveller's current position; with `point` it is at that spot on the map
 * (long-press, or "Choose on map" when `onPickOnMap` is given).
 */
export function ReportHazardSheet({
  visible,
  onClose,
  point = null,
  onPickOnMap,
  onUseMyLocation,
}: {
  visible: boolean;
  onClose: () => void;
  point?: Point | null;
  onPickOnMap?: () => void;
  onUseMyLocation?: () => void;
}) {
  const report = useReportHazard();
  const [locating, setLocating] = useState(false);
  const { control, handleSubmit, reset } = useZodForm(hazardReportSchema, { defaultValues: { hazardType: null, severity: 'medium', note: '' } });

  const close = () => {
    reset();
    onClose();
  };

  const submit = handleSubmit(async ({ hazardType, severity, note }) => {
    let fix: Point | null = point;
    if (!fix) {
      setLocating(true);
      fix = await getCurrentFix();
      setLocating(false);
    }
    if (!fix) {
      Alert.alert(tx('Location unavailable'), tx('We could not get your location. Try again outdoors, or choose the spot on the map.'));
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
    <Sheet
      visible={visible}
      onClose={close}
      header={
        <View className="flex-row items-start gap-3">
          <View className="flex-1 gap-1">
            <Text accessibilityRole="header" className="font-display text-2xl text-heading">{tx('Report a hazard')}</Text>
            <Text className="text-sm text-muted-foreground">{tx('Reports expire on their own.')}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={tx('Close')} hitSlop={10} onPress={close} className="h-10 w-10 items-center justify-center rounded-full bg-primary-soft">
            <X color={colors.foreground} size={18} />
          </Pressable>
        </View>
      }
    >
        <ScrollView className="mt-2 max-h-[440px]" contentContainerClassName="gap-4" keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <Text className="text-sm font-medium text-muted-foreground">{tx('Where is it?')}</Text>
            <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3">
              {point ? <MapPin color={colors.destructive} size={20} /> : <Crosshair color={colors.primary} size={20} />}
              <Text className="flex-1 text-sm text-foreground" style={{ fontVariant: ['tabular-nums'] }}>
                {point ? tx('Spot on the map · {0}, {1}', { 0: point.latitude.toFixed(4), 1: point.longitude.toFixed(4) }) : tx('My current location')}
              </Text>
            </View>
            {onPickOnMap ? (
              <View className="flex-row gap-2">
                <AppButton label={point ? tx('Move the spot') : tx('Choose on map')} icon={MapPin} size="sm" variant="secondary" onPress={onPickOnMap} className="flex-1" />
                {point && onUseMyLocation ? (
                  <AppButton label={tx('Use my location')} icon={Crosshair} size="sm" variant="secondary" onPress={onUseMyLocation} className="flex-1" />
                ) : null}
              </View>
            ) : null}
            {onPickOnMap && !point ? <Text className="text-xs text-faint">{tx('Tip: long-press the map to report at that spot.')}</Text> : null}
          </View>

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
    </Sheet>
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
