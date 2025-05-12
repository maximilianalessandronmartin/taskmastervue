/**
 * Utility functions for formatting dates, times, and other display values
 */

/**
 * Format a date string to a localized date string
 * @param dateString The date string to format
 * @returns Formatted date string or 'No due date' if no date provided
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'No due date';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

/**
 * Format a date string to a localized time string
 * @param dateString The date string to format
 * @returns Formatted time string or empty string if no date provided
 */
export const formatTime = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format milliseconds to MM:SS display
 * @param millis Milliseconds to format
 * @returns Formatted time string in MM:SS format
 */
export const formatTimeDisplay = (millis: number): string => {
  if (millis <= 0) return '00:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Get the color for a task urgency level
 * @param urgency The urgency level ('HIGH', 'MEDIUM', 'LOW')
 * @returns The corresponding color name for the UI
 */
export const getUrgencyColor = (urgency: string): string => {
  switch (urgency) {
    case 'HIGH':
      return 'error';
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
      return 'success';
    default:
      return 'info';
  }
};