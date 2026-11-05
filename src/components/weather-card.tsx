import { CloudSun, Droplets, Eye, Sun, Thermometer, Wind } from 'lucide-react-native';
import { ActivityIndicator, Text, View } from 'react-native';

import { describeWeather, useWeather } from '@/features/weather/api';
import { colors } from '@/lib/theme';

function Stat({ icon: Icon, label, value }: { icon: typeof Sun; label: string; value: string }) {
  return (
    <View className="min-w-[30%] flex-1 flex-row items-center gap-2 rounded-2xl bg-secondary px-3 py-2">
      <Icon color={colors.accent} size={16} />
      <View>
        <Text className="text-[10px] uppercase text-muted-foreground">{label}</Text>
        <Text className="text-sm font-semibold text-foreground">{value}</Text>
      </View>
    </View>
  );
}

/** Weather for a point; degrades to a short message instead of breaking the screen. */
export function WeatherCard({ point, title = 'Weather' }: { point: { latitude: number; longitude: number } | null; title?: string }) {
  const { data, isLoading, isError } = useWeather(point);

  return (
    <View className="gap-3 rounded-3xl border border-border/25 bg-card p-4">
      <View className="flex-row items-center gap-2">
        <CloudSun color={colors.accent} size={18} />
        <Text className="flex-1 text-base font-semibold text-foreground">{title}</Text>
        {data ? <Text className="text-2xl font-bold text-foreground">{Math.round(data.temperature)}°C</Text> : null}
      </View>
      {!point ? (
        <Text className="text-sm text-muted-foreground">Turn on location to see local weather.</Text>
      ) : isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : isError || !data ? (
        <Text className="text-sm text-muted-foreground">Weather is unavailable right now.</Text>
      ) : (
        <>
          <Text className="text-sm text-muted-foreground">{describeWeather(data.code)}</Text>
          <View className="flex-row flex-wrap gap-2">
            <Stat icon={Droplets} label="Humidity" value={`${Math.round(data.humidity)}%`} />
            <Stat icon={Wind} label="Wind" value={`${Math.round(data.wind)} km/h`} />
            <Stat icon={Eye} label="Visibility" value={data.visibility != null ? `${(data.visibility / 1000).toFixed(1)} km` : '—'} />
            <Stat icon={Sun} label="UV index" value={data.uv != null ? data.uv.toFixed(1) : '—'} />
            <Stat icon={Thermometer} label="Feels" value={data.isDay ? 'Daytime' : 'Night'} />
          </View>
        </>
      )}
    </View>
  );
}
