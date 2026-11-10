import {
  Building2,
  Camera,
  Fuel,
  Hospital,
  Hotel,
  Landmark,
  Mountain,
  Palette,
  Pill,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trees,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';

import type { TileTone } from '@/components/brand';
import type { DestinationCategory, ServiceCategory } from '@/lib/types';
import { tx } from '@/lib/i18n';

export const DESTINATION_CATEGORIES: Record<
  DestinationCategory,
  {
    label: string;
    icon: LucideIcon;
    /** Map marker colour. */
    color: string;
    /** Soft brand tint for tiles, badges and the photo placeholder. */
    tone: TileTone;
    gradient: [string, string];
  }
> = {
  historical: { label: tx('Historical'), icon: Landmark, color: '#B5583A', tone: 'sand', gradient: ['#EFE0C9', '#E4CFAE'] },
  religious: { label: tx('Religious'), icon: Building2, color: '#0F4C4A', tone: 'ice', gradient: ['#E8F2F9', '#D5E7F3'] },
  attraction: { label: tx('Attraction'), icon: Star, color: '#C8643B', tone: 'lemon', gradient: ['#FDF3DC', '#F7E6BC'] },
  viewpoint: { label: tx('Viewpoint'), icon: Camera, color: '#2F6FA3', tone: 'ice', gradient: ['#E8F2F9', '#D5E7F3'] },
  cultural: { label: tx('Cultural'), icon: Palette, color: '#A8552E', tone: 'peach', gradient: ['#FCEBDD', '#F6D9C2'] },
  museum: { label: tx('Museum'), icon: Landmark, color: '#8A6A1E', tone: 'sand', gradient: ['#EFE0C9', '#E4CFAE'] },
  food: { label: tx('Food'), icon: Utensils, color: '#B4382F', tone: 'peach', gradient: ['#FCEBDD', '#F6D9C2'] },
  shopping: { label: tx('Shopping'), icon: ShoppingBag, color: '#7A4E8C', tone: 'lemon', gradient: ['#FDF3DC', '#F7E6BC'] },
  park: { label: tx('Park'), icon: Trees, color: '#2F7D5B', tone: 'mint', gradient: ['#E4F4EE', '#CFEADF'] },
  nature: { label: tx('Nature'), icon: Mountain, color: '#2F7D5B', tone: 'mint', gradient: ['#E4F4EE', '#CFEADF'] },
};

export const SERVICE_CATEGORIES: Record<ServiceCategory, { label: string; icon: LucideIcon; color: string }> = {
  restaurant: { label: tx('Restaurants'), icon: Utensils, color: '#B4382F' },
  hotel: { label: tx('Hotels'), icon: Hotel, color: '#7A4E8C' },
  hospital: { label: tx('Hospitals'), icon: Hospital, color: '#B4382F' },
  police: { label: tx('Police'), icon: ShieldCheck, color: '#2F6FA3' },
  fuel: { label: tx('Fuel'), icon: Fuel, color: '#C98A1B' },
  atm: { label: tx('ATMs'), icon: Wallet, color: '#2F7D5B' },
  pharmacy: { label: tx('Pharmacies'), icon: Pill, color: '#0F4C4A' },
  shopping: { label: tx('Shopping'), icon: ShoppingBag, color: '#4ADE80' },
  attraction: { label: tx('Attractions'), icon: Star, color: '#EDB158' },
};

export const CATEGORY_ORDER: DestinationCategory[] = [
  'historical',
  'religious',
  'nature',
  'viewpoint',
  'food',
  'shopping',
  'museum',
  'cultural',
  'park',
  'attraction',
];
