/**
 * Google Gemini AI 이미지 생성 API 연동 유틸리티
 * 대진대학교 한국어 단어 시험 관리자 전용 어휘 이미지 실시간 생성기
 */

export const getStoredGeminiApiKey = (): string => {
  try {
    return localStorage.getItem('daejin_gemini_api_key') || '';
  } catch {
    return '';
  }
};

export const saveStoredGeminiApiKey = (key: string): void => {
  try {
    if (key) {
      localStorage.setItem('daejin_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('daejin_gemini_api_key');
    }
  } catch {
    // ignore
  }
};

export const getEffectiveGeminiApiKey = (): string => {
  return (
    getStoredGeminiApiKey() ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    (import.meta.env as any).GEMINI_API_KEY ||
    ''
  ).trim();
};

export const isGeminiConfigured = (): boolean => {
  const key = getEffectiveGeminiApiKey();
  return Boolean(key && key.length > 20);
};

export interface ImageGenerationOptions {
  prompt?: string;
  style?: 'illustration' | 'photo' | 'cute';
}

/**
 * 한국어 단어에 최적화된 영문 프롬프트 생성
 */
export function buildEnhancedPrompt(word: string, style: 'illustration' | 'photo' | 'cute' = 'illustration'): string {
  const cleanWord = word.trim();
  switch (style) {
    case 'photo':
      return `High quality clear studio photograph of ${cleanWord}, clean white plain background, authentic, realistic, centered, sharp focus, educational photography`;
    case 'cute':
      return `Cute 3D rendered character style illustration of ${cleanWord}, soft friendly lighting, vibrant pastel colors, clean white background, educational visual aid for students`;
    case 'illustration':
    default:
      return `Clean modern vector-style educational illustration of ${cleanWord}, clear object, simple white background, high quality iconographic style, language learning flashcard`;
  }
}

/**
 * Google AI Studio API 키에서 사용 가능한 모델 목록 확인 (진단용)
 */
export async function checkAvailableGeminiModels(apiKeyOverride?: string): Promise<{
  ok: boolean;
  models: string[];
  hasImageModel: boolean;
  error?: string;
}> {
  const apiKey = (apiKeyOverride || getEffectiveGeminiApiKey()).trim();
  if (!apiKey) return { ok: false, models: [], hasImageModel: false, error: 'API 키가 입력되지 않았습니다.' };

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, models: [], hasImageModel: false, error: err?.error?.message || `HTTP ${res.status}` };
    }
    const data = await res.json();
    const modelNames: string[] = (data.models || []).map((m: any) => (m.name || '').replace('models/', ''));
    const hasImageModel = modelNames.some((m) => m.includes('image'));
    return { ok: true, models: modelNames, hasImageModel };
  } catch (e: any) {
    return { ok: false, models: [], hasImageModel: false, error: e.message || String(e) };
  }
}

/**
 * Gemini generateContent 규격으로 이미지 생성 호출 (공식 최신 표준)
 * 대상 모델: gemini-3.1-flash-image, gemini-3.1-flash-lite-image, gemini-3-pro-image
 */
async function callGenerateContentImage(
  apiKey: string,
  modelName: string,
  prompt: string
): Promise<{ ok: boolean; imageUrl?: string; error?: string; status?: number }> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
    return { ok: false, error: msg, status: response.status };
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    const inline = part.inlineData || part.inline_data;
    if (inline?.data) {
      const mime = inline.mimeType || inline.mime_type || 'image/png';
      return { ok: true, imageUrl: `data:${mime};base64,${inline.data}` };
    }
  }

  return { ok: false, error: '응답 데이터에 생성된 이미지가 포함되지 않았습니다.' };
}

/**
 * Gemini Interactions API 규격 (v1beta/interactions)
 */
async function callInteractionsImage(
  apiKey: string,
  modelName: string,
  prompt: string
): Promise<{ ok: boolean; imageUrl?: string; error?: string; status?: number }> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      model: modelName,
      input: prompt,
      response_format: {
        type: 'image',
        aspect_ratio: '1:1',
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
    return { ok: false, error: msg, status: response.status };
  }

  const data = await response.json();

  // 1) 단축 프로퍼티
  const outImg = data?.output_image || data?.outputImage;
  if (outImg?.data) {
    const mime = outImg.mime_type || outImg.mimeType || 'image/png';
    return { ok: true, imageUrl: `data:${mime};base64,${outImg.data}` };
  }

  // 2) steps 배열
  if (Array.isArray(data?.steps)) {
    for (const step of data.steps) {
      if (step.type === 'model_output' && Array.isArray(step.content)) {
        for (const block of step.content) {
          if (block.type === 'image' && block.data) {
            const mime = block.mime_type || block.mimeType || 'image/png';
            return { ok: true, imageUrl: `data:${mime};base64,${block.data}` };
          }
        }
      }
    }
  }

  return { ok: false, error: 'Interactions 응답에 이미지 데이터가 없습니다.' };
}

