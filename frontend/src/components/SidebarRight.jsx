import React, { useState } from 'react';
import { Clock, MapPin, Users, Calendar, Plus, Edit3, ShieldAlert, Cake } from 'lucide-react';
import { getLunarDate, lunarToSolar } from '../utils/lunarCalendar';
import { getHoliday } from '../utils/holidays';

export default function SidebarRight({
  selectedDateStr,
  events: rawEvents,
  shifts,
  onAddEventClick,
  onEditEvent,
  onDeleteEvent,
  isPrivateMode,
  holidaysMap = {},
  calendarPerspective,
  sharedUsers,
  isReadOnlyPerspective,
  settings
}) {
  const selectedDate = new Date(selectedDateStr + "T00:00:00");
  
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  const getParticipantDetails = (p) => {
    // Try to find in sharedUsers
    const matchedUser = (sharedUsers || []).find(u => u.name === p.name);
    if (matchedUser) {
      return {
        name: matchedUser.name,
        avatar: matchedUser.avatar || p.avatar,
        relation: matchedUser.relation || '친구',
        privilege: matchedUser.privilege || '보기 가능',
        isSharing: matchedUser.isSharing ?? true
      };
    }
    
    if (p.name === '나') {
      return {
        name: '나 (김소현)',
        avatar: p.avatar,
        relation: '본인',
        privilege: '소유자 (편집 가능)',
        isSharing: true
      };
    }
    
    if (p.name === '재윤') {
      return {
        name: '재윤',
        avatar: p.avatar,
        relation: '친구',
        privilege: '보기 가능',
        isSharing: true
      };
    }
    
    return {
      name: p.name,
      avatar: p.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=80&auto=format&fit=crop",
      relation: '친구',
      privilege: '보기 가능',
      isSharing: false
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
  
  // Filter events based on perspective
  const events = rawEvents.filter(evt => {
    if (evt.type === 'shift') return true;
    if (evt.type === 'birthday') return true;
    
    const scope = evt.shareScope || (evt.isPrivate ? 'private' : 'public');
    const sharedWith = evt.sharedWith || [];
    
    if (calendarPerspective === 'me') {
      return true;
    } else {
      if (scope === 'private') return false;
      if (scope === 'public') return true;
      if (scope === 'custom') return sharedWith.includes(calendarPerspective);
      return true;
    }
  });

  const formattedDate = selectedDate.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  const rawHoliday = (settings?.showHolidayCalendar && settings?.showKoreanHolidays) ? (holidaysMap[selectedDateStr] || getHoliday(selectedDateStr)) : null;
  const holiday = (rawHoliday && (!rawHoliday.isAlternative || settings?.showAlternativeHolidays)) ? rawHoliday : null;

  // Filter events for this selected date
  const selectedDayEvents = events.filter(evt => {
    if (evt.startDate && evt.endDate) {
      return selectedDateStr >= evt.startDate && selectedDateStr <= evt.endDate;
    }
    if (evt.type === 'birthday') {
      const targetYear = parseInt(selectedDateStr.slice(0, 4), 10);
      return getBirthdaySolarDateForYear(evt, targetYear) === selectedDateStr;
    }
    return evt.date === selectedDateStr;
  });

  // Helper to extract sort time for chronological sorting
  const getSortTime = (evt) => {
    if (evt.type === 'shift') {
      const shiftData = shifts.find(s => s.id === evt.shiftType);
      return shiftData ? shiftData.start : '00:00';
    }
    if (evt.type === 'birthday') {
      return '00:00'; // Birthdays are all-day, sort to the top
    }
    if (evt.startDate && evt.endDate) {
      return '00:00'; // Multi-day/All-day events, sort to the top
    }
    return evt.time || '00:00';
  };

  // Combine and sort events chronologically
  const sortedDayEvents = [...selectedDayEvents].sort((a, b) => {
    const timeA = getSortTime(a);
    const timeB = getSortTime(b);
    const cmp = timeA.localeCompare(timeB);
    if (cmp !== 0) return cmp;
    
    // Tie-breaker: Birthday -> Shift -> Appointment
    const typeOrder = { birthday: 1, shift: 2, appointment: 3 };
    return (typeOrder[a.type] || 9) - (typeOrder[b.type] || 9);
  });

  const targetYear = parseInt(selectedDateStr.slice(0, 4), 10);

  // Sort upcoming events (only events in future relative to today or current month)
  // Let's grab all birthdays and trips for the monthly overview
  const upcomingEvents = events
    .filter(e => e.type === 'birthday' || (e.startDate && e.endDate))
    .map(e => {
      if (e.type === 'birthday') {
        const solarDate = getBirthdaySolarDateForYear(e, targetYear);
        return { ...e, date: solarDate };
      }
      return e;
    })
    .filter(e => {
      const dateStr = e.startDate || e.date;
      return dateStr >= selectedDateStr;
    })
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

        {/* Selected Day Events (Combined & Chronologically Sorted) */}
        {sortedDayEvents.length > 0 ? (
          <div className="detail-events-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedDayEvents.map(evt => {
              if (evt.type === 'shift') {
                const shiftData = shifts.find(s => s.id === evt.shiftType);
                if (!shiftData) return null;
                return (
                  <div 
                    key={evt.id}
                    className="detail-event-row"
                    style={{
                      border: `1.5px solid ${shiftData.color}35`,
                      borderLeft: `1.5px solid ${shiftData.color}35`,
                      backgroundColor: shiftData.color + '15',
                      borderRadius: '8px'
                    }}
                  >
                    <div className="row-top">
                      <span className="row-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: shiftData.color }}>
                        <span>{shiftData.label}</span>
                        <span style={{
                          fontSize: '10px',
                          backgroundColor: shiftData.color + '22',
                          color: shiftData.color,
                          padding: '1px 6px',
                          borderRadius: '10px',
                          fontWeight: '700'
                        }}>
                          스케줄
                        </span>
                      </span>
                      {!isReadOnlyPerspective && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => onEditEvent(evt)} className="nav-btn" style={{ padding: '2px', color: shiftData.color }}>
                            <Edit3 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="row-time" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '2px', color: shiftData.color, opacity: 0.9 }}>
                      <Clock size={12} />
                      {shiftData.start} - {shiftData.end}
                      {parseFloat(evt.overtimeHours) > 0 && (
                        <span className="overtime-badge" style={{ 
                          marginLeft: '8px', 
                          backgroundColor: shiftData.color + '25', 
                          color: shiftData.color, 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 'bold' 
                        }}>
                          초과근무 +{evt.overtimeHours}h
                        </span>
                      )}
                    </span>
                  </div>
                );
              } else {
                const isPrivate = evt.isPrivate && isPrivateMode;
                const isBirthday = evt.type === 'birthday';
                
                const title = isBirthday
                  ? (isPrivate ? '생일' : `${evt.name} 생일`)
                  : (isPrivate ? '비공개 일정' : evt.title);
                  
                const place = isBirthday ? null : (isPrivate ? '비공개' : evt.place);
                const displayTime = isBirthday 
                  ? (evt.isLunar ? '음력 생일' : '양력 생일') 
                  : (evt.startDate ? '하루 종일' : evt.time);

                let customStyle = {};
                let isBoxMode = false;

                if (isBirthday) {
                  customStyle = {
                    border: '1px solid #fbcfe8',
                    borderLeft: '4px solid #db2777',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '8px'
                  };
                } else {
                  const displayMode = evt.displayMode || 'dot';
                  if (displayMode === 'box') {
                    isBoxMode = true;
                    let borderCol = '#3b82f6';
                    let bgCol = '#eff6ff';
                    let borderOuter = '#bfdbfe';
                    let textCol = '#1e3a8a';
                    if (evt.color === 'purple') { borderCol = '#a855f7'; bgCol = '#f3e8ff'; borderOuter = '#d8b4fe'; textCol = '#6b21a8'; }
                    else if (evt.color === 'emerald') { borderCol = '#10b981'; bgCol = '#dcfce7'; borderOuter = '#a7f3d0'; textCol = '#166534'; }
                    else if (evt.color === 'orange') { borderCol = '#f97316'; bgCol = '#ffedd5'; borderOuter = '#fed7aa'; textCol = '#c2410c'; }
                    else if (evt.color === 'pink') { borderCol = '#ec4899'; bgCol = '#fce7f3'; borderOuter = '#fbcfe8'; textCol = '#be185d'; }

                    customStyle = {
                      border: `1px solid ${borderOuter}`,
                      borderLeft: `4px solid ${borderCol}`,
                      backgroundColor: bgCol,
                      borderRadius: '8px',
                      color: textCol
                    };
                  } else {
                    customStyle = {
                      border: '1px solid var(--border-color)',
                      borderLeft: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: '8px'
                    };
                  }
                }

                let dotColor = '#3b82f6';
                if (evt.color === 'purple') dotColor = '#a855f7';
                else if (evt.color === 'emerald') dotColor = '#10b981';
                else if (evt.color === 'orange') dotColor = '#f97316';
                else if (evt.color === 'pink') dotColor = '#ec4899';

                const textCol = isBoxMode ? customStyle.color : undefined;

                return (
                  <div 
                    key={evt.id} 
                    className={`detail-event-row apt ${isBirthday ? 'birthday-row' : ''}`}
                    style={customStyle}
                  >
                    <div className="row-top">
                      <span className="row-title" style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        color: textCol,
                        fontWeight: isBoxMode ? '700' : '600'
                      }}>
                        {isPrivate && <ShieldAlert size={12} color={isBoxMode ? textCol : "#94a3b8"} />}
                        {isBirthday && <Cake size={12} color="#db2777" style={{ flexShrink: 0 }} />}
                        {!isBirthday && !isBoxMode && (
                          <span style={{ 
                            width: '6px', 
                            height: '6px', 
                            borderRadius: '50%', 
                            backgroundColor: isPrivate ? '#94a3b8' : dotColor, 
                            display: 'inline-block',
                            flexShrink: 0 
                          }} />
                        )}
                        {title}
                      </span>
                       {!isReadOnlyPerspective && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!isPrivate && (
                            <button onClick={() => onEditEvent(evt)} className="nav-btn" style={{ padding: '2px', color: isBoxMode ? textCol : 'inherit' }}>
                              <Edit3 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="row-time" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      color: isBoxMode ? textCol : 'var(--text-muted)',
                      opacity: isBoxMode ? 0.85 : 1
                    }}>
                      <Clock size={12} />
                      <span>{displayTime}</span>
                    </div>

                    {place && (
                      <div className="row-place" style={{ 
                        color: isBoxMode ? textCol : 'var(--text-muted)',
                        opacity: isBoxMode ? 0.85 : 1
                      }}>
                        <MapPin size={11} />
                        <span>{place}</span>
                      </div>
                    )}

                    {evt.participants && evt.participants.length > 0 && !isPrivate && (
                      <div className="row-participants">
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginRight: '4px' }}>참여자:</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {evt.participants.map((p, idx) => {
                            const details = getParticipantDetails(p);
                            return (
                              <div 
                                key={idx} 
                                className="participant-wrapper"
                              >
                                <img 
                                  src={p.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=80&auto=format&fit=crop"}
                                  alt={p.name}
                                  className="participant-avatar"
                                  style={{ cursor: 'pointer', display: 'block' }}
                                  onClick={() => setSelectedParticipant(details)}
                                />
                                <div className="participant-tooltip-bubble">
                                  {p.name}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
            })}
          </div>
        ) : (
          <div 
            style={{ 
              border: '1px dashed var(--border-color)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '24px 12px', 
              textAlign: 'center', 
              fontSize: '12px', 
              color: 'var(--text-muted)' 
            }}
          >
            오늘 등록된 일정이 없습니다.
          </div>
        )}
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
                  <span className="upcoming-title" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isBirthday ? (
                      <>
                        <Cake size={12} color="#db2777" style={{ flexShrink: 0 }} />
                        <span>{isPrivate ? '생일' : `${evt.name} 생일`}</span>
                      </>
                    ) : (
                      <>
                        <span style={{ flexShrink: 0 }}>✈</span>
                        <span>{isPrivate ? '여행' : evt.title}</span>
                      </>
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
      {!isReadOnlyPerspective && (
        <button 
          onClick={() => onAddEventClick(selectedDateStr)}
          className="btn-primary-add"
          style={{ marginTop: 'auto' }}
        >
          <Plus size={16} />
          <span>+ 일정 추가</span>
        </button>
      )}
      {/* Participant Detail Modal */}
      {selectedParticipant && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedParticipant(null)}
        >
          <div 
            className="pop-scale"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              width: '280px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ position: 'relative' }}>
              <img 
                src={selectedParticipant.avatar} 
                alt={selectedParticipant.name} 
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--primary-light)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                {selectedParticipant.name}
              </h3>
              <span 
                style={{ 
                  fontSize: '11px', 
                  backgroundColor: 'var(--primary-light)', 
                  color: 'var(--primary)', 
                  padding: '3px 10px', 
                  borderRadius: '12px',
                  fontWeight: '700'
                }}
              >
                {selectedParticipant.relation}
              </span>
            </div>
            <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>권한 범위</span>
                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{selectedParticipant.privilege}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>공유 상태</span>
                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                  {selectedParticipant.isSharing ? '연동 중' : '미연동'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setSelectedParticipant(null)}
              style={{
                marginTop: '8px',
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
