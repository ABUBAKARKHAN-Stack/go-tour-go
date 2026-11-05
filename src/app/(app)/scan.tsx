import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, ExternalLink, MapPin, QrCode, RotateCcw, ScanEye } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, IconButton } from '@/components/app-button';
import { EmptyState } from '@/components/states';
import { useDestinations } from '@/features/destinations/api';
import { parseDestinationQr } from '@/features/destinations/qr';
import { colors } from '@/lib/theme';

/**
 * Smart Scan: QR codes for GoTourGo destinations (shown on each destination
 * page), web links and plain text. Image/landmark recognition is in Lens.
 */
export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const destinations = useDestinations();
  const [scanned, setScanned] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const lock = useRef(false);

  // Pause the camera when the screen is not focused (battery).
  useFocusEffect(
    useCallback(() => {
      setActive(true);
      return () => setActive(false);
    }, []),
  );

  const onScan = (r: BarcodeScanningResult) => {
    if (lock.current) return;
    lock.current = true;
    setScanned(r.data);
  };
  const reset = () => {
    setScanned(null);
    lock.current = false;
  };

  const slug = scanned ? parseDestinationQr(scanned) : null;
  const destination = slug ? destinations.data?.find((d) => d.slug === slug || d.id === slug) : undefined;
  const isUrl = scanned ? /^https?:\/\//i.test(scanned) : false;

  if (!permission) return <View className="flex-1 bg-background" />;

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center bg-background px-4" style={{ paddingTop: insets.top }}>
        <EmptyState
          icon={QrCode}
          title="Camera access needed"
          message="Smart Scan uses the camera to read QR codes on signs, tickets and GoTourGo destination cards."
          actionLabel={permission.canAskAgain ? 'Allow camera' : 'Open settings'}
          onAction={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
        />
        <AppButton label="Back" variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {active ? (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : onScan}
        />
      ) : null}
      <View className="absolute left-0 right-0 top-0 flex-row items-center gap-3 px-4" style={{ paddingTop: insets.top + 8 }}>
        <IconButton icon={ArrowLeft} label="Go back" onPress={() => router.back()} />
        <Text className="flex-1 text-lg font-bold text-white">Smart Scan</Text>
        <IconButton icon={ScanEye} label="Use Visual Lens" onPress={() => router.replace('/lens')} />
      </View>
      {!scanned ? (
        <View className="pointer-events-none absolute inset-0 items-center justify-center">
          <View className="h-64 w-64 rounded-3xl border-4 border-accent" />
          <Text className="mt-4 text-sm text-white">Point at a QR code</Text>
        </View>
      ) : (
        <View className="absolute bottom-0 left-0 right-0 gap-3 rounded-t-3xl bg-card p-5" style={{ paddingBottom: insets.bottom + 16 }}>
          {destination ? (
            <>
              <Text className="text-xs font-bold uppercase text-accent">GoTourGo destination</Text>
              <Text className="text-xl font-bold text-foreground">{destination.name}</Text>
              <Text className="text-sm text-muted-foreground">{destination.short_description}</Text>
              <AppButton
                label="Open destination"
                icon={MapPin}
                variant="accent"
                onPress={() => router.replace({ pathname: '/destination/[id]', params: { id: destination.id } })}
              />
            </>
          ) : isUrl ? (
            <>
              <Text className="text-xs font-bold uppercase text-accent">Link</Text>
              <Text numberOfLines={3} className="text-sm text-foreground">
                {scanned}
              </Text>
              <Text className="text-xs text-muted-foreground">Only open links you trust.</Text>
              <AppButton label="Open link" icon={ExternalLink} variant="accent" onPress={() => Linking.openURL(scanned)} />
            </>
          ) : (
            <>
              <Text className="text-xs font-bold uppercase text-accent">Scanned text</Text>
              <Text selectable className="text-sm text-foreground">
                {scanned}
              </Text>
            </>
          )}
          <AppButton label="Scan again" icon={RotateCcw} variant="secondary" onPress={reset} />
          {!destination ? (
            <Text className="text-center text-xs text-muted-foreground" style={{ color: colors.mutedForeground }}>
              Not a GoTourGo code? Try Visual Lens to recognise landmarks and signs.
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}
