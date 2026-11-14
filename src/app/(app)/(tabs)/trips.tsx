import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { CalendarDays, ClipboardList, Luggage, MapPin, NotebookPen, Plus, Search, Trash2, X } from 'lucide-react-native';
import { memo, useMemo, useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { Alert, FlatList, Modal, Platform, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Text, TextInput } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton } from '@/components/app-button';
import { BrandHeader } from '@/components/brand-header';
import { useIsOnline } from '@/components/offline-banner';
import { DestinationCard } from '@/components/destination-card';
import { DestinationImage } from '@/components/destination-image';
import { Chip, Segmented } from '@/components/form';
import { FormTextField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { Sheet } from '@/components/sheet';
import { EmptyState, ErrorState, InlineError, LoadingState } from '@/components/states';
import { searchDestinations, useDestinations } from '@/features/destinations/api';
import { TRIP_STATUSES, useTripActions, useTrips } from '@/features/trips/api';
import { tripItemSchema } from '@/features/trips/schemas';
import { errorMessage } from '@/lib/errors';
import { serverError, useZodForm } from '@/lib/forms';
import { brandGradient, colors, shadow } from '@/lib/theme';
import type { DestinationSummary, TripItem, TripStatus } from '@/lib/types';
import { tx } from '@/lib/i18n';

type Filter = TripStatus | 'all';

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TripsScreen() {
  const trips = useTrips();
  const destinations = useDestinations();
  const actions = useTripActions();
  const online = useIsOnline();
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<TripItem | null>(null);
  const [adding, setAdding] = useState(false);

  const byId = useMemo(() => new Map((destinations.data ?? []).map((d) => [d.id, d])), [destinations.data]);
  const items = (trips.data ?? []).filter((t) => filter === 'all' || t.status === filter);
  const counts = useMemo(() => {
    const c = { todo: 0, in_progress: 0, visited: 0 } as Record<TripStatus, number>;
    for (const t of trips.data ?? []) c[t.status] += 1;
    return c;
  }, [trips.data]);
  const total = trips.data?.length ?? 0;

  const add = (d: DestinationSummary) => {
    setAdding(false);
    if (!online) {
      Alert.alert(tx('No internet connection'), tx('Connect to the internet to add to your trip.'));
      return;
    }
    actions.add.mutate({ destinationId: d.id }, { onError: (e) => Alert.alert(tx('Could not add'), errorMessage(e)) });
  };

  return (
    <Screen
      inTabs
      scroll={false}
      hero={
        <BrandHeader
          title={tx('My trip')}
          icon={Luggage}
          subtitle={tx('Places you want to visit, and how far you have got.')}
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tx('Add destination')}
              onPress={() => setAdding(true)}
              className="h-11 w-11 items-center justify-center rounded-full active:opacity-80"
              style={{ experimental_backgroundImage: brandGradient, boxShadow: shadow(0.22, 4, 10) }}
            >
              <Plus color="#fff" size={22} />
            </Pressable>
          }
        >
          {total ? (
            <View className="gap-2 rounded-[20px] bg-card p-3.5" style={{ boxShadow: shadow(0.08, 6, 20) }}>
              <View className="flex-row items-baseline justify-between">
                <Text className="text-sm font-semibold text-heading">{tx('{0} of {1} visited', { 0: counts.visited, 1: total })}</Text>
                <Text className="text-xs text-muted-foreground">{tx('{0} in progress', { 0: counts.in_progress })}</Text>
              </View>
              <View className="h-2 overflow-hidden rounded-full bg-primary-soft" accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: counts.visited }}>
                <View className="h-full rounded-full" style={{ width: `${Math.round((counts.visited / total) * 100)}%`, experimental_backgroundImage: brandGradient }} />
              </View>
            </View>
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4" contentContainerClassName="gap-2 px-4">
            {[{ value: 'all' as Filter, label: tx('All'), n: total }, ...TRIP_STATUSES.map((t) => ({ value: t.value as Filter, label: t.label, n: counts[t.value] }))].map((f) => (
              <Chip key={f.value} label={`${f.label} · ${f.n}`} selected={filter === f.value} onPress={() => setFilter(f.value)} />
            ))}
          </ScrollView>
        </BrandHeader>
      }
    >
      {trips.isLoading ? (
        <LoadingState label={tx('Loading your trip...')} />
      ) : trips.isError && !trips.data ? (
        <ErrorState error={trips.error} onRetry={trips.refetch} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(t) => t.id}
          contentContainerClassName="gap-3 px-4 pb-6 pt-1"
          refreshControl={<RefreshControl refreshing={trips.isRefetching} onRefresh={() => void trips.refetch()} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon={ClipboardList}
              title={filter === 'all' ? tx('Your trip is empty') : tx('Nothing here yet')}
              message={tx('Add destinations you want to visit and track your progress.')}
              actionLabel={tx('Add destination')}
              onAction={() => setAdding(true)}
            />
          }
          renderItem={({ item }) => (
            <TripRow
              item={item}
              destination={byId.get(item.destination_id)}
              onEdit={() => setEditing(item)}
              onStatus={(status) => actions.update.mutate({ id: item.id, patch: { status } })}
            />
          )}
        />
      )}

      <EditTripModal
        item={editing}
        destination={editing ? byId.get(editing.destination_id) : undefined}
        onClose={() => setEditing(null)}
      />
      <AddDestinationModal visible={adding} destinations={destinations.data ?? []} existing={new Set((trips.data ?? []).map((t) => t.destination_id))} onPick={add} onClose={() => setAdding(false)} />
    </Screen>
  );
}

