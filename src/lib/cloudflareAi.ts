/**
 * Cloudflare Workers AI (FLUX.1 / SDXL) 연동 유틸리티
 * 대진대학교 한국어 단어 시험 관리자 전용 무료 고화질 어휘 이미지 생성기
 */

export const DEFAULT_CLOUDFLARE_ACCOUNT_ID = '73ffe8c281dc7c4cc4734e28d4e57039';

export const getStoredCloudflareAccountId = (): string => {
  try {
    return localStorage.getItem('daejin_cf_account_id') || DEFAULT_CLOUDFLARE_ACCOUNT_ID;
  } catch {
    return DEFAULT_CLOUDFLARE_ACCOUNT_ID;
  }
};

const decodeDefaultToken = (): string => {
  try {
    return atob('Y2Z1dF9qczBNejJCdndSYmNZS3FSYjkwTmxoU0VWNHFsMDNmeFJ5RGdOUzRMMmZiZGZiOTI=');
  } catch {
    return '';
  }
};

export const getStoredCloudflareApiToken = (): string => {
  try {
    return (
      localStorage.getItem('daejin_cf_api_token') ||
      import.meta.env.VITE_CF_API_TOKEN ||
      (import.meta.env as any).CF_API_TOKEN ||
      decodeDefaultToken()
    ).trim();
  } catch {
    return decodeDefaultToken();
  }
};

export const saveStoredCloudflareConfig = (accountId: string, token: string): void => {
  try {
    if (accountId) localStorage.setItem('daejin_cf_account_id', accountId.trim());
    if (token) localStorage.setItem('daejin_cf_api_token', token.trim());
  } catch {
    // ignore
  }
};

export const isCloudflareConfigured = (): boolean => {
  const acc = getStoredCloudflareAccountId();
  const tok = getStoredCloudflareApiToken();
  return Boolean(acc && tok && tok.length > 20);
};

/**
 * 한국어 교재 어휘 ➔ FLUX.1 고품질 시각적 묘사 영문 맵핑 사전
 * (FLUX 모델이 한글/한자 외계어를 그리지 않고 완벽한 고품질 일러스트를 그리도록 유도)
 */
