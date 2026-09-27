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
 * 한국어 단어에 최적화된 FLUX.1 교육용 영문 프롬프트 생성
 */
export function buildFluxPrompt(word: string, style: 'illustration' | 'photo' | 'cute' = 'illustration'): string {
  const cleanWord = word.trim();
  switch (style) {
    case 'photo':
      return `A crisp, high quality educational photo of ${cleanWord}, authentic, realistic, centered composition, clean solid white background, 4k`;
    case 'cute':
      return `Cute friendly 3D claymation character style illustration of ${cleanWord}, cheerful soft pastel lighting, clean plain white background, educational visual aid`;
    case 'illustration':
    default:
      return `Clean modern vector-style educational illustration of ${cleanWord}, vivid colors, clear object, simple white background, high quality language flashcard graphic`;
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

  const promptToUse = (customPrompt || '').trim() || buildFluxPrompt(word, style);

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
