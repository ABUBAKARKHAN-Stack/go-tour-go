import { EMERGENCY_NUMBERS, type EmergencyService } from '@/constants/app.constants';
import { tx } from '@/lib/i18n';

const LABEL: Record<EmergencyService, string> = {
  police: tx('Police'),
  rescue: tx('Rescue'),
  edhi: tx('Edhi ambulance'),
  motorway: tx('Motorway police'),
};

/** Emergency numbers with translated labels (numbers: src/constants/app.constants.ts). */
export const emergencyNumbers = EMERGENCY_NUMBERS.map((n) => ({ ...n, label: LABEL[n.service] }));

/** The ones shown on the SOS screen. */
export const sosEmergencyNumbers = emergencyNumbers.filter((n) => n.sos);
