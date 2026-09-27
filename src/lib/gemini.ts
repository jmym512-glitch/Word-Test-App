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
 * 최신 Google Gemini Interactions API 호출 (gemini-3.1-flash-image 등)
 */
async function callInteractionsApi(
  apiKey: string,
  model: string,
  prompt: string
): Promise<{ ok: boolean; imageUrl?: string; error?: string }> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      model,
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
    return { ok: false, error: msg };
  }

  const data = await response.json();

  // 1) 단축 프로퍼티: output_image / outputImage
  const outImg = data?.output_image || data?.outputImage;
  if (outImg?.data) {
    const mime = outImg.mime_type || outImg.mimeType || 'image/png';
    return { ok: true, imageUrl: `data:${mime};base64,${outImg.data}` };
  }

  // 2) steps 배열 내 content 블록 검사
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

  return { ok: false, error: '응답 데이터에 이미지가 포함되지 않았습니다.' };
}

/**
 * Gemini generateContent API 규격 (gemini-2.5-flash-image 등)
 */
async function callGenerateContentImageApi(
  apiKey: string,
  model: string,
  prompt: string
): Promise<{ ok: boolean; imageUrl?: string; error?: string }> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseModalities: ['IMAGE'],
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
    return { ok: false, error: msg };
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    const inline = part.inlineData || part.inline_data;
    if (inline?.data) {
      const mime = inline.mimeType || inline.mime_type || 'image/jpeg';
      return { ok: true, imageUrl: `data:${mime};base64,${inline.data}` };
    }
  }

  return { ok: false, error: 'generateContent 응답에 이미지 데이터가 없습니다.' };
}

/**
 * 레거시 Imagen predict 규격 (imagen-3.0-generate-001 등)
 */
async function callLegacyImagenPredictApi(
  apiKey: string,
  model: string,
  prompt: string
): Promise<{ ok: boolean; imageUrl?: string; error?: string }> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '1:1',
        outputOptions: { mimeType: 'image/jpeg' },
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const msg = errData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
    return { ok: false, error: msg };
  }

  const data = await response.json();
  const base64Bytes = data?.predictions?.[0]?.bytesBase64Encoded;
  if (!base64Bytes) {
    return { ok: false, error: 'Imagen predict 응답에 이미지 데이터가 없습니다.' };
  }

  return { ok: true, imageUrl: `data:image/jpeg;base64,${base64Bytes}` };
}

/**
 * Google Gemini 공식 REST API를 호출하여 Base64 이미지 데이터 URL을 생성하여 반환합니다.
 * 구글의 최신 API 개편(Imagen 3 모델 종료 및 Gemini Flash Image 규격 전환)에 맞추어
 * 다중 모델 및 엔드포인트 자동 폴백(Fallback)을 적용합니다.
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

  // 1순위: 최신 Gemini Interactions API (gemini-3.1-flash-image)
  try {
    const res = await callInteractionsApi(apiKey, 'gemini-3.1-flash-image', promptToUse);
    if (res.ok && res.imageUrl) return res;
    if (res.error) lastError = res.error;
  } catch (err: any) {
    lastError = err.message || String(err);
  }

  // 2순위: Gemini Interactions API (gemini-2.5-flash-image)
  try {
    const res = await callInteractionsApi(apiKey, 'gemini-2.5-flash-image', promptToUse);
    if (res.ok && res.imageUrl) return res;
    if (res.error) lastError = res.error;
  } catch (err: any) {
    lastError = err.message || String(err);
  }

  // 3순위: Gemini generateContent API (gemini-2.5-flash-image)
  try {
    const res = await callGenerateContentImageApi(apiKey, 'gemini-2.5-flash-image', promptToUse);
    if (res.ok && res.imageUrl) return res;
    if (res.error) lastError = res.error;
  } catch (err: any) {
    lastError = err.message || String(err);
  }

  // 4순위: 구형 Imagen 3 predict (imagen-3.0-generate-001)
  try {
    const res = await callLegacyImagenPredictApi(apiKey, 'imagen-3.0-generate-001', promptToUse);
    if (res.ok && res.imageUrl) return res;
    if (res.error) lastError = res.error;
  } catch (err: any) {
    lastError = err.message || String(err);
  }

  // 사용자 친화적 에러 메시지 가공
  if (lastError.includes('API_KEY_INVALID')) {
    return {
      ok: false,
      error: '입력하신 Gemini API 키가 올바르지 않습니다. Google AI Studio에서 발급받은 키를 다시 확인해 주세요.',
    };
  }
  if (lastError.includes('429') || lastError.includes('RESOURCE_EXHAUSTED')) {
    return {
      ok: false,
      error: 'Google AI 사용량 한도(Quota)가 초과되었습니다. 잠시 후 다시 시도해 주세요.',
    };
  }

  return {
    ok: false,
    error: `Gemini 이미지 생성 오류: ${lastError}`,
  };
}
