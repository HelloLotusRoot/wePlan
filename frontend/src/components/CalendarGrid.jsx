import React, { useState } from 'react';
import { getLunarDate } from '../utils/lunarCalendar';
import { getHoliday } from '../utils/holidays';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, MapPin, Sparkles } from 'lucide-react';

export default function CalendarGrid({ 
  currentDate, 
  setCurrentDate, 
  events, 
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
  isPrivateMode,
  holidaysMap = {}
}) {
  const [draggedEventId, setDraggedEventId] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
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
          : (evt.date === dateStr);
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
  for (let i = 0; i < dayCells.length; i += 7) {
    weeks.push(dayCells.slice(i, i + 7));
  }

  return (
    <div className="calendar-card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* View Mode Toolbar & Nav */}
      <div className="calendar-header" style={{ marginBottom: '16px', borderBottom: 'none', boxShadow: 'none', padding: '0 0 16px 0' }}>
        <div className="header-month-nav">
          <span className="month-title">{year}년 {month + 1}월</span>
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

        <div className="header-view-toggle">
          {['월', '주', '일', '목록'].map((v, i) => {
            const vKeys = ['month', 'week', 'day', 'list'];
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
        </div>
      </div>

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
      <div className="grid-days">
        {weeks.map((weekDays, weekIdx) => {
          const weekSlotsInfo = weeksEventsSlots[weekIdx];
          
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
                const holiday = settings.showKoreanHolidays ? (holidaysMap[dateStr] || getHoliday(dateStr)) : null;

                // Filter events for this day
                const dayEvents = events.filter(evt => {
                  if (evt.startDate && evt.endDate) {
                    return dateStr >= evt.startDate && dateStr <= evt.endDate;
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

                // Find if there is a shift on this day
                const dayShiftEvent = dayEvents.find(e => e.type === 'shift');
                const dayShiftData = dayShiftEvent && Array.isArray(shifts) ? shifts.find(s => s.id === dayShiftEvent.shiftType) : null;

                return (
                  <div 
                    key={idx} 
                    className={cellClass}
                    onClick={() => onSelectDay(dateStr)}
                    onDragOver={(e) => handleDragOver(e, dateStr)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dateStr)}
                    style={
                      dayShiftEvent && dayShiftData
                        ? {
                            backgroundColor: dayShiftData.color + '15',
                            borderColor: dayShiftData.color + '30',
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
                        <span className="holiday-label" style={!dayShiftEvent ? { marginLeft: 'auto' } : {}} title={holiday.name}>{holiday.name}</span>
                      )}

                      {dayShiftEvent && dayShiftData && (
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          color: dayShiftData.color,
                          backgroundColor: dayShiftData.color + '18',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          marginLeft: 'auto'
                        }}>
                          {dayShiftData.label}
                        </span>
                      )}

                      {settings.showLunarAnniversaries && !holiday && lunarDayOnly && !dayShiftEvent && (
                        <span className="lunar-sub" style={{ marginLeft: 'auto' }}>{lunarDayOnly}</span>
                      )}
                    </div>

                    {/* Day Events Container */}
                    <div className="cell-events">
                      {(() => {
                        const dayNonShiftEvents = dayEvents.filter(e => e.type !== 'shift');

                        // Find maximum slot index active on this specific day
                        let maxDaySlotIdx = -1;
                        dayNonShiftEvents.forEach(evt => {
                          const slot = weekSlotsInfo.slots[evt.id];
                          if (slot !== undefined && slot > maxDaySlotIdx) {
                            maxDaySlotIdx = slot;
                          }
                        });

                        const elements = [];
                        for (let s = 0; s <= maxDaySlotIdx; s++) {
                          const evt = dayNonShiftEvents.find(e => weekSlotsInfo.slots[e.id] === s);
                          if (evt) {
                            const isPrivate = evt.isPrivate && isPrivateMode;

                            // If it's a multi-day trip event, render spacer placeholder inside day cell
                            if (evt.startDate && evt.endDate) {
                              elements.push(
                                <div 
                                  key={`placeholder-${idx}-${s}`}
                                  style={{ 
                                    height: '20px', 
                                    minHeight: '20px', 
                                    marginTop: '4px',
                                    visibility: 'hidden'
                                  }} 
                                />
                              );
                            }

                            // Render birthday event
                            else if (evt.type === 'birthday') {
                              elements.push(
                                <div 
                                  key={evt.id}
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
                                    marginTop: '4px'
                                  }}
                                >
                                  🎂 {isPrivate ? '생신' : `${evt.name} 생일`}
                                  {evt.isLunar && <span style={{ fontSize: '8px', opacity: 0.8 }}>(음)</span>}
                                </div>
                              );
                            }

                            // Render regular appointment
                            else if (evt.type === 'appointment') {
                              const displayTitle = isPrivate ? '약속' : evt.title;
                              if (aptViewMode === 'dot') {
                                elements.push(
                                  <div 
                                    key={evt.id} 
                                    className="appointment-dot-item"
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, evt.id)}
                                    title={`${evt.title} (${evt.time})`}
                                    style={{ height: '20px', minHeight: '20px', marginTop: '4px', display: 'flex', alignItems: 'center' }}
                                  >
                                    <span className={`dot-indicator ${isPrivate ? 'private' : ''}`}></span>
                                    <span>{displayTitle}</span>
                                  </div>
                                );
                              } else if (aptViewMode === 'both') {
                                elements.push(
                                  <div 
                                    key={evt.id} 
                                    className={`appointment-box-item ${isPrivate ? 'private' : ''}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, evt.id)}
                                    title={`${evt.title} (${evt.time})`}
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '20px', minHeight: '20px', marginTop: '4px' }}
                                  >
                                    <span className={`dot-indicator ${isPrivate ? 'private' : ''}`} style={{ width: '5px', height: '5px', margin: 0, flexShrink: 0 }}></span>
                                    {evt.time && <span style={{ opacity: 0.8, fontSize: '8px', marginRight: '3px' }}>{evt.time}</span>}
                                    {displayTitle}
                                  </div>
                                );
                              } else {
                                elements.push(
                                  <div 
                                    key={evt.id} 
                                    className={`appointment-box-item ${isPrivate ? 'private' : ''}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, evt.id)}
                                    title={`${evt.title} (${evt.time})`}
                                    style={{ height: '20px', minHeight: '20px', marginTop: '4px' }}
                                  >
                                    {evt.time && <span style={{ opacity: 0.8, fontSize: '8px', marginRight: '3px' }}>{evt.time}</span>}
                                    {displayTitle}
                                  </div>
                                );
                              }
                            }
                          } else {
                            // Spacer placeholder to push subsequent events to their correct slot row
                            elements.push(
                              <div 
                                key={`placeholder-${idx}-${s}`}
                                style={{ 
                                  height: '20px', 
                                  minHeight: '20px', 
                                  marginTop: '4px',
                                  visibility: 'hidden'
                                }} 
                              />
                            );
                          }
                        }

                        return elements;
                      })()}
                    </div>

                    {/* Inline Hover Action to Add Event */}
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
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        padding: '2px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = 1}
                    >
                      <Plus size={12} />
                    </button>
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
                  
                  const isPrivate = evt.isPrivate && isPrivateMode;
                  
                  const leftGap = isActualStart ? '4px' : '-2px';
                  const rightGap = isActualEnd ? '4px' : '-2px';
                  
                  return (
                    <div 
                      key={evt.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, evt.id)}
                      style={{
                        position: 'absolute',
                        gridColumn: `${startColIdx + 1} / ${endColIdx + 2}`,
                        top: `${38 + slotIdx * 28}px`,
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
                        pointerEvents: 'auto'
                      }}
                    >
                      {isActualStart && <span style={{ marginRight: '2px' }}>✈️</span>}
                      {(isActualStart || startColIdx === 0) && (isPrivate ? '일정 있음' : evt.title)}
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

