export interface QuizBlock {
  id: string;
  char: string;
  isCorrectPart: boolean;
}

// 초등/초급 한국어에서 자주 쓰이는 자연스러운 표준 음절 풀 (KS X 1001 기반 친숙한 음절)
const NATURAL_DISTRACTOR_BANK = [
  '가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하',
  '고', '노', '도', '로', '모', '보', '소', '오', '조', '초', '코', '토', '포', '호',
  '구', '누', '두', '루', '무', '부', '수', '우', '주', '추', '쿠', '투', '푸', '후',
  '기', '니', '디', '리', '미', '비', '시', '이', '지', '치', '키', '티', '피', '히',
  '개', '내', '대', '래', '매', '배', '새', '애', '재', '채', '캐', '태', '패', '해',
  '강', '남', '달', '말', '방', '산', '안', '장', '참', '학', '한', '산', '물', '문',
  '밥', '빵', '국', '집', '길', '옷', '모', '신', '발', '차', '원', '과', '화', '교',
  '생', '의', '동', '공', '정', '점', '식', '약', '시', '계', '선', '서', '상', '실',
];

// 초성, 중성, 종성 인덱스 분해
function decomposeSyllable(char: string): [number, number, number] | null {
  const code = char.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return null;
  const offset = code - 0xac00;
  const jong = offset % 28;
  const jung = Math.floor((offset / 28) % 21);
  const cho = Math.floor(offset / (28 * 21));
  return [cho, jung, jong];
}

// [초성, 중성, 종성] 합성
function composeSyllable(cho: number, jung: number, jong: number): string {
  const code = 0xac00 + cho * 21 * 28 + jung * 28 + jong;
  return String.fromCharCode(code);
}

// 자연스러운 모음 교체 풀 (0: ㅏ, 4: ㅓ, 8: ㅗ, 13: ㅜ, 18: ㅡ, 20: ㅣ, 1: ㅐ, 5: ㅔ)
const NATURAL_VOWEL_MAP: Record<number, number[]> = {
  0: [4, 8, 20, 1],   // ㅏ -> ㅓ, ㅗ, ㅣ, ㅐ
  1: [5, 0, 20],      // ㅐ -> ㅔ, ㅏ, ㅣ
  4: [0, 8, 13],      // ㅓ -> ㅏ, ㅗ, ㅜ
  5: [1, 4, 20],      // ㅔ -> ㅐ, ㅓ, ㅣ
  8: [13, 4, 0],      // ㅗ -> ㅜ, ㅓ, ㅏ
  9: [8, 0, 13],      // ㅘ -> ㅗ, ㅏ, ㅜ
  13: [8, 18, 4],     // ㅜ -> ㅗ, ㅡ, ㅓ
  18: [13, 20, 4],    // ㅡ -> ㅜ, ㅣ, ㅓ
  20: [0, 4, 18, 1],  // ㅣ -> ㅏ, ㅓ, ㅡ, ㅐ
};

// 자연스러운 초성 교체 풀 (0: ㄱ, 2: ㄷ, 5: ㄹ, 6: ㅁ, 7: ㅂ, 9: ㅅ, 11: ㅇ, 12: ㅈ, 14: ㅊ, 18: ㅎ)
const NATURAL_CHOSUNG_MAP: Record<number, number[]> = {
  0: [11, 9, 7],   // ㄱ -> ㅇ, ㅅ, ㅂ
  2: [11, 5, 0],   // ㄷ -> ㅇ, ㄹ, ㄱ
  5: [2, 11, 0],   // ㄹ -> ㄷ, ㅇ, ㄱ
  6: [7, 11, 9],   // ㅁ -> ㅂ, ㅇ, ㅅ
  7: [6, 11, 9],   // ㅂ -> ㅁ, ㅇ, ㅅ
  9: [11, 12, 0],  // ㅅ -> ㅇ, ㅈ, ㄱ
  11: [0, 9, 18],  // ㅇ -> ㄱ, ㅅ, ㅎ
  12: [9, 14, 11], // ㅈ -> ㅅ, ㅊ, ㅇ
  14: [12, 9, 11], // ㅊ -> ㅈ, ㅅ, ㅇ
  18: [11, 0, 9],  // ㅎ -> ㅇ, ㄱ, ㅅ
};

/**
 * 목표 단어의 음절과 틀리기 쉬운 자연스러운 유사 음운 블록을 생성
 * @param targetWord 목표 어휘 (예: '사과', '공부하다')
 * @param unitWordsContext 같은 단원에 포함된 다른 어휘들 (문맥상 친숙한 음절 추출용)
 * @returns 셔플된 QuizBlock[] (총 6~8개)
 */
export function generateQuizBlocks(targetWord: string, unitWordsContext?: string[]): QuizBlock[] {
  const correctChars = targetWord.split('').filter((c) => c.trim().length > 0);
  const correctSet = new Set(correctChars);
  const candidates = new Set<string>();

  // 1. 단원 내 다른 어휘의 음절들 우선 활용 (학습자가 배운 단어들이라 혼동 및 변별력 높음)
  if (unitWordsContext && unitWordsContext.length > 0) {
    for (const otherWord of unitWordsContext) {
      if (otherWord === targetWord) continue;
      for (const char of otherWord) {
        if (!correctSet.has(char)) {
          candidates.add(char);
        }
      }
    }
  }

  // 2. 목표 단어 음절의 유사 모음/초성 변형
  for (const char of correctChars) {
    const decomp = decomposeSyllable(char);
    if (!decomp) continue;
    const [cho, jung, jong] = decomp;

    // 유사 모음
    const altJungs = NATURAL_VOWEL_MAP[jung] || [0, 8, 20];
    for (const altJung of altJungs) {
      const altChar = composeSyllable(cho, altJung, jong);
      if (!correctSet.has(altChar) && NATURAL_DISTRACTOR_BANK.includes(altChar)) {
        candidates.add(altChar);
      }
    }

    // 유사 초성
    const altChos = NATURAL_CHOSUNG_MAP[cho] || [11, 9, 0];
    for (const altCho of altChos) {
      const altChar = composeSyllable(altCho, jung, jong);
      if (!correctSet.has(altChar) && NATURAL_DISTRACTOR_BANK.includes(altChar)) {
        candidates.add(altChar);
      }
    }

    // 받침 변형
    if (jong > 0) {
      const noJong = composeSyllable(cho, jung, 0);
      if (!correctSet.has(noJong)) candidates.add(noJong);
    }
  }

  // 3. 친숙한 기본 음절 풀에서 추가 보충
  const shuffledBank = [...NATURAL_DISTRACTOR_BANK].sort(() => Math.random() - 0.5);
  for (const fb of shuffledBank) {
    if (!correctSet.has(fb)) {
      candidates.add(fb);
    }
  }

  // 필요한 방해 블록 수: 단어 길이에 따라 4개~5개 (총 6~9개)
  const targetDistractorCount = Math.max(4, Math.min(5, 8 - correctChars.length));
  const distractorList = Array.from(candidates).slice(0, targetDistractorCount);

  // 최종 블록 구성
  const allBlocks: QuizBlock[] = [
    ...correctChars.map((char, i) => ({
      id: `c-${i}-${char}`,
      char,
      isCorrectPart: true,
    })),
    ...distractorList.map((char, i) => ({
      id: `d-${i}-${char}`,
      char,
      isCorrectPart: false,
    })),
  ];

  // Fisher-Yates 무작위 셔플
  for (let i = allBlocks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allBlocks[i], allBlocks[j]] = [allBlocks[j], allBlocks[i]];
  }

  return allBlocks;
}
