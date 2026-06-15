// Korean public holidays for 2024, 2025, and 2026
// Format: { "YYYY-MM-DD": { name: "Holiday Name", isAlternative: boolean } }
const HOLIDAYS_DATA = {
  // 2024
  "2024-01-01": { name: "신정" },
  "2024-02-09": { name: "설날 연휴" },
  "2024-02-10": { name: "설날" },
  "2024-02-11": { name: "설날 연휴" },
  "2024-02-12": { name: "대체공휴일", isAlternative: true },
  "2024-03-01": { name: "삼일절" },
  "2024-04-10": { name: "제22대 국회의원 선거" },
  "2024-05-05": { name: "어린이날" },
  "2024-05-06": { name: "대체공휴일", isAlternative: true },
  "2024-05-15": { name: "부처님오신날" },
  "2024-06-06": { name: "현충일" },
  "2024-08-15": { name: "광복절" },
  "2024-09-16": { name: "추석 연휴" },
  "2024-09-17": { name: "추석" },
  "2024-09-18": { name: "추석 연휴" },
  "2024-10-03": { name: "개천절" },
  "2024-10-09": { name: "한글날" },
  "2024-12-25": { name: "기독탄신일" },

  // 2025
  "2025-01-01": { name: "신정" },
  "2025-01-28": { name: "설날 연휴" },
  "2025-01-29": { name: "설날" },
  "2025-01-30": { name: "설날 연휴" },
  "2025-03-01": { name: "삼일절" },
  "2025-03-03": { name: "대체공휴일(삼일절)", isAlternative: true },
  "2025-05-05": { name: "어린이날 / 부처님오신날" },
  "2025-05-06": { name: "대체공휴일", isAlternative: true },
  "2025-06-06": { name: "현충일" },
  "2025-08-15": { name: "광복절" },
  "2025-10-03": { name: "개천절" },
  "2025-10-05": { name: "추석 연휴" },
  "2025-10-06": { name: "추석" },
  "2025-10-07": { name: "추석 연휴" },
  "2025-10-08": { name: "대체공휴일(추석)", isAlternative: true },
  "2025-10-09": { name: "한글날" },
  "2025-12-25": { name: "기독탄신일" },

  // 2026
  "2026-01-01": { name: "신정" },
  "2026-02-16": { name: "설날 연휴" },
  "2026-02-17": { name: "설날" },
  "2026-02-18": { name: "설날 연휴" },
  "2026-03-01": { name: "삼일절" },
  "2026-03-02": { name: "대체공휴일(삼일절)", isAlternative: true },
  "2026-05-05": { name: "어린이날" },
  "2026-05-24": { name: "부처님오신날" },
  "2026-05-25": { name: "대체공휴일", isAlternative: true },
  "2026-06-06": { name: "현충일" },
  "2026-08-15": { name: "광복절" },
  "2026-09-24": { name: "추석 연휴" },
  "2026-09-25": { name: "추석" },
  "2026-09-26": { name: "추석 연휴" },
  "2026-09-28": { name: "대체공휴일(추석)", isAlternative: true },
  "2026-10-03": { name: "개천절" },
  "2026-10-09": { name: "한글날" },
  "2026-12-25": { name: "기독탄신일" }
};

/**
 * Returns holiday details if the given solar date is a holiday.
 * @param {string} dateStr "YYYY-MM-DD"
 */
export function getHoliday(dateStr) {
  return HOLIDAYS_DATA[dateStr] || null;
}

/**
 * Checks if a date is a holiday or a Sunday (standard weekend/non-working day logic).
 */
export function isOffDay(dateStr) {
  if (HOLIDAYS_DATA[dateStr]) return true;
  const date = new Date(dateStr + "T00:00:00");
  return date.getDay() === 0; // Sunday
}
