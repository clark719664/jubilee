// Pins the process time zone before any test file creates a Date, so DST fixtures are
// deterministic. `npm test` runs the suite twice: America/New_York, then Pacific/Kiritimati
// (UTC+14, no DST) via JUBILEE_TZ.
process.env.TZ = process.env.JUBILEE_TZ ?? 'America/New_York';
