import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const getStoredSupabaseUrl = (): string => {
  try {
    return localStorage.getItem('daejin_supabase_url') || '';
  } catch {
    return '';
  }
};

export const getStoredSupabaseAnonKey = (): string => {
  try {
    return localStorage.getItem('daejin_supabase_anon_key') || '';
  } catch {
    return '';
  }
};

export const saveStoredSupabaseConfig = (url: string, key: string): void => {
  try {
    if (url) localStorage.setItem('daejin_supabase_url', url.trim());
    if (key) localStorage.setItem('daejin_supabase_anon_key', key.trim());
  } catch {
    // ignore
  }
};

export const getEffectiveSupabaseConfig = () => {
  const url =
    import.meta.env.VITE_SUPABASE_URL ||
    getStoredSupabaseUrl() ||
    'https://afsmlwktxopnkenuqccq.supabase.co';
  const anonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    getStoredSupabaseAnonKey() ||
    '';

  const isConfigured = Boolean(
    url &&
    anonKey &&
    anonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
    anonKey.trim().length > 20
  );

  return { url, anonKey, isConfigured };
};

// 동적 클라이언트 생성 및 캐싱
let currentClient: SupabaseClient | null = null;
let currentKeyUsed: string = '';
let currentUrlUsed: string = '';

export const getSupabaseClient = (): SupabaseClient => {
  const { url, anonKey } = getEffectiveSupabaseConfig();
  if (!currentClient || currentKeyUsed !== anonKey || currentUrlUsed !== url) {
    currentClient = createClient(url, anonKey || 'dummy-key-for-initialization');
    currentKeyUsed = anonKey;
    currentUrlUsed = url;
  }
  return currentClient;
};

// 기존 코드와의 100% 호환성을 위한 Proxy 객체
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const val = (client as any)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  },
});

export const isSupabaseConfigured = (): boolean => {
  return getEffectiveSupabaseConfig().isConfigured;
};

export const checkSupabaseConnection = async (): Promise<{
  ok: boolean;
  message: string;
  count?: number;
}> => {
  const { isConfigured } = getEffectiveSupabaseConfig();
  if (!isConfigured) {
    return {
      ok: false,
      message: 'Supabase Anon Key가 입력되지 않았습니다. [키 설정] 버튼을 눌러 키를 입력해 주세요.',
    };
  }

  try {
    const client = getSupabaseClient();
    const { count, error } = await client
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        ok: false,
        message: `Supabase 연결 실패: ${error.message} (코드: ${error.code})`,
      };
    }

    return {
      ok: true,
      message: `Supabase 클라우드 DB 정상 연결됨 (등록된 학생: ${count ?? 0}명)`,
      count: count ?? 0,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `네트워크 또는 연결 오류: ${err.message || String(err)}`,
    };
  }
};

export interface DbStudent {
  id?: string;
  student_id: string;
  password?: string;
  name: string;
  email: string;
  english_name?: string;
  course_class?: string;
  institution?: string;
  nationality?: string;
  created_at?: string;
}
