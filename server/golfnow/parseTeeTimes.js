export function parseTeeTimes(facilities) {
  console.log('🔎 Sample facility:', JSON.stringify(facilities[0], null, 2)); // TEMP: peek at the shape

  return facilities.flatMap(facility => {
    const courseName = facility?.Facility?.Name;
    const bookingUrl = facility?.Facility?.BookingUrl;

    const teeTimes = facility?.TeeTimes || [];

    return teeTimes.map(t => ({
      course: courseName,
      time: t.DisplayTime,
      price: t.Rate?.DisplayAmount,
      holes: t.HoleCount,
      bookingUrl,
    }));
  });
}