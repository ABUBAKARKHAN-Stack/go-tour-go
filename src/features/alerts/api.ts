import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { AlertSeverity, RoadAlert } from '@/lib/types';
import { tx } from '@/lib/i18n';

const severityRank: Record<AlertSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function useRoadAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('road_alerts')
        .select('*')
        .order('starts_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data as RoadAlert[]).sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
    },
    staleTime: 1000 * 60 * 10,
  });
}

export const ALERT_LABELS: Record<RoadAlert['alert_type'], string> = {
  closure: tx('Road closure'),
  rain: tx('Heavy rain'),
  flood: tx('Flooding'),
  fog: tx('Fog'),
  smog: tx('Smog'),
  snow: tx('Snow'),
  landslide: tx('Landslide'),
  traffic: tx('Traffic'),
  other: tx('Travel alert'),
};
