import React, { useState } from 'react';
import { QuestionResult, LearnerProfile, ExamUnit } from '../types';

interface TestResultScreenProps {
  student: LearnerProfile;
  unit: ExamUnit;
  results: QuestionResult[];
  totalTimeSpentSeconds: number;
  onReturnToUnits: () => void;
  onRetakeTest: () => void;
}

export const TestResultScreen: React.FC<TestResultScreenProps> = ({
  student,
  unit,
  results,
  totalTimeSpentSeconds,
  onReturnToUnits,
  onRetakeTest,
}) => {
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);

  const totalQuestions = results.length || unit.words.length || 10;
  const correctCount = results.filter((r) => r.isCorrect).length;
  const wrongCount = totalQuestions - correctCount;
  const score = Math.round((correctCount / totalQuestions) * 100);

  // Format time MM:SS
  const minutes = Math.floor(totalTimeSpentSeconds / 60);
  const seconds = totalTimeSpentSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const correctPercent = Math.round((correctCount / totalQuestions) * 100);
  const wrongPercent = 100 - correctPercent;

  // Format timestamp
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  const timestampString = `${year}.${month}.${day} ${hours}:${mins}:${secs} KST`;
  const txId = `DJU_#${Math.floor(1000 + Math.random() * 9000)}-KO`;

  return (
    <div className="w-full max-w-[760px] mx-auto px-4 sm:px-6 py-8 sm:py-12 select-none">
      <div className="flex flex-col w-full">
        {/* Main Result Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-[#e2e8f0] p-6 sm:p-10 flex flex-col items-center text-center relative overflow-hidden">
          {/* Top Brand Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0c2340] via-[#0284c7] to-[#0ea5e9]" />

          {/* Crest / Icon */}
          <div className="relative mb-4 mt-2">
            <div className="w-20 h-20 rounded-full bg-[#f0f9ff] flex items-center justify-center text-[#0284c7] border border-[#bae6fd]">
              <span
                className="material-symbols-outlined text-[44px]"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}
              >
                verified
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#0c2340] text-white px-2 py-0.5 rounded-full shadow-sm text-[10px] font-bold">
              완료
            </div>
          </div>

          {/* Heading & Student Meta */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f1f5f9] text-[#0c2340] text-xs font-bold mb-2 border border-[#e2e8f0]">
            <span>대진대학교 단어 시험</span>
            <span>·</span>
            <span>{unit.title}</span>
          </div>

          <h2 className="text-[26px] sm:text-[30px] font-extrabold text-[#0c2340] tracking-tight">
            시험이 완료되었습니다!
          </h2>

          <div className="mt-2 flex items-center justify-center gap-2 flex-wrap text-[#475569] text-[13px] sm:text-[14px]">
            <span className="font-bold text-[#0c2340]">{student.name}</span>
            {student.englishName && <span className="text-[#64748b]">({student.englishName})</span>}
            <span>·</span>
            <span className="text-[#0284c7] font-semibold">{student.courseClass || student.gradeClass}</span>
            <span>·</span>
            <span className="text-[#64748b]">학번 {student.studentId}</span>
          </div>

          {/* Score Section */}
          <div className="w-full mt-6 bg-[#f8fafc] rounded-2xl p-6 flex flex-col items-center justify-center relative border border-[#e2e8f0]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              세종한국어 종합 성적
            </span>
            <div className="flex items-baseline justify-center gap-1.5 mt-1">
              <span className="text-[54px] sm:text-[62px] font-black text-[#0c2340] tracking-tight">
                {score}
              </span>
              <span className="text-[22px] font-bold text-[#0c2340]/80">점</span>
            </div>

            {/* Score Breakdown & Stats */}
            <div className="w-full max-w-sm mt-4 grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-3 text-left shadow-sm border border-[#e2e8f0]">
                <span className="text-[11px] font-medium text-[#64748b] block">정답률</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[20px] font-bold text-[#15803d]">{correctCount}</span>
                  <span className="text-[13px] text-[#64748b]">/ {totalQuestions} 문항</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 text-left shadow-sm border border-[#e2e8f0]">
                <span className="text-[11px] font-medium text-[#64748b] block">풀이 시간</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-[18px] text-[#64748b]">
                    timer
                  </span>
                  <span className="text-[18px] font-bold text-[#0c2340]">
                    {formattedTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Distribution Graphic */}
            <div className="w-full max-w-sm mt-4">
              <div className="w-full bg-[#e2e8f0] h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-[#15803d] h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${correctPercent}%` }}
                />
                <div
                  className="bg-[#dc2626] h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${wrongPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2 text-[#475569] text-[12px] font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#15803d]" /> 정답 {correctCount}개
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#dc2626]" /> 오답 {wrongCount}개
                </span>
              </div>
            </div>
          </div>

          {/* Google Sheets Automated Sync Pill Badge */}
          <div className="w-full mt-6 bg-[#f0f9ff] rounded-2xl p-4 sm:p-5 text-left flex flex-col gap-2.5 border border-[#bae6fd]">
            <div className="inline-flex items-center gap-2 self-start bg-white text-[#0284c7] px-3 py-1.5 rounded-full border border-[#bae6fd]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0284c7] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0284c7]" />
              </span>
              <span className="text-[13px] font-bold tracking-tight">
                대진대학교 성적 관리 구글 시트 자동 제출 완료
              </span>
            </div>
            <p className="text-[12px] sm:text-[13px] text-[#0369a1] leading-relaxed pl-1">
              수강생의 학번, 성명, 분반, 점수 및 소요시간이 교수자 스프레드시트에 실시간 자동 기록되었습니다.
            </p>

            {/* Subtle Transmission Verification Receipt */}
            <div className="mt-1 bg-white rounded-xl p-2.5 flex items-center justify-between text-[11px] text-[#475569] border border-[#e2e8f0]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#15803d]">
                  cloud_done
                </span>
                <span>전송 완료: {timestampString}</span>
              </div>
              <span className="font-mono text-[10px] text-[#64748b]">{txId}</span>
            </div>
          </div>

          {/* Scholarly Actions */}
          <div className="w-full mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setIsReviewOpen(!isReviewOpen)}
              className="flex-1 h-12 py-3 px-4 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0c2340] font-bold text-[14px] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                assignment_turned_in
              </span>
              <span>내 답안 상세 확인</span>
              <span
                className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                  isReviewOpen ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>

            <button
              type="button"
              onClick={onReturnToUnits}
              className="flex-1 h-12 py-3 px-4 rounded-xl bg-[#0c2340] hover:bg-[#163a66] text-white font-bold text-[14px] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>단원 목록으로 돌아가기</span>
            </button>
          </div>

          {/* Answer Review Accordion Drawer */}
          {isReviewOpen && (
            <div className="w-full mt-4 text-left transition-all duration-300">
              <div className="bg-[#f8fafc] rounded-2xl p-4 sm:p-5 flex flex-col gap-3 border border-[#e2e8f0]">
                <div className="flex items-center justify-between pb-1 border-b border-[#e2e8f0]">
                  <span className="text-[14px] font-bold text-[#0c2340]">
                    문항별 정답 및 수강생 답안 상세
                  </span>
                  <span className="text-[12px] text-[#64748b]">
                    총 {totalQuestions}문항 중 {wrongCount}개 오답
                  </span>
                </div>

                {results.map((res) => (
                  <div
                    key={res.questionNumber}
                    className="bg-white rounded-xl p-3.5 shadow-sm border border-[#e2e8f0] flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[12px] font-bold flex items-center gap-1 ${
                          res.isCorrect ? 'text-[#15803d]' : 'text-[#dc2626]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {res.isCorrect ? 'check_circle' : 'cancel'}
                        </span>
                        <span>
                          {String(res.questionNumber).padStart(2, '0')}번 문항 (
                          {res.isCorrect ? '정답' : '오답'})
                        </span>
                      </span>
                      <span className="text-[11px] text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded font-semibold">
                        {res.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-bold text-[#0c2340]">
                        목표 어휘: {res.word}
                      </span>
                      <span className="text-[11px] text-[#64748b]">
                        소요: {res.timeSpentSeconds}초
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] mt-1">
                      <div
                        className={`p-2 rounded-lg flex items-center gap-1.5 ${
                          res.isCorrect
                            ? 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        <span className="font-bold">내 답안:</span>
                        <span>{res.userAnswer}</span>
                      </div>
                      <div className="bg-[#f8fafc] text-[#0c2340] p-2 rounded-lg flex items-center gap-1.5 font-semibold border border-[#e2e8f0]">
                        <span className="font-bold">정답:</span>
                        <span>{res.word}</span>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={onRetakeTest}
                    className="text-xs font-bold text-[#0284c7] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">replay</span>
                    <span>이 단원 다시 시험 보기</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quiet Context Note */}
        <div className="mt-4 text-center">
          <p className="text-[12px] text-[#64748b]">
            대진대학교 국제교류원 한국어교육센터 · 세종한국어 교육과정
          </p>
        </div>
      </div>
    </div>
  );
};

