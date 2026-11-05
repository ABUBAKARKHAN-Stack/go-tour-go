import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { tx } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import type { AlertSeverity, HazardType, RoadAlert } from '@/lib/types';

const severityRank: Record<AlertSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

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
  accident: tx('Accident'),
  road_works: tx('Road works'),
  blockade: tx('Road blocked'),
};

/** Hazard types travellers can report, with a sensible area for each. */
export const HAZARD_TYPES: { type: HazardType; radius: number }[] = [
  { type: 'flood', radius: 400 },
  { type: 'accident', radius: 150 },
  { type: 'road_works', radius: 200 },
  { type: 'closure', radius: 200 },
  { type: 'blockade', radius: 300 },
  { type: 'landslide', radius: 500 },
  { type: 'fog', radius: 2000 },
  { type: 'snow', radius: 1500 },
  { type: 'other', radius: 300 },
];

type HazardRow = {
  id: string;
  user_id: string;
  hazard_type: HazardType;
  severity: AlertSeverity;
  description: string | null;
  latitude: number;
  longitude: number;
  radius_m: number;
  confirmations: number;
  dismissals: number;
  created_at: string;
  expires_at: string;
};

export function hazardToAlert(h: HazardRow): RoadAlert {
  return {
    id: h.id,
    title: ALERT_LABELS[h.hazard_type],
    description: h.description || tx('Reported by a traveller.'),
    alert_type: h.hazard_type,
    severity: h.severity,
    region: '',
    city: null,
    latitude: h.latitude,
    longitude: h.longitude,
    radius_m: h.radius_m,
    starts_at: h.created_at,
    ends_at: h.expires_at,
    source: 'traveller',
    reporter_id: h.user_id,
    confirmations: h.confirmations,
    dismissals: h.dismissals,
  };
}

/** Official road alerts and active traveller hazard reports, most severe first. */
export function useRoadAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const [official, reports] = await Promise.all([
        supabase.from('road_alerts').select('*').order('starts_at', { ascending: false }).limit(100),
        supabase.from('hazard_reports').select('*').order('created_at', { ascending: false }).limit(300),
      ]);
      if (official.error) throw official.error;
      const all = [...((official.data ?? []) as RoadAlert[]), ...((reports.data ?? []) as HazardRow[]).map(hazardToAlert)];
      return all.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
    },
    // Traveller reports change quickly; refresh often while the app is open.
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 3,
  });
}

export type NewHazard = {
  hazard_type: HazardType;
  severity: 'low' | 'medium' | 'high';
  description?: string;
  latitude: number;
  longitude: number;
};

export function useReportHazard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (h: NewHazard) => {
      const radius = HAZARD_TYPES.find((t) => t.type === h.hazard_type)?.radius ?? 300;
      const { error } = await supabase.from('hazard_reports').insert({
        hazard_type: h.hazard_type,
        severity: h.severity,
        description: h.description?.trim() || null,
        latitude: h.latitude,
        longitude: h.longitude,
        radius_m: radius,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}

/** "Still there" or "gone" for a traveller report (one vote per person, can change). */
export function useVoteHazard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reportId, stillThere }: { reportId: string; stillThere: boolean }) => {
      const { error } = await supabase.from('hazard_votes').insert({ report_id: reportId, still_there: stillThere });
      if (error?.code === '23505') {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user.id;
        const { error: updateError } = await supabase
          .from('hazard_votes')
          .update({ still_there: stillThere })
          .eq('report_id', reportId)
          .eq('user_id', userId ?? '');
        if (updateError) throw updateError;
        return;
      }
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}
