// Lunar Calendar start dates (New Moon dates) in Solar format for 2024, 2025, and 2026.
// Format: { solarDate: "YYYY-MM-DD", lunarMonth: M, isLeap: boolean }
const LUNAR_MONTHS = [
  // 2023 end to cover early 2024
  { solar: "2023-12-13", month: 11, leap: false },
  { solar: "2024-01-11", month: 12, leap: false },
  // 2024
  { solar: "2024-02-10", month: 1, leap: false }, // 설날 (Lunar Jan 1)
  { solar: "2024-03-10", month: 2, leap: false },
  { solar: "2024-04-09", month: 3, leap: false },
  { solar: "2024-05-08", month: 4, leap: false },
  { solar: "2024-06-06", month: 5, leap: false },
  { solar: "2024-07-06", month: 6, leap: false },
  { solar: "2024-08-04", month: 7, leap: false },
  { solar: "2024-09-03", month: 8, leap: false }, // 추석 (Lunar Aug 15 = Sep 17)
  { solar: "2024-10-03", month: 9, leap: false },
  { solar: "2024-11-01", month: 10, leap: false },
  { solar: "2024-12-01", month: 11, leap: false },
  { solar: "2024-12-31", month: 12, leap: false },
  // 2025
  { solar: "2025-01-29", month: 1, leap: false }, // 설날
  { solar: "2025-02-28", month: 2, leap: false },
  { solar: "2025-03-29", month: 3, leap: false },
  { solar: "2025-04-28", month: 4, leap: false },
  { solar: "2025-05-27", month: 5, leap: false },
  { solar: "2025-06-25", month: 6, leap: false },
  { solar: "2025-07-25", month: 6, leap: true },  // 윤달 6월 (Leap Month 6)
  { solar: "2025-08-23", month: 7, leap: false },
  { solar: "2025-09-22", month: 8, leap: false },
  { solar: "2025-10-21", month: 9, leap: false },
  { solar: "2025-11-20", month: 10, leap: false },
  { solar: "2025-12-20", month: 11, leap: false },
  // 2026
  { solar: "2026-01-18", month: 12, leap: false },
  { solar: "2026-02-17", month: 1, leap: false }, // 설날
  { solar: "2026-03-18", month: 2, leap: false },
  { solar: "2026-04-17", month: 3, leap: false },
  { solar: "2026-05-16", month: 4, leap: false },
  { solar: "2026-06-15", month: 5, leap: false },
  { solar: "2026-07-14", month: 6, leap: false },
  { solar: "2026-08-12", month: 7, leap: false },
  { solar: "2026-09-11", month: 8, leap: false },
  { solar: "2026-10-10", month: 9, leap: false },
  { solar: "2026-11-09", month: 10, leap: false },
  { solar: "2026-12-09", month: 11, leap: false },
  { solar: "2027-01-08", month: 12, leap: false }
];

/**
 * Converts a solar date to a lunar date string representation (e.g. "음력 4.15").
 * Supported range: 2024-01-01 to 2026-12-31
 */
export function getLunarDate(solarDateStr) {
  const targetTime = new Date(solarDateStr + "T00:00:00").getTime();
  
  // Find the closest preceding lunar month start
  let selectedMonth = null;
  for (let i = LUNAR_MONTHS.length - 1; i >= 0; i--) {
    const monthStartTime = new Date(LUNAR_MONTHS[i].solar + "T00:00:00").getTime();
    if (targetTime >= monthStartTime) {
      selectedMonth = LUNAR_MONTHS[i];
      break;
    }
  }

  if (!selectedMonth) {
    return ""; // Out of range
  }

  const startSolarDate = new Date(selectedMonth.solar + "T00:00:00");
  const targetDate = new Date(solarDateStr + "T00:00:00");
  
  // Calculate day difference (1-indexed)
  const diffTime = Math.abs(targetDate - startSolarDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return `음력 ${selectedMonth.leap ? "윤" : ""}${selectedMonth.month}.${diffDays}`;
}

/**
 * Converts a lunar month/day to solar date for a given solar year.
 * e.g., Lunar April 15 in solar year 2024 -> 2024-05-22
 */
export function lunarToSolar(year, month, day, isLeap = false) {
  const match = LUNAR_MONTHS.find(m => {
    const mYear = new Date(m.solar).getFullYear();
    return mYear === year && m.month === month && m.leap === isLeap;
  });

  if (!match) return null;

  const baseDate = new Date(match.solar + "T00:00:00");
  baseDate.setDate(baseDate.getDate() + (day - 1));
  
  const y = baseDate.getFullYear();
  const m = String(baseDate.getMonth() + 1).padStart(2, '0');
  const d = String(baseDate.getDate()).padStart(2, '0');
  
  return `${y}-${m}-${d}`;
}
