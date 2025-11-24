export const RADIUS_OPTIONS_KM = [5, 15, 20, 50, 100] as const;
export type RadiusOption = typeof RADIUS_OPTIONS_KM[number];
export const DEFAULT_RADIUS_KM: RadiusOption = 15;