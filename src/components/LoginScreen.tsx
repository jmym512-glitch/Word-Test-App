import React, { useState, useEffect } from 'react';
import { LearnerProfile } from '../types';
import { DaejinLogo } from './DaejinLogo';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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

  // 비밀번호 찾기(재설정) 모달 상태
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotId, setForgotId] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPw, setForgotNewPw] = useState('');
  const [forgotNewPwConfirm, setForgotNewPwConfirm] = useState('');
  const [forgotVerifiedStudent, setForgotVerifiedStudent] = useState<{ studentId: string; name: string } | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // 로컬스토리지 동기화
  useEffect(() => {
    try {
      localStorage.setItem('daejin_users', JSON.stringify(users));
    } catch {
      // ignore
    }
  }, [users]);

  // 로그인 처리 (Supabase 연동 및 로컬 폴백)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const inputId = loginId.trim();
    const inputPw = loginPw.trim();

    if (!inputId || !inputPw) {
      setErrorMessage('학번과 비밀번호를 입력해 주세요. (Please enter Student ID and Password.)');
      return;
    }

    setIsLoading(true);

    // 1. 마스터/테스트 계정(1111)은 즉시 로그인 허용
    if (inputId === MASTER_TEST_ACCOUNT.studentId && inputPw === MASTER_TEST_ACCOUNT.password) {
      setTimeout(() => {
        onLogin({
          studentId: MASTER_TEST_ACCOUNT.studentId,
          password: MASTER_TEST_ACCOUNT.password,
          name: MASTER_TEST_ACCOUNT.name,
          email: MASTER_TEST_ACCOUNT.email,
          englishName: 'Test Student',
          courseClass: '세종한국어 수강반',
          institution: '대진대학교 한국학과',
          gradeClass: '세종한국어 수강반',
          school: '대진대학교 한국학과',
        });
        setIsLoading(false);
      }, 250);
      return;
    }

    try {
      // 2. Supabase가 설정된 경우 클라우드 DB에서 조회
      if (isSupabaseConfigured) {
        const { data: dbUser, error: queryError } = await supabase
          .from('students')
          .select('*')
          .eq('student_id', inputId)
          .eq('password', inputPw)
          .maybeSingle();

        if (queryError) {
          console.warn('Supabase login check error:', queryError);
        }

        if (dbUser) {
          onLogin({
            studentId: dbUser.student_id,
            password: dbUser.password,
            name: dbUser.name,
            email: dbUser.email,
            englishName: dbUser.english_name,
            courseClass: dbUser.course_class || '세종한국어 수강반',
            institution: dbUser.institution || '대진대학교 한국학과',
            nationality: dbUser.nationality,
            gradeClass: dbUser.course_class || '세종한국어 수강반',
            school: dbUser.institution || '대진대학교 한국학과',
          });
          setIsLoading(false);
          return;
        }
      }

      // 3. 로컬스토리지에 저장된 계정 조회 (폴백)
      const matched = users.find((u) => u.studentId === inputId && u.password === inputPw);
      if (matched) {
        onLogin({
          studentId: matched.studentId,
          password: matched.password,
          name: matched.name,
          email: matched.email,
          courseClass: '세종한국어 수강반',
          institution: '대진대학교 한국학과',
          gradeClass: '세종한국어 수강반',
          school: '대진대학교 한국학과',
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setErrorMessage('학번 또는 비밀번호가 일치하지 않습니다. (Invalid Student ID or Password.)');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(`로그인 처리 중 오류가 발생했습니다: ${err.message || '다시 시도해 주세요.'}`);
    }
  };

  // 회원가입 처리 (Supabase DB 저장 및 로컬스토리지 동기화)
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const inputId = signupId.trim();
    const inputPw = signupPw.trim();
    const inputName = signupName.trim();
    const inputEmail = signupEmail.trim();

    if (!inputId || !inputPw || !inputName || !inputEmail) {
      setErrorMessage(
        '모든 항목(학번, 비밀번호, 이름, 이메일)을 입력해 주세요. (Please fill in all fields: Student ID, Password, Full Name, Email.)'
      );
      return;
    }

    setIsLoading(true);

    try {
      // 1. Supabase 연동 시 중복 검사 및 INSERT
      if (isSupabaseConfigured) {
        const { data: existing, error: checkError } = await supabase
          .from('students')
          .select('student_id')
          .eq('student_id', inputId)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.warn('Supabase signup check warning:', checkError);
        }

        if (existing) {
          setIsLoading(false);
          setErrorMessage(
            '이미 등록된 학번입니다. (This Student ID is already registered. Please log in or use another ID.)'
          );
          return;
        }

        // Supabase students 테이블에 등록
        const { error: insertError } = await supabase.from('students').insert([
          {
            student_id: inputId,
            password: inputPw,
            name: inputName,
            email: inputEmail,
            course_class: '세종한국어 수강반',
            institution: '대진대학교 한국학과',
          },
        ]);

        if (insertError) {
          console.error('Supabase signup error:', insertError);
          throw new Error(insertError.message);
        }
      } else {
        // 로컬스토리지 중복 확인
        if (users.some((u) => u.studentId === inputId)) {
          setIsLoading(false);
          setErrorMessage(
            '이미 등록된 학번입니다. (This Student ID is already registered. Please log in or use another ID.)'
          );
          return;
        }
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
        setIsLoading(false);
      }, 600);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(`회원가입 오류: ${err.message || '다시 시도해 주세요.'}`);
    }
  };

  // 비밀번호 찾기: 1단계 본인 확인
  const handleForgotVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const inputId = forgotId.trim();
    const inputEmail = forgotEmail.trim();

    if (!inputId || !inputEmail) {
      setForgotError('학번과 이메일을 모두 입력해 주세요. (Please enter Student ID and Email.)');
      return;
    }

    setIsForgotLoading(true);

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('students')
          .select('student_id, name, email')
          .eq('student_id', inputId)
          .eq('email', inputEmail)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setIsForgotLoading(false);
          setForgotError('일치하는 학생 정보를 찾을 수 없습니다. (No matching student found.)');
          return;
        }

        setForgotVerifiedStudent({ studentId: data.student_id, name: data.name });
        setForgotStep(2);
        setIsForgotLoading(false);
        return;
      }

      // 로컬 스토리지 확인
      const matched = users.find((u) => u.studentId === inputId && u.email === inputEmail);
      if (matched) {
        setForgotVerifiedStudent({ studentId: matched.studentId, name: matched.name });
        setForgotStep(2);
        setIsForgotLoading(false);
        return;
      }

      setIsForgotLoading(false);
      setForgotError('일치하는 학생 정보를 찾을 수 없습니다. (No matching student found.)');
    } catch (err: any) {
      setIsForgotLoading(false);
      setForgotError(`확인 중 오류: ${err.message || '다시 시도해 주세요.'}`);
    }
  };

  // 비밀번호 찾기: 2단계 새 비밀번호 변경
  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (!forgotVerifiedStudent) return;

    const newPw = forgotNewPw.trim();
    const confirmPw = forgotNewPwConfirm.trim();

    if (!newPw) {
      setForgotError('새 비밀번호를 입력해 주세요. (Please enter new password.)');
      return;
    }

    if (newPw !== confirmPw) {
      setForgotError('비밀번호 확인이 일치하지 않습니다. (Passwords do not match.)');
      return;
    }

    setIsForgotLoading(true);

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('students')
          .update({ password: newPw })
          .eq('student_id', forgotVerifiedStudent.studentId);

        if (error) throw error;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.studentId === forgotVerifiedStudent.studentId ? { ...u, password: newPw } : u
        )
      );

      setForgotSuccess('비밀번호가 성공적으로 변경되었습니다! (Password reset successful!)');

      setTimeout(() => {
        setLoginId(forgotVerifiedStudent.studentId);
        setLoginPw(newPw);
        setIsForgotModalOpen(false);
        setForgotStep(1);
        setForgotId('');
        setForgotEmail('');
        setForgotNewPw('');
        setForgotNewPwConfirm('');
        setForgotVerifiedStudent(null);
        setForgotSuccess(null);
        setSuccessMessage('비밀번호가 재설정되었습니다. 로그인해 주세요!');
      }, 1200);
    } catch (err: any) {
      setForgotError(`비밀번호 변경 실패: ${err.message || '다시 시도해 주세요.'}`);
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleCloseForgotModal = () => {
    setIsForgotModalOpen(false);
    setForgotStep(1);
    setForgotId('');
    setForgotEmail('');
    setForgotNewPw('');
    setForgotNewPwConfirm('');
    setForgotVerifiedStudent(null);
    setForgotError(null);
    setForgotSuccess(null);
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
          <span>관리 (Teacher Settings)</span>
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

            {/* 비밀번호 찾기 링크 */}
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                onClick={() => {
                  setIsForgotModalOpen(true);
                  setForgotError(null);
                  setForgotSuccess(null);
                  setForgotStep(1);
                  setForgotId('');
                  setForgotEmail('');
                }}
                className="text-[11px] text-[#64748b] hover:text-[#0284c7] font-medium hover:underline cursor-pointer"
              >
                비밀번호를 잊으셨나요? (Forgot Password?)
              </button>
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

      {/* 비밀번호 찾기 / 재설정 모달 (Forgot Password Modal) */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-[420px] bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#e2e8f0] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#f0f9ff] text-[#0284c7] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                </div>
                <h3 className="text-base font-extrabold text-[#0c2340]">
                  비밀번호 재설정 (Reset Password)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseForgotModal}
                className="w-7 h-7 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] flex items-center justify-center text-[#64748b] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {forgotError && (
              <div className="mb-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-3 p-3 bg-green-50 text-green-700 text-xs rounded-xl border border-green-200">
                {forgotSuccess}
              </div>
            )}

            {/* 1단계: 학번 및 이메일 확인 */}
            {forgotStep === 1 && (
              <form onSubmit={handleForgotVerify} className="flex flex-col gap-3.5">
                <p className="text-xs text-[#64748b] leading-relaxed">
                  가입 시 등록했던 <strong>학번</strong>과 <strong>이메일</strong>을 입력하여 본인 확인을 진행해 주세요.
                  <br />
                  <span className="text-[11px] text-[#94a3b8]">
                    (Please enter your registered Student ID and Email.)
                  </span>
                </p>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-[#0c2340]">학번 (Student ID)</label>
                  <input
                    type="text"
                    required
                    value={forgotId}
                    onChange={(e) => setForgotId(e.target.value)}
                    placeholder="e.g. 20260001"
                    className="w-full px-3.5 py-2.5 bg-[#f8fafc] text-sm text-[#0c2340] rounded-xl border border-[#e2e8f0] focus:border-[#0c2340] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-[#0c2340]">등록된 이메일 (Email)</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="student@daejin.ac.kr"
                    className="w-full px-3.5 py-2.5 bg-[#f8fafc] text-sm text-[#0c2340] rounded-xl border border-[#e2e8f0] focus:border-[#0c2340] outline-none"
                  />
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleCloseForgotModal}
                    className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] text-[#64748b] text-xs font-bold hover:bg-[#e2e8f0] cursor-pointer"
                  >
                    취소 (Cancel)
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="flex-1 py-2.5 rounded-xl bg-[#0c2340] hover:bg-[#163a66] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-70"
                  >
                    {isForgotLoading ? '확인 중...' : '본인 확인 (Verify)'}
                  </button>
                </div>
              </form>
            )}

            {/* 2단계: 새 비밀번호 입력 */}
            {forgotStep === 2 && (
              <form onSubmit={handleForgotResetPassword} className="flex flex-col gap-3.5">
                <div className="p-3 bg-[#f0f9ff] rounded-xl border border-[#bae6fd] text-xs text-[#0369a1]">
                  <strong>{forgotVerifiedStudent?.name}</strong> 학생 확인이 완료되었습니다. 사용할 새 비밀번호를 입력해 주세요.
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-[#0c2340]">새 비밀번호 (New Password)</label>
                  <input
                    type="password"
                    required
                    value={forgotNewPw}
                    onChange={(e) => setForgotNewPw(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3.5 py-2.5 bg-[#f8fafc] text-sm text-[#0c2340] rounded-xl border border-[#e2e8f0] focus:border-[#0c2340] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-[#0c2340]">새 비밀번호 확인 (Confirm Password)</label>
                  <input
                    type="password"
                    required
                    value={forgotNewPwConfirm}
                    onChange={(e) => setForgotNewPwConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 bg-[#f8fafc] text-sm text-[#0c2340] rounded-xl border border-[#e2e8f0] focus:border-[#0c2340] outline-none"
                  />
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] text-[#64748b] text-xs font-bold hover:bg-[#e2e8f0] cursor-pointer"
                  >
                    이전 (Back)
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="flex-1 py-2.5 rounded-xl bg-[#0c2340] hover:bg-[#163a66] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-70"
                  >
                    {isForgotLoading ? '변경 중...' : '비밀번호 변경 (Save)'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


