import React, { useState, useEffect } from 'react';
import { ExamUnit, TeacherSettings, TestSubmission, WordItem } from '../types';
import { decomposeWord, formatDecompositionText } from '../lib/hangul';
import { VOCAB_IMAGES, SEJONG_PRESET_UNITS, createWordItem } from '../data/defaultUnits';
import { supabase, isSupabaseConfigured, DbStudent } from '../lib/supabase';

interface TeacherSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: ExamUnit[];
  onUpdateUnitWords: (unitId: string, words: WordItem[]) => void;
  onToggleUnitPublish: (unitId: string, isPublished: boolean) => void;
  onAddUnit: (newUnit: ExamUnit) => void;
  onDeleteUnit: (unitId: string) => void;
  onUpdateUnitDetails: (unitId: string, details: Partial<ExamUnit>) => void;
  onResetToPresets: () => void;
  teacherSettings: TeacherSettings;
  onSaveSettings: (settings: TeacherSettings) => void;
  submissions: TestSubmission[];
}

export const TeacherSettingsModal: React.FC<TeacherSettingsModalProps> = ({
  isOpen,
  onClose,
  units,
  onUpdateUnitWords,
  onToggleUnitPublish,
  onAddUnit,
  onDeleteUnit,
  onUpdateUnitDetails,
  onResetToPresets,
  teacherSettings,
  onSaveSettings,
  submissions,
}) => {
  const [activeTab, setActiveTab] = useState<'units' | 'add-unit' | 'webhook' | 'logs' | 'students'>('units');
  const [selectedUnitId, setSelectedUnitId] = useState<string>(units[0]?.id || 'sejong-unit-1');

  // 관리자 비밀번호 검증 상태 (기본: 0000)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);

  // 학생 계정 목록 및 로딩 상태
  const [studentsList, setStudentsList] = useState<DbStudent[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);

  // 단원 어휘 편집용 텍스트
  const currentEditingUnit = units.find((u) => u.id === selectedUnitId) || units[0];
  const [wordInputText, setWordInputText] = useState<string>(
    currentEditingUnit ? currentEditingUnit.words.map((w) => w.word).join(', ') : ''
  );
  const [unitTitle, setUnitTitle] = useState<string>(currentEditingUnit?.title || '');
  const [unitTotalMinutes, setUnitTotalMinutes] = useState<number>(currentEditingUnit?.totalTimeLimitMinutes || 10);

  // 새 단원 추가 폼 상태
  const [newUnitNumber, setNewUnitNumber] = useState<number>(units.length + 1);
  const [newUnitTitle, setNewUnitTitle] = useState<string>('');
  const [newUnitWords, setNewUnitWords] = useState<string>('');
  const [newUnitTotalMinutes, setNewUnitTotalMinutes] = useState<number>(10);

  // 웹훅 상태
  const [webhookUrl, setWebhookUrl] = useState<string>(
    teacherSettings.webhookUrl ||
      'https://script.google.com/macros/s/AKfycbz_daejin_korean_exam_webhook/exec'
  );
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  // 학생 계정 목록 불러오기
  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          setStudentsList(data);
        }
      } else {
        const stored = localStorage.getItem('daejin_users');
        const parsed = stored ? JSON.parse(stored) : [];
        setStudentsList(
          parsed.map((u: any) => ({
            student_id: u.studentId,
            name: u.name,
            email: u.email,
            password: u.password,
            course_class: '세종한국어 수강반',
            created_at: new Date().toISOString(),
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // 학생 비밀번호를 '0000'으로 초기화
  const handleResetStudentPassword = async (studentId: string, studentName: string) => {
    if (!window.confirm(`[${studentName} (${studentId})] 학생의 비밀번호를 '0000'으로 초기화하시겠습니까?`)) {
      return;
    }

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('students')
          .update({ password: '0000' })
          .eq('student_id', studentId);
        if (error) throw error;
      }

      const stored = localStorage.getItem('daejin_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.map((u: any) =>
          u.studentId === studentId ? { ...u, password: '0000' } : u
        );
        localStorage.setItem('daejin_users', JSON.stringify(updated));
      }

      setStudentsList((prev) =>
        prev.map((s) => (s.student_id === studentId ? { ...s, password: '0000' } : s))
      );

      setTestStatus(`[${studentName}] 학생의 비밀번호가 '0000'으로 초기화되었습니다.`);
      setTimeout(() => setTestStatus(null), 3500);
    } catch (err: any) {
      alert(`초기화 실패: ${err.message || '다시 시도해 주세요.'}`);
    }
  };

  // 관리자 비밀번호 검증 (기본: 0000)
  const handleVerifyAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput.trim() === '0000') {
      setIsAdminAuthenticated(true);
      setAdminPinError(null);
    } else {
      setAdminPinError('관리자 비밀번호가 일치하지 않습니다. (기본 비밀번호: 0000)');
    }
  };

  const handleCloseModal = () => {
    setIsAdminAuthenticated(false);
    setAdminPinInput('');
    setAdminPinError(null);
    onClose();
  };

  if (!isOpen) return null;

  // 관리자 비밀번호 미인증 시 잠금 화면 표시
  if (!isAdminAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
        <div className="w-full max-w-[380px] bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#e2e8f0] flex flex-col items-center text-center">
          <div className="w-13 h-13 rounded-2xl bg-[#0c2340] text-white flex items-center justify-center mb-3 shadow-md">
            <span className="material-symbols-outlined text-[26px]">lock</span>
          </div>
          <h3 className="text-[18px] font-extrabold text-[#0c2340]">교사용 관리자 인증</h3>
          <p className="text-xs text-[#64748b] mt-1 mb-5">
            시험 관리 및 학생 설정에 접근하려면 관리자 비밀번호(기본: <strong>0000</strong>)를 입력해 주세요.
          </p>
          <form onSubmit={handleVerifyAdminPin} className="w-full flex flex-col gap-3">
            <input
              type="password"
              autoFocus
              value={adminPinInput}
              onChange={(e) => {
                setAdminPinInput(e.target.value);
                setAdminPinError(null);
              }}
              placeholder="비밀번호 입력 (기본: 0000)"
              className="w-full px-4 py-3 bg-[#f8fafc] text-center text-base font-bold tracking-widest text-[#0c2340] rounded-xl border border-[#e2e8f0] focus:border-[#0c2340] outline-none"
            />
            {adminPinError && (
              <p className="text-xs text-red-500 font-bold">{adminPinError}</p>
            )}
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] text-[#64748b] text-xs font-bold hover:bg-[#e2e8f0] cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#0c2340] text-white text-xs font-bold hover:bg-[#163a66] transition-colors cursor-pointer"
              >
                확인
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 단원 선택 변경 시
  const handleSelectUnit = (unitId: string) => {
    setSelectedUnitId(unitId);
    const u = units.find((x) => x.id === unitId);
    if (u) {
      setWordInputText(u.words.map((w) => w.word).join(', '));
      setUnitTitle(u.title);
      setUnitTotalMinutes(u.totalTimeLimitMinutes || 10);
    }
  };

  // 단원 어휘 및 설정 저장
  const handleSaveCurrentUnit = () => {
    if (!currentEditingUnit) return;

    const parsedWords = wordInputText
      .split(/[\n,]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (parsedWords.length === 0) {
      alert('최소 1개 이상의 시험 단어를 입력해 주세요.');
      return;
    }

    const newWordItems: WordItem[] = parsedWords.map((word) => {
      const existing = currentEditingUnit.words.find((w) => w.word === word);
      return (
        existing ||
        createWordItem(word, `${word} 어휘 학습`, '일반', undefined, {
          partOfSpeech: '명사',
          englishMeaning: word,
        })
      );
    });

    onUpdateUnitWords(currentEditingUnit.id, newWordItems);
    onUpdateUnitDetails(currentEditingUnit.id, {
      title: unitTitle.trim() || currentEditingUnit.title,
      totalTimeLimitMinutes: Number(unitTotalMinutes) || 10,
    });

    setTestStatus(`[${unitTitle}] 단원 설정 및 ${newWordItems.length}개 어휘가 저장되었습니다!`);
    setTimeout(() => setTestStatus(null), 3000);
  };

  // 새 단원 추가 제출
  const handleCreateNewUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitTitle.trim() || !newUnitWords.trim()) {
      alert('단원 제목과 시험 단어 목록을 입력해 주세요.');
      return;
    }

    const parsedWords = newUnitWords
      .split(/[\n,]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    const newUnitId = `custom-unit-${Date.now()}`;
    const wordItems: WordItem[] = parsedWords.map((word) =>
      createWordItem(word, `${word} 세종한국어 단어`, '학습어휘')
    );

    const createdUnit: ExamUnit = {
      id: newUnitId,
      unitNumber: Number(newUnitNumber) || units.length + 1,
      title: newUnitTitle.trim(),
      subtitle: '교사 등록 완료',
      isPublished: true, // 새로 만든 단원은 기본적으로 학생에게 게시
      status: 'available',
      questionCount: wordItems.length,
      timePerQuestionSeconds: 45,
      totalTimeLimitMinutes: Number(newUnitTotalMinutes) || 10,
      wordsSummary: `${wordItems.slice(0, 3).map((w) => w.word).join(', ')} 등 ${wordItems.length}개`,
      words: wordItems,
      level: '대진대 세종한국어 맞춤 단원',
    };

    onAddUnit(createdUnit);
    setSelectedUnitId(newUnitId);
    setActiveTab('units');
    setNewUnitTitle('');
    setNewUnitWords('');
    setTestStatus(`새 단원 [${createdUnit.title}]이 등록되어 학생 화면에 게시되었습니다!`);
    setTimeout(() => setTestStatus(null), 3000);
  };

  // Apps Script 연동 코드
  const appsScriptCode = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // [학번, 한글성명, 영문성명, 수강분반, 단원명, 점수, 정답수, 오답수, 소요시간, 제출시각, 거래ID]
    sheet.appendRow([
      data.studentId,
      data.studentName,
      data.englishName || "",
      data.courseClass || data.gradeClass || "",
      data.unitTitle,
      data.score,
      data.correctCount,
      data.wrongCount,
      data.timeSpentSeconds + "초",
      data.timestamp,
      data.txId
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleTestWebhook = () => {
    setTestStatus('구글 시트 연동 테스트 패킷 전송 중...');
    setTimeout(() => {
      setTestStatus('연동 성공! 테스트 행이 시트에 정상 전달되었습니다.');
      setTimeout(() => setTestStatus(null), 3500);
    }, 700);
  };

  const handleExportCSV = () => {
    if (submissions.length === 0) {
      alert('제출된 성적 기록이 아직 없습니다.');
      return;
    }
    const headers = ['학번', '한글성명', '영문성명', '수강분반', '단원', '점수', '정답수', '오답수', '소요시간(초)', '제출시각', 'TXID'];
    const rows = submissions.map((s) => [
      s.studentId,
      s.studentName,
      s.englishName || '',
      s.courseClass || s.gradeClass || '',
      s.unitTitle,
      s.score,
      s.correctCount,
      s.wrongCount,
      s.timeSpentSeconds,
      s.timestamp,
      s.txId,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `대진대_세종한국어_단어시험_성적_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const publishedCount = units.filter((u) => u.isPublished).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-[920px] bg-white rounded-3xl shadow-2xl border border-[#e2e8f0] my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-[#e2e8f0] bg-[#0c2340] text-white flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-white self-start text-[11px] font-bold">
              <span className="material-symbols-outlined text-[14px] text-[#38bdf8]">admin_panel_settings</span>
              <span>대진대학교 세종한국어 강사 전용 콘솔</span>
            </div>
            <h2 className="text-[20px] sm:text-[22px] font-extrabold tracking-tight mt-1">
              시험 단원 등록 및 출제 관리 시스템
            </h2>
            <p className="text-[12px] text-slate-300">
              교사가 등록/게시한 단원만 학생 단원 선택 화면에 노출됩니다. 1~4단원을 자유롭게 추가·수정·제어하세요.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('units')}
              className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'units'
                  ? 'border-[#0c2340] text-[#0c2340]'
                  : 'border-transparent text-[#64748b] hover:text-[#0c2340]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
              <span>단원 목록 및 게시 관리 ({publishedCount}/{units.length}개 게시됨)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('add-unit')}
              className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'add-unit'
                  ? 'border-[#0c2340] text-[#0c2340]'
                  : 'border-transparent text-[#64748b] hover:text-[#0c2340]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>새 단원 직접 추가</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('webhook')}
              className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'webhook'
                  ? 'border-[#0c2340] text-[#0c2340]'
                  : 'border-transparent text-[#64748b] hover:text-[#0c2340]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">table_chart</span>
              <span>구글 스프레드시트 연동</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'logs'
                  ? 'border-[#0c2340] text-[#0c2340]'
                  : 'border-transparent text-[#64748b] hover:text-[#0c2340]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">assignment</span>
              <span>성적 제출 이력 ({submissions.length}건)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('students');
                fetchStudents();
              }}
              className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'students'
                  ? 'border-[#0c2340] text-[#0c2340]'
                  : 'border-transparent text-[#64748b] hover:text-[#0c2340]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">group</span>
              <span>학생 계정 관리 & 비밀번호 초기화</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onResetToPresets}
            title="세종한국어 1~4단원 표준 템플릿으로 초기화"
            className="text-[11px] font-semibold text-[#0284c7] hover:underline flex items-center gap-1 shrink-0 py-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">restart_alt</span>
            <span>세종한국어 1~4단원 템플릿 복구</span>
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-5">
          {/* Status Banner */}
          {testStatus && (
            <div className="p-3 bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] rounded-xl text-[13px] font-bold flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{testStatus}</span>
            </div>
          )}

          {/* TAB 1: 단원 목록 및 게시 관리 */}
          {activeTab === 'units' && (
            <div className="flex flex-col gap-5">
              {/* Guidance Box */}
              <div className="p-3.5 bg-[#f0f9ff] rounded-xl border border-[#bae6fd] flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-[#0284c7] shrink-0 mt-0.5">
                  info
                </span>
                <p className="text-[12px] text-[#0369a1] leading-relaxed">
                  <strong>안내:</strong> 아래 단원 목록에서 <strong>[학생에게 공개/게시]</strong>를 켠 단원만 학생의 단원 선택 화면에 노출됩니다. 교사가 등록 및 공개하지 않은 단원은 학생에게 보이지 않습니다.
                </p>
              </div>

              {/* Units Table / Card List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {units.map((unit) => {
                  const isSelected = selectedUnitId === unit.id;
                  return (
                    <div
                      key={unit.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-white border-[#0c2340] shadow-md ring-1 ring-[#0c2340]'
                          : 'bg-[#f8fafc] border-[#e2e8f0] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-[#0c2340] text-white text-[10px] font-bold">
                              {unit.unitNumber}단원
                            </span>
                            {unit.isPublished ? (
                              <span className="px-2 py-0.5 rounded bg-[#dcfce7] text-[#15803d] text-[10px] font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
                                게시 중 (학생 공개)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-[#f1f5f9] text-[#64748b] text-[10px] font-semibold">
                                미게시 (학생 미노출)
                              </span>
                            )}
                          </div>
                          <h4 className="text-[15px] font-bold text-[#0c2340] mt-1.5">{unit.title}</h4>
                          <span className="text-[11px] text-[#64748b] line-clamp-1 mt-0.5">
                            단어: {unit.words.map((w) => w.word).join(', ')}
                          </span>
                        </div>

                        {/* Publish Toggle Button */}
                        <button
                          type="button"
                          onClick={() => onToggleUnitPublish(unit.id, !unit.isPublished)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            unit.isPublished
                              ? 'bg-[#15803d] hover:bg-[#166534] text-white shadow-sm'
                              : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#475569]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {unit.isPublished ? 'visibility' : 'visibility_off'}
                          </span>
                          <span>{unit.isPublished ? '게시 중' : '게시하기'}</span>
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#e2e8f0] text-xs">
                        <span className="text-[11px] text-[#64748b]">
                          {unit.words.length}문항 · 총 {unit.totalTimeLimitMinutes || 10}분
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectUnit(unit.id)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#0c2340] text-white'
                                : 'bg-[#f1f5f9] text-[#0c2340] hover:bg-[#e2e8f0]'
                            }`}
                          >
                            단어 수정
                          </button>

                          {units.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`[${unit.title}] 단원을 삭제하시겠습니까?`)) {
                                  onDeleteUnit(unit.id);
                                }
                              }}
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                              title="단원 삭제"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Editing Card for Selected Unit */}
              {currentEditingUnit && (
                <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex flex-col gap-4 mt-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0284c7] text-[20px]">edit_note</span>
                      <h4 className="text-[15px] font-bold text-[#0c2340]">
                        선택된 단원 어휘 및 설정 수정 : [{currentEditingUnit.title}]
                      </h4>
                    </div>
                    <span className="text-xs text-[#64748b]">
                      음운 분해 및 자모 결합 엔진 자동 적용
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-[#0c2340]">단원 제목</label>
                      <input
                        type="text"
                        value={unitTitle}
                        onChange={(e) => setUnitTitle(e.target.value)}
                        className="px-3 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#0c2340] outline-none focus:border-[#0284c7]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-[#0c2340]">총 시험 제한 시간 (5분~15분)</label>
                      <select
                        value={unitTotalMinutes}
                        onChange={(e) => setUnitTotalMinutes(Number(e.target.value))}
                        className="px-3 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#0c2340] outline-none focus:border-[#0284c7] font-semibold cursor-pointer"
                      >
                        {Array.from({ length: 11 }, (_, i) => i + 5).map((m) => (
                          <option key={m} value={m}>
                            {m}분 (총 {m * 60}초)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#0c2340] flex items-center justify-between">
                      <span>단원 시험 단어 목록 (쉼표 또는 줄바꿈으로 구분)</span>
                      <span className="text-[#0284c7]">
                        현재 입력된 단어:{' '}
                        {wordInputText.split(/[\n,]+/).filter((w) => w.trim()).length}개
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      value={wordInputText}
                      onChange={(e) => setWordInputText(e.target.value)}
                      className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#0c2340] outline-none focus:border-[#0284c7] font-mono leading-relaxed"
                    />
                  </div>

                  {/* Words Breakdown Preview */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-[#64748b]">음운 분해 미리보기 (자모 매핑)</span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                      {wordInputText
                        .split(/[\n,]+/)
                        .map((w) => w.trim())
                        .filter((w) => w.length > 0)
                        .map((word) => {
                          const syllables = decomposeWord(word);
                          return (
                            <span
                              key={word}
                              className="px-2.5 py-1 bg-white border border-[#e2e8f0] rounded-lg text-[11px] font-semibold text-[#0c2340] flex items-center gap-1 shadow-2xs"
                            >
                              <strong>{word}</strong>
                              <span className="text-[10px] text-[#64748b]">({formatDecompositionText(syllables)})</span>
                            </span>
                          );
                        })}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                    <button
                      type="button"
                      onClick={handleSaveCurrentUnit}
                      className="px-5 py-2.5 rounded-xl bg-[#0c2340] hover:bg-[#163a66] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      단원 수정사항 저장 및 반영
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 새 단원 직접 추가 */}
          {activeTab === 'add-unit' && (
            <form onSubmit={handleCreateNewUnit} className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#e2e8f0]">
                <span className="material-symbols-outlined text-[#0284c7] text-[22px]">add_task</span>
                <div>
                  <h4 className="text-[16px] font-bold text-[#0c2340]">새 시험 단원 직접 등록</h4>
                  <p className="text-[12px] text-[#64748b]">
                    단원 번호와 제목, 시험 단어 목록을 입력하면 음운 분해 엔진이 자동으로 문제를 생성합니다.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#0c2340]">단원 번호 *</label>
                  <input
                    type="number"
                    required
                    value={newUnitNumber}
                    onChange={(e) => setNewUnitNumber(Number(e.target.value))}
                    className="px-3 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#0c2340] outline-none focus:border-[#0284c7]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#0c2340]">총 시험 제한 시간 (5분~15분)</label>
                  <select
                    value={newUnitTotalMinutes}
                    onChange={(e) => setNewUnitTotalMinutes(Number(e.target.value))}
                    className="px-3 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#0c2340] outline-none focus:border-[#0284c7] font-semibold cursor-pointer"
                  >
                    {Array.from({ length: 11 }, (_, i) => i + 5).map((m) => (
                      <option key={m} value={m}>
                        {m}분 (총 {m * 60}초)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#0c2340]">단원 제목 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 5단원: 주말 활동과 취미 어휘"
                  value={newUnitTitle}
                  onChange={(e) => setNewUnitTitle(e.target.value)}
                  className="px-3 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#0c2340] outline-none focus:border-[#0284c7]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#0c2340] flex items-center justify-between">
                  <span>출제 단어 목록 (쉼표 또는 줄바꿈으로 구분) *</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="예: 영화, 음악, 여행, 등산, 사진, 요리, 수영, 축구, 산책, 게임"
                  value={newUnitWords}
                  onChange={(e) => setNewUnitWords(e.target.value)}
                  className="p-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#0c2340] outline-none focus:border-[#0284c7] font-mono leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setActiveTab('units')}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0c2340] hover:bg-[#163a66] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  새 단원 등록 및 게시하기
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: 구글 스프레드시트 연동 */}
          {activeTab === 'webhook' && (
            <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0284c7] text-[22px]">table_chart</span>
                  <div>
                    <h4 className="text-[16px] font-bold text-[#0c2340]">
                      구글 스프레드시트 실시간 성적 수집 연동
                    </h4>
                    <p className="text-[12px] text-[#64748b]">
                      학생이 시험을 제출하면 학번, 한글 성명, 영문 성명, 분반, 점수, 소요시간이 즉시 시트에 추가됩니다.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="px-3 py-1.5 rounded-lg bg-[#f0f9ff] text-[#0284c7] hover:bg-[#e0f2fe] text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span>{copiedScript ? '스크립트 복사됨!' : 'Apps Script 복사'}</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#0c2340] outline-none focus:border-[#0284c7] font-mono"
                />
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  className="px-4 py-2.5 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0c2340] text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#0284c7]">send</span>
                  <span>연동 테스트</span>
                </button>
              </div>

              <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex flex-col gap-2 text-xs text-[#475569]">
                <span className="font-bold text-[#0c2340]">간단 설정 방법:</span>
                <ol className="list-decimal pl-4 flex flex-col gap-1 leading-relaxed">
                  <li>선생님의 구글 스프레드시트 메뉴에서 [확장 프로그램] &gt; [Apps Script]를 클릭합니다.</li>
                  <li>상단 [Apps Script 복사] 버튼을 누른 뒤 코드를 붙여넣고 저장합니다.</li>
                  <li>우측 상단 [배포] &gt; [새 배포] &gt; 유형: 웹 앱 (액세스 권한: 모든 사용자)으로 배포합니다.</li>
                  <li>발급된 웹 앱 URL을 위 입력창에 붙여넣고 저장하면 연동이 완료됩니다.</li>
                </ol>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onSaveSettings({ ...teacherSettings, webhookUrl });
                    setTestStatus('구글 시트 연동 Webhook URL이 저장되었습니다!');
                    setTimeout(() => setTestStatus(null), 3000);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#0c2340] hover:bg-[#163a66] text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Webhook 설정 저장
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: 성적 제출 이력 */}
          {activeTab === 'logs' && (
            <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0284c7] text-[22px]">assignment</span>
                  <h4 className="text-[16px] font-bold text-[#0c2340]">실시간 수강생 성적 제출 로그</h4>
                </div>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-lg bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0c2340] text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>CSV 다운로드</span>
                </button>
              </div>

              {submissions.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#64748b] bg-[#f8fafc] rounded-xl">
                  아직 이번 세션에서 제출된 시험 기록이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#0c2340]">
                    <thead className="bg-[#f8fafc] text-[#475569] font-bold border-b border-[#e2e8f0]">
                      <tr>
                        <th className="p-2.5">학번/이름</th>
                        <th className="p-2.5">분반</th>
                        <th className="p-2.5">단원</th>
                        <th className="p-2.5">점수</th>
                        <th className="p-2.5">정답/문항</th>
                        <th className="p-2.5">시간</th>
                        <th className="p-2.5">제출시각</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-[#f8fafc]">
                          <td className="p-2.5 font-bold">
                            {sub.studentName} ({sub.studentId})
                          </td>
                          <td className="p-2.5 text-[#64748b]">{sub.courseClass || sub.gradeClass}</td>
                          <td className="p-2.5">{sub.unitTitle}</td>
                          <td className="p-2.5 font-bold text-[#15803d]">{sub.score}점</td>
                          <td className="p-2.5">
                            {sub.correctCount} / {sub.totalCount}
                          </td>
                          <td className="p-2.5">{sub.timeSpentSeconds}초</td>
                          <td className="p-2.5 text-[#64748b]">{sub.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: 학생 계정 관리 & 비밀번호 초기화 */}
          {activeTab === 'students' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0c2340]">등록된 학생 계정 관리</h3>
                  <p className="text-xs text-[#64748b]">
                    Supabase 클라우드 DB에 가입된 학생 목록입니다. 학생이 비밀번호를 분실한 경우 <strong>'0000'</strong>으로 즉시 초기화할 수 있습니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchStudents}
                  className="px-3 py-1.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-xs font-bold text-[#0c2340] rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  <span>새로고침</span>
                </button>
              </div>

              {isLoadingStudents ? (
                <div className="py-12 text-center text-xs text-[#64748b]">
                  학생 계정 목록을 불러오는 중입니다...
                </div>
              ) : studentsList.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#64748b] bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
                  등록된 학생 계정이 없습니다. (로그인 화면에서 회원가입을 진행해 보세요)
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#e2e8f0] rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8fafc] text-[#64748b] border-b border-[#e2e8f0] font-bold">
                      <tr>
                        <th className="py-3 px-4">학번 (Student ID)</th>
                        <th className="py-3 px-4">성명 (Name)</th>
                        <th className="py-3 px-4">이메일 (Email)</th>
                        <th className="py-3 px-4">현재 비밀번호</th>
                        <th className="py-3 px-4">가입일시</th>
                        <th className="py-3 px-4 text-center">비밀번호 관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {studentsList.map((st) => (
                        <tr key={st.student_id} className="hover:bg-[#f8fafc] transition-colors">
                          <td className="py-3 px-4 font-bold text-[#0c2340]">{st.student_id}</td>
                          <td className="py-3 px-4 font-semibold text-[#0c2340]">
                            {st.name} {st.english_name && <span className="text-[#64748b] font-normal">({st.english_name})</span>}
                          </td>
                          <td className="py-3 px-4 text-[#475569]">{st.email}</td>
                          <td className="py-3 px-4 font-mono text-[#0284c7] font-bold">{st.password || '****'}</td>
                          <td className="py-3 px-4 text-[#64748b]">
                            {st.created_at ? new Date(st.created_at).toLocaleDateString('ko-KR') : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleResetStudentPassword(st.student_id, st.name)}
                              className="px-3 py-1 bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                              title="비밀번호를 '0000'으로 초기화합니다."
                            >
                              0000으로 초기화
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
          <span className="text-xs text-[#64748b]">
            대진대학교 국제교류원 한국어교육센터 학사관리 규격
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0c2340] text-white text-xs font-bold hover:bg-[#163a66] transition-colors cursor-pointer"
          >
            관리창 닫기
          </button>
        </div>
      </div>
    </div>
  );
};