const TripRow = memo(function TripRow({
  item,
  destination: d,
  onEdit,
  onStatus,
}: {
  item: TripItem;
  destination: DestinationSummary | undefined;
  onEdit: () => void;
  onStatus: (s: TripStatus) => void;
}) {
  if (!d) return null;
  return (
    <View className="gap-3 rounded-[20px] bg-card p-3" style={{ boxShadow: shadow(0.08, 6, 20) }}>
      <Pressable onPress={() => router.push({ pathname: '/destination/[id]', params: { id: d.id } })} className="flex-row gap-3 active:opacity-80">
        <DestinationImage uri={d.image_url} category={d.category} className="h-[72px] w-[72px] rounded-2xl" iconSize={24} recyclingKey={d.id} />
        <View className="flex-1 gap-0.5">
          <Text className="text-base font-semibold text-heading">
            {d.name}
          </Text>
          <View className="flex-row items-center gap-1">
            <MapPin color={colors.faint} size={12} />
            <Text className="text-xs text-muted-foreground">{d.city}</Text>
          </View>
          {item.planned_date ? (
            <View className="flex-row items-center gap-1">
              <CalendarDays color={colors.primary} size={12} />
              <Text className="text-xs text-accent">{formatDate(item.planned_date)}</Text>
            </View>
          ) : null}
          {item.notes ? (
            <Text className="text-xs text-foreground">
              {item.notes}
            </Text>
          ) : null}
        </View>
        <IconButton icon={NotebookPen} label={tx('Edit {0}', { 0: d.name })} onPress={onEdit} />
      </Pressable>
      <View className="flex-row gap-2">
        {TRIP_STATUSES.map((s) => (
          <Chip key={s.value} label={s.label} selected={item.status === s.value} onPress={() => onStatus(s.value)} />
        ))}
      </View>
    </View>
  );
});

function EditTripModal({ item, destination, onClose }: { item: TripItem | null; destination?: DestinationSummary; onClose: () => void }) {
  // Keep showing the last item while the sheet slides away.
  const [shown, setShown] = useState<{ item: TripItem; destination?: DestinationSummary } | null>(item ? { item, destination } : null);
  if (item && (item !== shown?.item || destination !== shown?.destination)) setShown({ item, destination });
  return (
    <Sheet
      visible={Boolean(item)}
      onClose={onClose}
      dragAnywhere
      header={
        <View className="flex-row items-center justify-between gap-3">
          <Text accessibilityRole="header" className="flex-1 font-display text-2xl text-heading">
            {shown?.destination?.name ?? tx('Trip item')}
          </Text>
          <IconButton icon={X} label={tx('Close')} onPress={onClose} />
        </View>
      }
    >
      {shown ? <EditTripForm key={shown.item.id} item={shown.item} destination={shown.destination} onClose={onClose} /> : null}
    </Sheet>
  );
}

