import React, { useState } from 'react';
import CalendarGrid from './CalendarGrid';
import { 
  Users, 
  UserPlus, 
  Search, 
  Eye, 
  Trash2, 
  Calendar, 
  Sparkles, 
  Check, 
  Plus, 
  Heart, 
  Briefcase, 
  Home, 
  UserCheck, 
  UserX,
  Share2,
  Lock,
  Sliders,
  ChevronRight,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';

export default function FriendsBoard({
  sharedUsers,
  setSharedUsers,
  relationGroups,
  setRelationGroups,
  calendarPerspective,
  setCalendarPerspective,
  setCurrentTab,
  isPrivateMode,
  setIsPrivateMode,
  events = [],
  currentDate,
  setCurrentDate,
  shifts,
  settings,
  viewMode,
  setViewMode,
  workViewMode,
  aptViewMode,
  holidaysMap,
  primaryShiftMap,
  onSelectDay,
  selectedDay,
  onAddEventClick,
  onEditEvent
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [previewModalUser, setPreviewModalUser] = useState(null);
  const [selectedFriendProfile, setSelectedFriendProfile] = useState(null);

  // Add friend form state
  const [name, setName] = useState('');
  const [relation, setRelation] = useState(relationGroups[0] || '친구');
  const [privilege, setPrivilege] = useState('보기 가능');
  const [avatar, setAvatar] = useState('');

  // Add group form state
  const [newGroupName, setNewGroupName] = useState('');

  // Filtered friends
  const filteredUsers = (sharedUsers || []).filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || 
      user.relation.replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, '').trim() === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const activeSharingCount = (sharedUsers || []).filter(u => u.isSharing).length;

  const handleAddFriendSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('친구 이름을 입력해 주세요.');
      return;
    }
    const newFriend = {
      id: Date.now().toString(),
      name: name.trim(),
      relation: relation,
      avatar: avatar.trim(),
      privilege: privilege,
      isSharing: true
    };
    setSharedUsers([...sharedUsers, newFriend]);
    setName('');
    setAvatar('');
    setShowAddModal(false);
  };

  const handleToggleSharing = (userId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSharedUsers(prev => prev.map(u => u.id === userId ? { ...u, isSharing: !u.isSharing } : u));
  };

  const handleChangeRelation = (userId, newRelation, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSharedUsers(prev => prev.map(u => u.id === userId ? { ...u, relation: newRelation } : u));
  };

  const handleChangePrivilege = (userId, newPriv, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSharedUsers(prev => prev.map(u => u.id === userId ? { ...u, privilege: newPriv } : u));
  };

  const handleDeleteFriend = (userId, friendName, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (window.confirm(`"${friendName}"님을 친구 목록에서 삭제하시겠습니까?`)) {
      setSharedUsers(prev => prev.filter(u => u.id !== userId));
      if (calendarPerspective === userId) {
        setCalendarPerspective('me');
      }
    }
  };

  const handleAddGroupSubmit = (e) => {
    e.preventDefault();
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    if (relationGroups.includes(trimmed)) {
      alert('이미 존재하는 그룹 이름입니다.');
      return;
    }
    setRelationGroups([...relationGroups, trimmed]);
    setNewGroupName('');
    setShowGroupModal(false);
  };

  const handleDeleteGroup = (groupName) => {
    if (relationGroups.length <= 1) {
      alert('최소 한 개의 관계 그룹은 필요합니다.');
      return;
    }
    if (window.confirm(`"${groupName}" 그룹을 삭제하시겠습니까?`)) {
      setRelationGroups(relationGroups.filter(g => g !== groupName));
      if (selectedGroup === groupName) setSelectedGroup('all');
    }
  };

  const getRelationTheme = (rel) => {
    const clean = rel.replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, '').trim();
    if (clean === '연인') return { bg: '#fff1f2', color: '#e11d48', border: '#fecdd3', accent: '#f43f5e', icon: Heart };
    if (clean === '가족') return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', accent: '#3b82f6', icon: Home };
    if (clean === '동료' || clean === '직장') return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', accent: '#10b981', icon: Briefcase };
    return { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe', accent: '#8b5cf6', icon: Users };
  };

  const getSharedEventsCount = (userId) => {
    return (events || []).filter(evt => {
      if (evt.shareScope === 'public') return true;
      if (evt.sharedWith && evt.sharedWith.includes(userId)) return true;
      return false;
    }).length;
  };

  const getFriendPerspectiveEvents = (friendId) => {
    if (isPrivateMode) return [];
    return (events || []).filter(evt => {
      if (evt.isPrivate) return false;
      const scope = evt.shareScope || (evt.isPrivate ? 'private' : 'public');
      if (scope === 'private') return false;
      if (scope === 'public') return true;
      if (scope === 'custom') {
        return evt.sharedWith && Array.isArray(evt.sharedWith) && evt.sharedWith.includes(friendId);
      }
      return true;
    });
  };

  const handleTogglePerspectiveForUser = (userId) => {
    if (calendarPerspective === userId) {
      setCalendarPerspective('me');
    } else {
      const friend = (sharedUsers || []).find(u => u.id === userId);
      if (friend) {
        setPreviewModalUser(friend);
      }
    }
  };

  const activePerspectiveUser = (sharedUsers || []).find(u => u.id === calendarPerspective);

  return (
    <div className="friends-board" style={{
      width: '100%',
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px 32px 60px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      fontFamily: 'var(--font-primary)'
    }}>

      {/* 1. Sleek Header Banner */}
      <div className="friends-header-card" style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '28px 32px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 18px rgba(99, 102, 241, 0.3)'
          }}>
            <Users size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
              친구 목록 & 일정 공유
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-muted)', fontWeight: '500' }}>
              각 친구 카드의 시점 보기 버튼으로 그 친구에게 공유된 내 일정을 확인해 보세요.
            </p>
          </div>
        </div>

        <div className="friends-header-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowGroupModal(true)}
            style={{
              padding: '10px 18px',
              borderRadius: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontWeight: '700',
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <Sliders size={16} color="var(--primary)" />
            <span>그룹 설정</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <UserPlus size={17} />
            <span>새 친구 등록</span>
          </button>
        </div>
      </div>

      {/* 3. Search and Category Filter Bar */}
      <div className="friends-filter-bar" style={{
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        padding: '14px 20px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        {/* Relation Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedGroup('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: selectedGroup === 'all' ? 'none' : '1px solid var(--border-color)',
              backgroundColor: selectedGroup === 'all' ? '#4f46e5' : '#f8fafc',
              color: selectedGroup === 'all' ? '#ffffff' : 'var(--text-main)',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            전체 ({(sharedUsers || []).length})
          </button>
          {relationGroups.map(group => {
            const count = (sharedUsers || []).filter(u => u.relation.replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ]/g, '').trim() === group).length;
            const isSelected = selectedGroup === group;
            return (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: isSelected ? 'none' : '1px solid var(--border-color)',
                  backgroundColor: isSelected ? '#4f46e5' : '#f8fafc',
                  color: isSelected ? '#ffffff' : 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {group} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="friends-search" style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="친구 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              fontSize: '13px',
              outline: 'none',
              backgroundColor: '#f8fafc'
            }}
          />
        </div>
      </div>

      {/* 4. COMPACT MINI-CARD DESIGN */}
      {filteredUsers.length === 0 ? (
        <div className="friends-card-grid" style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '40px 20px',
          textAlign: 'center',
          border: '1px solid var(--border-color)',
          color: 'var(--text-muted)'
        }}>
          <UserX size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>
            등록된 친구가 없습니다.
          </h3>
          <p style={{ fontSize: '12.5px', margin: 0 }}>
            '+ 새 친구 등록' 버튼을 눌러 친구를 추가해 보세요!
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px'
        }}>
          {filteredUsers.map(user => {
            const theme = getRelationTheme(user.relation);
            const RelationIcon = theme.icon;
            const sharedCount = getSharedEventsCount(user.id);
            const isPerspectiveActive = calendarPerspective === user.id;

            return (
              <div
                key={user.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  border: isPerspectiveActive ? '2px solid #10b981' : '1px solid var(--border-color)',
                  boxShadow: isPerspectiveActive 
                    ? '0 6px 16px rgba(16, 185, 129, 0.15)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Compact Header: Avatar + Info */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div 
                    onClick={() => setSelectedFriendProfile(user)}
                    title={`${user.name}님 프로필 보기`}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, cursor: 'pointer' }}
                  >
                    {/* Compact Avatar with Status Dot */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        backgroundColor: '#e0e7ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        fontSize: '13.5px',
                        color: '#4f46e5',
                        border: '1.5px solid #ffffff',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)'
                      }}>
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          user.name.substring(0, 2)
                        )}
                      </div>

                      <div style={{
                        position: 'absolute',
                        bottom: '0px',
                        right: '0px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: user.isSharing ? '#10b981' : '#cbd5e1',
                        border: '1.5px solid #ffffff'
                      }} title={user.isSharing ? '공유 ON' : '공유 OFF'} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', truncate: true }}>
                          {user.name}
                        </span>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '700',
                          backgroundColor: theme.bg,
                          color: theme.color,
                          border: `1px solid ${theme.border}`,
                          padding: '1px 6px',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          whiteSpace: 'nowrap'
                        }}>
                          <RelationIcon size={10} />
                          {user.relation}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                        일정 {sharedCount}개 공유
                      </div>
                    </div>
                  </div>

                  {/* Active Badge if Perspective active */}
                  {isPerspectiveActive && (
                    <span style={{
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      whiteSpace: 'nowrap'
                    }}>
                      <Sparkles size={11} />
                      시점 적용중
                    </span>
                  )}
                </div>

                {/* Compact Perspective Action Button */}
                <button
                  onClick={() => handleTogglePerspectiveForUser(user.id)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: isPerspectiveActive ? 'none' : '1px solid #c7d2fe',
                    backgroundColor: isPerspectiveActive ? '#10b981' : '#f0f5ff',
                    color: isPerspectiveActive ? '#ffffff' : '#4338ca',
                    fontWeight: '700',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isPerspectiveActive ? (
                    <>
                      <Check size={14} />
                      <span>내 캘린더 시점으로 복귀</span>
                    </>
                  ) : (
                    <>
                      <Calendar size={14} color="#4338ca" />
                      <span>{user.name}님 시점으로 내 일정 보기</span>
                    </>
                  )}
                </button>

                {/* Bottom Compact Settings Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px dashed #f1f5f9',
                  fontSize: '11.5px'
                }}>
                  {/* Share Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>공유</span>
                    <button
                      onClick={(e) => handleToggleSharing(user.id, e)}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: user.isSharing ? '#dcfce7' : '#f1f5f9',
                        color: user.isSharing ? '#15803d' : '#64748b',
                        fontWeight: '700',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      {user.isSharing ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Friend Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                  <UserPlus size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>새 친구 등록</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFriendSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  친구 이름 *
                </label>
                <input
                  type="text"
                  placeholder="예: 김민지, 엄마, 홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  관계 그룹 *
                </label>
                <select
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  {relationGroups.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  기본 공유 권한
                </label>
                <select
                  value={privilege}
                  onChange={(e) => setPrivilege(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="보기 가능">보기 전용</option>
                  <option value="편집 가능">편집 가능</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
                  프로필 이미지 URL (선택)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-muted)',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  친구 추가하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Relation Group Modal */}
      {showGroupModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
                관계 그룹 관리
              </h3>
              <button
                onClick={() => setShowGroupModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddGroupSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="새 그룹 이름 (예: 동창, 스터디)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                추가
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
              {relationGroups.map(g => (
                <div
                  key={g}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>{g}</span>
                  <button
                    onClick={() => handleDeleteGroup(g)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    title="그룹 삭제"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowGroupModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                backgroundColor: '#ffffff',
                color: 'var(--text-main)',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 5. Perspective Schedule Preview Modal Popup (REAL CALENDAR GRID) */}
      {previewModalUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '12px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            maxWidth: '1280px',
            width: '96vw',
            height: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '10px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: '#e0e7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  color: '#4f46e5',
                  fontSize: '14px',
                  border: '2px solid #ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                }}>
                  {previewModalUser.avatar ? (
                    <img src={previewModalUser.avatar} alt={previewModalUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    previewModalUser.name.substring(0, 2)
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-main)' }}>
                    👁️ {previewModalUser.name}님 시점 캘린더
                  </h3>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    setCalendarPerspective(previewModalUser.id);
                    setCurrentTab('calendar');
                    setPreviewModalUser(null);
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#4f46e5',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Calendar size={13} />
                  <span>캘린더 탭으로 이동</span>
                </button>

                <button
                  onClick={() => setPreviewModalUser(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '22px', padding: '0 4px' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body - REAL CALENDAR GRID */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>
              <CalendarGrid 
                currentDate={currentDate || new Date()}
                setCurrentDate={setCurrentDate}
                events={events}
                shifts={shifts}
                settings={settings}
                viewMode={viewMode || 'month'}
                setViewMode={setViewMode}
                workViewMode={workViewMode}
                aptViewMode={aptViewMode}
                isPrivateMode={isPrivateMode}
                holidaysMap={holidaysMap}
                calendarPerspective={previewModalUser.id}
                setCalendarPerspective={setCalendarPerspective}
                sharedUsers={sharedUsers}
                isReadOnlyPerspective={true}
                onSelectDay={onSelectDay}
                selectedDay={selectedDay}
                onAddEventClick={onAddEventClick}
                onEditEvent={onEditEvent}
                primaryShiftMap={primaryShiftMap}
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. Friend Profile & Settings Modal (with Delete Button at Very Bottom) */}
      {selectedFriendProfile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            maxWidth: '440px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Header with Avatar & Name */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: '#e0e7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  color: '#4f46e5',
                  fontSize: '18px',
                  border: '2px solid #ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {selectedFriendProfile.avatar ? (
                    <img src={selectedFriendProfile.avatar} alt={selectedFriendProfile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    selectedFriendProfile.name.substring(0, 2)
                  )}
                </div>

                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
                    {selectedFriendProfile.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    일정 {getSharedEventsCount(selectedFriendProfile.id)}개 공유 중
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedFriendProfile(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '20px' }}
              >
                ✕
              </button>
            </div>

            {/* Relationship Group Change */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '14px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>관계 그룹</span>
              <select
                value={selectedFriendProfile.relation}
                onChange={(e) => {
                  handleChangeRelation(selectedFriendProfile.id, e.target.value, e);
                  setSelectedFriendProfile(prev => prev ? { ...prev, relation: e.target.value } : null);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {relationGroups.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Share Toggle */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '14px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>일정 공유 상태</span>
              <button
                onClick={(e) => {
                  handleToggleSharing(selectedFriendProfile.id, e);
                  setSelectedFriendProfile(prev => prev ? { ...prev, isSharing: !prev.isSharing } : null);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: selectedFriendProfile.isSharing ? '#dcfce7' : '#f1f5f9',
                  color: selectedFriendProfile.isSharing ? '#15803d' : '#64748b',
                  fontWeight: '800',
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                {selectedFriendProfile.isSharing ? '공유 ON' : '공유 OFF'}
              </button>
            </div>

            {/* Very Bottom: Delete Friend Button */}
            <div style={{ paddingTop: '10px', borderTop: '1px dashed var(--border-color)', marginTop: '4px' }}>
              <button
                onClick={(e) => {
                  handleDeleteFriend(selectedFriendProfile.id, selectedFriendProfile.name, e);
                  setSelectedFriendProfile(null);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #fecdd3',
                  backgroundColor: '#fff1f2',
                  color: '#e11d48',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Trash2 size={16} />
                <span>친구 삭제</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
