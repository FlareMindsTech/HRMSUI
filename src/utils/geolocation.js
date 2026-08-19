/**
 * Geolocation Utility
 *
 * Requests the browser's current latitude and longitude on-demand.
 * Location is only requested when an employee explicitly triggers Punch In.
 */

export const getCurrentCoordinates = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ latitude, longitude });
      },
      (error) => {
        let message = "Unable to retrieve your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location permission is required to punch in. Please allow location access in your browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable. Please check your device location / GPS settings.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out. Please try again.";
            break;
          default:
            message = error.message || "An unknown geolocation error occurred.";
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};