function EditTripForm({ item, destination, onClose }: { item: TripItem; destination?: DestinationSummary; onClose: () => void }) {
  const actions = useTripActions();
  const { control, handleSubmit, setError, setValue, formState } = useZodForm(tripItemSchema, {
    defaultValues: { status: item.status, plannedDate: item.planned_date, notes: item.notes ?? '' },
  });
  const date = useWatch({ control, name: 'plannedDate' });
  const setDate = (value: string | null) => setValue('plannedDate', value, { shouldDirty: true });

  const pickDate = () => {
    const value = date ? new Date(`${date}T00:00:00`) : new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        minimumDate: new Date(2020, 0, 1),
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) {
            const y = selected.getFullYear();
            const m = String(selected.getMonth() + 1).padStart(2, '0');
            const dd = String(selected.getDate()).padStart(2, '0');
            setDate(`${y}-${m}-${dd}`);
          }
        },
      });
    }
  };

  const save = handleSubmit((v) =>
    actions.update.mutate(
      { id: item.id, patch: { notes: v.notes, planned_date: v.plannedDate, status: v.status } },
      { onSuccess: onClose, onError: (e) => setError('root', serverError(e)) },
    ),
  );

  const remove = () => {
    Alert.alert(tx('Remove from trip?'), destination?.name, [
      { text: tx('Cancel'), style: 'cancel' },
      {
        text: tx('Remove'),
        style: 'destructive',
        onPress: () => actions.remove.mutate(item.id, { onSuccess: onClose, onError: (e) => setError('root', serverError(e)) }),
      },
    ]);
  };

  return (
        <View className="gap-4">
          {formState.errors.root?.message ? <InlineError message={formState.errors.root.message} /> : null}
          <Controller control={control} name="status" render={({ field }) => <Segmented value={field.value} onChange={field.onChange} options={TRIP_STATUSES} />} />
          <Pressable onPress={pickDate} className="min-h-[52px] flex-row items-center gap-2 rounded-full bg-primary-soft px-4 active:opacity-80">
            <CalendarDays color={colors.primary} size={18} />
            <Text className="flex-1 text-base text-foreground">{formatDate(date) ?? tx('Add planned visit date')}</Text>
            {date ? (
              <Pressable accessibilityLabel={tx('Clear date')} onPress={() => setDate(null)} hitSlop={10}>
                <X color={colors.mutedForeground} size={16} />
              </Pressable>
            ) : null}
          </Pressable>
          <FormTextField control={control} name="notes" label={tx('Notes')} multiline maxLength={1000} placeholder={tx('Opening times, who to go with, what to try...')} />
          <View className="flex-row gap-2">
            <AppButton label={tx('Remove')} icon={Trash2} variant="outline" onPress={remove} className="flex-1" />
            <AppButton label={tx('Save')} onPress={save} loading={actions.update.isPending} className="flex-1" />
          </View>
        </View>
  );
}

function AddDestinationModal({
  visible,
  destinations,
  existing,
  onPick,
  onClose,
}: {
  visible: boolean;
  destinations: DestinationSummary[];
  existing: Set<string>;
  onPick: (d: DestinationSummary) => void;
  onClose: () => void;
}) {
  const [term, setTerm] = useState('');
  const insets = useSafeAreaInsets();
  const results = useMemo(() => searchDestinations(destinations, term).filter((d) => !existing.has(d.id)), [destinations, term, existing]);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center gap-2 px-4 py-3">
          <View className="min-h-[52px] flex-1 flex-row items-center gap-2 rounded-full bg-card px-4" style={{ boxShadow: shadow(0.1, 4, 14) }}>
            <Search color={colors.heading} size={18} />
            <TextInput
              autoFocus
              value={term}
              onChangeText={setTerm}
              placeholder={tx('Search a destination to add')}
              placeholderTextColor={colors.faint}
              className="flex-1 text-base text-foreground"
            />
          </View>
          <IconButton icon={X} label={tx('Close')} onPress={onClose} />
        </View>
        <FlatList
          data={results}
          keyExtractor={(d) => d.id}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-3 px-4"
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          ListEmptyComponent={<EmptyState title={tx('No destinations found')} message={tx('Try another name or city.')} />}
          renderItem={({ item }) => (
            <DestinationCard destination={item} variant="row" right={<IconButton icon={Plus} label={tx('Add {0}', { 0: item.name })} onPress={() => onPick(item)} active />} />
          )}
        />
      </View>
    </Modal>
  );
}
