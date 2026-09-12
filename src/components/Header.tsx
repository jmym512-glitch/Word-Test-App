import React from 'react';
import { LearnerProfile } from '../types';
import { DaejinLogo } from './DaejinLogo';

interface HeaderProps {
  currentTab: 'login' | 'unit-select' | 'test' | 'result' | 'vocab' | 'records';
  onNavigate: (tab: 'unit-select' | 'vocab' | 'records') => void;
  onOpenTeacherSettings: () => void;
  student: LearnerProfile | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  onOpenTeacherSettings,
  student,
  onLogout,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0] shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="h-16 max-w-[980px] mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div
          onClick={() => onNavigate('unit-select')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="transition-transform group-hover:scale-105 shrink-0">
            <DaejinLogo size={38} className="w-[38px] h-[38px]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[17px] font-extrabold text-[#0c2340] tracking-tight group-hover:text-[#0284c7] transition-colors leading-tight">
              대진대학교 단어 시험
            </span>
            <span className="text-[10px] text-[#64748b] tracking-wider uppercase font-semibold">
              세종한국어 평가 시스템
            </span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden sm:flex items-center gap-6">
          <button
            type="button"
            onClick={() => onNavigate('unit-select')}
            className={`text-[14px] font-bold transition-colors pb-0.5 border-b-2 cursor-pointer ${
              currentTab === 'unit-select' || currentTab === 'test' || currentTab === 'result'
                ? 'text-[#0c2340] border-[#0284c7]'
                : 'text-[#64748b] border-transparent hover:text-[#0c2340]'
            }`}
          >
            Test
          </button>
          <button
            type="button"
            onClick={() => onNavigate('vocab')}
            className={`text-[14px] font-bold transition-colors pb-0.5 border-b-2 cursor-pointer ${
              currentTab === 'vocab'
                ? 'text-[#0c2340] border-[#0284c7]'
                : 'text-[#64748b] border-transparent hover:text-[#0c2340]'
            }`}
          >
            Vocabulary
          </button>
          <button
            type="button"
            onClick={() => onNavigate('records')}
            className={`text-[14px] font-bold transition-colors pb-0.5 border-b-2 cursor-pointer ${
              currentTab === 'records'
                ? 'text-[#0c2340] border-[#0284c7]'
                : 'text-[#64748b] border-transparent hover:text-[#0c2340]'
            }`}
          >
            My Page
          </button>
        </nav>

        {/* Right Utility Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenTeacherSettings}
            title="관리 설정 (단원 등록 및 시트 연동)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#475569] hover:text-[#0c2340] hover:bg-[#f1f5f9] border border-transparent hover:border-[#e2e8f0] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
            <span className="text-xs font-bold hidden md:inline">관리</span>
          </button>

          {student ? (
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-full bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] transition-colors cursor-pointer"
              >
                <span className="text-xs font-bold text-[#0c2340] hidden sm:inline">
                  {student.name}
                </span>
                <div className="w-7 h-7 rounded-full bg-[#0c2340] flex items-center justify-center text-white text-xs font-bold">
                  {student.name.slice(0, 1)}
                </div>
              </button>

              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-[#e2e8f0] py-3 px-4 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50 text-left">
                <div className="text-xs font-bold text-[#0c2340]">{student.name} 수강생</div>
                {student.englishName && (
                  <div className="text-[11px] text-[#64748b]">{student.englishName}</div>
                )}
                <div className="text-[11px] text-[#0284c7] font-semibold mt-1">
                  {student.courseClass || student.gradeClass}
                </div>
                <div className="text-[10px] text-[#94a3b8] mb-2">
                  학번: {student.studentId} · {student.nationality}
                </div>
                <div className="border-t border-[#f1f5f9] pt-2">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full text-left text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 py-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">logout</span>
                    수강생 로그아웃
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#0c2340] flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

