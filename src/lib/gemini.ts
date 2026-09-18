/**
 * Google Gemini (Imagen 3) API 연동 유틸리티
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
 * 한국어 단어에 최적화된 Imagen 3 영문 프롬프트 생성
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
 * Google Gemini (Imagen 3: imagen-3.0-generate-002) 공식 REST API를 호출하여
 * Base64 이미지 데이터 URL을 생성하여 반환합니다.
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

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: promptToUse,
          },
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: '1:1',
          outputOptions: {
            mimeType: 'image/jpeg',
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
      if (response.status === 400 && msg.includes('API_KEY_INVALID')) {
        return { ok: false, error: '입력하신 Gemini API 키가 유효하지 않습니다. 키를 다시 확인해 주세요.' };
      }
      if (response.status === 429) {
        return { ok: false, error: 'Google AI 사용량 한도(Quota)가 초과되었습니다. 잠시 후 다시 시도해 주세요.' };
      }
      return { ok: false, error: `Gemini 이미지 생성 오류: ${msg}` };
    }

    const data = await response.json();
    const base64Bytes = data?.predictions?.[0]?.bytesBase64Encoded;

    if (!base64Bytes) {
      return { ok: false, error: 'Gemini에서 생성된 이미지 데이터를 수신하지 못했습니다.' };
    }

    const imageUrl = `data:image/jpeg;base64,${base64Bytes}`;
    return { ok: true, imageUrl };
  } catch (err: any) {
    return {
      ok: false,
      error: `네트워크 또는 API 호출 실패: ${err.message || String(err)}`,
    };
  }
}
