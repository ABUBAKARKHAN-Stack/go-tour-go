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
  historical: { label: 'Historical', icon: Landmark, color: '#EDB158', gradient: ['#5B3A1A', '#2C1852'] },
  religious: { label: 'Religious', icon: Building2, color: '#A78BFA', gradient: ['#3B2470', '#160B2E'] },
  attraction: { label: 'Attraction', icon: Star, color: '#F472B6', gradient: ['#5B1E4B', '#2C1852'] },
  viewpoint: { label: 'Viewpoint', icon: Camera, color: '#38BDF8', gradient: ['#0F3B57', '#2C1852'] },
  cultural: { label: 'Cultural', icon: Palette, color: '#FB923C', gradient: ['#5A2A12', '#2C1852'] },
  museum: { label: 'Museum', icon: Landmark, color: '#FBBF24', gradient: ['#4A3A10', '#2C1852'] },
  food: { label: 'Food', icon: Utensils, color: '#F87171', gradient: ['#5A1A1A', '#2C1852'] },
  shopping: { label: 'Shopping', icon: ShoppingBag, color: '#34D399', gradient: ['#0F4A3A', '#2C1852'] },
  park: { label: 'Park', icon: Trees, color: '#4ADE80', gradient: ['#14472A', '#2C1852'] },
  nature: { label: 'Nature', icon: Mountain, color: '#2DD4BF', gradient: ['#0F4447', '#2C1852'] },
};

export const SERVICE_CATEGORIES: Record<ServiceCategory, { label: string; icon: LucideIcon; color: string }> = {
  restaurant: { label: 'Restaurants', icon: Utensils, color: '#F87171' },
  hotel: { label: 'Hotels', icon: Hotel, color: '#A78BFA' },
  hospital: { label: 'Hospitals', icon: Hospital, color: '#F43F5E' },
  police: { label: 'Police', icon: ShieldCheck, color: '#38BDF8' },
  fuel: { label: 'Fuel', icon: Fuel, color: '#F59E0B' },
  atm: { label: 'ATMs', icon: Wallet, color: '#34D399' },
  pharmacy: { label: 'Pharmacies', icon: Pill, color: '#2DD4BF' },
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
