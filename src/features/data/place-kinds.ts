import { tx } from '@/lib/i18n';

/** Labels for the kinds of places in the offline places table. */
export const KIND_LABEL: Record<string, string> = {
  city: tx('City'),
  town: tx('Town'),
  village: tx('Village'),
  suburb: tx('Area'),
  borough: tx('Area'),
  quarter: tx('Neighbourhood'),
  neighbourhood: tx('Neighbourhood'),
  locality: tx('Locality'),
  hamlet: tx('Village'),
  university: tx('University'),
  college: tx('College'),
  hospital: tx('Hospital'),
  airport: tx('Airport'),
  railway_station: tx('Railway station'),
  bus_station: tx('Bus station'),
  mall: tx('Shopping mall'),
  stadium: tx('Stadium'),
};
