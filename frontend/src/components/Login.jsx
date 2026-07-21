import React from 'react';
import { Calendar, Clock, Users, BarChart3 } from 'lucide-react';

export default function Login() {
  const handleKakaoLogin = () => {
    const restApiKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
    // Redirect back to the root page, which will detect '?code=...'
    const redirectUri = window.location.origin + '/';
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${restApiKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=profile_nickname,profile_image`;
    window.location.href = kakaoAuthUrl;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at 10% 20%, rgba(94, 95, 240, 0.1) 0%, rgba(167, 139, 250, 0.1) 90.2%), #f4f7fc',
      fontFamily: 'var(--font-primary)',
      padding: '20px',
      boxSizing: 'border-box',
      overflowY: 'auto'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 30px',
        boxShadow: '0 20px 40px rgba(94, 95, 240, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
        boxSizing: 'border-box'
      }}>
        {/* Brand/Logo Header */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '800',
            margin: '0 0 8px 0',
            letterSpacing: '-1px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            wePlan
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-muted)',
            margin: '0',
            fontWeight: '500'
          }}>
            간편하고 스마트한 근무 및 일정 관리
          </p>
        </div>

        {/* Feature List */}
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          background: 'rgba(255, 255, 255, 0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxSizing: 'border-box',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{
              background: '#e6f7ed',
              color: '#16a34a',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex'
            }}>
              <Clock size={20} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>근무 배정 및 기록</h4>
              <p style={{ margin: '0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>내 근무 형태를 간편하게 캘린더에 저장하고 확인하세요.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{
              background: '#eff6ff',
              color: '#1d4ed8',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex'
            }}>
              <Calendar size={20} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>스마트 일정 관리</h4>
              <p style={{ margin: '0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>공휴일, 음력 기념일, 할 일(Todo)까지 종합 관리합니다.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{
              background: '#f3f0ff',
              color: '#7c3aed',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex'
            }}>
              <Users size={20} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>실시간 일정 공유</h4>
              <p style={{ margin: '0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>가족, 연인, 친구들과 서로 일정을 공유하며 협업할 수 있습니다.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{
              background: '#fff3e6',
              color: '#ea580c',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex'
            }}>
              <BarChart3 size={20} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>통계 리포트</h4>
              <p style={{ margin: '0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>월별 근무 현황과 통계를 분석하여 보여줍니다.</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleKakaoLogin}
            style={{
              width: '100%',
              height: '50px',
              backgroundColor: '#FEE500',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(254, 229, 0, 0.25)',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(254, 229, 0, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(254, 229, 0, 0.25)';
            }}
          >
            {/* Kakao Symbol SVG */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000" style={{ opacity: 0.85 }}>
              <path d="M12 3c-4.97 0-9 3.185-9 7.116 0 2.502 1.664 4.7 4.234 5.922-.167.608-.6 2.184-.688 2.508-.108.406.138.4.29.3.118-.08.1.01.1-.01.196-.134 3.182-2.158 3.612-2.45.474.066.96.102 1.452.102 4.97 0 9-3.185 9-7.116S16.97 3 12 3z"/>
            </svg>
            <span style={{
              color: '#000000',
              fontSize: '15px',
              fontWeight: '600',
              opacity: 0.85
            }}>
              카카오 1초 로그인
            </span>
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Kakao 계정으로 빠르고 안전하게 가입 및 로그인이 가능합니다.
          </span>
        </div>
      </div>
    </div>
  );
}
