import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera, ImagePlus, Languages, MapPin, ScanEye, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Card, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { InlineError, LoadingState } from '@/components/states';
import { analyzeImage, type LensResult } from '@/features/ai/api';
import { useDestinations } from '@/features/destinations/api';
import { usePreferences } from '@/lib/preferences';
import { colors } from '@/lib/theme';
import { compressImage } from '@/lib/upload';

/**
 * Visual Lens (FYP demo): photograph a landmark, sign or menu and get travel
 * context from Gemini. Known landmarks link to their GoTourGo page.
 */
export default function LensScreen() {
  const [prefs] = usePreferences();
  const destinations = useDestinations();
  const [uri, setUri] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LensResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = async (source: 'camera' | 'library') => {
    setError(null);
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Camera permission needed', 'Allow camera access to take a photo for Visual Lens.');
        return;
      }
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, allowsEditing: false };
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (res.canceled || !res.assets[0]) return;
    setUri(res.assets[0].uri);
    setResult(null);
  };

  const analyze = async () => {
    if (!uri) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const small = await compressImage(uri, 1024, true);
      if (!small.base64) throw new Error('Could not read the image.');
      setResult(await analyzeImage(small.base64, { question: question.trim() || undefined, locale: prefs.locale }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI service unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const matched = result?.matched_slug ? destinations.data?.find((d) => d.slug === result.matched_slug) : undefined;

  return (
    <Screen back title="Visual Lens" subtitle="Identify landmarks, signs and text" keyboard>
      <Card className="items-center gap-3">
        {uri ? (
          <Image source={{ uri }} style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 18 }} contentFit="cover" />
        ) : (
          <View className="w-full items-center justify-center gap-2 rounded-2xl bg-secondary py-12">
            <ScanEye color={colors.accent} size={42} strokeWidth={1.5} />
            <Text className="text-center text-sm text-muted-foreground">Take or choose a photo of a landmark, sign or menu.</Text>
          </View>
        )}
        <View className="w-full flex-row gap-2">
          <AppButton label="Camera" icon={Camera} variant="secondary" onPress={() => pick('camera')} className="flex-1" />
          <AppButton label="Gallery" icon={ImagePlus} variant="secondary" onPress={() => pick('library')} className="flex-1" />
        </View>
      </Card>

      {uri ? (
        <>
          <TextField label="Question (optional)" value={question} onChangeText={setQuestion} placeholder="e.g. What does this sign say?" maxLength={300} />
          <AppButton label="Analyze photo" icon={Sparkles} variant="accent" onPress={analyze} loading={loading} />
        </>
      ) : null}

      {loading ? <LoadingState label="Looking closely..." /> : null}
      {error ? <InlineError message={error} /> : null}

      {result ? (
        <Card className="gap-3">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 text-lg font-bold text-foreground">{result.title}</Text>
            <Text className="text-xs uppercase text-muted-foreground">{result.confidence} confidence</Text>
          </View>
          <Text className="text-sm leading-5 text-foreground">{result.summary}</Text>
          {result.detected_text ? (
            <View className="gap-1 rounded-2xl bg-secondary p-3">
              <Text className="text-xs font-semibold uppercase text-muted-foreground">Detected text</Text>
              <Text className="text-sm text-foreground">{result.detected_text}</Text>
              {result.translated_text ? (
                <View className="flex-row gap-2 pt-1">
                  <Languages color={colors.accent} size={14} />
                  <Text className="flex-1 text-sm text-accent">{result.translated_text}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          {result.tips?.length ? (
            <View className="gap-1">
              {result.tips.map((t) => (
                <Text key={t} className="text-sm text-muted-foreground">
                  • {t}
                </Text>
              ))}
            </View>
          ) : null}
          {matched ? (
            <AppButton
              label={`Open ${matched.name}`}
              icon={MapPin}
              variant="accent"
              onPress={() => router.push({ pathname: '/destination/[id]', params: { id: matched.id } })}
            />
          ) : null}
          <Text className="text-[11px] text-muted-foreground">AI results can be wrong. This is a demonstration feature.</Text>
        </Card>
      ) : null}
    </Screen>
  );
}
