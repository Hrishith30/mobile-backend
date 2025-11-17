// Haversine formula
// Calculates the distance between two points in miles
export function getDistanceInMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of the Earth in miles
  const rlat1 = lat1 * (Math.PI/180); // Convert degrees to radians
  const rlat2 = lat2 * (Math.PI/180); // Convert degrees to radians
  const difflat = rlat2 - rlat1; // Radian difference (lat)
  const difflon = (lon2 - lon1) * (Math.PI/180); // Radian difference (lon)

  const d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat/2)*Math.sin(difflat/2)+Math.cos(rlat1)*Math.cos(rlat2)*Math.sin(difflon/2)*Math.sin(difflon/2)));
  return d;
}