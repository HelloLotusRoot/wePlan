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
  Sun,
  Trash2,
  Search,
  X
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
  hideHolidayCalendar = false,
  onlyHolidayCalendar = false,
  hideSharedSettings = false,
  onlySharedSettings = false,
  onlyScheduleSettings = false,
  onlyAlarmSettings = false,
  onlyBirthdaySettings = false,
  hidePanelTitles = false,
  relationGroups = ['친구', '연인', '가족'],
  setRelationGroups,
  calendarPerspective,
  setCalendarPerspective,
  currentTab
}) {
  // Local state for forms
  // 1. Shift times/colors (Dynamic Array)
  const [localShifts, setLocalShifts] = useState(() => Array.isArray(shifts) ? [...shifts] : []);
  const [openTimePicker, setOpenTimePicker] = useState(null); // { id: 'shift-xxx', type: 'start'|'end' } | null

  useEffect(() => {
    setLocalShifts(Array.isArray(shifts) ? [...shifts] : []);
  }, [shifts]);

  const showSchedule = onlyScheduleSettings || (!onlyHolidayCalendar && !onlySharedSettings && !onlyAlarmSettings && !onlyBirthdaySettings);
  const showAlarm = onlyAlarmSettings || (!onlyHolidayCalendar && !onlySharedSettings && !onlyScheduleSettings && !onlyBirthdaySettings);
  const showHoliday = onlyHolidayCalendar || (!onlySharedSettings && !onlyScheduleSettings && !onlyAlarmSettings && !onlyBirthdaySettings && !hideHolidayCalendar);
  const showShared = onlySharedSettings || (!onlyHolidayCalendar && !onlyScheduleSettings && !onlyAlarmSettings && !onlyBirthdaySettings && !hideSharedSettings);
  const showBirthday = onlyBirthdaySettings || (!onlyHolidayCalendar && !onlySharedSettings && !onlyScheduleSettings && !onlyAlarmSettings);



  const handleAddLocalShift = () => {
    const colors = ['#10b981', '#f97316', '#818cf8', '#3b82f6', '#f43f5e', '#ec4899', '#64748b'];
    const usedColors = localShifts.map(s => s.color);
    const unusedColor = colors.find(c => !usedColors.includes(c)) || colors[0];
    
    const newShift = {
      id: 'shift-' + Date.now(),
      label: '새 근무',
      start: '09:00',
      end: '18:00',
      color: unusedColor,
      defaultOvertime: 0
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



  // 5. Shared Target Form
  const [shareName, setShareName] = useState('');
  const [shareRelation, setShareRelation] = useState(() => relationGroups[0] || '친구');
  const [sharePrivilege, setSharePrivilege] = useState('보기 가능');
  
  useEffect(() => {
    if (relationGroups && relationGroups.length > 0 && !relationGroups.includes(shareRelation)) {
      setShareRelation(relationGroups[0]);
    }
  }, [relationGroups]);

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



  // Search & Filter state for sharing partners list
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  
  const filteredUsers = (sharedUsers || []).filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroupFilter === 'all' || 
      user.relation.replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, '').trim() === selectedGroupFilter;
    return matchesSearch && matchesGroup;
  });

  const [newGroupName, setNewGroupName] = useState('');

  const handleCreateGroup = () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    if (relationGroups.includes(trimmed)) {
      alert('이미 존재하는 그룹 이름입니다.');
      return;
    }
    setRelationGroups([...relationGroups, trimmed]);
    setNewGroupName('');
  };

  const handleDeleteGroup = (group) => {
    if (relationGroups.length <= 1) {
      alert('최소 한 개의 그룹은 유지해야 합니다.');
      return;
    }
    if (window.confirm(`"${group}" 그룹을 삭제하시겠습니까?`)) {
      setRelationGroups(relationGroups.filter(g => g !== group));
    }
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
    alert(`${shareName}님과 일정 공유가 등록되었습니다.`);
  };

  return (
    <div className="settings-section-container">
      {/* 1. 스케줄 설정 */}
      {showSchedule && (
      <div className="settings-panel-card" id="card-schedule">
        {!hidePanelTitles && <h3 className="panel-title">
          <Clock size={16} color="var(--primary)" />
          <span>근무 유형 설정</span>
        </h3>}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Shift Inputs loop */}
          {localShifts.map((shift, index) => {
            const colors = ['#10b981', '#f97316', '#818cf8', '#3b82f6', '#f43f5e', '#ec4899', '#64748b'];
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
                  <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto', alignItems: 'center', paddingRight: '4px' }}>
                    {colors.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          const updated = localShifts.map(s => s.id === shift.id ? { ...s, color: c } : s);
                          setLocalShifts(updated);
                        }}
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: c + '25',
                          border: shift.color === c ? `2.5px solid ${c}` : `1px solid ${c}40`,
                          padding: 0,
                          cursor: 'pointer',
                          transform: shift.color === c ? 'scale(1.2)' : 'scale(1)',
                          transition: 'all 0.15s ease-in-out',
                          outline: 'none',
                          boxShadow: shift.color === c ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
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

                {/* Time range & defaultOvertime inputs */}
                <div className="settings-input-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* Start Time Picker */}
                  <div style={{ position: 'relative', flex: 1, overflow: 'visible' }}>
                    <input 
                      type="text" 
                      readOnly
                      className="input-text" 
                      style={{ padding: '4px 8px', fontSize: '11px', height: '24px', width: '100%', textAlign: 'center', cursor: 'pointer' }}
                      value={formatTimeLabel(shift.start)}
                      onClick={() => setOpenTimePicker({ id: shift.id, type: 'start' })}
                    />
                    {openTimePicker?.id === shift.id && openTimePicker?.type === 'start' && (
                      <TimePickerDropdown 
                        value={shift.start} 
                        onChange={(val) => {
                          const updated = localShifts.map(s => s.id === shift.id ? { ...s, start: val } : s);
                          setLocalShifts(updated);
                        }}
                        onClose={() => setOpenTimePicker(null)}
                        align="left"
                      />
                    )}
                  </div>
                  
                  <span style={{ fontSize: '11px' }}>~</span>
                  
                  {/* End Time Picker */}
                  <div style={{ position: 'relative', flex: 1, overflow: 'visible' }}>
                    <input 
                      type="text" 
                      readOnly
                      className="input-text" 
                      style={{ padding: '4px 8px', fontSize: '11px', height: '24px', width: '100%', textAlign: 'center', cursor: 'pointer' }}
                      value={formatTimeLabel(shift.end)}
                      onClick={() => setOpenTimePicker({ id: shift.id, type: 'end' })}
                    />
                    {openTimePicker?.id === shift.id && openTimePicker?.type === 'end' && (
                      <TimePickerDropdown 
                        value={shift.end} 
                        onChange={(val) => {
                          const updated = localShifts.map(s => s.id === shift.id ? { ...s, end: val } : s);
                          setLocalShifts(updated);
                        }}
                        onClose={() => setOpenTimePicker(null)}
                        align="right"
                      />
                    )}
                  </div>

                </div>
              </div>
            );
          })}

          <button 
            type="button"
            onClick={handleAddLocalShift}
            className="shift-add-btn"
          >
            <Plus size={14} />
            근무 유형 추가
          </button>

          <button onClick={handleShiftSave} className="btn-save" style={{ marginTop: '8px' }}>
            저장
          </button>

        </div>
      </div>
      )}


      {/* 2. 알림 설정 */}
      {showAlarm && (
      <div className="settings-panel-card" id="card-alarm">
        {!hidePanelTitles && <h3 className="panel-title">
          <Bell size={16} color="var(--primary)" />
          <span>알림 설정</span>
        </h3>}
        
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
      )}

      {/* 3. 공휴일 캘린더 */}
      {showHoliday && (
      <div className="settings-panel-card" id="card-holiday">
        <h3 className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} color="#ef4444" />
            <span>공휴일 캘린더</span>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={settings.showHolidayCalendar !== false}
              onChange={(e) => setSettings({ ...settings, showHolidayCalendar: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', opacity: settings.showHolidayCalendar !== false ? 1 : 0.5 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              id="chk-korean-h"
              checked={settings.showKoreanHolidays}
              disabled={settings.showHolidayCalendar === false}
              onChange={(e) => setSettings({ ...settings, showKoreanHolidays: e.target.checked })}
            />
            <label htmlFor="chk-korean-h" className="settings-label" style={{ cursor: settings.showHolidayCalendar === false ? 'not-allowed' : 'pointer' }}>한국 공휴일 표시</label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              id="chk-alt-h"
              checked={settings.showAlternativeHolidays}
              disabled={settings.showHolidayCalendar === false}
              onChange={(e) => setSettings({ ...settings, showAlternativeHolidays: e.target.checked })}
            />
            <label htmlFor="chk-alt-h" className="settings-label" style={{ cursor: settings.showHolidayCalendar === false ? 'not-allowed' : 'pointer' }}>대체 공휴일 표시</label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              id="chk-lunar-a"
              checked={settings.showLunarAnniversaries}
              disabled={settings.showHolidayCalendar === false}
              onChange={(e) => setSettings({ ...settings, showLunarAnniversaries: e.target.checked })}
            />
            <label htmlFor="chk-lunar-a" className="settings-label" style={{ cursor: settings.showHolidayCalendar === false ? 'not-allowed' : 'pointer' }}>음력 기념일 표시</label>
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
      )}

      {/* 4. 일정 공유 */}
      {showShared && (
      <div className="settings-panel-card" id="card-shared">
        <h3 className="panel-title">
          <Users size={16} color="#10b981" />
          <span>일정 공유 설정</span>
        </h3>
        
        <div className="sharing-card-layout">
          {/* Left Column: Settings, Add Target, Group Management */}
          <div className="sharing-card-left">
            <div className="sharing-toggle-row">
              <span className="settings-label" style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '12px' }}>나만 보기 모드</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={isPrivateMode}
                  onChange={(e) => setIsPrivateMode(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            {/* Add Partner Form */}
            <div className="sharing-sub-section">
              <span className="sharing-sub-title">
                <UserPlus size={13} color="var(--primary)" />
                공유 대상 추가
              </span>
              <div className="sharing-add-grid">
                <input 
                  type="text" 
                  placeholder="친구 이름"
                  className="sharing-add-input"
                  value={shareName}
                  onChange={(e) => setShareName(e.target.value)}
                />
                <select 
                  className="sharing-add-select"
                  value={shareRelation}
                  onChange={(e) => setShareRelation(e.target.value)}
                >
                  {relationGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
                <select 
                  className="sharing-add-select"
                  value={sharePrivilege}
                  onChange={(e) => setSharePrivilege(e.target.value)}
                >
                  <option value="보기 가능">보기 가능</option>
                  <option value="편집 가능">편집 가능</option>
                </select>
              </div>
              <button 
                onClick={handleAddShareTarget}
                className="sharing-add-btn" 
              >
                <UserPlus size={13} />
                공유 상대 등록
              </button>
            </div>

            {/* Group Management Section */}
            <div className="sharing-sub-section">
              <span className="sharing-sub-title">
                <Users size={13} color="var(--primary)" />
                공유 그룹 관리
              </span>
              <div className="sharing-group-badge-list">
                {relationGroups.map(group => (
                  <span 
                    key={group}
                    className="sharing-group-badge"
                  >
                    {group}
                    {relationGroups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(group)}
                        className="sharing-group-delete-btn"
                        title="그룹 삭제"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              
              <div className="sharing-group-add-row">
                <input 
                  type="text" 
                  placeholder="새 그룹 이름"
                  className="sharing-group-add-input"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={handleCreateGroup}
                  className="sharing-group-add-btn" 
                >
                  + 추가
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Friends List, Search & Filter, Perspective */}
          <div className="sharing-card-right">
            <span className="sharing-group-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={13} color="var(--primary)" />
              일정 공유 친구 목록 ({filteredUsers.length}명)
            </span>

            {/* Search & Filter Controls */}
            <div className="sharing-search-container">
              <div className="sharing-search-input-wrapper">
                <Search size={14} className="sharing-search-icon" />
                <input 
                  type="text"
                  placeholder="공유인 이름 검색"
                  className="sharing-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="sharing-filter-select"
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
              >
                <option value="all">모든 그룹</option>
                {relationGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>

            {/* List of current share partners */}
            <div className="sharing-partners-list">
              {filteredUsers.length === 0 ? (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                  검색된 공유 친구가 없습니다.
                </div>
              ) : (
                filteredUsers.map(user => {
                  const isActivePerspective = calendarPerspective === user.id;
                  return (
                    <div 
                      key={user.id} 
                      className={`sharing-partner-row ${isActivePerspective ? 'active-perspective' : ''}`}
                      onClick={() => setCalendarPerspective(isActivePerspective ? 'me' : user.id)}
                      title={isActivePerspective ? "내 시점으로 복귀" : `${user.name} 시점의 화면 보기`}
                    >
                      <div className="sharing-partner-info">
                        {/* Avatar */}
                        <div className="sharing-partner-avatar">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            user.name.substring(0, 1)
                          )}
                        </div>
                        <span className="sharing-partner-name-group">
                          {user.name} 
                          <span className="sharing-partner-group-badge">
                            {user.relation.replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, '').trim()}
                          </span>
                        </span>
                        {isActivePerspective && (
                          <span className="perspective-active-badge">
                            시점 활성
                          </span>
                        )}
                      </div>
                      
                      {/* Privilege Select */}
                      <select
                        value={user.privilege}
                        onChange={(e) => {
                          const updated = sharedUsers.map(u => u.id === user.id ? { ...u, privilege: e.target.value } : u);
                          setSharedUsers(updated);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`sharing-partner-privilege-select ${user.privilege.includes('편집') ? 'edit-allow' : 'read-only'}`}
                      >
                        <option value="보기 가능">보기 가능</option>
                        <option value="편집 가능">편집 가능</option>
                      </select>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`${user.name}님과의 일정 공유를 중단하시겠습니까?`)) {
                            setSharedUsers(sharedUsers.filter(u => u.id !== user.id));
                            if (isActivePerspective) setCalendarPerspective('me');
                          }
                        }}
                        className="sharing-partner-delete-btn"
                        title="공유 해제"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
      )}



      {/* 6. 생일 설정 */}
      {showBirthday && (
      <div className="settings-panel-card" id="card-birthday">
        {!hidePanelTitles && <h3 className="panel-title">
          <Cake size={16} color="#db2777" />
          <span>생일 설정</span>
        </h3>}
        
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
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={bdayAlarmOnDay}
                  onChange={(e) => setBdayAlarmOnDay(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
            
            <div className="toggle-switch-row" style={{ fontSize: '11px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>1주일 전 알림</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={bdayAlarmWeekBefore}
                  onChange={(e) => setBdayAlarmWeekBefore(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <button type="submit" className="btn-save" style={{ padding: '6px', fontSize: '12px' }}>
            생일 저장
          </button>
        </form>
      </div>
      )}
    </div>
  );
}
// Time picker dropdown & format helpers
const formatTimeLabel = (timeStr) => {
  if (!timeStr || !timeStr.includes(':')) return timeStr || '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? '오후' : '오전';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const formattedH = String(displayH).padStart(2, '0');
  const formattedM = String(m).padStart(2, '0');
  return `${ampm} ${formattedH}:${formattedM}`;
};

function TimePickerDropdown({ value, onChange, onClose, align = 'left' }) {
  const [hStr, mStr] = (value || "09:00").split(':');
  const initH = parseInt(hStr, 10);
  const initM = parseInt(mStr, 10);
  
  const currentAmpm = initH >= 12 ? '오후' : '오전';
  const currentHour = initH % 12 === 0 ? 12 : initH % 12;
  const currentMinute = initM;

  const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1 ~ 12
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 00, 05, 10 ... 55 (5분 단위)

  const ampmRef = React.useRef(null);
  const hoursRef = React.useRef(null);
  const minutesRef = React.useRef(null);

  useEffect(() => {
    // Scroll active items into view on mount
    setTimeout(() => {
      [ampmRef, hoursRef, minutesRef].forEach(ref => {
        if (ref.current) {
          const activeEl = ref.current.querySelector('.dropdown-item.active');
          if (activeEl) {
            const container = ref.current;
            container.scrollTop = activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2;
          }
        }
      });
    }, 50);
  }, []);

  const handleSelect = (newAmpm, newHour, newMin) => {
    let h = newHour;
    if (newAmpm === '오후' && h < 12) h += 12;
    if (newAmpm === '오전' && h === 12) h = 0;
    const formattedH = String(h).padStart(2, '0');
    const formattedM = String(newMin).padStart(2, '0');
    onChange(`${formattedH}:${formattedM}`);
  };

  return (
    <>
      <div 
        className="dropdown-backdrop" 
        onClick={onClose} 
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1009, background: 'transparent' }}
      />
      <div 
        className="custom-dropdown-menu" 
        style={{ 
          display: 'flex', 
          flexDirection: 'row',
          gap: '0', 
          padding: '4px', 
          width: '180px', 
          zIndex: 1010,
          maxHeight: '180px',
          overflow: 'hidden',
          position: 'absolute',
          top: '100%',
          left: align === 'left' ? 0 : 'auto',
          right: align === 'right' ? 0 : 'auto',
          marginTop: '4px'
        }}
      >
        {/* 오전/오후 */}
        <div 
          ref={ampmRef}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)' }}
        >
          {['오전', '오후'].map(ampm => {
            const active = ampm === currentAmpm;
            return (
              <div 
                key={ampm} 
                className={`dropdown-item ${active ? 'active' : ''}`}
                onClick={() => handleSelect(ampm, currentHour, currentMinute)}
                style={{ textAlign: 'center', padding: '6px 0', fontSize: '11px', cursor: 'pointer' }}
              >
                {ampm}
              </div>
            );
          })}
        </div>

        {/* 시 */}
        <div 
          ref={hoursRef}
          style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)' }}
        >
          {hours.map(h => {
            const active = h === currentHour;
            const formattedH = String(h).padStart(2, '0');
            return (
              <div 
                key={h} 
                className={`dropdown-item ${active ? 'active' : ''}`}
                onClick={() => handleSelect(currentAmpm, h, currentMinute)}
                style={{ textAlign: 'center', padding: '6px 0', fontSize: '11px', cursor: 'pointer' }}
              >
                {formattedH}
              </div>
            );
          })}
        </div>

        {/* 분 */}
        <div 
          ref={minutesRef}
          style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
        >
          {minutes.map(m => {
            const active = m === currentMinute;
            const formattedM = String(m).padStart(2, '0');
            return (
              <div 
                key={m} 
                className={`dropdown-item ${active ? 'active' : ''}`}
                onClick={() => handleSelect(currentAmpm, currentHour, m)}
                style={{ textAlign: 'center', padding: '6px 0', fontSize: '11px', cursor: 'pointer' }}
              >
                {formattedM}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
