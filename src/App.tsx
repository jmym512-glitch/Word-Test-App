import { useState, useEffect } from 'react';
import {
  ExamUnit,
  QuestionResult,
  LearnerProfile,
  TeacherSettings,
  TestSubmission,
  WordItem,
  CourseCategory,
} from './types';
import { INITIAL_UNITS, SEJONG_PRESET_UNITS, JAMO_UNIT, saveCustomVocabImage } from './data/defaultUnits';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { UnitSelectScreen } from './components/UnitSelectScreen';
import { TestSessionScreen } from './components/TestSessionScreen';
import { TestResultScreen } from './components/TestResultScreen';
import { TeacherSettingsModal } from './components/TeacherSettingsModal';
import { VocabBookModal } from './components/VocabBookModal';
import { StudyRecordsModal } from './components/StudyRecordsModal';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { getEffectiveWebhookUrl } from './config';

export default function App() {
  const [currentTab, setCurrentTab] = useState<
    'login' | 'unit-select' | 'test' | 'result' | 'vocab' | 'records'
  >('login');

  // 현재 로그인된 세종한국어 수강생 프로필
  const [student, setStudent] = useState<LearnerProfile | null>(() => {
    try {
      const stored = localStorage.getItem('daejin_current_student');
      return stored
        ? JSON.parse(stored)
        : {
            studentId: '20100042',
            name: '최재민',
            englishName: 'Jaemin Choi',
            courseClass: '1A 한국어',
            gradeClass: '1A 한국어',
            institution: '대진대학교 국제교류원 한국어교육센터',
            nationality: '대한민국',
          };
    } catch {
      return {
        studentId: '20100042',
        name: '최재민',
        englishName: 'Jaemin Choi',
        courseClass: '1A 한국어',
        gradeClass: '1A 한국어',
        institution: '대진대학교 국제교류원 한국어교육센터',
        nationality: '대한민국',
      };
    }
  });

  // 단원 목록 (로컬스토리지 연동 및 대분류 카테고리 보정)
  const [units, setUnits] = useState<ExamUnit[]>(() => {
    try {
      const stored = localStorage.getItem('daejin_units');
      if (stored) {
        const parsed: ExamUnit[] = JSON.parse(stored);
        const hasJamo = parsed.some(
          (u) => u.id === 'sejong-unit-jamo' || u.title.includes('자모')
        );
        let updatedList: ExamUnit[];
        if (!hasJamo) {
          updatedList = [JAMO_UNIT, ...parsed];
        } else {
          updatedList = parsed.map((u) => {
            if (u.id === 'sejong-unit-jamo' || u.title.includes('자모')) {
              return {
                ...JAMO_UNIT,
                category: '1A 한국어',
                isPublished: true,
                status: u.status || 'available',
                score: u.score,
                completedAt: u.completedAt,
              };
            }
            return u;
          });
        }
        return updatedList.map((u, i) => ({
          ...u,
          category: u.category || (i < 3 ? '1A 한국어' : '1B 한국어'),
        }));
      }
      return INITIAL_UNITS;
    } catch {
      return INITIAL_UNITS;
    }
  });

  const [activeUnit, setActiveUnit] = useState<ExamUnit>(units[0] || INITIAL_UNITS[0]);
  const [currentResults, setCurrentResults] = useState<QuestionResult[]>([]);
  const [lastTimeSpent, setLastTimeSpent] = useState<number>(252);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false);

  const [teacherSettings, setTeacherSettings] = useState<TeacherSettings>(() => {
    const effectiveUrl = getEffectiveWebhookUrl();
    try {
      const stored = localStorage.getItem('daejin_teacher_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.webhookUrl = getEffectiveWebhookUrl(parsed.webhookUrl);
        return parsed;
      }
      return {
        webhookUrl: effectiveUrl,
        currentUnitWordsText: INITIAL_UNITS[0].words.map((w) => w.word).join(', '),
        autoDecompose: true,
        institutionName: '대진대학교 국제교류원',
      };
    } catch {
      return {
        webhookUrl: effectiveUrl,
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
    try {
      localStorage.setItem('daejin_current_student', JSON.stringify(profile));
    } catch {}
    setCurrentTab('unit-select');
  };

  const handleLogout = () => {
    setStudent(null);
    try {
      localStorage.removeItem('daejin_current_student');
    } catch {}
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

    const wrongWordsList = results
      .filter((r) => !r.isCorrect)
      .map((r) => r.word)
      .join(', ');
    const wrongWords = wrongWordsList || '없음 (만점)';

    let currentStudent = student;
    if (!currentStudent) {
      try {
        const stored = localStorage.getItem('daejin_current_student');
        if (stored) currentStudent = JSON.parse(stored);
      } catch {}
    }

    const currentStudentId = currentStudent?.studentId || '20100042';
    const currentStudentName = currentStudent?.name || '최재민';
    const currentEnglishName = currentStudent?.englishName || 'Jaemin Choi';
    const currentClass = currentStudent?.courseClass || currentStudent?.gradeClass || '1A 한국어';

    const newSubmission: TestSubmission = {
      id: `sub-${Date.now()}`,
      unitId: activeUnit.id,
      unitTitle: activeUnit.title,
      studentId: currentStudentId,
      studentName: currentStudentName,
      englishName: currentEnglishName,
      courseClass: currentClass,
      institution: currentStudent?.institution || '대진대학교 국제교류원 한국어교육센터',
      score,
      correctCount,
      wrongCount,
      totalCount: totalQuestions,
      timeSpentSeconds: totalTimeSpent,
      timestamp: timestampString,
      txId: `DJU_#${Math.floor(1000 + Math.random() * 9000)}-KO`,
      syncedToGoogleSheet: true,
      questionResults: results,
      wrongWords,
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

    // 구글 스프레드시트 실시간 성적 전송
    const targetWebhookUrl = getEffectiveWebhookUrl(teacherSettings.webhookUrl);
    if (targetWebhookUrl && targetWebhookUrl.startsWith('http')) {
      try {
        fetch(targetWebhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newSubmission,
            gradeClass: newSubmission.courseClass,
          }),
        }).catch((err) => {
          console.warn('Webhook transmission error:', err);
        });
      } catch (err) {
        console.warn('Webhook transmission exception:', err);
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

  // 어휘 이미지 AI 생성 및 커스텀 이미지 업데이트
  const handleUpdateWordImage = (word: string, newImageUrl: string) => {
    saveCustomVocabImage(word, newImageUrl);
    setUnits((prev) =>
      prev.map((unit) => ({
        ...unit,
        words: unit.words.map((w) =>
          w.word === word ? { ...w, imageUrl: newImageUrl } : w
        ),
      }))
    );
  };

  // 세종한국어 1~4단원 표준 프리셋 복구
  const handleResetToPresets = () => {
    if (confirm('세종한국어 1~4단원 표준 템플릿으로 단원 목록을 초기화하시겠습니까?')) {
      setUnits(SEJONG_PRESET_UNITS);
    }
  };

  // 학생 수강 분반 업데이트 (My Page에서 변경 시 호출)
  const handleUpdateStudentCourseClass = async (newClass: CourseCategory) => {
    if (!student) return;
    const updatedStudent: LearnerProfile = {
      ...student,
      courseClass: newClass,
      gradeClass: newClass,
    };
    setStudent(updatedStudent);

    try {
      localStorage.setItem('daejin_current_student', JSON.stringify(updatedStudent));

      // daejin_users 동기화
      const usersStr = localStorage.getItem('daejin_users');
      if (usersStr) {
        const users = JSON.parse(usersStr);
        const updatedUsers = users.map((u: any) =>
          u.studentId === student.studentId ? { ...u, courseClass: newClass } : u
        );
        localStorage.setItem('daejin_users', JSON.stringify(updatedUsers));
      }

      // Supabase 클라우드 동기화
      if (isSupabaseConfigured() && student.studentId) {
        await supabase
          .from('students')
          .update({ course_class: newClass })
          .eq('student_id', student.studentId);
      }
    } catch (e) {
      console.error('Failed to sync student course class:', e);
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
            student={student}
            units={units.filter((u) => u.isPublished)}
            onClose={() => setCurrentTab('unit-select')}
            onStartUnit={handleSelectUnit}
            onUpdateWordImage={handleUpdateWordImage}
          />
        )}

        {currentTab === 'records' && student && (
          <StudyRecordsModal
            student={student}
            submissions={submissions}
            onUpdateCourseClass={handleUpdateStudentCourseClass}
            onNavigateToTest={() => setCurrentTab('unit-select')}
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
        onUpdateWordImage={handleUpdateWordImage}
        student={student}
      />
    </div>
  );
}

