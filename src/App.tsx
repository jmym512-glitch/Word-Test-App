import { useState, useEffect } from 'react';
import {
  ExamUnit,
  QuestionResult,
  LearnerProfile,
  TeacherSettings,
  TestSubmission,
  WordItem,
} from './types';
import { INITIAL_UNITS, SEJONG_PRESET_UNITS } from './data/defaultUnits';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { UnitSelectScreen } from './components/UnitSelectScreen';
import { TestSessionScreen } from './components/TestSessionScreen';
import { TestResultScreen } from './components/TestResultScreen';
import { TeacherSettingsModal } from './components/TeacherSettingsModal';
import { VocabBookModal } from './components/VocabBookModal';
import { StudyRecordsModal } from './components/StudyRecordsModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<
    'login' | 'unit-select' | 'test' | 'result' | 'vocab' | 'records'
  >('login');

  // 현재 로그인된 세종한국어 수강생 프로필
  const [student, setStudent] = useState<LearnerProfile | null>({
    studentId: '20261042',
    name: '마이클 첸',
    englishName: 'Michael Chen',
    courseClass: '세종한국어 1급 A반',
    institution: '대진대학교 국제교류원 한국어교육센터',
    nationality: '미국',
  });

  // 단원 목록 (로컬스토리지 연동)
  const [units, setUnits] = useState<ExamUnit[]>(() => {
    try {
      const stored = localStorage.getItem('daejin_units');
      return stored ? JSON.parse(stored) : INITIAL_UNITS;
    } catch {
      return INITIAL_UNITS;
    }
  });

  const [activeUnit, setActiveUnit] = useState<ExamUnit>(units[0] || INITIAL_UNITS[0]);
  const [currentResults, setCurrentResults] = useState<QuestionResult[]>([]);
  const [lastTimeSpent, setLastTimeSpent] = useState<number>(252);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false);

  const [teacherSettings, setTeacherSettings] = useState<TeacherSettings>(() => {
    try {
      const stored = localStorage.getItem('daejin_teacher_settings');
      return stored
        ? JSON.parse(stored)
        : {
            webhookUrl:
              'https://script.google.com/macros/s/AKfycbz_daejin_korean_exam_webhook/exec',
            currentUnitWordsText: INITIAL_UNITS[0].words.map((w) => w.word).join(', '),
            autoDecompose: true,
            institutionName: '대진대학교 국제교류원',
          };
    } catch {
      return {
        webhookUrl:
          'https://script.google.com/macros/s/AKfycbz_daejin_korean_exam_webhook/exec',
        currentUnitWordsText: INITIAL_UNITS[0].words.map((w) => w.word).join(', '),
        autoDecompose: true,
        institutionName: '대진대학교 국제교류원',
      };
    }
  });

  const [submissions, setSubmissions] = useState<TestSubmission[]>(() => {
    try {
      const stored = localStorage.getItem('daejin_submissions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // 로컬스토리지 동기화
  useEffect(() => {
    try {
      localStorage.setItem('daejin_units', JSON.stringify(units));
    } catch {
      // ignore
    }
  }, [units]);

  useEffect(() => {
    try {
      localStorage.setItem('daejin_teacher_settings', JSON.stringify(teacherSettings));
    } catch {
      // ignore
    }
  }, [teacherSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('daejin_submissions', JSON.stringify(submissions));
    } catch {
      // ignore
    }
  }, [submissions]);

  // Actions
  const handleLogin = (profile: LearnerProfile) => {
    setStudent(profile);
    setCurrentTab('unit-select');
  };

  const handleLogout = () => {
    setStudent(null);
    setCurrentTab('login');
  };

  const handleSelectUnit = (unit: ExamUnit) => {
    setActiveUnit(unit);
    setCurrentTab('test');
  };

  const handleFinishTest = (results: QuestionResult[], totalTimeSpent: number) => {
    setCurrentResults(results);
    setLastTimeSpent(totalTimeSpent);

    const totalQuestions = results.length;
    const correctCount = results.filter((r) => r.isCorrect).length;
    const wrongCount = totalQuestions - correctCount;
    const score = Math.round((correctCount / totalQuestions) * 100);

    const now = new Date();
    const timestampString = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(
      2,
      '0'
    )}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(
      2,
      '0'
    )}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} KST`;

    const newSubmission: TestSubmission = {
      id: `sub-${Date.now()}`,
      unitId: activeUnit.id,
      unitTitle: activeUnit.title,
      studentId: student?.studentId || '20261042',
      studentName: student?.name || '마이클 첸',
      englishName: student?.englishName,
      courseClass: student?.courseClass || student?.gradeClass || '세종한국어 1급 A반',
      institution: student?.institution || '대진대학교 국제교류원 한국어교육센터',
      score,
      correctCount,
      wrongCount,
      totalCount: totalQuestions,
      timeSpentSeconds: totalTimeSpent,
      timestamp: timestampString,
      txId: `DJU_#${Math.floor(1000 + Math.random() * 9000)}-KO`,
      syncedToGoogleSheet: true,
      questionResults: results,
    };

    setSubmissions((prev) => [newSubmission, ...prev]);

    // Update unit status to completed with score
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id === activeUnit.id) {
          return {
            ...u,
            status: 'completed',
            score,
            completedAt: timestampString,
          };
        }
        return u;
      })
    );

    // Webhook fetch simulation
    if (teacherSettings.webhookUrl) {
      try {
        fetch(teacherSettings.webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSubmission),
        }).catch(() => {});
      } catch {
        // Handled
      }
    }

    setCurrentTab('result');
  };

  // 단원 어휘 업데이트
  const handleUpdateUnitWords = (unitId: string, newWords: WordItem[]) => {
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id === unitId) {
          return {
            ...u,
            questionCount: newWords.length,
            wordsSummary:
              newWords.slice(0, 3).map((w) => w.word).join(', ') +
              (newWords.length > 3 ? ` 등 ${newWords.length}개` : ''),
            words: newWords,
          };
        }
        return u;
      })
    );
  };

  // 단원 게시(학생 노출) 토글
  const handleToggleUnitPublish = (unitId: string, isPublished: boolean) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, isPublished } : u))
    );
  };

  // 새 단원 추가
  const handleAddUnit = (newUnit: ExamUnit) => {
    setUnits((prev) => [...prev, newUnit]);
  };

  // 단원 삭제
  const handleDeleteUnit = (unitId: string) => {
    setUnits((prev) => prev.filter((u) => u.id !== unitId));
  };

  // 단원 세부정보(제목, 시간 등) 수정
  const handleUpdateUnitDetails = (unitId: string, details: Partial<ExamUnit>) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, ...details } : u))
    );
  };

  // 세종한국어 1~4단원 표준 프리셋 복구
  const handleResetToPresets = () => {
    if (confirm('세종한국어 1~4단원 표준 템플릿으로 단원 목록을 초기화하시겠습니까?')) {
      setUnits(SEJONG_PRESET_UNITS);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0c2340] flex flex-col antialiased">
      {/* Persistent Navigation Header (Hidden only on full focus login) */}
      {currentTab !== 'login' && (
        <Header
          currentTab={currentTab}
          onNavigate={(tab) => setCurrentTab(tab)}
          onOpenTeacherSettings={() => setIsTeacherModalOpen(true)}
          student={student}
          onLogout={handleLogout}
        />
      )}

      {/* Main Screen Content */}
      <main className={`flex-1 flex flex-col ${currentTab !== 'login' ? 'pt-16' : ''}`}>
        {currentTab === 'login' && (
          <LoginScreen
            initialProfile={student || undefined}
            onLogin={handleLogin}
            onOpenTeacherSettings={() => setIsTeacherModalOpen(true)}
          />
        )}

        {currentTab === 'unit-select' && student && (
          <UnitSelectScreen
            student={student}
            units={units}
            onSelectUnit={handleSelectUnit}
            onLogout={handleLogout}
          />
        )}

        {currentTab === 'test' && (
          <TestSessionScreen
            unit={activeUnit}
            onFinishTest={handleFinishTest}
            onExit={() => setCurrentTab('unit-select')}
          />
        )}

        {currentTab === 'result' && student && (
          <TestResultScreen
            student={student}
            unit={activeUnit}
            results={currentResults}
            totalTimeSpentSeconds={lastTimeSpent}
            onReturnToUnits={() => setCurrentTab('unit-select')}
            onRetakeTest={() => setCurrentTab('test')}
          />
        )}

        {currentTab === 'vocab' && (
          <VocabBookModal
            units={units.filter((u) => u.isPublished)}
            onClose={() => setCurrentTab('unit-select')}
            onStartUnit={handleSelectUnit}
          />
        )}

        {currentTab === 'records' && student && (
          <StudyRecordsModal
            student={student}
            submissions={submissions}
            onSelectUnitToRetake={(unitId) => {
              const u = units.find((x) => x.id === unitId) || units[0];
              setActiveUnit(u);
              setCurrentTab('test');
            }}
          />
        )}
      </main>

      {/* Teacher Automation Console Modal */}
      <TeacherSettingsModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        units={units}
        onUpdateUnitWords={handleUpdateUnitWords}
        onToggleUnitPublish={handleToggleUnitPublish}
        onAddUnit={handleAddUnit}
        onDeleteUnit={handleDeleteUnit}
        onUpdateUnitDetails={handleUpdateUnitDetails}
        onResetToPresets={handleResetToPresets}
        teacherSettings={teacherSettings}
        onSaveSettings={setTeacherSettings}
        submissions={submissions}
      />
    </div>
  );
}

