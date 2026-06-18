import KoreanLunarCalendar from 'korean-lunar-calendar';

/**
 * Converts a solar date to a lunar date string representation (e.g. "음력 4.15").
 * Uses korean-lunar-calendar library to support wide range of dates.
 */
export function getLunarDate(solarDateStr) {
  try {
    const parts = solarDateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    const calendar = new KoreanLunarCalendar();
    calendar.setSolarDate(year, month, day);
    const res = calendar.getLunarCalendar();
    if (res && res.month && res.day) {
      return `음력 ${res.intercalation ? "윤" : ""}${res.month}.${res.day}`;
    }
  } catch (e) {
    console.error("Lunar conversion error:", e);
  }
  return "";
}

/**
 * Converts a lunar month/day to solar date for a given solar year.
 * e.g., Lunar April 15 in solar year 2024 -> 2024-05-22
 */
export function lunarToSolar(year, month, day, isLeap = false) {
  try {
    const calendar = new KoreanLunarCalendar();
    calendar.setLunarDate(year, month, day, isLeap);
    const res = calendar.getSolarCalendar();
    if (res && res.year && res.month && res.day) {
      const y = res.year;
      const m = String(res.month).padStart(2, '0');
      const d = String(res.day).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  } catch (e) {
    console.error("Solar conversion error:", e);
  }
  return null;
}
