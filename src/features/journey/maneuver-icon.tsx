import { ArrowUp, ArrowUpLeft, ArrowUpRight, CornerUpLeft, CornerUpRight, Flag, MapPin, RotateCw, Undo2 } from 'lucide-react-native';

import type { RouteStep } from '@/features/routing/osrm';

/** The arrow for a turn (or the flag for arriving), as on road signs. */
export function ManeuverIcon({ step, color = '#FFFFFF', size = 40 }: { step: RouteStep | undefined; color?: string; size?: number }) {
  const props = { color, size, strokeWidth: 2.4 };
  if (!step) return <ArrowUp {...props} />;
  if (step.type === 'arrive') return <Flag {...props} />;
  if (step.type === 'depart') return <MapPin {...props} />;
  if (step.type === 'roundabout' || step.type === 'rotary' || step.type === 'roundabout turn') return <RotateCw {...props} />;
  switch (step.modifier) {
    case 'uturn':
      return <Undo2 {...props} />;
    case 'right':
    case 'sharp right':
      return <CornerUpRight {...props} />;
    case 'left':
    case 'sharp left':
      return <CornerUpLeft {...props} />;
    case 'slight right':
      return <ArrowUpRight {...props} />;
    case 'slight left':
      return <ArrowUpLeft {...props} />;
    default:
      return <ArrowUp {...props} />;
  }
}
