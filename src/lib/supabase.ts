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

export const DEFAULT_SUPABASE_URL = 'https://afsmlwktxopnkenuqccq.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmc21sd2t0eG9wbmtlbnVxY2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNzI0MjksImV4cCI6MjEwNDc0ODQyOX0.NQisZeJvdUJrjSMMV6-50j-LJIaqyyrNIYBFMNqO8gM';

export const getEffectiveSupabaseConfig = () => {
  const url =
    import.meta.env.VITE_SUPABASE_URL ||
    getStoredSupabaseUrl() ||
    DEFAULT_SUPABASE_URL;
  const anonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    getStoredSupabaseAnonKey() ||
    DEFAULT_SUPABASE_ANON_KEY;

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

// ==========================================
// 클라우드 단원 및 어휘/이미지 설정 동기화 (Supabase app_config)
// ==========================================

export const fetchCloudUnits = async (): Promise<any[] | null> => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('app_config')
      .select('value')
      .eq('key', 'units')
      .maybeSingle();

    if (error) {
      console.warn('Failed to fetch units from cloud:', error);
      return null;
    }
    if (data && Array.isArray(data.value)) {
      return data.value;
    }
    return null;
  } catch (err) {
    console.warn('Exception while fetching cloud units:', err);
    return null;
  }
};

export const saveCloudUnits = async (units: any[]): Promise<boolean> => {
  try {
    const client = getSupabaseClient();
    const { error } = await client.from('app_config').upsert({
      key: 'units',
      value: units,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to save units to cloud:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception while saving cloud units:', err);
    return false;
  }
};

export const fetchCloudCustomImages = async (): Promise<Record<string, string> | null> => {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('app_config')
      .select('value')
      .eq('key', 'custom_vocab_images')
      .maybeSingle();

    if (error) {
      console.warn('Failed to fetch custom images from cloud:', error);
      return null;
    }
    if (data && data.value && typeof data.value === 'object') {
      return data.value as Record<string, string>;
    }
    return null;
  } catch (err) {
    console.warn('Exception while fetching cloud custom images:', err);
    return null;
  }
};

export const saveCloudCustomImages = async (images: Record<string, string>): Promise<boolean> => {
  try {
    const client = getSupabaseClient();
    const { error } = await client.from('app_config').upsert({
      key: 'custom_vocab_images',
      value: images,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to save custom images to cloud:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception while saving cloud custom images:', err);
    return false;
  }
};
