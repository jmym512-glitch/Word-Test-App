import React from 'react';
import { LearnerProfile, TestSubmission } from '../types';

interface StudyRecordsModalProps {
  student: LearnerProfile;
  submissions: TestSubmission[];
  onSelectUnitToRetake: (unitId: string) => void;
}

export const StudyRecordsModal: React.FC<StudyRecordsModalProps> = ({
  student,
  submissions,
  onSelectUnitToRetake,
}) => {
  return (
    <div className="w-full max-w-[840px] mx-auto px-4 sm:px-6 py-6 sm:py-10 select-none">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f0f9ff] text-[#0284c7] text-xs font-bold self-start mb-1 border border-[#bae6fd]">
            <span className="material-symbols-outlined text-[14px]">history_edu</span>
            <span>대진대학교 학업 성취도 평가</span>
          </div>
          <h1 className="text-[24px] font-extrabold text-[#0c2340] tracking-tight">
            {student.name} 수강생의 시험 이력
          </h1>
          <p className="text-[13px] text-[#64748b]">
            세종한국어 단어 시험 응시 결과와 대진대학교 구글 시트 자동 제출 내역입니다.
          </p>
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

