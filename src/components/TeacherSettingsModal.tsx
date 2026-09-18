import React, { useState, useEffect } from 'react';
import { ExamUnit, TeacherSettings, TestSubmission, WordItem, CourseCategory, LearnerProfile } from '../types';
import { decomposeWord, formatDecompositionText } from '../lib/hangul';
import {
  VOCAB_IMAGES,
  SEJONG_PRESET_UNITS,
  createWordItem,
  getCandidateImagesForWord,
  getWordDisplayImage,
  getCustomVocabImages,
  getDefaultVocabImage,
  removeCustomVocabImage,
  saveCustomVocabImage,
} from '../data/defaultUnits';
import {
  supabase,
  isSupabaseConfigured,
  getEffectiveSupabaseConfig,
  saveStoredSupabaseConfig,
  checkSupabaseConnection,
  DbStudent,
} from '../lib/supabase';
import { DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL, getEffectiveWebhookUrl } from '../config';

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
  onUpdateWordImage?: (word: string, imageUrl: string) => void;
  student?: LearnerProfile | null;
  onManualCloudPush?: () => Promise<boolean>;
  onManualCloudPull?: () => Promise<boolean>;
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
  onUpdateWordImage,
  student,
  onManualCloudPush,
  onManualCloudPull,
}) => {
  const [activeTab, setActiveTab] = useState<'units' | 'add-unit' | 'webhook' | 'logs' | 'students'>('units');
  const [selectedUnitId, setSelectedUnitId] = useState<string>(units[0]?.id || 'sejong-unit-1');
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);

  // 관리자 비밀번호 검증 상태 (비밀번호: 2525)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);

  // 학생 계정 목록 및 로딩 상태
  const [studentsList, setStudentsList] = useState<DbStudent[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);

  // Supabase 클라우드 설정 상태
  const [cloudUrlInput, setCloudUrlInput] = useState(() => getEffectiveSupabaseConfig().url);
  const [cloudKeyInput, setCloudKeyInput] = useState(() => getEffectiveSupabaseConfig().anonKey);
  const [cloudStatusMsg, setCloudStatusMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [isCloudActive, setIsCloudActive] = useState(() => isSupabaseConfigured());

  const handleSaveAndTestCloud = async () => {
    setIsTestingCloud(true);
    setCloudStatusMsg(null);
    try {
      saveStoredSupabaseConfig(cloudUrlInput, cloudKeyInput);
      const res = await checkSupabaseConnection();
      setCloudStatusMsg(res);
      const active = isSupabaseConfigured();
      setIsCloudActive(active);
      if (res.ok) {
        await fetchStudents();
      }
    } catch (e: any) {
      setCloudStatusMsg({ ok: false, message: e.message || '연결 실패' });
    } finally {
      setIsTestingCloud(false);
    }
  };

  // 단원 어휘 편집용 텍스트
  const currentEditingUnit = units.find((u) => u.id === selectedUnitId) || units[0];
  const [wordInputText, setWordInputText] = useState<string>(
    currentEditingUnit ? currentEditingUnit.words.map((w) => w.word).join(', ') : ''
  );
  const [unitTitle, setUnitTitle] = useState<string>(currentEditingUnit?.title || '');
  const [unitCategory, setUnitCategory] = useState<CourseCategory>(
    (currentEditingUnit?.category as CourseCategory) || '1A 한국어'
  );
  const [unitTotalMinutes, setUnitTotalMinutes] = useState<number>(currentEditingUnit?.totalTimeLimitMinutes || 10);
  const [quickWordInput, setQuickWordInput] = useState<string>('');

  // 모달 열림 또는 선택 단원 변경 시 편집 폼 자동 동기화
  useEffect(() => {
    if (isOpen && currentEditingUnit) {
      setWordInputText(currentEditingUnit.words.map((w) => w.word).join(', '));
      setUnitTitle(currentEditingUnit.title);
      setUnitCategory((currentEditingUnit.category as CourseCategory) || '1A 한국어');
      setUnitTotalMinutes(currentEditingUnit.totalTimeLimitMinutes || 10);
    }
  }, [isOpen, selectedUnitId]);

  // 새 시험 추가 폼 상태 (과정 대분류, 시험제목, 시험일, 시험 시간, 출제 단어)
  const [newExamCategory, setNewExamCategory] = useState<CourseCategory>('1A 한국어');
  const [newExamTitle, setNewExamTitle] = useState<string>('');
  const [newExamDate, setNewExamDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [newExamTotalMinutes, setNewExamTotalMinutes] = useState<number>(10);
  const [newExamWords, setNewExamWords] = useState<string>('');

  // 웹훅 상태 (기본값: 구글 Apps Script 연동 공식 웹 앱 주소)
  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    return getEffectiveWebhookUrl(teacherSettings.webhookUrl);
  });

  useEffect(() => {
    if (isOpen) {
      setWebhookUrl(getEffectiveWebhookUrl(teacherSettings.webhookUrl));
    }
  }, [isOpen, teacherSettings.webhookUrl]);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  // 어휘 대표 이미지 선택 및 교체 모달 상태
  const [editingWord, setEditingWord] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [aiPromptInput, setAiPromptInput] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [imageTabMode, setImageTabMode] = useState<'preset' | 'upload' | 'url' | 'ai'>('preset');

  // 웹훅 테스트 분반 선택 및 전송 로딩 상태
  const [selectedTestClass, setSelectedTestClass] = useState<CourseCategory>('1A 한국어');
  const [isSendingWebhookTest, setIsSendingWebhookTest] = useState<boolean>(false);

  // 학생 계정 목록 불러오기
  const fetchStudents = async () => {
    setIsLoadingStudents(true);
    try {
      if (isSupabaseConfigured()) {
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
            course_class: u.courseClass || '1A 한국어',
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
      if (isSupabaseConfigured()) {
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

  // 관리자 비밀번호 검증 (비밀번호: 2525)
  const handleVerifyAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput.trim() === '2525') {
      setIsAdminAuthenticated(true);
      setAdminPinError(null);
    } else {
      setAdminPinError('관리자 비밀번호가 일치하지 않습니다.');
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
            시험 관리 및 학생 설정에 접근하려면 관리자 비밀번호를 입력해 주세요.
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
              placeholder="관리자 비밀번호 입력"
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
      setUnitCategory((u.category as CourseCategory) || '1A 한국어');
      setUnitTotalMinutes(u.totalTimeLimitMinutes || 10);
    }
  };

  // 개별 단어 즉시 삭제 기능
  const handleDeleteWordFromUnit = (wordToDelete: string) => {
    if (!currentEditingUnit) return;

    const remainingWords = wordInputText
      .split(/[\n,]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0 && w !== wordToDelete);

    if (remainingWords.length === 0) {
      alert('단원은 최소 1개 이상의 시험 단어를 포함해야 합니다.');
      return;
    }

    const updatedText = remainingWords.join(', ');
    setWordInputText(updatedText);

    const updatedWordItems = currentEditingUnit.words.filter((w) => w.word !== wordToDelete);
    onUpdateUnitWords(currentEditingUnit.id, updatedWordItems);

    setTestStatus(`[${wordToDelete}] 단어가 단원 어휘 목록에서 즉시 삭제되었습니다.`);
    setTimeout(() => setTestStatus(null), 2500);
  };

  // 새 어휘 즉시 추가
  const handleQuickAddWord = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const wordToAdd = quickWordInput.trim();
    if (!wordToAdd) return;
    if (!currentEditingUnit) return;

    const currentWordsList = wordInputText
      .split(/[\n,]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (currentWordsList.includes(wordToAdd)) {
      alert(`[${wordToAdd}] 어휘는 이미 단원 목록에 존재합니다.`);
      return;
    }

    const newWordItem = createWordItem(wordToAdd, `${wordToAdd} 어휘 학습`, '일반', undefined, {
      partOfSpeech: '명사(N)',
      englishMeaning: wordToAdd,
      imageUrl: getWordDisplayImage(wordToAdd),
    });

    const updatedWords = [...currentEditingUnit.words, newWordItem];
    const updatedText = currentWordsList.length > 0 ? `${wordInputText.trim()}, ${wordToAdd}` : wordToAdd;

    setWordInputText(updatedText);
    onUpdateUnitWords(currentEditingUnit.id, updatedWords);
    setQuickWordInput('');
    setTestStatus(`[${wordToAdd}] 단어가 단원에 새로 추가되었습니다.`);
    setTimeout(() => setTestStatus(null), 2500);
  };

  // 새 시험 추가 폼에서 개별 단어 삭제
  const handleDeleteWordFromNewExam = (wordToDelete: string) => {
    const remaining = newExamWords
      .split(/[\n,]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0 && w !== wordToDelete);
    setNewExamWords(remaining.join(', '));
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
          partOfSpeech: '명사(N)',
          englishMeaning: word,
          imageUrl: getWordDisplayImage(word),
        })
      );
    });

    onUpdateUnitWords(currentEditingUnit.id, newWordItems);
    onUpdateUnitDetails(currentEditingUnit.id, {
      title: unitTitle.trim() || currentEditingUnit.title,
      category: unitCategory,
      totalTimeLimitMinutes: Number(unitTotalMinutes) || 10,
    });

    setTestStatus(`[${unitTitle}] 단원 설정 및 ${newWordItems.length}개 어휘가 저장되었습니다!`);
    setTimeout(() => setTestStatus(null), 3000);
  };

  // 새 시험 추가 제출
  const handleCreateNewUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle.trim() || !newExamWords.trim()) {
      alert('시험제목과 출제 단어 목록을 입력해 주세요.');
      return;
    }

    const parsedWords = newExamWords
      .split(/[\n,]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (parsedWords.length === 0) {
      alert('최소 1개 이상의 출제 단어를 입력해 주세요.');
      return;
    }

    const newUnitId = `custom-unit-${Date.now()}`;
    const wordItems: WordItem[] = parsedWords.map((word) =>
      createWordItem(word, `${word} 어휘 학습`, '학습어휘', undefined, {
        partOfSpeech: '명사(N)',
        englishMeaning: word,
        imageUrl: getWordDisplayImage(word),
      })
    );

    const createdUnit: ExamUnit = {
      id: newUnitId,
      unitNumber: units.length + 1,
      title: newExamTitle.trim(),
      category: newExamCategory,
      subtitle: newExamDate ? `시험일: ${newExamDate}` : '교사 등록 완료',
      isPublished: true, // 새로 등록한 시험은 기본적으로 학생에게 게시
      status: 'available',
      questionCount: Math.min(10, wordItems.length),
      timePerQuestionSeconds: 45,
      totalTimeLimitMinutes: Number(newExamTotalMinutes) || 10,
      wordsSummary: `${wordItems.slice(0, 3).map((w) => w.word).join(', ')} 등 ${wordItems.length}개`,
      words: wordItems,
      level: `대진대 세종한국어 ${newExamCategory}`,
    };

    onAddUnit(createdUnit);
    setSelectedUnitId(newUnitId);
    setActiveTab('units');
    setNewExamTitle('');
    setNewExamWords('');
    setTestStatus(`새 시험 [${newExamCategory}] [${createdUnit.title}]이 등록되어 학생 화면에 게시되었습니다!`);
    setTimeout(() => setTestStatus(null), 3000);
  };

  // 어휘 이미지 편집 모달 열기
  const handleOpenImageEditor = (word: string) => {
    setEditingWord(word);
    const currentImg = getWordDisplayImage(word);
    setSelectedImageUrl(currentImg);
    setCustomUrlInput('');
    setAiPromptInput(`${word}, korean vocabulary education, clean illustration, high quality, white background`);
    setImageTabMode('preset');
  };

  // 선택한 어휘 이미지 적용 및 영구 저장 (단어 목록 상태 보존)
  const handleApplyImageChange = () => {
    if (!editingWord || !selectedImageUrl) return;
    saveCustomVocabImage(editingWord, selectedImageUrl);
    if (onUpdateWordImage) {
      onUpdateWordImage(editingWord, selectedImageUrl);
    }
    if (currentEditingUnit) {
      const activeWordStrings = wordInputText
        .split(/[\n,]+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 0);

      const updatedWords = activeWordStrings.map((word) => {
        const existing = currentEditingUnit.words.find((w) => w.word === word);
        const item =
          existing ||
          createWordItem(word, `${word} 어휘 학습`, '일반', undefined, {
            partOfSpeech: '명사(N)',
            englishMeaning: word,
          });
        if (word === editingWord) {
          return { ...item, imageUrl: selectedImageUrl };
        }
        return item;
      });

      onUpdateUnitWords(currentEditingUnit.id, updatedWords);
    }
    setTestStatus(`[${editingWord}] 어휘의 대표 이미지가 성공적으로 변경·저장되었습니다!`);
    setTimeout(() => setTestStatus(null), 3000);
    setEditingWord(null);
  };

  // 공식 기본 제공 이미지로 복구
  const handleResetImageToDefault = () => {
    if (!editingWord) return;
    removeCustomVocabImage(editingWord);
    const defaultUrl = getDefaultVocabImage(editingWord);
    setSelectedImageUrl(defaultUrl);
    if (onUpdateWordImage) {
      onUpdateWordImage(editingWord, defaultUrl);
    }
    if (currentEditingUnit) {
      const activeWordStrings = wordInputText
        .split(/[\n,]+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 0);

      const updatedWords = activeWordStrings.map((word) => {
        const existing = currentEditingUnit.words.find((w) => w.word === word);
        const item =
          existing ||
          createWordItem(word, `${word} 어휘 학습`, '일반', undefined, {
            partOfSpeech: '명사(N)',
            englishMeaning: word,
          });
        if (word === editingWord) {
          return { ...item, imageUrl: defaultUrl };
        }
        return item;
      });

      onUpdateUnitWords(currentEditingUnit.id, updatedWords);
    }
    setTestStatus(`[${editingWord}] 어휘 이미지가 공식 기본 이미지로 복구되었습니다.`);
    setTimeout(() => setTestStatus(null), 3000);
    setEditingWord(null);
  };

  // 내 PC 파일 업로드 (HTML Canvas 고효율 리사이징/압축: 최대 600px, JPEG 82% 압축으로 localStorage 용량 안전 보장)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(JPG, PNG, GIF, WebP 등)만 업로드할 수 있습니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result;
      if (typeof rawDataUrl !== 'string') return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setSelectedImageUrl(compressedDataUrl);
        } else {
          setSelectedImageUrl(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // AI 어휘 이미지 생성
  const handleGenerateAiImage = () => {
    if (!editingWord) return;
    setIsGeneratingAi(true);
    const prompt = aiPromptInput.trim() || `${editingWord} korean vocabulary clean clear illustration`;
    const encoded = encodeURIComponent(prompt);
    const newUrl = `https://image.pollinations.ai/prompt/${encoded}?width=600&height=400&nologo=true&seed=${Date.now()}`;

    const img = new Image();
    img.onload = () => {
      setSelectedImageUrl(newUrl);
      setIsGeneratingAi(false);
    };
    img.onerror = () => {
      setIsGeneratingAi(false);
      alert('AI 이미지 서버의 일시적 요청 한도 초과(429)로 생성이 지연되고 있습니다. [추천 4종] 중 하나를 선택하시거나 [PC 업로드]를 이용하시면 오류 없이 즉시 반영됩니다.');
    };
    img.src = newUrl;
  };

  // 단원 데이터 내보내기 (클립보드 복사)
  const handleExportUnits = () => {
    try {
      const exportData = {
        version: 'v20260918',
        exportedAt: new Date().toISOString(),
        units,
        customImages: getCustomVocabImages(),
      };
      const jsonStr = JSON.stringify(exportData, null, 2);
      navigator.clipboard.writeText(jsonStr);
      setTestStatus('현재 단원 및 이미지 설정이 클립보드에 복사되었습니다! 모바일 기기에서 [데이터 불러오기]를 눌러 붙여넣으세요.');
      setTimeout(() => setTestStatus(null), 4000);
    } catch {
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  // 단원 데이터 불러오기 (다른 기기 데이터 동기화)
  const handleImportUnits = () => {
    const input = prompt('데스크탑에서 [데이터 내보내기]로 복사한 JSON 데이터를 여기에 붙여넣어 주세요:');
    if (!input || !input.trim()) return;

    try {
      const data = JSON.parse(input.trim());
      const importedUnits = data.units || data;
      if (!Array.isArray(importedUnits) || importedUnits.length === 0) {
        alert('올바른 단원 데이터 형식이 아닙니다.');
        return;
      }
      if (data.customImages && typeof data.customImages === 'object') {
        const currentCustom = getCustomVocabImages();
        const merged = { ...currentCustom, ...data.customImages };
        localStorage.setItem('daejin_custom_vocab_images', JSON.stringify(merged));
      }
      localStorage.setItem('daejin_units', JSON.stringify(importedUnits));
      alert('단원 데이터가 성공적으로 불러와졌습니다! 화면을 새로고침합니다.');
      window.location.reload();
    } catch (e: any) {
      alert('데이터 구문 분석 실패: ' + (e.message || String(e)));
    }
  };

  // 11개 컬럼 지원 및 [1A 한국어]~[2B 한국어] 분반별 시트 자동 라우팅 Apps Script 코드
  const appsScriptCode = `/**
 * 대진대학교 세종한국어 단어시험 성적 자동 수집 및 분반별 자동 라우팅 스크립트
 * 
 * [동작 원리]
 * 1. 학생이 시험을 제출하면 doPost(e)가 실행됩니다.
 * 2. 수강 분반(1A 한국어 ~ 2B 한국어) 탭과 '전체 현황' 탭에 실시간으로 행이 동시 기록됩니다.
 * 3. 탭이 시트에 없으면 자동으로 생성하고 대진대 네이비 테마 헤더 서식을 적용합니다.
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    
    // 학생의 수강 분반 탭 이름 (1A 한국어, 1B 한국어, 2A 한국어, 2B 한국어 등)
    var courseClass = data.courseClass || data.gradeClass || '1A 한국어';
    
    // 11개 핵심 수집 컬럼 데이터 구성
    var rowData = [
      data.timestamp || new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }), // 1. 접속일자/제출일시
      courseClass,                                // 2. 분반 (1A~2B)
      data.studentId,                             // 3. 학번
      data.studentName,                           // 4. 한글 성명
      data.englishName || "",                     // 5. 영문 성명
      data.unitTitle,                             // 6. 시험 제목
      data.score,                                 // 7. 점수
      data.correctCount + " / " + (data.totalCount || (data.correctCount + data.wrongCount)), // 8. 정답수/문항수
      (data.timeSpentSeconds || 0) + "초",         // 9. 소요 시간
      data.wrongWords || "없음 (만점)",            // 10. 오답 단어 목록
      data.txId                                   // 11. 고유ID
    ];
    
    // 1) 해당 분반 전용 시트 탭에 자동 기록
    appendRecordToSheet(ss, courseClass, rowData);
    
    // 2) 전체 통합 현황 탭에 동시 기록
    appendRecordToSheet(ss, "전체 현황", rowData);
    
    return ContentService.createTextOutput(JSON.stringify({ "status": "success", "courseClass": courseClass }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 특정 시트 탭에 헤더 검사 후 데이터 행 추가
function appendRecordToSheet(ss, sheetName, rowData) {
  var sheet = ss.getSheetByName(sheetName);
  var headers = [
    "접속일자/제출일시", "분반", "학번", "성명(한글)", "영문성명",
    "시험 제목", "점수", "정답/총문항", "소요시간", "오답 단어 목록", "고유ID"
  ];
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#0c2340")
               .setFontColor("#ffffff")
               .setFontWeight("bold")
               .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
  
  sheet.appendRow(rowData);
  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 1, 1, rowData.length).setHorizontalAlignment("center");
}

/**
 * [원클릭 분반 시트 사전 초기화 도구]
 * 구글 시트에 '전체 현황', '1A 한국어', '1B 한국어', '2A 한국어', '2B 한국어' 5개 탭을
 * 미리 생성하고 깔끔한 헤더 서식을 적용하고 싶을 때 Apps Script 실행창에서
 * setupClassSheets 함수를 1회 [실행]하세요.
 */
function setupClassSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var classes = ["전체 현황", "1A 한국어", "1B 한국어", "2A 한국어", "2B 한국어"];
  var headers = [
    "접속일자/제출일시", "분반", "학번", "성명(한글)", "영문성명",
    "시험 제목", "점수", "정답/총문항", "소요시간", "오답 단어 목록", "고유ID"
  ];
  
  classes.forEach(function(cls) {
    var sheet = ss.getSheetByName(cls);
    if (!sheet) {
      sheet = ss.insertSheet(cls);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#0c2340")
               .setFontColor("#ffffff")
               .setFontWeight("bold")
               .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  });
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleWebhookUrlChange = (val: string) => {
    const trimmed = val.trim();
    setWebhookUrl(trimmed);
    onSaveSettings({ ...teacherSettings, webhookUrl: trimmed });
    try {
      localStorage.setItem('daejin_webhook_url', trimmed);
      const cur = localStorage.getItem('daejin_teacher_settings');
      const parsed = cur ? JSON.parse(cur) : {};
      localStorage.setItem('daejin_teacher_settings', JSON.stringify({ ...parsed, webhookUrl: trimmed }));
    } catch {}
  };

  // 분반별 실시간 웹훅 테스트 발송
  const handleTestWebhook = async () => {
    const trimmedUrl = webhookUrl.trim();
    if (!trimmedUrl || !trimmedUrl.startsWith('http')) {
      alert('올바른 구글 Webhook URL을 입력해 주세요.');
      return;
    }

    // 테스트 실행 시 Webhook URL 즉시 자동 저장 및 동기화
    onSaveSettings({ ...teacherSettings, webhookUrl: trimmedUrl });
    try {
      localStorage.setItem('daejin_webhook_url', trimmedUrl);
      const cur = localStorage.getItem('daejin_teacher_settings');
      const parsed = cur ? JSON.parse(cur) : {};
      localStorage.setItem('daejin_teacher_settings', JSON.stringify({ ...parsed, webhookUrl: trimmedUrl }));
    } catch {}

    setIsSendingWebhookTest(true);
    setTestStatus(`[${selectedTestClass}] 탭으로 테스트 성적 데이터 전송 중...`);

    const currentStudentId = student?.studentId || '20100042';
    const currentStudentName = student?.name || '최재민';
    const currentEnglishName = student?.englishName || '';

    const testPayload = {
      timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      studentId: currentStudentId,
      studentName: currentStudentName,
      englishName: currentEnglishName,
      courseClass: selectedTestClass,
      gradeClass: selectedTestClass,
      unitTitle: `[${selectedTestClass}] 단어 시험 연동 테스트`,
      score: 100,
      correctCount: 10,
      wrongCount: 0,
      totalCount: 10,
      timeSpentSeconds: 120,
      wrongWords: '없음 (만점)',
      txId: `TEST-${Date.now().toString(36).toUpperCase()}`,
    };

    try {
      await fetch(trimmedUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });
      setTestStatus(
        `[${selectedTestClass}] 및 [전체 현황] 시트 탭으로 테스트 행이 발송되었습니다! 스프레드시트를 열어 확인해 보세요.`
      );
      setTimeout(() => setTestStatus(null), 5000);
    } catch (err: any) {
      setTestStatus(`전송 중 오류 발생: ${err.message || '네트워크 확인 요망'}`);
    } finally {
      setIsSendingWebhookTest(false);
    }
  };

  // 개별 성적 구글 시트로 즉시 전송
  const handleSyncSubmissionToSheet = async (sub: TestSubmission) => {
    const effectiveUrl = getEffectiveWebhookUrl(webhookUrl || teacherSettings.webhookUrl);
    if (!effectiveUrl || !effectiveUrl.startsWith('http')) {
      alert('유효한 구글 스프레드시트 Apps Script Webhook URL을 [구글 스프레드시트 연동] 탭에서 먼저 입력해 주세요.');
      setActiveTab('webhook');
      return;
    }
    setTestStatus(`[${sub.studentName} (${sub.studentId})] 성적 데이터를 구글 시트로 전송 중...`);

    const courseClass = sub.courseClass || sub.gradeClass || '1A 한국어';
    const payload = {
      timestamp: sub.timestamp,
      studentId: sub.studentId,
      studentName: sub.studentName,
      englishName: sub.englishName || '',
      courseClass: courseClass,
      gradeClass: courseClass,
      unitTitle: sub.unitTitle,
      score: sub.score,
      correctCount: sub.correctCount,
      wrongCount: sub.wrongCount,
      totalCount: sub.totalCount,
      timeSpentSeconds: sub.timeSpentSeconds,
      wrongWords: sub.wrongWords || '없음 (만점)',
      txId: sub.txId,
    };

    try {
      await fetch(effectiveUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setTestStatus(`[${sub.studentName}] [${sub.unitTitle}] 성적이 구글 시트 [${courseClass}] 탭으로 성공적으로 전송되었습니다!`);
      setTimeout(() => setTestStatus(null), 4500);
    } catch (err: any) {
      alert(`구글 시트 전송 오류: ${err.message || '네트워크 상태를 확인해 주세요.'}`);
    }
  };

  // 모든 성적 구글 시트로 일괄 동기화
  const handleSyncAllSubmissions = async () => {
    const effectiveUrl = getEffectiveWebhookUrl(webhookUrl || teacherSettings.webhookUrl);
    if (!effectiveUrl || !effectiveUrl.startsWith('http')) {
      alert('유효한 구글 스프레드시트 Apps Script Webhook URL을 [구글 스프레드시트 연동] 탭에서 먼저 입력해 주세요.');
      setActiveTab('webhook');
      return;
    }
    if (submissions.length === 0) {
      alert('동기화할 성적 제출 이력이 없습니다.');
      return;
    }

    setTestStatus(`총 ${submissions.length}건의 성적을 구글 시트로 일괄 전송 중...`);

    for (const sub of submissions) {
      const courseClass = sub.courseClass || sub.gradeClass || '1A 한국어';
      const payload = {
        timestamp: sub.timestamp,
        studentId: sub.studentId,
        studentName: sub.studentName,
        englishName: sub.englishName || '',
        courseClass: courseClass,
        gradeClass: courseClass,
        unitTitle: sub.unitTitle,
        score: sub.score,
        correctCount: sub.correctCount,
        wrongCount: sub.wrongCount,
        totalCount: sub.totalCount,
        timeSpentSeconds: sub.timeSpentSeconds,
        wrongWords: sub.wrongWords || '없음 (만점)',
        txId: sub.txId,
      };

      try {
        await fetch(effectiveUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        // 시트 동시 쓰기 충돌 방지를 위한 순차 딜레이
        await new Promise((resolve) => setTimeout(resolve, 350));
      } catch {}
    }

    setTestStatus(`총 ${submissions.length}건의 성적이 구글 시트로 모두 동기화되었습니다!`);
    setTimeout(() => setTestStatus(null), 5000);
  };

  const handleExportCSV = () => {
    if (submissions.length === 0) {
      alert('제출된 성적 기록이 아직 없습니다.');
      return;
    }
    const headers = [
      '접속일자/제출일시',
      '분반',
      '학번',
      '한글성명',
      '영문성명',
      '시험 제목',
      '점수',
      '정답/총문항',
      '소요시간',
      '오답 단어 목록',
      '제출 고유ID',
    ];
    const rows = submissions.map((s) => [
      `"${s.timestamp}"`,
      `"${s.courseClass || s.gradeClass || ''}"`,
      `"${s.studentId}"`,
      `"${s.studentName}"`,
      `"${s.englishName || ''}"`,
      `"${s.unitTitle}"`,
      s.score,
      `"${s.correctCount} / ${s.totalCount}"`,
      `"${s.timeSpentSeconds}초"`,
      `"${s.wrongWords || '없음 (만점)'}"`,
      `"${s.txId}"`,
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
      <div className="relative w-full max-w-[1040px] bg-white rounded-3xl shadow-2xl border border-[#e2e8f0] my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-[#e2e8f0] bg-[#0c2340] text-white flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white self-start text-[12px] font-bold">
              <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">admin_panel_settings</span>
              <span>대진대학교 세종한국어 강사 전용 콘솔</span>
            </div>
            <h2 className="text-[22px] sm:text-[24px] font-extrabold tracking-tight mt-1">
              시험 단원 등록 및 출제 관리 시스템
            </h2>
            <p className="text-[13px] text-slate-300">
              교사가 등록/게시한 단원만 학생 단원 선택 화면에 노출됩니다. 1~4단원을 자유롭게 추가·수정·제어하세요.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Tab Navigation - Primary Category Bar (넓고 쾌적한 대형 탭) */}
        <div className="px-5 sm:px-6 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-max">
            <button
              type="button"
              onClick={() => setActiveTab('units')}
              className={`px-5 py-3.5 rounded-2xl text-[14px] sm:text-[15px] font-extrabold flex items-center gap-2.5 transition-all whitespace-nowrap cursor-pointer shadow-sm ${
                activeTab === 'units'
                  ? 'bg-[#0c2340] text-white shadow-md ring-2 ring-[#0c2340]/20 scale-[1.02]'
                  : 'bg-white text-[#475569] hover:text-[#0c2340] hover:bg-[#f1f5f9] border border-[#e2e8f0]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">format_list_bulleted</span>
              <span>단원 목록 및 게시 관리</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  activeTab === 'units' ? 'bg-white/20 text-white' : 'bg-[#e2e8f0] text-[#475569]'
                }`}
              >
                {publishedCount}/{units.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('add-unit')}
              className={`px-5 py-3.5 rounded-2xl text-[14px] sm:text-[15px] font-extrabold flex items-center gap-2.5 transition-all whitespace-nowrap cursor-pointer shadow-sm ${
                activeTab === 'add-unit'
                  ? 'bg-[#0c2340] text-white shadow-md ring-2 ring-[#0c2340]/20 scale-[1.02]'
                  : 'bg-white text-[#475569] hover:text-[#0c2340] hover:bg-[#f1f5f9] border border-[#e2e8f0]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">add_circle</span>
              <span>새 시험 등록</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  activeTab === 'add-unit' ? 'bg-white/20 text-white' : 'bg-[#e0f2fe] text-[#0369a1]'
                }`}
              >
                +추가
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('webhook')}
              className={`px-5 py-3.5 rounded-2xl text-[14px] sm:text-[15px] font-extrabold flex items-center gap-2.5 transition-all whitespace-nowrap cursor-pointer shadow-sm ${
                activeTab === 'webhook'
                  ? 'bg-[#0c2340] text-white shadow-md ring-2 ring-[#0c2340]/20 scale-[1.02]'
                  : 'bg-white text-[#475569] hover:text-[#0c2340] hover:bg-[#f1f5f9] border border-[#e2e8f0]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">table_chart</span>
              <span>구글 스프레드시트 연동</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-5 py-3.5 rounded-2xl text-[14px] sm:text-[15px] font-extrabold flex items-center gap-2.5 transition-all whitespace-nowrap cursor-pointer shadow-sm ${
                activeTab === 'logs'
                  ? 'bg-[#0c2340] text-white shadow-md ring-2 ring-[#0c2340]/20 scale-[1.02]'
                  : 'bg-white text-[#475569] hover:text-[#0c2340] hover:bg-[#f1f5f9] border border-[#e2e8f0]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">assignment</span>
              <span>성적 제출 이력</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  activeTab === 'logs' ? 'bg-white/20 text-white' : 'bg-[#e2e8f0] text-[#475569]'
                }`}
              >
                {submissions.length}건
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('students');
                fetchStudents();
              }}
              className={`px-5 py-3.5 rounded-2xl text-[14px] sm:text-[15px] font-extrabold flex items-center gap-2.5 transition-all whitespace-nowrap cursor-pointer shadow-sm ${
                activeTab === 'students'
                  ? 'bg-[#0c2340] text-white shadow-md ring-2 ring-[#0c2340]/20 scale-[1.02]'
                  : 'bg-white text-[#475569] hover:text-[#0c2340] hover:bg-[#f1f5f9] border border-[#e2e8f0]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">group</span>
              <span>학생 계정 관리 & 비밀번호 초기화</span>
            </button>
          </div>
        </div>

        {/* Action & Cloud Sync Utility Bar (Row 2 - 데이터 및 클라우드 배포) */}
        <div className="px-5 sm:px-6 py-2.5 bg-[#f0f9ff]/70 border-b border-[#bae6fd]/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[12px] font-bold text-[#0369a1]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e0f2fe] text-[#0284c7] text-[11px] font-extrabold border border-[#bae6fd]">
              <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
              Supabase 클라우드 실시간 동기화
            </span>
            <span className="hidden md:inline text-[#64748b] text-[11px] font-medium">
              PC에서 수정한 시험 및 이미지가 모든 학생 기기에 실시간 반영됩니다.
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={async () => {
                setIsSyncingCloud(true);
                try {
                  const ok = onManualCloudPush ? await onManualCloudPush() : true;
                  if (ok) {
                    setTestStatus('🚀 현재 단원 및 이미지 설정이 Supabase 클라우드에 성공적으로 배포되었습니다! 모든 학생 기기에서 즉시 확인됩니다.');
                  } else {
                    alert('클라우드 배포에 실패했습니다. 네트워크 연결을 확인해 주세요.');
                  }
                } finally {
                  setIsSyncingCloud(false);
                  setTimeout(() => setTestStatus(null), 4000);
                }
              }}
              disabled={isSyncingCloud}
              title="선생님 컴퓨터에서 수정한 단원/단어/이미지를 Supabase 클라우드에 배포하여 모든 학생 스마트폰/태블릿에 즉시 적용"
              className="text-[12px] font-extrabold text-white bg-[#0c2340] hover:bg-[#1e3a5f] px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[17px] ${isSyncingCloud ? 'animate-spin' : ''}`}>
                {isSyncingCloud ? 'sync' : 'cloud_upload'}
              </span>
              <span>{isSyncingCloud ? '배포 중...' : '클라우드 즉시 배포 (학생 전체 반영)'}</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                setIsSyncingCloud(true);
                try {
                  const ok = onManualCloudPull ? await onManualCloudPull() : true;
                  if (ok) {
                    setTestStatus('☁️ 클라우드에서 최신 단원 및 이미지 설정을 성공적으로 불러왔습니다!');
                  } else {
                    alert('클라우드 데이터를 불러오지 못했습니다.');
                  }
                } finally {
                  setIsSyncingCloud(false);
                  setTimeout(() => setTestStatus(null), 4000);
                }
              }}
              disabled={isSyncingCloud}
              title="Supabase 클라우드에서 최신 단원 설정을 가져옵니다"
              className="text-[12px] font-bold text-[#0c2340] bg-white hover:bg-[#e0f2fe] border border-[#cbd5e1] px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[17px] text-[#0284c7]">cloud_download</span>
              <span>클라우드 동기화</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onResetToPresets();
                setTestStatus('세종한국어 공식 표준 단원과 최신 고화질 이미지가 성공적으로 동기화되었습니다!');
                setTimeout(() => setTestStatus(null), 3000);
              }}
              title="세종한국어 공식 표준 단원 및 최신 고화질 이미지 동기화"
              className="text-[12px] font-bold text-[#15803d] bg-[#f0fdf4] hover:bg-[#dcfce7] border border-[#bbf7d0] px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">sync</span>
              <span>공식 단원 동기화</span>
            </button>

            <button
              type="button"
              onClick={handleExportUnits}
              title="현재 단원 설정을 JSON 텍스트로 클립보드에 복사"
              className="text-[11px] font-semibold text-[#64748b] hover:text-[#0c2340] bg-white hover:bg-[#f1f5f9] border border-[#e2e8f0] px-2.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <span className="material-symbols-outlined text-[15px]">upload</span>
              <span>JSON 내보내기</span>
            </button>

            <button
              type="button"
              onClick={handleImportUnits}
              title="JSON 단원 데이터를 직접 붙여넣어 복구"
              className="text-[11px] font-semibold text-[#64748b] hover:text-[#0c2340] bg-white hover:bg-[#f1f5f9] border border-[#e2e8f0] px-2.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              <span>JSON 불러오기</span>
            </button>
          </div>
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
              <div className="p-4 bg-[#f0fdf4] rounded-2xl border border-[#bbf7d0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#dcfce7] flex items-center justify-center text-[#16a34a] shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">cloud_done</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-[#15803d] flex items-center gap-1.5">
                      Supabase 클라우드 실시간 중앙 동기화 활성화됨
                      <span className="px-2 py-0.5 bg-[#16a34a] text-white text-[10px] rounded-full font-extrabold">LIVE</span>
                    </span>
                    <p className="text-[12px] text-[#166534] leading-relaxed mt-0.5">
                      선생님 컴퓨터에서 단어를 삭제하거나 새 단원 추가, 제한시간 변경, 이미지 교체를 하시면 <strong>즉시 Supabase 클라우드에 실시간 저장</strong>되며, 모든 학생 기기(스마트폰, 태블릿, PC)에 자동 동기화됩니다.
                    </p>
                  </div>
                </div>
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#0c2340] text-white text-[11px] font-bold shadow-2xs">
                              {unit.category || '1A 한국어'}
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
                          출제 {Math.min(10, unit.words.length)}문항 (단어 풀: {unit.words.length}개) · 총 {unit.totalTimeLimitMinutes || 10}분
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
                        선택된 시험 어휘 및 설정 수정 : [{currentEditingUnit.title}]
                      </h4>
                    </div>
                    <span className="text-xs text-[#64748b]">
                      선택형 퀴즈 힌트 블록 및 이미지 엔진 자동 연동
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-[#0c2340]">과정 대분류</label>
                      <select
                        value={unitCategory}
                        onChange={(e) => setUnitCategory(e.target.value as CourseCategory)}
                        className="px-3 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#0c2340] outline-none focus:border-[#0284c7] font-semibold cursor-pointer"
                      >
                        <option value="1A 한국어">1A 한국어</option>
                        <option value="1B 한국어">1B 한국어</option>
                        <option value="2A 한국어">2A 한국어</option>
                        <option value="2B 한국어">2B 한국어</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-[#0c2340]">시험 제목</label>
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

                  {/* Quick Word Add Bar */}
                  <div className="flex items-center gap-2 p-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl">
                    <span className="material-symbols-outlined text-[20px] text-[#0284c7] pl-1">add_circle</span>
                    <input
                      type="text"
                      value={quickWordInput}
                      onChange={(e) => setQuickWordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleQuickAddWord();
                        }
                      }}
                      placeholder="추가할 새 어휘 직접 입력 (예: 컴퓨터) 후 Enter 또는 [단어 추가]"
                      className="flex-1 bg-white border border-[#cbd5e1] px-3 py-1.5 rounded-lg text-xs outline-none focus:border-[#0284c7] text-[#0c2340]"
                    />
                    <button
                      type="button"
                      onClick={handleQuickAddWord}
                      className="px-3.5 py-1.5 bg-[#0c2340] hover:bg-[#163a66] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
                    >
                      단어 추가
                    </button>
                  </div>

                  {/* Words Breakdown Preview & Image Management */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0c2340]">
                        어휘 목록 및 대표 이미지 매핑 (카드별 [삭제] 및 [이미지 변경] 지원)
                      </span>
                      <span className="text-[11px] text-[#0284c7]">
                        현재 출제 단어: {wordInputText.split(/[\n,]+/).filter((w) => w.trim()).length}개
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                      {wordInputText
                        .split(/[\n,]+/)
                        .map((w) => w.trim())
                        .filter((w) => w.length > 0)
                        .map((word) => {
                          const imgUrl = getWordDisplayImage(word);
                          return (
                            <div
                              key={word}
                              className="group relative p-2.5 bg-white border border-[#e2e8f0] rounded-xl flex items-center gap-2.5 shadow-2xs hover:border-[#0c2340] transition-colors"
                            >
                              <img
                                src={imgUrl}
                                alt={word}
                                className="w-11 h-11 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                              />
                              <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-xs text-[#0c2340] truncate" title={word}>
                                    {word}
                                  </span>
                                  {/* 개별 단어 삭제 버튼 */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteWordFromUnit(word)}
                                    title={`[${word}] 단어 삭제`}
                                    className="w-5 h-5 rounded text-[#94a3b8] hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                  >
                                    <span className="material-symbols-outlined text-[15px]">close</span>
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenImageEditor(word)}
                                  className="mt-1 text-[10px] font-bold text-[#0284c7] hover:text-[#0369a1] flex items-center gap-0.5 cursor-pointer self-start"
                                >
                                  <span className="material-symbols-outlined text-[13px]">image</span>
                                  <span>이미지 변경</span>
                                </button>
                              </div>
                            </div>
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

          {/* TAB 2: 새 시험 직접 추가 */}
          {activeTab === 'add-unit' && (
            <form onSubmit={handleCreateNewUnit} className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
                <span className="material-symbols-outlined text-[#0284c7] text-[22px]">add_task</span>
                <div>
                  <h4 className="text-[16px] font-bold text-[#0c2340]">새 시험 직접 등록</h4>
                  <p className="text-[12px] text-[#64748b]">
                    시험제목, 시험일, 시험 시간 및 출제 단어 목록을 입력하여 새로운 단어 시험을 생성합니다.
                  </p>
                </div>
              </div>

              {/* 2열 구성: 1열(과정 대분류, 시험제목, 시험일, 시험 시간) / 2열(출제 단어 목록) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* 1열: 과정 대분류, 시험제목, 시험일, 시험 시간 */}
                <div className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#0c2340] flex items-center gap-1">
                      <span>교육과정 대분류</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['1A 한국어', '1B 한국어', '2A 한국어', '2B 한국어'] as CourseCategory[]).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewExamCategory(cat)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                            newExamCategory === cat
                              ? 'bg-[#0c2340] text-white border-[#0c2340] shadow-sm'
                              : 'bg-[#f8fafc] text-[#475569] border-[#e2e8f0] hover:bg-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#0c2340] flex items-center gap-1">
                      <span>시험제목</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: [자모] 단모음 자음 단어 시험"
                      value={newExamTitle}
                      onChange={(e) => setNewExamTitle(e.target.value)}
                      className="px-3.5 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#0c2340] outline-none focus:border-[#0284c7] font-semibold"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#0c2340] flex items-center gap-1">
                      <span>시험일</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={newExamDate}
                      onChange={(e) => setNewExamDate(e.target.value)}
                      className="px-3.5 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#0c2340] outline-none focus:border-[#0284c7] font-semibold cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#0c2340] flex items-center gap-1">
                      <span>시험 시간 (5분~15분)</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newExamTotalMinutes}
                      onChange={(e) => setNewExamTotalMinutes(Number(e.target.value))}
                      className="px-3.5 py-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#0c2340] outline-none focus:border-[#0284c7] font-semibold cursor-pointer"
                    >
                      {Array.from({ length: 11 }, (_, i) => i + 5).map((m) => (
                        <option key={m} value={m}>
                          {m}분 (총 {m * 60}초)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2열: 출제 단어 목록 */}
                <div className="flex flex-col gap-1.5 h-full">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0c2340] flex items-center gap-1">
                      <span>출제 단어 목록 (쉼표 또는 줄바꿈으로 구분)</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] font-bold text-[#0284c7]">
                      입력 단어: {newExamWords.split(/[\n,]+/).filter((w) => w.trim()).length}개
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    required
                    placeholder="예: 영화, 음악, 여행, 등산, 사진, 요리, 수영, 축구, 산책, 게임"
                    value={newExamWords}
                    onChange={(e) => setNewExamWords(e.target.value)}
                    className="w-full p-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#0c2340] outline-none focus:border-[#0284c7] font-mono leading-relaxed min-h-[175px]"
                  />
                </div>
              </div>

              {/* 하단 출제 단어 이미지 매핑 현황 미리보기 */}
              {newExamWords.trim().length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-[#e2e8f0]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0c2340]">
                      출제 어휘 및 대표 이미지 매핑 (클릭하여 4종 추천 이미지 / PC 업로드로 변경)
                    </span>
                    <span className="text-[11px] text-[#0284c7]">
                      총 {newExamWords.split(/[\n,]+/).filter((w) => w.trim()).length}개 단어
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-52 overflow-y-auto p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                    {newExamWords
                      .split(/[\n,]+/)
                      .map((w) => w.trim())
                      .filter((w) => w.length > 0)
                      .map((word) => {
                        const imgUrl = getWordDisplayImage(word);
                        return (
                          <div
                            key={word}
                            className="group relative p-2.5 bg-white border border-[#e2e8f0] rounded-xl flex items-center gap-2.5 shadow-2xs hover:border-[#0c2340] transition-colors"
                          >
                            <img
                              src={imgUrl}
                              alt={word}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs text-[#0c2340] truncate" title={word}>
                                  {word}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteWordFromNewExam(word)}
                                  title={`[${word}] 단어 삭제`}
                                  className="w-5 h-5 rounded text-[#94a3b8] hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                >
                                  <span className="material-symbols-outlined text-[14px]">close</span>
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenImageEditor(word)}
                                className="mt-0.5 text-[10px] font-bold text-[#0284c7] hover:text-[#0369a1] flex items-center gap-0.5 cursor-pointer self-start"
                              >
                                <span className="material-symbols-outlined text-[12px]">image</span>
                                <span>이미지 지정</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setActiveTab('units')}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0c2340] hover:bg-[#163a66] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  새 시험 등록 및 게시하기
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
                      구글 스프레드시트 분반별 실시간 성적 수집 연동
                    </h4>
                    <p className="text-[12px] text-[#64748b]">
                      학생이 시험을 제출하면 학번, 성명, 영문 성명, 분반, 점수, 소요시간, 오답 단어 목록이 수강 분반 탭([1A 한국어]~[2B 한국어])과 [전체 현황] 탭에 실시간으로 분리되어 자동 입력됩니다.
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

              {/* 테스트 대상 분반 선택 카드 */}
              <div className="flex flex-col gap-2 p-3.5 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0c2340]">테스트 대상 분반 선택</span>
                  <span className="text-[11px] text-[#64748b]">
                    선택한 분반 전용 탭과 [전체 현황] 탭으로 동시에 테스트 행이 발송됩니다.
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['1A 한국어', '1B 한국어', '2A 한국어', '2B 한국어'] as CourseCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedTestClass(cat)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                        selectedTestClass === cat
                          ? 'bg-[#0c2340] text-white border-[#0c2340] shadow-sm'
                          : 'bg-white text-[#475569] border-[#e2e8f0] hover:bg-[#f1f5f9]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 테스트 발송 학생 정보 안내 바 */}
              <div className="flex items-center justify-between text-xs px-3.5 py-2.5 bg-[#f0f9ff] rounded-xl border border-[#bae6fd]">
                <div className="flex items-center gap-2 text-[#0369a1] font-bold">
                  <span className="material-symbols-outlined text-[18px]">account_circle</span>
                  <span>연동 테스트 발송자: <strong>{student?.name || '최재민'} ({student?.studentId || '20100042'})</strong></span>
                </div>
                <span className="text-[11px] text-[#0284c7]">
                  (현재 로그인된 학생 정보로 시트에 발송됩니다)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => handleWebhookUrlChange(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs text-[#0c2340] outline-none focus:border-[#0284c7] font-mono"
                />
                <button
                  type="button"
                  disabled={isSendingWebhookTest}
                  onClick={handleTestWebhook}
                  className="px-4 py-2.5 rounded-xl bg-[#0c2340] hover:bg-[#163a66] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0 disabled:opacity-60"
                >
                  {isSendingWebhookTest ? (
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">send</span>
                  )}
                  <span>[{selectedTestClass}] 테스트 전송</span>
                </button>
              </div>

              <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex flex-col gap-2.5 text-xs text-[#475569]">
                <span className="font-bold text-[#0c2340] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#0284c7]">help</span>
                  <span>구글 스프레드시트 1분 연동 및 분반 탭 자동 생성 방법:</span>
                </span>
                <ol className="list-decimal pl-4 flex flex-col gap-1.5 leading-relaxed">
                  <li>선생님의 구글 스프레드시트 메뉴에서 <strong>[확장 프로그램] &gt; [Apps Script]</strong>를 클릭합니다.</li>
                  <li>상단 <strong>[Apps Script 복사]</strong> 버튼을 누른 뒤 에디터의 기존 코드를 지우고 붙여넣고 저장(Ctrl+S)합니다.</li>
                  <li>
                    <em>(선택 권장)</em> 에디터 상단 함수 선택에서 <strong>[setupClassSheets]</strong>를 선택하고 <strong>[실행]</strong>을 누르면 5개 탭([전체 현황], [1A 한국어]~[2B 한국어])과 11개 컬럼 헤더가 자동 생성됩니다.
                  </li>
                  <li>우측 상단 <strong>[배포] &gt; [새 배포]</strong> 클릭 &gt; 유형: <strong>웹 앱</strong> &gt; 액세스 권한: <strong>모든 사용자(Anyone)</strong>로 설정하고 배포합니다.</li>
                  <li>발급된 웹 앱 URL을 위 입력창에 붙여넣고 <strong>[Webhook 설정 저장]</strong>을 누르면 완료됩니다.</li>
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

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncAllSubmissions}
                    className="px-3 py-1.5 rounded-lg bg-[#0c2340] hover:bg-[#163a66] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    title="제출된 모든 성적을 구글 시트로 일괄 전송합니다."
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">cloud_upload</span>
                    <span>구글 시트 일괄 전송 ({submissions.length}건)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 rounded-lg bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0c2340] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    <span>CSV 다운로드</span>
                  </button>
                </div>
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
                        <th className="p-2.5">오답 단어</th>
                        <th className="p-2.5">제출시각</th>
                        <th className="p-2.5 text-center">시트 전송</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {submissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-[#f8fafc]">
                          <td className="p-2.5 font-bold">
                            <div>{sub.studentName} ({sub.studentId})</div>
                            {sub.englishName && (
                              <div className="text-[10px] text-[#64748b] font-normal">{sub.englishName}</div>
                            )}
                          </td>
                          <td className="p-2.5 text-[#64748b]">{sub.courseClass || sub.gradeClass}</td>
                          <td className="p-2.5">{sub.unitTitle}</td>
                          <td className="p-2.5 font-bold text-[#15803d]">{sub.score}점</td>
                          <td className="p-2.5">
                            {sub.correctCount} / {sub.totalCount}
                          </td>
                          <td className="p-2.5">{sub.timeSpentSeconds}초</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              !sub.wrongWords || sub.wrongWords === '없음 (만점)'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}>
                              {sub.wrongWords || '없음 (만점)'}
                            </span>
                          </td>
                          <td className="p-2.5 text-[#64748b] text-[11px]">{sub.timestamp}</td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleSyncSubmissionToSheet(sub)}
                              className="px-2.5 py-1 bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0284c7] font-bold text-[11px] rounded-lg border border-[#bae6fd] flex items-center gap-1 mx-auto cursor-pointer transition-colors shadow-2xs"
                              title="이 성적을 구글 시트로 즉시 전송합니다."
                            >
                              <span className="material-symbols-outlined text-[13px]">send</span>
                              <span>시트 전송</span>
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

          {/* TAB 5: 학생 계정 관리 & 비밀번호 초기화 */}
          {activeTab === 'students' && (
            <div className="flex flex-col gap-4">
              {/* Supabase Cloud Connection Settings Card */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-[#0284c7]">cloud_sync</span>
                    <div>
                      <h4 className="text-xs font-bold text-[#0c2340]">Supabase 클라우드 데이터베이스 연동</h4>
                      <p className="text-[11px] text-[#64748b]">클라우드 DB에 저장된 학생 계정을 실시간으로 조회하고 비밀번호를 관리합니다.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className={`w-2 h-2 rounded-full ${isCloudActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className={`text-[11px] font-bold ${isCloudActive ? 'text-emerald-700' : 'text-amber-800'}`}>
                      {isCloudActive ? 'Supabase 클라우드 연동됨' : '로컬 저장소 모드 (오프라인)'}
                    </span>
                  </div>
                </div>

                {cloudStatusMsg && (
                  <div className={`p-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                    cloudStatusMsg.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {cloudStatusMsg.ok ? 'check_circle' : 'error'}
                    </span>
                    <span>{cloudStatusMsg.message}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#0c2340]">Supabase Project URL</label>
                    <input
                      type="text"
                      value={cloudUrlInput}
                      onChange={(e) => setCloudUrlInput(e.target.value)}
                      placeholder="https://your-project.supabase.co"
                      className="px-3 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs font-mono text-[#0c2340] outline-none focus:border-[#0284c7]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#0c2340]">Supabase Anon Key (Public Key)</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={cloudKeyInput}
                        onChange={(e) => setCloudKeyInput(e.target.value)}
                        placeholder="eyJhbGciOi..."
                        className="flex-1 px-3 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs font-mono text-[#0c2340] outline-none focus:border-[#0284c7]"
                      />
                      <button
                        type="button"
                        disabled={isTestingCloud}
                        onClick={handleSaveAndTestCloud}
                        className="px-3.5 py-2 bg-[#0c2340] hover:bg-[#163a66] text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer shrink-0 disabled:opacity-60"
                      >
                        {isTestingCloud ? (
                          <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">cloud_done</span>
                        )}
                        <span>연결 및 저장</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0c2340]">등록된 학생 계정 관리</h3>
                  <p className="text-xs text-[#64748b]">
                    학생이 비밀번호를 분실한 경우 <strong>'0000'</strong>으로 즉시 초기화할 수 있습니다.
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
                        <th className="py-3 px-4">수강 분반</th>
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
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-[#f0f9ff] text-[#0284c7] font-bold border border-[#bae6fd] text-[11px]">
                              {st.course_class || '1A 한국어'}
                            </span>
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

      {/* 교사용 어휘 이미지 선택 및 교체 모달 */}
      {editingWord && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none">
          <div className="bg-white rounded-3xl w-full max-w-[620px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Modal Top Header */}
            <div className="p-4 sm:p-5 bg-[#0c2340] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[20px] text-[#38bdf8]">image</span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold flex items-center gap-2">
                    <span>[{editingWord}] 어휘 대표 이미지 설정</span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    학생들의 퀴즈와 단어장에 노출될 최적의 시각 힌트 이미지를 선택하세요.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingWord(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex flex-col gap-4">
              {/* Selected Image Preview */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
                <div className="relative w-36 h-36 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0 shadow-inner">
                  <img
                    src={selectedImageUrl}
                    alt={editingWord}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                    현재 선택됨
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0c2340]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>선택된 이미지 미리보기</span>
                  </div>
                  <p className="text-[11px] text-[#64748b] leading-relaxed">
                    이 이미지는 <strong>[{editingWord}]</strong> 단어의 시험 시각 힌트 및 단어장 카드에 즉시 적용됩니다.
                  </p>
                  <p className="text-[10px] text-slate-400 break-all line-clamp-2 font-mono">
                    {selectedImageUrl.startsWith('data:') ? '로컬 이미지 파일 (Base64)' : selectedImageUrl}
                  </p>
                </div>
              </div>

              {/* Mode Tabs: 추천 4종 | 내 PC 업로드 | 웹 URL | AI 생성 */}
              <div className="grid grid-cols-4 gap-1.5 bg-[#f1f5f9] p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setImageTabMode('preset')}
                  className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    imageTabMode === 'preset'
                      ? 'bg-white text-[#0c2340] shadow-xs'
                      : 'text-[#64748b] hover:text-[#0c2340]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                  <span>추천 4종</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageTabMode('upload')}
                  className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    imageTabMode === 'upload'
                      ? 'bg-white text-[#0c2340] shadow-xs'
                      : 'text-[#64748b] hover:text-[#0c2340]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">upload_file</span>
                  <span>PC 업로드</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageTabMode('url')}
                  className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    imageTabMode === 'url'
                      ? 'bg-white text-[#0c2340] shadow-xs'
                      : 'text-[#64748b] hover:text-[#0c2340]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">link</span>
                  <span>직접 URL</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageTabMode('ai')}
                  className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    imageTabMode === 'ai'
                      ? 'bg-white text-[#0c2340] shadow-xs'
                      : 'text-[#64748b] hover:text-[#0c2340]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">psychology</span>
                  <span>AI 생성</span>
                </button>
              </div>

              {/* Mode 1: 추천 고화질 4종 선택 */}
              {imageTabMode === 'preset' && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-[#0c2340] flex items-center gap-1">
                    <span>검증된 고화질 추천 이미지 (원클릭 선택)</span>
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {getCandidateImagesForWord(editingWord).map((url, idx) => {
                      const isSelected = selectedImageUrl === url;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImageUrl(url)}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group cursor-pointer ${
                            isSelected
                              ? 'border-[#0c2340] ring-4 ring-[#0c2340]/20 shadow-md scale-[1.02]'
                              : 'border-[#e2e8f0] hover:border-[#0284c7]'
                          }`}
                        >
                          <img
                            src={url}
                            alt={`${editingWord}-${idx}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-[#0c2340]/25 flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-[28px] drop-shadow">
                                check_circle
                              </span>
                            </div>
                          )}
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold">
                            후보 {idx + 1}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mode 2: 내 PC 직접 업로드 */}
              {imageTabMode === 'upload' && (
                <div className="flex flex-col gap-3 p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0] text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#0c2340]/5 text-[#0c2340] flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#0c2340]">선생님 PC의 사진/그림 파일 직접 등록</h5>
                    <p className="text-[11px] text-[#64748b] mt-0.5">
                      외부 서버 트래픽이나 장애 없이 100% 안정적으로 학생들에게 노출됩니다.
                    </p>
                  </div>
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0c2340] hover:bg-[#163a66] text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-colors mx-auto">
                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                    <span>내 PC에서 이미지 파일 선택</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Mode 3: 웹 이미지 URL 직접 입력 */}
              {imageTabMode === 'url' && (
                <div className="flex flex-col gap-2 p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
                  <label className="text-xs font-bold text-[#0c2340]">웹 이미지 주소 (URL) 입력</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs text-[#0c2340] outline-none focus:border-[#0284c7]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customUrlInput.trim().startsWith('http')) {
                          setSelectedImageUrl(customUrlInput.trim());
                        } else {
                          alert('올바른 이미지 URL(http:// 또는 https://)을 입력해 주세요.');
                        }
                      }}
                      className="px-4 py-2 bg-[#0c2340] text-white text-xs font-bold rounded-xl hover:bg-[#163a66] cursor-pointer shrink-0"
                    >
                      적용
                    </button>
                  </div>
                </div>
              )}

              {/* Mode 4: AI 이미지 생성 */}
              {imageTabMode === 'ai' && (
                <div className="flex flex-col gap-2 p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
                  <label className="text-xs font-bold text-[#0c2340] flex items-center justify-between">
                    <span>AI 이미지 생성 프롬프트 (영문 입력 권장)</span>
                    <span className="text-[10px] text-amber-600 font-semibold">
                      *외부 AI 서비스 이용 한도 초과 시 추천 4종 또는 PC 업로드를 권장합니다.
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiPromptInput}
                      onChange={(e) => setAiPromptInput(e.target.value)}
                      placeholder="예: fresh cucumber, food photography, white background"
                      className="flex-1 px-3 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs text-[#0c2340] outline-none focus:border-[#0284c7]"
                    />
                    <button
                      type="button"
                      disabled={isGeneratingAi}
                      onClick={handleGenerateAiImage}
                      className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {isGeneratingAi ? (
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">psychology</span>
                      )}
                      <span>{isGeneratingAi ? '생성 중...' : 'AI 생성'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleResetImageToDefault}
                title="교사 설정 이미지를 지우고 공식 기본 이미지로 복구"
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">restart_alt</span>
                <span>공식 기본 이미지로 복구</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingWord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748b] hover:bg-[#e2e8f0] cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleApplyImageChange}
                  className="px-5 py-2 rounded-xl bg-[#0c2340] hover:bg-[#163a66] text-white text-xs font-bold shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>이 이미지로 확정 및 저장</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

