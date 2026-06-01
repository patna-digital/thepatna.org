/**
 * Core Calendar Utilities
 * Date manipulation, time slot generation, and availability calculation
 */

import {
  eventOccursInMonth,
  formatEventTimeLabel,
  getDateKeysForEvent,
  getDisplayRangeForEvent,
  getDisplayStartForEvent,
  normalizeAllDayDateRange,
  toLocalDateKey,
  createLocalDateFromKey,
  eventOccursInYear,
} from "./date-helpers.mjs";

export {
  createLocalDateFromKey,
  eventOccursInMonth,
  eventOccursInYear,
  formatEventTimeLabel,
  getDateKeysForEvent,
  getDisplayRangeForEvent,
  getDisplayStartForEvent,
  normalizeAllDayDateRange,
  toLocalDateKey,
};

/**
 * Get array of days for a month view
 * Includes padding days from previous/next months to fill the grid
 * @param {number} month - 0-indexed month (0-11)
 * @param {number} year - Full year
 * @returns {Array<{date: Date, isCurrentMonth: boolean, isToday: boolean}>}
 */
export function getCalendarDays(month, year) {
  const days = [];
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startPadding = firstDayOfMonth.getDay(); // 0 = Sunday
  const endPadding = 6 - lastDayOfMonth.getDay();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
    });
  }

  // Current month days
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const date = new Date(year, month, i);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
    });
  }

  // Next month padding
  for (let i = 1; i <= endPadding; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      isCurrentMonth: false,
      isToday: date.getTime() === today.getTime(),
    });
  }

  return days;
}

/**
 * Get the calendar horizon PATNA renders in the member workspace.
 * Uses UTC boundaries so date-only queries do not drift by server timezone.
 * @param {Date} referenceDate
 * @returns {{year: number, start: Date, end: Date, startDate: string, endDate: string}}
 */
export function getCalendarDisplayRange(referenceDate = new Date()) {
  const year = referenceDate.getUTCFullYear();
  const start = new Date(Date.UTC(year - 1, 0, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year + 1, 11, 31, 23, 59, 59, 999));

  return {
    year,
    start,
    end,
    startDate: `${year - 1}-01-01`,
    endDate: `${year + 1}-12-31`,
  };
}

/**
 * Get the week dates for a given date
 * @param {Date} date - Reference date
 * @param {number} startOfWeek - First day of week (0 = Sunday, 1 = Monday)
 * @returns {Array<Date>}
 */
export function getWeekDays(date, startOfWeek = 1) {
  const day = date.getDay();
  const diff = date.getDate() - day + startOfWeek;
  const weekStart = new Date(date.setDate(diff));
  
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
  }
  return days;
}

/**
 * Generate time slots between start and end times
 * @param {string} startTime - Start time in "HH:MM" format
 * @param {string} endTime - End time in "HH:MM" format
 * @param {number} durationMinutes - Duration of each slot
 * @param {number} bufferMinutes - Buffer between slots
 * @returns {Array<{start: string, end: string}>}
 */
