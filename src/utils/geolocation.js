export class GeoError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'GeoError';
    this.code = code;
  }
}

function mapGeolocationError(err) {
  const code = err?.code;
  if (code === 1) return new GeoError('Location permission denied. Enable location permission for this site and try again.', 'PERMISSION_DENIED');
  if (code === 2) return new GeoError('Location unavailable. Turn on GPS / Location and try again.', 'POSITION_UNAVAILABLE');
  if (code === 3) return new GeoError('Location request timed out. Try again in an open area with better signal.', 'TIMEOUT');
  return new GeoError('Unable to get location. Please try again.', 'UNKNOWN');
}

/**
 * Mobile browsers require a secure context for geolocation.
 * (HTTPS, or localhost). If you open the site over plain HTTP on a phone,
 * geolocation will fail even if the code is correct.
 */
export async function getGeoPosition(options = {}) {
  if (typeof window === 'undefined') throw new GeoError('Location is not available.', 'NO_WINDOW');
  if (!navigator?.geolocation) throw new GeoError('Geolocation is not supported in this browser.', 'NOT_SUPPORTED');
  if (!window.isSecureContext) {
    throw new GeoError('Location requires HTTPS on mobile. Open the site over HTTPS (or localhost) and try again.', 'INSECURE_CONTEXT');
  }

  const {
    enableHighAccuracy = true,
    timeoutMs = 12000,
    maximumAge = 10_000,
  } = options;

  return await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new GeoError('Location request timed out. Try again.', 'TIMEOUT')), timeoutMs + 1000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeoutId);
        resolve(pos);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(mapGeolocationError(err));
      },
      { enableHighAccuracy, timeout: timeoutMs, maximumAge }
    );
  });
}

