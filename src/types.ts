export interface SyllableDecomposition {
  syllable: string;
  initial: string; // 초성
  medial: string;  // 중성
  final?: string;  // 종성 (받침)
}

export interface WordItem {
  id: string;
  word: string;
  promptPhrase?: string; // 연어(Collocation) 문제 제시어 (예: "배드민턴을")
  fullPhrase?: string;   // 전체 연어 구문 (예: "배드민턴을 치다")
  meaning: string;
  category: string;
  imageUrl: string;
  clueHint?: string;
  partOfSpeech?: string; // 품사 (명사, 동사, 형용사 등)
  englishMeaning?: string; // 영문 의미
  exampleSentence?: string; // 실생활 예문
  romanization?: string; // 로마자 발음
  syllables: SyllableDecomposition[];
}


export type CourseCategory = '1A 한국어' | '1B 한국어' | '2A 한국어' | '2B 한국어';

/**
 * 응시한 시험(단원)의 카테고리 또는 제목/난이도 정보를 분석하여 
 * 정확한 수강 분반('1A 한국어' | '1B 한국어' | '2A 한국어' | '2B 한국어')을 결정합니다.
 */
export function resolveExamCourseClass(
  unit?: { category?: string; title?: string; level?: string; subtitle?: string } | null,
  fallbackClass?: string
): CourseCategory {
  // 1. 단원 카테고리 정보가 명시된 경우 우선 반환
  if (unit?.category) {
    const cat = unit.category.trim();
    if (cat === '1A 한국어' || cat === '1B 한국어' || cat === '2A 한국어' || cat === '2B 한국어') {
      return cat;
    }
    if (/2B|2-B/i.test(cat)) return '2B 한국어';
    if (/2A|2-A/i.test(cat)) return '2A 한국어';
    if (/1B|1-B/i.test(cat)) return '1B 한국어';
    if (/1A|1-A/i.test(cat)) return '1A 한국어';
  }

  // 2. 단원 제목, 레벨, 부제에서 분반 키워드 감지
  if (unit) {
    const combined = `${unit.title || ''} ${unit.level || ''} ${unit.subtitle || ''}`.toUpperCase();
    if (combined.includes('2B') || combined.includes('2-B') || combined.includes('4권')) {
      return '2B 한국어';
    }
    if (combined.includes('2A') || combined.includes('2-A') || combined.includes('3권') || combined.includes('2권')) {
      return '2A 한국어';
    }
    if (combined.includes('1B') || combined.includes('1-B')) {
      return '1B 한국어';
    }
    if (combined.includes('1A') || combined.includes('1-A') || combined.includes('1권') || combined.includes('자모') || combined.includes('입문')) {
      return '1A 한국어';
    }
  }

  // 3. 학생 기존 분반 정보 폴백
  if (fallbackClass) {
    const fCat = fallbackClass.trim();
    if (fCat === '1A 한국어' || fCat === '1B 한국어' || fCat === '2A 한국어' || fCat === '2B 한국어') {
      return fCat;
    }
    if (/2B|2-B/i.test(fCat)) return '2B 한국어';
    if (/2A|2-A/i.test(fCat)) return '2A 한국어';
    if (/1B|1-B/i.test(fCat)) return '1B 한국어';
    if (/1A|1-A/i.test(fCat)) return '1A 한국어';
  }

  return '1A 한국어';
}

export interface ExamUnit {
  id: string;
  unitNumber: number;
  title: string;
  subtitle: string;
  category?: CourseCategory; // 대진대학교 한국어 정규 교육과정 대분류
  isPublished: boolean; // 교사가 등록/게시한 단원인지 여부 (false면 학생 화면에 미표시)
  status: 'in_progress' | 'available' | 'completed';
  questionCount: number;
  timePerQuestionSeconds?: number;
  totalTimeLimitMinutes?: number; // 영역(섹션) 총 시험 제한 시간 (5 ~ 15분, 1분 단위)
  wordsSummary: string;
  score?: number;
  completedAt?: string;
  words: WordItem[];
  level?: string; // 예: '세종한국어 1권', '세종한국어 2권'
}

export interface LearnerProfile {
  studentId: string; // 학번 / 수강생 번호 (예: 1111)
  password?: string;  // 비밀번호
  name: string;      // 성명
  email?: string;     // 이메일
  englishName?: string; // 영문 성명
  courseClass: string; // 수강 분반 (예: 세종한국어 1급)
  institution: string; // 소속 기관 (예: 대진대학교 국제교류원)
  nationality?: string; // 국적
  // 이전 코드와의 호환성을 위한 선택적 속성들
  gradeClass?: string;
  school?: string;
}

// 하위 호환성을 위해 StudentProfile 별칭 유지
export type StudentProfile = LearnerProfile;

export interface QuestionResult {
  questionNumber: number;
  word: string;
  promptPhrase?: string;
  fullPhrase?: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  category: string;
  syllables: SyllableDecomposition[];
}


export interface TestSubmission {
  id: string;
  unitId: string;
  unitTitle: string;
  studentId: string;
  studentName: string;
  englishName?: string;
  courseClass: string;
  gradeClass?: string;
  institution?: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  totalCount: number;
  timeSpentSeconds: number;
  timestamp: string;
  txId: string;
  syncedToGoogleSheet: boolean;
  questionResults: QuestionResult[];
  wrongWords?: string;
}

export interface TeacherSettings {
  webhookUrl: string;
  currentUnitWordsText: string;
  autoDecompose: boolean;
  institutionName?: string;
}
