import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  BookOpen, 
  Check, 
  X,
  Calendar,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Square,
  CheckSquare,
  ListTodo
} from 'lucide-react';

export default function RecordsBoard({ 
  memos = [],
  setMemos,
  todos = [],
  setTodos
}) {
  // Memo Form States
  const [memoDate, setMemoDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [memoTitle, setMemoTitle] = useState('');
  const [memoContent, setMemoContent] = useState('');
  const [editingMemoId, setEditingMemoId] = useState(null);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');

  // Todo States
  const [todoText, setTodoText] = useState('');
  const [todoHasDate, setTodoHasDate] = useState(true);
  const [activeFormTab, setActiveFormTab] = useState('memo'); // 'memo' or 'todo'
  const [draftTodos, setDraftTodos] = useState([]);

  // Todo Handlers
  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!todoText.trim()) return;

    const newDraft = {
      id: 'draft-' + Date.now().toString(),
      text: todoText.trim(),
      completed: false,
      date: todoHasDate ? memoDate : '',
      createdAt: new Date().toISOString()
    };

    setDraftTodos([newDraft, ...draftTodos]);
    setTodoText('');
  };

  const handleDeleteDraft = (id) => {
    setDraftTodos(draftTodos.filter(item => item.id !== id));
  };

  const handleSaveDrafts = () => {
    if (draftTodos.length === 0) return;

    const cleanDrafts = draftTodos.map(todo => ({
      ...todo,
      id: todo.id.replace('draft-', '')
    }));

    setTodos([...cleanDrafts, ...todos]);
    setDraftTodos([]);
  };

  const handleToggleTodo = (id) => {
    const updated = todos.map(todo => {
      if (todo.id === id) {
        return { ...todo, completed: !todo.completed };
      }
      return todo;
    });
    setTodos(updated);
  };

  const handleDeleteTodo = (id) => {
    if (window.confirm('이 할 일을 삭제하시겠습니까?')) {
      const filtered = todos.filter(todo => todo.id !== id);
      setTodos(filtered);
    }
  };

  // Mini Calendar States
  const [calendarViewDate, setCalendarViewDate] = useState(() => {
    const d = new Date(memoDate);
    return isNaN(d.getTime()) ? new Date() : d;
  });

  // Sync calendar view month when memoDate changes
  useEffect(() => {
    const d = new Date(memoDate);
    if (!isNaN(d.getTime())) {
      if (d.getFullYear() !== calendarViewDate.getFullYear() || d.getMonth() !== calendarViewDate.getMonth()) {
        setCalendarViewDate(d);
      }
    }
  }, [memoDate]);

  // Mini Calendar Navigation
  const handlePrevMonth = () => {
    setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDayClick = (dateStr) => {
    setMemoDate(dateStr);
  };

  const formatDateStr = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Generate mini calendar grid cells
  const getCalendarCells = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const cellsList = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = prevMonthTotalDays - i;
      cellsList.push({
        date: new Date(year, month - 1, day),
        isCurrentMonth: false,
        dayNum: day
      });
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      cellsList.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
        dayNum: day
      });
    }

    // Next month padding
    const remaining = 42 - cellsList.length;
    for (let day = 1; day <= remaining; day++) {
      cellsList.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        dayNum: day
      });
    }

    return cellsList;
  };

  // Save memos
  const saveMemos = (updatedMemos) => {
    setMemos(updatedMemos);
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
            category: '일기',
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
        category: '일기',
        content: memoContent,
        createdAt: new Date().toISOString()
      };
      saveMemos([newMemo, ...memos]);
      alert('새로운 기록이 등록되었습니다.');
    }

    // Reset Form
    setMemoTitle('');
    setMemoContent('');
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
    setMemoContent(memo.content);
    setActiveFormTab('memo'); // Switch to memo tab for editing
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel Editing
  const cancelEditing = () => {
    setEditingMemoId(null);
    setMemoTitle('');
    setMemoContent('');
    setMemoDate(new Date().toISOString().split('T')[0]);
  };

  // Filter Memos
  const filteredMemos = memos.filter(memo => {
    return (
      memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memo.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div style={{ padding: '0 20px 40px 20px', width: '100%', maxWidth: '100%', margin: '0 auto' }}>
      
      {/* Custom Styles */}
      <style>{`
        .memo-card-wrapper {
          background-color: var(--bg-card);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          border-left: 4px solid var(--primary);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .memo-card-wrapper:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px -8px rgba(94, 95, 240, 0.15), var(--shadow-md);
        }
        
        .input-glow {
          transition: all 0.2s ease;
        }
        .input-glow:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px rgba(94, 95, 240, 0.15) !important;
          background-color: #ffffff !important;
        }

        .mini-cal-day {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
          user-select: none;
        }
        .mini-cal-day:hover {
          background-color: var(--primary-light);
          color: var(--primary);
        }
        .mini-cal-day.selected {
          background-color: var(--primary) !important;
          color: #ffffff !important;
        }
        .mini-cal-day.selected:hover {
          background-color: var(--primary-hover) !important;
        }
        .mini-cal-day.today:not(.selected) {
          border: 1.5px solid var(--primary);
          color: var(--primary);
          font-weight: 700;
        }
        .mini-cal-day.other-month {
          opacity: 0.3;
        }

        .records-grid-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 28px;
          align-items: start;
        }
        .memos-list-column {
          grid-column: span 2;
        }
        .memos-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 20px;
          width: 100%;
        }
        @media (max-width: 850px) {
          .records-grid-layout {
            grid-template-columns: 1fr;
          }
          .memos-list-column {
            grid-column: span 1;
          }
        }
        @media (max-width: 768px) {
          .todo-tab-layout {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .todo-tab-layout > div:last-child {
            border-left: none !important;
            padding-left: 0 !important;
            border-top: 1.5px dashed var(--border-color);
            padding-top: 20px;
          }
        }

        .draft-todo-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 8px;
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .draft-todo-item:hover {
          transform: translateY(-1.5px);
          border-color: var(--primary);
          box-shadow: 0 4px 10px rgba(94, 95, 240, 0.08), var(--shadow-md);
        }
        .draft-todo-checkbox {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1.5px solid var(--text-muted);
          opacity: 0.5;
          margin-right: 10px;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .draft-todo-item:hover .draft-todo-checkbox {
          border-color: var(--primary);
          opacity: 0.8;
        }
        
        .btn-save-all {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: none;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-save-all.active {
          background: linear-gradient(135deg, var(--primary) 0%, #7c7df6 100%);
          color: #ffffff;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(94, 95, 240, 0.25);
        }
        .btn-save-all.active:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 14px rgba(94, 95, 240, 0.35);
        }
        .btn-save-all.active:active {
          transform: translateY(0);
        }
        .btn-save-all.disabled {
          background-color: var(--border-color);
          color: var(--text-muted);
          cursor: not-allowed;
          opacity: 0.7;
        }
      `}</style>

      {/* Board Header Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, #eff1fe 0%, #e0e2fe 100%)', 
        padding: '24px 28px', 
        borderRadius: '16px', 
        marginBottom: '28px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid rgba(94, 95, 240, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <BookOpen size={26} color="var(--primary)" />
            기록게시판
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>
            하루의 근무 소회, 일기를 편하게 기록하고 예쁘게 모아보세요.
          </p>
        </div>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)',
          opacity: 0.95
        }}>
          <Sparkles size={28} color="var(--primary)" />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="records-grid-layout">
        
        {/* Combined Creator & Todo Card */}
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setActiveFormTab('memo')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeFormTab === 'memo' ? 'var(--primary-light)' : 'transparent',
                color: activeFormTab === 'memo' ? 'var(--primary)' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              <BookOpen size={16} />
              {editingMemoId ? '하루 기록 수정하기' : '하루 기록하기'}
            </button>
            <button
              type="button"
              onClick={() => setActiveFormTab('todo')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeFormTab === 'todo' ? 'var(--primary-light)' : 'transparent',
                color: activeFormTab === 'todo' ? 'var(--primary)' : 'var(--text-muted)',
                transition: 'all 0.2s ease'
              }}
            >
              <ListTodo size={16} />
              할 일 목록 (To-Do)
            </button>
          </div>

          {activeFormTab === 'memo' ? (
            <form onSubmit={handleMemoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Date Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>날짜</label>
                <input 
                  type="date" 
                  value={memoDate}
                  onChange={(e) => setMemoDate(e.target.value)}
                  className="input-text input-glow"
                  style={{ 
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-color)',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Title Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>제목</label>
                <input 
                  type="text" 
                  value={memoTitle}
                  onChange={(e) => setMemoTitle(e.target.value)}
                  placeholder="예: 오늘 야간 근무 소회"
                  className="input-text input-glow"
                  style={{ 
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-color)',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                  maxLength={50}
                />
              </div>

              {/* Content Textarea */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>기록 내용</label>
                <textarea
                  value={memoContent}
                  onChange={(e) => setMemoContent(e.target.value)}
                  placeholder="오늘의 업무 에피소드나 생각을 편하게 기록해보세요..."
                  className="input-text input-glow"
                  style={{ 
                    width: '100%', 
                    height: '160px', 
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-color)',
                    backgroundColor: '#ffffff',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical', 
                    fontFamily: 'inherit', 
                    lineHeight: '1.5' 
                  }}
                  maxLength={1000}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {editingMemoId && (
                  <button 
                    type="button" 
                    onClick={cancelEditing}
                    style={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '6px', 
                      cursor: 'pointer', 
                      padding: '12px', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border-color)', 
                      backgroundColor: 'var(--bg-card)', 
                      color: 'var(--text-main)', 
                      fontSize: '13px', 
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.color = 'var(--primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.color = 'var(--text-main)';
                    }}
                  >
                    <X size={14} />
                    취소
                  </button>
                )}
                <button 
                  type="submit" 
                  style={{ 
                    flex: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '6px', 
                    cursor: 'pointer', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    fontSize: '13px', 
                    fontWeight: '700',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 10px rgba(94, 95, 240, 0.25)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(94, 95, 240, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary)';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(94, 95, 240, 0.25)';
                  }}
                >
                  <Check size={14} />
                  {editingMemoId ? '수정완료' : '기록하기'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="todo-tab-layout" style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '28px' 
            }}>
              {/* Column 1: Input & Existing Saved List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Todo Add Form */}
                <form onSubmit={handleAddTodo} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Date Input Header & Field (Hides input when General checked) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>날짜</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                        <input 
                          type="checkbox" 
                          checked={!todoHasDate}
                          onChange={(e) => setTodoHasDate(!e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                        기본 할 일로 지정 (날짜 없음)
                      </label>
                    </div>
                    {todoHasDate && (
                      <input 
                        type="date" 
                        value={memoDate}
                        onChange={(e) => setMemoDate(e.target.value)}
                        className="input-text input-glow"
                        style={{ 
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1.5px solid var(--border-color)',
                          backgroundColor: '#ffffff',
                          color: 'var(--text-main)',
                          fontSize: '13px',
                          outline: 'none',
                          marginTop: '4px'
                        }}
                      />
                    )}
                  </div>

                  {/* Todo Input Field */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>할 일 내용</label>
                    <input 
                      type="text" 
                      value={todoText}
                      onChange={(e) => setTodoText(e.target.value)}
                      placeholder="예: 오늘 퇴근 전 주간 보고서 제출"
                      className="input-text input-glow"
                      style={{ 
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border-color)',
                        backgroundColor: '#ffffff',
                        color: 'var(--text-main)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                      maxLength={100}
                    />
                  </div>

                  {/* Action Button */}
                  <button 
                    type="submit" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '6px', 
                      cursor: 'pointer', 
                      padding: '12px', 
                      borderRadius: '8px', 
                      fontSize: '13px', 
                      fontWeight: '700',
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      border: 'none',
                      boxShadow: '0 4px 10px rgba(94, 95, 240, 0.25)',
                      transition: 'all 0.2s ease',
                      marginTop: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 14px rgba(94, 95, 240, 0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary)';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 4px 10px rgba(94, 95, 240, 0.25)';
                    }}
                  >
                    <Plus size={14} />
                    투두리스트로 이동
                  </button>
                </form>

                {/* Selected Date Todos */}
                {todos.filter(t => t.date === memoDate).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{memoDate} 할 일</span>
                      <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                        {todos.filter(t => t.date === memoDate).length}개
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                      {todos.filter(t => t.date === memoDate).map(todo => (
                        <div 
                          key={todo.id}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            padding: '6px 8px', 
                            borderRadius: '6px', 
                            backgroundColor: 'var(--bg-app)', 
                            border: '1px solid var(--border-color)',
                            transition: 'all 0.15s ease' 
                          }}
                        >
                          <div 
                            onClick={() => handleToggleTodo(todo.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, minWidth: 0 }}
                          >
                            {todo.completed ? (
                              <CheckSquare size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                            ) : (
                              <Square size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                            )}
                            <span style={{ 
                              fontSize: '12px', 
                              color: todo.completed ? 'var(--text-muted)' : 'var(--text-main)',
                              textDecoration: todo.completed ? 'line-through' : 'none',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {todo.text}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteTodo(todo.id)}
                            style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* General / Date-less Todos */}
                {todos.filter(t => !t.date).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>기본 할 일</span>
                      <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                        {todos.filter(t => !t.date).length}개
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                      {todos.filter(t => !t.date).map(todo => (
                        <div 
                          key={todo.id}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            padding: '6px 8px', 
                            borderRadius: '6px', 
                            backgroundColor: 'var(--bg-app)', 
                            border: '1px solid var(--border-color)',
                            transition: 'all 0.15s ease' 
                          }}
                        >
                          <div 
                            onClick={() => handleToggleTodo(todo.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, minWidth: 0 }}
                          >
                            {todo.completed ? (
                              <CheckSquare size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                            ) : (
                              <Square size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                            )}
                            <span style={{ 
                              fontSize: '12px', 
                              color: todo.completed ? 'var(--text-muted)' : 'var(--text-main)',
                              textDecoration: todo.completed ? 'line-through' : 'none',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {todo.text}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteTodo(todo.id)}
                            style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Column 2: Draft / Temporary Todos & Save Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderLeft: '1.5px dashed var(--border-color)', paddingLeft: '28px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                  {draftTodos.length > 0 ? (
                    draftTodos.map(todo => (
                      <div 
                        key={todo.id}
                        className="draft-todo-item"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                          <div className="draft-todo-checkbox" />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {todo.text}
                            </span>
                            {todo.date && (
                              <span style={{ 
                                alignSelf: 'flex-start',
                                fontSize: '9.5px', 
                                color: 'var(--primary)', 
                                backgroundColor: 'var(--primary-light)', 
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: '700'
                              }}>
                                {todo.date}
                              </span>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteDraft(todo.id)}
                          style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                          title="삭제"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '40px 20px',
                      border: '1.5px dashed var(--border-color)',
                      borderRadius: '12px',
                      backgroundColor: '#fafbfc',
                      textAlign: 'center',
                      minHeight: '120px'
                    }}>
                      <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--text-muted)' }}>
                        저장할 할 일이 없습니다
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        왼쪽에서 할 일을 입력한 뒤<br />
                        <strong>[+ 투두리스트로 이동]</strong> 버튼을 클릭하면<br />
                        여기에 임시 저장됩니다.
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveDrafts}
                  className={draftTodos.length > 0 ? "btn-save-all active" : "btn-save-all disabled"}
                  disabled={draftTodos.length === 0}
                >
                  <Check size={16} />
                  투두리스트 저장하기
                </button>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Right Section (Calendar only) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Mini Calendar Card */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ maxWidth: '340px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="var(--primary)" />
                  기록 현황 달력
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    type="button"
                    onClick={handlePrevMonth}
                    style={{ 
                      border: 'none', 
                      background: 'none', 
                      cursor: 'pointer', 
                      color: 'var(--text-muted)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', minWidth: '75px', textAlign: 'center', userSelect: 'none' }}>
                    {calendarViewDate.getFullYear()}년 {calendarViewDate.getMonth() + 1}월
                  </span>
                  <button 
                    type="button"
                    onClick={handleNextMonth}
                    style={{ 
                      border: 'none', 
                      background: 'none', 
                      cursor: 'pointer', 
                      color: 'var(--text-muted)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Weekdays */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
                {['일', '월', '화', '수', '목', '금', '토'].map((wd, idx) => (
                  <span 
                    key={wd} 
                    style={{ 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      color: idx === 0 ? '#ef4444' : idx === 6 ? '#3b82f6' : 'var(--text-muted)',
                      opacity: 0.8
                    }}
                  >
                    {wd}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {getCalendarCells().map((cell, idx) => {
                  const dateStr = formatDateStr(cell.date);
                  const isSelected = memoDate === dateStr;
                  const isToday = formatDateStr(new Date()) === dateStr;
                  const hasDiary = memos.some(m => m.date === dateStr);
                  const hasTodos = todos.some(t => t.date === dateStr);
                  return (
                    <div
                      key={idx}
                      onClick={() => handleDayClick(dateStr)}
                      className={`mini-cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${!cell.isCurrentMonth ? 'other-month' : ''}`}
                      style={{ height: '34px', width: '34px', margin: '0 auto' }}
                    >
                      <span>{cell.dayNum}</span>
                      <div style={{
                        position: 'absolute',
                        bottom: '3px',
                        display: 'flex',
                        gap: '3px',
                        justifyContent: 'center',
                        left: 0,
                        right: 0
                      }}>
                        {hasDiary && (
                          <span style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: isSelected ? '#ffffff' : 'var(--primary)'
                          }} />
                        )}
                        {hasTodos && (
                          <span style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: isSelected ? '#ffffff' : '#f59e0b'
                          }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Memos List & Filtering */}
        <div className="memos-list-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Filter & Search Bar */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px', 
            backgroundColor: 'var(--bg-card)', 
            padding: '16px', 
            borderRadius: '12px', 
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="기록한 내용이나 제목으로 검색해보세요..."
                className="input-text input-glow"
                style={{ 
                  width: '100%', 
                  padding: '10px 14px 10px 36px', 
                  borderRadius: '8px', 
                  border: '1.5px solid var(--border-color)', 
                  backgroundColor: '#ffffff', 
                  color: 'var(--text-main)', 
                  fontSize: '13px', 
                  outline: 'none', 
                  transition: 'all 0.2s ease' 
                }}
              />
            </div>
          </div>

          {/* Memos Render */}
          <div 
            className={filteredMemos.length === 0 ? "" : "memos-cards-grid"} 
            style={filteredMemos.length === 0 ? { display: 'flex', flexDirection: 'column', gap: '14px' } : {}}
          >
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
                  className="memo-card-wrapper"
                >
                  {/* Header info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '8px', 
                        backgroundColor: 'var(--primary-light)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <FileText size={18} color="var(--primary)" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                          {memo.title}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Calendar size={11} />
                            {memo.date}
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
                          justifyContent: 'center',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
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
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
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
                    backgroundColor: 'var(--bg-app)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-color)',
                    opacity: 0.95
                  }}>
                    {memo.content}
                  </p>
                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
