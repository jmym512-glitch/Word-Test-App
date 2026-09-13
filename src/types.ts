export interface SyllableDecomposition {
  syllable: string;
  initial: string; // 초성
  medial: string;  // 중성
  final?: string;  // 종성 (받침)
}

export interface WordItem {
  id: string;
  word: string;
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
