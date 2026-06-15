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
  isPrivateMode
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
          <div className="legend-item">
            <span className="legend-badge day">DAY</span>
            <span style={{ color: 'var(--text-muted)' }}>{shifts.day.start}-{shifts.day.end}</span>
          </div>
          <div className="legend-item">
            <span className="legend-badge eve">EVE</span>
            <span style={{ color: 'var(--text-muted)' }}>{shifts.eve.start}-{shifts.eve.end}</span>
          </div>
          <div className="legend-item">
            <span className="legend-badge night">NIGHT</span>
            <span style={{ color: 'var(--text-muted)' }}>{shifts.night.start}-{shifts.night.end}</span>
          </div>
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
        {dayCells.map((cell, idx) => {
          const dateStr = formatDateString(cell.date);
          const dayNum = cell.date.getDate();
          const dayOfWeek = cell.date.getDay();
          const isSunday = dayOfWeek === 0;
          const isSaturday = dayOfWeek === 6;

          // Lunar Date
          const lunarDate = getLunarDate(dateStr);
          const lunarDayOnly = lunarDate ? lunarDate.split(' ')[1] : ''; // e.g. "4.15"

          // Holiday Info
          const holiday = settings.showKoreanHolidays ? getHoliday(dateStr) : null;

          // Filter events for this day
          const dayEvents = events.filter(evt => {
            if (evt.startDate && evt.endDate) {
              // Multi-day event spans across this date
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
          const dayShiftData = dayShiftEvent ? shifts[dayShiftEvent.shiftType] : null;

          return (
            <div 
              key={idx} 
              className={cellClass}
              onClick={() => onSelectDay(dateStr)}
              onDragOver={(e) => handleDragOver(e, dateStr)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, dateStr)}
              style={
                workViewMode === 'full' && dayShiftEvent && dayShiftData
                  ? {
                      backgroundColor: `var(--shift-${dayShiftEvent.shiftType}-bg)`,
                      borderColor: `var(--shift-${dayShiftEvent.shiftType}-border)`
                    }
                  : {}
              }
            >
              {/* Day info top row */}
              <div className="day-number-container">
                <span className="day-number" style={{ 
                  fontWeight: isCellToday ? '700' : '500',
                  color: holiday ? '#ef4444' : (isSunday ? '#ef4444' : (isSaturday ? '#3b82f6' : 'inherit'))
                }}>
                  {dayNum}
                </span>

                {holiday && (
                  <span className="holiday-label" title={holiday.name}>{holiday.name}</span>
                )}
                
                {settings.showLunarAnniversaries && !holiday && lunarDayOnly && (
                  <span className="lunar-sub">{lunarDayOnly}</span>
                )}
              </div>

              {/* Day Events Container */}
              <div className="cell-events">
                {dayEvents.map(evt => {
                  const isPrivate = evt.isPrivate && isPrivateMode;

                  // Render shift block
                  if (evt.type === 'shift') {
                    if (workViewMode === 'full') {
                      // Whole cell background color, so render small label text inside
                      return (
                        <div key={evt.id} className={`shift-badge-mini ${evt.shiftType}`}>
                          {evt.shiftType.toUpperCase()}
                        </div>
                      );
                    } else {
                      // Render as block inside cell
                      return (
                        <div 
                          key={evt.id} 
                          className={`shift-block-full ${evt.shiftType}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, evt.id)}
                        >
                          <div>{evt.shiftType.toUpperCase()}</div>
                          <span className="shift-block-time">
                            {shifts[evt.shiftType].start}-{shifts[evt.shiftType].end}
                          </span>
                        </div>
                      );
                    }
                  }

                  // Render multi-day trip event
                  if (evt.startDate && evt.endDate) {
                    const isStart = dateStr === evt.startDate;
                    const isMiddle = dateStr > evt.startDate && dateStr < evt.endDate;
                    const isEnd = dateStr === evt.endDate;

                    let bg = '#e0f2fe';
                    let text = '#0369a1';
                    if (evt.color === 'purple') { bg = '#f3e8ff'; text = '#6b21a8'; }
                    if (evt.color === 'emerald') { bg = '#dcfce7'; text = '#166534'; }

                    return (
                      <div 
                        key={evt.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, evt.id)}
                        style={{
                          backgroundColor: bg,
                          color: text,
                          fontSize: '10px',
                          fontWeight: '600',
                          padding: '2px 6px',
                          borderRadius: isStart ? '8px 0 0 8px' : (isEnd ? '0 8px 8px 0' : '0'),
                          marginLeft: isStart ? '0' : '-6px',
                          marginRight: isEnd ? '0' : '-6px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          marginTop: '2px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}
                      >
                        {isStart && <span style={{ marginRight: '2px' }}>✈️</span>}
                        {(isStart || cell.date.getDay() === 0 || idx % 7 === 0) && (isPrivate ? '일정 있음' : evt.title)}
                      </div>
                    );
                  }

                  // Render birthday event
                  if (evt.type === 'birthday') {
                    return (
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
                          fontWeight: '600'
                        }}
                      >
                        🎂 {isPrivate ? '생신' : `${evt.name} 생일`}
                        {evt.isLunar && <span style={{ fontSize: '8px', opacity: 0.8 }}>(음)</span>}
                      </div>
                    );
                  }

                  // Render regular appointment
                  if (evt.type === 'appointment') {
                    const displayTitle = isPrivate ? '약속' : evt.title;
                    if (aptViewMode === 'dot') {
                      return (
                        <div 
                          key={evt.id} 
                          className="appointment-dot-item"
                          draggable
                          onDragStart={(e) => handleDragStart(e, evt.id)}
                          title={`${evt.title} (${evt.time})`}
                        >
                          <span className={`dot-indicator ${isPrivate ? 'private' : ''}`}></span>
                          <span>{displayTitle}</span>
                        </div>
                      );
                    } else {
                      return (
                        <div 
                          key={evt.id} 
                          className={`appointment-box-item ${isPrivate ? 'private' : ''}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, evt.id)}
                          title={`${evt.title} (${evt.time})`}
                        >
                          {evt.time && <span style={{ opacity: 0.8, fontSize: '8px', marginRight: '3px' }}>{evt.time}</span>}
                          {displayTitle}
                        </div>
                      );
                    }
                  }

                  return null;
                })}
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
      </div>
    </div>
  );
}
