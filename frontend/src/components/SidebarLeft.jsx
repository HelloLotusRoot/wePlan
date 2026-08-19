import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Bell, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  UserPlus,
  Edit,
  Camera,
  LogOut,
  X,
  ChevronLeft
} from 'lucide-react';

const DEFAULT_PROFILE_IMAGE = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=120&auto=format&fit=crop';

export default function SidebarLeft({ 
  currentTab, 
  setCurrentTab, 
  onInviteFriend,
  userName,
  setUserName,
  userJob,
  setUserJob,
  showLeftSidebar,
  setShowLeftSidebar,
  user,
  setUser,
  onLogout,
  onOpenAlarm
}) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [localName, setLocalName] = useState(userName);
  const [localProfileImage, setLocalProfileImage] = useState(user?.profileImage || DEFAULT_PROFILE_IMAGE);

  React.useEffect(() => {
    setLocalName(userName);
    setLocalProfileImage(user?.profileImage || DEFAULT_PROFILE_IMAGE);
  }, [userName, user?.profileImage]);

  const handleOpenProfile = () => {
    setLocalName(userName || user?.nickname || '사용자');
    setLocalProfileImage(user?.profileImage || DEFAULT_PROFILE_IMAGE);
    setShowProfileModal(true);
  };

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일을 선택해 주세요.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 320;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setLocalProfileImage(canvas.toDataURL('image/jpeg', 0.85));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    const nickname = localName.trim();
    if (!nickname) {
      alert('닉네임을 입력해 주세요.');
      return;
    }

    setUserName(nickname);
    const updatedUser = { ...(user || {}), nickname, profileImage: localProfileImage };
    if (setUser) setUser(updatedUser);
    localStorage.setItem('weplan_user', JSON.stringify(updatedUser));
    setShowProfileModal(false);
  };

  const menuItems = [
    { id: 'calendar', label: '캘린더', icon: CalendarIcon },
    { id: 'friends', label: '친구 목록', icon: Users },
    { id: 'records', label: '기록', icon: FileText },
    { id: 'stats', label: '통계', icon: BarChart3 },
    { id: 'schedule', label: '근무 배정', icon: Clock },
    { id: 'settings', label: '설정', icon: Settings },
  ];

  const displayUserName = userName || user?.nickname || '사용자';

  return (
    <aside className="sidebar-left">
      {/* User Profile */}
      <div className="profile-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', padding: '12px 4px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
          <img
            src={user?.profileImage || DEFAULT_PROFILE_IMAGE}
            alt={displayUserName}
            className="profile-avatar"
          />
          <div className="profile-info" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="profile-name" style={{ display: 'block', fontSize: '15px', fontWeight: '600' }}>{displayUserName}</span>
              {user && (
                <span style={{
                  fontSize: '10px',
                  backgroundColor: '#FEE500',
                  color: '#3c1e1e',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                  lineHeight: '1.4'
                }}>
                  카카오
                </span>
              )}
            </div>
          </div>
          
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleOpenProfile();
            }}
            className="nav-btn"
            style={{ padding: '4px', alignSelf: 'center' }}
            title="프로필 관리"
          >
            <Edit size={14} />
          </button>
        </div>
        <button
          type="button"
          onClick={onOpenAlarm}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '7px 10px',
            border: '1px solid var(--primary)',
            borderRadius: '7px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
          title="알림 설정 열기"
        >
          <Bell size={15} />
          <span>알림</span>
        </button>
      </div>

      {showProfileModal && createPortal((
        <div className="dialog-overlay profile-modal-overlay" onClick={() => setShowProfileModal(false)} role="dialog" aria-modal="true" aria-label="프로필 관리">
          <div
            className="dialog-content profile-modal-content"
            onClick={(event) => event.stopPropagation()}
            style={{ width: '400px', maxWidth: '95%', padding: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
                <Edit size={17} color="var(--primary)" />
                프로필 관리
              </div>
              <button type="button" onClick={() => setShowProfileModal(false)} title="프로필 창 닫기" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <img src={localProfileImage || DEFAULT_PROFILE_IMAGE} alt="프로필 미리보기" style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-light)' }} />
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 11px', border: '1px solid var(--border-color)', borderRadius: '7px', color: 'var(--primary)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', backgroundColor: 'var(--bg-card)' }}>
                <Camera size={14} />
                프로필 사진 변경
                <input type="file" accept="image/*" onChange={handleProfileImageChange} style={{ display: 'none' }} />
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>닉네임</span>
              <input
                type="text"
                className="input-text"
                value={localName}
                onChange={(event) => setLocalName(event.target.value)}
                placeholder="닉네임을 입력해 주세요"
                maxLength={20}
                style={{ width: '100%' }}
              />
            </label>

            <div style={{ display: 'flex', gap: '8px' }}>
              {user && (
                <button type="button" onClick={() => { setShowProfileModal(false); onLogout?.(); }} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '9px 12px', border: '1px solid #fecaca', borderRadius: '8px', backgroundColor: '#fff', color: '#ef4444', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  <LogOut size={14} />
                  로그아웃
                </button>
              )}
              <button type="button" onClick={handleSaveProfile} style={{ flex: 1, padding: '9px 12px', border: 'none', borderRadius: '8px', backgroundColor: 'var(--primary)', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                변경사항 저장
              </button>
            </div>
          </div>
        </div>
      ), document.body)}


      {/* Navigation Menu */}
      <ul className="menu-list">
        {menuItems.map(item => {
          const IconComponent = item.icon;
          const isActive = currentTab === item.id;
          return (
            <li key={item.id}>
              <button 
                onClick={() => setCurrentTab(item.id)}
                className={`menu-item ${isActive ? 'active' : ''}`}
                style={{ width: '100%', textAlign: 'left' }}
              >
                <IconComponent size={18} />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Friends Sync Section */}
      <div className="sharing-section">
        <button 
          onClick={onInviteFriend}
          className="menu-item"
          style={{ 
            width: '100%', 
            border: '1px dashed var(--primary)', 
            justifyContent: 'center',
            color: 'var(--primary)',
            backgroundColor: 'var(--primary-light)'
          }}
        >
          <UserPlus size={16} />
          <span>+ 친구 초대하기</span>
        </button>

      </div>


      {/* Collapse Sidebar Button at the bottom */}
      {setShowLeftSidebar && (
        <button
          type="button"
          onClick={() => setShowLeftSidebar(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px 12px',
            borderRadius: '8px',
            color: 'var(--text-muted)',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            marginTop: '12px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          title="메뉴 접기"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-app)';
            e.currentTarget.style.color = 'var(--primary)';
            e.currentTarget.style.borderColor = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-card)';
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          <ChevronLeft size={16} />
          <span>사이드바 접기</span>
        </button>
      )}
    </aside>
  );
}
