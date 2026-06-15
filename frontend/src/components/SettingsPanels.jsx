import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Bell, 
  Calendar, 
  Users, 
  Plane, 
  Cake, 
  Save, 
  Plus, 
  UserPlus, 
  Link2, 
  Link2Off,
  Moon,
  Sun
} from 'lucide-react';

export default function SettingsPanels({
  shifts,
  setShifts,
  alarmSettings,
  setAlarmSettings,
  settings,
  setSettings,
  sharedUsers,
  setSharedUsers,
  isPrivateMode,
  setIsPrivateMode,
  onAddBirthday,
  onAddTripConnection,
  trips,
  onDisconnectTrip
}) {
  // Local state for forms
  // 1. Shift times/colors (Dynamic Array)
  const [localShifts, setLocalShifts] = useState(() => Array.isArray(shifts) ? [...shifts] : []);

  useEffect(() => {
    setLocalShifts(Array.isArray(shifts) ? [...shifts] : []);
  }, [shifts]);

  const handleAddLocalShift = () => {
    const colors = ['#ea580c', '#7c3aed', '#2563eb', '#ef4444', '#db2777', '#94a3b8', '#16a34a'];
    const usedColors = localShifts.map(s => s.color);
    const unusedColor = colors.find(c => !usedColors.includes(c)) || colors[0];
    
    const newShift = {
      id: 'shift-' + Date.now(),
      label: '새 근무',
      start: '09:00',
      end: '18:00',
      color: unusedColor
    };
    setLocalShifts([...localShifts, newShift]);
  };

  const handleDeleteLocalShift = (id) => {
    if (localShifts.length <= 1) {
      alert('최소 한 개의 근무 유형은 유지해야 합니다.');
      return;
    }
    setLocalShifts(localShifts.filter(s => s.id !== id));
  };

  // 2. Alarms
  const [localAlarms, setLocalAlarms] = useState({ ...alarmSettings });

  // 3. Birthday Form
  const [bdayName, setBdayName] = useState('');
  const [bdayDate, setBdayDate] = useState('1995-05-15');
  const [bdayIsLunar, setBdayIsLunar] = useState(false);
  const [bdayAlarmOnDay, setBdayAlarmOnDay] = useState(true);
  const [bdayAlarmWeekBefore, setBdayAlarmWeekBefore] = useState(true);

  // 4. Trip Form
  const [tripTitle, setTripTitle] = useState('제주도 여행');
  const [tripStart, setTripStart] = useState('2024-05-23');
  const [tripEnd, setTripEnd] = useState('2024-05-25');
  const [tripColor, setTripColor] = useState('blue');

  // 5. Shared Target Form
  const [shareName, setShareName] = useState('');
  const [shareRelation, setShareRelation] = useState('친구');
  const [sharePrivilege, setSharePrivilege] = useState('보기 가능');

  const handleShiftSave = () => {
    setShifts([...localShifts]);
    alert('근무 스케줄 및 교대 유형 설정이 저장되었습니다.');
  };

  const handleAlarmSave = () => {
    setAlarmSettings({ ...localAlarms });
    alert('알림 설정이 저장되었습니다.');
  };

  const handleAddBirthday = (e) => {
    e.preventDefault();
    if (!bdayName.trim()) return;
    onAddBirthday({
      name: bdayName,
      date: bdayDate,
      isLunar: bdayIsLunar,
      alarmOnDay: bdayAlarmOnDay,
      alarmWeekBefore: bdayAlarmWeekBefore
    });
    setBdayName('');
    alert(`${bdayName}님의 생일이 성공적으로 등록되었습니다.`);
  };

  const handleAddTrip = (e) => {
    e.preventDefault();
    if (!tripTitle.trim() || !tripStart || !tripEnd) return;
    onAddTripConnection({
      title: tripTitle,
      startDate: tripStart,
      endDate: tripEnd,
      color: tripColor,
      place: '제주도'
    });
    alert('여행 일정이 연결되었습니다.');
  };

  const handleAddShareTarget = () => {
    if (!shareName.trim()) return;
    const newTarget = {
      id: Date.now().toString(),
      name: shareName,
      relation: shareRelation,
      avatar: '',
      privilege: sharePrivilege,
      isSharing: true
    };
    setSharedUsers([...sharedUsers, newTarget]);
    setShareName('');
    alert(`${shareName}님과 캘린더 공유가 등록되었습니다.`);
  };

  return (
    <div className="settings-section-container">
      {/* 1. 스케줄 설정 */}
      <div className="settings-panel-card">
        <h3 className="panel-title">
          <Clock size={16} color="var(--primary)" />
          <span>근무 유형 설정</span>
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
          {/* Shift Inputs loop */}
          {localShifts.map((shift, index) => {
            const colors = ['#16a34a', '#ea580c', '#7c3aed', '#2563eb', '#ef4444', '#db2777', '#94a3b8'];
            return (
              <div key={shift.id} style={{ borderTop: index > 0 ? '1px solid #f1f5f9' : 'none', paddingTop: index > 0 ? '8px' : '0' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                  {/* Editable Label Name */}
                  <input 
                    type="text"
                    className="input-text"
                    style={{ fontWeight: 'bold', fontSize: '11px', maxWidth: '75px', padding: '2px 6px', height: '22px', backgroundColor: '#f1f5f9' }}
                    value={shift.label}
                    onChange={(e) => {
                      const updated = localShifts.map(s => s.id === shift.id ? { ...s, label: e.target.value } : s);
                      setLocalShifts(updated);
                    }}
                    placeholder="근무명"
                  />

                  {/* Color Picker */}
                  <div style={{ display: 'flex', gap: '3px', marginLeft: 'auto' }}>
                    {colors.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          const updated = localShifts.map(s => s.id === shift.id ? { ...s, color: c } : s);
                          setLocalShifts(updated);
                        }}
                        style={{
                          width: '11px',
                          height: '11px',
                          borderRadius: '50%',
                          backgroundColor: c,
                          border: shift.color === c ? '2.5px solid #1e293b' : '1px solid #cbd5e1',
                          padding: 0,
                          cursor: 'pointer'
                        }}
                        title={c}
                      />
                    ))}
                  </div>

                  {/* Remove Button */}
                  {localShifts.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => handleDeleteLocalShift(shift.id)}
                      style={{ fontSize: '12px', color: '#ef4444', padding: '2px', display: 'flex', alignItems: 'center' }}
                      title="근무 삭제"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Time range inputs */}
                <div className="settings-input-group">
                  <input 
                    type="text" 
                    className="input-text" 
                    style={{ padding: '4px 8px', fontSize: '11px', height: '24px' }}
                    value={shift.start}
                    onChange={(e) => {
                      const updated = localShifts.map(s => s.id === shift.id ? { ...s, start: e.target.value } : s);
                      setLocalShifts(updated);
                    }}
                  />
                  <span style={{ fontSize: '11px' }}>~</span>
                  <input 
                    type="text" 
                    className="input-text" 
                    style={{ padding: '4px 8px', fontSize: '11px', height: '24px' }}
                    value={shift.end}
                    onChange={(e) => {
                      const updated = localShifts.map(s => s.id === shift.id ? { ...s, end: e.target.value } : s);
                      setLocalShifts(updated);
                    }}
                  />
                </div>
              </div>
            );
          })}

          <button 
            type="button"
            onClick={handleAddLocalShift}
            className="btn-secondary"
            style={{ padding: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', border: '1px dashed var(--border-color)', marginTop: '4px' }}
          >
            + 근무 추가
          </button>

          <button onClick={handleShiftSave} className="btn-save" style={{ marginTop: '8px' }}>
            저장
          </button>
        </div>
      </div>


      {/* 2. 알림 설정 */}
      <div className="settings-panel-card">
        <h3 className="panel-title">
          <Bell size={16} color="var(--primary)" />
          <span>알림 설정</span>
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="toggle-switch-row">
            <span className="settings-label">일정 알람</span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={localAlarms.enableEventAlarm}
                onChange={(e) => setLocalAlarms({ ...localAlarms, enableEventAlarm: e.target.checked })}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="settings-form-row">
            <span className="settings-label">알람 시간</span>
            <select 
              value={localAlarms.eventAlarmTime}
              onChange={(e) => setLocalAlarms({ ...localAlarms, eventAlarmTime: e.target.value })}
            >
              <option value="당일 09:00">당일 09:00</option>
              <option value="전날 18:00">전날 18:00</option>
              <option value="전날 21:00">전날 21:00</option>
              <option value="1시간 전">1시간 전</option>
            </select>
          </div>

          <div className="toggle-switch-row">
            <span className="settings-label">반복 알람</span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={localAlarms.enableRepeatAlarm}
                onChange={(e) => setLocalAlarms({ ...localAlarms, enableRepeatAlarm: e.target.checked })}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="toggle-switch-row">
            <span className="settings-label">공휴일 알람 제외</span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={localAlarms.excludeHolidays}
                onChange={(e) => setLocalAlarms({ ...localAlarms, excludeHolidays: e.target.checked })}
              />
              <span className="slider"></span>
            </label>
          </div>

          <button onClick={handleAlarmSave} className="btn-save" style={{ marginTop: '14px' }}>
            저장
          </button>
        </div>
      </div>

      {/* 3. 공휴일 캘린더 */}
      <div className="settings-panel-card">
        <h3 className="panel-title">
          <Calendar size={16} color="#ef4444" />
          <span>공휴일 캘린더</span>
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              id="chk-korean-h"
              checked={settings.showKoreanHolidays}
              onChange={(e) => setSettings({ ...settings, showKoreanHolidays: e.target.checked })}
            />
            <label htmlFor="chk-korean-h" className="settings-label" style={{ cursor: 'pointer' }}>한국 공휴일 표시</label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              id="chk-alt-h"
              checked={settings.showAlternativeHolidays}
              onChange={(e) => setSettings({ ...settings, showAlternativeHolidays: e.target.checked })}
            />
            <label htmlFor="chk-alt-h" className="settings-label" style={{ cursor: 'pointer' }}>대체 공휴일 표시</label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              id="chk-lunar-a"
              checked={settings.showLunarAnniversaries}
              onChange={(e) => setSettings({ ...settings, showLunarAnniversaries: e.target.checked })}
            />
            <label htmlFor="chk-lunar-a" className="settings-label" style={{ cursor: 'pointer' }}>음력 기념일 표시</label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              id="chk-my-a"
              checked={settings.showMyAnniversaries}
              onChange={(e) => setSettings({ ...settings, showMyAnniversaries: e.target.checked })}
            />
            <label htmlFor="chk-my-a" className="settings-label" style={{ cursor: 'pointer' }}>내 기념일 표시</label>
          </div>
          
          <button 
            className="btn-secondary" 
            style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={() => alert('달력 데이터가 추가로 연동되었습니다.')}
          >
            + 캘린더 추가
          </button>
        </div>
      </div>

      {/* 4. 공유 캘린더 */}
      <div className="settings-panel-card">
        <h3 className="panel-title">
          <Users size={16} color="#10b981" />
          <span>공유 캘린더</span>
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <div className="toggle-switch-row" style={{ paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
            <span className="settings-label" style={{ color: 'var(--primary)', fontWeight: '700' }}>나만 보기 모드</span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={isPrivateMode}
                onChange={(e) => setIsPrivateMode(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          {/* List of current share partners */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
            {sharedUsers.map(user => (
              <div 
                key={user.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  fontSize: '11px',
                  backgroundColor: '#f8fafc',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
              >
                <span>{user.relation} ({user.name})</span>
                <span style={{ 
                  color: user.privilege.includes('편집') ? '#dc2626' : '#2563eb',
                  fontWeight: '600'
                }}>
                  {user.privilege}
                </span>
              </div>
            ))}
          </div>

          {/* Add Partner Form */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input 
                type="text" 
                placeholder="친구 이름"
                className="input-text"
                style={{ padding: '4px 8px', fontSize: '11px' }}
                value={shareName}
                onChange={(e) => setShareName(e.target.value)}
              />
              <select 
                style={{ padding: '4px', fontSize: '11px' }}
                value={shareRelation}
                onChange={(e) => setShareRelation(e.target.value)}
              >
                <option value="연인">연인</option>
                <option value="가족">가족</option>
                <option value="친구">친구</option>
              </select>
            </div>
            <button 
              onClick={handleAddShareTarget}
              className="btn-secondary" 
              style={{ padding: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <UserPlus size={12} />
              공유 대상 추가
            </button>
          </div>
        </div>
      </div>

      {/* 5. 여행 일정 연결 */}
      <div className="settings-panel-card">
        <h3 className="panel-title">
          <Plane size={16} color="var(--apt-text)" />
          <span>여행 일정 연결</span>
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {trips.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="trip-connection-timeline">
                {trips.map((trip, idx) => (
                  <div key={trip.id} className="timeline-node">
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>
                      {trip.title} ({trip.startDate === trip.endDate ? '당일' : `${idx + 1}일차`})
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {trip.startDate} ~ {trip.endDate}
                    </span>
                  </div>
                ))}
              </div>
              <button 
                onClick={onDisconnectTrip}
                className="btn-secondary"
                style={{ color: '#ef4444', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Link2Off size={12} />
                일정 연결 해제
              </button>
            </div>
          ) : (
            <form onSubmit={handleAddTrip} style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
              <input 
                type="text" 
                placeholder="여행 제목 (예: 제주도 여행)"
                className="input-text"
                style={{ padding: '6px', fontSize: '11px' }}
                value={tripTitle}
                onChange={(e) => setTripTitle(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '4px' }}>
                <input 
                  type="date" 
                  className="input-text" 
                  style={{ padding: '4px', fontSize: '10px' }}
                  value={tripStart}
                  onChange={(e) => setTripStart(e.target.value)}
                />
                <input 
                  type="date" 
                  className="input-text" 
                  style={{ padding: '4px', fontSize: '10px' }}
                  value={tripEnd}
                  onChange={(e) => setTripEnd(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                className="btn-secondary" 
                style={{ padding: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: 'auto' }}
              >
                <Link2 size={12} />
                일정 연결하기
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 6. 생일 설정 */}
      <div className="settings-panel-card">
        <h3 className="panel-title">
          <Cake size={16} color="#db2777" />
          <span>생일 설정</span>
        </h3>
        
        <form onSubmit={handleAddBirthday} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="settings-form-row">
            <input 
              type="text" 
              placeholder="이름 (예: 민지)"
              className="input-text"
              style={{ padding: '6px', fontSize: '12px' }}
              value={bdayName}
              onChange={(e) => setBdayName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input 
              type="date" 
              className="input-text"
              style={{ padding: '4px', fontSize: '11px' }}
              value={bdayDate}
              onChange={(e) => setBdayDate(e.target.value)}
              required
            />
            
            {/* Lunar Solar Toggle */}
            <div className="solar-lunar-btn-group">
              <button 
                type="button"
                onClick={() => setBdayIsLunar(false)} 
                className={`solar-lunar-btn ${!bdayIsLunar ? 'active' : ''}`}
                style={{ padding: '4px 6px' }}
              >
                양력
              </button>
              <button 
                type="button"
                onClick={() => setBdayIsLunar(true)} 
                className={`solar-lunar-btn ${bdayIsLunar ? 'active' : ''}`}
                style={{ padding: '4px 6px' }}
              >
                음력
              </button>
            </div>
          </div>

          {/* Alarm rules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
            <div className="toggle-switch-row" style={{ fontSize: '11px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>생일 당일 알림</span>
              <label className="switch" style={{ width: '30px', height: '16px' }}>
                <input 
                  type="checkbox" 
                  checked={bdayAlarmOnDay}
                  onChange={(e) => setBdayAlarmOnDay(e.target.checked)}
                />
                <span className="slider" style={{ borderRadius: '16px' }}></span>
              </label>
            </div>
            
            <div className="toggle-switch-row" style={{ fontSize: '11px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1주일 전 알림</span>
              <label className="switch" style={{ width: '30px', height: '16px' }}>
                <input 
                  type="checkbox" 
                  checked={bdayAlarmWeekBefore}
                  onChange={(e) => setBdayAlarmWeekBefore(e.target.checked)}
                />
                <span className="slider" style={{ borderRadius: '16px' }}></span>
              </label>
            </div>
          </div>

          <button type="submit" className="btn-save" style={{ padding: '6px', fontSize: '12px' }}>
            생일 저장
          </button>
        </form>
      </div>
    </div>
  );
}
