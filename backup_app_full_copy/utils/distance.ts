// utils/distance.ts
// Haversine formula for calculating distance between two coordinates

type Coordinate = {
  lat: number;
  lon: number;
};

export function calculateDistance(coord1: Coordinate | null | undefined, coord2: Coordinate | null | undefined): number {
  if (!coord1 || !coord2) return Infinity;
  if (!coord1.lat || !coord1.lon || !coord2.lat || !coord2.lon) return Infinity;

  const R = 6371; // Earth's radius in km

  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLon = (coord2.lon - coord1.lon) * Math.PI / 180;

  const lat1 = coord1.lat * Math.PI / 180;
  const lat2 = coord2.lat * Math.PI / 180;

  const a =
    0.5 - Math.cos(dLat) / 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      (1 - Math.cos(dLon)) /
      2;

  return R * 2 * Math.asin(Math.sqrt(a));
}
