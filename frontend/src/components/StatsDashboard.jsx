import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight, 
  Award,
  Sparkles,
  PieChart
} from 'lucide-react';

export default function StatsDashboard({ events = [], shifts = [], currentDate }) {
  const [viewScope, setViewScope] = useState('month'); // 'month' or 'all'
  const [selectedYear, setSelectedYear] = useState(() => currentDate ? currentDate.getFullYear() : new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => currentDate ? currentDate.getMonth() + 1 : new Date().getMonth() + 1);

  // Handle month navigation
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

  // Filter and calculate statistics
  const statsData = useMemo(() => {
    // 1. Filter only shifts
    const shiftEvents = events.filter(evt => evt.type === 'shift');

    // 2. Filter by scope
    const targetEvents = viewScope === 'month' 
      ? shiftEvents.filter(evt => {
          if (!evt.date) return false;
          const prefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
          return evt.date.startsWith(prefix);
        })
      : shiftEvents;

    // Create a map of shifts for easy lookup
    const shiftMap = {};
    shifts.forEach(s => {
      shiftMap[s.id] = s;
    });

    // Count shifts by type and accumulate minutes
    const counts = {};
    const minutesMap = {};
    const overtimeHoursMap = {};
    let totalWorkDays = 0;
    let totalOvertimeHours = 0;

    targetEvents.forEach(evt => {
      const type = evt.shiftType || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
      totalWorkDays++;

      const shiftInfo = shiftMap[type];
      let mins = 480; // Default 8 hours
      if (shiftInfo && shiftInfo.start && shiftInfo.end && shiftInfo.start !== '-') {
        try {
          const [sH, sM] = shiftInfo.start.split(':').map(Number);
          const [eH, eM] = shiftInfo.end.split(':').map(Number);
          let diffMin = (eH * 60 + eM) - (sH * 60 + sM);
          if (diffMin < 0) diffMin += 24 * 60;
          mins = diffMin;
        } catch (e) {}
      }
      const otHrs = parseFloat(evt.overtimeHours) || 0;
      const otMins = otHrs * 60;
      minutesMap[type] = (minutesMap[type] || 0) + mins + otMins;
      overtimeHoursMap[type] = (overtimeHoursMap[type] || 0) + otHrs;
      totalOvertimeHours += otHrs;
    });

    // Format shift statistics
    const shiftStats = Object.keys(counts).map(typeId => {
      const shiftInfo = shiftMap[typeId] || { 
        label: typeId === 'unknown' ? '미지정 근무' : typeId, 
        color: '#64748b',
        start: '-',
        end: '-'
      };
      
      const totalMins = minutesMap[typeId] || 0;
      const hours = Math.round((totalMins / 60) * 10) / 10;
      
      return {
        id: typeId,
        label: shiftInfo.label,
        color: shiftInfo.color,
        start: shiftInfo.start,
        end: shiftInfo.end,
        count: counts[typeId],
        hours,
        overtimeHours: Math.round((overtimeHoursMap[typeId] || 0) * 10) / 10,
        percentage: totalWorkDays > 0 ? Math.round((counts[typeId] / totalWorkDays) * 100) : 0
      };
    }).sort((a, b) => b.count - a.count); // Sort by frequency descending

    // Find the most frequent shift
    const mainShift = shiftStats.length > 0 ? shiftStats[0] : null;

    // Calculate estimated total hours worked
    let totalMinutes = 0;
    targetEvents.forEach(evt => {
      const type = evt.shiftType;
      const shiftInfo = shiftMap[type];
      let mins = 480;
      if (shiftInfo && shiftInfo.start && shiftInfo.end) {
        try {
          const [sH, sM] = shiftInfo.start.split(':').map(Number);
          const [eH, eM] = shiftInfo.end.split(':').map(Number);
          
          let diffMin = (eH * 60 + eM) - (sH * 60 + sM);
          if (diffMin < 0) {
            diffMin += 24 * 60;
          }
          mins = diffMin;
        } catch (e) {}
      }
      const otMins = (evt.overtimeHours || 0) * 60;
      totalMinutes += mins + otMins;
    });

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    return {
      shiftStats,
      totalWorkDays,
      mainShift,
      totalHours,
      totalOvertimeHours: Math.round(totalOvertimeHours * 10) / 10,
      totalEventsCount: targetEvents.length
    };
  }, [events, shifts, viewScope, selectedYear, selectedMonth]);

  // Calculate weekly statistics for Part-time allowance (15+ hours)
  const weeklyStats = useMemo(() => {
    if (viewScope !== 'month') return [];

    const formatDateStr = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
    const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0);

    const startOfWeek = new Date(firstDayOfMonth);
    const firstDayOfWeekVal = startOfWeek.getDay();
    const diffToMonday = firstDayOfWeekVal === 0 ? -6 : 1 - firstDayOfWeekVal;
    startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);

    const endOfWeek = new Date(lastDayOfMonth);
    const lastDayOfWeekVal = endOfWeek.getDay();
    const diffToSunday = lastDayOfWeekVal === 0 ? 0 : 7 - lastDayOfWeekVal;
    endOfWeek.setDate(endOfWeek.getDate() + diffToSunday);

    const weeks = [];
    let currentPtr = new Date(startOfWeek);
    let weekIndex = 1;

    const shiftMap = {};
    shifts.forEach(s => {
      shiftMap[s.id] = s;
    });

    const shiftEvents = events.filter(evt => evt.type === 'shift');

    while (currentPtr <= endOfWeek) {
      const weekStart = new Date(currentPtr);
      const weekEnd = new Date(currentPtr);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekStartStr = formatDateStr(weekStart);
      const weekEndStr = formatDateStr(weekEnd);

      const weekEvents = shiftEvents.filter(evt => {
        return evt.date && evt.date >= weekStartStr && evt.date <= weekEndStr;
      });

      let totalMins = 0;
      let weekOvertimeMins = 0;
      const weekShiftBreakdown = {};

      weekEvents.forEach(evt => {
        const type = evt.shiftType || 'unknown';
        const shiftInfo = shiftMap[type] || { 
          label: type === 'unknown' ? '미지정 근무' : type, 
          color: '#64748b',
          start: '-',
          end: '-'
        };
        
        let mins = 480;
        if (shiftInfo && shiftInfo.start && shiftInfo.end && shiftInfo.start !== '-') {
          try {
            const [sH, sM] = shiftInfo.start.split(':').map(Number);
            const [eH, eM] = shiftInfo.end.split(':').map(Number);
            let diff = (eH * 60 + eM) - (sH * 60 + sM);
            if (diff < 0) diff += 24 * 60;
            mins = diff;
          } catch (e) {}
        }
        
        const otHrs = parseFloat(evt.overtimeHours) || 0;
        const otMins = otHrs * 60;
        
        totalMins += mins + otMins;
        weekOvertimeMins += otMins;
        
        const hrs = Math.round(((mins + otMins) / 60) * 10) / 10;
        if (!weekShiftBreakdown[type]) {
          weekShiftBreakdown[type] = {
            label: shiftInfo.label,
            color: shiftInfo.color,
            hours: 0,
            days: 0,
            overtimeHours: 0
          };
        }
        weekShiftBreakdown[type].hours += hrs;
        weekShiftBreakdown[type].days += 1;
        weekShiftBreakdown[type].overtimeHours += otHrs;
      });

      const hours = Math.round((totalMins / 60) * 10) / 10;
      const weekOvertimeHours = Math.round((weekOvertimeMins / 60) * 10) / 10;
      
      const breakdownList = Object.keys(weekShiftBreakdown).map(type => ({
        type,
        ...weekShiftBreakdown[type],
        hours: Math.round(weekShiftBreakdown[type].hours * 10) / 10,
        overtimeHours: Math.round(weekShiftBreakdown[type].overtimeHours * 10) / 10
      })).sort((a, b) => b.hours - a.hours);

      weeks.push({
        label: `${weekIndex}주차`,
        rangeText: `${weekStart.getMonth() + 1}/${weekStart.getDate()} ~ ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`,
        hours,
        overtimeHours: weekOvertimeHours,
        eventsCount: weekEvents.length,
        breakdown: breakdownList
      });

      currentPtr.setDate(currentPtr.getDate() + 7);
      weekIndex++;
    }

    return weeks;
  }, [events, shifts, viewScope, selectedYear, selectedMonth]);

  // Insight / comment based on stats
  const insightText = useMemo(() => {
    if (statsData.totalWorkDays === 0) {
      return "등록된 근무 일정이 없습니다. 일정을 추가하여 통계를 확인해 보세요!";
    }
    
    if (viewScope === 'month') {
      if (statsData.totalWorkDays >= 20) {
        return `이번 달은 총 ${statsData.totalWorkDays}일로 근무 일정이 빽빽합니다. 건강 관리에 유의하세요!`;
      } else if (statsData.totalWorkDays >= 10) {
        return `적당한 근무 일정(${statsData.totalWorkDays}일)이 짜여 있습니다. 일과 삶의 균형을 잘 지키고 계시네요.`;
      } else {
        return `이번 달 근무 일정은 ${statsData.totalWorkDays}일로 여유로운 편입니다. 개인 시간을 알차게 보내세요!`;
      }
    } else {
      return `전체 기간 동안 총 ${statsData.totalWorkDays}일의 근무 기록이 있습니다. 수고하셨습니다!`;
    }
  }, [statsData.totalWorkDays, viewScope]);

  return (
    <div className="stats-dashboard fade-in" style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header section with Title and Period Switcher */}
      <div className="stats-header" style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '12px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <BarChart3 size={24} color="var(--primary)" />
            근무 통계
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
            근무 일수 및 유형별 통계를 한눈에 확인합니다.
          </p>
        </div>

        {/* View toggles & date selector */}
        <div className="stats-header-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Scope Toggle */}
          <div style={{ 
            display: 'flex', 
            backgroundColor: 'var(--primary-light)', 
            padding: '3px', 
            borderRadius: '8px' 
          }}>
            <button
              onClick={() => setViewScope('month')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: viewScope === 'month' ? '#ffffff' : 'transparent',
                color: viewScope === 'month' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: viewScope === 'month' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              월별 통계
            </button>
            <button
              onClick={() => setViewScope('all')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: viewScope === 'all' ? '#ffffff' : 'transparent',
                color: viewScope === 'all' ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: viewScope === 'all' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              전체 누적
            </button>
          </div>

          {/* Month selector (only visible if scope is month) */}
          {viewScope === 'month' && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '4px 8px',
              backgroundColor: '#ffffff'
            }}>
              <button 
                onClick={handlePrevMonth}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
              >
                <ChevronLeft size={16} color="var(--text-muted)" />
              </button>
              <span style={{ fontSize: '13px', fontWeight: '700', minWidth: '75px', textAlign: 'center' }}>
                {selectedYear}년 {selectedMonth}월
              </span>
              <button 
                onClick={handleNextMonth}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
              >
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Widget Cards */}
      <div className="stats-summary-grid" style={{
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '16px' 
      }}>
        
        {/* Card 1: Total Working Days */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '16px', 
          padding: '20px', 
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ 
            backgroundColor: 'var(--primary-light)', 
            padding: '12px', 
            borderRadius: '12px', 
            color: 'var(--primary)' 
          }}>
            <Calendar size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>총 근무 일수</span>
            <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>
              {statsData.totalWorkDays} <span style={{ fontSize: '14px', fontWeight: '500' }}>일</span>
            </span>
          </div>
        </div>

        {/* Card 2: Estimated Work Hours */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '16px', 
          padding: '20px', 
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ 
            backgroundColor: '#fef3c7', 
            padding: '12px', 
            borderRadius: '12px', 
            color: '#d97706' 
          }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>예상 근무 시간</span>
            <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>
              {statsData.totalHours} <span style={{ fontSize: '14px', fontWeight: '500' }}>시간</span>
            </span>
            {statsData.totalOvertimeHours > 0 && (
              <span style={{ fontSize: '11px', color: '#d97706', fontWeight: '600', display: 'block', marginTop: '2px' }}>
                (초과근무 {statsData.totalOvertimeHours}시간 포함)
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Main/Most Frequent Shift */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '16px', 
          padding: '20px', 
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ 
            backgroundColor: statsData.mainShift ? `${statsData.mainShift.color}15` : '#f1f5f9', 
            padding: '12px', 
            borderRadius: '12px', 
            color: statsData.mainShift ? statsData.mainShift.color : '#64748b' 
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>최다 근무 형태</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
              {statsData.mainShift ? statsData.mainShift.label : '없음'}
              {statsData.mainShift && (
                <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginLeft: '6px' }}>
                  ({statsData.mainShift.count}회)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>



      {/* Main Content Layout: Shift Type breakdown */}
      <div style={{ 
        backgroundColor: '#ffffff', 
        borderRadius: '16px', 
        padding: '24px', 
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 20px 0' }}>
          <PieChart size={18} color="var(--primary)" />
          근무 종류별 상세 통계
        </h3>

        {statsData.shiftStats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            해당 기간에 등록된 근무 내역이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {statsData.shiftStats.map((stat, idx) => (
              <div key={stat.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                
                {/* Text Labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Badge Number */}
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      color: '#ffffff', 
                      backgroundColor: stat.color,
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {idx + 1}
                    </span>
                    {/* Shift Label */}
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {stat.label}
                    </span>
                    {/* Time Window */}
                    {stat.start !== '-' && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                        {stat.start} ~ {stat.end}
                      </span>
                    )}
                  </div>

                  {/* Count and Hours */}
                  <div style={{ fontSize: '14px', fontWeight: '700' }}>
                    <span style={{ color: 'var(--text-main)' }}>{stat.count}일 </span>
                    <span style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: '700', marginLeft: '4px' }}>
                      ({stat.hours}시간{stat.overtimeHours > 0 && ` / 초과 ${stat.overtimeHours}시간`})
                    </span>
                  </div>
                </div>

                {/* Progress Bar Track */}
                <div style={{ 
                  width: '100%', 
                  height: '10px', 
                  backgroundColor: '#f1f5f9', 
                  borderRadius: '5px',
                  overflow: 'hidden'
                }}>
                  {/* Progress Bar Fill */}
                  <div style={{ 
                    width: `${stat.percentage}%`, 
                    height: '100%', 
                    backgroundColor: stat.color,
                    borderRadius: '5px',
                    transition: 'width 0.5s ease-out'
                  }} />
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* 주간별 근무 시간 통계 (근무별 세부 통계 포함) */}
      {viewScope === 'month' && (
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '16px', 
          padding: '24px', 
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Clock size={18} color="var(--primary)" />
              주간별 근무 시간 통계
            </h3>
          </div>

          {weeklyStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              주간 근무 내역이 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {weeklyStats.map((week, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: week.hours > 0 ? '#f8fafc' : '#ffffff',
                  border: week.hours > 0 ? '1px solid #e2e8f0' : '1px dashed #e2e8f0',
                  gap: '12px'
                }}>
                  {/* Top Row: 주차 범위 & 총 근무 시간 */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    {/* 주차 & 범위 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>
                        {week.label}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        ({week.rangeText})
                      </span>
                    </div>

                    {/* 총 근무 시간 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>총</span>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                          {week.hours}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          시간
                        </span>
                      </div>
                      {week.overtimeHours > 0 && (
                        <span style={{ fontSize: '11px', color: '#d97706', fontWeight: '600', marginTop: '2px' }}>
                          (초과근무 {week.overtimeHours}시간 포함)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: 근무 형태별 상세 정보 */}
                  {week.hours > 0 && week.breakdown && week.breakdown.length > 0 ? (
                    <div style={{ 
                      display: 'flex', 
                      gap: '6px', 
                      flexWrap: 'wrap', 
                      borderTop: '1px solid #f1f5f9', 
                      paddingTop: '10px',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginRight: '4px' }}>
                        근무 형태별:
                      </span>
                      {week.breakdown.map((b, bIdx) => (
                        <span 
                          key={bIdx}
                          style={{ 
                            fontSize: '11px', 
                            color: b.color,
                            backgroundColor: b.color + '12',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: b.color }} />
                          {b.label}: {b.hours}시간 ({b.days}일{b.overtimeHours > 0 && `, 초과 ${b.overtimeHours}시간`})
                        </span>
                      ))}
                    </div>
                  ) : (
                    week.hours > 0 && (
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        근무 상세 정보가 없습니다.
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
