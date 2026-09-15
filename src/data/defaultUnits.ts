import { ExamUnit, WordItem } from '../types';
import { decomposeWord } from '../lib/hangul';

// Real curated imagery for Sejong Korean vocabulary visual clues
export const VOCAB_IMAGES: Record<string, string> = {
  // 1단원: 자기소개와 대학생활
  '한국': 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600&auto=format&fit=crop&q=80',
  '대학교': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80',
  '학생': '/vocab/student.jpg',
  '회사원': '/vocab/office_worker.jpg',
  '의사': '/vocab/doctor.jpg',
  '가방': '/vocab/bag.jpg',
  '책상': '/vocab/desk.jpg',
  '교실': 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80',
  '전화': '/vocab/phone.jpg',
  '시계': '/vocab/clock.jpg',

  // 2단원: 일상생활과 장소
  '기숙사': 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&auto=format&fit=crop&q=80',
  '식당': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
  '도서관': 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&auto=format&fit=crop&q=80',
  '은행': 'https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?w=600&auto=format&fit=crop&q=80',
  '병원': 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80',
  '시장': 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=600&auto=format&fit=crop&q=80',
  '마트': 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80',
  '우체국': 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=600&auto=format&fit=crop&q=80',
  '약국': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80',
  '집': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',

  // 3단원: 쇼핑과 물건 사기
  '사과': '/vocab/apple.jpg',
  '빵': '/vocab/bread.jpg',
  '우유': '/vocab/milk.jpg',
  '주스': '/vocab/juice.jpg',
  '물': '/vocab/water.jpg',
  '옷': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80',
  '모자': 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=600&auto=format&fit=crop&q=80',
  '신발': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
  '커피': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80',
  '안경': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80',

  // 4단원: 하루 일과와 시간
  '아침': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
  '점심': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  '저녁': 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
  '출근': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
  '출근하다': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
  '퇴근': 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80',
  '퇴근하다': 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80',
  '운동': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop&q=80',
  '운동하다': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop&q=80',
  '공부': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
  '공부하다': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
  '약속': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80',
  // [자모] 단모음, 자음 단어 시험 어휘 38종
  '이': 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format&fit=crop&q=80',
  '오': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
  '아이': 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=600&auto=format&fit=crop&q=80',
  '오이': 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=600&auto=format&fit=crop&q=80',
  '고기': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&auto=format&fit=crop&q=80',
  '가구': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
  '가게': 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=600&auto=format&fit=crop&q=80',
  '개': 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80',
  '누나': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  '구두': 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80',
  '라디오': 'https://images.unsplash.com/photo-1593078166039-c9878df5c520?w=600&auto=format&fit=crop&q=80',
  '다리': 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80',
  '우리': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80',
  '오리': 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&auto=format&fit=crop&q=80',
  '기다리다': 'https://images.unsplash.com/photo-1508962914676-134849a727f0?w=600&auto=format&fit=crop&q=80',
  '노래': 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&auto=format&fit=crop&q=80',
  '머리': 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&auto=format&fit=crop&q=80',
  '어머니': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
  '나무': 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&auto=format&fit=crop&q=80',
  '바나나': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80',
  '바다': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
  '부부': 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=600&auto=format&fit=crop&q=80',
  '비누': 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=600&auto=format&fit=crop&q=80',
  '버스': 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&auto=format&fit=crop&q=80',
  '사다': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80',
  '사자': 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&auto=format&fit=crop&q=80',
  '소': 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=600&auto=format&fit=crop&q=80',
  '시소': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80',
  '바지': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80',
  '아버지': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
  '자다': 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&auto=format&fit=crop&q=80',
  '우주': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
  '지구': 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=600&auto=format&fit=crop&q=80',
  '지도': 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=80',
  '호수': 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=600&auto=format&fit=crop&q=80',
  '허리': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&auto=format&fit=crop&q=80',
};

