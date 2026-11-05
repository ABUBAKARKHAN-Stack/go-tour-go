import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { CalendarDays, ClipboardList, NotebookPen, Plus, Search, Trash2, X } from 'lucide-react-native';
import { memo, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Platform, Pressable, RefreshControl, View } from 'react-native';
import { Text, TextInput } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton } from '@/components/app-button';
import { useIsOnline } from '@/components/offline-banner';
import { DestinationCard } from '@/components/destination-card';
import { DestinationImage } from '@/components/destination-image';
import { Chip, Segmented, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, InlineError, LoadingState } from '@/components/states';
import { searchDestinations, useDestinations } from '@/features/destinations/api';
import { TRIP_STATUSES, useTripActions, useTrips } from '@/features/trips/api';
import { errorMessage } from '@/lib/errors';
import { colors } from '@/lib/theme';
import type { Destination, TripItem, TripStatus } from '@/lib/types';

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

  const add = (d: Destination) => {
    setAdding(false);
    if (!online) {
      Alert.alert('No internet connection', 'Connect to the internet to add to your trip.');
      return;
    }
    actions.add.mutate({ destinationId: d.id }, { onError: (e) => Alert.alert('Could not add', errorMessage(e)) });
  };

  return (
    <Screen
      inTabs
      title="My trip"
      subtitle={`${counts.visited} visited · ${counts.in_progress} in progress · ${counts.todo} to do`}
      right={<IconButton icon={Plus} label="Add destination" onPress={() => setAdding(true)} active />}
      scroll={false}
    >
      <View className="px-4 pb-3">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[{ value: 'all', label: 'All' }, ...TRIP_STATUSES]}
        />
      </View>
      {trips.isLoading ? (
        <LoadingState label="Loading your trip..." />
      ) : trips.isError && !trips.data ? (
        <ErrorState error={trips.error} onRetry={trips.refetch} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(t) => t.id}
          contentContainerClassName="gap-3 px-4 pb-6"
          refreshControl={<RefreshControl refreshing={trips.isRefetching} onRefresh={() => void trips.refetch()} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon={ClipboardList}
              title={filter === 'all' ? 'Your trip is empty' : 'Nothing here yet'}
              message="Add destinations you want to visit and track your progress."
              actionLabel="Add destination"
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
  destination: Destination | undefined;
  onEdit: () => void;
  onStatus: (s: TripStatus) => void;
}) {
  if (!d) return null;
  return (
    <View className="gap-3 rounded-3xl border border-border bg-card p-3">
      <Pressable onPress={() => router.push({ pathname: '/destination/[id]', params: { id: d.id } })} className="flex-row gap-3">
        <DestinationImage uri={d.image_url} category={d.category} className="h-16 w-16 rounded-2xl" iconSize={24} recyclingKey={d.id} />
        <View className="flex-1 gap-0.5">
          <Text numberOfLines={1} className="text-base font-semibold text-foreground">
            {d.name}
          </Text>
          <Text className="text-xs text-muted-foreground">{d.city}</Text>
          {item.planned_date ? (
            <View className="flex-row items-center gap-1">
              <CalendarDays color={colors.primary} size={12} />
              <Text className="text-xs text-accent">{formatDate(item.planned_date)}</Text>
            </View>
          ) : null}
          {item.notes ? (
            <Text numberOfLines={2} className="text-xs text-foreground">
              {item.notes}
            </Text>
          ) : null}
        </View>
        <IconButton icon={NotebookPen} label={`Edit ${d.name}`} onPress={onEdit} />
      </Pressable>
      <View className="flex-row gap-2">
        {TRIP_STATUSES.map((s) => (
          <Chip key={s.value} label={s.label} selected={item.status === s.value} onPress={() => onStatus(s.value)} />
        ))}
      </View>
    </View>
  );
});

function EditTripModal({ item, destination, onClose }: { item: TripItem | null; destination?: Destination; onClose: () => void }) {
  const actions = useTripActions();
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [status, setStatus] = useState<TripStatus>('todo');
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (item && loadedFor !== item.id) {
    setLoadedFor(item.id);
    setNotes(item.notes ?? '');
    setDate(item.planned_date);
    setStatus(item.status);
    setError(null);
  }

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

  const save = () => {
    if (!item) return;
    actions.update.mutate(
      { id: item.id, patch: { notes: notes.trim() || null, planned_date: date, status } },
      { onSuccess: onClose, onError: (e) => setError(errorMessage(e)) },
    );
  };

  const remove = () => {
    if (!item) return;
    Alert.alert('Remove from trip?', destination?.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => actions.remove.mutate(item.id, { onSuccess: onClose, onError: (e) => setError(errorMessage(e)) }),
      },
    ]);
  };

  return (
    <Modal visible={Boolean(item)} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="gap-4 rounded-t-3xl bg-card p-5" style={{ paddingBottom: insets.bottom + 16 }}>
          <View className="flex-row items-center justify-between">
            <Text numberOfLines={1} className="flex-1 text-lg font-bold text-foreground">
              {destination?.name ?? 'Trip item'}
            </Text>
            <IconButton icon={X} label="Close" onPress={onClose} />
          </View>
          {error ? <InlineError message={error} /> : null}
          <Segmented value={status} onChange={setStatus} options={TRIP_STATUSES} />
          <Pressable onPress={pickDate} className="min-h-12 flex-row items-center gap-2 rounded-2xl border border-border px-4">
            <CalendarDays color={colors.primary} size={18} />
            <Text className="flex-1 text-base text-foreground">{formatDate(date) ?? 'Add planned visit date'}</Text>
            {date ? (
              <Pressable accessibilityLabel="Clear date" onPress={() => setDate(null)} hitSlop={10}>
                <X color={colors.mutedForeground} size={16} />
              </Pressable>
            ) : null}
          </Pressable>
          <TextField label="Notes" value={notes} onChangeText={setNotes} multiline maxLength={1000} placeholder="Opening times, who to go with, what to try..." />
          <View className="flex-row gap-2">
            <AppButton label="Remove" icon={Trash2} variant="outline" onPress={remove} className="flex-1" />
            <AppButton label="Save" variant="accent" onPress={save} loading={actions.update.isPending} className="flex-1" />
          </View>
        </View>
      </View>
    </Modal>
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
  destinations: Destination[];
  existing: Set<string>;
  onPick: (d: Destination) => void;
  onClose: () => void;
}) {
  const [term, setTerm] = useState('');
  const insets = useSafeAreaInsets();
  const results = useMemo(() => searchDestinations(destinations, term).filter((d) => !existing.has(d.id)), [destinations, term, existing]);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center gap-2 px-4 py-3">
          <View className="min-h-12 flex-1 flex-row items-center gap-2 rounded-2xl border border-border bg-input px-4">
            <Search color={colors.mutedForeground} size={18} />
            <TextInput
              autoFocus
              value={term}
              onChangeText={setTerm}
              placeholder="Search a destination to add"
              placeholderTextColor={`${colors.mutedForeground}99`}
              className="flex-1 text-base text-foreground"
            />
          </View>
          <IconButton icon={X} label="Close" onPress={onClose} />
        </View>
        <FlatList
          data={results}
          keyExtractor={(d) => d.id}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-3 px-4"
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          ListEmptyComponent={<EmptyState title="No destinations found" message="Try another name or city." />}
          renderItem={({ item }) => (
            <DestinationCard destination={item} variant="row" right={<IconButton icon={Plus} label={`Add ${item.name}`} onPress={() => onPick(item)} active />} />
          )}
        />
      </View>
    </Modal>
  );
}
