import React, { useState, useEffect } from 'react';
import SidebarLeft from './components/SidebarLeft';
import CalendarGrid from './components/CalendarGrid';
import SidebarRight from './components/SidebarRight';
import SettingsPanels from './components/SettingsPanels';
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
  HelpCircle,
  Clock,
  MapPin,
  Check
} from 'lucide-react';
import { lunarToSolar } from './utils/lunarCalendar';
import { fetchHolidays } from './utils/holidays';
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
  { id: 'user-1', name: '민지', relation: '연인 ❤️', privilege: '보기 가능', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=80&auto=format&fit=crop', isSharing: true },
  { id: 'user-2', name: '가족', relation: '가족 🏠', privilege: '편집 가능', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=80&auto=format&fit=crop', isSharing: true },
  { id: 'user-3', name: '현지', relation: '친구 👭', privilege: '보기 가능', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=80&auto=format&fit=crop', isSharing: true }
];

export default function App() {
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
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_EVENTS;
  });

  const [sharedUsers, setSharedUsers] = useState(() => {
    const saved = localStorage.getItem('weplan_shared_users');
    if (saved && saved !== 'undefined') {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_SHARED_USERS;
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
      showKoreanHolidays: true,
      showAlternativeHolidays: true,
      showLunarAnniversaries: true,
      showMyAnniversaries: false
    };
  });

  // UI Control states
  const [currentTab, setCurrentTab] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date(2024, 4, 15)); // Default to May 2024
  const [viewMode, setViewMode] = useState('month'); // month, week, day, list
  
  // Custom display settings: Work representation & Appointment representation
  const [workViewMode, setWorkViewMode] = useState('badge'); // 'full' (하루전체네모칸) or 'badge' (네모박스/배지)
  const [aptViewMode, setAptViewMode] = useState('dot'); // 'dot' (원/점) or 'box' (네모박스)

  const [selectedDay, setSelectedDay] = useState('2024-05-15');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  // Form states for Add/Edit Modal
  const [formType, setFormType] = useState('shift'); // shift, appointment
  const [formShiftType, setFormShiftType] = useState('day');
  const [formAptTitle, setFormAptTitle] = useState('');
  const [formAptTime, setFormAptTime] = useState('12:00');
  const [formAptPlace, setFormAptPlace] = useState('');
  const [formAptIsPrivate, setFormAptIsPrivate] = useState(false);
  const [formIsRange, setFormIsRange] = useState(false);
  const [formTripStart, setFormTripStart] = useState('');
  const [formTripEnd, setFormTripEnd] = useState('');
  const [formTripColor, setFormTripColor] = useState('blue');

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
          setHolidaysMap(prev => ({
            ...prev,
            ...prevHols,
            ...currHols,
            ...nextHols
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
        showKoreanHolidays: true,
        showAlternativeHolidays: true,
        showLunarAnniversaries: true,
        showMyAnniversaries: false,
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
        return saved ? JSON.parse(saved) : INITIAL_EVENTS;
      })();
      const eventsData = await api.getEvents(localEventsFallback);
      const mappedEvents = eventsData.map(evt => {
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

  // Add Event trigger
  const handleOpenAddModal = (dateStr) => {
    setSelectedDay(dateStr);
    setEditTarget(null);
    setFormType('appointment');
    setFormShiftType(shifts[0]?.id || 'day');
    setFormAptTitle('');
    setFormAptTime('12:00');
    setFormAptPlace('');
    setFormAptIsPrivate(false);
    setFormIsRange(false);
    setFormTripStart(dateStr);
    setFormTripEnd(dateStr);
    setFormTripColor('blue');
    setShowAddModal(true);
  };

  // Edit Event trigger
  const handleEditEvent = (evt) => {
    setEditTarget(evt);
    if (evt.type === 'shift') {
      setFormType('shift');
      setFormShiftType(evt.shiftType);
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
      setFormTripColor('blue');
      setFormAptTitle(evt.title || '');
      setFormAptTime(evt.time || '12:00');
      setFormAptPlace(evt.place || '');
      setFormAptIsPrivate(evt.isPrivate || false);
    }
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
    if (editTarget) {
      // Edit
      setEvents(prev => prev.map(evt => {
        if (evt.id === editTarget.id) {
          if (formType === 'shift') {
            return { ...evt, shiftType: formShiftType, type: 'shift' };
          } else if (formIsRange) {
            return { 
              ...evt, 
              type: 'trip',
              title: formAptTitle, 
              startDate: formTripStart,
              endDate: formTripEnd,
              place: formAptPlace,
              color: formTripColor,
              date: undefined
            };
          } else {
            return { 
              ...evt, 
              type: 'appointment',
              title: formAptTitle, 
              time: formAptTime, 
              place: formAptPlace,
              isPrivate: formAptIsPrivate,
              date: editTarget.date || selectedDay,
              startDate: undefined,
              endDate: undefined
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
        newEvent.type = 'shift';
        newEvent.date = selectedDay;
        // Remove existing shift on this day (since nurse can have one shift per day)
        setEvents(prev => prev.filter(e => !(e.date === selectedDay && e.type === 'shift')));
        newEvent.shiftType = formShiftType;
      } else if (formIsRange) {
        newEvent.type = 'trip';
        newEvent.title = formAptTitle;
        newEvent.startDate = formTripStart;
        newEvent.endDate = formTripEnd;
        newEvent.place = formAptPlace;
        newEvent.color = formTripColor;
      } else {
        newEvent.type = 'appointment';
        newEvent.date = selectedDay;
        newEvent.title = formAptTitle;
        newEvent.time = formAptTime;
        newEvent.place = formAptPlace;
        newEvent.isPrivate = formAptIsPrivate;
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

  return (
    <div className="app-container">
      {/* 1. Left Sidebar Navigation */}
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
      />

      {/* 2. Main Center Body */}
      <main className="main-content">
        <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '11px', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto', marginBottom: '10px' }}>
          <strong>[Debug Events]</strong> {JSON.stringify(events.map(e => ({ id: e.id, type: e.type, title: e.title || e.name, date: e.date, startDate: e.startDate, endDate: e.endDate })), null, 2)}
        </div>
        
        {/* Style View Customizer (Wow/Premium control banner) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          borderLeft: '4px solid var(--primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--primary)" />
            <span style={{ fontSize: '14px', fontWeight: '700' }}>캘린더 시각 요소 맞춤설정</span>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* Appointment style */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>약속 표시 형태:</span>
              <div className="header-view-toggle" style={{ margin: 0, padding: '2px' }}>
                <button 
                  onClick={() => setAptViewMode('dot')} 
                  className={`view-toggle-btn ${aptViewMode === 'dot' ? 'active' : ''}`}
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  원 (점)
                </button>
                <button 
                  onClick={() => setAptViewMode('box')} 
                  className={`view-toggle-btn ${aptViewMode === 'box' ? 'active' : ''}`}
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  네모 상자
                </button>
                <button 
                  onClick={() => setAptViewMode('both')} 
                  className={`view-toggle-btn ${aptViewMode === 'both' ? 'active' : ''}`}
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  원 + 네모
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid component */}
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
          onSelectDay={setSelectedDay}
          selectedDay={selectedDay}
          onAddEventClick={handleOpenAddModal}
          isPrivateMode={isPrivateMode}
          holidaysMap={holidaysMap}
        />

        {/* Bottom Configuration Panels */}
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
          onAddTripConnection={handleAddTripConnection}
          trips={currentTrips}
          onDisconnectTrip={handleDisconnectTrip}
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
              <span style={{ fontSize: '11px' }}>2024년 5월 ▾</span>
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
                    <span>2024.05.15 (수) {activeApt.time} - 13:30</span>
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
                    <label className="switch" style={{ width: '36px', height: '20px' }}>
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="toggle-switch-row">
                    <span>1시간 전 알림</span>
                    <label className="switch" style={{ width: '36px', height: '20px' }}>
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

      </main>

      {/* 3. Right Sidebar Detail */}
      <SidebarRight 
        selectedDateStr={selectedDay}
        events={events}
        shifts={shifts}
        onAddEventClick={handleOpenAddModal}
        onEditEvent={handleEditEvent}
        onDeleteEvent={handleDeleteEvent}
        isPrivateMode={isPrivateMode}
        holidaysMap={holidaysMap}
      />

      {/* 4. Add/Edit Shift or Appointment Modal overlay */}
      {showAddModal && (
        <div className="dialog-overlay">
          <div className="dialog-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
                {editTarget ? '일정 수정하기' : `${selectedDay} 일정 추가`}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="nav-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Type Switch (Only show if not editing or editing a non-trip event) */}
              {!editTarget && (
                <div className="solar-lunar-btn-group">
                  <button 
                    type="button" 
                    className={`solar-lunar-btn ${formType === 'shift' ? 'active' : ''}`}
                    onClick={() => setFormType('shift')}
                  >
                    근무 스케줄 (간호사)
                  </button>
                  <button 
                    type="button" 
                    className={`solar-lunar-btn ${formType === 'appointment' ? 'active' : ''}`}
                    onClick={() => setFormType('appointment')}
                  >
                    개인 약속 / 행사
                  </button>
                </div>
              )}

              {/* Form Content: Shift */}
              {formType === 'shift' && (
                <div className="settings-form-row">
                  <span className="settings-label">근무 타입 선택</span>
                  <select 
                    value={formShiftType} 
                    onChange={(e) => setFormShiftType(e.target.value)}
                  >
                    {Array.isArray(shifts) && shifts.map(shift => (
                      <option key={shift.id} value={shift.id}>
                        {shift.label} ({shift.start} ~ {shift.end})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Form Content: Appointment */}
              {formType === 'appointment' && (
                <>
                  <div className="toggle-switch-row" style={{ margin: '4px 0 10px 0' }}>
                    <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                      📅 여러 날짜에 걸친 일정 (기간 설정)
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
                          <select 
                            value={formTripColor}
                            onChange={(e) => setFormTripColor(e.target.value)}
                            className="input-text"
                            style={{ height: '38px', padding: '0 10px' }}
                          >
                            <option value="blue">파란색 (기본)</option>
                            <option value="purple">보라색</option>
                            <option value="emerald">초록색</option>
                          </select>
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

                      <div className="toggle-switch-row" style={{ marginTop: '4px' }}>
                        <span className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🔒 일정 나만 보기 (공유 시 비공개)
                        </span>
                        <label className="switch">
                          <input 
                            type="checkbox" 
                            checked={formAptIsPrivate}
                            onChange={(e) => setFormAptIsPrivate(e.target.checked)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="dialog-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  취소
                </button>
                <button type="submit" className="btn-save" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={14} />
                  <span>저장</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