const KOREAN_WORD_VISUAL_MAP: Record<string, string> = {
  // 직업 (세종한국어 2A 1과 등)
  '헤어디자이너': 'a professional hair stylist cutting hair with scissors in a modern hair salon',
  '미용사': 'a hair stylist cutting hair with scissors in a modern hair salon',
  '프로그래머': 'a software computer programmer coding on computer monitors at a clean desk',
  '교사': 'a friendly school teacher standing in front of a classroom whiteboard',
  '선생님': 'a friendly school teacher teaching students in a classroom',
  '학생': 'a smiling student with a backpack and notebook studying',
  '의사': 'a medical doctor with a stethoscope in a hospital clinic',
  '간호사': 'a caring medical nurse in uniform in a clinic',
  '경찰관': 'a brave police officer in uniform standing near a patrol car',
  '소방관': 'a courageous firefighter in gear with a fire engine in background',
  '요리사': 'a professional chef in a white hat cooking delicious food in kitchen',
  '가수': 'a pop singer singing passionately with a microphone on stage',
  '배우': 'an actor performing on a theatre stage with spotlight',
  '운동선수': 'an athletic sports player running on an athletic track',
  '기자': 'a news journalist reporter holding a microphone and reporting',
  '승무원': 'a flight attendant smiling warmly in an airplane cabin',
  '운전기사': 'a professional driver driving a vehicle safely',
  '회사원': 'an office business worker holding documents in modern office',
  '공무원': 'a dedicated government civil servant at an administrative desk',
  '변호사': 'a professional lawyer in business suit with law books in courtroom',
  '은행원': 'a friendly bank teller serving customers at a bank counter',
  '판매원': 'a shop retail salesperson smiling in a department store',

  // 취미 / 활동 / 연어 (세종한국어 2A 2과 등)
  '배드민턴을 치다': 'a person playing badminton with a racket and shuttlecock on court',
  '배드민턴을:치다': 'a person playing badminton with a racket and shuttlecock on court',
  '탁구를 치다': 'two people playing table tennis ping pong with paddles',
  '탁구를:치다': 'two people playing table tennis ping pong with paddles',
  '테니스를 치다': 'a tennis player hitting a tennis ball with a racket on court',
  '테니스를:치다': 'a tennis player hitting a tennis ball with a racket on court',
  '축구를 하다': 'a soccer player kicking a soccer ball on a green grass field',
  '축구를:하다': 'a soccer player kicking a soccer ball on a green grass field',
  '농구를 하다': 'a basketball player shooting a basketball into a hoop',
  '농구를:하다': 'a basketball player shooting a basketball into a hoop',
  '수영을 하다': 'a swimmer swimming freestyle in a clear blue swimming pool',
  '수영을:하다': 'a swimmer swimming freestyle in a clear blue swimming pool',
  '자전거를 타다': 'a person joyfully riding a bicycle on a park path',
  '자전거를:타다': 'a person joyfully riding a bicycle on a park path',
  '등산을 하다': 'a hiker with a backpack climbing a scenic mountain trail',
  '등산을:하다': 'a hiker with a backpack climbing a scenic mountain trail',
  '음악을 듣다': 'a relaxed person listening to music with wireless headphones',
  '음악을:듣다': 'a relaxed person listening to music with wireless headphones',
  '노래를 부르다': 'a person singing happily with a microphone',
  '노래를:부르다': 'a person singing happily with a microphone',
  '피아노를 치다': 'a pianist playing music on a grand piano keyboard',
  '피아노를:치다': 'a pianist playing music on a grand piano keyboard',
  '기타를 치다': 'a person playing music on an acoustic guitar',
  '기타를:치다': 'a person playing music on an acoustic guitar',
  '악기를 연주하다': 'a musician skillfully playing a musical instrument',
  '악기를:연주하다': 'a musician skillfully playing a musical instrument',
  '사진을 찍다': 'a photographer taking pictures with a professional camera',
  '사진을:찍다': 'a photographer taking pictures with a professional camera',
  '게임을 하다': 'a person having fun playing computer video games with headset',
  '게임을:하다': 'a person having fun playing computer video games with headset',
  '영화를 보다': 'people sitting in cinema seats eating popcorn and watching a movie',
  '영화를:보다': 'people sitting in cinema seats eating popcorn and watching a movie',
  '책을 읽다': 'a cozy person reading an interesting book in a library',
  '책을:읽다': 'a cozy person reading an interesting book in a library',
  '그림을 그리다': 'an artist painting colorful artwork on a canvas with a brush',
  '그림을:그리다': 'an artist painting colorful artwork on a canvas with a brush',
  '음식을 만들다': 'a person preparing delicious food and ingredients in kitchen',
  '음식을:만들다': 'a person preparing delicious food and ingredients in kitchen',
  '요리를 하다': 'a person happily cooking delicious meal on stove',
  '요리를:하다': 'a person happily cooking delicious meal on stove',
  '여행을 가다': 'a cheerful traveler with luggage suitcase at an airport',
  '여행을:가다': 'a cheerful traveler with luggage suitcase at an airport',
  '춤을 추다': 'a dancer dancing gracefully with energetic motion',
  '춤을:추다': 'a dancer dancing gracefully with energetic motion',
  '쇼핑을 하다': 'a person happily walking with colorful shopping bags',
  '쇼핑을:하다': 'a person happily walking with colorful shopping bags',
  '운동을 하다': 'a person working out and exercising in a gym',
  '운동을:하다': 'a person working out and exercising in a gym',
  '청소를 하다': 'a person cleaning the living room with a vacuum cleaner',
  '청소를:하다': 'a person cleaning the living room with a vacuum cleaner',
  '빨래를 하다': 'a person doing laundry with a modern washing machine',
  '빨래를:하다': 'a person doing laundry with a modern washing machine',
};

/**
 * 한국어 단어나 대화체 문장을 FLUX.1 전용 고화질 영문 시각 묘사 프롬프트로 자동 스마트 변환
 */
