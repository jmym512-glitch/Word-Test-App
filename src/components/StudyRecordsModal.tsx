import React, { useState } from 'react';
import { LearnerProfile, TestSubmission, CourseCategory } from '../types';

interface StudyRecordsModalProps {
  student: LearnerProfile;
  submissions: TestSubmission[];
  onSelectUnitToRetake: (unitId: string) => void;
  onUpdateCourseClass?: (newClass: CourseCategory) => void;
  onNavigateToTest?: () => void;
}

export const StudyRecordsModal: React.FC<StudyRecordsModalProps> = ({
  student,
  submissions,
  onSelectUnitToRetake,
  onUpdateCourseClass,
  onNavigateToTest,
}) => {
  const [classChangeToast, setClassChangeToast] = useState<string | null>(null);

  const handleSelectClass = (cls: CourseCategory) => {
    if (onUpdateCourseClass) {
      onUpdateCourseClass(cls);
      setClassChangeToast(`수강 분반이 [${cls}]로 변경되었습니다. 이제 [${cls}]의 시험과 단어가 제공됩니다.`);
      setTimeout(() => setClassChangeToast(null), 3500);
    }
  };

  return (
    <div className="w-full max-w-[840px] mx-auto px-4 sm:px-6 py-6 sm:py-10 select-none relative">
      {/* Class Change Feedback Toast */}
      {classChangeToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0c2340] text-white px-5 py-3 rounded-2xl shadow-xl border border-white/20 flex items-center gap-2.5 animate-bounce text-xs font-bold">
          <span className="material-symbols-outlined text-[18px] text-[#38bdf8]">check_circle</span>
          <span>{classChangeToast}</span>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f0f9ff] text-[#0284c7] text-xs font-bold self-start mb-1 border border-[#bae6fd]">
              <span className="material-symbols-outlined text-[14px]">badge</span>
              <span>대진대학교 학생 마이페이지 (My Page)</span>
            </div>
            <h1 className="text-[24px] font-extrabold text-[#0c2340] tracking-tight">
              {student.name} 수강생의 마이페이지 & 성적표
            </h1>
            <p className="text-[13px] text-[#64748b]">
              학번: <strong>{student.studentId}</strong> · 수강 분반: <strong>{student.courseClass || '1A 한국어'}</strong>
            </p>
          </div>

          {onNavigateToTest && (
            <button
              type="button"
              onClick={onNavigateToTest}
              className="h-11 px-5 rounded-xl bg-[#0c2340] hover:bg-[#163a66] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <span>시험 보러 가기</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          )}
        </div>

        {/* 내 수강 분반 선택 카드 (방식 3: 수강 분반별 시험 연동) */}
        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0284c7] text-[22px]">school</span>
              <h3 className="text-[16px] font-extrabold text-[#0c2340]">내 수강 분반 선택</h3>
            </div>
            <span className="text-[12px] font-bold text-[#0284c7] bg-[#f0f9ff] px-3 py-1 rounded-full border border-[#bae6fd]">
              현재 선택: {student.courseClass || '1A 한국어'}
            </span>
          </div>

          <p className="text-xs text-[#64748b]">
            본인이 수강하는 한국어 교육과정 분반을 선택하세요. 선택한 분반에 맞추어 단어 시험 목록과 어휘장이 자동으로 맞춤 제공됩니다.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {(['1A 한국어', '1B 한국어', '2A 한국어', '2B 한국어'] as CourseCategory[]).map((cls) => {
              const isSelected = (student.courseClass || '1A 한국어') === cls;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => handleSelectClass(cls)}
                  className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0c2340] text-white border-[#0c2340] shadow-md ring-2 ring-[#0284c7]/30 scale-[1.02]'
                      : 'bg-[#f8fafc] text-[#475569] border-[#e2e8f0] hover:bg-white hover:border-[#94a3b8]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold">{cls}</span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">
                        check_circle
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold ${isSelected ? 'text-[#bae6fd]' : 'text-[#64748b]'}`}>
                    {cls.startsWith('1') ? '초급 한국어 과정' : '중급 한국어 과정'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm flex flex-col">
            <span className="text-[11px] font-bold text-[#64748b]">총 응시 횟수</span>
            <span className="text-[26px] font-black text-[#0c2340] mt-1">
              {submissions.length}회
            </span>
            <span className="text-[11px] text-[#15803d] font-semibold mt-0.5">정상 제출 완료</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm flex flex-col">
            <span className="text-[11px] font-bold text-[#64748b]">최고 득점</span>
            <span className="text-[26px] font-black text-[#15803d] mt-1">
              {submissions.length > 0
                ? Math.max(...submissions.map((s) => s.score))
                : '- '}
              {submissions.length > 0 && '점'}
            </span>
            <span className="text-[11px] text-[#64748b] mt-0.5">세종한국어 평가</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm flex flex-col">
            <span className="text-[11px] font-bold text-[#64748b]">구글 시트 연동 상태</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse" />
              <span className="text-[18px] font-bold text-[#15803d]">실시간 전송 중</span>
            </div>
            <span className="text-[11px] text-[#64748b] mt-0.5">교수자 확인 완료</span>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm flex flex-col gap-4">
          <h2 className="text-[16px] font-bold text-[#0c2340]">제출된 세종한국어 성적표 목록</h2>

          {submissions.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-[#64748b] bg-[#f8fafc] rounded-xl flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[32px] text-[#94a3b8]">
                assignment_late
              </span>
              <span>이번 세션에서 아직 제출된 시험이 없습니다. 단원 시험을 시작해 보세요!</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-[#0c2340]">{sub.unitTitle}</span>
                      <span className="bg-[#dcfce7] text-[#15803d] text-[11px] font-bold px-2 py-0.5 rounded-full">
                        {sub.score}점
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-[#64748b] mt-1">
                      <span>{sub.timestamp}</span>
                      <span>·</span>
                      <span>소요시간: {sub.timeSpentSeconds}초</span>
                      <span>·</span>
                      <span>
                        정답: {sub.correctCount}/{sub.totalCount}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => onSelectUnitToRetake(sub.unitId)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#e2e8f0] text-xs font-bold text-[#0c2340] border border-[#e2e8f0] shadow-sm transition-colors cursor-pointer"
                    >
                      다시 응시
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

