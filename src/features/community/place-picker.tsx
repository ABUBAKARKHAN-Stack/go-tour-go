import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Landmark, MapPin, Search, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TextField } from '@/components/form';
import { Text } from '@/components/text';
import type { PlaceTag } from '@/features/community/upload-plan';
import { KIND_LABEL } from '@/features/data/place-kinds';
import { searchLocal } from '@/features/data/local-queries';
import { useDestinationsByDistance } from '@/features/destinations/api';
import { formatDistance } from '@/lib/geo';
import { tx } from '@/lib/i18n';
import { colors } from '@/lib/theme';

type Row = { key: string; title: string; subtitle: string; distance: number | null; tag: PlaceTag; landmark: boolean };

function useDebounced(value: string, ms = 200) {
  const [out, setOut] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setOut(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return out;
}

/**
 * Full-screen place search for posts and stories: any landmark, or any of
 * the offline places (cities, towns, villages, areas, stations…). Works
 * without internet. Before typing it lists the landmarks nearest to you.
 */
export function PlacePicker({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (tag: PlaceTag) => void }) {
  const insets = useSafeAreaInsets();
  const [term, setTerm] = useState('');
  const q = useDebounced(term.trim());
  const { sorted, location } = useDestinationsByDistance();
  const near = location ? { latitude: location.latitude, longitude: location.longitude } : null;
  const results = useQuery({
    queryKey: ['place-picker', q, near ? `${near.latitude.toFixed(2)},${near.longitude.toFixed(2)}` : null],
    enabled: visible && q.length >= 2,
    queryFn: () => searchLocal(q, near, 25),
    placeholderData: keepPreviousData,
    networkMode: 'always',
  });

  const landmarkRow = (d: { id: string; name: string; city: string; region: string; latitude: number; longitude: number }, distance: number | null): Row => ({
    key: `d-${d.id}`,
    title: d.name,
    subtitle: [d.city, d.region].filter(Boolean).join(', '),
    distance,
    landmark: true,
    tag: { destinationId: d.id, name: d.name, latitude: d.latitude, longitude: d.longitude },
  });

  const sections =
    q.length < 2
      ? [{ title: near ? tx('Landmarks near you') : tx('Popular landmarks'), data: sorted.slice(0, 15).map((d) => landmarkRow(d, d.distance ?? null)) }]
      : [
          { title: tx('Landmarks'), data: (results.data?.landmarks ?? []).slice(0, 12).map((d) => landmarkRow(d, d.distance)) },
          {
            title: tx('Places'),
            data: (results.data?.places ?? []).map<Row>((p) => ({
              key: `p-${p.id}`,
              title: p.name,
              subtitle: [KIND_LABEL[p.kind] ?? tx('Place'), p.district ?? p.province].filter(Boolean).join(' · '),
              distance: p.distance,
              landmark: false,
              tag: { destinationId: null, name: [p.name, p.district ?? p.province].filter(Boolean).join(', '), latitude: p.latitude, longitude: p.longitude },
            })),
          },
        ].filter((s) => s.data.length > 0);

  const pick = (tag: PlaceTag) => {
    onPick(tag);
    setTerm('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center gap-2 px-4 pb-2">
          <Text className="flex-1 text-xl font-bold text-foreground">{tx('Add location')}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={tx('Close')} onPress={onClose} hitSlop={8} className="h-11 w-11 items-center justify-center">
            <X color={colors.foreground} size={22} />
          </Pressable>
        </View>
        <View className="px-4 pb-2">
          <TextField
            label={tx('Search places')}
            value={term}
            onChangeText={setTerm}
            autoFocus
            returnKeyType="search"
            placeholder={tx('Landmark, city, town or area')}
            left={<Search color={colors.mutedForeground} size={18} />}
          />
        </View>
        <SectionList
          sections={sections}
          keyExtractor={(r) => r.key}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => <Text className="pb-1 pt-3 text-sm font-semibold text-muted-foreground">{section.title}</Text>}
          ListEmptyComponent={
            q.length >= 2 && !results.isFetching ? (
              <Text className="pt-6 text-center text-sm text-muted-foreground">{tx('No places match "{0}".', { 0: q })}</Text>
            ) : undefined
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => pick(item.tag)}
              className="min-h-14 flex-row items-center gap-3 rounded-2xl px-2 py-2 active:bg-muted"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
                {item.landmark ? <Landmark color={colors.primary} size={18} /> : <MapPin color={colors.primary} size={18} />}
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="text-base font-semibold text-foreground">
                  {item.title}
                </Text>
                {item.subtitle ? (
                  <Text numberOfLines={1} className="text-xs text-muted-foreground">
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
              {item.distance != null ? <Text className="text-xs text-muted-foreground">{formatDistance(item.distance)}</Text> : null}
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

/** "Add location" for posts and stories: the chosen place, quick nearby picks, or search anything. */
export function PlaceField({ value, onChange }: { value: PlaceTag | null; onChange: (tag: PlaceTag | null) => void }) {
  const [open, setOpen] = useState(false);
  const { sorted } = useDestinationsByDistance();
  const quick = sorted.slice(0, 5);
  return (
    <View className="gap-2">
      {value ? (
        <View className="min-h-14 flex-row items-center gap-3 rounded-2xl bg-secondary px-4">
          <MapPin color={colors.primary} size={18} />
          <Pressable accessibilityRole="button" accessibilityHint={tx('Change location')} onPress={() => setOpen(true)} className="flex-1 py-3">
            <Text numberOfLines={1} className="text-base font-semibold text-primary">
              {value.name}
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={tx('Remove location')} hitSlop={8} onPress={() => onChange(null)}>
            <X color={colors.mutedForeground} size={18} />
          </Pressable>
        </View>
      ) : (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={() => setOpen(true)}
            className="min-h-14 flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 active:bg-muted"
          >
            <MapPin color={colors.primary} size={18} />
            <Text className="flex-1 text-base text-foreground">{tx('Add location')}</Text>
            <Search color={colors.mutedForeground} size={16} />
          </Pressable>
          {quick.length ? (
            <View className="flex-row flex-wrap gap-2">
              {quick.map((d) => (
                <Pressable
                  key={d.id}
                  accessibilityRole="button"
                  onPress={() => onChange({ destinationId: d.id, name: d.name, latitude: d.latitude, longitude: d.longitude })}
                  className="min-h-9 justify-center rounded-full border border-border bg-card px-3"
                >
                  <Text numberOfLines={1} className="max-w-48 text-sm text-foreground">
                    {d.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      )}
      <PlacePicker visible={open} onClose={() => setOpen(false)} onPick={onChange} />
    </View>
  );
}
