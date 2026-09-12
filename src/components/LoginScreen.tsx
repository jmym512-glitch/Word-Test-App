import React, { useState, useEffect } from 'react';
import { LearnerProfile } from '../types';
import { DaejinLogo } from './DaejinLogo';

interface LoginScreenProps {
  initialProfile?: LearnerProfile;
  onLogin: (profile: LearnerProfile) => void;
  onOpenTeacherSettings: () => void;
}

interface UserAccount {
  studentId: string;
  password: string;
  name: string;
  email: string;
}

// 마스터/테스트 계정 및 기본 계정
const MASTER_TEST_ACCOUNT: UserAccount = {
  studentId: '1111',
  password: '1111',
  name: '테스트 학생',
  email: 'test@daejin.ac.kr',
};

export const LoginScreen: React.FC<LoginScreenProps> = ({
  initialProfile,
  onLogin,
  onOpenTeacherSettings,
}) => {
  // 모드: 'login' | 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // 저장된 계정 목록 (로컬스토리지 연동, 추후 Supabase 연동 예정)
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const stored = localStorage.getItem('daejin_users');
      const parsed: UserAccount[] = stored ? JSON.parse(stored) : [];
      // 마스터 계정 1111이 없으면 항상 포함
      if (!parsed.some((u) => u.studentId === MASTER_TEST_ACCOUNT.studentId)) {
        return [MASTER_TEST_ACCOUNT, ...parsed];
      }
      return parsed;
    } catch {
      return [MASTER_TEST_ACCOUNT];
    }
  });

  // 로그인 폼 상태 (초기값으로 테스트 계정 1111 세팅)
  const [loginId, setLoginId] = useState(initialProfile?.studentId || '1111');
  const [loginPw, setLoginPw] = useState('1111');

  // 회원가입 폼 상태 (학번, 비밀번호, 이름, 이메일)
  const [signupId, setSignupId] = useState('');
  const [signupPw, setSignupPw] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 로컬스토리지 동기화
  useEffect(() => {
    try {
      localStorage.setItem('daejin_users', JSON.stringify(users));
    } catch {
      // ignore
    }
  }, [users]);

  // 로그인 처리
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const inputId = loginId.trim();
    const inputPw = loginPw.trim();

    if (!inputId || !inputPw) {
      setErrorMessage('학번과 비밀번호를 입력해 주세요. (Please enter Student ID and Password.)');
      return;
    }

    setIsLoading(true);

    // 계정 조회 (마스터 1111 또는 등록된 계정)
    const matched = users.find((u) => u.studentId === inputId && u.password === inputPw);

    setTimeout(() => {
      if (!matched) {
        setIsLoading(false);
        setErrorMessage('학번 또는 비밀번호가 일치하지 않습니다. (Invalid Student ID or Password.)');
        return;
      }

      onLogin({
        studentId: matched.studentId,
        password: matched.password,
        name: matched.name,
        email: matched.email,
        englishName: matched.studentId === '1111' ? 'Test Student' : undefined,
        courseClass: '세종한국어 수강반',
        institution: '대진대학교 한국학과',
        gradeClass: '세종한국어 수강반',
        school: '대진대학교 한국학과',
      });
      setIsLoading(false);
    }, 350);
  };

  // 회원가입 처리
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const inputId = signupId.trim();
    const inputPw = signupPw.trim();
    const inputName = signupName.trim();
    const inputEmail = signupEmail.trim();

    if (!inputId || !inputPw || !inputName || !inputEmail) {
      setErrorMessage('모든 항목(학번, 비밀번호, 이름, 이메일)을 입력해 주세요. (Please fill in all fields: Student ID, Password, Full Name, Email.)');
      return;
    }

    if (users.some((u) => u.studentId === inputId)) {
      setErrorMessage('이미 등록된 학번입니다. (This Student ID is already registered. Please log in or use another ID.)');
      return;
    }

    const newUser: UserAccount = {
      studentId: inputId,
      password: inputPw,
      name: inputName,
      email: inputEmail,
    };

    setUsers((prev) => [newUser, ...prev]);
    setSuccessMessage('회원가입이 완료되었습니다! 바로 로그인됩니다. (Sign up completed! Logging you in...)');

    // 가입 완료 즉시 자동 로그인
    setTimeout(() => {
      onLogin({
        studentId: newUser.studentId,
        password: newUser.password,
        name: newUser.name,
        email: newUser.email,
        courseClass: '세종한국어 수강반',
        institution: '대진대학교 한국학과',
        gradeClass: '세종한국어 수강반',
        school: '대진대학교 한국학과',
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4 select-none">
      {/* Top Header Shortcut */}
      <header className="w-full max-w-[440px] flex justify-end items-center mb-4">
        <button
          type="button"
          onClick={onOpenTeacherSettings}
          className="text-xs text-[#64748b] hover:text-[#0c2340] flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-white border border-transparent hover:border-[#e2e8f0] transition-all cursor-pointer font-medium"
        >
          <span className="material-symbols-outlined text-[15px]">settings</span>
          <span>교사용 관리 (Teacher Settings)</span>
        </button>
      </header>

      {/* Main Card */}
      <main className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#e2e8f0] p-6 sm:p-8 flex flex-col">
        {/* Brand Logo & Heading */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3 flex items-center justify-center">
            <DaejinLogo size={76} className="w-[76px] h-[76px]" />
          </div>
          <h1 className="text-[22px] font-extrabold text-[#0c2340] tracking-tight">
            대진대학교 단어 시험
          </h1>
          <p className="text-[12px] text-[#0284c7] font-bold tracking-wide mt-0.5">
            Daejin University Vocabulary Test
          </p>
          <p className="text-[13px] text-[#64748b] mt-1.5">
            {mode === 'login'
              ? '수강생 로그인 (Student Login)'
              : '신규 수강생 가입 (New Student Registration)'}
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200 text-center animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 text-center animate-in fade-in">
            {successMessage}
          </div>
        )}

        {/* 1. LOGIN MODE */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            {/* 학번 / Student ID */}
            <div className="flex flex-col gap-1 text-left">
              <label htmlFor="loginId" className="text-xs font-bold text-[#0c2340] flex items-center justify-between">
                <span>학번 (Student ID)</span>
                <span className="text-[11px] font-normal text-[#64748b]">ID</span>
              </label>
              <input
                id="loginId"
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="학번 입력 / Student ID (테스트: 1111)"
                className="w-full px-3.5 py-3 bg-[#f8fafc] focus:bg-white text-sm text-[#0c2340] rounded-xl border border-[#e2e8f0] focus:border-[#0c2340] outline-none transition-all"
              />
            </div>

            {/* 비밀번호 / Password */}
            <div className="flex flex-col gap-1 text-left">
              <label htmlFor="loginPw" className="text-xs font-bold text-[#0c2340] flex items-center justify-between">
                <span>비밀번호 (Password)</span>
                <span className="text-[11px] font-normal text-[#64748b]">PW</span>
              </label>
              <input
                id="loginPw"
                type="password"
                required
                value={loginPw}
                onChange={(e) => setLoginPw(e.target.value)}
                placeholder="비밀번호 입력 / Password (테스트: 1111)"
                className="w-full px-3.5 py-3 bg-[#f8fafc] focus:bg-white text-sm text-[#0c2340] rounded-xl border border-[#e2e8f0] focus:border-[#0c2340] outline-none transition-all"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#0c2340] hover:bg-[#163a66] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-70 mt-1"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                  <span>로그인 중... (Logging in...)</span>
                </>
              ) : (
                <span>로그인 (Login)</span>
              )}
            </button>

            {/* Test Account Quick Fill Hint */}
            <div className="bg-[#f8fafc] rounded-xl p-2.5 border border-[#e2e8f0] flex items-center justify-between text-xs text-[#64748b]">
              <span>테스트 계정 (Test): <strong>1111</strong> / <strong>1111</strong></span>
              <button
                type="button"
                onClick={() => {
                  setLoginId('1111');
                  setLoginPw('1111');
                  setErrorMessage(null);
                }}
                className="text-[11px] text-[#0284c7] font-bold hover:underline cursor-pointer"
              >
                자동 입력 (Auto Fill)
              </button>
            </div>

            {/* Switch to SignUp (Bilingual English translation provided as requested) */}
            <div className="pt-2 text-center text-xs text-[#64748b] flex items-center justify-center gap-1.5 flex-wrap">
              <span>처음 접속하셨나요? (First time here?)</span>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-[#0c2340] font-bold underline hover:text-[#0284c7] cursor-pointer"
              >
                회원가입 (Sign Up)
              </button>
            </div>
          </form>
        ) : (
          /* 2. SIGNUP MODE - 모든 내용을 영어로 완벽 번역 */
          <form onSubmit={handleSignupSubmit} className="flex flex-col gap-3.5">
            {/* Guide Banner in English & Korean */}
            <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-3 text-xs text-[#0369a1] leading-relaxed">
              <p className="font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">info</span>
                신규 회원가입 (New Student Registration)
              </p>
              <p className="text-[11px] text-[#0284c7] mt-0.5">
                Please fill in your details to create an account for Korean vocabulary tests.
              </p>
            </div>

            {/* 학번 / Student ID */}
            <div className="flex flex-col gap-1 text-left">
              <label htmlFor="signupId" className="text-xs font-bold text-[#0c2340] flex items-center justify-between">
                <span>학번 (Student ID) *</span>
                <span className="text-[10px] text-[#64748b]">Required</span>
              </label>
              <input
                id="signupId"
                type="text"
                required
                value={signupId}
                onChange={(e) => setSignupId(e.target.value)}
                placeholder="Enter Student ID (e.g. 20261050)"
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] focus:bg-white text-sm text-[#0c2340] rounded-xl border border-[#e2e8f0] focus:border-[#0c2340] outline-none transition-all"
              />
            </div>

            {/* 비밀번호 / Password */}
            <div className="flex flex-col gap-1 text-left">
              <label htmlFor="signupPw" className="text-xs font-bold text-[#0c2340] flex items-center justify-between">
                <span>비밀번호 (Password) *</span>
                <span className="text-[10px] text-[#64748b]">Required</span>
              </label>
              <input
                id="signupPw"
                type="password"
                required
                value={signupPw}
                onChange={(e) => setSignupPw(e.target.value)}
                placeholder="Enter Password"
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] focus:bg-white text-sm text-[#0c2340] rounded-xl border border-[#e2e8f0] focus:border-[#0c2340] outline-none transition-all"
              />
            </div>

            {/* 이름 / Full Name */}
            <div className="flex flex-col gap-1 text-left">
              <label htmlFor="signupName" className="text-xs font-bold text-[#0c2340] flex items-center justify-between">
                <span>이름 (Full Name) *</span>
                <span className="text-[10px] text-[#64748b]">Required</span>
              </label>
              <input
                id="signupName"
                type="text"
                required
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="e.g. Michael / Nguyen Thi Lan / 김철수"
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] focus:bg-white text-sm text-[#0c2340] rounded-xl border border-[#e2e8f0] focus:border-[#0c2340] outline-none transition-all"
              />
            </div>

            {/* 이메일 / Email */}
            <div className="flex flex-col gap-1 text-left">
              <label htmlFor="signupEmail" className="text-xs font-bold text-[#0c2340] flex items-center justify-between">
                <span>이메일 (Email) *</span>
                <span className="text-[10px] text-[#64748b]">Required</span>
              </label>
              <input
                id="signupEmail"
                type="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="e.g. student@daejin.ac.kr"
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] focus:bg-white text-sm text-[#0c2340] rounded-xl border border-[#e2e8f0] focus:border-[#0c2340] outline-none transition-all"
              />
            </div>

            {/* Sign Up Button (Translated to English) */}
            <button
              type="submit"
              className="w-full h-12 bg-[#0c2340] hover:bg-[#163a66] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm active:translate-y-0.5 transition-all cursor-pointer mt-1"
            >
              <span>Complete Sign Up (회원가입 완료)</span>
            </button>

            {/* Switch to Login (Translated to English) */}
            <div className="pt-2 text-center text-xs text-[#64748b] flex items-center justify-center gap-1.5 flex-wrap">
              <span>Already have an account? (이미 계정이 있으신가요?)</span>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-[#0c2340] font-bold underline hover:text-[#0284c7] cursor-pointer"
              >
                Back to Login (로그인으로 돌아가기)
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Bottom Footer - '대진대학교 한국학과' */}
      <footer className="mt-6 text-center select-none">
        <p className="text-xs font-bold text-[#0c2340] tracking-tight">
          대진대학교 한국학과
        </p>
        <p className="text-[11px] text-[#64748b] mt-0.5">
          Department of Korean Language & Literature, Daejin University
        </p>
      </footer>
    </div>
  );
};


