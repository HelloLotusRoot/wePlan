import React from 'react';
import { Clock, MapPin, Users, Calendar, Plus, Edit3, Trash2, ShieldAlert } from 'lucide-react';
import { getLunarDate } from '../utils/lunarCalendar';
import { getHoliday } from '../utils/holidays';

export default function SidebarRight({
  selectedDateStr,
  events,
  shifts,
  onAddEventClick,
  onEditEvent,
  onDeleteEvent,
  isPrivateMode,
  holidaysMap = {}
}) {
  const selectedDate = new Date(selectedDateStr + "T00:00:00");
  const formattedDate = selectedDate.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  const holiday = holidaysMap[selectedDateStr] || getHoliday(selectedDateStr);

  // Filter events for this selected date
  const selectedDayEvents = events.filter(evt => {
    if (evt.startDate && evt.endDate) {
      return selectedDateStr >= evt.startDate && selectedDateStr <= evt.endDate;
    }
    return evt.date === selectedDateStr;
  });

  // Shifts on selected day
  const dayShift = selectedDayEvents.find(e => e.type === 'shift');
  const dayShiftData = dayShift ? shifts.find(s => s.id === dayShift.shiftType) : null;

  // Appointments on selected day
  const dayApts = selectedDayEvents.filter(e => e.type === 'appointment' || (e.startDate && e.endDate));

  // Sort upcoming events (only events in future relative to today or current month)
  // Let's grab all birthdays and trips for the monthly overview
  const upcomingEvents = events
    .filter(e => e.type === 'birthday' || (e.startDate && e.endDate))
    .sort((a, b) => {
      const dateA = a.startDate || a.date;
      const dateB = b.startDate || b.date;
      return dateA.localeCompare(dateB);
    })
    .slice(0, 5); // display up to 5

  return (
    <aside className="sidebar-right">
      {/* Selected Day Detail */}
      <div className="date-detail-card">
        <div className="detail-header">
          <span className="detail-date">{formattedDate}</span>
          {holiday && (
            <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600' }}>
              🎈 {holiday.name}
            </span>
          )}
        </div>

        {/* Selected Shift */}
        {dayShift && dayShiftData ? (
          <div 
            className="detail-event-row"
            style={{
              borderLeft: `4px solid ${dayShiftData.color}`,
              backgroundColor: dayShiftData.color + '10'
            }}
          >
            <div className="row-top">
              <span className="row-title" style={{ color: dayShiftData.color }}>
                {dayShiftData.label} 근무
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => onEditEvent(dayShift)} className="nav-btn" style={{ padding: '2px' }}>
                  <Edit3 size={14} />
                </button>
                <button onClick={() => onDeleteEvent(dayShift.id)} className="nav-btn" style={{ padding: '2px', color: '#ef4444' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <span className="row-time" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} />
              {dayShiftData.start} - {dayShiftData.end}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              지정 근무 스케줄
            </span>
          </div>
        ) : (
          <div 
            style={{ 
              border: '1px dashed var(--border-color)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '12px', 
              textAlign: 'center', 
              fontSize: '12px', 
              color: 'var(--text-muted)' 
            }}
          >
            근무 일정이 없습니다.
          </div>
        )}

        {/* Selected Appointments */}
        <div className="detail-events-list">
          {dayApts.map(evt => {
            const isPrivate = evt.isPrivate && isPrivateMode;
            const title = isPrivate ? '비공개 일정' : evt.title;
            const place = isPrivate ? '비공개' : evt.place;
            const displayTime = evt.startDate ? '하루 종일' : evt.time;

            return (
              <div key={evt.id} className="detail-event-row apt">
                <div className="row-top">
                  <span className="row-title" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isPrivate && <ShieldAlert size={12} color="#94a3b8" />}
                    {title}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!isPrivate && (
                      <button onClick={() => onEditEvent(evt)} className="nav-btn" style={{ padding: '2px' }}>
                        <Edit3 size={14} />
                      </button>
                    )}
                    <button onClick={() => onDeleteEvent(evt.id)} className="nav-btn" style={{ padding: '2px', color: '#ef4444' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="row-time" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  <span>{displayTime}</span>
                </div>

                {place && (
                  <div className="row-place">
                    <MapPin size={11} />
                    <span>{place}</span>
                  </div>
                )}

                {evt.participants && evt.participants.length > 0 && !isPrivate && (
                  <div className="row-participants">
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginRight: '4px' }}>참여자:</span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {evt.participants.map((p, idx) => (
                        <img 
                          key={idx}
                          src={p.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=80&auto=format&fit=crop"}
                          alt={p.name}
                          className="participant-avatar"
                          title={p.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <div className="upcoming-header" style={{ marginBottom: '12px' }}>
          <span>다가오는 일정</span>
          <Calendar size={16} color="var(--primary)" />
        </div>
        <div className="upcoming-list">
          {upcomingEvents.map(evt => {
            const isBirthday = evt.type === 'birthday';
            const dateStr = evt.startDate || evt.date;
            const eventDate = new Date(dateStr + "T00:00:00");
            const mm = eventDate.getMonth() + 1;
            const dd = eventDate.getDate();
            const dayName = eventDate.toLocaleDateString('ko-KR', { weekday: 'short' });

            const isPrivate = evt.isPrivate && isPrivateMode;

            return (
              <div key={evt.id} className="upcoming-item">
                <div className="upcoming-date">
                  {mm}.{dd} ({dayName})
                </div>
                <div className="upcoming-info">
                  <span className="upcoming-title">
                    {isBirthday ? (
                      isPrivate ? '🎂 생일' : `🎂 ${evt.name} 생일`
                    ) : (
                      isPrivate ? '✈️ 여행' : `✈️ ${evt.title}`
                    )}
                  </span>
                  <span className="upcoming-sub">
                    {isBirthday ? (
                      evt.isLunar ? `음력 ${getLunarDate(evt.date).split(' ')[1]}` : '양력'
                    ) : (
                      evt.place || '여행 일정'
                    )}
                  </span>
                </div>
              </div>
            );
          })}
          {upcomingEvents.length === 0 && (
            <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', padding: '12px' }}>
              다가오는 일정이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* Add Event Button */}
      <button 
        onClick={() => onAddEventClick(selectedDateStr)}
        className="btn-primary-add"
        style={{ marginTop: 'auto' }}
      >
        <Plus size={16} />
        <span>+ 일정 추가</span>
      </button>
    </aside>
  );
}
