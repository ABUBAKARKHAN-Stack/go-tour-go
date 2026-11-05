import { Camera, Map, type MapRef } from '@maplibre/maplibre-react-native';
import { File } from 'expo-file-system';
import { CircleCheck, CircleX, Cloud, HardDrive } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Card } from '@/components/form';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { errorMessage } from '@/lib/errors';
import { colors } from '@/lib/theme';
import {
  fetchMapManifest,
  localMapFile,
  MAP_RELEASE_BASE,
  OFFLINE_LAYER_IDS,
  offlineBaseStyle,
  pmtilesUrl,
  TEST_FILE,
} from '@/features/offline/pakistan-map';

type Mode = 'remote' | 'local';
type Verdict = { mode: Mode; ok: boolean; features: number } | null;

/** Central Karachi, inside the bounds of karachi-test.pmtiles. */
const KARACHI: [number, number] = [67.03, 24.86];

/**
 * Checks on a real phone that the native map engine can read PMTiles, both
 * streamed over HTTPS and from a downloaded file, before the full offline
 * Pakistan map depends on it. The verdict comes from counting features the
 * engine actually rendered from the file.
 */
export default function MapEngineTest() {
  const map = useRef<MapRef>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = (m: Mode, url: string) => {
    setVerdict(null);
    setError(null);
    setMode(m);
    setSource(url);
  };

  const runRemote = () => start('remote', pmtilesUrl(`${MAP_RELEASE_BASE}/${TEST_FILE}`));

  const runLocal = async () => {
    setError(null);
    try {
      const file = localMapFile(TEST_FILE);
      if (!file.exists) {
        setBusy('Checking the published map...');
        const manifest = await fetchMapManifest();
        const size = manifest.files[TEST_FILE]?.bytes ?? 0;
        setBusy(`Downloading test file (${(size / 1_048_576).toFixed(1)} MB)...`);
        await File.downloadFileAsync(`${MAP_RELEASE_BASE}/${TEST_FILE}`, file, { idempotent: true });
      }
      setBusy(null);
      start('local', pmtilesUrl(file.uri));
    } catch (e) {
      setBusy(null);
      setError(errorMessage(e));
    }
  };

  const check = async () => {
    if (!mode) return;
    try {
      const features = (await map.current?.queryRenderedFeatures({ layers: OFFLINE_LAYER_IDS })) ?? [];
      setVerdict({ mode, ok: features.length > 0, features: features.length });
    } catch (e) {
      setVerdict({ mode, ok: false, features: 0 });
      setError(errorMessage(e));
    }
  };

  const deleteLocal = () => {
    const file = localMapFile(TEST_FILE);
    if (file.exists) file.delete();
    setVerdict(null);
    setMode(null);
    setSource(null);
  };

  return (
    <Screen back title="Offline map engine test" subtitle="Developer check for the Pakistan map file">
      <Text className="text-sm text-muted-foreground">
        Draws central Karachi from the test map file built by the &quot;Build offline map of Pakistan&quot; workflow. If streets and water
        appear and the check passes, the full offline map will work on this phone.
      </Text>

      <View className="h-72 overflow-hidden rounded-3xl border border-border bg-muted">
        {source ? (
          <Map
            key={source}
            ref={map}
            style={{ flex: 1 }}
            mapStyle={offlineBaseStyle(source) as never}
            logo={false}
            attributionPosition={{ bottom: 8, left: 8 }}
            onDidFinishRenderingMapFully={check}
            onDidFailLoadingMap={() => setVerdict({ mode: mode ?? 'remote', ok: false, features: 0 })}
          >
            <Camera initialViewState={{ center: KARACHI, zoom: 13 }} />
          </Map>
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-center text-sm text-faint">Choose a test below.</Text>
          </View>
        )}
      </View>

      {busy ? <Text className="text-sm text-muted-foreground">{busy}</Text> : null}
      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}

      {verdict ? (
        <Card className={`flex-row items-center gap-3 ${verdict.ok ? 'bg-success-soft' : 'bg-destructive-soft'}`}>
          {verdict.ok ? <CircleCheck color={colors.success} size={24} /> : <CircleX color={colors.destructive} size={24} />}
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">
              {verdict.ok ? 'Passed' : 'Nothing drawn'} · {verdict.mode === 'local' ? 'downloaded file' : 'streamed file'}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {verdict.ok
                ? `The map engine drew ${verdict.features} features from the PMTiles file.`
                : 'The engine loaded the style but drew no features. Tap Check again after the map settles, then report the result.'}
            </Text>
          </View>
        </Card>
      ) : null}

      <View className="gap-3">
        <AppButton label="Test streamed file (needs internet)" icon={Cloud} variant="secondary" onPress={runRemote} />
        <AppButton label="Test downloaded file (works offline)" icon={HardDrive} onPress={runLocal} loading={busy != null} />
        {mode ? <AppButton label="Check again" variant="ghost" onPress={check} /> : null}
        <AppButton label="Delete test file" variant="ghost" size="sm" onPress={deleteLocal} />
      </View>
    </Screen>
  );
}