// 로컬 스토리지에 저장된 교사 생성/커스텀 어휘 이미지 조회
export function getCustomVocabImages(): Record<string, string> {
  try {
    const stored = localStorage.getItem('daejin_custom_vocab_images');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// 교사가 AI로 생성하거나 설정한 어휘 이미지를 로컬 스토리지에 저장
export function saveCustomVocabImage(word: string, imageUrl: string): void {
  try {
    const current = getCustomVocabImages();
    current[word] = imageUrl;
    localStorage.setItem('daejin_custom_vocab_images', JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save custom vocab image', e);
  }
}

// 어휘의 최신 이미지 URL 반환 (커스텀 생성 > 기본 딕셔너리 > 폴백)
export function getWordDisplayImage(word: string, fallbackUrl?: string): string {
  const customImages = getCustomVocabImages();
  if (customImages[word]) return customImages[word];
  if (VOCAB_IMAGES[word]) return VOCAB_IMAGES[word];
  return fallbackUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';
}

// 교사용 이미지 선택 모달에서 사용할 단어별 고화질 추천 이미지 후보 (4종)
export const CANDIDATE_IMAGE_COLLECTIONS: Record<string, string[]> = {
  '오이': [
    'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
  ],
  '아이': [
    'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=600&auto=format&fit=crop&q=80',
  ],
  '이': [
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1571772996211-2f02c9727629?w=600&auto=format&fit=crop&q=80',
  ],
  '오': [
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  ],
  '사과': [
    '/vocab/apple.jpg',
    'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1579613832125-5d34a13ffe0a?w=600&auto=format&fit=crop&q=80',
  ],
  '학생': [
    '/vocab/student.jpg',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80',
  ],
  '회사원': [
    '/vocab/office_worker.jpg',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
  ],
  '의사': [
    '/vocab/doctor.jpg',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80',
  ],
  '한국': [
    'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1538669715315-25197b1a9992?w=600&auto=format&fit=crop&q=80',
  ],
  '대학교': [
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1562774053-701939374585?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop&q=80',
  ],
  '책상': [
    '/vocab/desk.jpg',
    'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?w=600&auto=format&fit=crop&q=80',
  ],
  '가방': [
    '/vocab/bag.jpg',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&auto=format&fit=crop&q=80',
  ],
  '시계': [
    '/vocab/clock.jpg',
    'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80',
  ],
  '전화': [
    '/vocab/phone.jpg',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=600&auto=format&fit=crop&q=80',
  ],
  '빵': [
    '/vocab/bread.jpg',
    'https://images.unsplash.com/photo-1509440159599-0249088772ff?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&auto=format&fit=crop&q=80',
  ],
  '우유': [
    '/vocab/milk.jpg',
    'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop&q=80',
  ],
  '물': [
    '/vocab/water.jpg',
    'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1559839914-17aae19cec71?w=600&auto=format&fit=crop&q=80',
  ],
  '주스': [
    '/vocab/juice.jpg',
    'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=600&auto=format&fit=crop&q=80',
  ]
};

export function getCandidateImagesForWord(word: string): string[] {
  if (CANDIDATE_IMAGE_COLLECTIONS[word]) {
    return CANDIDATE_IMAGE_COLLECTIONS[word];
  }
  const defaultImg = getWordDisplayImage(word);
  return [
    defaultImg,
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
  ];
}

// 초급 학습자를 위한 품사 표기 정규화 헬퍼 (명사(N), 동사(V), 형용사(A))
export function formatPartOfSpeech(pos?: string): string {
  if (!pos) return '명사(N)';
  const trimmed = pos.trim();
  if (trimmed === '명사' || trimmed === '명사(N)') return '명사(N)';
  if (trimmed === '동사' || trimmed === '동사(V)') return '동사(V)';
  if (trimmed === '형용사' || trimmed === '형용사(A)') return '형용사(A)';
  return trimmed
    .replace(/명사(?!\(N\))/g, '명사(N)')
    .replace(/동사(?!\(V\))/g, '동사(V)')
    .replace(/형용사(?!\(A\))/g, '형용사(A)');
}

export function createWordItem(
  word: string,
  meaning: string,
  category: string,
  clueHint?: string,
  extra?: { partOfSpeech?: string; englishMeaning?: string; exampleSentence?: string; romanization?: string; imageUrl?: string }
): WordItem {
  return {
    id: `w-${word}`,
    word,
    meaning,
    category,
    imageUrl: extra?.imageUrl || getWordDisplayImage(word),
    clueHint: clueHint || `${category} 관련 세종한국어 핵심 어휘`,
    partOfSpeech: extra?.partOfSpeech ? formatPartOfSpeech(extra.partOfSpeech) : '명사(N)',
    englishMeaning: extra?.englishMeaning || meaning.split('·')[0].trim(),
    exampleSentence: extra?.exampleSentence,
    romanization: extra?.romanization,
    syllables: decomposeWord(word),
  };
}

// [자모] 단모음, 자음 기초 단어 시험 (총 38개 어휘 중 10문항 무작위 출제)
export const JAMO_UNIT: ExamUnit = {
  id: 'sejong-unit-jamo',
  unitNumber: 0,
  title: '[자모] 단모음, 자음 단어 시험',
  subtitle: '세종한국어 입문 자모 기초 어휘',
  category: '1A 한국어',
  isPublished: true, // 1A 한국어 수강생에게 기본 공개
  status: 'available',
  questionCount: 10,
  timePerQuestionSeconds: 30,
  totalTimeLimitMinutes: 5,
  level: '세종한국어 입문',
  wordsSummary: '이, 오, 아이, 오이, 고기, 가구 등 38개',
  words: [
    createWordItem('이', 'Teeth / Two · 치아 또는 숫자 2', '신체', '음식을 씹는 입안의 하얀 치아', {
      partOfSpeech: '명사',
      englishMeaning: 'Teeth / Two',
      exampleSentence: '양치질을 해서 이가 하얗습니다.',
      romanization: 'I',
    }),
    createWordItem('오', 'Five · 숫자 5', '숫자', '넷 다음에 오는 수 다섯', {
      partOfSpeech: '명사',
      englishMeaning: 'Five',
      exampleSentence: '교실에 학생이 오(5) 명 있습니다.',
      romanization: 'O',
    }),
    createWordItem('아이', 'Child / Kid · 어린아이', '인물', '나이가 어린 귀여운 어린이', {
      partOfSpeech: '명사',
      englishMeaning: 'Child / Kid',
      exampleSentence: '아이가 밝게 웃고 있습니다.',
      romanization: 'A-i',
    }),
    createWordItem('오이', 'Cucumber · 길쭉한 채소', '음식', '초록색의 아삭하고 시원한 채소', {
      partOfSpeech: '명사',
      englishMeaning: 'Cucumber',
      exampleSentence: '여름에 시원한 오이를 먹습니다.',
      romanization: 'O-i',
    }),
    createWordItem('고기', 'Meat · 소고기, 돼지고기 등', '음식', '식용으로 먹는 동물의 살코기', {
      partOfSpeech: '명사',
      englishMeaning: 'Meat',
      exampleSentence: '저녁 식사로 맛있는 고기를 구웠습니다.',
      romanization: 'Go-gi',
    }),
    createWordItem('가구', 'Furniture · 책상, 의자, 침대 등', '사물', '집이나 방에 두고 생활에 쓰는 집기', {
      partOfSpeech: '명사',
      englishMeaning: 'Furniture',
      exampleSentence: '방에 침대와 책상 가구를 배치했습니다.',
      romanization: 'Ga-gu',
    }),
    createWordItem('가게', 'Store / Shop · 상점', '장소', '물건을 파는 작은 상점', {
      partOfSpeech: '명사',
      englishMeaning: 'Store / Shop',
      exampleSentence: '동네 가게에서 간식을 샀습니다.',
      romanization: 'Ga-ge',
    }),
    createWordItem('개', 'Dog · 충직한 반려동물', '동물', '사람을 잘 따르고 꼬리를 흔드는 동물', {
      partOfSpeech: '명사',
      englishMeaning: 'Dog',
      exampleSentence: '귀여운 개가 공원에서 뛰어놉니다.',
      romanization: 'Gae',
    }),
    createWordItem('누나', 'Older Sister · 남자의 손위 누이', '가족', '남동생 입장에서 부르는 친누나', {
      partOfSpeech: '명사',
      englishMeaning: 'Older Sister',
      exampleSentence: '우리 누나는 대학생입니다.',
      romanization: 'Nu-na',
    }),
    createWordItem('구두', 'Dress Shoes · 가죽 신발', '사물', '정장이나 격식 있는 옷에 신는 신발', {
      partOfSpeech: '명사',
      englishMeaning: 'Dress Shoes',
      exampleSentence: '면접을 보러 갈 때 검은색 구두를 신었습니다.',
      romanization: 'Gu-du',
    }),
    createWordItem('라디오', 'Radio · 소리 방송 수신기', '사물', '음악과 뉴스를 들려주는 음성 기기', {
      partOfSpeech: '명사',
      englishMeaning: 'Radio',
      exampleSentence: '아침마다 라디오에서 흘러나오는 노래를 듣습니다.',
      romanization: 'Ra-di-o',
    }),
    createWordItem('다리', 'Leg / Bridge · 신체 부위 또는 교량', '신체', '몸을 지탱하고 걸을 때 쓰는 두 다리', {
      partOfSpeech: '명사',
      englishMeaning: 'Leg / Bridge',
      exampleSentence: '오래 걸어서 다리가 아픕니다.',
      romanization: 'Da-ri',
    }),
    createWordItem('우리', 'We / Us · 나를 포함한 사람들', '사람', '나와 함께 있는 친구나 동료들', {
      partOfSpeech: '명사',
      englishMeaning: 'We / Us',
      exampleSentence: '우리는 대진대학교 학생입니다.',
      romanization: 'U-ri',
    }),
    createWordItem('오리', 'Duck · 물에 뜨는 새', '동물', '꽥꽥 소리를 내며 헤엄치는 물새', {
      partOfSpeech: '명사',
      englishMeaning: 'Duck',
      exampleSentence: '호수에 귀여운 오리 가족이 헤엄칩니다.',
      romanization: 'O-ri',
    }),
    createWordItem('기다리다', 'To wait · 때를 기다림', '행동', '사람이나 시간이 오기를 기대하며 머무름', {
      partOfSpeech: '동사',
      englishMeaning: 'To wait',
      exampleSentence: '버스 정류장에서 친구를 기다립니다.',
      romanization: 'Gi-da-ri-da',
    }),
    createWordItem('노래', 'Song · 곡조가 있는 음악', '음악', '목소리로 멜로디와 가사를 부름', {
      partOfSpeech: '명사',
      englishMeaning: 'Song',
      exampleSentence: '한국 노래를 부르는 것을 좋아합니다.',
      romanization: 'No-rae',
    }),
    createWordItem('머리', 'Head / Hair · 두부 또는 모발', '신체', '생각을 하는 신체의 맨 윗부분', {
      partOfSpeech: '명사',
      englishMeaning: 'Head / Hair',
      exampleSentence: '시험공부를 열심히 해서 머리가 지끈거립니다.',
      romanization: 'Meo-ri',
    }),
    createWordItem('어머니', 'Mother · 낳아주신 어머니', '가족', '자식을 사랑으로 키워주신 부모님', {
      partOfSpeech: '명사',
      englishMeaning: 'Mother',
      exampleSentence: '어머니께서 맛있는 김치찌개를 끓여 주셨습니다.',
      romanization: 'Eo-meo-ni',
    }),
    createWordItem('나무', 'Tree · 줄기와 잎이 있는 식물', '자연', '뿌리가 깊고 푸른 잎을 지닌 큰 식물', {
      partOfSpeech: '명사',
      englishMeaning: 'Tree',
      exampleSentence: '캠퍼스 공원에 큰 나무가 많습니다.',
      romanization: 'Na-mu',
    }),
    createWordItem('바나나', 'Banana · 노란 열대 과일', '음식', '껍질을 벗겨 먹는 달콤하고 부드러운 과일', {
      partOfSpeech: '명사',
      englishMeaning: 'Banana',
      exampleSentence: '아침 식사로 노란 바나나를 먹었습니다.',
      romanization: 'Ba-na-na',
    }),
    createWordItem('바다', 'Sea / Ocean · 푸른 바닷물', '자연', '지구 표면을 덮고 있는 넓고 푸른 물', {
      partOfSpeech: '명사',
      englishMeaning: 'Sea / Ocean',
      exampleSentence: '여름 방학에 동해 바다로 여행을 갔습니다.',
      romanization: 'Ba-da',
    }),
    createWordItem('부부', 'Married Couple · 남편과 아내', '가족', '결혼하여 가정을 이룬 남녀 한 쌍', {
      partOfSpeech: '명사',
      englishMeaning: 'Married Couple',
      exampleSentence: '두 분은 금슬이 아주 좋은 부부입니다.',
      romanization: 'Bu-bu',
    }),
    createWordItem('비누', 'Soap · 세면용 세정제', '사물', '손과 몸을 깨끗하게 씻는 세정제', {
      partOfSpeech: '명사',
      englishMeaning: 'Soap',
      exampleSentence: '외출 후 비누로 손을 깨끗이 씻습니다.',
      romanization: 'Bi-nu',
    }),
    createWordItem('버스', 'Bus · 대중교통 승합차', '교통', '정류장에서 많은 승객이 함께 타는 대중교통', {
      partOfSpeech: '명사',
      englishMeaning: 'Bus',
      exampleSentence: '대학교 앞 정류장에서 버스를 탑니다.',
      romanization: 'Beo-seu',
    }),
    createWordItem('사다', 'To buy · 물건을 구입함', '행동', '돈을 지불하고 물품을 얻음', {
      partOfSpeech: '동사',
      englishMeaning: 'To buy',
      exampleSentence: '서점에서 한국어 교재를 샀습니다.',
      romanization: 'Sa-da',
    }),
    createWordItem('사자', 'Lion · 백수의 왕', '동물', '갈기가 멋있고 용맹한 맹수', {
      partOfSpeech: '명사',
      englishMeaning: 'Lion',
      exampleSentence: '동물원에서 멋진 수사자를 보았습니다.',
      romanization: 'Sa-ja',
    }),
    createWordItem('소', 'Cow / Ox · 온순한 가축', '동물', '우유와 고기를 주는 온순한 동물', {
      partOfSpeech: '명사',
      englishMeaning: 'Cow / Ox',
      exampleSentence: '목장에서 풀을 뜯는 소들이 평화롭습니다.',
      romanization: 'So',
    }),
    createWordItem('시소', 'Seesaw · 놀이터 놀이기구', '놀이', '양쪽에 앉아 번갈아 오르내리는 놀이기구', {
      partOfSpeech: '명사',
      englishMeaning: 'Seesaw',
      exampleSentence: '아이들이 놀이터에서 재미있게 시소를 탑니다.',
      romanization: 'Si-so',
    }),
    createWordItem('바지', 'Pants / Trousers · 다리에 입는 옷', '사물', '허리에서 발목까지 감싸는 편안한 하의', {
      partOfSpeech: '명사',
      englishMeaning: 'Pants / Trousers',
      exampleSentence: '새로 산 청바지가 아주 편합니다.',
      romanization: 'Ba-ji',
    }),
    createWordItem('아버지', 'Father · 낳아주신 아버지', '가족', '자식을 든든하게 지켜주시는 부모님', {
      partOfSpeech: '명사',
      englishMeaning: 'Father',
      exampleSentence: '아버지께 감사의 편지를 썼습니다.',
      romanization: 'A-beo-ji',
    }),
    createWordItem('모자', 'Hat / Cap · 머리에 쓰는 물건', '사물', '햇빛을 가리거나 멋으로 쓰는 모자', {
      partOfSpeech: '명사',
      englishMeaning: 'Hat / Cap',
      exampleSentence: '햇빛이 강해서 캡 모자를 썼습니다.',
      romanization: 'Mo-ja',
    }),
    createWordItem('자다', 'To sleep · 잠을 잠', '행동', '눈을 감고 편안하게 휴식을 취함', {
      partOfSpeech: '동사',
      englishMeaning: 'To sleep',
      exampleSentence: '밤 11시에 침대에서 깊이 잡니다.',
      romanization: 'Ja-da',
    }),
    createWordItem('주스', 'Juice · 달콤한 과일 음료', '음료', '과일을 갈거나 착즙하여 마시는 음료', {
      partOfSpeech: '명사',
      englishMeaning: 'Juice',
      exampleSentence: '시원한 오렌지 주스를 한 잔 마셨습니다.',
      romanization: 'Ju-seu',
    }),
    createWordItem('우주', 'Space / Universe · 별과 은하의 세계', '자연', '지구 밖 무한히 넓은 별들의 공간', {
      partOfSpeech: '명사',
      englishMeaning: 'Space / Universe',
      exampleSentence: '밤하늘을 보며 신비로운 우주를 상상합니다.',
      romanization: 'U-ju',
    }),
    createWordItem('지구', 'Earth · 우리가 사는 푸른 행성', '자연', '태양계에서 생명이 살아 숨 쉬는 유일한 행성', {
      partOfSpeech: '명사',
      englishMeaning: 'Earth',
      exampleSentence: '지구는 우주에서 바라보면 푸른 보석 같습니다.',
      romanization: 'Ji-gu',
    }),
    createWordItem('지도', 'Map · 지형을 축소해 그린 그림', '사물', '길이나 지형, 국가를 한눈에 보는 그림', {
      partOfSpeech: '명사',
      englishMeaning: 'Map',
      exampleSentence: '캠퍼스 지도를 보며 강의실을 찾아갔습니다.',
      romanization: 'Ji-do',
    }),
    createWordItem('호수', 'Lake · 땅으로 둘러싸인 큰 물', '자연', '산과 들 사이에 맑고 잔잔하게 고인 큰 물', {
      partOfSpeech: '명사',
      englishMeaning: 'Lake',
      exampleSentence: '주말에 잔잔한 호수 주변을 산책했습니다.',
      romanization: 'Ho-su',
    }),
    createWordItem('허리', 'Waist · 몸통의 잘록한 부분', '신체', '가슴과 엉덩이 사이에 위치한 신체 부위', {
      partOfSpeech: '명사',
      englishMeaning: 'Waist',
      exampleSentence: '허리를 꼿꼿이 펴고 바른 자세로 앉습니다.',
      romanization: 'Heo-ri',
    }),
  ],
};

// 세종한국어 표준 단원 템플릿 (자모 기초 + 1~4단원)
export const SEJONG_PRESET_UNITS: ExamUnit[] = [
  JAMO_UNIT,
  {
    id: 'sejong-unit-1',
    unitNumber: 1,
    title: '1단원: 자기소개와 대학생활',
    subtitle: '교사 등록 완료',
    category: '1A 한국어',
    isPublished: true, // 기본적으로 1단원은 등록 상태로 제공되어 수강생이 바로 체험 가능
    status: 'in_progress',
    questionCount: 10,
    timePerQuestionSeconds: 45,
    totalTimeLimitMinutes: 10,
    level: '세종한국어 1권',
    wordsSummary: '한국, 대학교, 학생, 회사원 등 10개',
    words: [
      createWordItem('한국', 'Korea · 대한민국', '국가', '아시아 동쪽에 있는 나라', {
        partOfSpeech: '명사',
        englishMeaning: 'Korea',
        exampleSentence: '저는 한국 문화를 좋아합니다.',
        romanization: 'Han-guk',
      }),
      createWordItem('대학교', 'University · 고등교육기관', '장소', '학문을 깊이 연구하고 공부하는 학교', {
        partOfSpeech: '명사',
        englishMeaning: 'University',
        exampleSentence: '대진대학교에서 한국어를 배웁니다.',
        romanization: 'Dae-hak-gyo',
      }),
      createWordItem('학생', 'Student · 배움을 얻는 사람', '신분', '학교에서 공부하는 학습자', {
        partOfSpeech: '명사',
        englishMeaning: 'Student',
        exampleSentence: '저는 대진대학교 어학당 학생입니다.',
        romanization: 'Hak-saeng',
      }),
      createWordItem('회사원', 'Office Worker · 회사에 다니는 직장인', '직업', '기업이나 사무실에서 일하는 사람', {
        partOfSpeech: '명사',
        englishMeaning: 'Office Worker',
        exampleSentence: '제 친구는 서울의 회사원입니다.',
        romanization: 'Hoe-sa-won',
      }),
      createWordItem('의사', 'Doctor · 환자를 치료하는 전문인', '직업', '병원에서 아픈 사람을 진료하는 사람', {
        partOfSpeech: '명사',
        englishMeaning: 'Doctor',
        exampleSentence: '몸이 아파서 의사 선생님을 만났습니다.',
        romanization: 'Ui-sa',
      }),
      createWordItem('가방', 'Bag/Backpack · 책과 소지품을 넣는 도구', '사물', '어깨에 메거나 손에 드는 소지품 주머니', {
        partOfSpeech: '명사',
        englishMeaning: 'Bag',
        exampleSentence: '가방에 교재와 필통을 넣었습니다.',
        romanization: 'Ga-bang',
      }),
      createWordItem('책상', 'Desk · 공부하거나 일할 때 쓰는 탁자', '사물', '책을 올려놓고 공부하는 가구', {
        partOfSpeech: '명사',
        englishMeaning: 'Desk',
        exampleSentence: '교실 책상 위에 책이 있습니다.',
        romanization: 'Chaek-sang',
      }),
      createWordItem('교실', 'Classroom · 수업을 받는 방', '장소', '선생님과 학생들이 수업하는 공간', {
        partOfSpeech: '명사',
        englishMeaning: 'Classroom',
        exampleSentence: '한국어 수업 교실은 3층입니다.',
        romanization: 'Gyo-sil',
      }),
      createWordItem('전화', 'Phone/Call · 음성 통신 기기', '사물', '멀리 있는 사람과 통화하는 기기', {
        partOfSpeech: '명사',
        englishMeaning: 'Phone / Call',
        exampleSentence: '친구에게 전화를 걸었습니다.',
        romanization: 'Jeon-hwa',
      }),
      createWordItem('시계', 'Clock/Watch · 시간을 알려주는 기계', '사물', '초침과 분침으로 현재 시각을 표시하는 물건', {
        partOfSpeech: '명사',
        englishMeaning: 'Clock / Watch',
        exampleSentence: '벽시계를 보고 수업 시간을 확인합니다.',
        romanization: 'Si-gye',
      }),
    ],
  },
  {
    id: 'sejong-unit-2',
    unitNumber: 2,
    title: '2단원: 일상생활과 캠퍼스 장소',
    subtitle: '대기 중',
    category: '1A 한국어',
    isPublished: true, // 2단원도 교사가 등록한 상태
    status: 'available',
    questionCount: 10,
    timePerQuestionSeconds: 45,
    totalTimeLimitMinutes: 10,
    level: '세종한국어 1권',
    wordsSummary: '기숙사, 식당, 도서관, 은행 등 10개',
    words: [
      createWordItem('기숙사', 'Dormitory · 학생들이 생활하는 숙소', '장소', '캠퍼스 안에서 거주하는 생활관', {
        partOfSpeech: '명사',
        englishMeaning: 'Dormitory',
        exampleSentence: '수업이 끝나고 기숙사로 돌아왔습니다.',
        romanization: 'Gi-suk-sa',
      }),
      createWordItem('식당', 'Restaurant/Cafeteria · 식사하는 장소', '장소', '음식을 사 먹을 수 있는 곳', {
        partOfSpeech: '명사',
        englishMeaning: 'Restaurant',
        exampleSentence: '학생 식당에서 점심을 먹었습니다.',
        romanization: 'Sik-dang',
      }),
      createWordItem('도서관', 'Library · 책을 읽고 공부하는 곳', '장소', '수많은 서적과 열람실이 있는 곳', {
        partOfSpeech: '명사',
        englishMeaning: 'Library',
        exampleSentence: '도서관에서 한국어 시험공부를 합니다.',
        romanization: 'Do-seo-gwan',
      }),
      createWordItem('은행', 'Bank · 금융 업무를 보는 곳', '장소', '돈을 예금하거나 환전하는 금융 기관', {
        partOfSpeech: '명사',
        englishMeaning: 'Bank',
        exampleSentence: '은행에서 통장을 만들었습니다.',
        romanization: 'Eun-haeng',
      }),
      createWordItem('병원', 'Hospital/Clinic · 진료를 받는 의료기관', '장소', '의사와 간호사가 환자를 치료하는 곳', {
        partOfSpeech: '명사',
        englishMeaning: 'Hospital',
        exampleSentence: '감기에 걸려 병원에 다녀왔습니다.',
        romanization: 'Byeong-won',
      }),
      createWordItem('시장', 'Traditional Market · 장터', '장소', '신선한 식품과 물건을 파는 전통 거래 장소', {
        partOfSpeech: '명사',
        englishMeaning: 'Traditional Market',
        exampleSentence: '주말에 전통 시장을 구경했습니다.',
        romanization: 'Si-jang',
      }),
      createWordItem('마트', 'Mart/Supermarket · 대형 식료품점', '장소', '생필품과 식재료를 편리하게 구매하는 대형 매장', {
        partOfSpeech: '명사',
        englishMeaning: 'Supermarket',
        exampleSentence: '기숙사 근처 마트에서 장을 봅니다.',
        romanization: 'Ma-teu',
      }),
      createWordItem('우체국', 'Post Office · 편지와 소포를 부치는 곳', '장소', '우편물 발송 및 택배 업무를 담당하는 기관', {
        partOfSpeech: '명사',
        englishMeaning: 'Post Office',
        exampleSentence: '우체국에서 고향 가족에게 소포를 보냈습니다.',
        romanization: 'U-che-guk',
      }),
      createWordItem('약국', 'Pharmacy · 약을 조제하고 판매하는 곳', '장소', '처방전을 내고 약을 구매하는 상점', {
        partOfSpeech: '명사',
        englishMeaning: 'Pharmacy',
        exampleSentence: '약국에서 두통약을 샀습니다.',
        romanization: 'Yak-guk',
      }),
      createWordItem('집', 'Home/House · 거주하는 보금자리', '장소', '편안하게 쉬고 생활하는 주거 공간', {
        partOfSpeech: '명사',
        englishMeaning: 'Home / House',
        exampleSentence: '주말에는 집에서 휴식을 취합니다.',
        romanization: 'Jip',
      }),
    ],
  },
  {
    id: 'sejong-unit-3',
    unitNumber: 3,
    title: '3단원: 쇼핑과 물건 구매',
    subtitle: '교사 미등록',
    category: '1B 한국어',
    isPublished: false, // 교사가 등록해야 학생 화면에 나타남
    status: 'available',
    questionCount: 10,
    timePerQuestionSeconds: 45,
    totalTimeLimitMinutes: 10,
    level: '세종한국어 1권',
    wordsSummary: '사과, 빵, 우유, 주스 등 10개',
    words: [
      createWordItem('사과', 'Apple · 과일', '음식', '새콤달콤한 대표 붉은 과일', {
        partOfSpeech: '명사',
        englishMeaning: 'Apple',
        romanization: 'Sa-gwa',
      }),
      createWordItem('빵', 'Bread · 밀가루로 구운 음식', '음식', '아침 식사나 간식으로 즐겨 먹는 빵', {
        partOfSpeech: '명사',
        englishMeaning: 'Bread',
        romanization: 'Ppang',
      }),
      createWordItem('우유', 'Milk · 하얀 음료', '음료', '칼슘이 풍부한 유제품 음료', {
        partOfSpeech: '명사',
        englishMeaning: 'Milk',
        romanization: 'U-yu',
      }),
      createWordItem('주스', 'Juice · 과일 즙 음료', '음료', '달콤하고 상큼한 과즙 음료', {
        partOfSpeech: '명사',
        englishMeaning: 'Juice',
        romanization: 'Ju-seu',
      }),
      createWordItem('물', 'Water · 생명수', '음료', '갈증을 채워주는 깨끗한 물', {
        partOfSpeech: '명사',
        englishMeaning: 'Water',
        romanization: 'Mul',
      }),
      createWordItem('옷', 'Clothes · 몸에 입는 의류', '사물', '계절에 맞게 갖춰 입는 의복', {
        partOfSpeech: '명사',
        englishMeaning: 'Clothes',
        romanization: 'Ot',
      }),
      createWordItem('모자', 'Hat/Cap · 머리에 쓰는 소품', '사물', '햇빛을 가리거나 멋을 내는 패션 소품', {
        partOfSpeech: '명사',
        englishMeaning: 'Hat / Cap',
        romanization: 'Mo-ja',
      }),
      createWordItem('신발', 'Shoes · 발에 신는 물건', '사물', '외출할 때 발을 보호하는 운동화나 구두', {
        partOfSpeech: '명사',
        englishMeaning: 'Shoes',
        romanization: 'Sin-bal',
      }),
      createWordItem('커피', 'Coffee · 대중적인 기호 음료', '음료', '원두를 추출하여 마시는 따뜻한 음료', {
        partOfSpeech: '명사',
        englishMeaning: 'Coffee',
        romanization: 'Keo-pi',
      }),
      createWordItem('안경', 'Glasses · 시력 교정 도구', '사물', '눈이 잘 보이도록 돕는 렌즈 안경', {
        partOfSpeech: '명사',
        englishMeaning: 'Glasses',
        romanization: 'An-gyeong',
      }),
    ],
  },
  {
    id: 'sejong-unit-4',
    unitNumber: 4,
    title: '4단원: 하루 일과와 교통 시간',
    subtitle: '교사 미등록',
    category: '1B 한국어',
    isPublished: false, // 교사가 등록해야 학생 화면에 나타남
    status: 'available',
    questionCount: 10,
    timePerQuestionSeconds: 45,
    totalTimeLimitMinutes: 10,
    level: '세종한국어 1권',
    wordsSummary: '아침, 점심, 저녁, 출근하다 등 10개',
    words: [
      createWordItem('아침', 'Morning/Breakfast · 하루의 시작', '시간', '해가 뜨는 이른 시간 또는 아침 식사', {
        partOfSpeech: '명사(N)',
        englishMeaning: 'Morning / Breakfast',
        romanization: 'A-chim',
      }),
      createWordItem('점심', 'Lunch/Noon · 낮 시간', '시간', '낮 12시 무렵 또는 점심 식사', {
        partOfSpeech: '명사(N)',
        englishMeaning: 'Lunch',
        romanization: 'Jeom-sim',
      }),
      createWordItem('저녁', 'Evening/Dinner · 일몰 시간', '시간', '해가 진 뒤의 시간 또는 저녁 식사', {
        partOfSpeech: '명사(N)',
        englishMeaning: 'Evening / Dinner',
        romanization: 'Jeo-nyeok',
      }),
      createWordItem('출근하다', 'To go to work · 일터로 나감', '행동', '업무를 위해 직장이나 연구실로 향함', {
        partOfSpeech: '동사(V)',
        englishMeaning: 'To go to work',
        romanization: 'Chul-geun-ha-da',
      }),
      createWordItem('퇴근하다', 'To leave work · 업무를 마치고 귀가함', '행동', '하루 일과를 마치고 직장에서 나옴', {
        partOfSpeech: '동사(V)',
        englishMeaning: 'To leave work',
        romanization: 'Toe-geun-ha-da',
      }),
      createWordItem('운동하다', 'To exercise · 신체 활동', '행동', '건강을 위해 몸을 움직이는 활동', {
        partOfSpeech: '동사(V)',
        englishMeaning: 'To exercise',
        romanization: 'Un-dong-ha-da',
      }),
      createWordItem('공부하다', 'To study · 지식을 익힘', '행동', '새로운 지식과 언어를 배우고 익힘', {
        partOfSpeech: '동사(V)',
        englishMeaning: 'To study',
        romanization: 'Gong-bu-ha-da',
      }),
      createWordItem('약속', 'Appointment/Promise · 만날 약조', '사회', '다른 사람과 시간 및 장소를 정하여 만남', {
        partOfSpeech: '명사(N)',
        englishMeaning: 'Appointment / Promise',
        romanization: 'Yak-sok',
      }),
      createWordItem('버스', 'Bus · 대중교통 승합차', '교통', '정류장에서 많은 승객이 함께 타는 대중교통', {
        partOfSpeech: '명사(N)',
        englishMeaning: 'Bus',
        romanization: 'Beo-seu',
      }),
      createWordItem('지하철', 'Subway/Metro · 지하 철도', '교통', '도시 지하 레일 위를 달리는 전동 열차', {
        partOfSpeech: '명사(N)',
        englishMeaning: 'Subway / Metro',
        romanization: 'Ji-ha-cheol',
      }),
    ],
  },
];

// 앱 시작 시 사용할 초기 단원 목록 (로컬스토리지에 저장되어 교사가 편집/저장 가능)
export const INITIAL_UNITS: ExamUnit[] = SEJONG_PRESET_UNITS;


