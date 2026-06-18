import React, { useState } from 'react';
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
  Check
} from 'lucide-react';

export default function SidebarLeft({ 
  currentTab, 
  setCurrentTab, 
  sharedUsers, 
  onInviteFriend,
  isPrivateMode,
  userName,
  setUserName,
  userJob,
  setUserJob,
  calendarPerspective,
  setCalendarPerspective
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localName, setLocalName] = useState(userName);
  const [localJob, setLocalJob] = useState(userJob);

  const handleSaveProfile = () => {
    setUserName(localName);
    setUserJob(localJob);
    setIsEditing(false);
  };

  const menuItems = [
    { id: 'calendar', label: '캘린더', icon: CalendarIcon },
    { id: 'schedule', label: '스케줄', icon: Clock },
    { id: 'alarm', label: '알림', icon: Bell },
    { id: 'shared', label: '일정 공유', icon: Users },
    { id: 'records', label: '기록', icon: FileText },
    { id: 'stats', label: '통계', icon: BarChart3 },
    { id: 'settings', label: '설정', icon: Settings },
  ];

  return (
    <aside className="sidebar-left">
      {/* User Profile */}
      <div className="profile-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', padding: '12px 4px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
          <img 
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=120&auto=format&fit=crop" 
            alt={userName} 
            className="profile-avatar" 
          />
          {!isEditing ? (
            <div className="profile-info" style={{ flex: 1 }}>
              <span className="profile-name" style={{ display: 'block', fontSize: '15px', fontWeight: '600' }}>{userName}</span>
              <span className="profile-role" style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>{userJob}</span>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <input 
                type="text" 
                className="input-text" 
                style={{ padding: '2px 6px', fontSize: '12px', width: '100%', height: '22px' }}
                value={localName} 
                onChange={(e) => setLocalName(e.target.value)} 
                placeholder="이름"
              />
              <input 
                type="text" 
                className="input-text" 
                style={{ padding: '2px 6px', fontSize: '11px', width: '100%', height: '22px' }}
                value={localJob} 
                onChange={(e) => setLocalJob(e.target.value)} 
                placeholder="직종"
              />
            </div>
          )}
          
          <button 
            onClick={() => {
              if (isEditing) {
                handleSaveProfile();
              } else {
                setIsEditing(true);
              }
            }}
            className="nav-btn"
            style={{ padding: '4px', alignSelf: 'center' }}
            title={isEditing ? "프로필 저장" : "프로필 수정"}
          >
            {isEditing ? <Check size={14} color="#10b981" /> : <Edit size={14} />}
          </button>
        </div>
      </div>


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
            marginBottom: '16px', 
            border: '1px dashed var(--primary)', 
            justifyContent: 'center',
            color: 'var(--primary)',
            backgroundColor: 'var(--primary-light)'
          }}
        >
          <UserPlus size={16} />
          <span>+ 친구 초대하기</span>
        </button>

        <div className="sharing-title">일정 공유 친구</div>
        <div className="shared-user-avatars" style={{ paddingLeft: '8px' }}>
          {sharedUsers.filter(u => u.isSharing).map((user, idx) => {
            const isActivePerspective = calendarPerspective === user.id;
            return (
              <div 
                key={user.id} 
                className="avatar-overlap"
                onClick={() => setCalendarPerspective(isActivePerspective ? 'me' : user.id)}
                title={`${user.name} (${user.relation}) - ${user.privilege} (클릭 시 이 친구에게 공유된 내 일정 확인)`}
                style={{ 
                  zIndex: 10 - idx,
                  borderColor: isActivePerspective ? '#10b981' : (isPrivateMode ? '#cbd5e1' : '#e2e8f0'),
                  boxShadow: isActivePerspective ? '0 0 8px #10b981' : (isPrivateMode ? 'none' : '0 0 4px rgba(16, 185, 129, 0.4)'),
                  transform: isActivePerspective ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              >
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                ) : (
                  user.name.substring(0, 2)
                )}
              </div>
            );
          })}
          {isPrivateMode && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '12px' }}>
              나만 보기 활성
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
