import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { AlertSeverity, RoadAlert } from '@/lib/types';

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
  closure: 'Road closure',
  rain: 'Heavy rain',
  flood: 'Flooding',
  fog: 'Fog',
  smog: 'Smog',
  snow: 'Snow',
  landslide: 'Landslide',
  traffic: 'Traffic',
  other: 'Travel alert',
};