/**
 * Google Gemini 공식 REST API를 호출하여 Base64 이미지 데이터 URL을 생성하여 반환합니다.
 * 구글 공식 최신 이미지 생성 모델(gemini-3.1-flash-image 및 계열)을 우선 호출하며,
 * 권한/할당량 오류 시 명확한 해결 가이드를 제공합니다.
 */
export async function generateWordImageWithGemini(
  word: string,
  customPrompt?: string,
  apiKeyOverride?: string
): Promise<{ ok: boolean; imageUrl?: string; error?: string }> {
  const apiKey = (apiKeyOverride || getEffectiveGeminiApiKey()).trim();

  if (!apiKey) {
    return {
      ok: false,
      error: 'Google Gemini API Key가 설정되지 않았습니다. API 키를 입력해 주세요.',
    };
  }

  const promptToUse = (customPrompt || '').trim() || buildEnhancedPrompt(word, 'illustration');

  let lastError = '';
  let lastStatus = 0;

  // 1순위: gemini-3.1-flash-image (공식 최신 표준 generateContent)
  try {
    const res = await callGenerateContentImage(apiKey, 'gemini-3.1-flash-image', promptToUse);
    if (res.ok && res.imageUrl) return res;
    if (res.error) {
      lastError = res.error;
      lastStatus = res.status || 0;
    }
  } catch (err: any) {
    lastError = err.message || String(err);
  }

  // 2순위: gemini-3.1-flash-lite-image (초경량 고속 모델)
  try {
    const res = await callGenerateContentImage(apiKey, 'gemini-3.1-flash-lite-image', promptToUse);
    if (res.ok && res.imageUrl) return res;
    if (res.error) {
      lastError = res.error;
      lastStatus = res.status || 0;
    }
  } catch (err: any) {
    lastError = err.message || String(err);
  }

  // 3순위: gemini-3-pro-image (고화질 모델)
  try {
    const res = await callGenerateContentImage(apiKey, 'gemini-3-pro-image', promptToUse);
    if (res.ok && res.imageUrl) return res;
    if (res.error) {
      lastError = res.error;
      lastStatus = res.status || 0;
    }
  } catch (err: any) {
    lastError = err.message || String(err);
  }

  // 4순위: interactions API 규격 시도
  try {
    const res = await callInteractionsImage(apiKey, 'gemini-3.1-flash-image', promptToUse);
    if (res.ok && res.imageUrl) return res;
    if (res.error) {
      lastError = res.error;
      lastStatus = res.status || 0;
    }
  } catch (err: any) {
    // ignore
  }

  // 사용자 친화적 에러 메시지 가공 및 해결 방안 안내
  if (lastError.includes('API_KEY_INVALID') || lastStatus === 400) {
    return {
      ok: false,
      error: '입력하신 Gemini API 키가 올바르지 않습니다. Google AI Studio에서 새로 발급받은 키를 입력해 주세요.',
    };
  }

  if (
    lastStatus === 429 ||
    lastError.includes('RESOURCE_EXHAUSTED') ||
    lastError.toLowerCase().includes('quota')
  ) {
    return {
      ok: false,
      error:
        'Google AI Studio 할당량(Quota) 초과: 구글 정책상 Gemini 이미지 생성 모델(gemini-3.1-flash-image)은 결제 수단(Pay-as-you-go)이 등록된 프로젝트에서만 사용 가능합니다(무료 티어는 쿼터 0). 결제 등록을 하시거나 상단의 [내 PC 업로드] 또는 [웹 URL 입력]을 이용해 주세요.',
    };
  }

  if (
    lastStatus === 404 ||
    lastStatus === 403 ||
    lastError.includes('not found') ||
    lastError.includes('PERMISSION_DENIED')
  ) {
    return {
      ok: false,
      error:
        'Google AI Studio 프로젝트 권한 제한: 현재 API 키에서는 이미지 모델(gemini-3.1-flash-image)이 활성화되어 있지 않습니다. 구글 AI Studio(aistudio.google.com)에서 프로젝트에 Billing(결제)을 등록하시거나, 상단의 [내 PC 업로드] 또는 [웹 URL 입력]을 이용해 주세요.',
    };
  }

  return {
    ok: false,
    error: `Gemini 이미지 생성 오류: ${lastError}`,
  };
}
