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

/**
 * Fetches holidays from Korea Astronomy and Space Science Institute via Public Data Portal.
 * Supported range: 2024 to 2026.
 * Falls back to local holiday data if API Key is not set or fetch fails (e.g., CORS, network).
 */
export async function fetchHolidays(year, month) {
  const apiKey = import.meta.env.VITE_HOLIDAY_API_KEY;
  const formattedMonth = String(month).padStart(2, '0');
  
  // If the key is the default placeholder, return local fallback immediately
  if (!apiKey || apiKey === "YOUR_PUBLIC_DATA_PORTAL_API_KEY_HERE") {
    console.warn("VITE_HOLIDAY_API_KEY is not configured in .env. Using local holiday database.");
    return getLocalHolidaysForMonth(year, month);
  }

  // URL for getHoliDeInfo (Public holidays info)
  const url = `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getHoliDeInfo?serviceKey=${encodeURIComponent(apiKey)}&solYear=${year}&solMonth=${formattedMonth}&_type=json&numOfRows=50`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const holidays = {};
    const items = data?.response?.body?.items?.item;

    if (items) {
      // If there is only one holiday, data.response.body.items.item is an object.
      // If there are multiple, it is an array.
      const itemsList = Array.isArray(items) ? items : [items];
      itemsList.forEach(item => {
        if (item.isHoliday === 'Y') {
          const locdateStr = String(item.locdate); // e.g. 20240505
          const y = locdateStr.substring(0, 4);
          const m = locdateStr.substring(4, 6);
          const d = locdateStr.substring(6, 8);
          const formattedDate = `${y}-${m}-${d}`;
          holidays[formattedDate] = { name: item.dateName };
        }
      });
      return holidays;
    }
    return {};
  } catch (error) {
    console.error(`Failed to fetch holidays from Public Data Portal API for ${year}-${formattedMonth}:`, error);
    console.warn("Using local holiday database fallback.");
    return getLocalHolidaysForMonth(year, month);
  }
}

/**
 * Filter local HOLIDAYS_DATA by Year and Month.
 */
function getLocalHolidaysForMonth(year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const holidays = {};
  Object.keys(HOLIDAYS_DATA).forEach(dateStr => {
    if (dateStr.startsWith(prefix)) {
      holidays[dateStr] = HOLIDAYS_DATA[dateStr];
    }
  });
  return holidays;
}