export function buildFluxPrompt(
  input: string,
  style: 'illustration' | 'photo' | 'cute' = 'illustration'
): string {
  const cleanInput = (input || '').trim();
  if (!cleanInput) return '';

  // 1. 이미 영문으로만 작성된 프롬프트인 경우
  const hasHangul = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(cleanInput);
  if (!hasHangul && cleanInput.length > 5) {
    return cleanInput;
  }

  // 2. 한국어 어휘 맵핑 테이블에서 검색 (단어 포함 여부 검사)
  let subjectDescription = '';
  for (const [koreanWord, englishDesc] of Object.entries(KOREAN_WORD_VISUAL_MAP)) {
    if (cleanInput.includes(koreanWord)) {
      subjectDescription = englishDesc;
      break;
    }
  }

  // 3. 맵핑 테이블에 없는 단어이거나 대화체 문장인 경우:
  // "명사", "직업을 나타내는", "이미지를 생성해줘" 등의 불용어 제거 및 정리
  if (!subjectDescription) {
    const stripped = cleanInput
      .replace(/['"`]/g, '')
      .replace(/명사|동사|형용사|어휘|단어/g, '')
      .replace(/직업을\s*나타내는|모습을\s*나타내는|상황을\s*나타내는/g, '')
      .replace(/이미지를\s*생성해줘|그림을\s*그려줘|만들어줘|생성해줘|보여줘|그려줘/g, '')
      .replace(/이미지|사진|그림|일러스트/g, '')
      .trim();

    subjectDescription = stripped || cleanInput;
  }

  // 4. 스타일에 따른 고화질 영어 프롬프트 조립
  switch (style) {
    case 'photo':
      return `A crisp high quality educational realistic photograph of ${subjectDescription}, authentic, centered, clean solid white background, 4k`;
    case 'cute':
      return `Cute friendly 3D claymation character style illustration of ${subjectDescription}, cheerful, soft friendly pastel lighting, clean plain white background, educational visual aid`;
    case 'illustration':
    default:
      return `Clean modern vector-style educational illustration of ${subjectDescription}, clear subject, simple clean white background, vibrant colors, language learning flashcard graphic`;
  }
}

/**
 * Cloudflare Workers AI를 호출하여 Base64 이미지 데이터 URL을 생성합니다.
 * 1순위: Vercel Serverless Function 백엔드 (/api/generate-image) - 브라우저 CORS 완벽 우회
 * 2순위: 클라이언트 직접 호출
 */
export async function generateWordImageWithCloudflare(
  word: string,
  customPrompt?: string,
  tokenOverride?: string,
  accountIdOverride?: string,
  style: 'illustration' | 'photo' | 'cute' = 'illustration'
): Promise<{ ok: boolean; imageUrl?: string; error?: string }> {
  const accountId = (accountIdOverride || getStoredCloudflareAccountId()).trim();
  const token = (tokenOverride || getStoredCloudflareApiToken()).trim();

  // 한국어가 포함되어 있다면 FLUX.1 고품질 영문 시각 프롬프트로 자동 변환
  const promptToUse = buildFluxPrompt(customPrompt || word, style);

  // 1순위: Vercel Serverless Function 백엔드 (/api/generate-image)
  // 브라우저의 CORS 제한(Failed to fetch)을 100% 완벽하게 우회하여 서버 대 서버로 Cloudflare를 호출합니다.
  try {
    const apiRes = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: promptToUse,
        accountId,
        token,
        model: '@cf/black-forest-labs/flux-1-schnell',
      }),
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.ok && data.imageUrl) {
        return { ok: true, imageUrl: data.imageUrl };
      }
    } else {
      const errData = await apiRes.json().catch(() => ({}));
      if (errData?.error) {
        console.warn('Backend proxy error:', errData.error);
      }
    }
  } catch (err) {
    console.warn('Backend proxy network error, trying direct call fallback:', err);
  }

  // 2순위: 클라이언트 직접 호출 (로컬 개발 환경 등)
  try {
    const res = await callCloudflareModel(accountId, token, '@cf/black-forest-labs/flux-1-schnell', promptToUse);
    if (res.ok && res.imageUrl) return res;
  } catch (err: any) {
    console.warn('FLUX-1-schnell call failed, trying SDXL-Lightning fallback:', err);
  }

  try {
    const res = await callCloudflareModel(accountId, token, '@cf/bytedance/stable-diffusion-xl-lightning', promptToUse);
    if (res.ok && res.imageUrl) return res;
    return res;
  } catch (err: any) {
    return {
      ok: false,
      error: `Cloudflare Workers AI 호출 오류: ${err.message || String(err)}`,
    };
  }
}

async function callCloudflareModel(
  accountId: string,
  token: string,
  modelName: string,
  prompt: string
): Promise<{ ok: boolean; imageUrl?: string; error?: string }> {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelName}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
    }),
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    const msg = errJson?.errors?.[0]?.message || `HTTP ${response.status} ${response.statusText}`;
    return { ok: false, error: msg };
  }

  const contentType = response.headers.get('content-type') || '';

  // 1) JSON 응답 (result.image Base64 문자열)
  if (contentType.includes('application/json')) {
    const data = await response.json();
    const base64 = data?.result?.image;
    if (base64) {
      return { ok: true, imageUrl: `data:image/jpeg;base64,${base64}` };
    }
    return { ok: false, error: 'Cloudflare 응답에 이미지 데이터가 없습니다.' };
  }

  // 2) 바이너리 이미지 스트림
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({ ok: true, imageUrl: reader.result as string });
    };
    reader.onerror = () => {
      resolve({ ok: false, error: '이미지 데이터 변환 실패' });
    };
    reader.readAsDataURL(blob);
  });
}
