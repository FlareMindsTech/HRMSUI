/**
 * Platform Detection Utility
 * Determines if the current environment is running within the Tauri Desktop OS shell.
 */
export const isTauriDesktop = () => {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.__TAURI__ ||
      window.__TAURI_INTERNALS__ ||
      window.__TAURI_METADATA__ ||
      (navigator.userAgent && navigator.userAgent.includes("Tauri"))
  );
};
