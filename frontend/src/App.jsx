import React, { useState, useEffect } from 'react';
import SidebarLeft from './components/SidebarLeft';
import CalendarGrid from './components/CalendarGrid';
import SidebarRight from './components/SidebarRight';
import SettingsPanels from './components/SettingsPanels';
import StatsDashboard from './components/StatsDashboard';
import RecordsBoard from './components/RecordsBoard';

import { 
  Plus, 
  Trash2, 
  X, 
  User, 
  Lock, 
  Globe, 
  Smartphone, 
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
import { lunarToSolar } from './utils/lunarCalendar';
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
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('weplan_username') || '김소현';
  });

  const [userJob, setUserJob] = useState(() => {
    return localStorage.getItem('weplan_userjob') || '간호사';
  });

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
  const [settingsModalTab, setSettingsModalTab] = useState('schedule'); // 'schedule' | 'alarm' | 'birthday'
  const [rightSidebarWidth, setRightSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('weplan_right_sidebar_width');
    const parsed = saved ? parseInt(saved, 10) : 340;
    return (parsed >= 250 && parsed <= 600) ? parsed : 340;
  });
  const [showRightSidebar, setShowRightSidebar] = useState(() => {
    const saved = localStorage.getItem('weplan_show_right_sidebar');
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

  const [formType, setFormType] = useState('shift'); // shift, appointment
  const [formShiftType, setFormShiftType] = useState('day');
  const [formShiftRange, setFormShiftRange] = useState('single'); // single, custom
  const [formShiftDays, setFormShiftDays] = useState({ 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 0: false }); // 1: Mon, ..., 0: Sun
  const [formShiftScope, setFormShiftScope] = useState('month'); // week, month
  const [formShiftOvertime, setFormShiftOvertime] = useState(0); // overtime in hours
  const [formShiftHasOvertime, setFormShiftHasOvertime] = useState(false); // toggle for overtime
  const [formExcludeHolidays, setFormExcludeHolidays] = useState(false); // exclude holidays during batch shift registration
  const [formAptTitle, setFormAptTitle] = useState('');




  const [formAptTime, setFormAptTime] = useState('12:00');
  const [formAptPlace, setFormAptPlace] = useState('');
  const [formAptIsPrivate, setFormAptIsPrivate] = useState(false);
  const [formIsRange, setFormIsRange] = useState(false);
  const [formTripStart, setFormTripStart] = useState('');
  const [formTripEnd, setFormTripEnd] = useState('');
  const [formTripColor, setFormTripColor] = useState('blue');
  const [formAptDisplayMode, setFormAptDisplayMode] = useState('dot'); // 'dot' or 'box'
  const [calendarPerspective, setCalendarPerspective] = useState('me'); // 'me' | sharedUser.id
  const [formShareScope, setFormShareScope] = useState('public'); // 'public' | 'private' | 'custom'
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

          // Automatically clear shifts on newly detected holiday dates
          const holidayDates = Object.keys(mergedHols);
          setEvents(prevEvents => {
            const cleaned = prevEvents.filter(e => {
              if (e.type === 'shift' && holidayDates.includes(e.date)) {
                return false;
              }
              return true;
            });
            const removedCount = prevEvents.length - cleaned.length;
            if (removedCount > 0) {
              console.log(`[Holiday Sync] Removed ${removedCount} shifts because they fall on holidays.`);
            }
            return cleaned;
          });
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
    } else if (currentTab === 'schedule') {
      setCurrentTab('calendar');
      setSettingsModalTab('schedule');
      setShowSettingsModal(true);
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
    setFormAptPlace('');
    setFormAptIsPrivate(false);
    setFormIsRange(false);
    setFormTripStart(dateStr);
    setFormTripEnd(dateStr);
    setFormTripColor('blue');
    setFormAptDisplayMode('dot');
    setFormShareScope('public');
    setFormSharedWithIds(sharedUsers.map(u => u.id));
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
    } else if (evt.type === 'trip') {
      setFormType('appointment');
      setFormIsRange(true);
      setFormTripStart(evt.startDate || evt.date || selectedDay);
      setFormTripEnd(evt.endDate || evt.date || selectedDay);
      setFormTripColor(evt.color || 'blue');
      setFormAptTitle(evt.title || '');
      setFormAptTime('12:00');
      setFormAptPlace(evt.place || '');
      setFormAptIsPrivate(false);
    } else {
      setFormType('appointment');
      setFormIsRange(false);
      setFormTripStart(evt.date || selectedDay);
      setFormTripEnd(evt.date || selectedDay);
      setFormTripColor(evt.color || 'blue');
      setFormAptTitle(evt.title || '');
      setFormAptTime(evt.time || '12:00');
      setFormAptPlace(evt.place || '');
      setFormAptIsPrivate(evt.isPrivate || false);
      setFormAptDisplayMode(evt.displayMode || 'dot');
    }
    const scope = evt.shareScope || (evt.isPrivate ? 'private' : 'public');
    const sharedWith = evt.sharedWith || (evt.isPrivate ? [] : sharedUsers.map(u => u.id));
    setFormShareScope(scope);
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
              sharedWith: formSharedWithIds,
              isPrivate: formShareScope === 'private'
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
              sharedWith: formSharedWithIds,
              color: formTripColor
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
        
        if (formShiftRange === 'custom') {
          const activeDays = Object.keys(formShiftDays)
            .filter(day => formShiftDays[day] === true)
            .map(Number);
          
          if (activeDays.length === 0) {
            alert('최소 하나 이상의 요일을 선택해 주세요.');
            return;
          }
          
          targetDates = [];
          
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
                
                const isHoliday = holidaysMap[dateStr] || getHoliday(dateStr);
                if (formExcludeHolidays && isHoliday) continue;
                
                targetDates.push(dateStr);
              }
            }
          }
        }
        
        setEvents(prev => {
          const filtered = prev.filter(e => !(targetDates.includes(e.date) && e.type === 'shift' && e.shiftType === formShiftType));
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
      } else if (formIsRange) {
        newEvent.type = 'trip';
        newEvent.title = formAptTitle;
        newEvent.startDate = formTripStart;
        newEvent.endDate = formTripEnd;
        newEvent.place = formAptPlace;
        newEvent.color = formTripColor;
        newEvent.shareScope = formShareScope;
        newEvent.sharedWith = formSharedWithIds;
        newEvent.isPrivate = formShareScope === 'private';
      } else {
        newEvent.type = 'appointment';
        newEvent.date = selectedDay;
        newEvent.title = formAptTitle;
        newEvent.time = formAptTime;
        newEvent.place = formAptPlace;
        newEvent.isPrivate = formShareScope === 'private';
        newEvent.displayMode = formAptDisplayMode;
        newEvent.shareScope = formShareScope;
        newEvent.sharedWith = formSharedWithIds;
        newEvent.color = formTripColor;
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
      alarmWeekBefore: bdayData.alarmWeekBefore
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

  // Filter regular appointments for mock details on mobile simulator
  const activeApt = events.find(e => e.id === 'apt-3') || INITIAL_EVENTS[2];

  const selectedPerspectiveUser = sharedUsers.find(u => u.id === calendarPerspective);
  const isReadOnlyPerspective = calendarPerspective !== 'me' && (!selectedPerspectiveUser || !selectedPerspectiveUser.privilege.includes('편집'));

  return (
    <div 
      className={`app-container ${
        currentTab === 'settings' || currentTab === 'stats' 
          ? 'settings-active' 
          : ''
      }`}
      style={{
        '--right-sidebar-width': showRightSidebar ? `${rightSidebarWidth}px` : '0px'
      }}
    >
      {/* 3. Left Sidebar Navigation */}
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
      />


      {/* 1. Right Sidebar Detail */}
      {currentTab !== 'settings' && currentTab !== 'stats' && showRightSidebar && (
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
            settings={settings}
            memos={memos}
            setMemos={setMemos}
            todos={todos}
            setTodos={setTodos}
          />
        </div>
      )}

      {/* 2. Main Center Body */}
      <main className="main-content">
        {currentTab === 'settings' ? (
          <div className="settings-page-wrapper fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 0' }}>
            <div className="settings-header" style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={22} color="var(--primary)" />
                설정
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                캘린더 표시 및 연동 설정을 구성합니다.
              </p>
            </div>

            <div style={{ maxWidth: '360px' }}>
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
        ) : currentTab === 'stats' ? (
          <StatsDashboard 
            events={events}
            shifts={shifts}
            currentDate={currentDate}
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

            {/* Mobile Mockup Simulator title */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Smartphone size={20} color="var(--primary)" />
                모바일 화면 시뮬레이터 (MyShift 앱 반응형)
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                하단 폰 화면에서 모바일 버전의 스케줄 확인 및 상세 일정/알림 조회를 모의 테스트해보세요.
              </p>
            </div>

            {/* Mobile View Mockup (Double frames side-by-side or toggled) */}
            <div className="mobile-simulator-layout">
              {/* Phone 1: Mobile Calendar List */}
              <div className="phone-container">
                <div className="phone-header">
                  <span>9:41</span>
                  <span style={{ fontSize: '11px' }}>{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월 ▾</span>
                  <span>🔋 📶</span>
                </div>
                
                <div className="phone-screen" style={{ backgroundColor: '#f8fafc' }}>
                  <div className="phone-body">
                    {/* Mobile Shift header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', flexWrap: 'wrap', gap: '4px' }}>
                      {Array.isArray(shifts) && shifts.map(s => (
                        <span key={s.id} className="legend-badge" style={{ backgroundColor: s.color + '20', color: s.color }}>{s.label}</span>
                      ))}
                      <span className="legend-badge" style={{ backgroundColor: 'var(--apt-bg)', color: 'var(--apt-text)' }}>약속</span>
                    </div>

                    {/* Mobile week bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', padding: '10px 4px', boxShadow: 'var(--shadow-sm)' }}>
                      {['일', '월', '화', '수', '목', '금', '토'].map((w, idx) => (
                        <span key={idx} style={{ fontSize: '11px', color: idx === 0 ? '#ef4444' : (idx === 6 ? '#3b82f6' : 'var(--text-muted)') }}>{w}</span>
                      ))}
                      {/* Mock week 12-18 */}
                      {[12, 13, 14, 15, 16, 17, 18].map(day => (
                        <span key={day} style={{ 
                          fontSize: '13px', 
                          fontWeight: '700', 
                          marginTop: '6px',
                          padding: '4px',
                          borderRadius: '50%',
                          backgroundColor: day === 15 ? 'var(--primary)' : 'transparent',
                          color: day === 15 ? '#ffffff' : 'inherit'
                        }}>
                          {day}
                        </span>
                      ))}
                    </div>

                    {/* Mobile daily timeline (May 15) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>07:00</div>
                      {shifts[0] && (
                        <div style={{ 
                          backgroundColor: shifts[0].color + '15', 
                          color: shifts[0].color, 
                          padding: '10px 14px', 
                          borderRadius: '12px', 
                          borderLeft: `4px solid ${shifts[0].color}` 
                        }}>
                          <div style={{ fontWeight: '700', fontSize: '13px' }}>{shifts[0].label} 근무</div>
                          <span style={{ fontSize: '11px' }}>{shifts[0].start} - {shifts[0].end} (지정 근무)</span>
                        </div>
                      )}

                      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginTop: '8px' }}>12:30</div>
                      <div style={{ backgroundColor: 'var(--apt-bg)', color: 'var(--apt-text)', padding: '10px 14px', borderRadius: '12px', borderLeft: '4px solid var(--apt-dot)' }}>
                        <div style={{ fontWeight: '700', fontSize: '13px' }}>친구랑 점심</div>
                        <span style={{ fontSize: '11px' }}>12:30 - 13:30 @ 강남역 맛집</span>
                      </div>

                      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginTop: '8px' }}>18:00</div>
                      <div style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '10px 14px', borderRadius: '12px' }}>
                        <div style={{ fontWeight: '700', fontSize: '13px' }}>헬스</div>
                        <span style={{ fontSize: '11px' }}>18:00 - 19:30 @ 헬스장</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile bottom navigation */}
                <div style={{ display: 'flex', justifyContent: 'space-around', padding: '10px 0', borderTop: '1px solid var(--border-color)', backgroundColor: '#ffffff', fontSize: '10px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--primary)' }}>
                    <span>📅</span>
                    <span>캘린더</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span>📋</span>
                    <span>일정</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span>🔔</span>
                    <span>알림</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span>👥</span>
                    <span>공유</span>
                  </div>
                </div>
              </div>

              {/* Phone 2: Mobile Event Details */}
              <div className="phone-container">
                <div className="phone-header">
                  <span>9:41</span>
                  <span style={{ fontWeight: '700' }}>일정 상세</span>
                  <span>🔋 📶</span>
                </div>

                <div className="phone-screen">
                  <div className="phone-body">
                    {/* Tabs */}
                    <div className="detail-tab-row">
                      <div className="detail-tab">일 (근무)</div>
                      <div className="detail-tab active">약속</div>
                    </div>

                    {/* Event Header */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{activeApt.title}</h2>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        <span>
                          {(() => {
                            if (!activeApt.date) return '';
                            const activeDate = new Date(activeApt.date + "T00:00:00");
                            const mm = String(activeDate.getMonth() + 1).padStart(2, '0');
                            const dd = String(activeDate.getDate()).padStart(2, '0');
                            const dayName = activeDate.toLocaleDateString('ko-KR', { weekday: 'short' });
                            return `${activeDate.getFullYear()}.${mm}.${dd} (${dayName})`;
                          })()} {activeApt.time} - 13:30
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} />
                        <span>{activeApt.place}</span>
                      </div>
                    </div>

                    {/* Participants */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>참여자</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {activeApt.participants ? activeApt.participants.map((p, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <img 
                              src={p.avatar} 
                              alt={p.name} 
                              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} 
                            />
                            <span style={{ fontSize: '10px' }}>{p.name}</span>
                          </div>
                        )) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>나 단독 일정</span>
                        )}
                        <button 
                          style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyStyle: 'center', fontSize: '16px', color: 'var(--text-muted)', justifyContent: 'center' }}
                          onClick={handleInviteFriend}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Alarm Settings simulator */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>알람 설정</span>
                      
                      <div className="toggle-switch-row">
                        <span>전날 18:00 알람</span>
                        <label className="switch">
                          <input type="checkbox" defaultChecked />
                          <span className="slider"></span>
                        </label>
                      </div>

                      <div className="toggle-switch-row">
                        <span>1시간 전 알림</span>
                        <label className="switch">
                          <input type="checkbox" />
                          <span className="slider"></span>
                        </label>
                      </div>
                    </div>

                    {/* Repeat settings */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span>반복</span>
                      <span style={{ color: 'var(--text-muted)' }}>반복 안함 ❯</span>
                    </div>

                    {/* Edit / Delete footer */}
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                      <button 
                        className="btn-secondary" 
                        style={{ flex: 1, padding: '10px' }}
                        onClick={() => alert('삭제는 상단 데스크탑 상세창에서 가능합니다.')}
                      >
                        삭제
                      </button>
                      <button 
                        className="btn-save" 
                        style={{ flex: 2, padding: '10px' }}
                        onClick={() => alert('수정은 상단 데스크탑 상세창에서 가능합니다.')}
                      >
                        수정
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
          ? (evt.isLunar ? '음력 생일' : '양력 생일')
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
              {!isReadOnlyPerspective && !isBirthday && (
                <div style={{
                  padding: '12px 20px 20px 20px',
                  display: 'flex', gap: '8px', justifyContent: 'flex-end',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <button
                    onClick={() => {
                      setViewTarget(null);
                      handleDeleteEvent(evt.id);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '8px 14px', borderRadius: '8px',
                      backgroundColor: '#fee2e2', color: '#ef4444',
                      border: '1px solid #fca5a5', cursor: 'pointer',
                      fontSize: '13px', fontWeight: '600'
                    }}
                  >
                    <Trash2 size={13} />
                    삭제
                  </button>
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
                <Settings size={18} color="var(--primary)" />
                <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>설정</span>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px', marginBottom: '12px' }}>
              <button 
                onClick={() => setSettingsModalTab('schedule')} 
                className={`view-toggle-btn ${settingsModalTab === 'schedule' ? 'active' : ''}`}
                style={{ flex: 1, padding: '6px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}
              >
                근무 유형
              </button>
              <button 
                onClick={() => setSettingsModalTab('alarm')} 
                className={`view-toggle-btn ${settingsModalTab === 'alarm' ? 'active' : ''}`}
                style={{ flex: 1, padding: '6px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}
              >
                알림 설정
              </button>
              <button 
                onClick={() => setSettingsModalTab('birthday')} 
                className={`view-toggle-btn ${settingsModalTab === 'birthday' ? 'active' : ''}`}
                style={{ flex: 1, padding: '6px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}
              >
                생일 설정
              </button>
            </div>

            {/* Content: SettingsPanels */}
            <div style={{ flex: 1 }}>
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
                onlyBirthdaySettings={settingsModalTab === 'birthday'}
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

      {/* 4. Add/Edit Shift or Appointment Modal overlay */}
      {showAddModal && (
        <div className="dialog-overlay" onClick={() => setShowAddModal(false)}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
                {editTarget ? '일정 수정하기' : `${selectedDay} 일정 추가`}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="nav-btn">
                <X size={18} />
              </button>
            </div>

            {isReadOnlyPerspective && (
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
              <fieldset disabled={isReadOnlyPerspective} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Type Switch (Only show if not editing or editing a non-trip event) */}
              {!editTarget && (
                <div className="solar-lunar-btn-group">
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
                  <div className="toggle-switch-row" style={{ margin: '4px 0 10px 0' }}>
                    <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                      기간 설정
                    </span>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={formIsRange}
                        onChange={(e) => setFormIsRange(e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

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

                  {formIsRange ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                          <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="settings-form-row">
                          <span className="settings-label">시간</span>
                          <input 
                            type="time" 
                            className="input-text" 
                            value={formAptTime}
                            onChange={(e) => setFormAptTime(e.target.value)}
                            required 
                        />
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
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
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

                  <div className="settings-form-row" style={{ marginTop: '10px' }}>
                    <span className="settings-label" style={{ fontWeight: '700', marginBottom: '6px', display: 'block' }}>
                      공유 범위 설정 (일정 공개 대상)
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      {/* Option 1: 나만 보기 */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="shareScope" 
                          checked={formShareScope === 'private'}
                          onChange={() => {
                            setFormShareScope('private');
                            setFormSharedWithIds([]);
                          }}
                        />
                        <span>나만 보기 (비공개)</span>
                      </label>

                      {/* Option 2: 전체 공개 */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="shareScope" 
                          checked={formShareScope === 'public'}
                          onChange={() => {
                            setFormShareScope('public');
                            setFormSharedWithIds(sharedUsers.map(u => u.id));
                          }}
                        />
                        <span>전체 공개 (연동된 모든 친구)</span>
                      </label>

                      {/* Option 3: 특정 친구 선택 */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="shareScope" 
                          checked={formShareScope === 'custom'}
                          onChange={() => setFormShareScope('custom')}
                        />
                        <span>특정 친구 지정</span>
                      </label>

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

                      <div style={{ borderTop: '1px dashed #cbd5e1', marginTop: '6px', paddingTop: '8px' }}>
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
                      </div>
                    </div>
                  </div>
                </>
              )}

              </fieldset>

              <div className="dialog-footer">
                {isReadOnlyPerspective ? (
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
