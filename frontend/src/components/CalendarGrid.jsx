import React, { useState, useEffect, useRef } from 'react';
import { getLunarDate, lunarToSolar } from '../utils/lunarCalendar';
import { getHoliday } from '../utils/holidays';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, MapPin, Sparkles, Cake, Menu, PanelRight, PanelRightClose } from 'lucide-react';

export default function CalendarGrid({ 
  currentDate, 
  setCurrentDate, 
  events: rawEvents, 
  shifts, 
  settings, 
  viewMode, 
  setViewMode, 
  workViewMode, // 'full' (하루전체네모칸) or 'badge' (네모박스/배지)
  aptViewMode,  // 'dot' (원/점) or 'box' (네모박스)
  onMoveEvent, 
  onSelectDay,
  selectedDay,
  onAddEventClick,
  onEditEvent,
  isPrivateMode,
  holidaysMap = {},
  calendarPerspective,
  setCalendarPerspective,
  sharedUsers,
  isReadOnlyPerspective,
  showRightSidebar,
  setShowRightSidebar,
  currentTab,
  primaryShiftMap = {},
  setPrimaryShiftMap
}) {
  const [draggedEventId, setDraggedEventId] = useState(null);
  const yearMenuRef = useRef(null);
  const monthMenuRef = useRef(null);

  // Filter events based on perspective
  const events = rawEvents.filter(evt => {
    if (evt.type === 'shift') return true;
    if (evt.type === 'birthday') return true;
    
    const scope = evt.shareScope || (evt.isPrivate ? 'private' : 'public');
    const sharedWith = evt.sharedWith || [];
    
    if (calendarPerspective === 'me') {
      return true; // Owner sees everything
    } else {
      if (scope === 'private') return false;
      if (scope === 'public') return true;
      if (scope === 'custom') return sharedWith.includes(calendarPerspective);
      return true;
    }
  });

  const getShareIcon = (evt) => {
    if (calendarPerspective !== 'me') return '';
    const scope = evt.shareScope || (evt.isPrivate ? 'private' : 'public');
    if (scope === 'private') return '🔒 ';
    if (scope === 'custom') return '';
    return '';
  };

  const renderSharedAvatars = (evt) => {
    if (evt.shareScope !== 'custom' || !evt.sharedWith || evt.sharedWith.length === 0) return null;
    const sharedFriends = (sharedUsers || []).filter(u => evt.sharedWith.includes(u.id));
    if (sharedFriends.length === 0) return null;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', marginLeft: '4px', verticalAlign: 'middle', flexShrink: 0 }}>
        {sharedFriends.map(friend => {
          const titleText = `${friend.name} (${friend.relation})`;
          return (
            <span
              key={friend.id}
              title={titleText}
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: '#cbd5e1',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 'bold',
                color: '#1e293b',
                border: '1px solid rgba(255,255,255,0.8)',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              {friend.avatar ? (
                <img
                  src={friend.avatar}
                  alt={friend.name}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                friend.name.substring(0, 1)
              )}
            </span>
          );
        })}
      </span>
    );
  };

  const getDotColor = (color) => {
    if (color === 'purple') return '#a855f7';
    if (color === 'emerald') return '#10b981';
    if (color === 'orange') return '#f97316';
    if (color === 'pink') return '#ec4899';
    return '#3b82f6'; // default/blue
  };

  const getBoxColorStyles = (color) => {
    let bg = '#eff6ff';
    let text = '#1e3a8a';
    let border = '#3b82f6';
    let borderOuter = '#bfdbfe';
    if (color === 'purple') { bg = '#f3e8ff'; text = '#6b21a8'; border = '#a855f7'; borderOuter = '#d8b4fe'; }
    else if (color === 'emerald') { bg = '#dcfce7'; text = '#166534'; border = '#10b981'; borderOuter = '#a7f3d0'; }
    else if (color === 'orange') { bg = '#ffedd5'; text = '#c2410c'; border = '#f97316'; borderOuter = '#fed7aa'; }
    else if (color === 'pink') { bg = '#fce7f3'; text = '#be185d'; border = '#ec4899'; borderOuter = '#fbcfe8'; }
    return { 
      backgroundColor: bg, 
      color: text, 
      border: `1px solid ${borderOuter}`,
      borderLeft: `4px solid ${border}`,
      fontWeight: '700'
    };
  };

  const getBirthdaySolarDateForYear = (evt, targetYear) => {
    if (evt.isLunar) {
      let bdayLunar = getLunarDate(evt.date);
      if (!bdayLunar) {
        bdayLunar = getLunarDate(`2024-${evt.date.slice(5)}`);
      }
      if (bdayLunar) {
        const clean = bdayLunar.replace("음력 ", "");
        const isLeap = clean.startsWith("윤");
        const parts = clean.replace("윤", "").split(".");
        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        const solar = lunarToSolar(targetYear, month, day, isLeap);
        if (solar) return solar;
      }
      return `${targetYear}-${evt.date.slice(5)}`;
    } else {
      return `${targetYear}-${evt.date.slice(5)}`;
    }
  };

  const [dragOverDate, setDragOverDate] = useState(null);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);

  useEffect(() => {
    if (isYearOpen && yearMenuRef.current) {
      const activeEl = yearMenuRef.current.querySelector('.dropdown-item.active');
      if (activeEl) {
        const container = yearMenuRef.current;
        container.scrollTop = activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2;
      }
    }
  }, [isYearOpen]);

  useEffect(() => {
    if (isMonthOpen && monthMenuRef.current) {
      const activeEl = monthMenuRef.current.querySelector('.dropdown-item.active');
      if (activeEl) {
        const container = monthMenuRef.current;
        container.scrollTop = activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2;
      }
    }
  }, [isMonthOpen]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation
  const prevMonth = () => {
    if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };
  const nextMonth = () => {
    if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };
  const goToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const dayCells = [];

  // Previous month padding days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonthDate = new Date(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, d);
    dayCells.push({
      date: prevMonthDate,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const currentMonthDate = new Date(year, month, d);
    dayCells.push({
      date: currentMonthDate,
      isCurrentMonth: true
    });
  }

  // Next month padding days (up to grid total of 35 or 42)
  const totalGridDays = dayCells.length <= 35 ? 35 : 42;
  const nextMonthPadding = totalGridDays - dayCells.length;
  for (let d = 1; d <= nextMonthPadding; d++) {
    const nextMonthDate = new Date(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, d);
    dayCells.push({
      date: nextMonthDate,
      isCurrentMonth: false
    });
  }

  // Format date to YYYY-MM-DD helper (accounting for timezone offset)
  const formatDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  // Group dayCells into weeks and calculate vertical alignment slot indices for each event
  const weeksCount = dayCells.length / 7;
  const weeksEventsSlots = [];

  for (let w = 0; w < weeksCount; w++) {
    const weekDays = dayCells.slice(w * 7, (w + 1) * 7);
    const uniqueWeekEventIds = new Set();
    const weekEventsList = [];

    weekDays.forEach(dayCell => {
      const dateStr = formatDateString(dayCell.date);
      const dayEvts = events.filter(evt => {
        if (evt.type === 'shift') return false;
        if (evt.startDate && evt.endDate) {
          return dateStr >= evt.startDate && dateStr <= evt.endDate;
        }
        if (evt.type === 'birthday') {
          const targetYear = parseInt(dateStr.slice(0, 4), 10);
          return getBirthdaySolarDateForYear(evt, targetYear) === dateStr;
        }
        return evt.date === dateStr;
      });

      dayEvts.forEach(evt => {
        if (!uniqueWeekEventIds.has(evt.id)) {
          uniqueWeekEventIds.add(evt.id);
          weekEventsList.push(evt);
        }
      });
    });

    // Sort: multi-day first, then longer first, then earlier start first, then birthdays, then appointments
    weekEventsList.sort((a, b) => {
      const aIsMulti = !!(a.startDate && a.endDate);
      const bIsMulti = !!(b.startDate && b.endDate);

      if (aIsMulti && !bIsMulti) return -1;
      if (!aIsMulti && bIsMulti) return 1;

      if (aIsMulti && bIsMulti) {
        if (a.startDate !== b.startDate) {
          return a.startDate.localeCompare(b.startDate);
        }
        const aDuration = new Date(a.endDate) - new Date(a.startDate);
        const bDuration = new Date(b.endDate) - new Date(b.startDate);
        if (aDuration !== bDuration) {
          return bDuration - aDuration; // longer first
        }
      }

      if (a.type === 'birthday' && b.type !== 'birthday') return -1;
      if (a.type !== 'birthday' && b.type === 'birthday') return 1;

      return (a.title || a.name || '').localeCompare(b.title || b.name || '');
    });

    const slots = {};
    const occupiedSlotsByDay = Array.from({ length: 7 }, () => new Set());

    weekEventsList.forEach(evt => {
      const occupiedDayIndices = [];
      weekDays.forEach((dayCell, dayIdx) => {
        const dateStr = formatDateString(dayCell.date);
        const isActive = (evt.startDate && evt.endDate)
          ? (dateStr >= evt.startDate && dateStr <= evt.endDate)
          : (evt.type === 'birthday'
            ? getBirthdaySolarDateForYear(evt, parseInt(dateStr.slice(0, 4), 10)) === dateStr
            : evt.date === dateStr);
        if (isActive) {
          occupiedDayIndices.push(dayIdx);
        }
      });

      let slotIdx = 0;
      while (true) {
        const isSlotFree = occupiedDayIndices.every(dayIdx => !occupiedSlotsByDay[dayIdx].has(slotIdx));
        if (isSlotFree) {
          break;
        }
        slotIdx++;
      }

      slots[evt.id] = slotIdx;
      occupiedDayIndices.forEach(dayIdx => {
        occupiedSlotsByDay[dayIdx].add(slotIdx);
      });
    });

    weeksEventsSlots.push({ slots });
  }

  // Drag and Drop handlers
  const handleDragStart = (e, eventId) => {
    setDraggedEventId(eventId);
    e.dataTransfer.setData('text/plain', eventId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, dateStr) => {
    e.preventDefault();
    if (dragOverDate !== dateStr) {
      setDragOverDate(dateStr);
    }
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e, dateStr) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain') || draggedEventId;
    if (eventId) {
      onMoveEvent(eventId, dateStr);
    }
    setDraggedEventId(null);
    setDragOverDate(null);
  };

  const weeks = [];
  if (viewMode === 'week') {
    const currentDateStr = formatDateString(currentDate);
    const targetDayIdx = dayCells.findIndex(cell => formatDateString(cell.date) === currentDateStr);
    let originalWeekIdx = 0;
    if (targetDayIdx !== -1) {
      originalWeekIdx = Math.floor(targetDayIdx / 7);
      weeks.push({
        days: dayCells.slice(originalWeekIdx * 7, (originalWeekIdx + 1) * 7),
        originalWeekIdx
      });
    } else {
      weeks.push({
        days: dayCells.slice(0, 7),
        originalWeekIdx: 0
      });
    }
  } else {
    for (let i = 0; i < dayCells.length; i += 7) {
      weeks.push({
        days: dayCells.slice(i, i + 7),
        originalWeekIdx: i / 7
      });
    }
  }

  return (
    <div className="calendar-card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* View Mode Toolbar & Nav */}
      <div className="calendar-header" style={{ marginBottom: '16px', borderBottom: 'none', boxShadow: 'none', padding: '0 0 16px 0' }}>
        <div className="header-month-nav" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Year Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => {
                  setIsYearOpen(!isYearOpen);
                  setIsMonthOpen(false);
                }}
                className="calendar-select-btn"
              >
                {year}년
              </button>
              
              {isYearOpen && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setIsYearOpen(false)} />
                  <div ref={yearMenuRef} className="custom-dropdown-menu year-menu">
                    {Array.from({ length: 51 }, (_, i) => new Date().getFullYear() - 10 + i).map(y => (
                      <div 
                        key={y}
                        className={`dropdown-item ${y === year ? 'active' : ''}`}
                        onClick={() => {
                          setCurrentDate(new Date(y, month, 1));
                          setIsYearOpen(false);
                        }}
                      >
                        {y}년
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Month Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => {
                  setIsMonthOpen(!isMonthOpen);
                  setIsYearOpen(false);
                }}
                className="calendar-select-btn"
              >
                {month + 1}월
              </button>
              
              {isMonthOpen && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setIsMonthOpen(false)} />
                  <div ref={monthMenuRef} className="custom-dropdown-menu month-menu">
                    {Array.from({ length: 12 }, (_, i) => i).map(m => (
                      <div 
                        key={m}
                        className={`dropdown-item ${m === month ? 'active' : ''}`}
                        onClick={() => {
                          setCurrentDate(new Date(year, m, 1));
                          setIsMonthOpen(false);
                        }}
                      >
                        {m + 1}월
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={prevMonth} className="nav-btn"><ChevronLeft size={18} /></button>
            <button onClick={goToday} className="today-btn">오늘</button>
            <button onClick={nextMonth} className="nav-btn"><ChevronRight size={18} /></button>
          </div>
        </div>

        {/* Legend */}
        <div className="shift-legend" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
          {Array.isArray(shifts) && shifts.map(shift => (
            <div className="legend-item" key={shift.id}>
              <span 
                className="legend-badge" 
                style={{ 
                  backgroundColor: shift.color + '25', 
                  color: shift.color,
                  border: `1px solid ${shift.color}40`,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}
              >
                {shift.label}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>{shift.start}-{shift.end}</span>
            </div>
          ))}
          <div className="legend-item">
            <span className="legend-badge appointment" style={{ borderRadius: '50%', width: '8px', height: '8px', padding: 0 }}></span>
            <span>약속/개인</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Calendar Perspective Selector */}
          {currentTab === 'shared' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>시점:</span>
              <select
                value={calendarPerspective}
                onChange={(e) => setCalendarPerspective(e.target.value)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#ffffff',
                  fontWeight: '600',
                  color: calendarPerspective === 'me' ? 'var(--primary)' : '#10b981',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="me">내 시점 (전체 보기)</option>
                {sharedUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} 시점 ({u.relation.split(' ')[0]}이 보는 화면)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="header-view-toggle" style={{ display: 'flex', alignItems: 'center' }}>
            {['월', '주'].map((v, i) => {
              const vKeys = ['month', 'week'];
              const active = viewMode === vKeys[i];
              return (
                <button 
                  key={v}
                  onClick={() => setViewMode(vKeys[i])} 
                  className={`view-toggle-btn ${active ? 'active' : ''}`}
                >
                  {v}
                </button>
              );
            })}
            
            <div style={{ 
              width: '1px', 
              height: '14px', 
              backgroundColor: 'var(--border-color)', 
              marginLeft: '8px',
              marginRight: '4px',
              opacity: 0.8
            }} />

            <button
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              className={`view-toggle-btn ${showRightSidebar ? 'active' : ''}`}
              style={{
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: showRightSidebar ? 'var(--primary)' : 'var(--text-muted)'
              }}
              title={showRightSidebar ? "상세 보기 패널 닫기" : "상세 보기 패널 열기"}
            >
              {showRightSidebar ? <PanelRightClose size={16} /> : <PanelRight size={16} />}
            </button>
          </div>
        </div>
      </div>

      {calendarPerspective !== 'me' && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '12px',
          fontSize: '12px',
          color: '#166534',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📢</span>
          <span>
            <strong>{sharedUsers.find(u => u.id === calendarPerspective)?.name}</strong>님에게 공유된 내 일정 화면입니다. (비공개 일정 및 지정되지 않은 공유 일정은 숨김 처리됩니다.) {isReadOnlyPerspective && <strong style={{ color: '#dc2626', marginLeft: '6px' }}>(보기 전용 모드)</strong>}
          </span>
        </div>
      )}

      {/* Weekday headers */}
      <div className="grid-weekdays">
        {weekdays.map((day, idx) => (
          <div 
            key={day} 
            className={`weekday ${idx === 0 ? 'sunday' : ''} ${idx === 6 ? 'saturday' : ''}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid Days */}
      <div className={`grid-days ${viewMode === 'week' ? 'week-view' : ''}`}>
        {weeks.map(({ days: weekDays, originalWeekIdx }, weekIdx) => {
          const weekSlotsInfo = weeksEventsSlots[originalWeekIdx] || { slots: {} };
          
          // Get all events of this week (for multi-day trip event rendering)
          const weekEventsList = [];
          const uniqueWeekEventIds = new Set();
          weekDays.forEach(dayCell => {
            const dateStr = formatDateString(dayCell.date);
            const dayEvts = events.filter(evt => {
              if (evt.type === 'shift') return false;
              if (evt.startDate && evt.endDate) {
                return dateStr >= evt.startDate && dateStr <= evt.endDate;
              }
              if (evt.type === 'birthday') {
                const targetYear = parseInt(dateStr.slice(0, 4), 10);
                return getBirthdaySolarDateForYear(evt, targetYear) === dateStr;
              }
              return evt.date === dateStr;
            });
            dayEvts.forEach(evt => {
              if (!uniqueWeekEventIds.has(evt.id)) {
                uniqueWeekEventIds.add(evt.id);
                weekEventsList.push(evt);
              }
            });
          });

          return (
            <div key={weekIdx} className="week-row">
              {weekDays.map((cell, dayIdx) => {
                const idx = weekIdx * 7 + dayIdx;
                const dateStr = formatDateString(cell.date);
                const dayNum = cell.date.getDate();
                const dayOfWeek = cell.date.getDay();
                const isSunday = dayOfWeek === 0;
                const isSaturday = dayOfWeek === 6;

                // Lunar Date
                const lunarDate = getLunarDate(dateStr);
                const lunarDayOnly = lunarDate ? lunarDate.split(' ')[1] : '';

                // Holiday Info
                const rawHoliday = (settings.showHolidayCalendar && settings.showKoreanHolidays) ? (holidaysMap[dateStr] || getHoliday(dateStr)) : null;
                const holiday = (rawHoliday && (!rawHoliday.isAlternative || settings.showAlternativeHolidays)) ? rawHoliday : null;

                // Filter events for this day
                const dayEvents = events.filter(evt => {
                  if (evt.startDate && evt.endDate) {
                    return dateStr >= evt.startDate && dateStr <= evt.endDate;
                  }
                  if (evt.type === 'birthday') {
                    const targetYear = parseInt(dateStr.slice(0, 4), 10);
                    return getBirthdaySolarDateForYear(evt, targetYear) === dateStr;
                  }
                  return evt.date === dateStr;
                });

                // Check if this cell is currently selected
                const isSelected = selectedDay === dateStr;

                // Today indicator
                const isCellToday = formatDateString(new Date()) === dateStr;

                // Determine classnames for the day cell
                let cellClass = "day-cell";
                if (!cell.isCurrentMonth) cellClass += " other-month";
                if (isCellToday) cellClass += " today";
                if (dragOverDate === dateStr) cellClass += " drag-over";

                // Find if there are shifts on this day
                const dayShiftEvents = dayEvents.filter(e => e.type === 'shift');
                const dayShiftsData = dayShiftEvents.map(evt => {
                  const data = Array.isArray(shifts) ? shifts.find(s => s.id === evt.shiftType) : null;
                  return { event: evt, data };
                }).filter(item => item.data !== null)
                  .sort((a, b) => (a.data.start || '').localeCompare(b.data.start || ''));

                // Determine the primary (representative) shift for this day
                const savedPrimaryId = primaryShiftMap[dateStr];
                const mainShiftData = dayShiftsData.length > 0
                  ? (savedPrimaryId
                      ? (dayShiftsData.find(s => s.data.id === savedPrimaryId)?.data || dayShiftsData[0].data)
                      : dayShiftsData[0].data)
                  : null;

                return (
                  <div 
                    key={idx} 
                    className={cellClass}
                    onClick={() => onSelectDay(dateStr)}
                    onDragOver={(e) => handleDragOver(e, dateStr)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dateStr)}
                    style={
                      mainShiftData
                        ? {
                            backgroundColor: mainShiftData.color + '15',
                            borderColor: mainShiftData.color + '30',
                            borderWidth: '2.5px'
                          }
                        : {}
                    }
                  >
                    {/* Day info top row */}
                    <div className="day-number-container" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="day-number" style={{ 
                        fontWeight: isCellToday ? '700' : '500',
                        color: holiday ? '#ef4444' : (isSunday ? '#ef4444' : (isSaturday ? '#3b82f6' : 'inherit'))
                      }}>
                        {dayNum}
                      </span>

                      {holiday && (
                        <span className="holiday-label" style={dayShiftsData.length === 0 ? { marginLeft: 'auto' } : {}} title={holiday.name}>{holiday.name}</span>
                      )}

                      {dayShiftsData.length > 0 && (
                        <div style={{ 
                          display: 'flex', 
                          gap: '3px', 
                          flexWrap: 'wrap', 
                          marginLeft: 'auto',
                          justifyContent: 'flex-end',
                          maxWidth: '70%'
                        }}>
                          {dayShiftsData.map((sData, sIdx) => {
                            const isPrimary = savedPrimaryId
                              ? sData.data.id === savedPrimaryId
                              : sIdx === 0;
                            const canToggle = !isReadOnlyPerspective && dayShiftsData.length > 1;
                            return (
                              <span 
                                key={sData.event.id || sIdx}
                                onClick={canToggle ? (e) => {
                                  e.stopPropagation();
                                  setPrimaryShiftMap(prev => ({ ...prev, [dateStr]: sData.data.id }));
                                } : undefined}
                                style={{ 
                                  fontSize: '10px', 
                                  fontWeight: '700', 
                                  color: sData.data.color,
                                  backgroundColor: isPrimary ? sData.data.color + '28' : sData.data.color + '12',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  lineHeight: '1.2',
                                  cursor: canToggle ? 'pointer' : 'default',
                                  border: isPrimary ? `1.5px solid ${sData.data.color}55` : '1.5px solid transparent',
                                  transition: 'all 0.15s ease'
                                }}
                                title={canToggle
                                  ? (isPrimary ? `대표 근무: ${sData.data.label}` : `클릭하면 '${sData.data.label}'을 대표로 설정`)
                                  : `${sData.data.label} (${sData.data.start} ~ ${sData.data.end})${sData.event.overtimeHours ? `, 초과근무: ${sData.event.overtimeHours}시간` : ''}`
                                }
                              >
                                <span>{sData.data.label}</span>
                                {sData.event.overtimeHours ? (
                                  <span style={{ fontSize: '9px', opacity: 0.85, marginLeft: '1px' }}>
                                    (+{sData.event.overtimeHours}h)
                                  </span>
                                ) : null}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {settings.showHolidayCalendar && settings.showLunarAnniversaries && !holiday && lunarDayOnly && dayShiftsData.length === 0 && (
                        <span className="lunar-sub" style={{ marginLeft: 'auto' }}>{lunarDayOnly}</span>
                      )}
                    </div>

                    {/* Day Events Container */}
                    <div className="cell-events">
                      {(() => {
                        const dayNonShiftEvents = dayEvents.filter(e => e.type !== 'shift');
                        const MAX_VISIBLE_EVENTS = viewMode === 'week' ? 20 : 4;

                        // Split day events into multi-day and single-day
                        const dayMultiEvents = dayNonShiftEvents.filter(evt => evt.startDate && evt.endDate);
                        const daySingleEvents = dayNonShiftEvents.filter(evt => !(evt.startDate && evt.endDate));

                        // Sort single-day events: birthdays first, then chronologically by time, then alphabetically by title
                        daySingleEvents.sort((a, b) => {
                          if (a.type === 'birthday' && b.type !== 'birthday') return -1;
                          if (a.type !== 'birthday' && b.type === 'birthday') return 1;
                          
                          const timeA = a.time || '00:00';
                          const timeB = b.time || '00:00';
                          const timeCmp = timeA.localeCompare(timeB);
                          if (timeCmp !== 0) return timeCmp;
                          
                          return (a.title || a.name || '').localeCompare(b.title || b.name || '');
                        });

                        const visibleSingles = daySingleEvents.slice(0, MAX_VISIBLE_EVENTS);
                        const hiddenCount = daySingleEvents.length - visibleSingles.length;

                        // Assign slots to visible elements
                        const slotToElement = {};
                        
                        // 1. Place active multi-day events
                        dayMultiEvents.forEach(evt => {
                          const slot = weekSlotsInfo.slots[evt.id];
                          if (slot !== undefined) {
                            slotToElement[slot] = { type: 'multi', event: evt };
                          }
                        });

                        // 2. Place visible single-day events in the remaining slots
                        let s = 0;
                        let singleIdx = 0;
                        while (singleIdx < visibleSingles.length) {
                          if (slotToElement[s] === undefined) {
                            slotToElement[s] = { type: 'single', event: visibleSingles[singleIdx] };
                            singleIdx++;
                          }
                          s++;
                        }

                        // Determine the maximum slot index to render (to cover all spacers up to the highest slot)
                        const slotKeys = Object.keys(slotToElement).map(Number);
                        const maxSlotIdx = slotKeys.length > 0 ? Math.max(...slotKeys) : -1;

                        const elements = [];

                        // 3. Render items
                        for (let currentSlot = 0; currentSlot <= maxSlotIdx; currentSlot++) {
                          const item = slotToElement[currentSlot];
                          if (item) {
                            if (item.type === 'multi') {
                              // Render invisible spacer placeholder for multi-day event
                              elements.push(
                                <div 
                                  key={`placeholder-${idx}-${currentSlot}`}
                                  style={{ 
                                    height: '20px', 
                                    minHeight: '20px', 
                                    visibility: 'hidden'
                                  }} 
                                />
                              );
                            } else {
                              const evt = item.event;
                              const isPrivate = evt.isPrivate && isPrivateMode;

                              if (evt.type === 'birthday') {
                                elements.push(
                                  <div 
                                    key={evt.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditEvent && onEditEvent(evt);
                                    }}
                                    style={{
                                      fontSize: '10px',
                                      color: '#db2777',
                                      backgroundColor: '#fdf2f8',
                                      padding: '2px 4px',
                                      borderRadius: '4px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      fontWeight: '600',
                                      height: '20px',
                                      minHeight: '20px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Cake size={11} color="#db2777" style={{ flexShrink: 0 }} /> {isPrivate ? '생신' : `${evt.name} 생일`}
                                    {evt.isLunar && <span style={{ fontSize: '8px', opacity: 0.8 }}>(음)</span>}
                                  </div>
                                );
                              } else if (evt.type === 'appointment') {
                                const displayTitle = isPrivate ? '약속' : evt.title;
                                const displayMode = evt.displayMode || 'dot';

                                if (displayMode === 'dot') {
                                  const dotBg = isPrivate ? undefined : getDotColor(evt.color);
                                  elements.push(
                                    <div 
                                      key={evt.id} 
                                      className="appointment-dot-item"
                                      draggable={!isReadOnlyPerspective}
                                      onDragStart={(e) => !isReadOnlyPerspective && handleDragStart(e, evt.id)}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditEvent && onEditEvent(evt);
                                      }}
                                      title={`${evt.title} (${evt.time})`}
                                      style={{ height: '20px', minHeight: '20px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                    >
                                      <span 
                                        className={`dot-indicator ${isPrivate ? 'private' : ''}`}
                                        style={dotBg ? { backgroundColor: dotBg } : {}}
                                      ></span>
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {getShareIcon(evt)}{displayTitle}
                                        </span>
                                        {renderSharedAvatars(evt)}
                                      </span>
                                    </div>
                                  );
                                } else {
                                  const boxStyle = isPrivate ? {} : getBoxColorStyles(evt.color);
                                  elements.push(
                                    <div 
                                      key={evt.id} 
                                      className={`appointment-box-item ${isPrivate ? 'private' : ''}`}
                                      draggable={!isReadOnlyPerspective}
                                      onDragStart={(e) => !isReadOnlyPerspective && handleDragStart(e, evt.id)}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditEvent && onEditEvent(evt);
                                      }}
                                      title={`${evt.title} (${evt.time})`}
                                      style={{ 
                                        height: '20px', 
                                        minHeight: '20px', 
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '2px',
                                        ...boxStyle
                                      }}
                                    >
                                      {evt.time && <span style={{ opacity: 0.8, fontSize: '8px', marginRight: '3px', flexShrink: 0 }}>{evt.time}</span>}
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {getShareIcon(evt)}{displayTitle}
                                        </span>
                                        {renderSharedAvatars(evt)}
                                      </span>
                                    </div>
                                  );
                                }
                              }
                            }
                          } else {
                            // Empty slot (no active multi-day or single-day event here)
                            elements.push(
                              <div 
                                key={`placeholder-${idx}-${currentSlot}`}
                                style={{ 
                                  height: '20px', 
                                  minHeight: '20px', 
                                  visibility: 'hidden'
                                }} 
                              />
                            );
                          }
                        }

                        if (hiddenCount > 0) {
                          elements.push(
                            <div
                              key={`more-events-${idx}`}
                              style={{
                                fontSize: '10px',
                                color: 'var(--primary)',
                                fontWeight: '700',
                                paddingLeft: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                height: '20px'
                              }}
                            >
                              + {hiddenCount}개 더보기
                            </div>
                          );
                        }

                        return elements;
                      })()}
                    </div>

                    {/* Inline Hover Action to Add Event */}
                    {!isReadOnlyPerspective && (
                      <button 
                        className="cell-add-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddEventClick(dateStr);
                        }}
                        style={{
                          position: 'absolute',
                          bottom: '4px',
                          right: '4px',
                          padding: '2px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Render absolute-positioned multi-day events for this week */}
              {(() => {
                const uniqueWeekMultiDayEvents = weekEventsList.filter(evt => evt.startDate && evt.endDate);
                return uniqueWeekMultiDayEvents.map(evt => {
                  const slotIdx = weekSlotsInfo.slots[evt.id];
                  
                  // Calculate start and end column index within this week
                  const startCol = weekDays.findIndex(d => formatDateString(d.date) === evt.startDate);
                  const endCol = weekDays.findIndex(d => formatDateString(d.date) === evt.endDate);
                  const startColIdx = startCol !== -1 ? startCol : 0;
                  const endColIdx = endCol !== -1 ? endCol : 6;
                  
                  const isActualStart = startCol !== -1;
                  const isActualEnd = endCol !== -1;
                  
                  const borderRadiusStyle = `${isActualStart ? '10px' : '0'} ${isActualEnd ? '10px' : '0'} ${isActualEnd ? '10px' : '0'} ${isActualStart ? '10px' : '0'}`;
                  
                  let bg = '#e0f2fe';
                  let text = '#0369a1';
                  if (evt.color === 'purple') { bg = '#f3e8ff'; text = '#6b21a8'; }
                  if (evt.color === 'emerald') { bg = '#dcfce7'; text = '#166534'; }
                  if (evt.color === 'orange') { bg = '#ffedd5'; text = '#c2410c'; }
                  if (evt.color === 'pink') { bg = '#fce7f3'; text = '#be185d'; }
                  
                  const isPrivate = evt.isPrivate && isPrivateMode;
                  
                  const leftGap = isActualStart ? '8px' : '2px';
                  const rightGap = isActualEnd ? '8px' : '2px';
                  
                  return (
                    <div 
                      key={evt.id}
                      draggable={!isReadOnlyPerspective}
                      onDragStart={(e) => !isReadOnlyPerspective && handleDragStart(e, evt.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEvent && onEditEvent(evt);
                      }}
                      style={{
                        position: 'absolute',
                        gridColumn: `${startColIdx + 1} / ${endColIdx + 2}`,
                        top: `${38 + slotIdx * 24}px`,
                        left: leftGap,
                        right: rightGap,
                        height: '20px',
                        backgroundColor: bg,
                        color: text,
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '0 8px',
                        borderRadius: borderRadiusStyle,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                        zIndex: 5,
                        pointerEvents: 'auto',
                        cursor: 'pointer'
                      }}
                    >
                      {isActualStart && <span style={{ marginRight: '2px', flexShrink: 0 }}>✈</span>}
                      {(isActualStart || startColIdx === 0) && (
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isPrivate ? '일정 있음' : `${getShareIcon(evt)}${evt.title}`}
                          </span>
                          {!isPrivate && renderSharedAvatars(evt)}
                        </span>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