export function generateTimeSlots(startTime, endTime, durationMinutes = 30, bufferMinutes = 0) {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMinute = startMinute;
  
  while (
    currentHour < endHour || 
    (currentHour === endHour && currentMinute < endMinute)
  ) {
    const slotStart = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    
    // Calculate end of slot
    let endSlotMinute = currentMinute + durationMinutes;
    let endSlotHour = currentHour + Math.floor(endSlotMinute / 60);
    endSlotMinute = endSlotMinute % 60;
    
    // Check if slot would exceed end time
    if (endSlotHour > endHour || (endSlotHour === endHour && endSlotMinute > endMinute)) {
      break;
    }
    
    const slotEnd = `${String(endSlotHour).padStart(2, '0')}:${String(endSlotMinute).padStart(2, '0')}`;
    
    slots.push({ start: slotStart, end: slotEnd });
    
    // Move to next slot (including buffer)
    const totalMinutes = durationMinutes + bufferMinutes;
    currentMinute += totalMinutes;
    currentHour += Math.floor(currentMinute / 60);
    currentMinute = currentMinute % 60;
  }
  
  return slots;
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type: 'short', 'long', 'time', 'datetime'
 * @returns {string}
 */
export function formatDate(date, format = 'short') {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return '';
  }

  switch (format) {
    case 'short':
      return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    
    case 'long':
      return new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    
    case 'time':
      return new Intl.DateTimeFormat('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(d);
    
    case 'datetime':
      return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(d);
    
    case 'monthYear':
      return new Intl.DateTimeFormat('en-GB', {
        month: 'long',
        year: 'numeric',
      }).format(d);
    
    case 'dayName':
      return new Intl.DateTimeFormat('en-GB', {
        weekday: 'short',
      }).format(d);
    
    default:
      return d.toISOString();
  }
}

/**
 * Check if two date ranges overlap
 * @param {Date} start1 - Start of first range
 * @param {Date} end1 - End of first range
 * @param {Date} start2 - Start of second range
 * @param {Date} end2 - End of second range
 * @returns {boolean}
 */
export function rangesOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

/**
 * Calculate available time slots from availability rules and booked slots
 * @param {Array} availabilityRules - Array of availability rule objects
 * @param {Array} bookedSlots - Array of already booked slot objects
 * @param {Date} date - Date to calculate for
 * @param {number} slotDuration - Duration of each slot in minutes
 * @param {number} bufferMinutes - Buffer between slots
 * @returns {Array<{start: string, end: string, isAvailable: boolean}>}
 */
export function calculateAvailableSlots(availabilityRules, bookedSlots, date, slotDuration = 30, bufferMinutes = 0) {
  const dayOfWeek = date.getDay();
  
  // Find applicable rules for this day
  const applicableRules = availabilityRules.filter(rule => {
    if (rule.rule_type === 'recurring' && rule.day_of_week === dayOfWeek) {
      // Check effective dates
      const ruleStart = rule.effective_from ? new Date(rule.effective_from) : null;
      const ruleEnd = rule.effective_until ? new Date(rule.effective_until) : null;
      
      if (ruleStart && date < ruleStart) return false;
      if (ruleEnd && date > ruleEnd) return false;
      
      return true;
    }
    return false;
  });

  if (applicableRules.length === 0) {
    return []; // No availability on this day
  }

  // Generate slots from rules
  const allSlots = [];
  for (const rule of applicableRules) {
    if (rule.is_blocked) continue;
    
    const slots = generateTimeSlots(
      rule.start_time,
      rule.end_time,
      slotDuration,
      bufferMinutes
    );
    
    allSlots.push(...slots.map(slot => ({
      ...slot,
      isAvailable: true,
      ruleId: rule.id,
    })));
  }

  // Mark booked slots as unavailable
  const bookedTimes = bookedSlots
    .filter(slot => !slot.is_available || slot.booking_id)
    .map(slot => ({
      start: slot.start_time,
      end: slot.end_time,
    }));

  return allSlots.map(slot => {
    const isBooked = bookedTimes.some(booked => 
      booked.start === slot.start && booked.end === slot.end
    );
    return {
      ...slot,
      isAvailable: !isBooked,
    };
  });
}

/**
 * Get month name
 * @param {number} month - 0-indexed month
 * @param {string} format - 'short' or 'long'
 * @returns {string}
 */
export function getMonthName(month, format = 'long') {
  const date = new Date(2024, month, 1);
  return new Intl.DateTimeFormat('en-GB', {
    month: format,
  }).format(date);
}

/**
 * Navigate to previous month
 * @param {number} month - Current month (0-11)
 * @param {number} year - Current year
 * @returns {{month: number, year: number}}
 */
export function getPreviousMonth(month, year) {
  if (month === 0) {
    return { month: 11, year: year - 1 };
  }
  return { month: month - 1, year };
}

/**
 * Navigate to next month
 * @param {number} month - Current month (0-11)
 * @param {number} year - Current year
 * @returns {{month: number, year: number}}
 */
export function getNextMonth(month, year) {
  if (month === 11) {
    return { month: 0, year: year + 1 };
  }
  return { month: month + 1, year };
}

/**
 * Check if a date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export function isPastDate(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

/**
 * Add minutes to a time string
 * @param {string} time - Time in "HH:MM" format
 * @param {number} minutes - Minutes to add
 * @returns {string} - New time in "HH:MM" format
 */
export function addMinutesToTime(time, minutes) {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

/**
 * Parse time string to minutes since midnight
 * @param {string} time - Time in "HH:MM" format
 * @returns {number}
 */
export function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 * @param {number} minutes - Minutes since midnight
 * @returns {string} - Time in "HH:MM" format
 */
export function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Get default availability rules (Mon-Fri, 9am-5pm)
 * @returns {Array}
 */
export function getDefaultAvailabilityRules() {
  return [
    { day_of_week: 1, start_time: '09:00', end_time: '17:00', rule_type: 'recurring' },
    { day_of_week: 2, start_time: '09:00', end_time: '17:00', rule_type: 'recurring' },
    { day_of_week: 3, start_time: '09:00', end_time: '17:00', rule_type: 'recurring' },
    { day_of_week: 4, start_time: '09:00', end_time: '17:00', rule_type: 'recurring' },
    { day_of_week: 5, start_time: '09:00', end_time: '17:00', rule_type: 'recurring' },
  ];
}

/**
 * Group events by date
 * @param {Array} events - Array of event objects with starts_at
 * @returns {Object} - Events grouped by date string (YYYY-MM-DD)
 */
export function groupEventsByDate(events) {
  return events.reduce((acc, event) => {
    for (const dateKey of getDateKeysForEvent(event)) {
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      acc[dateKey].push(event);
    }

    return acc;
  }, {});
}

/**
 * Sort events by start time
 * @param {Array} events - Array of event objects
 * @returns {Array} - Sorted events
 */
export function sortEventsByTime(events) {
  return [...events].sort((a, b) => {
    const aTime = new Date(a.starts_at).getTime();
    const bTime = new Date(b.starts_at).getTime();
    return aTime - bTime;
  });
}
