/**
 * Date & Time Formatting Utilities
 */

/**
 * Format an ISO Date string or Date object into a readable 12-hour time (e.g., "09:05 AM")
 * @param {string | Date} dateInput
 * @returns {string} Formatted time string or "--:--"
 */
export const formatTime = (dateInput) => {
  if (!dateInput) return "--:--";
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "--:--";
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "--:--";
  }
};

/**
 * Format an ISO Date string or Date object into a readable date string (e.g., "Tuesday, Aug 18, 2026")
 * @param {string | Date} [dateInput]
 * @returns {string} Formatted full date string
 */
export const formatFullDate = (dateInput = new Date()) => {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};
