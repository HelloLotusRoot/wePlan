import React, { useState, useEffect } from 'react';
import SidebarLeft from './components/SidebarLeft';
import CalendarGrid from './components/CalendarGrid';
import SidebarRight from './components/SidebarRight';
import SettingsPanels from './components/SettingsPanels';
import StatsDashboard from './components/StatsDashboard';
import RecordsBoard from './components/RecordsBoard';
import ManagerScheduler from './components/ManagerScheduler';
import FriendsBoard from './components/FriendsBoard';
import Login from './components/Login';

import { 
  Plus, 
  Trash2, 
  X, 
  User, 
  Lock, 
  Globe, 
  Layers, 
  BellRing,
  Bell,
  HelpCircle,
  Clock,
  MapPin,
  Check,
  Settings,
  Edit3,
  CalendarDays,
  Cake
} from 'lucide-react';
import { getLunarDate, lunarToSolar } from './utils/lunarCalendar';
import { fetchHolidays, getHoliday } from './utils/holidays';
import { api } from './utils/api';

// Mock initial data matching user's image
const INITIAL_SHIFTS = [
  { id: 'day', label: '근무', start: '09:00', end: '18:00', color: '#16a34a' }
];

const INITIAL_EVENTS = [
  // Shifts
  { id: 'shift-1', type: 'shift', shiftType: 'day', date: '2024-05-01' },
  { id: 'shift-2', type: 'shift', shiftType: 'day', date: '2024-05-03' },
  { id: 'shift-3', type: 'shift', shiftType: 'day', date: '2024-05-06' },
  { id: 'shift-4', type: 'shift', shiftType: 'day', date: '2024-05-08' },
  { id: 'shift-5', type: 'shift', shiftType: 'day', date: '2024-05-10' },
  { id: 'shift-6', type: 'shift', shiftType: 'day', date: '2024-05-15' },
  { id: 'shift-7', type: 'shift', shiftType: 'day', date: '2024-05-17' },
  { id: 'shift-8', type: 'shift', shiftType: 'day', date: '2024-05-20' },
  { id: 'shift-9', type: 'shift', shiftType: 'day', date: '2024-05-27' },
  { id: 'shift-10', type: 'shift', shiftType: 'day', date: '2024-05-30' },

  // Appointments
  { id: 'apt-1', type: 'appointment', title: '친구 생일', date: '2024-05-03', time: '18:00', place: '패밀리 레스토랑' },
  { id: 'apt-2', type: 'appointment', title: '영화 약속', date: '2024-05-09', time: '19:30', place: 'CGV 강남' },
  { 
    id: 'apt-3', 
    type: 'appointment', 
    title: '친구랑 점심', 
    date: '2024-05-15', 
    time: '12:30', 
    place: '강남역 맛집',
    participants: [
      { name: '나', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=80&auto=format&fit=crop' },
      { name: '민지', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=80&auto=format&fit=crop' },
      { name: '재윤', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=80&auto=format&fit=crop' }
    ]
  },
  { id: 'apt-4', type: 'appointment', title: '헬스', date: '2024-05-15', time: '18:00', place: '스포애니' },
  { id: 'apt-5', type: 'appointment', title: '병원 교육', date: '2024-05-13', time: '14:00', place: '세미나실' },
  { id: 'apt-6', type: 'appointment', title: '카페 약속', date: '2024-05-18', time: '15:00', place: '스타벅스' },

  // Multi-day trips
  { id: 'trip-1', type: 'trip', title: '여행 (2박 3일)', startDate: '2024-05-23', endDate: '2024-05-25', place: '제주도', color: 'blue' },

  // Birthdays (solar/lunar)
  { id: 'bday-1', type: 'birthday', name: '나의 생일', date: '2024-05-22', isLunar: true, alarmOnDay: true, alarmWeekBefore: true },
  { id: 'bday-2', type: 'birthday', name: '부모님 생신', date: '2024-05-28', isLunar: true, alarmOnDay: true, alarmWeekBefore: false }
];

const INITIAL_SHARED_USERS = [
  { id: 'user-1', name: '민지', relation: '연인', privilege: '보기 가능', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=80&auto=format&fit=crop', isSharing: true },
  { id: 'user-2', name: '가족', relation: '가족', privilege: '편집 가능', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=80&auto=format&fit=crop', isSharing: true },
  { id: 'user-3', name: '현지', relation: '친구', privilege: '보기 가능', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=80&auto=format&fit=crop', isSharing: true }
];

const getBirthdayDateForYear = (event, targetYear) => {
  if (!event?.date) return null;
  const registeredYear = Number(event.date.slice(0, 4));
  if (event.repeatYearly === false && registeredYear !== targetYear) return null;

  if (!event.isLunar) return `${targetYear}-${event.date.slice(5)}`;

  const lunarDate = getLunarDate(event.date) || getLunarDate(`2024-${event.date.slice(5)}`);
  if (!lunarDate) return `${targetYear}-${event.date.slice(5)}`;

  const clean = lunarDate.replace('음력 ', '');
  const isLeap = clean.startsWith('윤');
  const [month, day] = clean.replace('윤', '').split('.').map(Number);
  return lunarToSolar(targetYear, month, day, isLeap) || `${targetYear}-${event.date.slice(5)}`;
};

const getDefaultAlarmDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(`${dateString}T18:00:00`);
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const shiftMockDatesToCurrentMonth = (eventList) => {
  if (!Array.isArray(eventList)) return [];
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const prefix = `${y}-${m}-`;

  return eventList.map(evt => {
    const copy = { ...evt };
    if (copy.date && copy.date.startsWith('2024-05-')) {
      copy.date = prefix + copy.date.slice(8);
    }
    if (copy.startDate && copy.startDate.startsWith('2024-05-')) {
      copy.startDate = prefix + copy.startDate.slice(8);
    }
    if (copy.endDate && copy.endDate.startsWith('2024-05-')) {
      copy.endDate = prefix + copy.endDate.slice(8);
    }
    return copy;
  });
};

export default function App() {
  const [relationGroups, setRelationGroups] = useState(() => {
    const saved = localStorage.getItem('weplan_relation_groups');
    return saved ? JSON.parse(saved) : ['친구', '연인', '가족'];
  });

  useEffect(() => {
    localStorage.setItem('weplan_relation_groups', JSON.stringify(relationGroups));
  }, [relationGroups]);



  // Load state from localStorage or use defaults
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('weplan_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [userName, setUserName] = useState(() => {
    try {
      const savedUser = localStorage.getItem('weplan_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u && u.nickname) return u.nickname;
      }
    } catch (e) {}
    return localStorage.getItem('weplan_username') || '김소현';
  });

  const [userJob, setUserJob] = useState(() => {
    return localStorage.getItem('weplan_userjob') || '간호사';
  });

  useEffect(() => {
    if (user && user.nickname) {
      setUserName(user.nickname);
      localStorage.setItem('weplan_username', user.nickname);
    }
  }, [user]);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handledCodeRef = React.useRef(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code && handledCodeRef.current !== code) {
      handledCodeRef.current = code;
      // Clean URL search params immediately so code is not reused
      window.history.replaceState({}, document.title, window.location.pathname);

      const handleLoginRedirect = async () => {
        setIsLoggingIn(true);
        try {
          const redirectUri = window.location.origin + '/';
          const userInfo = await api.loginWithKakao(code, redirectUri);
          // Use kakao id as primary key - nickname may be empty if not agreed in consent
          if (userInfo && userInfo.id) {
            const loginUser = {
              ...userInfo,
              nickname: userInfo.nickname || userInfo.id,
            };
            localStorage.setItem('weplan_user', JSON.stringify(loginUser));
            setUser(loginUser);
            // Sync user name with setting
            if (loginUser.nickname && loginUser.nickname !== loginUser.id) {
              setUserName(loginUser.nickname);
              localStorage.setItem('weplan_username', loginUser.nickname);
            }
          } else if (userInfo) {
            // userInfo returned but no id - log for debugging
            console.error('Kakao login returned unexpected data:', userInfo);
            alert('카카오 로그인에 실패하였습니다. (사용자 정보 없음)');
          }
        } catch (error) {
          console.error("Kakao Login redirect exchange failed", error);
          let detailMsg = error?.data?.detail || error?.message || '';
          if (typeof detailMsg === 'object') {
            detailMsg = JSON.stringify(detailMsg);
          }
          if (detailMsg) {
            alert(`카카오 로그인 실패:\n${detailMsg}`);
          } else {
            alert('카카오 로그인에 실패하였습니다. 다시 시도해 주세요.');
          }
        } finally {
          setIsLoggingIn(false);
        }
      };
      handleLoginRedirect();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('weplan_user');
    setUser(null);
  };

  const [shifts, setShifts] = useState(() => {
    const saved = localStorage.getItem('weplan_shifts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // Fallback below
      }
    }
    return [
      { id: 'day', label: '근무', start: '09:00', end: '18:00', color: '#16a34a' }
    ];
  });

  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('weplan_events');
    if (saved && saved !== 'undefined') {
      try {
        return shiftMockDatesToCurrentMonth(JSON.parse(saved));
      } catch (e) {}
    }
    return shiftMockDatesToCurrentMonth(INITIAL_EVENTS);
  });

  const [sharedUsers, setSharedUsers] = useState(() => {
    const saved = localStorage.getItem('weplan_shared_users');
    let users = INITIAL_SHARED_USERS;
    if (saved && saved !== 'undefined') {
      try {
        users = JSON.parse(saved);
      } catch (e) {}
    }
    // Clean emojis from legacy database/localStorage relations
    return users.map(u => ({
      ...u,
      relation: u.relation ? u.relation.replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, '').trim() : ''
    }));
  });

  const [isPrivateMode, setIsPrivateMode] = useState(() => {
    const saved = localStorage.getItem('weplan_private_mode');
    if (saved && saved !== 'undefined') {
      try {
        const parsed = JSON.parse(saved);
        return parsed === true || parsed === 'true';
      } catch (e) {}
    }
    return false;
  });

  const [alarmSettings, setAlarmSettings] = useState(() => {
    const saved = localStorage.getItem('weplan_alarms');
    if (saved && saved !== 'undefined') {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      enableEventAlarm: true,
      eventAlarmTime: '전날 18:00',
      enableRepeatAlarm: true,
      excludeHolidays: true
    };
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('weplan_settings');
    if (saved && saved !== 'undefined') {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      showHolidayCalendar: true,
      showKoreanHolidays: true,
      showAlternativeHolidays: true,
      showLunarAnniversaries: true,
      showMyAnniversaries: true
    };
  });

  // UI Control states
  const [currentTab, setCurrentTab] = useState('calendar');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [settingsModalTab, setSettingsModalTab] = useState('schedule'); // 'schedule' | 'alarm'
  const [rightSidebarWidth, setRightSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('weplan_right_sidebar_width');
    const parsed = saved ? parseInt(saved, 10) : 340;
    return (parsed >= 250 && parsed <= 600) ? parsed : 340;
  });
  const [showRightSidebar, setShowRightSidebar] = useState(() => {
    const saved = localStorage.getItem('weplan_show_right_sidebar');
    return saved !== 'false';
  });
  const [showLeftSidebar, setShowLeftSidebar] = useState(() => {
    const saved = localStorage.getItem('weplan_show_left_sidebar');
    return saved !== 'false';
  });
  const [isDragging, setIsDragging] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => new Date()); // Default to today's date
  const [viewMode, setViewMode] = useState('month'); // month, week, day, list
  
  // Custom display settings: Work representation & Appointment representation
  const [workViewMode, setWorkViewMode] = useState('badge'); // 'full' (하루전체네모칸) or 'badge' (네모박스/배지)
  const [aptViewMode, setAptViewMode] = useState('dot'); // 'dot' (원/점) or 'box' (네모박스)

  // primaryShiftMap: { [dateStr]: shiftId } — 날짜별 대표 근무 ID
  const [primaryShiftMap, setPrimaryShiftMap] = useState(() => {
    const saved = localStorage.getItem('weplan_primary_shift_map');
    if (saved) { try { return JSON.parse(saved); } catch (e) {} }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('weplan_primary_shift_map', JSON.stringify(primaryShiftMap));
  }, [primaryShiftMap]);

  // memos: 일기 및 일지 데이터 목록
  const [memos, setMemos] = useState(() => {
    const saved = localStorage.getItem('weplan_memos');
    if (saved && saved !== 'undefined') {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // todos: 할 일 목록 데이터
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('weplan_todos');
    if (saved && saved !== 'undefined') {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null); // 상세보기 대상 이벤트

  const [formType, setFormType] = useState('shift'); // shift, appointment, birthday
  const [formShiftType, setFormShiftType] = useState('day');
  const [formShiftRange, setFormShiftRange] = useState('single'); // single, custom
  const [formShiftDays, setFormShiftDays] = useState({ 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 0: false }); // 1: Mon, ..., 0: Sun
  const [formShiftScope, setFormShiftScope] = useState('month'); // week, month
  const [formShiftOvertime, setFormShiftOvertime] = useState(0); // overtime in hours
  const [formShiftHasOvertime, setFormShiftHasOvertime] = useState(false); // toggle for overtime
  const [formExcludeHolidays, setFormExcludeHolidays] = useState(false); // exclude holidays during batch shift registration
  const [formAptTitle, setFormAptTitle] = useState('');




  const [formAptTime, setFormAptTime] = useState('12:00');
  const [formAptIsAllDay, setFormAptIsAllDay] = useState(false);
  const [formAptPlace, setFormAptPlace] = useState('');
  const [formAptIsPrivate, setFormAptIsPrivate] = useState(false);
  const [formEventAlarmEnabled, setFormEventAlarmEnabled] = useState(true);
  const [formEventAlarmTime, setFormEventAlarmTime] = useState('전날 18:00');
  const [formEventAlarmDateTime, setFormEventAlarmDateTime] = useState('');
  const [formBdayName, setFormBdayName] = useState('');
  const [formBdayIsLunar, setFormBdayIsLunar] = useState(false);
  const [formBdayAlarmOnDay, setFormBdayAlarmOnDay] = useState(true);
  const [formBdayAlarmWeekBefore, setFormBdayAlarmWeekBefore] = useState(false);
  const [formBdayRepeatYearly, setFormBdayRepeatYearly] = useState(true);
  const [formIsRange, setFormIsRange] = useState(false);
  const [formTripStart, setFormTripStart] = useState('');
  const [formTripEnd, setFormTripEnd] = useState('');
  const [formTripColor, setFormTripColor] = useState('blue');
  const [formAptDisplayMode, setFormAptDisplayMode] = useState('dot'); // 'dot' or 'box'
  const [calendarPerspective, setCalendarPerspective] = useState('me'); // 'me' | sharedUser.id
  const [formShareScope, setFormShareScope] = useState('public'); // 'public' | 'private' | 'custom'
  const [formSharePermission, setFormSharePermission] = useState('view'); // 'view' | 'edit'
  const [formSharedWithIds, setFormSharedWithIds] = useState([]); // array of sharedUser IDs
  const [formInlineShareName, setFormInlineShareName] = useState('');
  const [formInlineShareRelation, setFormInlineShareRelation] = useState(() => relationGroups[0] || '친구');

  useEffect(() => {
    if (relationGroups && relationGroups.length > 0 && !relationGroups.includes(formInlineShareRelation)) {
      setFormInlineShareRelation(relationGroups[0]);
    }
  }, [relationGroups]);

  // Mobile Simulator state
  const [mobileScreen, setMobileScreen] = useState('calendar'); // calendar, detail

  // Korean holidays state loaded dynamically from API or local fallback
  const [holidaysMap, setHolidaysMap] = useState({});

  useEffect(() => {
    let isMounted = true;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const loadHolidays = async () => {
      try {
        const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

        const pYear = prevDate.getFullYear();
        const pMonth = prevDate.getMonth() + 1;
        const nYear = nextDate.getFullYear();
        const nMonth = nextDate.getMonth() + 1;

        const [prevHols, currHols, nextHols] = await Promise.all([
          fetchHolidays(pYear, pMonth),
          fetchHolidays(year, month),
          fetchHolidays(nYear, nMonth)
        ]);

        if (isMounted) {
          const mergedHols = {
            ...prevHols,
            ...currHols,
            ...nextHols
          };
          
          setHolidaysMap(prev => ({
            ...prev,
            ...mergedHols
          }));


        }
      } catch (error) {
        console.error("Failed to load holidays:", error);
      }
    };

    loadHolidays();
    return () => {
      isMounted = false;
    };
  }, [currentDate]);

  // Load initial data from Spring Boot REST API
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const loadBackendData = async () => {
      // 1. Get settings
      const settingsData = await api.getSettings({
        userName: localStorage.getItem('weplan_username') || '김소현',
        userJob: localStorage.getItem('weplan_userjob') || '간호사',
        isPrivateMode: localStorage.getItem('weplan_private_mode') === 'true',
        enableEventAlarm: true,
        eventAlarmTime: '전날 18:00',
        enableRepeatAlarm: true,
        excludeHolidays: true,
        showHolidayCalendar: true,
        showKoreanHolidays: true,
        showAlternativeHolidays: true,
        showLunarAnniversaries: true,
        showMyAnniversaries: true,
        workViewMode: 'badge',
        aptViewMode: 'dot'
      });

      setUserName(settingsData.userName);
      setUserJob(settingsData.userJob);
      setIsPrivateMode(settingsData.isPrivateMode);
      setAlarmSettings({
        enableEventAlarm: settingsData.enableEventAlarm,
        eventAlarmTime: settingsData.eventAlarmTime,
        enableRepeatAlarm: settingsData.enableRepeatAlarm,
        excludeHolidays: settingsData.excludeHolidays
      });
      setSettings({
        showHolidayCalendar: settingsData.showHolidayCalendar !== false,
        showKoreanHolidays: settingsData.showKoreanHolidays,
        showAlternativeHolidays: settingsData.showAlternativeHolidays,
        showLunarAnniversaries: settingsData.showLunarAnniversaries,
        showMyAnniversaries: settingsData.showMyAnniversaries
      });
      setWorkViewMode(settingsData.workViewMode || 'badge');
      setAptViewMode(settingsData.aptViewMode || 'dot');

      // 2. Get shifts
      const localShiftsFallback = (() => {
        const saved = localStorage.getItem('weplan_shifts');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          } catch (e) {}
        }
        return [{ id: 'day', label: '근무', start: '09:00', end: '18:00', color: '#16a34a' }];
      })();
      const shiftsData = await api.getShifts(localShiftsFallback);
      setShifts(shiftsData);

      // 3. Get events
      const localEventsFallback = (() => {
        const saved = localStorage.getItem('weplan_events');
        return saved ? shiftMockDatesToCurrentMonth(JSON.parse(saved)) : shiftMockDatesToCurrentMonth(INITIAL_EVENTS);
      })();
      const eventsData = await api.getEvents(localEventsFallback);
      const mappedEvents = shiftMockDatesToCurrentMonth(eventsData).map(evt => {
        if (evt.participantsJson) {
          try {
            evt.participants = JSON.parse(evt.participantsJson);
          } catch (e) {}
        }
        return evt;
      });
      setEvents(mappedEvents);

      // 4. Get shared users
      const localSharedUsersFallback = (() => {
        const saved = localStorage.getItem('weplan_shared_users');
        return saved ? JSON.parse(saved) : INITIAL_SHARED_USERS;
      })();
      const sharedUsersData = await api.getSharedUsers(localSharedUsersFallback);
      setSharedUsers(sharedUsersData);

      // 5. Get memos
      const localMemosFallback = (() => {
        const saved = localStorage.getItem('weplan_memos');
        return saved ? JSON.parse(saved) : [];
      })();
      const memosData = await api.getMemos(localMemosFallback);
      setMemos(memosData || []);

      // 6. Get todos
      const localTodosFallback = (() => {
        const saved = localStorage.getItem('weplan_todos');
        return saved ? JSON.parse(saved) : [];
      })();
      const todosData = await api.getTodos(localTodosFallback);
      setTodos(todosData || []);
      
      setDataLoaded(true);
    };

    loadBackendData();
  }, []);

  // Save states to localStorage & Spring Boot backend
  useEffect(() => {
    localStorage.setItem('weplan_username', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('weplan_userjob', userJob);
  }, [userJob]);

  useEffect(() => {
    localStorage.setItem('weplan_private_mode', String(isPrivateMode));
  }, [isPrivateMode]);

  useEffect(() => {
    localStorage.setItem('weplan_alarms', JSON.stringify(alarmSettings));
  }, [alarmSettings]);

  useEffect(() => {
    localStorage.setItem('weplan_settings', JSON.stringify(settings));
  }, [settings]);

  // Sync settings when loaded
  useEffect(() => {
    if (!dataLoaded) return;
    api.saveSettings({
      userName,
      userJob,
      isPrivateMode,
      enableEventAlarm: alarmSettings.enableEventAlarm,
      eventAlarmTime: alarmSettings.eventAlarmTime,
      enableRepeatAlarm: alarmSettings.enableRepeatAlarm,
      excludeHolidays: alarmSettings.excludeHolidays,
      showHolidayCalendar: settings.showHolidayCalendar,
      showKoreanHolidays: settings.showKoreanHolidays,
      showAlternativeHolidays: settings.showAlternativeHolidays,
      showLunarAnniversaries: settings.showLunarAnniversaries,
      showMyAnniversaries: settings.showMyAnniversaries,
      workViewMode,
      aptViewMode
    });
  }, [dataLoaded, userName, userJob, isPrivateMode, alarmSettings, settings, workViewMode, aptViewMode]);

  useEffect(() => {
    localStorage.setItem('weplan_shifts', JSON.stringify(shifts));
    if (!dataLoaded) return;
    api.saveShifts(shifts);
  }, [dataLoaded, shifts]);

  useEffect(() => {
    localStorage.setItem('weplan_events', JSON.stringify(events));
    if (!dataLoaded) return;
    const mapped = events.map(evt => {
      const copy = { ...evt };
      if (copy.participants) {
        copy.participantsJson = JSON.stringify(copy.participants);
        delete copy.participants;
      }
      return copy;
    });
    api.saveEvents(mapped);
  }, [dataLoaded, events]);

  useEffect(() => {
    if (!dataLoaded || !user?.id) return;
    api.getEvents([]).then(userEvents => setEvents(shiftMockDatesToCurrentMonth(userEvents || [])));
  }, [dataLoaded, user?.id]);

  useEffect(() => {
    localStorage.setItem('weplan_shared_users', JSON.stringify(sharedUsers));
    if (!dataLoaded) return;
    api.saveSharedUsers(sharedUsers);
  }, [dataLoaded, sharedUsers]);

  useEffect(() => {
    localStorage.setItem('weplan_memos', JSON.stringify(memos));
    if (!dataLoaded) return;
    api.saveMemos(memos);
  }, [dataLoaded, memos]);

  useEffect(() => {
    localStorage.setItem('weplan_todos', JSON.stringify(todos));
    if (!dataLoaded) return;
    api.saveTodos(todos);
  }, [dataLoaded, todos]);

  // Open Settings Modal when sidebar tab changes to settings categories
  useEffect(() => {
    if (currentTab === 'calendar') {
      setCalendarPerspective('me');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentTab === 'alarm') {
      setCurrentTab('calendar');
      setSettingsModalTab('alarm');
      setShowSettingsModal(true);
    }
  }, [currentTab]);

  useEffect(() => {
    localStorage.setItem('weplan_right_sidebar_width', rightSidebarWidth);
  }, [rightSidebarWidth]);

  useEffect(() => {
    localStorage.setItem('weplan_show_right_sidebar', showRightSidebar);
  }, [showRightSidebar]);

  useEffect(() => {
    localStorage.setItem('weplan_show_left_sidebar', showLeftSidebar);
  }, [showLeftSidebar]);


  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    document.body.classList.add('dragging-active');

    const handleMouseMove = (e) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 250 && newWidth <= 600) {
        setRightSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.classList.remove('dragging-active');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('dragging-active');
    };
  }, [isDragging]);

  // Date movement (Drag & Drop)
  const handleMoveEvent = (eventId, targetDateStr) => {
    setEvents(prev => prev.map(evt => {
      if (evt.id === eventId) {
        if (evt.startDate && evt.endDate) {
          // Calculate span and move trip dates
          const start = new Date(evt.startDate);
          const end = new Date(evt.endDate);
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          const newStart = new Date(targetDateStr);
          const newEnd = new Date(targetDateStr);
          newEnd.setDate(newStart.getDate() + diffDays);
          
          const formatStr = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          };

          return { ...evt, startDate: formatStr(newStart), endDate: formatStr(newEnd) };
        }
        return { ...evt, date: targetDateStr };
      }
      return evt;
    }));
  };

  const handleAddInlineShareTarget = () => {
    if (!formInlineShareName.trim()) return;
    const newId = Date.now().toString();
    const newTarget = {
      id: newId,
      name: formInlineShareName,
      relation: formInlineShareRelation,
      avatar: '',
      privilege: '보기 가능',
      isSharing: true
    };
    
    const updatedUsers = [...sharedUsers, newTarget];
    setSharedUsers(updatedUsers);
    localStorage.setItem('weplan_shared_users', JSON.stringify(updatedUsers));
    
    setFormShareScope('custom');
    setFormSharedWithIds(prev => [...prev, newId]);
    setFormInlineShareName('');
  };

  // Add Event trigger
  const handleOpenAddModal = (dateStr) => {
    setSelectedDay(dateStr);
    setEditTarget(null);
    setFormType('appointment');
    setFormShiftType(shifts[0]?.id || 'day');
    setFormShiftRange('single');
    
    const dObj = new Date(dateStr + "T00:00:00");
    const dayOfWeek = dObj.getDay();
    const initialDays = { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 0: false };
    initialDays[dayOfWeek] = true;
    setFormShiftDays(initialDays);
    setFormShiftScope('month');
    const defaultOt = shifts[0]?.defaultOvertime || 0;
    setFormShiftOvertime(defaultOt);
    setFormShiftHasOvertime(defaultOt > 0);
    setFormExcludeHolidays(false);
    setFormAptTitle('');


    setFormAptTime('12:00');
    setFormAptIsAllDay(false);
    setFormAptPlace('');
    setFormAptIsPrivate(false);
    setFormEventAlarmEnabled(false);
    setFormEventAlarmTime(alarmSettings.eventAlarmTime || '전날 18:00');
    setFormEventAlarmDateTime(getDefaultAlarmDateTime(dateStr));
    setFormBdayName('');
    setFormBdayIsLunar(false);
    setFormBdayAlarmOnDay(true);
    setFormBdayAlarmWeekBefore(false);
    setFormBdayRepeatYearly(true);
    setFormIsRange(false);
    setFormTripStart(dateStr);
    setFormTripEnd(dateStr);
    setFormTripColor('blue');
    setFormAptDisplayMode('dot');
    setFormShareScope('private');
    setFormSharePermission('view');
    setFormSharedWithIds([]);
    setShowAddModal(true);
  };

  // View Event Detail (상세보기 모달)
  const handleViewEvent = (evt) => {
    setViewTarget(evt);
  };

  // Edit Event trigger
  const handleEditEvent = (evt) => {
    setEditTarget(evt);
    if (evt.type === 'shift') {
      setFormType('shift');
      setFormShiftType(evt.shiftType);
      const otVal = evt.overtimeHours || 0;
      setFormShiftOvertime(otVal);
      setFormShiftHasOvertime(otVal > 0);
      setFormShiftRange('single');
    } else if (evt.type === 'birthday') {
      setFormType('birthday');
      setFormIsRange(false);
      setFormBdayName(evt.name || '');
      setFormBdayIsLunar(Boolean(evt.isLunar));
      setFormBdayAlarmOnDay(evt.alarmOnDay !== false);
      setFormBdayAlarmWeekBefore(Boolean(evt.alarmWeekBefore));
      setFormBdayRepeatYearly(evt.repeatYearly !== false);
      setFormTripStart(evt.date || selectedDay);
      setFormEventAlarmEnabled(evt.alarmEnabled ?? (evt.alarmOnDay !== false || Boolean(evt.alarmWeekBefore)));
      setFormEventAlarmDateTime(evt.alarmDateTime || getDefaultAlarmDateTime(evt.date || selectedDay));
    } else if (evt.type === 'trip') {
      setFormType('appointment');
      setFormIsRange(true);
      setFormTripStart(evt.startDate || evt.date || selectedDay);
      setFormTripEnd(evt.endDate || evt.date || selectedDay);
      setFormTripColor(evt.color || 'blue');
      setFormAptTitle(evt.title || '');
      setFormAptTime('12:00');
      setFormAptIsAllDay(false);
      setFormAptPlace(evt.place || '');
      setFormAptIsPrivate(false);
      setFormEventAlarmEnabled(evt.alarmEnabled ?? (alarmSettings.enableEventAlarm !== false));
      setFormEventAlarmTime(evt.alarmTime || alarmSettings.eventAlarmTime || '전날 18:00');
      setFormEventAlarmDateTime(evt.alarmDateTime || getDefaultAlarmDateTime(evt.startDate || evt.date || selectedDay));
    } else {
      setFormType('appointment');
      setFormIsRange(false);
      setFormTripStart(evt.date || selectedDay);
      setFormTripEnd(evt.date || selectedDay);
      setFormTripColor(evt.color || 'blue');
      setFormAptTitle(evt.title || '');
      setFormAptTime(evt.time || '');
      setFormAptIsAllDay(!evt.time);
      setFormAptPlace(evt.place || '');
      setFormAptIsPrivate(evt.isPrivate || false);
      setFormAptDisplayMode(evt.displayMode || 'dot');
      setFormEventAlarmEnabled(evt.alarmEnabled ?? (alarmSettings.enableEventAlarm !== false));
      setFormEventAlarmTime(evt.alarmTime || alarmSettings.eventAlarmTime || '전날 18:00');
      setFormEventAlarmDateTime(evt.alarmDateTime || getDefaultAlarmDateTime(evt.date || selectedDay));
    }
    const scope = evt.shareScope || (evt.isPrivate ? 'private' : 'public');
    const sharedWith = evt.sharedWith || (evt.isPrivate ? [] : sharedUsers.map(u => u.id));
    setFormShareScope(scope);
    setFormSharePermission(evt.sharePermission === 'edit' ? 'edit' : 'view');
    setFormSharedWithIds(sharedWith);
    setShowAddModal(true);
  };

  // Delete Event
  const handleDeleteEvent = (eventId) => {
    if (window.confirm('이 일정을 삭제하시겠습니까?')) {
      setEvents(prev => prev.filter(e => e.id !== eventId));
    }
  };

  // Submit Add/Edit Form
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formIsRange && formTripStart && formTripEnd) {
      if (new Date(formTripEnd) < new Date(formTripStart)) {
        alert('종료일은 시작일보다 빠를 수 없습니다.');
        return;
      }
    }
    if (editTarget) {
      // Edit
      setEvents(prev => prev.map(evt => {
        if (evt.id === editTarget.id) {
          if (formType === 'shift') {
            return { ...evt, shiftType: formShiftType, type: 'shift', overtimeHours: parseFloat(formShiftHasOvertime ? formShiftOvertime : 0) || 0 };
          } else if (formType === 'birthday') {
            return {
              ...evt,
              type: 'birthday',
              name: formBdayName,
              date: formTripStart,
              isLunar: formBdayIsLunar,
              alarmOnDay: formBdayAlarmOnDay,
              alarmWeekBefore: formBdayAlarmWeekBefore,
              repeatYearly: formBdayRepeatYearly,
              alarmEnabled: formEventAlarmEnabled,
              alarmDateTime: formEventAlarmDateTime
            };
          } else if (formIsRange) {
            return { 
              ...evt, 
              type: 'trip',
              title: formAptTitle, 
              startDate: formTripStart,
              endDate: formTripEnd,
              place: formAptPlace,
              color: formTripColor,
              date: undefined,
              shareScope: formShareScope,
              sharePermission: formSharePermission,
              sharedWith: formSharedWithIds,
              isPrivate: formShareScope === 'private',
              alarmEnabled: formEventAlarmEnabled,
              alarmTime: formEventAlarmTime,
              alarmDateTime: formEventAlarmDateTime
            };
          } else {
            return { 
              ...evt, 
              type: 'appointment',
              title: formAptTitle, 
              time: formAptTime, 
              place: formAptPlace,
              isPrivate: formShareScope === 'private',
              displayMode: formAptDisplayMode,
              date: editTarget.date || selectedDay,
              startDate: undefined,
              endDate: undefined,
              shareScope: formShareScope,
              sharePermission: formSharePermission,
              sharedWith: formSharedWithIds,
              color: formTripColor,
              alarmEnabled: formEventAlarmEnabled,
              alarmTime: formEventAlarmTime,
              alarmDateTime: formEventAlarmDateTime
            };
          }
        }
        return evt;
      }));
    } else {
      // Add
      const newEvent = {
        id: Date.now().toString()
      };
      
      if (formType === 'shift') {
        const selectedDate = new Date(selectedDay + "T00:00:00");
        let targetDates = [selectedDay];
        let affectedDates = [selectedDay];
        
        if (formShiftRange === 'custom') {
          const activeDays = Object.keys(formShiftDays)
            .filter(day => formShiftDays[day] === true)
            .map(Number);
          
          if (activeDays.length === 0) {
            alert('최소 하나 이상의 요일을 선택해 주세요.');
            return;
          }
          
          targetDates = [];
          affectedDates = [];
          
          if (formShiftScope === 'week') {
            const startOfWeek = new Date(selectedDate);
            startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
            
            for (let i = 0; i < 7; i++) {
              const d = new Date(startOfWeek);
              d.setDate(startOfWeek.getDate() + i);
              if (activeDays.includes(d.getDay())) {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const dateStr = `${y}-${m}-${String(d.getDate()).padStart(2, '0')}`;
                affectedDates.push(dateStr);
                
                const isHoliday = holidaysMap[dateStr] || getHoliday(dateStr);
                if (formExcludeHolidays && isHoliday) continue;
                
                targetDates.push(dateStr);
              }
            }
          } else if (formShiftScope === 'month') {
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth();
            const lastDay = new Date(year, month + 1, 0).getDate();
            
            for (let i = 1; i <= lastDay; i++) {
              const d = new Date(year, month, i);
              if (activeDays.includes(d.getDay())) {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const dateStr = `${y}-${m}-${String(d.getDate()).padStart(2, '0')}`;
                affectedDates.push(dateStr);
                
                const isHoliday = holidaysMap[dateStr] || getHoliday(dateStr);
                if (formExcludeHolidays && isHoliday) continue;
                
                targetDates.push(dateStr);
              }
            }
          }
        }

        if (affectedDates.length === 0) {
          alert('선택한 조건에 등록할 근무일이 없습니다. 요일 또는 공휴일 제외 설정을 확인해 주세요.');
          return;
        }
        
        setEvents(prev => {
          const filtered = prev.filter(e => !(affectedDates.includes(e.date) && e.type === 'shift' && e.shiftType === formShiftType));
          const newShifts = targetDates.map((dateStr, idx) => ({
            id: `${Date.now()}-${idx}`,
            type: 'shift',
            date: dateStr,
            shiftType: formShiftType,
            overtimeHours: parseFloat(formShiftHasOvertime ? formShiftOvertime : 0) || 0
          }));
          return [...filtered, ...newShifts];
        });
        
        setShowAddModal(false);
        return;
      } else if (formType === 'birthday') {
        newEvent.type = 'birthday';
        newEvent.name = formBdayName;
        newEvent.date = formTripStart;
        newEvent.isLunar = formBdayIsLunar;
        newEvent.alarmOnDay = formBdayAlarmOnDay;
        newEvent.alarmWeekBefore = formBdayAlarmWeekBefore;
        newEvent.repeatYearly = formBdayRepeatYearly;
        newEvent.alarmEnabled = formEventAlarmEnabled;
        newEvent.alarmDateTime = formEventAlarmDateTime;
      } else if (formIsRange) {
        newEvent.type = 'trip';
        newEvent.title = formAptTitle;
        newEvent.startDate = formTripStart;
        newEvent.endDate = formTripEnd;
        newEvent.place = formAptPlace;
        newEvent.color = formTripColor;
        newEvent.shareScope = formShareScope;
        newEvent.sharePermission = formSharePermission;
        newEvent.sharedWith = formSharedWithIds;
        newEvent.isPrivate = formShareScope === 'private';
        newEvent.alarmEnabled = formEventAlarmEnabled;
        newEvent.alarmTime = formEventAlarmTime;
        newEvent.alarmDateTime = formEventAlarmDateTime;
      } else {
        newEvent.type = 'appointment';
        newEvent.date = selectedDay;
        newEvent.title = formAptTitle;
        newEvent.time = formAptTime;
        newEvent.place = formAptPlace;
        newEvent.isPrivate = formShareScope === 'private';
        newEvent.displayMode = formAptDisplayMode;
        newEvent.shareScope = formShareScope;
        newEvent.sharePermission = formSharePermission;
        newEvent.sharedWith = formSharedWithIds;
        newEvent.color = formTripColor;
        newEvent.alarmEnabled = formEventAlarmEnabled;
        newEvent.alarmTime = formEventAlarmTime;
        newEvent.alarmDateTime = formEventAlarmDateTime;
      }
      setEvents(prev => [...prev, newEvent]);
    }
    setShowAddModal(false);
  };

  // Settings callbacks
  const handleAddBirthday = (bdayData) => {
    const newBday = {
      id: Date.now().toString(),
      type: 'birthday',
      name: bdayData.name,
      date: bdayData.date,
      isLunar: bdayData.isLunar,
      alarmOnDay: bdayData.alarmOnDay,
      alarmWeekBefore: bdayData.alarmWeekBefore,
      repeatYearly: bdayData.repeatYearly !== false
    };
    setEvents(prev => [...prev, newBday]);
  };

  const handleAddTripConnection = (tripData) => {
    const newTrip = {
      id: Date.now().toString(),
      type: 'trip',
      title: tripData.title,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      color: tripData.color,
      place: tripData.place
    };
    setEvents(prev => [...prev, newTrip]);
  };

  const handleDisconnectTrip = () => {
    if (window.confirm('모든 연결된 여행 일정을 분리하시겠습니까?')) {
      setEvents(prev => prev.filter(e => e.type !== 'trip'));
    }
  };

  const handleInviteFriend = () => {
    const name = prompt('캘린더를 함께 연동할 친구의 이메일 또는 ID를 입력하세요:');
    if (name) {
      alert(`[${name}] 계정으로 캘린더 연동 및 초대가 전송되었습니다.`);
    }
  };

  // Trips data
  const currentTrips = events.filter(e => e.type === 'trip');

  const selectedPerspectiveUser = sharedUsers.find(u => u.id === calendarPerspective);
  const isReadOnlyPerspective = calendarPerspective !== 'me' && (!selectedPerspectiveUser || !selectedPerspectiveUser.privilege.includes('편집'));
  const canEditEvent = (event) => {
    if (calendarPerspective === 'me') return true;
    if (!event || event.sharePermission !== 'edit') return false;
    const scope = event.shareScope || (event.isPrivate ? 'private' : 'public');
    if (scope === 'private') return false;
    if (scope === 'public') return true;
    return scope === 'custom' && (event.sharedWith || []).includes(calendarPerspective);
  };
  const isEventFormReadOnly = editTarget ? !canEditEvent(editTarget) : isReadOnlyPerspective;

  if (isLoggingIn) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(circle at 10% 20%, rgba(94, 95, 240, 0.05) 0%, rgba(167, 139, 250, 0.05) 90.2%), #f4f7fc',
        fontFamily: 'var(--font-primary)',
        gap: '20px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--primary-light)',
          borderTop: '4px solid var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '600', margin: 0 }}>
          카카오 로그인 중입니다. 잠시만 기다려주세요...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div 
      className={`app-container ${
        currentTab === 'settings' || currentTab === 'stats' || currentTab === 'schedule'
          ? 'settings-active' 
          : ''
      }`}
      style={{
        '--left-sidebar-width': showLeftSidebar ? '240px' : '0px',
        '--right-sidebar-width': (showRightSidebar && currentTab !== 'settings' && currentTab !== 'stats' && currentTab !== 'schedule' && currentTab !== 'friends') ? `${rightSidebarWidth}px` : '0px'
      }}
    >
      {/* 3. Left Sidebar Navigation */}
      {showLeftSidebar && (
        <SidebarLeft 
          currentTab={currentTab} 
          setCurrentTab={setCurrentTab} 
          sharedUsers={sharedUsers}
          onInviteFriend={handleInviteFriend}
          isPrivateMode={isPrivateMode}
          userName={userName}
          setUserName={setUserName}
          userJob={userJob}
          setUserJob={setUserJob}
          calendarPerspective={calendarPerspective}
          setCalendarPerspective={setCalendarPerspective}
          showLeftSidebar={showLeftSidebar}
          setShowLeftSidebar={setShowLeftSidebar}
          user={user}
          setUser={setUser}
          onLogout={handleLogout}
          onOpenAlarm={() => setShowAlarmModal(true)}
        />
      )}


      {/* 1. Right Sidebar Detail */}
      {currentTab !== 'settings' && currentTab !== 'stats' && currentTab !== 'schedule' && currentTab !== 'friends' && showRightSidebar && (
        <div className="sidebar-right-container" style={{ height: '100vh', position: 'sticky', top: 0 }}>
          <div 
            className={`resize-handle-v ${isDragging ? 'dragging' : ''}`}
            onMouseDown={handleMouseDown}
          />
          <SidebarRight 
            selectedDateStr={selectedDay}
            events={events}
            shifts={shifts}
            onAddEventClick={handleOpenAddModal}
            onEditEvent={handleViewEvent}
            onDeleteEvent={handleDeleteEvent}
            isPrivateMode={isPrivateMode}
            holidaysMap={holidaysMap}
            calendarPerspective={calendarPerspective}
            sharedUsers={sharedUsers}
            isReadOnlyPerspective={isReadOnlyPerspective}
            canEditEvent={canEditEvent}
            settings={settings}
            memos={memos}
            setMemos={setMemos}
            todos={todos}
            setTodos={setTodos}
          />
        </div>
      )}

      <main className="main-content" style={{ position: 'relative' }}>
        {!showLeftSidebar && (
          <button 
            type="button"
            onClick={() => setShowLeftSidebar(true)}
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              zIndex: 999,
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-md)',
              color: 'var(--text-main)',
              transition: 'all 0.2s ease',
            }}
            title="메뉴 펼치기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}
        {currentTab === 'settings' ? (
          <div className="settings-page-wrapper fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 0' }}>
            <div className="settings-header" style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={22} color="var(--primary)" />
                설정
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                알림과 캘린더 표시 설정을 구성합니다.
              </p>
            </div>

            <div style={{ maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SettingsPanels
                shifts={shifts}
                setShifts={setShifts}
                alarmSettings={alarmSettings}
                setAlarmSettings={setAlarmSettings}
                settings={settings}
                setSettings={setSettings}
                sharedUsers={sharedUsers}
                setSharedUsers={setSharedUsers}
                isPrivateMode={isPrivateMode}
                setIsPrivateMode={setIsPrivateMode}
                onAddBirthday={handleAddBirthday}
                onlyAlarmSettings={true}
                relationGroups={relationGroups}
                setRelationGroups={setRelationGroups}
                calendarPerspective={calendarPerspective}
                setCalendarPerspective={setCalendarPerspective}
              />
              <SettingsPanels 
                shifts={shifts}
                setShifts={setShifts}
                alarmSettings={alarmSettings}
                setAlarmSettings={setAlarmSettings}
                settings={settings}
                setSettings={setSettings}
                sharedUsers={sharedUsers}
                setSharedUsers={setSharedUsers}
                isPrivateMode={isPrivateMode}
                setIsPrivateMode={setIsPrivateMode}
                onAddBirthday={handleAddBirthday}
                onlyHolidayCalendar={true}
                relationGroups={relationGroups}
                setRelationGroups={setRelationGroups}
                calendarPerspective={calendarPerspective}
                setCalendarPerspective={setCalendarPerspective}
              />
            </div>
          </div>
        ) : currentTab === 'schedule' ? (
          <ManagerScheduler 
            currentDate={currentDate}
            events={events}
            setEvents={setEvents}
            shifts={shifts}
            holidaysMap={holidaysMap}
            currentUser={user}
          />
        ) : currentTab === 'stats' ? (
          <StatsDashboard 
            events={events}
            shifts={shifts}
            currentDate={currentDate}
          />
        ) : currentTab === 'friends' ? (
          <FriendsBoard 
            sharedUsers={sharedUsers}
            setSharedUsers={setSharedUsers}
            relationGroups={relationGroups}
            setRelationGroups={setRelationGroups}
            calendarPerspective={calendarPerspective}
            setCalendarPerspective={setCalendarPerspective}
            setCurrentTab={setCurrentTab}
            isPrivateMode={isPrivateMode}
            setIsPrivateMode={setIsPrivateMode}
            events={events}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            shifts={shifts}
            settings={settings}
            viewMode={viewMode}
            setViewMode={setViewMode}
            workViewMode={workViewMode}
            aptViewMode={aptViewMode}
            holidaysMap={holidaysMap}
            primaryShiftMap={primaryShiftMap}
            onSelectDay={(dateStr) => {
              setSelectedDay(dateStr);
              const parts = dateStr.split('-');
              setCurrentDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
            }}
            selectedDay={selectedDay}
            onAddEventClick={handleOpenAddModal}
            onEditEvent={handleViewEvent}
          />
        ) : currentTab === 'records' ? (
          <RecordsBoard 
            memos={memos}
            setMemos={setMemos}
            todos={todos}
            setTodos={setTodos}
          />
        ) : (
          <>
            {/* Top Configuration Panels for Sharing */}
            {currentTab === 'shared' && (
              <div style={{ marginBottom: '20px' }}>
                <SettingsPanels 
                  shifts={shifts}
                  setShifts={setShifts}
                  alarmSettings={alarmSettings}
                  setAlarmSettings={setAlarmSettings}
                  settings={settings}
                  setSettings={setSettings}
                  sharedUsers={sharedUsers}
                  setSharedUsers={setSharedUsers}
                  isPrivateMode={isPrivateMode}
                  setIsPrivateMode={setIsPrivateMode}
                  onAddBirthday={handleAddBirthday}
                  hideHolidayCalendar={true}
                  hideSharedSettings={false}
                  onlySharedSettings={true}
                  relationGroups={relationGroups}
                  setRelationGroups={setRelationGroups}
                  calendarPerspective={calendarPerspective}
                  setCalendarPerspective={setCalendarPerspective}
                />
              </div>
            )}

            <CalendarGrid 
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              events={events}
              shifts={shifts}
              settings={settings}
              viewMode={viewMode}
              setViewMode={setViewMode}
              workViewMode={workViewMode}
              aptViewMode={aptViewMode}
              onMoveEvent={handleMoveEvent}
              memos={memos}
              todos={todos}
              setTodos={setTodos}
              onSelectDay={(dateStr) => {
                setSelectedDay(dateStr);
                const parts = dateStr.split('-');
                setCurrentDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
              }}
              selectedDay={selectedDay}
              onAddEventClick={handleOpenAddModal}
              onEditEvent={handleViewEvent}
              isPrivateMode={isPrivateMode}
              holidaysMap={holidaysMap}
              calendarPerspective={calendarPerspective}
              setCalendarPerspective={setCalendarPerspective}
              sharedUsers={sharedUsers}
              isReadOnlyPerspective={isReadOnlyPerspective}
              canEditEvent={canEditEvent}
              showRightSidebar={showRightSidebar}
              setShowRightSidebar={setShowRightSidebar}
              currentTab={currentTab}
              primaryShiftMap={primaryShiftMap}
              setPrimaryShiftMap={setPrimaryShiftMap}
              onOpenSettings={(tab) => {
                setSettingsModalTab(tab);
                setShowSettingsModal(true);
              }}
            />

          </>
        )}
      </main>

      {/* 3-b. Event Detail View Modal */}
      {viewTarget && (() => {
        const evt = viewTarget;
        const isShift = evt.type === 'shift';
        const shiftData = isShift ? (Array.isArray(shifts) ? shifts.find(s => s.id === evt.shiftType) : null) : null;
        const isBirthday = evt.type === 'birthday';

        const colorMap = { blue: '#3b82f6', purple: '#a855f7', emerald: '#10b981', orange: '#f97316', pink: '#ec4899' };
        const accentColor = isShift && shiftData ? shiftData.color : (colorMap[evt.color] || '#3b82f6');
        const bgColor = accentColor + '12';
        const borderColor = accentColor + '40';

        const displayDate = evt.startDate
          ? `${evt.startDate} ~ ${evt.endDate}`
          : (evt.date || selectedDay);
        const displayTime = isBirthday
          ? `${evt.isLunar ? '음력 생일' : '양력 생일'} · ${evt.repeatYearly === false ? '올해만 표시' : '매년 반복'}`
          : isShift && shiftData
            ? `${shiftData.start} - ${shiftData.end}`
            : evt.time || '하루 종일';
        const displayTitle = isBirthday
          ? `${evt.name || ''} 생일`
          : isShift && shiftData
            ? shiftData.label
            : evt.title || '(제목 없음)';

        return (
          <div className="dialog-overlay" onClick={() => setViewTarget(null)}>
            <div
              className="dialog-content"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '400px', padding: '0', overflow: 'hidden', borderRadius: '16px' }}
            >
              {/* 컬러 헤더 */}
              <div style={{
                background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}08)`,
                borderBottom: `1px solid ${borderColor}`,
                padding: '20px 20px 16px 20px',
                position: 'relative'
              }}>
                <button
                  onClick={() => setViewTarget(null)}
                  style={{
                    position: 'absolute', top: '14px', right: '14px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: '4px', borderRadius: '6px'
                  }}
                >
                  <X size={16} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    backgroundColor: accentColor + '22',
                    border: `1.5px solid ${accentColor}55`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {isBirthday
                      ? <Cake size={18} color={accentColor} />
                      : isShift
                        ? <CalendarDays size={18} color={accentColor} />
                        : <CalendarDays size={18} color={accentColor} />
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1.2 }}>
                      {displayTitle}
                    </div>
                    {isShift && (
                      <span style={{
                        fontSize: '10px', fontWeight: '700',
                        backgroundColor: accentColor + '22',
                        color: accentColor,
                        padding: '1px 7px', borderRadius: '10px', marginTop: '4px', display: 'inline-block'
                      }}>스케줄</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 상세 정보 */}
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* 날짜 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <CalendarDays size={14} style={{ flexShrink: 0 }} />
                  <span>{displayDate}</span>
                </div>

                {/* 시간 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <Clock size={14} style={{ flexShrink: 0 }} />
                  <span>{displayTime}</span>
                  {isShift && parseFloat(evt.overtimeHours) > 0 && (
                    <span style={{
                      fontSize: '11px', fontWeight: '700',
                      backgroundColor: accentColor + '22', color: accentColor,
                      padding: '1px 7px', borderRadius: '10px'
                    }}>초과근무 +{evt.overtimeHours}h</span>
                  )}
                </div>

                {/* 장소 */}
                {evt.place && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <MapPin size={14} style={{ flexShrink: 0 }} />
                    <span>{evt.place}</span>
                  </div>
                )}

                {/* 비공개 */}
                {evt.isPrivate && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#94a3b8' }}>
                    <Lock size={13} style={{ flexShrink: 0 }} />
                    <span>비공개 일정</span>
                  </div>
                )}

                {/* 참여자 */}
                {evt.participants && evt.participants.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <User size={14} style={{ flexShrink: 0 }} />
                    {evt.participants.map((p, i) => (
                      <span key={i} style={{
                        fontSize: '11px', backgroundColor: 'var(--bg-sub)',
                        padding: '2px 8px', borderRadius: '20px',
                        border: '1px solid var(--border-color)'
                      }}>{p.name}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* 하단 수정 / 삭제 버튼 */}
              {canEditEvent(evt) && !isBirthday && (
                <div style={{
                  padding: '12px 20px 20px 20px',
                  display: 'flex', gap: '8px', justifyContent: 'flex-end',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <button
                    onClick={() => {
                      setViewTarget(null);
                      handleEditEvent(evt);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '8px 16px', borderRadius: '8px',
                      backgroundColor: accentColor, color: '#ffffff',
                      border: 'none', cursor: 'pointer',
                      fontSize: '13px', fontWeight: '600'
                    }}
                  >
                    <Edit3 size={13} />
                    수정
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Settings Modal overlay */}
      {showSettingsModal && (
        <div className="dialog-overlay" onClick={() => setShowSettingsModal(false)}>
          <div 
            className="dialog-content" 
            onClick={e => e.stopPropagation()}
            style={{ 
              width: '480px', 
              maxWidth: '95%', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              padding: '20px'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {settingsModalTab === 'schedule' && <Clock size={18} color="var(--primary)" />}
                {settingsModalTab === 'alarm' && <Bell size={18} color="var(--primary)" />}
                <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
                  {settingsModalTab === 'schedule' && '근무 유형 설정'}
                  {settingsModalTab === 'alarm' && '알림 설정'}
                </span>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content: SettingsPanels */}
            <div style={{ flex: 1, marginTop: '12px' }}>
              <SettingsPanels 
                shifts={shifts}
                setShifts={setShifts}
                alarmSettings={alarmSettings}
                setAlarmSettings={setAlarmSettings}
                settings={settings}
                setSettings={setSettings}
                sharedUsers={sharedUsers}
                setSharedUsers={setSharedUsers}
                isPrivateMode={isPrivateMode}
                setIsPrivateMode={setIsPrivateMode}
                onAddBirthday={handleAddBirthday}
                hideHolidayCalendar={true}
                hideSharedSettings={true}
                onlyScheduleSettings={settingsModalTab === 'schedule'}
                onlyAlarmSettings={settingsModalTab === 'alarm'}
                hidePanelTitles={true}
                relationGroups={relationGroups}
                setRelationGroups={setRelationGroups}
                calendarPerspective={calendarPerspective}
                setCalendarPerspective={setCalendarPerspective}
                currentTab={currentTab}
              />
            </div>
          </div>
        </div>
      )}

      {/* Notification popup */}
      {showAlarmModal && (
        <div className="dialog-overlay" onClick={() => setShowAlarmModal(false)}>
          <div
            className="dialog-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '420px',
              maxWidth: '95%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Bell size={18} color="var(--primary)" />
                <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>알림</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAlarmModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                title="알림 창 닫기"
              >
                <X size={18} />
              </button>
            </div>

            {(() => {
              const now = new Date();
              const toDateString = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              };
              const upcoming = events
                .map((event) => {
                  if (event.type === 'birthday') {
                    const birthdayAlarmEnabled = event.alarmEnabled === true;
                    if (!birthdayAlarmEnabled) return { ...event, notificationDate: null };

                    const candidateYears = [now.getFullYear(), now.getFullYear() + 1];
                    const registeredYear = Number(event.date?.slice(0, 4));
                    const registeredBirthday = getBirthdayDateForYear(event, registeredYear) || event.date;
                    const registeredAlarm = event.alarmDateTime ? new Date(event.alarmDateTime) : null;
                    const registeredBirthdayDate = registeredBirthday ? new Date(`${registeredBirthday}T00:00:00`) : null;
                    const alarmOffset = registeredAlarm && registeredBirthdayDate && !Number.isNaN(registeredAlarm.getTime())
                      ? registeredBirthdayDate.getTime() - registeredAlarm.getTime()
                      : (event.alarmWeekBefore && !event.alarmOnDay ? 7 * 24 * 60 * 60 * 1000 : 0);

                    const birthdayAlarm = candidateYears
                      .map((year) => {
                        const birthdayDate = getBirthdayDateForYear(event, year);
                        if (!birthdayDate) return null;
                        return new Date(new Date(`${birthdayDate}T00:00:00`).getTime() - alarmOffset);
                      })
                      .find((date) => date && date.getTime() >= now.getTime());

                    return {
                      ...event,
                      notificationDate: birthdayAlarm ? toDateString(birthdayAlarm) : null,
                      notificationTimestamp: birthdayAlarm?.getTime(),
                      alarmDisplay: birthdayAlarm
                        ? birthdayAlarm.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : undefined
                    };
                  }

                  const alarmEnabled = event.alarmEnabled === true;
                  if (!alarmEnabled) return { ...event, notificationDate: null };

                  const eventDate = event.date || event.startDate;
                  if (!eventDate) return { ...event, notificationDate: null };

                  if (event.alarmDateTime) {
                    const customAlarmDate = new Date(event.alarmDateTime);
                    if (!Number.isNaN(customAlarmDate.getTime())) {
                      return {
                        ...event,
                        notificationDate: toDateString(customAlarmDate),
                        notificationTimestamp: customAlarmDate.getTime(),
                        alarmDisplay: customAlarmDate.toLocaleString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      };
                    }
                  }

                  const alarmTime = event.alarmTime || alarmSettings.eventAlarmTime || '전날 18:00';
                  const alarmDate = new Date(`${eventDate}T${event.time || '09:00'}:00`);
                  const fixedClock = alarmTime.match(/(\d{2}):(\d{2})/);
                  if (fixedClock) alarmDate.setHours(Number(fixedClock[1]), Number(fixedClock[2]), 0, 0);
                  const relativeMinutes = {
                    '10분 전': 10,
                    '30분 전': 30,
                    '1시간 전': 60,
                    '2시간 전': 120
                  };

                  if (relativeMinutes[alarmTime]) {
                    alarmDate.setMinutes(alarmDate.getMinutes() - relativeMinutes[alarmTime]);
                  } else if (alarmTime.startsWith('전날')) {
                    alarmDate.setDate(alarmDate.getDate() - 1);
                  } else if (alarmTime.startsWith('2일 전')) {
                    alarmDate.setDate(alarmDate.getDate() - 2);
                  } else if (alarmTime.startsWith('3일 전')) {
                    alarmDate.setDate(alarmDate.getDate() - 3);
                  } else if (alarmTime.startsWith('일주일 전')) {
                    alarmDate.setDate(alarmDate.getDate() - 7);
                  }

                  return {
                    ...event,
                    alarmTime,
                    notificationDate: toDateString(alarmDate),
                    notificationTimestamp: alarmDate.getTime()
                  };
                })
                .filter((event) => Number.isFinite(event.notificationTimestamp) && event.notificationTimestamp >= now.getTime())
                .sort((a, b) => a.notificationTimestamp - b.notificationTimestamp)
                .slice(0, 10);

              if (upcoming.length === 0) {
                return (
                  <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    예정된 알림이 없습니다.<br />일정이나 생일에서 알림을 설정해 보세요.
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {upcoming.map((event) => {
                    const shift = event.type === 'shift' ? shifts.find((item) => item.id === event.shiftType) : null;
                    const title = event.type === 'shift'
                      ? `${shift?.label || '근무'} 근무`
                      : event.type === 'birthday'
                        ? `${event.name || '등록된'} 생일`
                        : event.title || '일정 알림';
                    return (
                      <div key={event.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '11px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-card)' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                          <Bell size={15} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
                          <div style={{ marginTop: '2px', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            {event.notificationDate}
                            {event.alarmDisplay
                              ? ` · ${event.alarmDisplay}`
                              : (event.type !== 'birthday' && event.alarmTime
                                ? ` · ${event.alarmTime}`
                                : (event.time ? ` · ${event.time}` : ''))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* 4. Add/Edit Shift or Appointment Modal overlay */}
      {showAddModal && (
        <div className="dialog-overlay" onClick={() => setShowAddModal(false)}>
          <div className="dialog-content add-event-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
                {editTarget ? '일정 수정하기' : `${selectedDay} 일정 추가`}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="nav-btn">
                <X size={18} />
              </button>
            </div>

            {isEventFormReadOnly && (
              <div style={{
                color: '#ef4444',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                marginTop: '10px'
              }}>
                ⚠️ 보기 전용 모드입니다. 이 캘린더에 대한 편집 권한이 없어 일정을 추가, 수정 또는 삭제할 수 없습니다.
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <fieldset disabled={isEventFormReadOnly} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Type Switch (Only show if not editing or editing a non-trip event) */}
              {!editTarget && (
                <div className="solar-lunar-btn-group event-type-switch">
                  <button 
                    type="button" 
                    className={`solar-lunar-btn ${formType === 'shift' ? 'active' : ''}`}
                    onClick={() => setFormType('shift')}
                  >
                    근무 스케줄
                  </button>
                  <button 
                    type="button" 
                    className={`solar-lunar-btn ${formType === 'appointment' ? 'active' : ''}`}
                    onClick={() => setFormType('appointment')}
                  >
                    일정 / 약속
                  </button>
                  <button
                    type="button"
                    className={`solar-lunar-btn ${formType === 'birthday' ? 'active' : ''}`}
                    onClick={() => setFormType('birthday')}
                  >
                    생일
                  </button>
                </div>
              )}

              {/* Form Content: Shift */}
              {formType === 'shift' && (
                <>
                  <div className="settings-form-row">
                    <span className="settings-label">근무 타입 선택</span>
                    <select 
                      value={formShiftType} 
                      onChange={(e) => {
                        const newType = e.target.value;
                        setFormShiftType(newType);
                        const selectedPreset = Array.isArray(shifts) ? shifts.find(s => s.id === newType) : null;
                        const defaultOt = selectedPreset?.defaultOvertime || 0;
                        setFormShiftOvertime(defaultOt);
                        setFormShiftHasOvertime(defaultOt > 0);
                      }}
                    >
                      {Array.isArray(shifts) && shifts.map(shift => (
                        <option key={shift.id} value={shift.id}>
                          {shift.label} ({shift.start} ~ {shift.end})
                        </option>
                      ))}
                    </select>
                  </div>

                  {!editTarget && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="settings-form-row">
                        <span className="settings-label">등록 범위 설정</span>
                        <div className="solar-lunar-btn-group" style={{ marginTop: '6px', gap: '4px' }}>
                          <button 
                            type="button" 
                            className={`solar-lunar-btn ${formShiftRange === 'single' ? 'active' : ''}`}
                            onClick={() => setFormShiftRange('single')}
                            style={{ fontSize: '11px', padding: '6px 8px', flex: 1 }}
                          >
                            이 날짜만
                          </button>
                          <button 
                            type="button" 
                            className={`solar-lunar-btn ${formShiftRange === 'custom' ? 'active' : ''}`}
                            onClick={() => setFormShiftRange('custom')}
                            style={{ fontSize: '11px', padding: '6px 8px', flex: 1 }}
                          >
                            요일 선택 (패턴 등록)
                          </button>
                        </div>
                      </div>

                      {formShiftRange === 'custom' && (
                        <>
                          <div className="settings-form-row">
                            <span className="settings-label">반복할 요일 선택</span>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '6px', justifyContent: 'space-between' }}>
                              {[
                                { key: 0, label: '일', isSun: true },
                                { key: 1, label: '월' },
                                { key: 2, label: '화' },
                                { key: 3, label: '수' },
                                { key: 4, label: '목' },
                                { key: 5, label: '금' },
                                { key: 6, label: '토', isSat: true }
                              ].map(d => {
                                const active = formShiftDays[d.key];
                                return (
                                  <button
                                    key={d.key}
                                    type="button"
                                    onClick={() => setFormShiftDays(prev => ({ ...prev, [d.key]: !prev[d.key] }))}
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '50%',
                                      border: '1px solid var(--border-color)',
                                      fontSize: '12px',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.15s ease-in-out',
                                      backgroundColor: active ? 'var(--primary)' : '#ffffff',
                                      color: active ? '#ffffff' : (d.isSun ? '#ef4444' : (d.isSat ? '#3b82f6' : 'var(--text-main)')),
                                      boxShadow: active ? 'var(--shadow-sm)' : 'none',
                                      outline: 'none'
                                    }}
                                  >
                                    {d.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="settings-form-row">
                            <span className="settings-label">반복 기간 범위</span>
                            <div className="solar-lunar-btn-group" style={{ marginTop: '6px', gap: '4px' }}>
                              <button 
                                type="button" 
                                className={`solar-lunar-btn ${formShiftScope === 'week' ? 'active' : ''}`}
                                onClick={() => setFormShiftScope('week')}
                                style={{ fontSize: '11px', padding: '6px 8px', flex: 1 }}
                              >
                                해당 주에만 적용
                              </button>
                              <button 
                                type="button" 
                                className={`solar-lunar-btn ${formShiftScope === 'month' ? 'active' : ''}`}
                                onClick={() => setFormShiftScope('month')}
                                style={{ fontSize: '11px', padding: '6px 8px', flex: 1 }}
                              >
                                이번 달 전체에 적용
                              </button>
                            </div>
                          </div>

                          <label
                            htmlFor="exclude-shift-holidays"
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '9px',
                              padding: '10px 12px',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              backgroundColor: formExcludeHolidays ? 'var(--primary-light)' : 'var(--bg-app)',
                              cursor: 'pointer'
                            }}
                          >
                            <input
                              id="exclude-shift-holidays"
                              type="checkbox"
                              checked={formExcludeHolidays}
                              onChange={(e) => setFormExcludeHolidays(e.target.checked)}
                              style={{ marginTop: '2px', cursor: 'pointer' }}
                            />
                            <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>
                                공휴일·대체공휴일 제외
                              </span>
                              <span style={{ fontSize: '10.5px', lineHeight: '1.4', color: 'var(--text-muted)' }}>
                                선택한 반복 요일이 공휴일 또는 대체공휴일이면 근무를 등록하지 않습니다.
                              </span>
                            </span>
                          </label>
                        </>
                      )}
                    </div>
                  )}

                  {!formShiftHasOvertime && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '10px' }}>
                      <button 
                        type="button"
                        className="add-overtime-btn"
                        onClick={() => {
                          setFormShiftHasOvertime(true);
                          const selectedPreset = Array.isArray(shifts) ? shifts.find(s => s.id === formShiftType) : null;
                          setFormShiftOvertime(selectedPreset?.defaultOvertime || 1);
                        }}
                      >
                        + 초과근무 입력 추가
                      </button>
                    </div>
                  )}

                  {formShiftHasOvertime && (
                    <div className="settings-form-row fade-in" style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="settings-label" style={{ fontWeight: '600' }}>초과 근무 시간</span>
                        <button 
                          type="button"
                          onClick={() => {
                            setFormShiftHasOvertime(false);
                            setFormShiftOvertime(0);
                          }}
                          style={{
                            fontSize: '11px',
                            color: '#ef4444',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600',
                            padding: '0'
                          }}
                        >
                          제거
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="number" 
                          step="0.5" 
                          min="0.5" 
                          max="24"
                          className="input-text" 
                          style={{ width: '85px', height: '34px', padding: '6px 12px' }}
                          placeholder="0"
                          value={formShiftOvertime}
                          onChange={(e) => setFormShiftOvertime(e.target.value)} 
                        />
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>시간 추가됨</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Form Content: Appointment */}
              {formType === 'appointment' && (
                <>
                  <div className="settings-form-row">
                    <span className="settings-label">일정 제목</span>
                    <input 
                      type="text" 
                      className="input-text" 
                      placeholder={formIsRange ? "제주도 가족 여행, 여름 휴가 등" : "친구랑 약속, 영화 관람 등"}
                      value={formAptTitle}
                      onChange={(e) => setFormAptTitle(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="toggle-switch-row" style={{ margin: '4px 0 10px 0' }}>
                    <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                      기간 설정
                    </span>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={formIsRange}
                        onChange={(e) => {
                          const nextIsRange = e.target.checked;
                          setFormIsRange(nextIsRange);
                        }}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  {formIsRange ? (
                    <>
                      <div className="responsive-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="settings-form-row">
                          <span className="settings-label">시작일</span>
                          <input 
                            type="date" 
                            className="input-text" 
                            value={formTripStart}
                            onChange={(e) => setFormTripStart(e.target.value)}
                            required 
                          />
                        </div>
                        <div className="settings-form-row">
                          <span className="settings-label">종료일</span>
                          <input 
                            type="date" 
                            className="input-text" 
                            value={formTripEnd}
                            onChange={(e) => setFormTripEnd(e.target.value)}
                            required 
                          />
                        </div>
                      </div>
                      
                      <div className="responsive-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="settings-form-row">
                          <span className="settings-label">장소</span>
                          <input 
                            type="text" 
                            className="input-text" 
                            placeholder="제주도 등"
                            value={formAptPlace}
                            onChange={(e) => setFormAptPlace(e.target.value)}
                          />
                        </div>
                        <div className="settings-form-row">
                          <span className="settings-label">배너 색상</span>
                          <div className="event-color-picker-row" style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                            {[
                              { value: 'blue', hex: '#3b82f6', label: '파란색' },
                              { value: 'purple', hex: '#a855f7', label: '보라색' },
                              { value: 'emerald', hex: '#10b981', label: '초록색' },
                              { value: 'orange', hex: '#f97316', label: '주황색' },
                              { value: 'pink', hex: '#ec4899', label: '분홍색' }
                            ].map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setFormTripColor(opt.value)}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  backgroundColor: opt.hex + '25',
                                  border: formTripColor === opt.value ? `2.5px solid ${opt.hex}` : `1px solid ${opt.hex}40`,
                                  padding: 0,
                                  cursor: 'pointer',
                                  transform: formTripColor === opt.value ? 'scale(1.2)' : 'scale(1)',
                                  transition: 'all 0.15s ease-in-out',
                                  outline: 'none',
                                  boxShadow: formTripColor === opt.value ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                                }}
                                title={opt.label}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="responsive-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="settings-form-row">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span className="settings-label" style={{ margin: 0 }}>시간</span>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '750', color: 'var(--text-main)', cursor: 'pointer' }}>
                              <input 
                                type="checkbox"
                                checked={formAptIsAllDay}
                                onChange={(e) => {
                                  setFormAptIsAllDay(e.target.checked);
                                  if (e.target.checked) {
                                    setFormAptTime('');
                                  } else {
                                    setFormAptTime('12:00');
                                  }
                                }}
                              />
                              <span>하루종일</span>
                            </label>
                          </div>
                          {!formAptIsAllDay ? (
                            <input 
                              type="time" 
                              className="input-text" 
                              value={formAptTime}
                              onChange={(e) => setFormAptTime(e.target.value)}
                              required 
                            />
                          ) : (
                            <div style={{ 
                              height: '35px', 
                              backgroundColor: 'var(--bg-app)', 
                              border: '1.5px solid var(--border-color)', 
                              borderRadius: 'var(--radius-sm)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              paddingLeft: '10px', 
                              fontSize: '11.5px', 
                              color: 'var(--text-muted)',
                              fontWeight: '600'
                            }}>
                              하루 종일 (시간 미지정)
                            </div>
                          )}
                        </div>
                        <div className="settings-form-row">
                          <span className="settings-label">장소</span>
                          <input 
                            type="text" 
                            className="input-text" 
                            placeholder="강남역 등"
                            value={formAptPlace}
                            onChange={(e) => setFormAptPlace(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="settings-form-row" style={{ marginTop: '10px' }}>
                        <span className="settings-label">일정 색상</span>
                        <div className="event-color-picker-row" style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                          {[
                            { value: 'blue', hex: '#3b82f6', label: '파란색' },
                            { value: 'purple', hex: '#a855f7', label: '보라색' },
                            { value: 'emerald', hex: '#10b981', label: '초록색' },
                            { value: 'orange', hex: '#f97316', label: '주황색' },
                            { value: 'pink', hex: '#ec4899', label: '분홍색' }
                          ].map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setFormTripColor(opt.value)}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: opt.hex + '25',
                                border: formTripColor === opt.value ? `2.5px solid ${opt.hex}` : `1px solid ${opt.hex}40`,
                                padding: 0,
                                cursor: 'pointer',
                                transform: formTripColor === opt.value ? 'scale(1.2)' : 'scale(1)',
                                transition: 'all 0.15s ease-in-out',
                                outline: 'none',
                                boxShadow: formTripColor === opt.value ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                              }}
                              title={opt.label}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="settings-form-row" style={{ marginTop: '10px' }}>
                        <span className="settings-label">표시 형태</span>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setFormAptDisplayMode('dot')}
                            style={{
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              padding: '12px',
                              borderRadius: '8px',
                              border: `2px solid ${formAptDisplayMode === 'dot' ? 'var(--primary)' : 'var(--border-color)'}`,
                              backgroundColor: formAptDisplayMode === 'dot' ? 'var(--primary-light)' : '#ffffff',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              outline: 'none'
                            }}
                          >
                            {/* Mini preview */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '10px',
                              color: '#334155',
                              padding: '6px 10px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '4px',
                              backgroundColor: '#ffffff',
                              width: '100%',
                              justifyContent: 'center'
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'inline-block' }}></span>
                              <span style={{ fontSize: '11px', fontWeight: '600' }}>일정 제목</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormAptDisplayMode('box')}
                            style={{
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              padding: '12px',
                              borderRadius: '8px',
                              border: `2px solid ${formAptDisplayMode === 'box' ? 'var(--primary)' : 'var(--border-color)'}`,
                              backgroundColor: formAptDisplayMode === 'box' ? 'var(--primary-light)' : '#ffffff',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              outline: 'none'
                            }}
                          >
                            {/* Mini preview */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '10px',
                              color: '#1e3a8a',
                              backgroundColor: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              borderLeft: '4px solid #3b82f6',
                              padding: '6px 10px 6px 8px',
                              borderRadius: '4px',
                              width: '100%',
                              justifyContent: 'center'
                            }}>
                              <span style={{ fontSize: '11px', fontWeight: '700' }}>일정 제목</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="toggle-switch-row">
                      <span className="settings-label">일정 알림</span>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={formEventAlarmEnabled}
                          onChange={(e) => setFormEventAlarmEnabled(e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    {formEventAlarmEnabled && (
                      <div className="settings-form-row fade-in">
                        <span className="settings-label">알림 날짜와 시간</span>
                        <input
                          type="datetime-local"
                          className="input-text"
                          value={formEventAlarmDateTime}
                          onChange={(e) => setFormEventAlarmDateTime(e.target.value)}
                          required
                        />
                        <span style={{ marginTop: '4px', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                          원하는 알림 날짜와 시간을 직접 선택하세요.
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <div className="toggle-switch-row">
                      <span className="settings-label">일정 공유</span>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={formShareScope !== 'private'}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormShareScope('public');
                              setFormSharePermission('view');
                              setFormSharedWithIds(sharedUsers.map(user => user.id));
                            } else {
                              setFormShareScope('private');
                              setFormSharedWithIds([]);
                            }
                          }}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    {formShareScope !== 'private' && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div className="settings-form-row">
                        <span className="settings-label">공유 권한</span>
                        <div className="solar-lunar-btn-group" style={{ marginTop: '6px' }}>
                          <button
                            type="button"
                            className={`solar-lunar-btn ${formSharePermission === 'view' ? 'active' : ''}`}
                            onClick={() => setFormSharePermission('view')}
                          >
                            보기만 가능
                          </button>
                          <button
                            type="button"
                            className={`solar-lunar-btn ${formSharePermission === 'edit' ? 'active' : ''}`}
                            onClick={() => setFormSharePermission('edit')}
                          >
                            수정·삭제 가능
                          </button>
                        </div>
                      </div>

                      {formShareScope !== 'private' && (
                        <div className="settings-form-row">
                          <span className="settings-label">공유 대상</span>
                          <div className="solar-lunar-btn-group" style={{ marginTop: '6px' }}>
                            <button
                              type="button"
                              className={`solar-lunar-btn ${formShareScope === 'public' ? 'active' : ''}`}
                              onClick={() => {
                                setFormShareScope('public');
                                setFormSharedWithIds(sharedUsers.map(user => user.id));
                              }}
                            >
                              모든 친구
                            </button>
                            <button
                              type="button"
                              className={`solar-lunar-btn ${formShareScope === 'custom' ? 'active' : ''}`}
                              onClick={() => setFormShareScope('custom')}
                            >
                              특정 친구
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Checkbox list of friends if custom is selected */}
                      {formShareScope === 'custom' && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingLeft: '20px', marginTop: '4px' }}>
                          {sharedUsers.map(user => {
                            const isChecked = formSharedWithIds.includes(user.id);
                            return (
                              <label key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer', backgroundColor: '#ffffff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setFormSharedWithIds(formSharedWithIds.filter(id => id !== user.id));
                                    } else {
                                      setFormSharedWithIds([...formSharedWithIds, user.id]);
                                    }
                                  }}
                                />
                                <span>{user.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {formShareScope !== 'private' && <div style={{ borderTop: '1px dashed #cbd5e1', marginTop: '6px', paddingTop: '8px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          새로운 공유인 추가 (해당 일정 공유)
                        </div>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input 
                            type="text"
                            placeholder="친구 이름"
                            className="input-text"
                            style={{ padding: '4px 8px', fontSize: '11px', height: '26px', flex: 2 }}
                            value={formInlineShareName}
                            onChange={(e) => setFormInlineShareName(e.target.value)}
                          />
                          <select 
                            style={{ padding: '2px 4px', fontSize: '11px', height: '26px', flex: 1.5, borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: '#ffffff' }}
                            value={formInlineShareRelation}
                            onChange={(e) => setFormInlineShareRelation(e.target.value)}
                          >
                            {relationGroups.map(group => (
                              <option key={group} value={group}>{group}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleAddInlineShareTarget}
                            style={{
                              padding: '4px 10px',
                              fontSize: '11px',
                              backgroundColor: 'var(--primary)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              height: '26px',
                              fontWeight: '600'
                            }}
                          >
                            추가
                          </button>
                        </div>
                      </div>}
                    </div>
                    )}
                  </div>
                </>
              )}

              {/* Form Content: Birthday */}
              {formType === 'birthday' && (
                <>
                  <div className="settings-form-row">
                    <span className="settings-label">이름</span>
                    <input
                      type="text"
                      className="input-text"
                      placeholder="예: 민지, 부모님"
                      value={formBdayName}
                      onChange={(e) => setFormBdayName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="settings-form-row">
                    <span className="settings-label">생일 날짜</span>
                    <input
                      type="date"
                      className="input-text"
                      value={formTripStart}
                      onChange={(e) => setFormTripStart(e.target.value)}
                      required
                    />
                  </div>

                  <div className="settings-form-row">
                    <span className="settings-label">달력 기준</span>
                    <div className="solar-lunar-btn-group" style={{ marginTop: '6px' }}>
                      <button
                        type="button"
                        className={`solar-lunar-btn ${!formBdayIsLunar ? 'active' : ''}`}
                        onClick={() => setFormBdayIsLunar(false)}
                      >
                        양력
                      </button>
                      <button
                        type="button"
                        className={`solar-lunar-btn ${formBdayIsLunar ? 'active' : ''}`}
                        onClick={() => setFormBdayIsLunar(true)}
                      >
                        음력
                      </button>
                    </div>
                  </div>

                  <div className="settings-form-row">
                    <span className="settings-label">표시 기간</span>
                    <div className="solar-lunar-btn-group" style={{ marginTop: '6px' }}>
                      <button
                        type="button"
                        className={`solar-lunar-btn ${!formBdayRepeatYearly ? 'active' : ''}`}
                        onClick={() => setFormBdayRepeatYearly(false)}
                      >
                        올해만 표시
                      </button>
                      <button
                        type="button"
                        className={`solar-lunar-btn ${formBdayRepeatYearly ? 'active' : ''}`}
                        onClick={() => setFormBdayRepeatYearly(true)}
                      >
                        매년 반복
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="toggle-switch-row">
                      <span className="settings-label">생일 알림</span>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={formEventAlarmEnabled}
                          onChange={(e) => setFormEventAlarmEnabled(e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    {formEventAlarmEnabled && (
                      <div className="settings-form-row fade-in">
                        <span className="settings-label">알림 날짜와 시간</span>
                        <input
                          type="datetime-local"
                          className="input-text"
                          value={formEventAlarmDateTime}
                          onChange={(e) => setFormEventAlarmDateTime(e.target.value)}
                          required
                        />
                        <span style={{ marginTop: '4px', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                          원하는 생일 알림 날짜와 시간을 직접 선택하세요.
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              </fieldset>

              <div className="dialog-footer">
                {isEventFormReadOnly ? (
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)} 
                    className="btn-secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    닫기 (읽기 전용)
                  </button>
                ) : (
                  <>
                    {editTarget && (
                      <button 
                        type="button" 
                        onClick={() => {
                          handleDeleteEvent(editTarget.id);
                          setShowAddModal(false);
                        }} 
                        style={{
                          marginRight: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#fee2e2',
                          color: '#ef4444',
                          border: '1px solid #fca5a5',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fecaca';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                        }}
                      >
                        <Trash2 size={14} />
                        <span>삭제</span>
                      </button>
                    )}
                    
                    <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                      취소
                    </button>
                    <button type="submit" className="btn-save" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} />
                      <span>저장</span>
                    </button>
                  </>
                )}
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
