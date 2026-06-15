import React from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Bell, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  UserPlus 
} from 'lucide-react';

export default function SidebarLeft({ 
  currentTab, 
  setCurrentTab, 
  sharedUsers, 
  onInviteFriend,
  isPrivateMode 
}) {
  const menuItems = [
    { id: 'calendar', label: '캘린더', icon: CalendarIcon },
    { id: 'schedule', label: '스케줄', icon: Clock },
    { id: 'alarm', label: '알림', icon: Bell },
    { id: 'shared', label: '공유 캘린더', icon: Users },
    { id: 'records', label: '기록', icon: FileText },
    { id: 'stats', label: '통계', icon: BarChart3 },
    { id: 'settings', label: '설정', icon: Settings },
  ];

  return (
    <aside className="sidebar-left">
      {/* User Profile */}
      <div className="profile-card">
        <img 
          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=120&auto=format&fit=crop" 
          alt="김소현 간호사" 
          className="profile-avatar" 
        />
        <div className="profile-info">
          <span className="profile-name">김소현</span>
          <span className="profile-role">간호사</span>
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

        <div className="sharing-title">캘린더 공유 중</div>
        <div className="shared-user-avatars" style={{ paddingLeft: '8px' }}>
          {sharedUsers.filter(u => u.isSharing).map((user, idx) => (
            <div 
              key={user.id} 
              className="avatar-overlap"
              title={`${user.name} (${user.relation}) - ${user.privilege}`}
              style={{ 
                zIndex: 10 - idx,
                borderColor: isPrivateMode ? '#cbd5e1' : '#10b981',
                boxShadow: isPrivateMode ? 'none' : '0 0 4px rgba(16, 185, 129, 0.4)'
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
          ))}
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
