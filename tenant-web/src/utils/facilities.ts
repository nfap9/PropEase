import type { FacilityPreset } from '@/types';
import { ALL_FACILITY_PRESETS } from '@/constants/facilities';

export function getFacilityPreset(code: string): FacilityPreset | undefined {
  return ALL_FACILITY_PRESETS.find((p) => p.code === code);
}

export function getFacilityLabel(code: string): string {
  return getFacilityPreset(code)?.label ?? code;
}
