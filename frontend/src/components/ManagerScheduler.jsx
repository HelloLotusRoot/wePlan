import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Sparkles, 
  Download, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw,
  Clock,
  UserCheck,
  ToggleLeft,
  Calendar,
  AlertCircle,
  Settings, Paintbrush
} from 'lucide-react';

export default function ManagerScheduler({ 
  currentDate, 
  events = [], 
  setEvents,
  shifts = [] 
}) {
  // 1. Core States
  const [selectedYear, setSelectedYear] = useState(() => currentDate ? currentDate.getFullYear() : new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => currentDate ? currentDate.getMonth() + 1 : new Date().getMonth() + 1);
  const [selectedBrush, setSelectedBrush] = useState(null);
  const [showStaffManagerModal, setShowStaffManagerModal] = useState(false);
  const [showBrushManagerModal, setShowBrushManagerModal] = useState(false); // The shift type selected to "paint" onto cells

  // 2. Staff State with Qualitative constraints (avoidWith, specialNote, specialRequests)
  const [staffList, setStaffList] = useState(() => {
    const saved = localStorage.getItem('weplan_manager_staff');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Backward compatibility check for new properties
          return parsed.map(s => ({
            ...s,
            team: s.team || '',
            avoidWith: s.avoidWith || [],
            specialNote: s.specialNote || '',
            specialRequests: s.specialRequests || { nightAvoid: false, weekendOff: false, couplingWith: '' }
          }));
        }
      } catch (e) {}
    }
    // Default mock staff with realistic qualitative properties
    return [
      { 
        id: 'staff-1', 
        name: '이순정', 
        role: '수간호사', 
        team: '',
        color: '#6366f1', 
        expLevel: 'senior',
        avoidWith: [],
        specialNote: '병동 최고 경력 관리 책임자',
        specialRequests: { nightAvoid: true, weekendOff: false, couplingWith: '' }
      },
      { 
        id: 'staff-2', 
        name: '김소현', 
        role: '일반간호사', 
        team: '',
        color: '#10b981', 
        expLevel: 'senior',
        avoidWith: [],
        specialNote: 'IV 정맥주사 전담 전임간호사',
        specialRequests: { nightAvoid: false, weekendOff: false, couplingWith: '' }
      },
      { 
        id: 'staff-3', 
        name: '박하은', 
        role: '일반간호사', 
        team: '',
        color: '#f59e0b', 
        expLevel: 'senior',
        avoidWith: [],
        specialNote: '프리셉터 사수 (최다온의 지도사수)',
        specialRequests: { nightAvoid: false, weekendOff: false, couplingWith: 'staff-5' }
      },
      { 
        id: 'staff-4', 
        name: '정우진', 
        role: '일반간호사', 
        team: '',
        color: '#ec4899', 
        expLevel: 'junior',
        avoidWith: ['staff-5'], // 갈등 관계 예시 (최다온과 배치 회피)
        specialNote: '건강 사정상 야간근무 임시 제외 대상',
        specialRequests: { nightAvoid: true, weekendOff: false, couplingWith: '' }
      },
      { 
        id: 'staff-5', 
        name: '최다온', 
        role: '신규간호사', 
        team: '',
        color: '#06b6d4', 
        expLevel: 'junior',
        avoidWith: ['staff-4'],
        specialNote: '프리셉티 신입 (박하은 간호사와 동행)',
        specialRequests: { nightAvoid: false, weekendOff: false, couplingWith: 'staff-3' }
      }
    ];
  });

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('일반간호사');
  const [newStaffExpLevel, setNewStaffExpLevel] = useState('senior'); // 'senior' or 'junior'
  const [newStaffTeam, setNewStaffTeam] = useState('');

  // 3. Unified custom roles & team states
  const [customRoles, setCustomRoles] = useState(() => {
    const saved = localStorage.getItem('weplan_custom_roles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return ['수간호사', '주임간호사', '일반간호사', '신규간호사', '매니저', '평일알바', '주말알바'];
  });

  const [useTeams, setUseTeams] = useState(() => {
    const saved = localStorage.getItem('weplan_use_teams');
    return saved === 'true';
  });

  const [showRoleManagerModal, setShowRoleManagerModal] = useState(false);
  const [editingRoleIndex, setEditingRoleIndex] = useState(null);
  const [editingRoleValue, setEditingRoleValue] = useState('');
  const [newRoleInputValue, setNewRoleInputValue] = useState('');

  // Role Management Handlers
  const handleAddRole = (roleName) => {
    const val = roleName.trim();
    if (!val) return;
    if (customRoles.includes(val)) {
      alert('이미 존재하는 역할입니다.');
      return;
    }
    setCustomRoles(prev => [...prev, val]);
    setNewRoleInputValue('');
  };

  const handleDeleteRole = (roleName) => {
    if (customRoles.length <= 1) {
      alert('최소 하나의 역할은 존재해야 합니다.');
      return;
    }
    if (!window.confirm(`'${roleName}' 역할을 삭제하시겠습니까? 해당 역할의 조원들은 첫 번째 역할로 안전하게 자동 리셋됩니다.`)) return;
    
    const updatedRoles = customRoles.filter(r => r !== roleName);
    setCustomRoles(updatedRoles);
    
    // Safely remap staff members possessing this role to the first role in the updated list
    const fallbackRole = updatedRoles[0];
    setStaffList(prev => prev.map(s => {
      if (s.role === roleName) {
        return { ...s, role: fallbackRole };
      }
      return s;
    }));
  };

  const handleUpdateRole = (index, oldName, newName) => {
    const val = newName.trim();
    if (!val) return;
    if (val === oldName) {
      setEditingRoleIndex(null);
      return;
    }
    if (customRoles.includes(val)) {
      alert('이미 존재하는 역할입니다.');
      return;
    }

    const updatedRoles = [...customRoles];
    updatedRoles[index] = val;
    setCustomRoles(updatedRoles);

    // Update all staff members possessing the old role name to the new role name
    setStaffList(prev => prev.map(s => {
      if (s.role === oldName) {
        return { ...s, role: val };
      }
      return s;
    }));

    setEditingRoleIndex(null);
  };

  useEffect(() => {
    localStorage.setItem('weplan_custom_roles', JSON.stringify(customRoles));
  }, [customRoles]);

  useEffect(() => {
    localStorage.setItem('weplan_use_teams', useTeams);
  }, [useTeams]);

  useEffect(() => {
    if (customRoles.length > 0 && !customRoles.includes(newStaffRole)) {
      setNewStaffRole(customRoles[0]);
    }
  }, [customRoles, newStaffRole]);

  // 3b. Custom Experience Levels (Seniority) states
  const [customExpLevels, setCustomExpLevels] = useState(() => {
    const saved = localStorage.getItem('weplan_custom_exp_levels');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { id: 'senior', label: '경력직 (Senior)', type: 'senior' },
      { id: 'junior', label: '신규/신입 (Junior)', type: 'junior' }
    ];
  });

  const [showExpLevelManagerModal, setShowExpLevelManagerModal] = useState(false);
  const [editingExpLevelIndex, setEditingExpLevelIndex] = useState(null);
  const [editingExpLevelValue, setEditingExpLevelValue] = useState('');
  const [editingExpLevelType, setEditingExpLevelType] = useState('junior');
  const [newExpLevelName, setNewExpLevelName] = useState('');
  const [newExpLevelType, setNewExpLevelType] = useState('junior');

  useEffect(() => {
    localStorage.setItem('weplan_custom_exp_levels', JSON.stringify(customExpLevels));
  }, [customExpLevels]);

  const isSenior = (expLevelId) => {
    const lvl = customExpLevels.find(l => l.id === expLevelId || l.label === expLevelId);
    return lvl ? lvl.type === 'senior' : expLevelId === 'senior';
  };

  const getShiftDurationHours = (shift) => {
    if (!shift || !shift.start || !shift.end || shift.start === '-' || shift.end === '-') return 0;
    const [sH, sM] = shift.start.split(':').map(Number);
    const [eH, eM] = shift.end.split(':').map(Number);
    let sMin = sH * 60 + sM;
    let eMin = eH * 60 + eM;
    if (eMin <= sMin) {
      eMin += 24 * 60; // spans overnight
    }
    return (eMin - sMin) / 60;
  };

  // Experience Level Management Handlers
  const handleAddExpLevel = (name, type) => {
    const val = name.trim();
    if (!val) return;
    if (customExpLevels.some(l => l.label === val)) {
      alert('이미 존재하는 구분입니다.');
      return;
    }
    const newLvl = {
      id: 'level-' + Date.now().toString(),
      label: val,
      type
    };
    setCustomExpLevels(prev => [...prev, newLvl]);
    setNewExpLevelName('');
    setNewExpLevelType('junior');
  };

  const handleDeleteExpLevel = (levelId, levelLabel) => {
    if (customExpLevels.length <= 1) {
      alert('최소 하나의 숙련도 구분은 존재해야 합니다.');
      return;
    }
    if (!window.confirm(`'${levelLabel}' 구분을 삭제하시겠습니까? 해당 등급의 조원들은 첫 번째 등급으로 안전하게 자동 리셋됩니다.`)) return;

    const updatedLevels = customExpLevels.filter(l => l.id !== levelId);
    setCustomExpLevels(updatedLevels);

    const fallbackLevel = updatedLevels[0].id;
    setStaffList(prev => prev.map(s => {
      if (s.expLevel === levelId || s.expLevel === levelLabel) {
        return { ...s, expLevel: fallbackLevel };
      }
      return s;
    }));
  };

  const handleUpdateExpLevel = (index, levelId, oldLabel, newLabel, newType) => {
    const val = newLabel.trim();
    if (!val) return;
    if (val !== oldLabel && customExpLevels.some((l, idx) => l.label === val && idx !== index)) {
      alert('이미 존재하는 구분입니다.');
      return;
    }

    const updated = [...customExpLevels];
    updated[index] = {
      ...updated[index],
      label: val,
      type: newType
    };
    setCustomExpLevels(updated);

    // Update staff members
    setStaffList(prev => prev.map(s => {
      if (s.expLevel === levelId || s.expLevel === oldLabel) {
        return { ...s, expLevel: levelId };
      }
      return s;
    }));

    setEditingExpLevelIndex(null);
  };

  useEffect(() => {
    if (customExpLevels.length > 0 && !customExpLevels.some(l => l.id === newStaffExpLevel || l.label === newStaffExpLevel)) {
      setNewStaffExpLevel(customExpLevels[0].id);
    }
  }, [customExpLevels, newStaffExpLevel]);

  // 4. Unified Shift definition (Load custom values if exist)
  const [customShifts, setCustomShifts] = useState(() => {
    const saved = localStorage.getItem('weplan_manager_unified_shifts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    // Merged default shifts from both nurse and partTime
    return [
      { id: 'D', label: 'Day', code: 'D', color: '#16a34a', bg: '#e6f7ed', start: '08:00', end: '16:00' },
      { id: 'E', label: 'Evening', code: 'E', color: '#ea580c', bg: '#fff3e6', start: '16:00', end: '24:00' },
      { id: 'N', label: 'Night', code: 'N', color: '#7c3aed', bg: '#f3f0ff', start: '00:00', end: '08:00' },
      { id: 'O', label: 'Off (희망 휴무)', code: 'O', color: '#64748b', bg: '#f1f5f9', start: '-', end: '-' },
      { id: 'OPEN', label: '오픈', code: '오픈', color: '#1d4ed8', bg: '#eff6ff', start: '09:00', end: '14:00' },
      { id: 'MID', label: '미들', code: '미들', color: '#0d9488', bg: '#f0fdfa', start: '14:00', end: '19:00' },
      { id: 'CLOSE', label: '마감', code: '마감', color: '#b91c1c', bg: '#fef2f2', start: '19:00', end: '24:00' }
    ];
  });

  // Sync custom shifts to localStorage
  useEffect(() => {
    localStorage.setItem('weplan_manager_unified_shifts', JSON.stringify(customShifts));
  }, [customShifts]);

  const currentShifts = customShifts;
  const setCurrentShifts = setCustomShifts;

  // Brush Editor States
  const [showBrushEditor, setShowBrushEditor] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState(null);
  const [shiftForm, setShiftForm] = useState({
    code: '',
    label: '',
    color: '#1d4ed8',
    start: '09:00',
    end: '18:00'
  });

  const [wardRules, setWardRules] = useState(() => {
    const saved = localStorage.getItem('weplan_ward_rules');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          maxConsecutiveWork: parsed.maxConsecutiveWork !== undefined ? parsed.maxConsecutiveWork : 5,
          minRestAfterNight: parsed.minRestAfterNight !== undefined ? parsed.minRestAfterNight : 1,
          maxWeeklyWorkDays: parsed.maxWeeklyWorkDays !== undefined ? parsed.maxWeeklyWorkDays : 5,
          maxWeeklyWorkHours: parsed.maxWeeklyWorkHours !== undefined ? parsed.maxWeeklyWorkHours : 52,
          protectJuniors: parsed.protectJuniors !== undefined ? parsed.protectJuniors : true,
          avoidConflict: parsed.avoidConflict !== undefined ? parsed.avoidConflict : true,
          matchPreceptors: parsed.matchPreceptors !== undefined ? parsed.matchPreceptors : true
        };
      } catch (e) {}
    }
    return {
      maxConsecutiveWork: 5,     // 최대 연속 근무 일수
      minRestAfterNight: 1,      // 야간 근무 후 오프 휴식 보장 일수
      maxWeeklyWorkDays: 5,      // 주간 법정 근무 제한 (40시간 분량)
      maxWeeklyWorkHours: 52,     // 최대 주간 근로시간
      protectJuniors: true,      // 신규 간호사 보호 (근무별 경력직 최소 1인 조화)
      avoidConflict: true,       // 갈등 조원 동시 배치 배제
      matchPreceptors: true      // 프리셉터-프리셉티 동행 근무 연동
    };
  });

  useEffect(() => {
    localStorage.setItem('weplan_ward_rules', JSON.stringify(wardRules));
  }, [wardRules]);

  const [showRulesPanel, setShowRulesPanel] = useState(false);

  // 5. Staff Config Modal (개인별 상세 설정)
  const [showStaffConfigModal, setShowStaffConfigModal] = useState(false);
  const [selectedStaffForConfig, setSelectedStaffForConfig] = useState(null);
  const [personalConfigForm, setPersonalConfigForm] = useState({
    name: '',
    role: '',
    expLevel: 'senior',
    team: '',
    specialNote: '',
    avoidWith: [],
    nightAvoid: false,
    weekendOff: false,
    couplingWith: ''
  });

  // Open config panel for staff
  const handleOpenStaffConfig = (staff) => {
    setSelectedStaffForConfig(staff);
    setPersonalConfigForm({
      name: staff.name || '',
      role: staff.role || '',
      expLevel: staff.expLevel || 'senior',
      team: staff.team || '',
      specialNote: staff.specialNote || '',
      avoidWith: staff.avoidWith || [],
      nightAvoid: staff.specialRequests?.nightAvoid || false,
      weekendOff: staff.specialRequests?.weekendOff || false,
      couplingWith: staff.specialRequests?.couplingWith || ''
    });
    setShowStaffConfigModal(true);
  };

  // Save personal configs
  const handleSaveStaffConfig = () => {
    if (!selectedStaffForConfig) return;
    
    setStaffList(prev => prev.map(s => {
      if (s.id === selectedStaffForConfig.id) {
        return {
          ...s,
          name: personalConfigForm.name.trim() || s.name,
          role: personalConfigForm.role || s.role,
          expLevel: personalConfigForm.expLevel || s.expLevel,
          team: personalConfigForm.team ? personalConfigForm.team.trim() : '',
          specialNote: personalConfigForm.specialNote.trim(),
          avoidWith: personalConfigForm.avoidWith,
          specialRequests: {
            nightAvoid: personalConfigForm.nightAvoid,
            weekendOff: personalConfigForm.weekendOff,
            couplingWith: personalConfigForm.couplingWith
          }
        };
      }
      return s;
    }));

    // Bidirectional conflict avoidance: if A avoids B, B should also avoid A
    const selectedId = selectedStaffForConfig.id;
    const nextAvoids = personalConfigForm.avoidWith;
    setStaffList(prev => prev.map(s => {
      // If s was newly selected to be avoided, add selectedId to s's avoid list
      if (nextAvoids.includes(s.id)) {
        if (!s.avoidWith.includes(selectedId)) {
          return { ...s, avoidWith: [...s.avoidWith, selectedId] };
        }
      } else {
        // If s is not in the avoid list but had selectedId in its avoid list, remove it
        if (s.avoidWith.includes(selectedId) && s.id !== selectedId) {
          return { ...s, avoidWith: s.avoidWith.filter(id => id !== selectedId) };
        }
      }
      return s;
    }));

    setShowStaffConfigModal(false);
    setSelectedStaffForConfig(null);
  };

  // 6. Roster Assignments state: { "2026-06": { "staff-1": { "1": "D", "2": "E" ... } } }
  const [roster, setRoster] = useState(() => {
    const saved = localStorage.getItem('weplan_manager_roster');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  // 7. Roster validation & Audit warnings state
  const [rosterViolations, setRosterViolations] = useState([]);
  // 8. AI Assignment Explainer logs state
  const [assignmentAuditLogs, setAssignmentAuditLogs] = useState({});

  const currentMonthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const isOffShift = (shiftId) => shiftId === 'O' || shiftId === 'OFF' || shiftId === 'Off';
  const priorityShiftIds = customShifts.filter(s => s.id !== 'O' && s.id !== 'OFF' && s.id !== 'Off').map(s => s.id);

  // Roster Validator Engine
  const validateRoster = (rosterData) => {
    const monthRoster = rosterData[currentMonthKey] || {};
    const warnings = [];

    staffList.forEach(staff => {
      let consecutiveWork = 0;
      const weeklyWorkCount = {}; // weekIndex -> count
      const weeklyWorkHours = {}; // weekIndex -> hours
      
      const getWeekIndex = (dayNum) => {
        const dObj = new Date(selectedYear, selectedMonth - 1, dayNum);
        const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
        return Math.floor((dayNum + firstDay - 1) / 7);
      };

      for (let day = 1; day <= daysInMonth; day++) {
        const shiftId = monthRoster[staff.id]?.[day] || '';
        
        if (shiftId) {
          const shift = currentShifts.find(s => s.id === shiftId);
          if (shift) {
            const duration = getShiftDurationHours(shift);
            const wIdx = getWeekIndex(day);
            weeklyWorkHours[wIdx] = (weeklyWorkHours[wIdx] || 0) + duration;
          }
        }

        if (!shiftId || isOffShift(shiftId)) {
          consecutiveWork = 0;
          continue;
        }

        // 1. Max consecutive work check
        consecutiveWork++;
        if (consecutiveWork > wardRules.maxConsecutiveWork) {
          warnings.push({
            id: `warn-consec-${staff.id}-${day}`,
            staffName: staff.name,
            day,
            message: `${staff.name}: ${day}일 기준으로 연속 ${consecutiveWork}일 근무 중 (규정 한계: ${wardRules.maxConsecutiveWork}일)`
          });
        }

        // 2. Weekly work count (statutory 40 hours)
        const wIdx = getWeekIndex(day);
        weeklyWorkCount[wIdx] = (weeklyWorkCount[wIdx] || 0) + 1;
        if (weeklyWorkCount[wIdx] > wardRules.maxWeeklyWorkDays) {
          warnings.push({
            id: `warn-weekly-${staff.id}-${day}`,
            staffName: staff.name,
            day,
            message: `${staff.name}: 주간 근로 일수 ${weeklyWorkCount[wIdx]}일 도달 (법정 한도: ${wardRules.maxWeeklyWorkDays}일)`
          });
        }

        // 3. Night -> Rest check
        const yesterdayVal = day > 1 ? monthRoster[staff.id]?.[day - 1] : null;
        if ((yesterdayVal === 'N' || yesterdayVal === 'CLOSE') && shiftId !== 'O' && shiftId !== 'OFF') {
          warnings.push({
            id: `warn-night-rest-${staff.id}-${day}`,
            staffName: staff.name,
            day,
            message: `${staff.name}: ${day - 1}일 야간/마감 근무 후 ${day}일 휴일 없이 교대근무 배치 (야간 휴식의무 위반)`
          });
        }

        // 4. Special Requests: Night Avoidance
        if (staff.specialRequests?.nightAvoid && (shiftId === 'N' || shiftId === 'CLOSE')) {
          warnings.push({
            id: `warn-night-avoid-${staff.id}-${day}`,
            staffName: staff.name,
            day,
            message: `${staff.name}: 특이사항(야간 근무 회피) 대상자이나 ${day}일에 야간/마감 배치됨`
          });
        }

        // 5. Special Requests: Weekend Off Avoidance
        const dObj = new Date(selectedYear, selectedMonth - 1, day);
        const dayOfWeek = dObj.getDay();
        if (staff.specialRequests?.weekendOff && (dayOfWeek === 0 || dayOfWeek === 6)) {
          warnings.push({
            id: `warn-weekend-off-${staff.id}-${day}`,
            staffName: staff.name,
            day,
            message: `${staff.name}: 주말 휴무 요청자이나 ${day}일(주말)에 근무가 배정됨`
          });
        }

        // 6. Conflict Avoidance
        if (wardRules.avoidConflict && staff.avoidWith && staff.avoidWith.length > 0) {
          staff.avoidWith.forEach(conflictStaffId => {
            const conflictShift = monthRoster[conflictStaffId]?.[day];
            if (conflictShift && conflictShift === shiftId && !isOffShift(shiftId)) {
              const otherStaff = staffList.find(s => s.id === conflictStaffId);
              if (otherStaff && staff.id < conflictStaffId) { // display warning once per pair
                warnings.push({
                  id: `warn-conflict-${staff.id}-${conflictStaffId}-${day}`,
                  staffName: `${staff.name}, ${otherStaff.name}`,
                  day,
                  message: `${staff.name} & ${otherStaff.name}: 갈등/근무 기피 관계이나 ${day}일 동일 근무(${shiftId})에 동시 배정됨`
                });
              }
            }
          });
        }

        // 7. Preceptor Coupling (사수-부사수 동행)
        if (wardRules.matchPreceptors && staff.specialRequests?.couplingWith) {
          const partnerId = staff.specialRequests.couplingWith;
          const partnerShift = monthRoster[partnerId]?.[day];
          if (partnerShift && partnerShift !== shiftId && staff.id < partnerId) {
            const partner = staffList.find(s => s.id === partnerId);
            if (partner) {
              warnings.push({
                id: `warn-preceptor-${staff.id}-${partnerId}-${day}`,
                staffName: `${staff.name}, ${partner.name}`,
                day,
                message: `${staff.name} & ${partner.name}: 사수-부사수 동행 스케줄 관계이나 ${day}일 근무 불일치 (${shiftId} vs ${partnerShift})`
              });
            }
          }
        }
      }

      Object.keys(weeklyWorkHours).forEach(wIdx => {
        const hours = weeklyWorkHours[wIdx];
        if (hours > wardRules.maxWeeklyWorkHours) {
          warnings.push({
            id: `warn-hours-${staff.id}-${wIdx}`,
            staffName: staff.name,
            day: (Number(wIdx) * 7) + 1,
            message: `${staff.name}: 주간 근로 ${hours}시간 달성 (설정 한도: ${wardRules.maxWeeklyWorkHours}시간)`
          });
        }
      });
    });

    // 8. Shift Specific constraints (newbie-only checks)
    if (wardRules.protectJuniors) {
      for (let day = 1; day <= daysInMonth; day++) {
        priorityShiftIds.forEach(sId => {
          let seniorsOnDuty = 0;
          let juniorsOnDuty = 0;
          
          staffList.forEach(s => {
            if (monthRoster[s.id]?.[day] === sId) {
              if (isSenior(s.expLevel)) seniorsOnDuty++;
              else juniorsOnDuty++;
            }
          });

          if (juniorsOnDuty > 0 && seniorsOnDuty === 0) {
            warnings.push({
              id: `warn-junior-only-${day}-${sId}`,
              staffName: `신규 조원들`,
              day,
              message: `${day}일 [${sId}] 근무: 경력직 조원(Senior) 없이 신입 조원들로만 배치됨 (실무 공백 위험)`
            });
          }
        });
      }
    }

    return warnings;
  };

  // Re-run validator whenever roster or staffList or rules change
  useEffect(() => {
    const warnings = validateRoster(roster);
    setRosterViolations(warnings);
  }, [roster, staffList, wardRules, selectedYear, selectedMonth]);

  // Save/Add Shift Type
  const handleSaveShiftType = (e) => {
    e.preventDefault();
    if (!shiftForm.code.trim() || !shiftForm.label.trim()) return;

    const hexColor = shiftForm.color;
    const bgLight = hexColor + '12';

    if (editingShiftId) {
      // Edit
      setCurrentShifts(prev => prev.map(s => {
        if (s.id === editingShiftId) {
          return {
            ...s,
            code: shiftForm.code.trim().substring(0, 4),
            label: shiftForm.label.trim(),
            color: hexColor,
            bg: bgLight,
            start: shiftForm.start,
            end: shiftForm.end
          };
        }
        return s;
      }));
      setEditingShiftId(null);
    } else {
      // Add
      const newId = 'shift-' + Date.now().toString();
      const newShift = {
        id: newId,
        code: shiftForm.code.trim().substring(0, 4),
        label: shiftForm.label.trim(),
        color: hexColor,
        bg: bgLight,
        start: shiftForm.start,
        end: shiftForm.end
      };
      setCurrentShifts(prev => [...prev, newShift]);
    }

    setShiftForm({
      code: '',
      label: '',
      color: '#1d4ed8',
      start: '09:00',
      end: '18:00'
    });
  };

  const handleStartEditShift = (shift) => {
    setEditingShiftId(shift.id);
    setShiftForm({
      code: shift.code,
      label: shift.label,
      color: shift.color,
      start: shift.start === '-' ? '09:00' : shift.start,
      end: shift.end === '-' ? '18:00' : shift.end
    });
  };

  const handleDeleteShiftType = (shiftId) => {
    if (shiftId === 'O' || shiftId === 'OFF') {
      alert('기본 휴무(Off) 브러시는 필수 제약 규칙에 사용되므로 삭제할 수 없습니다.');
      return;
    }
    if (!window.confirm('이 브러시를 삭제하시겠습니까? 관련된 스케줄 배정도 표에서 지워집니다.')) return;

    setCurrentShifts(prev => prev.filter(s => s.id !== shiftId));

    // Clear assignments in roster
    setRoster(prev => {
      const copy = { ...prev };
      Object.keys(copy).forEach(mKey => {
        if (copy[mKey]) {
          Object.keys(copy[mKey]).forEach(staffId => {
            if (copy[mKey][staffId]) {
              Object.keys(copy[mKey][staffId]).forEach(day => {
                if (copy[mKey][staffId][day] === shiftId) {
                  copy[mKey][staffId][day] = '';
                }
              });
            }
          });
        }
      });
      return copy;
    });
  };

  // Set default brush
  useEffect(() => {
    if (currentShifts && currentShifts.length > 0) {
      setSelectedBrush(currentShifts[0].id);
    }
  }, [currentShifts]);

  // Save to localStorage
  const handleSaveAll = () => {
    localStorage.setItem('weplan_manager_staff', JSON.stringify(staffList));
    localStorage.setItem('weplan_manager_roster', JSON.stringify(roster));
    
    // Sync to main calendar events
    if (setEvents) {
      syncRosterToCalendarEvents();
    }
    alert('근무 스케줄표가 안전하게 저장 및 캘린더에 연동되었습니다! 💾');
  };

  // Sync current month roster into main app events
  const syncRosterToCalendarEvents = () => {
    const currentMonthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    const monthRoster = roster[currentMonthKey] || {};
    
    // 1. Remove existing manager-scheduled events for this month
    const cleanEvents = events.filter(evt => {
      if (evt.isManagerScheduled && evt.date && evt.date.startsWith(currentMonthKey)) {
        return false;
      }
      return true;
    });

    // 2. Build new events from roster
    const newEvents = [];
    Object.keys(monthRoster).forEach(staffId => {
      const staff = staffList.find(s => s.id === staffId);
      if (!staff) return;

      const daysObj = monthRoster[staffId] || {};
      Object.keys(daysObj).forEach(dayStr => {
        const shiftId = daysObj[dayStr];
        const shiftInfo = currentShifts.find(s => s.id === shiftId);
        if (!shiftInfo || shiftInfo.id === 'O' || shiftInfo.id === 'OFF') return; // Skip Off days

        const dateFormatted = `${currentMonthKey}-${String(dayStr).padStart(2, '0')}`;
        
        newEvents.push({
          id: `mgr-evt-${staffId}-${dateFormatted}`,
          type: 'shift',
          isManagerScheduled: true,
          staffName: staff.name,
          shiftType: shiftInfo.id.toLowerCase(), // mapping
          label: `${staff.name} (${shiftInfo.label})`,
          date: dateFormatted,
          title: `[근무] ${staff.name}: ${shiftInfo.label}`,
          time: `${shiftInfo.start} - ${shiftInfo.end}`,
          color: shiftInfo.color
        });
      });
    });

    setEvents([...cleanEvents, ...newEvents]);
  };

  // Helper: Get days in selected month
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const daysArray = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(selectedYear, selectedMonth - 1, i);
      const dayOfWeek = d.getDay(); // 0: Sun, 6: Sat
      arr.push({ day: i, dayOfWeek });
    }
    return arr;
  }, [selectedYear, selectedMonth, daysInMonth]);

  // Navigate Months
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  // Roster Helpers

  const getCellShift = (staffId, day) => {
    return roster[currentMonthKey]?.[staffId]?.[day] || '';
  };

  const setCellShift = (staffId, day, shiftId) => {
    setRoster(prev => {
      const copy = { ...prev };
      if (!copy[currentMonthKey]) copy[currentMonthKey] = {};
      if (!copy[currentMonthKey][staffId]) copy[currentMonthKey][staffId] = {};
      copy[currentMonthKey][staffId][day] = shiftId;
      return copy;
    });
    // Clear AI log for this specific cell since it is now manually overridden
    setAssignmentAuditLogs(prev => {
      const copy = { ...prev };
      if (copy[currentMonthKey] && copy[currentMonthKey][staffId]) {
        const staffCopy = { ...copy[currentMonthKey][staffId] };
        delete staffCopy[day];
        return {
          ...copy,
          [currentMonthKey]: {
            ...copy[currentMonthKey],
            [staffId]: staffCopy
          }
        };
      }
      return copy;
    });
  };

  // Click on a cell to assign shift
  const handleCellClick = (staffId, day) => {
    if (!selectedBrush) return;
    setCellShift(staffId, day, selectedBrush);
  };

  // Auto Schedule Algorithm (AI/Rule-based Roster Generator)
  // Auto Schedule Algorithm (AI/Rule-based Roster Generator)
  const handleAutoSchedule = () => {
    if (staffList.length === 0) {
      alert('최소 1명 이상의 직원이 등록되어 있어야 근무 배정이 가능합니다.');
      return;
    }

    if (!window.confirm('기존 근무 배정을 초기화하고, 규칙에 기반한 스케줄을 자동 생성하시겠습니까? (수동으로 입력해 두신 휴무 등은 자동으로 보존되어 반영됩니다)')) {
      return;
    }

    const currentMonthRoster = roster[currentMonthKey] || {};
    const newMonthRoster = {};
    const newMonthLogs = {}; // staffId -> { day -> reasonString }
    const offShift = currentShifts.find(s => s.id === 'O' || s.id === 'OFF');
    
    // 1. Initialize roster and load manually pre-assigned shifts (Exclusion & Off Reflection)
    // If a cell is already filled, we preserve it. Otherwise, it starts empty.
    staffList.forEach(s => {
      newMonthRoster[s.id] = {};
      newMonthLogs[s.id] = {};
      for (let d = 1; d <= daysInMonth; d++) {
        const existing = currentMonthRoster[s.id]?.[d];
        if (existing && existing !== '') {
          newMonthRoster[s.id][d] = existing;
          const shiftInfo = currentShifts.find(sh => sh.id === existing);
          newMonthLogs[s.id][d] = `수동 지정된 근무/휴무(${shiftInfo?.label || existing}) 일정을 그대로 보존하여 배정되었습니다.`;
        }
      }
    });

    // Trackers for workload balance
    const workDaysCount = {};
    const shiftCounts = {}; // { staffId: { D: 0, E: 0, N: 0, OPEN: 0, MID: 0, CLOSE: 0 } }

    staffList.forEach(s => {
      workDaysCount[s.id] = 0;
      shiftCounts[s.id] = {};
      currentShifts.forEach(shift => {
        shiftCounts[s.id][shift.id] = 0;
      });

      // Calculate initial workload from pre-assigned shifts
      for (let d = 1; d <= daysInMonth; d++) {
        const val = newMonthRoster[s.id][d];
        if (val) {
          if (val !== offShift.id) {
            workDaysCount[s.id]++;
          }
          shiftCounts[s.id][val]++;
        }
      }
    });

    const isOffShift = (shiftId) => shiftId === 'O' || shiftId === 'OFF';

    // Helper to calculate consecutive workdays
    const getConsecutiveWorkDays = (staffId, targetDay) => {
      let count = 0;
      for (let d = targetDay - 1; d >= 1; d--) {
        const val = newMonthRoster[staffId][d];
        if (val && !isOffShift(val)) {
          count++;
        } else {
          break;
        }
      }
      return count;
    };

    // Helper to calculate workdays in target calendar week (Sunday - Saturday)
    const getWeeklyWorkDays = (staffId, targetDay) => {
      const dObj = new Date(selectedYear, selectedMonth - 1, targetDay);
      const dayOfWeek = dObj.getDay(); // 0: Sun, 1: Mon...
      const startDay = Math.max(1, targetDay - dayOfWeek);
      const endDay = Math.min(daysInMonth, targetDay + (6 - dayOfWeek));

      let count = 0;
      for (let d = startDay; d <= endDay; d++) {
        const val = newMonthRoster[staffId][d];
        if (val && !isOffShift(val)) {
          count++;
        }
      }
      return count;
    };

    // Helper to calculate total work hours in target calendar week (Sunday - Saturday)
    const getWeeklyWorkHours = (staffId, targetDay) => {
      const dObj = new Date(selectedYear, selectedMonth - 1, targetDay);
      const dayOfWeek = dObj.getDay(); // 0: Sun, 1: Mon...
      const startDay = Math.max(1, targetDay - dayOfWeek);
      const endDay = Math.min(daysInMonth, targetDay + (6 - dayOfWeek));

      let totalHours = 0;
      for (let d = startDay; d <= endDay; d++) {
        const val = newMonthRoster[staffId][d];
        if (val) {
          const shift = currentShifts.find(s => s.id === val);
          if (shift) {
            totalHours += getShiftDurationHours(shift);
          }
        }
      }
      return totalHours;
    };

    const checkPartnerAvailable = (partner, targetShiftId, day) => {
      if (newMonthRoster[partner.id][day]) return false;
      const yesterdayVal = day > 1 ? newMonthRoster[partner.id][day - 1] : null;
      if (yesterdayVal === 'N' || yesterdayVal === 'CLOSE') return false;
      
      // Personal night avoidance
      if (partner.specialRequests?.nightAvoid && (targetShiftId === 'N' || targetShiftId === 'CLOSE')) return false;

      // Weekend off avoidance
      const dObj = new Date(selectedYear, selectedMonth - 1, day);
      const dayOfWeek = dObj.getDay();
      if (partner.specialRequests?.weekendOff && (dayOfWeek === 0 || dayOfWeek === 6)) return false;

      // Conflict avoidance
      if (wardRules.avoidConflict && partner.avoidWith && partner.avoidWith.length > 0) {
        const hasConflict = staffList.some(s => 
          newMonthRoster[s.id][day] === targetShiftId && partner.avoidWith.includes(s.id)
        );
        if (hasConflict) return false;
      }
      
      const consec = getConsecutiveWorkDays(partner.id, day);
      if (consec >= wardRules.maxConsecutiveWork + 1) return false;
      
      const weekly = getWeeklyWorkDays(partner.id, day);
      if (weekly >= 6) return false;

      const weeklyHours = getWeeklyWorkHours(partner.id, day);
      const shiftObj = currentShifts.find(s => s.id === targetShiftId);
      const shiftDuration = shiftObj ? getShiftDurationHours(shiftObj) : 0;
      if (weeklyHours + shiftDuration > wardRules.maxWeeklyWorkHours + 8) return false;
      
      return true;
    };

    // Helper to find candidates based on relaxation levels
    const getCandidatesForDayAndShift = (sId, day, level) => {
      const list = [];
      const dObj = new Date(selectedYear, selectedMonth - 1, day);
      const dayOfWeek = dObj.getDay();
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

      staffList.forEach(staff => {
        // Already assigned today
        if (newMonthRoster[staff.id][day]) return;

        // CRITICAL constraint: Night/CLOSE yesterday -> today MUST REST (O)
        const yesterdayVal = day > 1 ? newMonthRoster[staff.id][day - 1] : null;
        if (yesterdayVal === 'N' || yesterdayVal === 'CLOSE') return;

        // Level 1-2: Personal night avoidance (health, child care, etc.)
        if (level < 3 && staff.specialRequests?.nightAvoid && (sId === 'N' || sId === 'CLOSE')) return;

        // Level 1: Weekend off avoidance
        if (level === 1 && staff.specialRequests?.weekendOff && isWeekend) return;

        // Level 1-2: Conflict avoidance (atmosphere/clash)
        if (level < 3 && wardRules.avoidConflict && staff.avoidWith && staff.avoidWith.length > 0) {
          const hasConflict = staffList.some(s => 
            newMonthRoster[s.id][day] === sId && staff.avoidWith.includes(s.id)
          );
          if (hasConflict) return;
        }

        // Weekly work limits
        const weeklyWork = getWeeklyWorkDays(staff.id, day);
        let maxWeekly = wardRules.maxWeeklyWorkDays;
        if (level >= 2) maxWeekly = 6;
        if (weeklyWork >= maxWeekly) return;

        // Weekly work hours limits
        const weeklyHours = getWeeklyWorkHours(staff.id, day);
        const shiftObj = currentShifts.find(s => s.id === sId);
        const shiftDuration = shiftObj ? getShiftDurationHours(shiftObj) : 0;
        let maxWeeklyHours = wardRules.maxWeeklyWorkHours;
        if (level >= 2) maxWeeklyHours = wardRules.maxWeeklyWorkHours + 8;
        if (weeklyHours + shiftDuration > maxWeeklyHours) return;

        // Consecutive work limits
        const consecDays = getConsecutiveWorkDays(staff.id, day);
        let maxConsec = wardRules.maxConsecutiveWork;
        if (level >= 2) maxConsec = wardRules.maxConsecutiveWork + 1;
        if (consecDays >= maxConsec) return;

        // Monthly work limit
        const maxMonthlyWork = Math.floor(daysInMonth * 0.72);
        if (level === 1 && workDaysCount[staff.id] >= maxMonthlyWork) return;

        list.push({
          staff,
          consecDays,
          weeklyWork,
          specificShiftCount: shiftCounts[staff.id][sId] || 0,
          totalWorkDays: workDaysCount[staff.id]
        });
      });

      return list;
    };

    // Define shift order by priority dynamically (Night/CLOSE first as they have the tightest constraints)
    const activeShifts = customShifts.filter(s => s.id !== 'O' && s.id !== 'OFF' && s.id !== 'Off');
    const priorityShiftIds = [];
    
    // Identify the late/night, evening/mid, and day/open shifts among active shifts
    const nightCloseShifts = activeShifts.filter(s => ['N', 'CLOSE', 'NIGHT', '마감', '야간'].includes(s.id.toUpperCase()) || ['N', 'CLOSE', 'NIGHT', '마감', '야간'].includes(s.code.toUpperCase()));
    const eveMidShifts = activeShifts.filter(s => ['E', 'MID', 'EVENING', '미들', '저녁'].includes(s.id.toUpperCase()) || ['E', 'MID', 'EVENING', '미들', '저녁'].includes(s.code.toUpperCase()));
    const dayOpenShifts = activeShifts.filter(s => ['D', 'OPEN', 'DAY', '오픈', '데이', '주간'].includes(s.id.toUpperCase()) || ['D', 'OPEN', 'DAY', '오픈', '데이', '주간'].includes(s.code.toUpperCase()));

    // Other custom shifts
    const otherShifts = activeShifts.filter(s => 
      !nightCloseShifts.includes(s) && !eveMidShifts.includes(s) && !dayOpenShifts.includes(s)
    );

    // Prioritize Night/Close first, then Evening/Mid, then Day/Open, then Others
    priorityShiftIds.push(...nightCloseShifts.map(s => s.id));
    priorityShiftIds.push(...eveMidShifts.map(s => s.id));
    priorityShiftIds.push(...dayOpenShifts.map(s => s.id));
    priorityShiftIds.push(...otherShifts.map(s => s.id));

    // 2. Loop through days to schedule
    for (let day = 1; day <= daysInMonth; day++) {
      const totalStaff = staffList.length;

      // Determine required personnel counts dynamically
      let reqCounts = {};
      
      // Night/Close gets 15%
      nightCloseShifts.forEach(s => {
        reqCounts[s.id] = Math.max(1, Math.floor(totalStaff * 0.15));
      });
      // Evening/Mid gets 25%
      eveMidShifts.forEach(s => {
        reqCounts[s.id] = Math.max(1, Math.floor(totalStaff * 0.25));
      });
      // Day/Open gets 35%
      dayOpenShifts.forEach(s => {
        reqCounts[s.id] = Math.max(1, Math.floor(totalStaff * 0.35));
      });
      // Others get 20% divided or at least 1
      otherShifts.forEach(s => {
        reqCounts[s.id] = Math.max(1, Math.floor(totalStaff * (0.20 / Math.max(1, otherShifts.length))));
      });

      // Ensure total daily required shifts don't exceed totalStaff - 1 (leave at least one off)
      const maxActive = Math.max(1, totalStaff - 1);
      let totalReq = Object.values(reqCounts).reduce((a, b) => a + b, 0);
      while (totalReq > maxActive) {
        const reduceOrder = [
          ...otherShifts.map(s => s.id),
          ...dayOpenShifts.map(s => s.id),
          ...eveMidShifts.map(s => s.id),
          ...nightCloseShifts.map(s => s.id)
        ];
        let reduced = false;
        for (const rId of reduceOrder) {
          if (reqCounts[rId] > 1) {
            reqCounts[rId]--;
            reduced = true;
            break;
          }
        }
        if (!reduced) break;
        totalReq = Object.values(reqCounts).reduce((a, b) => a + b, 0);
      }

      // Schedule shifts in order of priority (N -> E -> D or CLOSE -> MID -> OPEN)
      priorityShiftIds.forEach(sId => {
        let needed = reqCounts[sId] || 0;

        // Pre-coupling coupling sync: If a partner is already assigned to this shift (e.g. manually or earlier), pull the other partner in!
        staffList.forEach(s => {
          if (newMonthRoster[s.id][day] === sId) {
            needed = Math.max(0, needed - 1);
            if (wardRules.matchPreceptors && s.specialRequests?.couplingWith) {
              const partnerId = s.specialRequests.couplingWith;
              if (!newMonthRoster[partnerId][day]) {
                const partner = staffList.find(st => st.id === partnerId);
                if (partner && checkPartnerAvailable(partner, sId, day)) {
                  newMonthRoster[partner.id][day] = sId;
                  workDaysCount[partner.id]++;
                  shiftCounts[partner.id][sId]++;
                  needed = Math.max(0, needed - 1);
                  newMonthLogs[partner.id][day] = `AI 동행 배정: 사수-부사수 동행 규칙(사수: ${s.name})에 따라 동일 근무(${sId})로 연동 배정되었습니다.`;
                }
              }
            }
          }
        });

        // Loop to assign candidates
        let attempts = 0;
        const maxAttempts = staffList.length * 2;

        while (needed > 0 && attempts < maxAttempts) {
          attempts++;

          // Count seniors/juniors already assigned to this shift today
          let seniorsAssigned = 0;
          let juniorsAssigned = 0;
          staffList.forEach(s => {
            if (newMonthRoster[s.id][day] === sId) {
              const staffInfo = staffList.find(st => st.id === s.id);
              if (staffInfo) {
                if (isSenior(staffInfo.expLevel)) seniorsAssigned++;
                else juniorsAssigned++;
              }
            }
          });

          // Build list of valid candidates using level relaxation
          let candidates = [];
          for (let lvl = 1; lvl <= 3; lvl++) {
            candidates = getCandidatesForDayAndShift(sId, day, lvl);
            if (candidates.length > 0) break;
          }

          if (candidates.length === 0) {
            break;
          }

          // Sort candidates:
          // 1. If protectJuniors is active and we need senior, prioritize senior candidates
          // 2. Lowest specific shift count (Even shift distribution)
          // 3. Lowest total workdays count (Greedy work frequency balancing)
          // 4. Lowest consecutive work days
          candidates.sort((a, b) => {
            if (wardRules.protectJuniors) {
              const needSenior = (seniorsAssigned === 0 && (juniorsAssigned > 0 || needed === 1));
              if (needSenior) {
                if (isSenior(a.staff.expLevel) && !isSenior(b.staff.expLevel)) return -1;
                if (!isSenior(a.staff.expLevel) && isSenior(b.staff.expLevel)) return 1;
              }
            }
            if (a.specificShiftCount !== b.specificShiftCount) {
              return a.specificShiftCount - b.specificShiftCount;
            }
            if (a.totalWorkDays !== b.totalWorkDays) {
              return a.totalWorkDays - b.totalWorkDays;
            }
            return a.consecDays - b.consecDays;
          });

          const chosen = candidates[0];
          newMonthRoster[chosen.staff.id][day] = sId;
          workDaysCount[chosen.staff.id]++;
          shiftCounts[chosen.staff.id][sId]++;
          needed--;

          // Create audit log reason
          const reasonParts = [];
          const hasPersonalNote = chosen.staff.specialNote ? ` (개인 사정: ${chosen.staff.specialNote})` : '';
          
          if (sId === 'N' || sId === 'CLOSE') {
            reasonParts.push(`야간/마감 근무 균등 배분 (현재 야간 누적: ${shiftCounts[chosen.staff.id][sId]}회)`);
          } else {
            reasonParts.push(`전체 근무일수 균형 배분 (현재 누적 근무: ${workDaysCount[chosen.staff.id]}일)`);
          }
          if (chosen.consecDays > 0) {
            reasonParts.push(`연속 근무 ${chosen.consecDays + 1}일차`);
          }
          if (isSenior(chosen.staff.expLevel) && seniorsAssigned === 0 && juniorsAssigned > 0 && wardRules.protectJuniors) {
            reasonParts.push(`신규 보호(경력직 최소 1인 배치) 경력자 우선 매칭`);
          }
          newMonthLogs[chosen.staff.id][day] = `AI 배정 사유: ${reasonParts.join(', ')}${hasPersonalNote}`;

          // Preceptor Coupling partner auto-assignment
          if (wardRules.matchPreceptors && chosen.staff.specialRequests?.couplingWith) {
            const partnerId = chosen.staff.specialRequests.couplingWith;
            if (!newMonthRoster[partnerId][day]) {
              const partner = staffList.find(st => st.id === partnerId);
              if (partner && checkPartnerAvailable(partner, sId, day)) {
                newMonthRoster[partner.id][day] = sId;
                workDaysCount[partner.id]++;
                shiftCounts[partner.id][sId]++;
                needed = Math.max(0, needed - 1);
                newMonthLogs[partner.id][day] = `AI 동행 배정: 사수-부사수 동행 규칙(사수: ${chosen.staff.name})에 따라 동일 근무(${sId})로 연동 배정되었습니다.`;
              }
            }
          }
        }
      });

      // 3. Assign remainder of staff as OFF/O
      staffList.forEach(staff => {
        if (!newMonthRoster[staff.id][day]) {
          newMonthRoster[staff.id][day] = offShift.id;
          shiftCounts[staff.id][offShift.id]++;
          newMonthLogs[staff.id][day] = `AI 휴무 배정: 근무 휴식 규정 및 비근무일 배분 조정`;
        }
      });
    }

    setRoster(prev => ({
      ...prev,
      [currentMonthKey]: newMonthRoster
    }));

    setAssignmentAuditLogs(prev => ({
      ...prev,
      [currentMonthKey]: newMonthLogs
    }));
  };

  // Clear Roster for current month
  const handleClearRoster = () => {
    if (!window.confirm('현재 월의 모든 스케줄 배치를 초기화하시겠습니까?')) return;
    setRoster(prev => ({
      ...prev,
      [currentMonthKey]: {}
    }));
  };

  // Staff Management Handlers
  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#ef4444', '#14b8a6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newStaff = {
      id: 'staff-' + Date.now().toString(),
      name: newStaffName.trim(),
      role: newStaffRole,
      team: newStaffTeam ? newStaffTeam.trim() : '',
      color: randomColor,
      expLevel: newStaffExpLevel
    };

    setStaffList([...staffList, newStaff]);
    setNewStaffName('');
    setNewStaffTeam('');
    setNewStaffExpLevel('senior');
  };

  const handleDeleteStaff = (id) => {
    if (!window.confirm('이 근무자를 삭제하시겠습니까? 관련 스케줄 정보도 비워집니다.')) return;
    setStaffList(staffList.filter(s => s.id !== id));
  };

  // Export CSV
  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM for Korean Excel alignment
    
    // Header row
    csvContent += '근무자,' + (useTeams ? '소속 팀/조,' : '') + '직급/구분,';
    daysArray.forEach(d => {
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      csvContent += `${d.day}일(${weekdays[d.dayOfWeek]}),`;
    });
    csvContent += '\n';

    // Roster rows
    staffList.forEach(staff => {
      csvContent += `"${staff.name}",` + (useTeams ? `"${staff.team || '-'}",` : '') + `"${staff.role}",`;
      daysArray.forEach(d => {
        const val = getCellShift(staff.id, d.day);
        const shift = currentShifts.find(s => s.id === val);
        csvContent += `"${shift ? shift.label : '-'}",`;
      });
      csvContent += '\n';
    });

    // Create Download Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `스케줄표_${selectedYear}년_${selectedMonth}월.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Statistics calculation for footer of the grid
  const dailyStats = useMemo(() => {
    const stats = {}; // { day: { D: 2, E: 1, N: 0 ... } }
    
    daysArray.forEach(d => {
      stats[d.day] = {};
      currentShifts.forEach(s => {
        stats[d.day][s.id] = 0;
      });

      staffList.forEach(staff => {
        const val = getCellShift(staff.id, d.day);
        if (val && stats[d.day][val] !== undefined) {
          stats[d.day][val]++;
        }
      });
    });

    return stats;
  }, [staffList, roster, currentMonthKey, currentShifts, daysArray]);

  return (
    <div className="manager-scheduler-container">
      <style>{`
        .manager-scheduler-container {
          background-color: var(--bg-card);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: fadeIn 0.3s ease;
          overflow: visible;
        }

        .scheduler-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 16px;
        }

        .scheduler-title-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .scheduler-icon-wrapper {
          background-color: var(--primary-light);
          color: var(--primary);
          padding: 10px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .scheduler-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mode-toggle {
          background-color: var(--bg-app);
          border: 1px solid var(--border-color);
          padding: 3px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .mode-toggle-btn {
          border: none;
          background: none;
          padding: 6px 14px;
          border-radius: 15px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-muted);
        }

        .mode-toggle-btn.active {
          background-color: var(--primary);
          color: #ffffff;
          box-shadow: var(--shadow-sm);
        }

        .month-selector {
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: var(--bg-app);
          padding: 4px 12px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .arrow-btn {
          border: none;
          background: none;
          cursor: pointer;
          color: var(--text-main);
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.15s;
        }

        .arrow-btn:hover {
          background-color: var(--border-color);
        }

        /* Layout panels */
        .scheduler-main-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Modal Styles */
        .custom-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .custom-modal-content {
          background-color: #ffffff;
          border-radius: var(--radius-md);
          padding: 24px;
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 90vh;
          overflow-y: auto;
          animation: popScale 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .custom-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 12px;
        }

        .custom-modal-title {
          font-size: 14px;
          font-weight: 800;
          color: var(--text-main);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .custom-modal-close {
          border: none;
          background: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 14px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          transition: all 0.15s;
        }
        
        .custom-modal-close:hover {
          background-color: #f1f5f9;
          color: var(--text-main);
        }

        /* Left Panel - Staff Management */
        .staff-panel {
          background-color: var(--bg-app);
          border-radius: var(--radius-md);
          padding: 20px;
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .staff-list-title {
          font-size: 14px;
          font-weight: 800;
          color: var(--text-main);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .staff-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .staff-scroll-area {
          max-height: 280px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 4px;
        }

        .staff-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background-color: var(--bg-card);
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        /* Right Panel - Grid Container */
        .grid-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow: visible;
        }

        .palette-container {
          background-color: var(--bg-app);
          padding: 12px 16px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .brush-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .brush-btn {
          border: 2px solid transparent;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 8px;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .brush-btn.active {
          transform: scale(1.05);
          box-shadow: 0 0 0 2px var(--primary);
        }

        .grid-scroll-wrapper {
          overflow-x: auto;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background-color: var(--bg-card);
        }

        .roster-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .roster-table th, .roster-table td {
          border: 1px solid var(--border-color);
          text-align: center;
          padding: 6px 4px;
          font-size: 11px;
        }

        .roster-table th {
          background-color: #fafbfc;
          font-weight: 700;
          color: var(--text-muted);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .roster-table th.col-name {
          width: 90px;
          background-color: #f1f5f9;
          font-weight: 800;
          color: var(--text-main);
          font-size: 12px;
        }

        .roster-table th.col-role {
          width: 85px;
          background-color: #fafbfc;
          font-size: 11px;
        }

        .roster-table th.col-day {
          width: 32px;
          min-width: 32px;
        }

        .col-day.sunday { color: #ef4444; background-color: #fef2f2; }
        .col-day.saturday { color: #3b82f6; background-color: #eff6ff; }

        .cell-staff-name {
          font-weight: 700;
          color: var(--text-main);
          background-color: #f8fafc;
          font-size: 12px;
        }

        .cell-staff-role {
          color: var(--text-muted);
          background-color: #fafbfc;
        }

        .cell-shift-editable {
          cursor: pointer;
          font-weight: 800;
          font-size: 12px;
          transition: background-color 0.1s;
          user-select: none;
          position: relative;
        }

        .cell-shift-editable:hover {
          filter: brightness(0.95);
        }

        .cell-ai-logged::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          border-style: solid;
          border-width: 0 6px 6px 0;
          border-color: transparent var(--primary) transparent transparent;
        }

        /* Shift Code badges */
        .shift-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 5px;
          font-weight: 800;
          font-size: 11px;
        }

        /* Action Buttons bar */
        .scheduler-actions-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn-action-outline {
          border: 1px solid var(--border-color);
          background-color: var(--bg-card);
          color: var(--text-main);
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          transition: all 0.2s;
        }

        .btn-action-outline:hover {
          background-color: var(--bg-app);
          border-color: var(--primary);
          color: var(--primary);
        }

        .btn-action-solid {
          border: none;
          background: linear-gradient(135deg, var(--primary) 0%, #7c7df6 100%);
          color: #ffffff;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          box-shadow: var(--shadow-sm);
          transition: all 0.2s;
        }

        .btn-action-solid:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(94, 95, 240, 0.25);
        }

        .stat-row th {
          background-color: #fafbfc;
          font-weight: 700;
          color: var(--text-muted);
        }

        /* Custom Dropdown selectors to match calendar select button design */
        .scheduler-select-btn {
          font-size: 12px;
          font-weight: 700;
          padding: 6px 24px 6px 12px;
          border-radius: 6px;
          border: 1.5px solid var(--border-color);
          background-color: var(--bg-card);
          cursor: pointer;
          color: var(--text-main);
          font-family: inherit;
          outline: none;
          transition: all 0.12s ease-in-out;
          line-height: 1.5;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 8px center;
          background-size: 10px;
        }

        .scheduler-select-btn:hover {
          background-color: #f1f5f9;
          border-color: var(--primary);
        }

        /* Hover popovers next to clear button */
        .hover-popover-container {
          position: relative;
          display: inline-block;
        }

        .hover-popover-content {
          visibility: hidden;
          opacity: 0;
          position: absolute;
          bottom: 125%;
          left: 50%;
          transform: translate(-50%, 10px);
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
          border-radius: 8px;
          padding: 16px;
          z-index: 1000;
          transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hover-popover-container:hover .hover-popover-content {
          visibility: visible;
          opacity: 1;
          pointer-events: auto;
          transform: translate(-50%, 0);
        }

        .hover-popover-content::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: var(--bg-card) transparent transparent transparent;
          filter: drop-shadow(0 1px 0 var(--border-color));
        }
      `}</style>

      {/* Scheduler Header */}
      <div className="scheduler-header">
        <div className="scheduler-title-section">
          <div className="scheduler-icon-wrapper">
            <Users size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
              근무 스케줄표 배정
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              관리자(수간호사, 점장, 디렉터 등) 권한으로 조원들의 한 달 근무 로스터를 편성하고 조율합니다.
            </span>
          </div>
        </div>

        <div className="scheduler-controls" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {/* Month Selector */}
          <div className="month-selector" style={{ marginRight: '8px' }}>
            <button onClick={handlePrevMonth} className="arrow-btn" title="이전달">
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', minWidth: '95px', textAlign: 'center' }}>
              {selectedYear}년 {selectedMonth}월
            </span>
            <button onClick={handleNextMonth} className="arrow-btn" title="다음달">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Inline Brush Selector */}
          <div className="brush-selector" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginRight: '4px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-muted)', marginRight: '2px' }}>
              🎨 브러시:
            </span>
            {currentShifts.map(s => {
              const isActive = selectedBrush === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedBrush(s.id)}
                  className={`brush-btn ${isActive ? 'active' : ''}`}
                  style={{
                    backgroundColor: s.bg,
                    color: s.color,
                    border: isActive ? `2.5px solid ${s.color}` : '1.5px solid var(--border-color)',
                    padding: '4px 10px',
                    fontSize: '11.5px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    height: '28px',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s',
                    fontWeight: isActive ? '800' : '500'
                  }}
                >
                  <span className="shift-badge" style={{ backgroundColor: s.color, color: '#fff', width: '16px', height: '16px', fontSize: '8px', borderRadius: '3px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.code}
                  </span>
                  <span>{s.label}</span>
                </button>
              );
            })}
            
            {/* Brush Edit Button */}
            <button 
              type="button"
              onClick={() => setShowBrushManagerModal(true)}
              className="arrow-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: showBrushManagerModal ? 'var(--primary)' : 'var(--text-muted)',
                borderColor: showBrushManagerModal ? 'var(--primary)' : 'var(--border-color)',
                backgroundColor: showBrushManagerModal ? 'var(--primary-light)' : '#ffffff',
                padding: '0 12px',
                height: '32px',
                borderRadius: '6px',
                cursor: 'pointer',
                border: '1.5px solid var(--border-color)',
                fontSize: '12px',
                fontWeight: '800',
                transition: 'all 0.15s'
              }}
              title="브러시 추가/편집 설정"
            >
              <Paintbrush size={14} />
              <span>브러시 설정</span>
            </button>
          </div>

          {/* Icon control buttons */}
          <button 
            type="button"
            onClick={() => setShowStaffManagerModal(true)} 
            className="arrow-btn" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px',
              color: showStaffManagerModal ? 'var(--primary)' : 'var(--text-muted)', 
              borderColor: showStaffManagerModal ? 'var(--primary)' : 'var(--border-color)',
              backgroundColor: showStaffManagerModal ? 'var(--primary-light)' : '#ffffff',
              padding: '0 12px',
              height: '32px',
              borderRadius: '6px',
              cursor: 'pointer',
              border: '1.5px solid var(--border-color)',
              fontSize: '12px',
              fontWeight: '800',
              transition: 'all 0.15s'
            }} 
            title="근무 조원 관리"
          >
            <UserCheck size={14} />
            <span>조원 관리</span>
          </button>

          <button 
            type="button"
            onClick={() => setShowRulesPanel(true)} 
            className="arrow-btn" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px',
              color: showRulesPanel ? 'var(--primary)' : 'var(--text-muted)', 
              borderColor: showRulesPanel ? 'var(--primary)' : 'var(--border-color)',
              backgroundColor: showRulesPanel ? 'var(--primary-light)' : '#ffffff',
              padding: '0 12px',
              height: '32px',
              borderRadius: '6px',
              cursor: 'pointer',
              border: '1.5px solid var(--border-color)',
              fontSize: '12px',
              fontWeight: '800',
              transition: 'all 0.15s'
            }} 
            title="근무 환경 및 규정 설정"
          >
            <Settings size={14} />
            <span>근무 규정 설정</span>
          </button>
        </div>
      </div>

      <div className="scheduler-main-layout">

        <div className="grid-panel">
          {/* Roster Grid Table */}
          <div className="grid-scroll-wrapper">
            <table className="roster-table" style={{ minWidth: '1450px' }}>
              <thead>
                <tr>
                  <th className="col-name" rowSpan={2}>조원 이름</th>
                  {useTeams && <th className="col-team" style={{ width: '80px', backgroundColor: '#fafafa', fontWeight: '800', fontSize: '11px', color: 'var(--text-main)', borderBottom: '2px solid var(--border-color)' }} rowSpan={2}>소속 팀/조</th>}
                  <th className="col-role" rowSpan={2}>직급/역할</th>
                  <th style={{ backgroundColor: '#f1f5f9', color: 'var(--text-main)', borderBottom: 'none' }} colSpan={daysInMonth}>
                    일자별 배정 표
                  </th>
                  <th style={{ backgroundColor: '#eff1fe', color: 'var(--primary)', borderBottom: 'none', fontWeight: '800' }} colSpan={currentShifts.length + 1}>
                    개인별 통계 (일수)
                  </th>
                </tr>
                <tr>
                  {daysArray.map(d => {
                    const isSunday = d.dayOfWeek === 0;
                    const isSaturday = d.dayOfWeek === 6;
                    let dayClass = 'col-day';
                    if (isSunday) dayClass += ' sunday';
                    else if (isSaturday) dayClass += ' saturday';

                    const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];
                    return (
                      <th key={d.day} className={dayClass} style={{ padding: '4px 0' }}>
                        <div>{d.day}</div>
                        <div style={{ fontSize: '9px', fontWeight: '500', opacity: 0.8 }}>{weekdayLabels[d.dayOfWeek]}</div>
                      </th>
                    );
                  })}
                  {/* Shift specific summary headers */}
                  {currentShifts.map(s => (
                    <th key={s.id} style={{ width: '42px', backgroundColor: s.bg, color: s.color, fontWeight: '800', fontSize: '11px', borderBottom: '2px solid var(--border-color)' }}>
                      {s.code}
                    </th>
                  ))}
                  <th style={{ width: '55px', backgroundColor: 'var(--primary-light, #eff1fe)', color: 'var(--primary, #5e5ff0)', fontWeight: '800', fontSize: '11px', borderBottom: '2px solid var(--primary)30' }}>
                    총 근무
                  </th>
                </tr>
              </thead>
              <tbody>
                {staffList.map(staff => {
                  // Calculate shift counts for this staff member
                  const staffCounts = {};
                  currentShifts.forEach(s => {
                    staffCounts[s.id] = 0;
                  });
                  let totalWorkDays = 0;

                  daysArray.forEach(d => {
                    const val = getCellShift(staff.id, d.day);
                    if (val && staffCounts[val] !== undefined) {
                      staffCounts[val]++;
                      if (!isOffShift(val)) {
                        totalWorkDays++;
                      }
                    }
                  });

                  return (
                    <tr key={staff.id}>
                      <td className="cell-staff-name" style={{ whiteSpace: 'nowrap' }}>
                        {staff.name}
                        {staff.team && (
                          <span style={{
                            fontSize: '9px',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            fontWeight: '800',
                            backgroundColor: '#e0f2fe',
                            color: '#0369a1',
                            marginLeft: '6px',
                            display: 'inline-block',
                            verticalAlign: 'middle',
                            lineHeight: '1.2'
                          }}>
                            {staff.team}
                          </span>
                        )}
                      </td>
                      {useTeams && <td className="cell-staff-role" style={{ color: 'var(--text-muted)', backgroundColor: '#fafbfc' }}>{staff.team || '-'}</td>}
                      <td className="cell-staff-role">{staff.role}</td>
                      
                      {daysArray.map(d => {
                        const assignedShiftId = getCellShift(staff.id, d.day);
                        const shiftInfo = currentShifts.find(s => s.id === assignedShiftId);
                        const logReason = assignmentAuditLogs[currentMonthKey]?.[staff.id]?.[d.day];

                        return (
                          <td 
                            key={d.day} 
                            className={`cell-shift-editable ${logReason ? 'cell-ai-logged' : ''}`}
                            onClick={() => handleCellClick(staff.id, d.day)}
                            title={logReason || "수동 편집 또는 기본 일정"}
                            style={{
                              backgroundColor: shiftInfo ? shiftInfo.bg : '#ffffff',
                              color: shiftInfo ? shiftInfo.color : 'inherit',
                              padding: '4px 0'
                            }}
                          >
                            {shiftInfo ? (
                              <span 
                                className="shift-badge"
                                style={{
                                  color: shiftInfo.color,
                                  border: `1px solid ${shiftInfo.color}30`
                                }}
                              >
                                {shiftInfo.code}
                              </span>
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Render shift type summary cells */}
                      {currentShifts.map(s => {
                        const count = staffCounts[s.id] || 0;
                        return (
                          <td 
                            key={s.id} 
                            style={{ 
                              backgroundColor: count > 0 ? s.bg + '70' : '#ffffff', 
                              color: count > 0 ? s.color : '#cbd5e1',
                              fontWeight: '700',
                              fontSize: '11.5px',
                              textAlign: 'center'
                            }}
                          >
                            {count > 0 ? `${count}일` : '-'}
                          </td>
                        );
                      })}
                      {/* Total workdays cell */}
                      <td style={{ backgroundColor: 'var(--primary-light, #eff1fe)', fontWeight: '800', fontSize: '11.5px', color: 'var(--primary, #5e5ff0)', textAlign: 'center' }}>
                        {totalWorkDays}일
                      </td>
                    </tr>
                  );
                })}

                {staffList.length === 0 && (
                  <tr>
                    <td colSpan={(useTeams ? 3 : 2) + daysInMonth + currentShifts.length + 1} style={{ padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      왼쪽에서 근무 조원을 추가하면 스케줄표가 렌더링됩니다.
                    </td>
                  </tr>
                )}

                {/* Statistics Footer: Show total count of each shift per day */}
                {staffList.length > 0 && currentShifts.map((s, idx) => (
                  <tr key={s.id} className="stat-row" style={{ borderTop: idx === 0 ? '2px solid var(--border-color)' : 'none' }}>
                    <td 
                      colSpan={useTeams ? 3 : 2} 
                      style={{ 
                        textAlign: 'right', 
                        paddingRight: '12px', 
                        fontWeight: '700', 
                        fontSize: '11px',
                        color: s.color,
                        backgroundColor: '#f8fafc' 
                      }}
                    >
                      {s.label} 합계 (명)
                    </td>
                    {daysArray.map(d => {
                      const count = dailyStats[d.day]?.[s.id] || 0;
                      return (
                        <td 
                          key={d.day} 
                          style={{ 
                            fontWeight: count > 0 ? '700' : '400',
                            color: count > 0 ? s.color : '#94a3b8',
                            backgroundColor: count > 0 ? s.bg + '50' : '#fafbfc',
                            fontSize: '11px'
                          }}
                        >
                          {count > 0 ? count : '-'}
                        </td>
                      );
                    })}
                    {/* Empty cell spanning summary columns in statistics rows */}
                    <td colSpan={currentShifts.length + 1} style={{ backgroundColor: '#fafbfc', borderLeft: '1px solid var(--border-color)' }} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action bar */}
          <div className="scheduler-actions-bar">
            <button 
              onClick={handleAutoSchedule} 
              className="btn-action-outline"
              style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}
              title="교대근무 휴무 보장 룰 및 인원 균등 분배 알고리즘을 이용한 자동 생성"
            >
              <Sparkles size={16} />
              ⚡ 자동 스케줄 배정 (AI)
            </button>
            
            <button 
              onClick={handleClearRoster} 
              className="btn-action-outline"
              style={{ color: 'var(--text-muted)' }}
            >
              <RefreshCw size={16} />
              전체 비우기
            </button>

            {/* 실시간 근무 규칙 검증 경고 (호버 팝오버) */}
            <div className="hover-popover-container">
              <div 
                className="hover-popover-trigger"
                style={{
                  borderColor: rosterViolations.length > 0 ? '#f59e0b' : '#10b981',
                  backgroundColor: rosterViolations.length > 0 ? '#fffbeb' : '#f0fdf4',
                  color: rosterViolations.length > 0 ? '#b45309' : '#15803d',
                  border: '1px solid',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <span>{rosterViolations.length > 0 ? '⚠️' : '✅'}</span>
                <span>규칙 검증 {rosterViolations.length > 0 ? `(${rosterViolations.length})` : ''}</span>
              </div>
              <div className="hover-popover-content" style={{ width: '380px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px' }}>{rosterViolations.length > 0 ? '⚠️' : '✅'}</span>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: rosterViolations.length > 0 ? '#b45309' : '#166534' }}>
                    {rosterViolations.length > 0 ? `실시간 근무 규칙 검증 경고 (${rosterViolations.length}건)` : '현재 스케줄 규칙 검증 완료'}
                  </h4>
                </div>
                {rosterViolations.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                    {rosterViolations.map(v => (
                      <div key={v.id} style={{ display: 'flex', alignItems: 'start', gap: '6px', fontSize: '11px', color: '#78350f', backgroundColor: '#fffdf5', padding: '6px 10px', borderRadius: '4px', borderLeft: '3px solid #f59e0b', textAlign: 'left' }}>
                        <span style={{ fontWeight: '750', flexShrink: 0 }}>[Day {v.day}]</span>
                        <span>{v.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#166534', lineHeight: '1.4', textAlign: 'left' }}>
                    현재 편성표는 최대 연속근무, 법정 주간 근로일수, 야간휴식 규정, 신규 보호 및 기피 조원 분리 등의 모든 병동/매장 규정을 안전하게 만족합니다.
                  </p>
                )}
              </div>
            </div>

            {/* AI 자동 근무 배정 사유 로그 (호버 팝오버) */}
            <div className="hover-popover-container">
              <div 
                className="hover-popover-trigger"
                style={{
                  borderColor: Object.keys(assignmentAuditLogs[currentMonthKey] || {}).length > 0 ? '#3b82f6' : 'var(--border-color)',
                  backgroundColor: Object.keys(assignmentAuditLogs[currentMonthKey] || {}).length > 0 ? '#eff6ff' : 'var(--bg-card)',
                  color: Object.keys(assignmentAuditLogs[currentMonthKey] || {}).length > 0 ? '#1d4ed8' : 'var(--text-muted)',
                  border: '1px solid',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <span>📝</span>
                <span>배정 사유 로그</span>
              </div>
              <div className="hover-popover-content" style={{ width: '400px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px' }}>📝</span>
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>
                    AI 자동 근무 배정 사유 로그
                  </h4>
                </div>
                {Object.keys(assignmentAuditLogs[currentMonthKey] || {}).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {staffList.map(staff => {
                      const staffLogs = assignmentAuditLogs[currentMonthKey]?.[staff.id] || {};
                      const logDays = Object.keys(staffLogs).filter(d => staffLogs[d] && !staffLogs[d].includes("휴무"));
                      if (logDays.length === 0) return null;
                      return (
                        <div key={staff.id} style={{ backgroundColor: '#ffffff', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '11px', textAlign: 'left' }}>
                          <span style={{ fontWeight: '750', color: 'var(--primary)' }}>{staff.name}</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px', paddingLeft: '4px' }}>
                            {logDays.map(d => (
                              <div key={d} style={{ display: 'flex', gap: '6px' }}>
                                <span style={{ color: 'var(--text-muted)', fontWeight: '700', flexShrink: 0 }}>{d}일:</span>
                                <span style={{ color: 'var(--text-main)' }}>{staffLogs[d]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.4', textAlign: 'left' }}>
                    자동 배정을 완료하면 여기에 상세한 배정 사유가 기록됩니다. 셀 위에 마우스를 올려도 사유를 볼 수 있습니다.
                  </p>
                )}
              </div>
            </div>

            <div style={{ flex: 1 }} />

            <button onClick={handleExportCSV} className="btn-action-outline">
              <Download size={16} />
              엑셀 다운로드 (CSV)
            </button>
            
            <button onClick={handleSaveAll} className="btn-action-solid">
              <Save size={16} />
              저장 및 캘린더 연동하기
            </button>
          </div>
        </div>

        {/* Modal 1: Shift Member Management */}
        {showStaffManagerModal && (
          <div className="custom-modal-overlay" onClick={() => setShowStaffManagerModal(false)}>
            <div className="custom-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '380px' }}>
              <div className="custom-modal-header">
                <h4 className="custom-modal-title">
                  <UserCheck size={16} color="var(--primary)" />
                  <span>근무 조원 관리</span>
                </h4>
                <button type="button" className="custom-modal-close" onClick={() => setShowStaffManagerModal(false)}>✕</button>
              </div>
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
{/* Add Staff Form */}
            <form onSubmit={handleAddStaff} className="staff-form" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', width: '100%' }}>
                <input 
                  type="text" 
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="조원 이름 입력"
                  className="input-text"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1.5px solid var(--border-color)',
                    outline: 'none'
                  }}
                  required
                />
                <input 
                  type="text" 
                  value={newStaffTeam}
                  onChange={(e) => setNewStaffTeam(e.target.value)}
                  placeholder="조/팀 (선택)"
                  className="input-text"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1.5px solid var(--border-color)',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
                <select
                  value={newStaffRole}
                  onChange={(e) => {
                    if (e.target.value === '___manage_roles___') {
                      setShowRoleManagerModal(true);
                    } else {
                      setNewStaffRole(e.target.value);
                    }
                  }}
                  className="scheduler-select-btn"
                >
                  {customRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                  <option value="___manage_roles___">역할 추가/수정/삭제...</option>
                </select>

                <select
                  value={newStaffExpLevel}
                  onChange={(e) => {
                    if (e.target.value === '___manage_exp_levels___') {
                      setShowExpLevelManagerModal(true);
                    } else {
                      setNewStaffExpLevel(e.target.value);
                    }
                  }}
                  className="scheduler-select-btn"
                >
                  {customExpLevels.map(lvl => (
                    <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                  ))}
                  <option value="___manage_exp_levels___">숙련도 구분 설정...</option>
                </select>
              </div>
              <button 
                type="submit"
                className="btn-action-solid"
                style={{
                  justifyContent: 'center',
                  padding: '8px',
                  fontSize: '12px'
                }}
              >
                <Plus size={14} />
                근무 조원 추가
              </button>
            </form>

            {/* Staff Scroll Area */}
            <div className="staff-scroll-area">
              {staffList.map(staff => (
                <div key={staff.id} className="staff-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: staff.color }} />
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                          {useTeams && staff.team && (
                            <span style={{
                              fontSize: '9px',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: '800',
                              backgroundColor: '#e0f2fe',
                              color: '#0369a1',
                              lineHeight: '1.2'
                            }}>
                              {staff.team}
                            </span>
                          )}
                          {staff.name}
                          <span style={{
                            fontSize: '9px',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontWeight: '800',
                            backgroundColor: isSenior(staff.expLevel) ? 'var(--primary-light, #eff1fe)' : '#f0fdf4',
                            color: isSenior(staff.expLevel) ? 'var(--primary, #5e5ff0)' : '#16a34a',
                            lineHeight: '1.2'
                          }}>
                            {customExpLevels.find(l => l.id === staff.expLevel || l.label === staff.expLevel)?.label.split(' ')[0] || staff.expLevel}
                          </span>
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                          {staff.role}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        type="button"
                        onClick={() => handleOpenStaffConfig(staff)}
                        style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px', fontSize: '12px' }}
                        title="개인 사정 및 제약 조건 설정"
                      >
                        ⚙️
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteStaff(staff.id)}
                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                        title="조원 삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {/* Qualitative Badge Indicators */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', paddingLeft: '18px' }}>
                    {staff.specialRequests?.nightAvoid && (
                      <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px', backgroundColor: '#fee2e2', color: '#ef4444', fontWeight: '700' }}>
                        야간제외
                      </span>
                    )}
                    {staff.specialRequests?.weekendOff && (
                      <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px', backgroundColor: '#fef3c7', color: '#d97706', fontWeight: '700' }}>
                        주말휴무
                      </span>
                    )}
                    {staff.specialRequests?.couplingWith && (
                      <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px', backgroundColor: '#eff6ff', color: '#2563eb', fontWeight: '700' }}>
                        동행
                      </span>
                    )}
                    {staff.avoidWith && staff.avoidWith.length > 0 && (
                      <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px', backgroundColor: '#f3f4f6', color: '#4b5563', fontWeight: '700' }}>
                        기피{staff.avoidWith.length}
                      </span>
                    )}
                    {staff.specialNote && (
                      <span 
                        style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px', backgroundColor: '#faf5ff', color: '#7c3aed', fontWeight: '700', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} 
                        title={staff.specialNote}
                      >
                        📝 {staff.specialNote}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {staffList.length === 0 && (
                <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  등록된 조원이 없습니다.
                </div>
              )}
            </div>
</div>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: Assignment Brush Selection & Editor */}
        {showBrushManagerModal && (
          <div className="custom-modal-overlay" onClick={() => setShowBrushManagerModal(false)}>
            <div className="custom-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '680px' }}>
              <div className="custom-modal-header">
                <h4 className="custom-modal-title">
                  <Paintbrush size={16} color="var(--primary)" />
                  <span>배정 브러시 설정 및 편집</span>
                </h4>
                <button type="button" className="custom-modal-close" onClick={() => setShowBrushManagerModal(false)}>✕</button>
              </div>
              <div style={{ marginTop: '10px' }}>
                <div style={{
                
                
                
                
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                animation: 'fadeIn 0.2s ease',
                alignItems: 'start'
              }}>
                {/* Left: List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0' }}>등록된 브러시 목록 ({currentShifts.length}개)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                    {currentShifts.map(s => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ backgroundColor: s.color, color: '#ffffff', fontWeight: '850', fontSize: '10px', width: '22px', height: '22px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {s.code}
                          </span>
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>{s.label}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '6px' }}>({s.start} ~ {s.end})</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleStartEditShift(s)}
                            style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}
                          >
                            수정
                          </button>
                          {s.id !== 'O' && s.id !== 'OFF' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteShiftType(s.id)}
                              style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Form */}
                <div style={{ borderLeft: '1px dashed var(--border-color)', paddingLeft: '20px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0' }}>
                    {editingShiftId ? '🎨 브러시 정보 수정' : '➕ 새 근무 브러시 추가'}
                  </h4>
                  <form onSubmit={handleSaveShiftType} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>코드 (최대 4자)</label>
                        <input
                          type="text"
                          maxLength={4}
                          value={shiftForm.code}
                          onChange={(e) => setShiftForm(prev => ({ ...prev, code: e.target.value }))}
                          placeholder="D2, 오"
                          className="input-text"
                          style={{ width: '100%', padding: '6px 8px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>브러시 이름</label>
                        <input
                          type="text"
                          value={shiftForm.label}
                          onChange={(e) => setShiftForm(prev => ({ ...prev, label: e.target.value }))}
                          placeholder="데이2, 오전업무"
                          className="input-text"
                          style={{ width: '100%', padding: '6px 8px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>시작 시간</label>
                        <input
                          type="time"
                          value={shiftForm.start}
                          onChange={(e) => setShiftForm(prev => ({ ...prev, start: e.target.value }))}
                          className="input-text"
                          style={{ width: '100%', padding: '6px 8px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#fff' }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>종료 시간</label>
                        <input
                          type="time"
                          value={shiftForm.end}
                          onChange={(e) => setShiftForm(prev => ({ ...prev, end: e.target.value }))}
                          className="input-text"
                          style={{ width: '100%', padding: '6px 8px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: '#fff' }}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>테마 색상:</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {['#16a34a', '#ea580c', '#7c3aed', '#1d4ed8', '#0d9488', '#b91c1c', '#ec4899', '#4b5563'].map(colorHex => (
                            <div
                              key={colorHex}
                              onClick={() => setShiftForm(prev => ({ ...prev, color: colorHex }))}
                              style={{
                                width: '15px',
                                height: '15px',
                                borderRadius: '50%',
                                backgroundColor: colorHex,
                                cursor: 'pointer',
                                border: shiftForm.color === colorHex ? '2.5px solid #000' : '1.5px solid transparent',
                                transform: shiftForm.color === colorHex ? 'scale(1.1)' : 'scale(1)',
                                transition: 'all 0.1s'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {editingShiftId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingShiftId(null);
                              setShiftForm({ code: '', label: '', color: '#1d4ed8', start: '09:00', end: '18:00' });
                            }}
                            className="btn-action-outline"
                            style={{ padding: '4px 10px', fontSize: '11px', height: '26px' }}
                          >
                            취소
                          </button>
                        )}
                        <button
                          type="submit"
                          className="btn-action-solid"
                          style={{ padding: '4px 12px', fontSize: '11px', height: '26px' }}
                        >
                          {editingShiftId ? '수정완료' : '추가하기'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
     
              </div>
            </div>
          </div>
        )}        {/* Modal 3: Regulations Settings */}
        {showRulesPanel && (
          <div className="custom-modal-overlay" onClick={() => setShowRulesPanel(false)}>
            <div className="custom-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '420px' }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>⚙️</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>근무 환경 및 규정 설정</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowRulesPanel(false)}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '800',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = '#f1f5f9'; e.target.style.color = 'var(--text-main)'; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--text-muted)'; }}
                  title="설정 닫기"
                >
                  ✕
                </button>
              </div>

              {/* Max Consecutive Work */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>최대 연속 근무</span>
                  <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{wardRules.maxConsecutiveWork}일</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={7}
                  value={wardRules.maxConsecutiveWork}
                  onChange={(e) => setWardRules(prev => ({ ...prev, maxConsecutiveWork: parseInt(e.target.value) }))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              {/* Max Weekly Work Days */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>주간 근무 한도 (법정)</span>
                  <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{wardRules.maxWeeklyWorkDays}일</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={6}
                  value={wardRules.maxWeeklyWorkDays}
                  onChange={(e) => setWardRules(prev => ({ ...prev, maxWeeklyWorkDays: parseInt(e.target.value) }))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              {/* Max Weekly Work Hours */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>최대 주간 근로시간</span>
                  <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{wardRules.maxWeeklyWorkHours}시간</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={60}
                  value={wardRules.maxWeeklyWorkHours}
                  onChange={(e) => setWardRules(prev => ({ ...prev, maxWeeklyWorkHours: parseInt(e.target.value) }))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              {/* Min Rest After Night */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>야간 근무 후 휴식 일수</span>
                  <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{wardRules.minRestAfterNight}일</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={2}
                  value={wardRules.minRestAfterNight}
                  onChange={(e) => setWardRules(prev => ({ ...prev, minRestAfterNight: parseInt(e.target.value) }))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '4px 0' }} />

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={wardRules.protectJuniors}
                    onChange={(e) => setWardRules(prev => ({ ...prev, protectJuniors: e.target.checked }))}
                  />
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-main)' }}>🛡️ 신규 보호 (경력직 1인 조화)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={wardRules.avoidConflict}
                    onChange={(e) => setWardRules(prev => ({ ...prev, avoidConflict: e.target.checked }))}
                  />
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-main)' }}>🚫 갈등 조원 자동 분리</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={wardRules.matchPreceptors}
                    onChange={(e) => setWardRules(prev => ({ ...prev, matchPreceptors: e.target.checked }))}
                  />
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-main)' }}>🤝 사수-부사수 동행 스케줄</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={useTeams}
                    onChange={(e) => setUseTeams(e.target.checked)}
                  />
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-main)' }}>👥 팀(조) 구분 및 표시 활성화</span>
                </label>
              </div>

              <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '4px 0' }} />

              {/* Custom Roles Manager */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '850', color: 'var(--text-main)' }}>📋 역할/직급 목록 관리</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {customRoles.map(r => (
                    <span
                      key={r}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10.5px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: 'var(--primary-light, #eff1fe)',
                        color: 'var(--primary, #5e5ff0)',
                        fontWeight: '750'
                      }}
                    >
                      {r}
                      <button
                        type="button"
                        onClick={() => {
                          if (customRoles.length <= 1) {
                            alert('최소 하나의 역할은 존재해야 합니다.');
                            return;
                          }
                          setCustomRoles(prev => prev.filter(role => role !== r));
                        }}
                        style={{
                          border: 'none',
                          background: 'none',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          fontSize: '10px',
                          padding: '0 2px',
                          fontWeight: '800'
                        }}
                        title="역할 삭제"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                  <input
                    type="text"
                    id="new-role-input"
                    placeholder="새 역할 입력 (예: 카운터)"
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      fontSize: '11px',
                      borderRadius: '6px',
                      border: '1.5px solid var(--border-color)',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.target.value.trim();
                        if (!val) return;
                        if (customRoles.includes(val)) {
                          alert('이미 존재하는 역할입니다.');
                          return;
                        }
                        setCustomRoles(prev => [...prev, val]);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new-role-input');
                      const val = input ? input.value.trim() : '';
                      if (!val) return;
                      if (customRoles.includes(val)) {
                        alert('이미 존재하는 역할입니다.');
                        return;
                      }
                      setCustomRoles(prev => [...prev, val]);
                      if (input) input.value = '';
                    }}
                    className="btn-action-solid"
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      borderRadius: '6px',
                      height: 'auto'
                    }}
                  >
                    추가
                  </button>
                </div>
              </div>
</div>
            </div>
          </div>
        )}

      </div>

      {/* Staff Config Modal overlay */}
      {showStaffConfigModal && selectedStaffForConfig && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '450px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            animation: 'scaleIn 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '850', color: 'var(--text-main)' }}>
                👤 {selectedStaffForConfig.name} 개인 제약 및 설정
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Basic Employee Info Editing Section (Grouped for clean design) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '12px', backgroundColor: '#faf5ff', borderRadius: '8px', border: '1px solid var(--primary-light)' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '750', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    이름
                  </label>
                  <input
                    type="text"
                    value={personalConfigForm.name}
                    onChange={(e) => setPersonalConfigForm(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: '1.5px solid var(--border-color)',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '750', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    역할/직급
                  </label>
                  <select
                    value={personalConfigForm.role}
                    onChange={(e) => {
                      if (e.target.value === '___manage_roles___') {
                        setShowRoleManagerModal(true);
                      } else {
                        setPersonalConfigForm(prev => ({ ...prev, role: e.target.value }));
                      }
                    }}
                    className="scheduler-select-btn"
                    style={{ width: '100%' }}
                  >
                    {customRoles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                    <option value="___manage_roles___">역할 추가/수정/삭제...</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '750', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    숙련도 구분
                  </label>
                  <select
                    value={personalConfigForm.expLevel}
                    onChange={(e) => {
                      if (e.target.value === '___manage_exp_levels___') {
                        setShowExpLevelManagerModal(true);
                      } else {
                        setPersonalConfigForm(prev => ({ ...prev, expLevel: e.target.value }));
                      }
                    }}
                    className="scheduler-select-btn"
                    style={{ width: '100%' }}
                  >
                    {customExpLevels.map(lvl => (
                      <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                    ))}
                    <option value="___manage_exp_levels___">숙련도 구분 설정...</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: '750', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    소속 팀/조 (선택)
                  </label>
                  <input
                    type="text"
                    value={personalConfigForm.team}
                    onChange={(e) => setPersonalConfigForm(prev => ({ ...prev, team: e.target.value }))}
                    placeholder="예: A팀, 1조"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: '1.5px solid var(--border-color)',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
              </div>
              {/* Special Note */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  📌 개인 사정 / 특이사항 (예: 육아, 건강, 시험 등)
                </label>
                <input
                  type="text"
                  value={personalConfigForm.specialNote}
                  onChange={(e) => setPersonalConfigForm(prev => ({ ...prev, specialNote: e.target.value }))}
                  placeholder="예: 건강 사정으로 야간 제외 요청 등"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1.5px solid var(--border-color)',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>

              {/* Special Requests toggles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={personalConfigForm.nightAvoid}
                    onChange={(e) => setPersonalConfigForm(prev => ({ ...prev, nightAvoid: e.target.checked }))}
                  />
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-main)' }}>🌙 야간근무 제외</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={personalConfigForm.weekendOff}
                    onChange={(e) => setPersonalConfigForm(prev => ({ ...prev, weekendOff: e.target.checked }))}
                  />
                  <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-main)' }}>📅 주말오프 희망</span>
                </label>
              </div>

              {/* Preceptor coupling */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  🤝 동행 근무 조원 지정 (사수-부사수 매칭)
                </label>
                <select
                  value={personalConfigForm.couplingWith}
                  onChange={(e) => setPersonalConfigForm(prev => ({ ...prev, couplingWith: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1.5px solid var(--border-color)',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">미지정</option>
                  {staffList.filter(s => s.id !== selectedStaffForConfig.id).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              {/* Avoid With (Conflict avoidance) */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  ⚠️ 갈등 관계 및 근무 기피 대상 조원 (배치 시 자동 회피)
                </label>
                <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#ffffff' }}>
                  {staffList.filter(s => s.id !== selectedStaffForConfig.id).map(s => {
                    const isChecked = personalConfigForm.avoidWith.includes(s.id);
                    return (
                      <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPersonalConfigForm(prev => ({ ...prev, avoidWith: [...prev.avoidWith, s.id] }));
                            } else {
                              setPersonalConfigForm(prev => ({ ...prev, avoidWith: prev.avoidWith.filter(id => id !== s.id) }));
                            }
                          }}
                        />
                        <span style={{ fontSize: '11.5px', color: 'var(--text-main)' }}>{s.name} ({s.role})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowStaffConfigModal(false);
                  setSelectedStaffForConfig(null);
                }}
                className="btn-action-outline"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveStaffConfig}
                className="btn-action-solid"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                설정 적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Manager Modal overlay */}
      {showRoleManagerModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '400px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            animation: 'scaleIn 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '850', color: 'var(--text-main)' }}>
                📋 역할(직급) 추가 / 수정 / 삭제
              </h3>
            </div>

            {/* List of Roles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
              {customRoles.map((role, idx) => {
                const isEditingThis = editingRoleIndex === idx;
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '8px' }}>
                    {isEditingThis ? (
                      <input
                        type="text"
                        value={editingRoleValue}
                        onChange={(e) => setEditingRoleValue(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          fontSize: '12px',
                          borderRadius: '4px',
                          border: '1.5px solid var(--primary)',
                          outline: 'none'
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateRole(idx, role, editingRoleValue);
                          } else if (e.key === 'Escape') {
                            setEditingRoleIndex(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                        {role}
                      </span>
                    )}

                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      {isEditingThis ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateRole(idx, role, editingRoleValue)}
                            style={{ fontSize: '11px', color: '#16a34a', fontWeight: '800', cursor: 'pointer', border: 'none', background: 'none' }}
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRoleIndex(null)}
                            style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800', cursor: 'pointer', border: 'none', background: 'none' }}
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRoleIndex(idx);
                              setEditingRoleValue(role);
                            }}
                            style={{ fontSize: '11.5px', color: 'var(--primary)', fontWeight: '750', cursor: 'pointer', border: 'none', background: 'none' }}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(role)}
                            style={{ fontSize: '11.5px', color: '#ef4444', fontWeight: '750', cursor: 'pointer', border: 'none', background: 'none' }}
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Role input */}
            <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
              <input
                type="text"
                value={newRoleInputValue}
                onChange={(e) => setNewRoleInputValue(e.target.value)}
                placeholder="새 역할 입력 (예: 부점장)"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1.5px solid var(--border-color)',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRole(newRoleInputValue);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleAddRole(newRoleInputValue)}
                className="btn-action-solid"
                style={{ padding: '6px 14px', fontSize: '12px', height: 'auto' }}
              >
                추가
              </button>
            </div>

            {/* Footer Close button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '2px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowRoleManagerModal(false);
                  setEditingRoleIndex(null);
                }}
                className="btn-action-outline"
                style={{ padding: '8px 20px', fontSize: '12px', width: '100%', justifyContent: 'center' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Experience Level Manager Modal overlay */}
      {showExpLevelManagerModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '450px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            animation: 'scaleIn 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '850', color: 'var(--text-main)' }}>
                ⚙️ 숙련도(경력/신입) 구분 설정
              </h3>
            </div>

            {/* List of Experience Levels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
              {customExpLevels.map((lvl, idx) => {
                const isEditingThis = editingExpLevelIndex === idx;
                return (
                  <div key={lvl.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)', gap: '8px' }}>
                    {isEditingThis ? (
                      <div style={{ display: 'flex', gap: '6px', flex: 1, alignItems: 'center' }}>
                        <input
                          type="text"
                          value={editingExpLevelValue}
                          onChange={(e) => setEditingExpLevelValue(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            fontSize: '12px',
                            borderRadius: '4px',
                            border: '1.5px solid var(--primary)',
                            outline: 'none'
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateExpLevel(idx, lvl.id, lvl.label, editingExpLevelValue, editingExpLevelType);
                            } else if (e.key === 'Escape') {
                              setEditingExpLevelIndex(null);
                            }
                          }}
                          autoFocus
                        />
                        <select
                          value={editingExpLevelType}
                          onChange={(e) => setEditingExpLevelType(e.target.value)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            border: '1.5px solid var(--border-color)',
                            outline: 'none',
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <option value="senior">경력자 규칙 적용</option>
                          <option value="junior">신입 보호 규칙 적용</option>
                        </select>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-main)' }}>
                          {lvl.label}
                        </span>
                        <span style={{
                          fontSize: '9px',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontWeight: '800',
                          backgroundColor: lvl.type === 'senior' ? 'var(--primary-light, #eff1fe)' : '#f0fdf4',
                          color: lvl.type === 'senior' ? 'var(--primary, #5e5ff0)' : '#16a34a',
                          lineHeight: '1.2'
                        }}>
                          {lvl.type === 'senior' ? '경력' : '신규 보호'}
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      {isEditingThis ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateExpLevel(idx, lvl.id, lvl.label, editingExpLevelValue, editingExpLevelType)}
                            style={{ fontSize: '11px', color: '#16a34a', fontWeight: '800', cursor: 'pointer', border: 'none', background: 'none' }}
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingExpLevelIndex(null)}
                            style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800', cursor: 'pointer', border: 'none', background: 'none' }}
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingExpLevelIndex(idx);
                              setEditingExpLevelValue(lvl.label);
                              setEditingExpLevelType(lvl.type);
                            }}
                            style={{ fontSize: '11.5px', color: 'var(--primary)', fontWeight: '750', cursor: 'pointer', border: 'none', background: 'none' }}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpLevel(lvl.id, lvl.label)}
                            style={{ fontSize: '11.5px', color: '#ef4444', fontWeight: '750', cursor: 'pointer', border: 'none', background: 'none' }}
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add ExpLevel input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  value={newExpLevelName}
                  onChange={(e) => setNewExpLevelName(e.target.value)}
                  placeholder="새 구분 이름 (예: 준경력, 알바)"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1.5px solid var(--border-color)',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddExpLevel(newExpLevelName, newExpLevelType);
                    }
                  }}
                />
                <select
                  value={newExpLevelType}
                  onChange={(e) => setNewExpLevelType(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1.5px solid var(--border-color)',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="junior">신규 보호 규칙 적용</option>
                  <option value="senior">경력자 규칙 적용</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => handleAddExpLevel(newExpLevelName, newExpLevelType)}
                className="btn-action-solid"
                style={{ padding: '8px 14px', fontSize: '12px', height: 'auto', width: '100%', justifyContent: 'center' }}
              >
                구분 추가
              </button>
            </div>

            {/* Footer Close button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '2px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowExpLevelManagerModal(false);
                  setEditingExpLevelIndex(null);
                }}
                className="btn-action-outline"
                style={{ padding: '8px 20px', fontSize: '12px', width: '100%', justifyContent: 'center' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
