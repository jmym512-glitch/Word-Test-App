/**
 * 대진대학교 한국어 단어 시험 앱 공통 환경 설정 및 기본값
 */

// 구글 스프레드시트 Apps Script 웹 앱 Webhook 기본 URL (2026 연동 공식 주소)
export const DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbwdD6JlUkZFQLxhLZARmgXIYsOp1eD1RkZ2TWNjahUZuAL6fCx3bw_EOY9GbY-7eQ20/exec';

/**
 * 우선순위에 따라 유효한 Google Sheets Webhook URL을 반환합니다:
 * 1) 인자로 전달된 URL (입력창 또는 설정)
 * 2) localStorage에 저장된 URL ('daejin_webhook_url')
 * 3) 환경변수 VITE_GOOGLE_SHEETS_WEBHOOK_URL (Vercel 배포 시 설정 가능)
 * 4) DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL (기본값)
 */
export const getEffectiveWebhookUrl = (customUrl?: string): string => {
  const raw = (
    customUrl ||
    (typeof window !== 'undefined' ? localStorage.getItem('daejin_webhook_url') : '') ||
    import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL ||
    DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL
  );

  const trimmed = (raw || '').trim();

  // 기존 레거시 더미 URL이 남아있거나 비어있으면 지정해주신 공식 웹 앱 주소로 자동 마이그레이션
  if (!trimmed || trimmed.includes('AKfycbz_daejin_korean_exam_webhook')) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('daejin_webhook_url', DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL);
      } catch {}
    }
    return DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL;
  }

  return trimmed;
};
