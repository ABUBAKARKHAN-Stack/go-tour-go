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

import type { DestinationCategory, ServiceCategory } from '@/lib/types';

export const DESTINATION_CATEGORIES: Record<
  DestinationCategory,
  { label: string; icon: LucideIcon; color: string; gradient: [string, string] }
> = {
  historical: { label: 'Historical', icon: Landmark, color: '#B5583A', gradient: ['#F6E3D9', '#EBCDBB'] },
  religious: { label: 'Religious', icon: Building2, color: '#0F4C4A', gradient: ['#DCEBE8', '#C6DDD8'] },
  attraction: { label: 'Attraction', icon: Star, color: '#C8643B', gradient: ['#F6E3D9', '#F0D5C4'] },
  viewpoint: { label: 'Viewpoint', icon: Camera, color: '#2F6FA3', gradient: ['#DDE8F1', '#C9DAE8'] },
  cultural: { label: 'Cultural', icon: Palette, color: '#A8552E', gradient: ['#F5E6D8', '#EBD3BE'] },
  museum: { label: 'Museum', icon: Landmark, color: '#8A6A1E', gradient: ['#F4EBD6', '#E9DBBA'] },
  food: { label: 'Food', icon: Utensils, color: '#B4382F', gradient: ['#F8E2DF', '#F0CCC6'] },
  shopping: { label: 'Shopping', icon: ShoppingBag, color: '#7A4E8C', gradient: ['#EEE3F1', '#E0CFE6'] },
  park: { label: 'Park', icon: Trees, color: '#2F7D5B', gradient: ['#DDEEE5', '#C8E2D4'] },
  nature: { label: 'Nature', icon: Mountain, color: '#2F7D5B', gradient: ['#DCEBE8', '#C3DCD6'] },
};

export const SERVICE_CATEGORIES: Record<ServiceCategory, { label: string; icon: LucideIcon; color: string }> = {
  restaurant: { label: 'Restaurants', icon: Utensils, color: '#B4382F' },
  hotel: { label: 'Hotels', icon: Hotel, color: '#7A4E8C' },
  hospital: { label: 'Hospitals', icon: Hospital, color: '#B4382F' },
  police: { label: 'Police', icon: ShieldCheck, color: '#2F6FA3' },
  fuel: { label: 'Fuel', icon: Fuel, color: '#C98A1B' },
  atm: { label: 'ATMs', icon: Wallet, color: '#2F7D5B' },
  pharmacy: { label: 'Pharmacies', icon: Pill, color: '#0F4C4A' },
  shopping: { label: 'Shopping', icon: ShoppingBag, color: '#4ADE80' },
  attraction: { label: 'Attractions', icon: Star, color: '#EDB158' },
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
