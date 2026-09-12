import { ExamUnit, WordItem } from '../types';
import { decomposeWord } from '../lib/hangul';

// Real curated imagery for Sejong Korean vocabulary visual clues
export const VOCAB_IMAGES: Record<string, string> = {
  // 1단원: 자기소개와 대학생활
  '한국': 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600&auto=format&fit=crop&q=80',
  '대학교': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80',
  '학생': 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80',
  '회사원': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
  '의사': 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80',
  '가방': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
  '책상': 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop&q=80',
  '교실': 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80',
  '전화': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
  '시계': 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80',

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
  '사과': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80',
  '빵': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
  '우유': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
  '주스': 'https://images.unsplash.com/photo-1622597467836-f3285f2131b7?w=600&auto=format&fit=crop&q=80',
  '물': 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80',
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
  '퇴근': 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80',
  '운동': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop&q=80',
  '공부': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
  '약속': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80',
  '버스': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
  '지하철': 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80',
};

export function createWordItem(
  word: string,
  meaning: string,
  category: string,
  clueHint?: string,
  extra?: { partOfSpeech?: string; englishMeaning?: string; exampleSentence?: string; romanization?: string }
): WordItem {
  return {
    id: `w-${word}`,
    word,
    meaning,
    category,
    imageUrl: VOCAB_IMAGES[word] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    clueHint: clueHint || `${category} 관련 세종한국어 핵심 어휘`,
    partOfSpeech: extra?.partOfSpeech || '명사',
    englishMeaning: extra?.englishMeaning || meaning.split('·')[0].trim(),
    exampleSentence: extra?.exampleSentence,
    romanization: extra?.romanization,
    syllables: decomposeWord(word),
  };
}

// 세종한국어 표준 1~4단원 템플릿 (교사가 등록 및 커스텀 편집할 수 있는 기준 데이터)
export const SEJONG_PRESET_UNITS: ExamUnit[] = [
  {
    id: 'sejong-unit-1',
    unitNumber: 1,
    title: '1단원: 자기소개와 대학생활',
    subtitle: '교사 등록 완료',
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
    isPublished: false, // 교사가 등록해야 학생 화면에 나타남
    status: 'available',
    questionCount: 10,
    timePerQuestionSeconds: 45,
    totalTimeLimitMinutes: 10,
    level: '세종한국어 1권',
    wordsSummary: '사과, 빵, 우유, 주스 등 10개',
    words: [
      createWordItem('사과', 'Apple · 과일', '음식', '새콤달콤한 대표 붉은 과일'),
      createWordItem('빵', 'Bread · 밀가루로 구운 음식', '음식', '아침 식사나 간식으로 즐겨 먹는 빵'),
      createWordItem('우유', 'Milk · 하얀 음료', '음료', '칼슘이 풍부한 유제품 음료'),
      createWordItem('주스', 'Juice · 과일 즙 음료', '음료', '달콤하고 상큼한 과즙 음료'),
      createWordItem('물', 'Water · 생명수', '음료', '갈증을 채워주는 깨끗한 물'),
      createWordItem('옷', 'Clothes · 몸에 입는 의류', '사물', '계절에 맞게 갖춰 입는 의복'),
      createWordItem('모자', 'Hat/Cap · 머리에 쓰는 소품', '사물', '햇빛을 가리거나 멋을 내는 패션 소품'),
      createWordItem('신발', 'Shoes · 발에 신는 물건', '사물', '외출할 때 발을 보호하는 운동화나 구두'),
      createWordItem('커피', 'Coffee · 대중적인 기호 음료', '음료', '원두를 추출하여 마시는 따뜻한 음료'),
      createWordItem('안경', 'Glasses · 시력 교정 도구', '사물', '눈이 잘 보이도록 돕는 렌즈 안경'),
    ],
  },
  {
    id: 'sejong-unit-4',
    unitNumber: 4,
    title: '4단원: 하루 일과와 교통 시간',
    subtitle: '교사 미등록',
    isPublished: false, // 교사가 등록해야 학생 화면에 나타남
    status: 'available',
    questionCount: 10,
    timePerQuestionSeconds: 45,
    totalTimeLimitMinutes: 10,
    level: '세종한국어 1권',
    wordsSummary: '아침, 점심, 저녁, 출근 등 10개',
    words: [
      createWordItem('아침', 'Morning/Breakfast · 하루의 시작', '시간', '해가 뜨는 이른 시간 또는 아침 식사'),
      createWordItem('점심', 'Lunch/Noon · 낮 시간', '시간', '낮 12시 무렵 또는 점심 식사'),
      createWordItem('저녁', 'Evening/Dinner · 일몰 시간', '시간', '해가 진 뒤의 시간 또는 저녁 식사'),
      createWordItem('출근', 'Going to work · 일터로 나감', '행동', '업무를 위해 직장이나 연구실로 향함'),
      createWordItem('퇴근', 'Leaving work · 업무를 마치고 귀가함', '행동', '하루 일과를 마치고 직장에서 나옴'),
      createWordItem('운동', 'Exercise/Workout · 신체 활동', '행동', '건강을 위해 몸을 움직이는 활동'),
      createWordItem('공부', 'Study · 지식을 익힘', '행동', '새로운 지식과 언어를 배우고 익힘'),
      createWordItem('약속', 'Appointment/Promise · 만날 약조', '사회', '다른 사람과 시간 및 장소를 정하여 만남'),
      createWordItem('버스', 'Bus · 대중교통 승합차', '교통', '정류장에서 많은 승객이 함께 타는 대중교통'),
      createWordItem('지하철', 'Subway/Metro · 지하 철도', '교통', '도시 지하 레일 위를 달리는 전동 열차'),
    ],
  },
];

// 앱 시작 시 사용할 초기 단원 목록 (로컬스토리지에 저장되어 교사가 편집/저장 가능)
export const INITIAL_UNITS: ExamUnit[] = SEJONG_PRESET_UNITS;

