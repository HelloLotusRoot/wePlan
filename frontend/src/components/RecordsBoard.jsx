import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Cake, 
  BookOpen, 
  Smile, 
  Check, 
  X,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function RecordsBoard({ 
  events, 
  onAddBirthday, 
  onDeleteEvent 
}) {
  const [activeTab, setActiveTab] = useState('memos'); // 'memos' | 'birthdays'
  const [memos, setMemos] = useState([]);
  
  // Memo Form States
  const [memoDate, setMemoDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [memoTitle, setMemoTitle] = useState('');
  const [memoCategory, setMemoCategory] = useState('일반 메모');
  const [memoEmoji, setMemoEmoji] = useState('📝');
  const [memoContent, setMemoContent] = useState('');
  const [editingMemoId, setEditingMemoId] = useState(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('전체');

  // Birthday Form States (from SettingsPanels.jsx)
  const [bdayName, setBdayName] = useState('');
  const [bdayDate, setBdayDate] = useState('2024-01-01');
  const [bdayIsLunar, setBdayIsLunar] = useState(false);
  const [bdayAlarmOnDay, setBdayAlarmOnDay] = useState(true);
  const [bdayAlarmWeekBefore, setBdayAlarmWeekBefore] = useState(false);
  const [bdaySearchQuery, setBdaySearchQuery] = useState('');

  // Categories and Emojis
  const categories = ['일반 메모', '근무 일지', '건강', '쇼핑', '아이디어', '기타'];
  const emojis = ['📝', '💼', '🏃', '🏥', '🛒', '💡', '🌟', '🍽️', '✈️', '❤️'];

  // Load memos on mount
  useEffect(() => {
    const saved = localStorage.getItem('weplan_memos');
    if (saved) {
      try {
        setMemos(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse memos', e);
      }
    }
  }, []);

  // Save memos
  const saveMemos = (updatedMemos) => {
    setMemos(updatedMemos);
    localStorage.setItem('weplan_memos', JSON.stringify(updatedMemos));
  };

  // Add or Edit Memo
  const handleMemoSubmit = (e) => {
    e.preventDefault();
    if (!memoTitle.trim() || !memoContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    if (editingMemoId) {
      // Edit
      const updated = memos.map(memo => {
        if (memo.id === editingMemoId) {
          return {
            ...memo,
            date: memoDate,
            title: memoTitle,
            category: memoCategory,
            emoji: memoEmoji,
            content: memoContent
          };
        }
        return memo;
      });
      saveMemos(updated);
      setEditingMemoId(null);
      alert('기록이 수정되었습니다.');
    } else {
      // Add new
      const newMemo = {
        id: Date.now().toString(),
        date: memoDate,
        title: memoTitle,
        category: memoCategory,
        emoji: memoEmoji,
        content: memoContent,
        createdAt: new Date().toISOString()
      };
      saveMemos([newMemo, ...memos]);
      alert('새로운 기록이 등록되었습니다.');
    }

    // Reset Form
    setMemoTitle('');
    setMemoContent('');
    setMemoEmoji('📝');
    setMemoCategory('일반 메모');
    setMemoDate(new Date().toISOString().split('T')[0]);
  };

  // Delete Memo
  const handleMemoDelete = (id) => {
    if (window.confirm('이 기록을 삭제하시겠습니까?')) {
      const filtered = memos.filter(memo => memo.id !== id);
      saveMemos(filtered);
    }
  };

  // Set up Editing
  const startEditing = (memo) => {
    setEditingMemoId(memo.id);
    setMemoDate(memo.date);
    setMemoTitle(memo.title);
    setMemoCategory(memo.category);
    setMemoEmoji(memo.emoji);
    setMemoContent(memo.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel Editing
  const cancelEditing = () => {
    setEditingMemoId(null);
    setMemoTitle('');
    setMemoContent('');
    setMemoEmoji('📝');
    setMemoCategory('일반 메모');
    setMemoDate(new Date().toISOString().split('T')[0]);
  };

  // Add Birthday
  const handleBirthdaySubmit = (e) => {
    e.preventDefault();
    if (!bdayName.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    onAddBirthday({
      name: bdayName,
      date: bdayDate,
      isLunar: bdayIsLunar,
      alarmOnDay: bdayAlarmOnDay,
      alarmWeekBefore: bdayAlarmWeekBefore
    });

    setBdayName('');
    alert(`${bdayName}님의 생일이 등록되었습니다.`);
  };

  // Filter Memos
  const filteredMemos = memos.filter(memo => {
    const matchesSearch = 
      memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memo.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategoryFilter === '전체' || memo.category === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Get Birthday Events from App.jsx state
  const birthdayEvents = (events || []).filter(evt => evt.type === 'birthday');

  // Filter Birthdays
  const filteredBirthdays = birthdayEvents.filter(bday => 
    bday.name.toLowerCase().includes(bdaySearchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '0 20px 40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Board Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <BookOpen size={24} color="var(--primary)" />
          기록게시판
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          하루의 근무 소회, 개인 메모를 작성하고 등록된 기념일(생일) 목록을 한눈에 관리하세요.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('memos')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '700',
            backgroundColor: activeTab === 'memos' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'memos' ? '#ffffff' : 'var(--text-muted)',
            transition: 'all 0.2s ease'
          }}
        >
          <FileText size={16} />
          일지 & 메모
        </button>
        <button
          onClick={() => setActiveTab('birthdays')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '700',
            backgroundColor: activeTab === 'birthdays' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'birthdays' ? '#ffffff' : 'var(--text-muted)',
            transition: 'all 0.2s ease'
          }}
        >
          <Cake size={16} />
          생일 & 기념일
        </button>
      </div>

      {/* Tab Contents: Memos */}
      {activeTab === 'memos' && (
        <div className="records-grid-layout" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Memo Creator Form */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {editingMemoId ? <Edit size={16} color="var(--primary)" /> : <Plus size={16} color="var(--primary)" />}
              {editingMemoId ? '기록 수정하기' : '새로운 하루 기록하기'}
            </h3>
            
            <form onSubmit={handleMemoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Date Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>날짜</label>
                <input 
                  type="date" 
                  value={memoDate}
                  onChange={(e) => setMemoDate(e.target.value)}
                  className="input-text"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Title Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>제목</label>
                <input 
                  type="text" 
                  value={memoTitle}
                  onChange={(e) => setMemoTitle(e.target.value)}
                  placeholder="예: 오늘 야간 근무 소회"
                  className="input-text"
                  style={{ width: '100%' }}
                  maxLength={50}
                />
              </div>

              {/* Category Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>카테고리</label>
                <select
                  value={memoCategory}
                  onChange={(e) => setMemoCategory(e.target.value)}
                  className="input-select"
                  style={{ width: '100%' }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Emoji Picker Row */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>대표 아이콘 (이모지)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {emojis.map(emo => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => setMemoEmoji(emo)}
                      style={{
                        fontSize: '18px',
                        padding: '6px',
                        border: memoEmoji === emo ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        borderRadius: '6px',
                        backgroundColor: memoEmoji === emo ? 'var(--primary-light)' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '34px',
                        height: '34px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Textarea */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>기록 내용</label>
                <textarea
                  value={memoContent}
                  onChange={(e) => setMemoContent(e.target.value)}
                  placeholder="오늘의 업무 에피소드나 생각을 편하게 기록해보세요..."
                  className="input-text"
                  style={{ width: '100%', height: '140px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
                  maxLength={1000}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                {editingMemoId && (
                  <button 
                    type="button" 
                    onClick={cancelEditing}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#ffffff', color: 'var(--text-main)', fontSize: '13px', fontWeight: '600' }}
                  >
                    <X size={14} />
                    취소
                  </button>
                )}
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}
                >
                  <Check size={14} />
                  {editingMemoId ? '수정완료' : '기록하기'}
                </button>
              </div>
            </form>
          </div>

          {/* Memos List & Filtering */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              
              {/* Search Input */}
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="기록한 내용이나 제목으로 검색해보세요..."
                  className="input-text"
                  style={{ width: '100%', paddingLeft: '36px' }}
                />
              </div>

              {/* Category Filter Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginRight: '6px' }}>카테고리:</span>
                {['전체', ...categories].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: '1px solid',
                      borderColor: selectedCategoryFilter === cat ? 'var(--primary)' : 'var(--border-color)',
                      backgroundColor: selectedCategoryFilter === cat ? 'var(--primary-light)' : '#ffffff',
                      color: selectedCategoryFilter === cat ? 'var(--primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Memos Render */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredMemos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
                  <AlertCircle size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>등록된 일지나 기록이 없습니다.</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', opacity: 0.7 }}>왼쪽 폼에서 첫 일지를 기록해 보세요!</p>
                </div>
              ) : (
                filteredMemos.map(memo => (
                  <div 
                    key={memo.id}
                    className="memo-card-hover"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      padding: '18px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                  >
                    {/* Header info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{memo.emoji}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                            {memo.title}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Calendar size={11} />
                              {memo.date}
                            </span>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: '700',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: memo.category === '근무 일지' ? '#e0f2fe' : '#f1f5f9',
                              color: memo.category === '근무 일지' ? '#0369a1' : 'var(--text-muted)'
                            }}>
                              {memo.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Edit/Delete Actions */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => startEditing(memo)}
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="수정"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleMemoDelete(memo.id)}
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Content body */}
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--text-main)',
                      lineHeight: '1.6',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      backgroundColor: '#f8fafc',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #f1f5f9'
                    }}>
                      {memo.content}
                    </p>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>
      )}

      {/* Tab Contents: Birthdays */}
      {activeTab === 'birthdays' && (
        <div className="records-grid-layout" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Birthday Creator Form */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} color="var(--primary)" />
              새로운 생일 등록하기
            </h3>

            <form onSubmit={handleBirthdaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Name Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>이름</label>
                <input 
                  type="text" 
                  value={bdayName}
                  onChange={(e) => setBdayName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="input-text"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Date Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>생년월일 (날짜)</label>
                <input 
                  type="date" 
                  value={bdayDate}
                  onChange={(e) => setBdayDate(e.target.value)}
                  className="input-text"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Lunar/Solar Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="bdayIsLunar"
                  checked={bdayIsLunar}
                  onChange={(e) => setBdayIsLunar(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="bdayIsLunar" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer' }}>
                  음력 생일로 등록
                </label>
              </div>

              {/* Alarm Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>알림 시간 설정</label>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="bdayAlarmOnDay"
                    checked={bdayAlarmOnDay}
                    onChange={(e) => setBdayAlarmOnDay(e.target.checked)}
                    style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                  />
                  <label htmlFor="bdayAlarmOnDay" style={{ fontSize: '12px', color: 'var(--text-main)', cursor: 'pointer' }}>
                    당일 오전 9시 알림
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="bdayAlarmWeekBefore"
                    checked={bdayAlarmWeekBefore}
                    onChange={(e) => setBdayAlarmWeekBefore(e.target.checked)}
                    style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                  />
                  <label htmlFor="bdayAlarmWeekBefore" style={{ fontSize: '12px', color: 'var(--text-main)', cursor: 'pointer' }}>
                    일주일 전 오전 9시 알림
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', marginTop: '4px' }}
              >
                <Cake size={14} />
                생일 등록하기
              </button>
            </form>
          </div>

          {/* Birthday List & Search */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Search Bar */}
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={bdaySearchQuery}
                  onChange={(e) => setBdaySearchQuery(e.target.value)}
                  placeholder="이름으로 등록된 생일을 검색해보세요..."
                  className="input-text"
                  style={{ width: '100%', paddingLeft: '36px' }}
                />
              </div>
            </div>

            {/* Birthday Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
              {filteredBirthdays.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}>
                  <AlertCircle size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>등록된 생일 정보가 없습니다.</p>
                </div>
              ) : (
                filteredBirthdays.map(bday => {
                  const parts = bday.date.split('-');
                  const formattedDate = parts.length === 3 ? `${parseInt(parts[1], 10)}월 ${parseInt(parts[2], 10)}일` : bday.date;

                  return (
                    <div
                      key={bday.id}
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        position: 'relative'
                      }}
                    >
                      {/* Trash action */}
                      <button
                        onClick={() => onDeleteEvent(bday.id)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '12px',
                          padding: '6px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="생일 정보 삭제"
                      >
                        <Trash2 size={13} />
                      </button>

                      {/* Birthday Card content */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          backgroundColor: '#fce7f3',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px'
                        }}>
                          🎂
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                            {bday.name}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {formattedDate} 
                            <span style={{ 
                              fontSize: '10px', 
                              padding: '1px 5px', 
                              borderRadius: '3px', 
                              backgroundColor: bday.isLunar ? '#fae8ff' : '#eff6ff',
                              color: bday.isLunar ? '#a21caf' : '#1d4ed8',
                              fontWeight: '600'
                            }}>
                              {bday.isLunar ? '음력' : '양력'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Alarms row */}
                      <div style={{ 
                        borderTop: '1px solid var(--border-color)', 
                        paddingTop: '10px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '4px',
                        fontSize: '11px',
                        color: 'var(--text-muted)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: bday.alarmOnDay ? '#10b981' : '#94a3b8' }}>●</span>
                          당일 오전 9시 알림: {bday.alarmOnDay ? '켜짐' : '꺼짐'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: bday.alarmWeekBefore ? '#10b981' : '#94a3b8' }}>●</span>
                          일주일 전 알림: {bday.alarmWeekBefore ? '켜짐' : '꺼짐'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
